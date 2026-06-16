import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { DeviceStatus, LabelType, Prisma, UploadStatus, UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../auth/simple-auth.guard';
import { PrismaService } from '../prisma.service';

@Controller('mobile')
@Roles(UserRole.COMPANY_ADMIN, UserRole.OUTLET_USER)
export class MobileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('bootstrap')
  async bootstrap(@Req() request: AuthenticatedRequest) {
    const companyId = this.requiredCompanyId(request);
    const allowedOutletIds = await this.allowedOutletIds(request, companyId);
    const outletWhere = {
      companyId,
      status: 'ACTIVE' as const,
      ...(allowedOutletIds ? { id: { in: allowedOutletIds } } : {}),
    };

    const [company, outlets, categories, products] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, code: true, maxPrinterConnections: true } }),
      this.prisma.outlet.findMany({ where: outletWhere, orderBy: { name: 'asc' } }),
      this.prisma.productCategory.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
      this.prisma.product.findMany({
        where: { companyId, active: true },
        include: { category: true },
        orderBy: { productCode: 'asc' },
      }),
    ]);

    const outletIdSet = new Set(outlets.map((outlet) => outlet.id));
    const outletProducts = await this.prisma.outletProduct.findMany({
      where: { outletId: { in: [...outletIdSet] } },
    });
    const productIdsVisibleInAllowedOutlets = new Set(outletProducts.filter((row) => row.active).map((row) => row.productId));
    const visibleProducts = products.filter((product) => {
      if (product.source === 'outlet' && product.outletId && !outletIdSet.has(product.outletId)) return false;
      if (allowedOutletIds && !productIdsVisibleInAllowedOutlets.has(product.id)) return false;
      return true;
    });
    const categoryIds = new Set(visibleProducts.map((product) => product.categoryId));

    return {
      serverTime: new Date().toISOString(),
      user: request.user,
      company,
      outlets,
      categories: categories.filter((category) => categoryIds.has(category.id)),
      products: visibleProducts,
      outletProducts: outletProducts.filter((row) => productIdsVisibleInAllowedOutlets.has(row.productId)),
    };
  }

  @Post('devices/printer')
  async registerPrinter(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      deviceIdentifier?: string;
      deviceName?: string;
      appVersion?: string;
      outletId?: string;
      printerName?: string;
      printerMacAddress?: string;
      printerBluetoothId?: string;
    },
  ) {
    const companyId = this.requiredCompanyId(request);
    const deviceIdentifier = this.boundedText(body.deviceIdentifier, 'Device identifier', 8, 160);
    const deviceName = this.boundedText(body.deviceName ?? 'Android device', 'Device name', 2, 120);
    const appVersion = this.boundedText(body.appVersion ?? 'unknown', 'App version', 1, 40);
    const printerName = this.boundedText(body.printerName ?? 'Bluetooth Printer', 'Printer name', 1, 120);
    const printerMacAddress = this.optionalText(body.printerMacAddress, 1, 80);
    const printerBluetoothId = this.optionalText(body.printerBluetoothId, 1, 120) ?? printerMacAddress;
    if (!printerMacAddress && !printerBluetoothId) {
      throw new BadRequestException('Printer MAC address or Bluetooth ID is required.');
    }

    const outletId = await this.validMobileOutletId(request, companyId, body.outletId);
    await this.assertPrinterQuota(companyId, deviceIdentifier, printerMacAddress ?? printerBluetoothId);

    const existing = await this.prisma.device.findUnique({ where: { deviceIdentifier } });
    if (existing && existing.companyId !== companyId) {
      throw new ForbiddenException('This device is already registered to another company.');
    }

    const device = await this.prisma.device.upsert({
      where: { deviceIdentifier },
      create: {
        companyId,
        outletId,
        deviceIdentifier,
        deviceName,
        appVersion,
        printerName,
        printerMacAddress,
        printerBluetoothId,
        lastPrinterConnectedAt: new Date(),
        lastSyncedAt: new Date(),
        status: DeviceStatus.ACTIVE,
      },
      update: {
        outletId,
        deviceName,
        appVersion,
        printerName,
        printerMacAddress,
        printerBluetoothId,
        lastPrinterConnectedAt: new Date(),
        lastSyncedAt: new Date(),
        status: DeviceStatus.ACTIVE,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId: request.user?.sub,
        action: 'PRINTER_CHANGED',
        recordType: 'Device',
        recordId: device.id,
        risk: 'medium',
      },
    });

    return { data: device, message: 'Printer synced' };
  }

  @Delete('devices/printer/:deviceIdentifier')
  async removePrinter(@Req() request: AuthenticatedRequest, @Param('deviceIdentifier') deviceIdentifier: string) {
    const companyId = this.requiredCompanyId(request);
    const device = await this.prisma.device.findFirst({ where: { companyId, deviceIdentifier } });
    if (!device) {
      return { message: 'Printer already removed' };
    }

    const updated = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        printerName: null,
        printerMacAddress: null,
        printerBluetoothId: null,
        lastPrinterConnectedAt: null,
        lastSyncedAt: new Date(),
        status: DeviceStatus.NEEDS_SETUP,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId: request.user?.sub,
        action: 'PRINTER_REMOVED',
        recordType: 'Device',
        recordId: device.id,
        risk: 'medium',
      },
    });

    return { data: updated, message: 'Printer removed' };
  }

  @Post('print-jobs')
  async uploadPrintJobs(@Req() request: AuthenticatedRequest, @Body() body: { jobs?: Array<Record<string, unknown>> }) {
    const companyId = this.requiredCompanyId(request);
    const jobs = Array.isArray(body.jobs) ? body.jobs : [];
    const allowedOutletIds = await this.allowedOutletIds(request, companyId);
    let uploaded = 0;

    for (const job of jobs) {
      const outletId = this.boundedText(job.outletId, 'Outlet', 2, 80);
      if (allowedOutletIds && !allowedOutletIds.includes(outletId)) {
        continue;
      }
      const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, companyId } });
      if (!outlet) continue;
      const requestedProductId = this.optionalText(job.productId, 2, 80);
      const product = requestedProductId
        ? await this.prisma.product.findFirst({ where: { id: requestedProductId, companyId }, select: { id: true } })
        : null;

      try {
        await this.prisma.printJob.create({
          data: {
            clientJobId: this.boundedText(job.id, 'Print job id', 2, 160),
            companyId,
            outletId,
            productId: product?.id ?? null,
            productCodeSnapshot: this.boundedText(job.productCode, 'Product code', 1, 80),
            productNameSnapshot: this.boundedText(job.productNameEn, 'Product name', 1, 180),
            labelType: this.toLabelType(job.labelType),
            labelSize: this.boundedText(job.labelSize ?? '60x40', 'Label size', 3, 40),
            quantity: this.boundedInt(job.quantity, 'Quantity', 1, 999),
            printerName: this.optionalText(job.printerName, 1, 120),
            printerMacAddress: this.optionalText(job.printerAddress, 1, 80),
            printedAt: new Date(this.boundedText(job.printedAt, 'Printed at', 10, 80)),
            uploadStatus: UploadStatus.UPLOADED,
          },
        });
        uploaded += 1;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    return { uploaded, message: `${uploaded} print job${uploaded === 1 ? '' : 's'} uploaded` };
  }

  private requiredCompanyId(request: AuthenticatedRequest) {
    if (!request.user?.companyId) throw new ForbiddenException('Mobile user must belong to a company.');
    return request.user.companyId;
  }

  private async allowedOutletIds(request: AuthenticatedRequest, companyId: string) {
    if (request.user?.role !== UserRole.OUTLET_USER) return undefined;
    const access = await this.prisma.userOutletAccess.findMany({
      where: { userId: request.user.sub, outlet: { companyId, status: 'ACTIVE' } },
      select: { outletId: true },
    });
    return access.map((row) => row.outletId);
  }

  private async validMobileOutletId(request: AuthenticatedRequest, companyId: string, outletId?: string) {
    const allowedOutletIds = await this.allowedOutletIds(request, companyId);
    if (!outletId) return allowedOutletIds?.[0] ?? null;
    const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, companyId, status: 'ACTIVE' } });
    if (!outlet) throw new BadRequestException('Outlet is invalid.');
    if (allowedOutletIds && !allowedOutletIds.includes(outlet.id)) {
      throw new ForbiddenException('User cannot register printers for this outlet.');
    }
    return outlet.id;
  }

  private async assertPrinterQuota(companyId: string, deviceIdentifier: string, nextPrinterKey?: string | null) {
    if (!nextPrinterKey) return;
    const [company, devices] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId }, select: { maxPrinterConnections: true } }),
      this.prisma.device.findMany({ where: { companyId, status: { not: DeviceStatus.INACTIVE } } }),
    ]);
    if (company?.maxPrinterConnections === null) return;

    const printerKeys = new Set(
      devices
        .filter((device) => device.deviceIdentifier !== deviceIdentifier)
        .map((device) => device.printerMacAddress ?? device.printerBluetoothId ?? device.printerName)
        .filter((value): value is string => Boolean(value?.trim())),
    );
    printerKeys.add(nextPrinterKey);
    if (printerKeys.size > (company?.maxPrinterConnections ?? 0)) {
      throw new ForbiddenException(`Printer connection limit reached (${company?.maxPrinterConnections ?? 0}).`);
    }
  }

  private boundedText(value: unknown, label: string, min: number, max: number) {
    if (typeof value !== 'string') throw new BadRequestException(`${label} is required`);
    const trimmed = value.trim();
    if (trimmed.length < min || trimmed.length > max) throw new BadRequestException(`${label} must be ${min}-${max} characters`);
    return trimmed;
  }

  private optionalText(value: unknown, min: number, max: number) {
    if (value === undefined || value === null || value === '') return null;
    return this.boundedText(value, 'Value', min, max);
  }

  private boundedInt(value: unknown, label: string, min: number, max: number) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) throw new BadRequestException(`${label} must be an integer from ${min} to ${max}`);
    return number;
  }

  private toLabelType(value: unknown) {
    if (value === 'timestamp') return LabelType.TIMESTAMP;
    if (value === 'compact-product') return LabelType.COMPACT_PRODUCT;
    return LabelType.PRODUCT;
  }
}
