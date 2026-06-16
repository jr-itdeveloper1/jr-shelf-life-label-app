import { BadRequestException, Body, Controller, ForbiddenException, Get, Header, NotFoundException, Param, Patch, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OutletStatus, Prisma, ProductStatus, UserRole, UserStatus } from '@prisma/client';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import JSZip = require('jszip');
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../auth/simple-auth.guard';
import { PrismaService } from '../prisma.service';
import { ReportingService } from '../services/reporting.service';

type ImportFile = {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size: number;
};

type ProductImportRowStatus = 'Ready' | 'Warning' | 'Blocked';

type ParsedProductImportRow = {
  row: number;
  type: 'Product';
  code: string;
  nameEn: string;
  nameZh: string;
  imageUri?: string;
  storageMethodEn: string;
  storageMethodZh: string;
  daysToExpire: number;
  hoursToExpire: number;
  status: ProductImportRowStatus;
  message: string;
};

type ProductImportCategory = {
  id: string;
  name: string;
  codePrefix: string;
  status: ProductStatus;
};

@Controller('company')
@Roles('COMPANY_ADMIN')
export class CompanyController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reporting: ReportingService,
  ) {}

  private async companyId(request?: AuthenticatedRequest) {
    if (request?.user?.companyId) {
      return request.user.companyId;
    }
    return this.reporting.getDefaultCompanyId();
  }

  private isOutletUser(request: AuthenticatedRequest) {
    return request.user?.role === UserRole.OUTLET_USER;
  }

  private async allowedOutletIds(request: AuthenticatedRequest, companyId: string) {
    if (!this.isOutletUser(request)) return undefined;
    const access = await this.prisma.userOutletAccess.findMany({
      where: { userId: request.user?.sub, outlet: { companyId, status: 'ACTIVE' } },
      select: { outletId: true },
    });
    return access.map((row) => row.outletId);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.OUTLET_USER)
  @Get('dashboard')
  async dashboard(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    const allowedOutletIds = await this.allowedOutletIds(request, companyId);
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    const [outlets, products, devices, totalPrintJobs, printedToday, monthlyTotals, missingImages, failedUploads, printerChanges] = await Promise.all([
      this.prisma.outlet.count({ where: { companyId, ...(allowedOutletIds ? { id: { in: allowedOutletIds } } : {}) } }),
      this.prisma.product.count({ where: { companyId, active: true } }),
      this.prisma.device.count({ where: { companyId, status: { not: 'INACTIVE' }, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) } }),
      this.prisma.printJob.aggregate({ where: { companyId, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) }, _sum: { quantity: true } }),
      this.prisma.printJob.aggregate({
        where: { companyId, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}), printedAt: { gte: todayStart, lt: todayEnd } },
        _sum: { quantity: true },
      }),
      this.reporting.monthlyStickerTotals(companyId, month, allowedOutletIds),
      this.prisma.product.count({ where: { companyId, active: true, imageStatus: 'missing' } }),
      this.prisma.printJob.count({ where: { companyId, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}), uploadStatus: 'FAILED' } }),
      this.prisma.auditLog.count({
        where: {
          companyId,
          action: 'PRINTER_CHANGED',
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      }),
    ]);

    return {
      metrics: {
        outlets,
        products,
        printedToday: printedToday._sum.quantity ?? 0,
        knownPrinters: devices,
        totalStickers: totalPrintJobs._sum.quantity ?? 0,
      },
      monthlyTotals,
      workQueue: [
        { label: 'Products missing images', status: `${missingImages} item${missingImages === 1 ? '' : 's'}`, kind: missingImages > 0 ? 'warn' : 'ok' },
        { label: 'Failed print upload retries', status: `${failedUploads} job${failedUploads === 1 ? '' : 's'}`, kind: failedUploads > 0 ? 'danger' : 'ok' },
        { label: 'Printer registry changes this month', status: `${printerChanges} change${printerChanges === 1 ? '' : 's'}`, kind: printerChanges > 0 ? 'warn' : 'ok' },
      ],
    };
  }

  @Get('outlets')
  async outlets(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    return this.prisma.outlet.findMany({
      where: { companyId },
      include: { _count: { select: { outletProducts: true, devices: true, printJobs: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('outlets')
  async createOutlet(@Req() request: AuthenticatedRequest, @Body() body: { name: string; code: string }) {
    const companyId = await this.companyId(request);
    const code = this.codeText(body.code, 'Outlet code', 2, 24);
    try {
      const outlet = await this.prisma.outlet.create({
        data: {
          companyId,
          name: this.boundedText(body.name, 'Outlet name', 2, 120),
          code,
          shortCode: code,
        },
      });
      await this.ensureOutletProducts(companyId, [outlet.id]);

      await this.prisma.auditLog.create({
        data: {
          companyId,
          actorId: request.user?.sub,
          action: 'OUTLET_CREATED',
          recordType: 'Outlet',
          recordId: outlet.id,
          risk: 'low',
        },
      });

      return {
        data: outlet,
        message: 'Outlet created',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Outlet code must be unique within the company.');
      }
      throw error;
    }
  }

  @Post('users')
  async createUser(
    @Req() request: AuthenticatedRequest,
    @Body() body: { name: string; email: string; role: UserRole; status?: UserStatus; outletIds?: string[]; password?: string },
  ) {
    const companyId = await this.companyId(request);
    if (body.role !== UserRole.COMPANY_ADMIN && body.role !== UserRole.OUTLET_USER) throw new BadRequestException('Invalid company user role');
    const outletIds = await this.validOutletIds(companyId, body.outletIds ?? []);
    if (body.role === UserRole.OUTLET_USER && outletIds.length === 0) throw new BadRequestException('Outlet User requires at least one outlet.');
    const { hashPassword } = await import('../auth/password');
    const passwordHash = await hashPassword(body.password?.trim() || 'ChangeMe123!');

    try {
      const user = await this.prisma.user.create({
        data: {
          companyId,
          name: this.boundedText(body.name, 'Name', 2, 120),
          email: this.requiredEmail(body.email),
          passwordHash,
          role: body.role,
          status: body.status ?? UserStatus.ACTIVE,
          outletAccess: { create: outletIds.map((outletId) => ({ outletId })) },
        },
        include: { outletAccess: { include: { outlet: true } } },
      });
      await this.prisma.auditLog.create({
        data: { companyId, actorId: request.user?.sub, action: 'USER_CREATED', recordType: 'User', recordId: user.id, risk: 'medium' },
      });
      return { data: user, message: 'User created' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new BadRequestException('Email is already used by another user.');
      throw error;
    }
  }

  @Get('outlets/:outletId')
  async outlet(@Req() request: AuthenticatedRequest, @Param('outletId') outletId: string) {
    const companyId = await this.companyId(request);
    const outlet = await this.prisma.outlet.findFirst({
      where: { id: outletId, companyId },
      include: { devices: true },
    });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    const printJobs = await this.prisma.printJob.findMany({
      where: { outletId, companyId },
      orderBy: { printedAt: 'desc' },
      take: 20,
      include: { device: true },
    });
    return { outlet, printJobs };
  }

  @Patch('outlets/:outletId')
  async updateOutlet(
    @Req() request: AuthenticatedRequest,
    @Param('outletId') outletId: string,
    @Body()
    body: {
      name?: string;
      code?: string;
      status?: OutletStatus;
      updatedAt?: string;
    },
  ) {
    const companyId = await this.companyId(request);
    const existing = await this.prisma.outlet.findFirst({ where: { id: outletId, companyId } });
    if (!existing) {
      throw new NotFoundException('Outlet not found');
    }

    const data: Prisma.OutletUpdateInput = {};
    if (body.name !== undefined) data.name = this.boundedText(body.name, 'Outlet name', 2, 120);
    if (body.code !== undefined) {
      const code = this.codeText(body.code, 'Outlet code', 2, 24);
      data.code = code;
      data.shortCode = code;
    }
    if (body.status !== undefined) {
      if (!Object.values(OutletStatus).includes(body.status)) {
        throw new BadRequestException('Invalid outlet status');
      }
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No outlet fields to update');
    }

    try {
      const updated = await this.prisma.outlet.update({
        where: { id: outletId },
        data,
      });

      await this.prisma.auditLog.create({
        data: {
          companyId,
          actorId: request.user?.sub,
          action: existing.status !== updated.status ? 'OUTLET_STATUS_CHANGED' : 'OUTLET_UPDATED',
          recordType: 'Outlet',
          recordId: outletId,
          risk: updated.status === OutletStatus.DISABLED ? 'medium' : 'low',
        },
      });

      return {
        data: updated,
        message: 'Outlet saved',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Outlet code must be unique within the company.');
      }
      throw error;
    }
  }

  @Get('users')
  async users(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    return this.prisma.user.findMany({
      where: { companyId },
      include: { outletAccess: { include: { outlet: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Get('users/:userId')
  async user(@Req() request: AuthenticatedRequest, @Param('userId') userId: string) {
    const companyId = await this.companyId(request);
    return this.prisma.user.findFirst({
      where: { id: userId, companyId },
      include: { outletAccess: { include: { outlet: true } } },
    });
  }

  @Patch('users/:userId')
  async updateUser(
    @Req() request: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() body: { name?: string; email?: string; role?: UserRole; status?: UserStatus; outletIds?: string[] },
  ) {
    const companyId = await this.companyId(request);
    const existing = await this.prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.UserUpdateInput = {};
    if (body.name !== undefined) data.name = this.requiredText(body.name, 'Name');
    if (body.email !== undefined) data.email = this.requiredEmail(body.email);
    if (body.role !== undefined) {
      if (body.role !== UserRole.COMPANY_ADMIN && body.role !== UserRole.OUTLET_USER) throw new BadRequestException('Invalid company user role');
      data.role = body.role;
    }
    if (body.status !== undefined) {
      if (!Object.values(UserStatus).includes(body.status)) throw new BadRequestException('Invalid user status');
      data.status = body.status;
    }
    const outletIds = body.outletIds ? await this.validOutletIds(companyId, body.outletIds) : undefined;
    const nextRole = body.role ?? existing.role;
    if (nextRole === UserRole.OUTLET_USER && outletIds !== undefined && outletIds.length === 0) throw new BadRequestException('Outlet User requires at least one outlet.');

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const saved = await tx.user.update({ where: { id: userId }, data });
        if (outletIds !== undefined) {
          await tx.userOutletAccess.deleteMany({ where: { userId } });
          if (outletIds.length > 0) {
            await tx.userOutletAccess.createMany({ data: outletIds.map((outletId) => ({ userId, outletId })) });
          }
        }
        return saved;
      });
      await this.prisma.auditLog.create({
        data: {
          companyId,
          actorId: request.user?.sub,
          action: existing.status !== updated.status ? 'USER_STATUS_CHANGED' : 'USER_UPDATED',
          recordType: 'User',
          recordId: userId,
          risk: updated.status === UserStatus.DISABLED ? 'medium' : 'low',
        },
      });
      return { data: updated, message: 'User saved' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Email is already used by another user.');
      }
      throw error;
    }
  }

  @Get('products')
  async products(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    return this.prisma.product.findMany({
      where: { companyId },
      include: { category: true },
      orderBy: { productCode: 'asc' },
    });
  }

  @Get('products/:productId')
  async product(@Req() request: AuthenticatedRequest, @Param('productId') productId: string) {
    const companyId = await this.companyId(request);
    return this.prisma.product.findFirst({
      where: { id: productId, companyId },
      include: { category: true },
    });
  }

  @Patch('products/:productId')
  async updateProduct(@Req() request: AuthenticatedRequest, @Param('productId') productId: string, @Body() body: Record<string, unknown>) {
    const companyId = await this.companyId(request);
    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const data = this.productPayload(body);
    if (body.categoryId !== undefined) {
      const categoryId = this.boundedText(body.categoryId, 'Category', 2, 80);
      const assignment = await this.productCategoryAssignment(companyId, categoryId);
      data.categoryId = categoryId;
      data.source = assignment.source;
      data.outletId = assignment.outletId;
      if (categoryId !== product.categoryId) {
        data.productCode = await this.nextProductCode(companyId, categoryId, productId);
      }
    }
    const updated = await this.prisma.product.update({ where: { id: productId }, data });
    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId: request.user?.sub,
        action: product.active !== updated.active ? 'PRODUCT_STATUS_CHANGED' : 'PRODUCT_UPDATED',
        recordType: 'Product',
        recordId: productId,
        risk: updated.active ? 'low' : 'medium',
      },
    });
    return { data: updated, message: 'Product saved' };
  }

  @Post('products')
  async createProduct(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    const companyId = await this.companyId(request);
    const categoryId = this.boundedText(body.categoryId, 'Category', 2, 80);
    const assignment = await this.productCategoryAssignment(companyId, categoryId);
    const data = this.productPayload(body);
    const productCode = await this.nextProductCode(companyId, categoryId);
    try {
      const product = await this.prisma.product.create({
        data: {
          companyId,
          categoryId,
          productCode,
          source: assignment.source,
          outletId: assignment.outletId,
          ...data,
        } as Prisma.ProductUncheckedCreateInput,
      });
      const activeOutlets = await this.prisma.outlet.findMany({
        where: { companyId, status: OutletStatus.ACTIVE },
        select: { id: true },
      });
      await this.ensureOutletProducts(companyId, activeOutlets.map((outlet) => outlet.id));
      await this.prisma.auditLog.create({
        data: { companyId, actorId: request.user?.sub, action: 'PRODUCT_CREATED', recordType: 'Product', recordId: product.id, risk: 'low' },
      });
      return { data: product, message: 'Product created' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Product code must be unique within the company.');
      }
      throw error;
    }
  }

  @Post('products/:productId/image')
  async uploadProductImage(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() body: { fileName?: string; contentType?: string; size?: number },
  ) {
    const companyId = await this.companyId(request);
    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const fileName = this.boundedText(body.fileName, 'Image file name', 1, 180);
    const contentType = this.boundedText(body.contentType, 'Image content type', 5, 80);
    if (!contentType.startsWith('image/')) throw new BadRequestException('Product image must be an image file.');
    this.boundedInt(body.size, 'Image size', 1, 5 * 1024 * 1024);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { imageStatus: 'ready' },
    });
    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId: request.user?.sub,
        action: 'PRODUCT_IMAGE_UPLOADED',
        recordType: 'Product',
        recordId: productId,
        risk: 'low',
      },
    });
    return { data: updated, fileName, message: 'Product image uploaded' };
  }

  private requiredText(value: string, label: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException(`${label} is required`);
    }
    return trimmed;
  }

  private requiredEmail(value: string) {
    const trimmed = this.requiredText(value, 'Email').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new BadRequestException('Invalid email address');
    }
    return trimmed;
  }

  private boundedText(value: unknown, label: string, min: number, max: number) {
    if (typeof value !== 'string') throw new BadRequestException(`${label} is required`);
    const trimmed = this.requiredText(value, label);
    if (trimmed.length < min || trimmed.length > max) {
      throw new BadRequestException(`${label} must be ${min}-${max} characters`);
    }
    return trimmed;
  }

  private boundedInt(value: unknown, label: string, min: number, max: number) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) {
      throw new BadRequestException(`${label} must be an integer from ${min} to ${max}`);
    }
    return number;
  }

  private codeText(value: unknown, label: string, min: number, max: number) {
    const text = this.boundedText(value, label, min, max).toUpperCase();
    if (!/^[A-Z0-9-]+$/.test(text)) {
      throw new BadRequestException(`${label} can only contain uppercase letters, numbers, and hyphens`);
    }
    return text;
  }

  private normalizedCategoryPrefix(value: unknown) {
    const text = this.boundedText(value, 'Code prefix', 1, 20).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    if (!text) {
      throw new BadRequestException('Code prefix must contain at least one letter or number');
    }
    return text;
  }

  private async validOutletIds(companyId: string, outletIds: string[]) {
    const unique = [...new Set(outletIds.filter(Boolean))];
    if (unique.length === 0) return [];
    const outlets = await this.prisma.outlet.findMany({ where: { companyId, id: { in: unique } }, select: { id: true } });
    if (outlets.length !== unique.length) throw new BadRequestException('One or more outlets are invalid.');
    return outlets.map((outlet) => outlet.id);
  }

  private async productCategoryAssignment(companyId: string, categoryId: string) {
    const category = await this.prisma.productCategory.findFirst({ where: { id: categoryId, companyId } });
    if (!category) {
      throw new BadRequestException('Category is required');
    }

    if (category.scope === 'outlet') {
      const outlet = await this.prisma.outlet.findFirst({
        where: { companyId, shortCode: category.codePrefix, status: OutletStatus.ACTIVE },
      });
      if (!outlet) {
        throw new BadRequestException('Outlet-scoped category prefix must match an active outlet code.');
      }
      return { category, source: 'outlet', outletId: outlet.id };
    }

    return { category, source: 'company', outletId: null };
  }

  private async nextProductCode(companyId: string, categoryId: string, excludeProductId?: string) {
    const category = await this.prisma.productCategory.findFirst({ where: { id: categoryId, companyId } });
    if (!category) {
      throw new BadRequestException('Category is required');
    }
    const products = await this.prisma.product.findMany({
      where: {
        companyId,
        productCode: { startsWith: category.codePrefix },
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
      select: { productCode: true },
    });
    const nextSequence = products
      .map((currentProduct) => Number(currentProduct.productCode.slice(category.codePrefix.length)))
      .filter((sequence) => Number.isInteger(sequence))
      .reduce((max, sequence) => Math.max(max, sequence), 0) + 1;

    return `${category.codePrefix}${String(nextSequence).padStart(3, '0')}`;
  }

  private async buildRenumberPreview(companyId: string, categoryId: string, requestedPrefix?: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id: categoryId, companyId },
      include: { products: { orderBy: { productCode: 'asc' } } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const nextPrefix = requestedPrefix ?? category.codePrefix;
    const rows = category.products.map((product, index) => {
      const suffix = product.productCode.startsWith(category.codePrefix)
        ? product.productCode.slice(category.codePrefix.length)
        : '';
      const parsedSuffix = Number(suffix);
      const sequence = suffix && Number.isInteger(parsedSuffix) && parsedSuffix >= 0 ? parsedSuffix : index + 1;
      return {
        productId: product.id,
        oldCode: product.productCode,
        newCode: `${nextPrefix}${String(sequence).padStart(3, '0')}`,
        product: product.nameEn,
        conflict: false,
      };
    });

    const newCodes = rows.map((row) => row.newCode);
    const externalConflicts = await this.prisma.product.findMany({
      where: { companyId, categoryId: { not: categoryId }, productCode: { in: newCodes } },
      select: { productCode: true },
    });
    const conflictCodes = new Set(externalConflicts.map((product) => product.productCode));
    const seenCodes = new Set<string>();
    const rowsWithConflicts = rows.map((row) => {
      const duplicated = seenCodes.has(row.newCode);
      seenCodes.add(row.newCode);
      return {
        ...row,
        conflict: duplicated || conflictCodes.has(row.newCode),
      };
    });

    return {
      categoryId,
      oldPrefix: category.codePrefix,
      newPrefix: nextPrefix,
      rows: rowsWithConflicts,
      summary: {
        productCount: rowsWithConflicts.length,
        conflicts: rowsWithConflicts.filter((row) => row.conflict).length,
      },
    };
  }

  private productPayload(body: Record<string, unknown>): Prisma.ProductUncheckedUpdateInput {
    const data: Prisma.ProductUncheckedUpdateInput = {};
    if (body.nameEn !== undefined) data.nameEn = this.boundedText(body.nameEn, 'English name', 2, 160);
    if (body.nameZh !== undefined) data.nameZh = this.boundedText(body.nameZh, 'Chinese name', 1, 160);
    if (body.daysToExpire !== undefined) data.daysToExpire = this.boundedInt(body.daysToExpire, 'Days to expire', 0, 365);
    if (body.hoursToExpire !== undefined) data.hoursToExpire = this.boundedInt(body.hoursToExpire, 'Hours to expire', 0, 8760);
    if (body.storageMethodEn !== undefined) data.storageMethodEn = this.boundedText(body.storageMethodEn, 'Storage method EN', 2, 120);
    if (body.storageMethodZh !== undefined) data.storageMethodZh = this.boundedText(body.storageMethodZh, 'Storage method ZH', 1, 120);
    if (body.status !== undefined) {
      if (!Object.values(ProductStatus).includes(body.status as ProductStatus)) throw new BadRequestException('Invalid product status');
      data.active = body.status === ProductStatus.ACTIVE;
    }
    return data;
  }

  @Post('categories')
  async createCategory(@Req() request: AuthenticatedRequest, @Body() body: { name: string; codePrefix: string; scope?: string; status?: ProductStatus }) {
    const companyId = await this.companyId(request);
    if (body.status && !Object.values(ProductStatus).includes(body.status)) {
      throw new BadRequestException('Invalid category status');
    }
    try {
      const category = await this.prisma.productCategory.create({
        data: {
          companyId,
          name: this.boundedText(body.name, 'Category name', 2, 120),
          codePrefix: this.normalizedCategoryPrefix(body.codePrefix),
          scope: body.scope === 'outlet' ? 'outlet' : 'company',
          status: body.status ?? ProductStatus.ACTIVE,
        },
      });
      await this.prisma.auditLog.create({
        data: { companyId, actorId: request.user?.sub, action: 'CATEGORY_CREATED', recordType: 'ProductCategory', recordId: category.id, risk: 'low' },
      });
      return { data: category, message: 'Category created' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Category prefix must be unique within the company.');
      }
      throw error;
    }
  }

  @Patch('categories/:categoryId')
  async updateCategory(
    @Req() request: AuthenticatedRequest,
    @Param('categoryId') categoryId: string,
    @Body() body: { name?: string; codePrefix?: string; scope?: string; status?: ProductStatus; updateProductCodes?: boolean },
  ) {
    const companyId = await this.companyId(request);
    const existing = await this.prisma.productCategory.findFirst({ where: { id: categoryId, companyId } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const data: Prisma.ProductCategoryUpdateInput = {};
    if (body.name !== undefined) data.name = this.boundedText(body.name, 'Category name', 2, 120);
    if (body.codePrefix !== undefined) data.codePrefix = this.normalizedCategoryPrefix(body.codePrefix);
    if (body.scope !== undefined) {
      if (body.scope !== 'company' && body.scope !== 'outlet') throw new BadRequestException('Invalid category scope');
      data.scope = body.scope;
    }
    if (body.status !== undefined) {
      if (!Object.values(ProductStatus).includes(body.status)) throw new BadRequestException('Invalid category status');
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No category fields to update');
    }

    const nextPrefix = typeof data.codePrefix === 'string' ? data.codePrefix : existing.codePrefix;
    const prefixChanged = nextPrefix !== existing.codePrefix;
    const preview = prefixChanged && body.updateProductCodes
      ? await this.buildRenumberPreview(companyId, categoryId, nextPrefix)
      : null;
    if (preview?.rows.some((row) => row.conflict)) {
      throw new BadRequestException('Product code renumbering has conflicts. Resolve conflicting product codes first.');
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const saved = await tx.productCategory.update({ where: { id: categoryId }, data });
        if (preview) {
          for (const row of preview.rows) {
            await tx.product.update({ where: { id: row.productId }, data: { productCode: row.newCode } });
          }
        }
        return saved;
      });

      await this.prisma.auditLog.create({
        data: {
          companyId,
          actorId: request.user?.sub,
          action: preview ? 'CATEGORY_PREFIX_RENUMBERED' : 'CATEGORY_UPDATED',
          recordType: 'ProductCategory',
          recordId: categoryId,
          risk: preview ? 'medium' : 'low',
        },
      });

      return {
        data: updated,
        message: preview ? `Category saved and ${preview.rows.length} product code${preview.rows.length === 1 ? '' : 's'} updated` : 'Category saved',
        renumberedProducts: preview?.rows.length ?? 0,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Category prefix must be unique within the company.');
      }
      throw error;
    }
  }

  @Get('categories')
  async categories(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    return this.prisma.productCategory.findMany({
      where: { companyId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Get('categories/:categoryId')
  async category(@Req() request: AuthenticatedRequest, @Param('categoryId') categoryId: string) {
    const companyId = await this.companyId(request);
    return this.prisma.productCategory.findFirst({
      where: { id: categoryId, companyId },
      include: { products: true },
    });
  }

  @Post('categories/:categoryId/renumber-preview')
  async renumberPreview(@Req() request: AuthenticatedRequest, @Param('categoryId') categoryId: string, @Body() body: { codePrefix?: string }) {
    const companyId = await this.companyId(request);
    const nextPrefix = body.codePrefix !== undefined ? this.normalizedCategoryPrefix(body.codePrefix) : undefined;
    return this.buildRenumberPreview(companyId, categoryId, nextPrefix);
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.OUTLET_USER)
  @Get('availability')
  async availability(@Req() request: AuthenticatedRequest, @Query('outletId') outletId?: string) {
    const companyId = await this.companyId(request);
    const allowedOutletIds = await this.allowedOutletIds(request, companyId);
    const outlets = await this.prisma.outlet.findMany({
      where: { companyId, status: 'ACTIVE', ...(allowedOutletIds ? { id: { in: allowedOutletIds } } : {}) },
      orderBy: { name: 'asc' },
    });
    const allOutletIds = outlets.map((outlet) => outlet.id);
    await this.ensureOutletProducts(companyId, allOutletIds);

    const defaultOutletId = outlets[0]?.id;
    const targetOutletIds = outletId
      ? outlets.filter((outlet) => outlet.id === outletId).map((outlet) => outlet.id)
      : defaultOutletId
        ? [defaultOutletId]
        : [];
    const [companyRows, outletRows] = await Promise.all([
      this.isOutletUser(request)
        ? Promise.resolve([])
        : this.prisma.product.findMany({ where: { companyId }, include: { category: true }, orderBy: { productCode: 'asc' } }),
      this.prisma.outletProduct.findMany({
        where: { outletId: { in: targetOutletIds } },
        include: { product: { include: { category: true } }, outlet: true },
        orderBy: [{ outlet: { name: 'asc' } }, { product: { productCode: 'asc' } }],
      }),
    ]);
    return { role: request.user?.role, outlets, selectedOutletId: targetOutletIds[0] ?? '', companyRows, outletRows };
  }

  private async ensureOutletProducts(companyId: string, outletIds: string[]) {
    if (outletIds.length === 0) return;
    const products = await this.prisma.product.findMany({
      where: { companyId },
      select: { id: true },
    });
    if (products.length === 0) return;

    const existingRows = await this.prisma.outletProduct.findMany({
      where: { outletId: { in: outletIds }, productId: { in: products.map((product) => product.id) } },
      select: { outletId: true, productId: true },
    });
    const existingKeys = new Set(existingRows.map((row) => `${row.outletId}:${row.productId}`));
    const missingRows = outletIds.flatMap((outletId) =>
      products
        .filter((product) => !existingKeys.has(`${outletId}:${product.id}`))
        .map((product) => ({ outletId, productId: product.id, active: true })),
    );
    if (missingRows.length === 0) return;

    await this.prisma.outletProduct.createMany({
      data: missingRows,
      skipDuplicates: true,
    });
  }

  @Roles(UserRole.COMPANY_ADMIN, UserRole.OUTLET_USER)
  @Patch('availability')
  async updateAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() body: { company?: Array<{ productId: string; active: boolean }>; outlet?: Array<{ outletProductId: string; active: boolean }> },
  ) {
    const companyId = await this.companyId(request);
    const allowedOutletIds = await this.allowedOutletIds(request, companyId);
    if (this.isOutletUser(request) && body.company?.length) throw new ForbiddenException('Outlet User cannot change company-level availability.');

    await this.prisma.$transaction(async (tx) => {
      for (const row of body.company ?? []) {
        await tx.product.updateMany({ where: { id: row.productId, companyId }, data: { active: row.active } });
      }
      for (const row of body.outlet ?? []) {
        await tx.outletProduct.updateMany({
          where: {
            id: row.outletProductId,
            product: { companyId, active: true },
            ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}),
          },
          data: { active: row.active },
        });
      }
    });
    await this.prisma.auditLog.create({
      data: { companyId, actorId: request.user?.sub, action: 'AVAILABILITY_UPDATED', recordType: 'OutletProduct', risk: this.isOutletUser(request) ? 'low' : 'medium' },
    });
    return { status: 'saved', message: 'Availability saved' };
  }

  @Get('product-images')
  async productImages(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    return this.prisma.product.findMany({
      where: { companyId },
      select: { id: true, productCode: true, nameEn: true, imageStatus: true, imageUri: true, updatedAt: true },
      orderBy: { productCode: 'asc' },
    });
  }

  @Post('product-images')
  uploadImage() {
    return { status: 'uploaded' };
  }

  @Get('import/preview')
  importPreviewGet() {
    return {
      importType: 'Products',
      rows: [],
      summary: {
        products: 0,
        ready: 0,
        warnings: 0,
        blocked: 0,
        images: 0,
        categoryName: 'Opened Ingredients',
        categoryPrefix: '',
        categoryAction: 'Upload an Excel file to validate product rows.',
      },
    };
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async importPreview(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: ImportFile,
    @Body() body: { categoryId?: string; categoryName?: string; categoryPrefix?: string },
  ) {
    const companyId = await this.companyId(request);
    return this.buildProductImportPreview(companyId, file, body);
  }

  @Post('import/commit')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async commitImport(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: ImportFile,
    @Body() body: { categoryId?: string; categoryName?: string; categoryPrefix?: string },
  ) {
    const companyId = await this.companyId(request);
    const preview = await this.buildProductImportPreview(companyId, file, body);
    const blockedRows = preview.rows.filter((row) => row.status === 'Blocked');
    if (blockedRows.length > 0) {
      throw new BadRequestException({
        message: 'Import has blocked rows. Fix the Excel file or category mapping before committing.',
        rows: blockedRows,
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const category = await tx.productCategory.findFirst({
        where: { id: preview.summary.categoryId, companyId },
      });
      if (!category) throw new BadRequestException('Selected category no longer exists.');

      const activeOutlets = await tx.outlet.findMany({
        where: { companyId, status: OutletStatus.ACTIVE },
        select: { id: true },
      });

      let created = 0;
      let updated = 0;
      for (const row of preview.rows) {
        const productData = {
          categoryId: category.id,
          source: 'company',
          outletId: null,
          nameEn: row.nameEn,
          nameZh: row.nameZh,
          daysToExpire: row.daysToExpire,
          hoursToExpire: row.hoursToExpire,
          storageMethodEn: row.storageMethodEn,
          storageMethodZh: row.storageMethodZh,
          active: true,
          ...(row.imageUri ? { imageUri: row.imageUri, imageStatus: 'ready' } : {}),
        };
        const existing = await tx.product.findFirst({
          where: { companyId, productCode: row.code },
          select: { id: true },
        });
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data: productData })
          : await tx.product.create({
              data: {
                companyId,
                productCode: row.code,
                ...productData,
              },
            });

        if (existing) updated += 1;
        else created += 1;

        if (activeOutlets.length > 0) {
          await tx.outletProduct.createMany({
            data: activeOutlets.map((outlet) => ({ outletId: outlet.id, productId: product.id, active: true })),
            skipDuplicates: true,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          companyId,
          actorId: request.user?.sub,
          action: 'PRODUCT_IMPORT_COMMITTED',
          recordType: 'Product',
          recordId: preview.fileName,
          risk: preview.summary.warnings > 0 ? 'medium' : 'low',
        },
      });

      return { created, updated };
    });

    return {
      status: 'committed',
      message: `Import committed. ${result.created} product${result.created === 1 ? '' : 's'} created and ${result.updated} updated.`,
      summary: { ...preview.summary, ...result },
      rows: preview.rows,
    };
  }

  private async buildProductImportPreview(companyId: string, file: ImportFile, body: { categoryId?: string; categoryName?: string; categoryPrefix?: string }) {
    this.validateImportFile(file);
    const selectedCategory = await this.productImportCategory(companyId, body);
    const categoryName = selectedCategory.name;
    const requestedPrefix = selectedCategory.codePrefix;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new BadRequestException('Excel file does not contain any worksheets.');

    const headers = this.productImportHeaders(worksheet);
    const richCellImages = await this.productImportRichCellImages(file.buffer, 0);
    const parsedRows: ParsedProductImportRow[] = [];
    const fileCodes = new Set<string>();
    const duplicateCodes = new Set<string>();
    const prefixes = new Set<string>();

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const rawName = this.cellText(row.getCell(headers.productName).value);
      const rawStorage = this.cellText(row.getCell(headers.storageCondition).value);
      const rawStorageTime = this.cellText(row.getCell(headers.storageTime).value);
      const rawCode = this.cellText(row.getCell(headers.code).value);

      if (![rawName, rawStorage, rawStorageTime, rawCode].some(Boolean)) continue;

      const errors: string[] = [];
      const imageUri = this.productImportRowImageUri(workbook, worksheet, row, rowNumber, headers.picture, richCellImages, errors);
      const code = this.productCodeText(rawCode, errors);
      if (code) {
        if (fileCodes.has(code)) duplicateCodes.add(code);
        fileCodes.add(code);
        const prefix = this.productCodePrefix(code);
        if (prefix) prefixes.add(prefix);
        else errors.push('Code must start with a category prefix before the numeric sequence.');
      }

      const names = this.splitProductName(rawName, errors);
      const expiry = this.parseStorageTime(rawStorageTime, errors);
      const storageMethodEn = rawStorage.trim();
      if (!storageMethodEn) errors.push('Storage Condition is required.');
      else if (storageMethodEn.length > 120) errors.push('Storage Condition must be 120 characters or fewer.');

      parsedRows.push({
        row: rowNumber,
        type: 'Product',
        code: code || rawCode,
        nameEn: names.nameEn,
        nameZh: names.nameZh,
        imageUri,
        storageMethodEn,
        storageMethodZh: storageMethodEn,
        daysToExpire: expiry.daysToExpire,
        hoursToExpire: expiry.hoursToExpire,
        status: errors.length > 0 ? 'Blocked' : 'Ready',
        message: errors.length > 0 ? errors.join(' ') : 'Ready to create product.',
      });
    }

    if (parsedRows.length === 0) {
      throw new BadRequestException('No product rows found. The first worksheet must include product rows below the header.');
    }

    const categoryPrefix = requestedPrefix ?? (prefixes.size === 1 ? [...prefixes][0] : undefined);
    if (!categoryPrefix) {
      for (const row of parsedRows) {
        row.status = 'Blocked';
        row.message = `${row.message} Import must contain one product code prefix, or a Category Prefix must be entered.`;
      }
    }

    for (const row of parsedRows) {
      if (duplicateCodes.has(row.code)) {
        row.status = 'Blocked';
        row.message = `${row.message} Duplicate product code in file.`;
      }
      if (categoryPrefix && row.code && this.productCodePrefix(row.code) !== categoryPrefix) {
        row.status = 'Blocked';
        row.message = `${row.message} Product code prefix must match ${categoryPrefix}.`;
      }
    }

    const existingProducts = fileCodes.size
      ? await this.prisma.product.findMany({ where: { companyId, productCode: { in: [...fileCodes] } }, select: { productCode: true } })
      : [];
    const existingProductCodes = new Set(existingProducts.map((product) => product.productCode));

    for (const row of parsedRows) {
      if (row.status === 'Blocked') continue;
      if (existingProductCodes.has(row.code)) {
        row.status = 'Warning';
        row.message = 'Existing product code found. Commit will update this product.';
      } else {
        row.message = 'Ready to create product.';
      }
    }

    const ready = parsedRows.filter((row) => row.status === 'Ready').length;
    const warnings = parsedRows.filter((row) => row.status === 'Warning').length;
    const blocked = parsedRows.filter((row) => row.status === 'Blocked').length;
    const images = parsedRows.filter((row) => Boolean(row.imageUri)).length;

    return {
      importType: 'Products',
      fileName: file.originalname,
      rows: parsedRows,
      summary: {
        products: parsedRows.length,
        ready,
        warnings,
        blocked,
        images,
        categoryId: selectedCategory.id,
        categoryName,
        categoryPrefix: categoryPrefix ?? '',
        categoryAction: `Use existing category "${categoryName}" (${categoryPrefix}).`,
      },
    };
  }

  private async productImportCategory(companyId: string, body: { categoryId?: string; categoryName?: string; categoryPrefix?: string }): Promise<ProductImportCategory> {
    if (body.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: { id: body.categoryId, companyId },
        select: { id: true, name: true, codePrefix: true, status: true },
      });
      if (!category) throw new BadRequestException('Selected category is invalid.');
      if (category.status !== ProductStatus.ACTIVE) throw new BadRequestException('Selected category must be active.');
      return category;
    }

    const categoryName = this.boundedText(body.categoryName || 'Opened Ingredients', 'Category name', 2, 120);
    const categoryPrefix = body.categoryPrefix ? this.normalizedCategoryPrefix(body.categoryPrefix) : undefined;
    if (!categoryPrefix) throw new BadRequestException('Select a Category before importing.');
    const category = await this.prisma.productCategory.findFirst({
      where: { companyId, codePrefix: categoryPrefix },
      select: { id: true, name: true, codePrefix: true, status: true },
    });
    if (!category) throw new BadRequestException(`Category "${categoryName}" (${categoryPrefix}) does not exist. Create the category before importing products.`);
    if (category.status !== ProductStatus.ACTIVE) throw new BadRequestException('Selected category must be active.');
    return category;
  }

  private validateImportFile(file?: ImportFile) {
    if (!file?.buffer?.length) throw new BadRequestException('Choose an Excel file before importing.');
    const lowerName = file.originalname.toLowerCase();
    if (!lowerName.endsWith('.xlsx')) throw new BadRequestException('Only .xlsx Excel files are supported.');
  }

  private productImportHeaders(worksheet: ExcelJS.Worksheet) {
    const row = worksheet.getRow(1);
    const headers = new Map<string, number>();
    row.eachCell((cell, columnNumber) => {
      const key = this.normalizedImportHeader(this.cellText(cell.value));
      if (key) headers.set(key, columnNumber);
    });

    const required = {
      productName: headers.get('productName'),
      picture: headers.get('picture'),
      storageCondition: headers.get('storageCondition'),
      storageTime: headers.get('storageTime'),
      code: headers.get('code'),
    };

    const missing = Object.entries(required)
      .filter(([name, column]) => name !== 'picture' && !column)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required Excel column(s): ${missing.join(', ')}.`);
    }

    return required as { productName: number; picture?: number; storageCondition: number; storageTime: number; code: number };
  }

  private normalizedImportHeader(value: string) {
    const text = value.toLowerCase().replace(/\s+/g, ' ').trim();
    if (text.startsWith('product name')) return 'productName';
    if (text === 'picture' || text === 'image' || text === 'photo' || text.startsWith('image url') || text.startsWith('product image')) return 'picture';
    if (text.startsWith('storage condition')) return 'storageCondition';
    if (text.startsWith('storage time')) return 'storageTime';
    if (text.startsWith('code')) return 'code';
    return '';
  }

  private cellText(value: ExcelJS.CellValue | undefined): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
      if ('text' in value && typeof value.text === 'string') return value.text.trim();
      if ('result' in value) return this.cellText(value.result as ExcelJS.CellValue);
      if ('richText' in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('').trim();
      if ('hyperlink' in value && 'text' in value && typeof value.text === 'string') return value.text.trim();
      return String(value).trim();
    }
    return String(value).trim();
  }

  private productImportRowImageUri(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
    row: ExcelJS.Row,
    rowNumber: number,
    pictureColumn: number | undefined,
    richCellImages: Map<string, string>,
    errors: string[],
  ) {
    const pictureErrors: string[] = [];
    const pictureCellUri = pictureColumn
      ? this.productImportImageUri(row.getCell(pictureColumn).value, pictureErrors)
      : undefined;
    const richCellUri = this.richCellProductImageUri(richCellImages, row, rowNumber, pictureColumn);
    const rowCellUri = this.rowCellProductImageUri(row, pictureColumn);
    const embeddedUri = this.embeddedProductImageUri(workbook, worksheet, rowNumber, pictureColumn, errors);

    if (pictureCellUri) return pictureCellUri;
    if (richCellUri) return richCellUri;
    if (rowCellUri) return rowCellUri;
    if (embeddedUri) return embeddedUri;

    errors.push(...pictureErrors);
    return undefined;
  }

  private productImportImageUri(value: ExcelJS.CellValue | undefined, errors?: string[]) {
    const uri = this.cellImageUri(value);
    return this.validProductImageUri(uri, errors);
  }

  private validProductImageUri(uri: string, errors?: string[]) {
    if (!uri) return undefined;
    if (uri.startsWith('data:image/')) return uri;
    if (uri.length > 2048) {
      errors?.push('Picture URL must be 2048 characters or fewer.');
      return undefined;
    }
    if (!/^https?:\/\//i.test(uri)) {
      errors?.push('Picture must be a URL starting with http:// or https://.');
      return undefined;
    }
    try {
      new URL(uri);
    } catch {
      errors?.push('Picture must be a valid URL.');
      return undefined;
    }
    return uri;
  }

  private rowCellProductImageUri(row: ExcelJS.Row, pictureColumn?: number) {
    const preferredColumns = pictureColumn ? [pictureColumn] : [];
    const remainingColumns = Array.from({ length: row.cellCount }, (_, index) => index + 1)
      .filter((column) => column !== pictureColumn);

    for (const column of [...preferredColumns, ...remainingColumns]) {
      const rawUri = this.cellImageUri(row.getCell(column).value);
      if (!this.looksLikeProductImageUri(rawUri)) continue;
      const validUri = this.validProductImageUri(rawUri);
      if (validUri) return validUri;
    }

    return undefined;
  }

  private looksLikeProductImageUri(value: string) {
    const text = value.trim().toLowerCase();
    if (!text) return false;
    if (text.startsWith('data:image/') || text.startsWith('http://') || text.startsWith('https://')) return true;
    return /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(text);
  }

  private richCellProductImageUri(richCellImages: Map<string, string>, row: ExcelJS.Row, rowNumber: number, pictureColumn: number | undefined) {
    const preferredColumns = pictureColumn ? [pictureColumn] : [];
    const remainingColumns = Array.from({ length: row.cellCount }, (_, index) => index + 1)
      .filter((column) => column !== pictureColumn);

    for (const column of [...preferredColumns, ...remainingColumns]) {
      const uri = richCellImages.get(this.cellImageKey(rowNumber, column));
      if (uri) return uri;
    }

    return undefined;
  }

  private async productImportRichCellImages(buffer: Buffer, worksheetIndex: number) {
    const images = new Map<string, string>();

    try {
      const zip = await JSZip.loadAsync(buffer);
      const worksheetPath = await this.xlsxWorksheetPath(zip, worksheetIndex);
      const worksheetFile = worksheetPath ? zip.file(worksheetPath) : null;
      const metadataFile = zip.file('xl/metadata.xml');
      const richValuesFile = zip.file('xl/richData/rdrichvalue.xml');
      const richValueRelFile = zip.file('xl/richData/richValueRel.xml');
      const richValueRelRelsFile = zip.file('xl/richData/_rels/richValueRel.xml.rels');
      if (!worksheetFile || !metadataFile || !richValuesFile || !richValueRelFile || !richValueRelRelsFile) return images;

      const [worksheetXml, metadataXml, richValuesXml, richValueRelXml, richValueRelRelsXml] = await Promise.all([
        worksheetFile.async('string'),
        metadataFile.async('string'),
        richValuesFile.async('string'),
        richValueRelFile.async('string'),
        richValueRelRelsFile.async('string'),
      ]);
      const metadataRichValueIndexes = this.xlsxValueMetadataRichValueIndexes(metadataXml);
      const richValueImageIndexes = this.xlsxRichValueImageIndexes(richValuesXml);
      const richValueRelIds = this.xlsxRichValueRelIds(richValueRelXml);
      const imageTargets = this.xlsxRelationshipTargets(richValueRelRelsXml);

      for (const match of worksheetXml.matchAll(/<c\b([^>]*)>/g)) {
        const attrs = match[1];
        const address = this.xmlAttribute(attrs, 'r');
        const vm = Number(this.xmlAttribute(attrs, 'vm'));
        if (!address || !Number.isInteger(vm) || vm < 1) continue;

        const richValueIndex = metadataRichValueIndexes[vm - 1];
        if (!Number.isInteger(richValueIndex)) continue;
        const imageIndex = richValueImageIndexes[richValueIndex];
        if (!Number.isInteger(imageIndex)) continue;
        const relId = richValueRelIds[imageIndex];
        const target = relId ? imageTargets.get(relId) : undefined;
        if (!target) continue;

        const imagePath = this.resolveXlsxPath('xl/richData/richValueRel.xml', target);
        const imageFile = zip.file(imagePath);
        if (!imageFile) continue;

        const extension = imagePath.split('.').pop()?.toLowerCase() || '';
        const mimeType = this.imageMimeType(extension);
        if (!mimeType) continue;
        const imageBuffer = await imageFile.async('nodebuffer');
        if (!imageBuffer.byteLength) continue;

        const cell = this.xlsxCellAddress(address);
        if (cell) images.set(this.cellImageKey(cell.row, cell.column), `data:${mimeType};base64,${imageBuffer.toString('base64')}`);
      }
    } catch {
      return images;
    }

    return images;
  }

  private async xlsxWorksheetPath(zip: JSZip, worksheetIndex: number) {
    const workbookFile = zip.file('xl/workbook.xml');
    const workbookRelsFile = zip.file('xl/_rels/workbook.xml.rels');
    if (!workbookFile || !workbookRelsFile) return `xl/worksheets/sheet${worksheetIndex + 1}.xml`;

    const [workbookXml, workbookRelsXml] = await Promise.all([
      workbookFile.async('string'),
      workbookRelsFile.async('string'),
    ]);
    const sheetMatches = [...workbookXml.matchAll(/<sheet\b([^>]*)>/g)];
    const sheetAttrs = sheetMatches[worksheetIndex]?.[1];
    const relId = sheetAttrs ? this.xmlAttribute(sheetAttrs, 'r:id') : undefined;
    const target = relId ? this.xlsxRelationshipTargets(workbookRelsXml).get(relId) : undefined;
    return target ? this.resolveXlsxPath('xl/workbook.xml', target) : `xl/worksheets/sheet${worksheetIndex + 1}.xml`;
  }

  private xlsxValueMetadataRichValueIndexes(metadataXml: string) {
    const valueMetadata = metadataXml.match(/<valueMetadata\b[^>]*>([\s\S]*?)<\/valueMetadata>/)?.[1] || '';
    return [...valueMetadata.matchAll(/<bk\b[^>]*>[\s\S]*?<rc\b([^>]*)\/>[\s\S]*?<\/bk>/g)]
      .map((match) => Number(this.xmlAttribute(match[1], 'v')))
      .filter((value) => Number.isInteger(value));
  }

  private xlsxRichValueImageIndexes(richValuesXml: string) {
    return [...richValuesXml.matchAll(/<rv\b[^>]*>([\s\S]*?)<\/rv>/g)]
      .map((match) => {
        const firstValue = match[1].match(/<v>(.*?)<\/v>/)?.[1];
        return Number(firstValue);
      });
  }

  private xlsxRichValueRelIds(richValueRelXml: string) {
    return [...richValueRelXml.matchAll(/<rel\b([^>]*)\/>/g)]
      .map((match) => this.xmlAttribute(match[1], 'r:id'))
      .filter((value): value is string => Boolean(value));
  }

  private xlsxRelationshipTargets(relsXml: string) {
    const targets = new Map<string, string>();
    for (const match of relsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
      const id = this.xmlAttribute(match[1], 'Id');
      const target = this.xmlAttribute(match[1], 'Target');
      if (id && target) targets.set(id, target);
    }
    return targets;
  }

  private resolveXlsxPath(basePath: string, target: string) {
    const baseParts = basePath.split('/').slice(0, -1);
    const parts = [...baseParts, ...target.split('/')];
    const resolved: string[] = [];

    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') resolved.pop();
      else resolved.push(part);
    }

    return resolved.join('/');
  }

  private xlsxCellAddress(address: string) {
    const match = address.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return undefined;
    return { row: Number(match[2]), column: this.excelColumnNumber(match[1]) };
  }

  private excelColumnNumber(columnLetters: string) {
    return columnLetters.toUpperCase().split('').reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
  }

  private cellImageKey(row: number, column: number) {
    return `${row}:${column}`;
  }

  private xmlAttribute(attrs: string, name: string) {
    return attrs.match(new RegExp(`(?:^|\\s)${name.replace(':', '\\:')}="([^"]*)"`))?.[1];
  }

  private embeddedProductImageUri(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
    rowNumber: number,
    pictureColumn: number | undefined,
    errors: string[],
  ) {
    const images = worksheet.getImages();
    const image = images.find((current) => {
      const range = current.range;
      const top = Math.floor(range.tl.row) + 1;
      const left = Math.floor(range.tl.col) + 1;
      const bottom = Math.ceil(range.br?.row ?? range.tl.row) + 1;
      const right = Math.ceil(range.br?.col ?? range.tl.col) + 1;
      return rowNumber >= top && rowNumber <= bottom && pictureColumn !== undefined && pictureColumn >= left && pictureColumn <= right;
    }) ?? images
      .filter((current) => {
        const range = current.range;
        const top = Math.floor(range.tl.row) + 1;
        const bottom = Math.ceil(range.br?.row ?? range.tl.row) + 1;
        return rowNumber >= top && rowNumber <= bottom;
      })
      .sort((first, second) => {
        const firstCenter = (first.range.tl.col + (first.range.br?.col ?? first.range.tl.col)) / 2 + 1;
        const secondCenter = (second.range.tl.col + (second.range.br?.col ?? second.range.tl.col)) / 2 + 1;
        if (pictureColumn === undefined) return firstCenter - secondCenter;
        return Math.abs(firstCenter - pictureColumn) - Math.abs(secondCenter - pictureColumn);
      })[0];
    if (!image) return undefined;

    const media = workbook.getImage(Number(image.imageId));
    const extension = media?.extension?.toLowerCase();
    const buffer = media?.buffer ?? (media?.base64 ? Buffer.from(media.base64, 'base64') : undefined);
    if (!buffer?.byteLength || !extension) return undefined;

    const mimeType = this.imageMimeType(extension);
    if (!mimeType) {
      errors.push('Picture must be a PNG, JPEG, GIF, or WebP image.');
      return undefined;
    }
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  private imageMimeType(extension: string) {
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return '';
    }
  }

  private cellImageUri(value: ExcelJS.CellValue | undefined): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if ('hyperlink' in value && typeof value.hyperlink === 'string') return value.hyperlink.trim();
      if ('result' in value) return this.cellImageUri(value.result as ExcelJS.CellValue);
      if ('text' in value && typeof value.text === 'string') return this.extractImageUri(value.text);
      if ('richText' in value && Array.isArray(value.richText)) return this.extractImageUri(value.richText.map((part) => part.text).join(''));
    }
    return this.extractImageUri(String(value));
  }

  private extractImageUri(value: string) {
    const text = value.trim();
    const srcMatch = text.match(/\bsrc=["']([^"']+)["']/i);
    const uri = (srcMatch?.[1] ?? text).trim().replace(/&amp;/g, '&');
    if (uri.startsWith('//')) return `https:${uri}`;
    return uri;
  }

  private productCodeText(value: string, errors: string[]) {
    const code = value.trim().toUpperCase();
    if (!code) {
      errors.push('Code is required.');
      return '';
    }
    if (code.length > 24) errors.push('Code must be 24 characters or fewer.');
    if (!/^[A-Z0-9-]+$/.test(code)) errors.push('Code can only contain uppercase letters, numbers, and hyphens.');
    return code;
  }

  private productCodePrefix(code: string) {
    const match = code.match(/^[A-Z]+/);
    return match?.[0] ?? '';
  }

  private splitProductName(value: string, errors: string[]) {
    const text = value.trim();
    if (!text) {
      errors.push('Product Name is required.');
      return { nameEn: '', nameZh: '' };
    }
    const chineseIndex = text.search(/[\u3400-\u9fff]/);
    const nameEn = chineseIndex >= 0 ? text.slice(0, chineseIndex).trim() : text;
    const nameZh = chineseIndex >= 0 ? text.slice(chineseIndex).trim() : text;
    if (nameEn.length < 2 || nameEn.length > 160) errors.push('English product name must be 2-160 characters.');
    if (nameZh.length < 1 || nameZh.length > 160) errors.push('Chinese product name must be 1-160 characters.');
    return { nameEn, nameZh };
  }

  private parseStorageTime(value: string, errors: string[]) {
    const text = value.trim().toLowerCase();
    const match = text.match(/^(\d+)\s*(minute|minutes|min|mins|hour|hours|hr|hrs|day|days|week|weeks|month|months)$/);
    if (!match) {
      errors.push('Storage Time must look like "7 days", "14 days", "1 month", or "3 months".');
      return { daysToExpire: 0, hoursToExpire: 0 };
    }

    const quantity = Number(match[1]);
    const unit = match[2];
    let daysToExpire = 0;
    let hoursToExpire = 0;
    if (unit.startsWith('min')) hoursToExpire = Math.ceil(quantity / 60);
    else if (unit.startsWith('hour') || unit.startsWith('hr')) hoursToExpire = quantity;
    else if (unit.startsWith('day')) daysToExpire = quantity;
    else if (unit.startsWith('week')) daysToExpire = quantity * 7;
    else if (unit.startsWith('month')) daysToExpire = quantity * 30;

    if (daysToExpire > 365) errors.push('Storage Time cannot exceed 365 days.');
    if (hoursToExpire > 8760) errors.push('Storage Time cannot exceed 8760 hours.');
    return { daysToExpire, hoursToExpire };
  }

  @Get('export')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportData(@Req() request: AuthenticatedRequest, @Query() query: Record<string, string | undefined>, @Res() response: Response) {
    const companyId = await this.companyId(request);
    const includeCategories = query.includeCategories !== 'false';
    const includeProducts = query.includeProducts !== 'false';
    const categoryScope = query.categoryScope === 'active' || query.categoryScope === 'selected' ? query.categoryScope : 'all';
    const productScope = query.productScope === 'selectedCategories' || query.productScope === 'selected' ? query.productScope : 'all';
    const categoryIds = csvIds(query.categoryIds);
    const productIds = csvIds(query.productIds);

    if (!includeCategories && !includeProducts) {
      throw new BadRequestException('Choose at least one export sheet.');
    }
    if (includeCategories && categoryScope === 'selected' && categoryIds.length === 0) {
      throw new BadRequestException('Select at least one category to export.');
    }
    if (includeProducts && productScope === 'selectedCategories' && categoryIds.length === 0) {
      throw new BadRequestException('Select at least one category for product export.');
    }
    if (includeProducts && productScope === 'selected' && productIds.length === 0) {
      throw new BadRequestException('Select at least one product to export.');
    }

    const categoryWhere: Prisma.ProductCategoryWhereInput = {
      companyId,
      ...(categoryScope === 'active' ? { status: ProductStatus.ACTIVE } : {}),
      ...(categoryScope === 'selected' ? { id: { in: categoryIds } } : {}),
    };
    const productWhere: Prisma.ProductWhereInput = {
      companyId,
      ...(productScope === 'selectedCategories' ? { categoryId: { in: categoryIds } } : {}),
      ...(productScope === 'selected' ? { id: { in: productIds } } : {}),
    };
    const [categories, products] = await Promise.all([
      includeCategories ? this.prisma.productCategory.findMany({
        where: categoryWhere,
        orderBy: { name: 'asc' },
        select: {
          name: true,
          codePrefix: true,
          scope: true,
          status: true,
          updatedAt: true,
          _count: { select: { products: true } },
        },
      }) : Promise.resolve([]),
      includeProducts ? this.prisma.product.findMany({
        where: productWhere,
        orderBy: { productCode: 'asc' },
        include: { category: { select: { name: true, codePrefix: true } } },
      }) : Promise.resolve([]),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'JR Label Cloud';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheets: ExcelJS.Worksheet[] = [];

    if (includeCategories) {
      const categoriesSheet = workbook.addWorksheet('Categories');
      categoriesSheet.columns = [
        { header: 'Category Name', key: 'categoryName', width: 28 },
        { header: 'Category Prefix', key: 'categoryPrefix', width: 18 },
        { header: 'Scope', key: 'scope', width: 14 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Product Count', key: 'productCount', width: 16 },
        { header: 'Updated At', key: 'updatedAt', width: 24 },
      ];
      categories.forEach((category) => {
        categoriesSheet.addRow({
          categoryName: category.name,
          categoryPrefix: category.codePrefix,
          scope: category.scope,
          status: category.status,
          productCount: category._count.products,
          updatedAt: category.updatedAt.toISOString(),
        });
      });
      sheets.push(categoriesSheet);
    }

    if (includeProducts) {
      const productsSheet = workbook.addWorksheet('Products');
      productsSheet.columns = [
        { header: 'Product Code', key: 'productCode', width: 18 },
        { header: 'Product Name EN', key: 'productNameEn', width: 34 },
        { header: 'Product Name ZH', key: 'productNameZh', width: 34 },
        { header: 'Category Name', key: 'categoryName', width: 28 },
        { header: 'Category Prefix', key: 'categoryPrefix', width: 18 },
        { header: 'Days To Expire', key: 'daysToExpire', width: 16 },
        { header: 'Hours To Expire', key: 'hoursToExpire', width: 17 },
        { header: 'Storage Method EN', key: 'storageMethodEn', width: 22 },
        { header: 'Storage Method ZH', key: 'storageMethodZh', width: 22 },
        { header: 'Image Status', key: 'imageStatus', width: 16 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Updated At', key: 'updatedAt', width: 24 },
      ];
      products.forEach((product) => {
        productsSheet.addRow({
          productCode: product.productCode,
          productNameEn: product.nameEn,
          productNameZh: product.nameZh,
          categoryName: product.category.name,
          categoryPrefix: product.category.codePrefix,
          daysToExpire: product.daysToExpire,
          hoursToExpire: product.hoursToExpire,
          storageMethodEn: product.storageMethodEn,
          storageMethodZh: product.storageMethodZh,
          imageStatus: product.imageStatus,
          status: product.active ? 'ACTIVE' : 'INACTIVE',
          updatedAt: product.updatedAt.toISOString(),
        });
      });
      sheets.push(productsSheet);
    }

    sheets.forEach((sheet) => {
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF4EE' } };
    });

    const fileNamePrefix = includeCategories && includeProducts ? 'categories-products' : includeCategories ? 'categories' : 'products';
    const fileName = `${fileNamePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    const buffer = await workbook.xlsx.writeBuffer();
    response.send(Buffer.from(buffer));
  }

  @Get('audit-log')
  async auditLog(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    return this.prisma.auditLog.findMany({
      where: { companyId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('devices-printers')
  async devicesPrinters(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    const [company, devices] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { maxPrinterConnections: true },
      }),
      this.prisma.device.findMany({
      where: { companyId },
      include: { outlet: true },
      orderBy: { deviceName: 'asc' },
      }),
    ]);
    const connectedPrinterKeys = new Set(
      devices
        .filter((device) => device.status !== 'INACTIVE')
        .map((device) => device.printerMacAddress ?? device.printerBluetoothId ?? device.printerName)
        .filter((value): value is string => Boolean(value?.trim())),
    );

    return {
      printerQuota: {
        connectedPrinters: connectedPrinterKeys.size,
        maxPrinterConnections: company?.maxPrinterConnections ?? null,
        isUnlimited: company?.maxPrinterConnections === null,
      },
      devices,
    };
  }

  @Patch('devices-printers/:deviceId')
  async updateDevice(@Req() request: AuthenticatedRequest, @Param('deviceId') deviceId: string, @Body() body: { status?: 'ACTIVE' | 'OFFLINE' | 'NEEDS_SETUP' | 'INACTIVE' }) {
    const companyId = await this.companyId(request);
    const device = await this.prisma.device.findFirst({ where: { id: deviceId, companyId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return this.prisma.device.update({
      where: { id: deviceId },
      data: body,
    });
  }

  @Get('print-analytics/monthly')
  async monthlyPrintAnalytics(@Req() request: AuthenticatedRequest, @Query('month') month?: string) {
    const companyId = await this.companyId(request);
    return {
      month: month ?? '2026-06',
      totals: await this.reporting.monthlyStickerTotals(companyId, month ?? '2026-06'),
    };
  }

  @Get('print-analytics/jobs')
  async printJobs(@Req() request: AuthenticatedRequest) {
    const companyId = await this.companyId(request);
    return this.prisma.printJob.findMany({
      where: { companyId },
      include: { outlet: true, device: true },
      orderBy: { printedAt: 'desc' },
      take: 100,
    });
  }

  @Post('print-analytics/email-schedule')
  async schedulePrintAnalyticsEmail(@Req() request: AuthenticatedRequest, @Body() body: { month?: string }) {
    const companyId = await this.companyId(request);
    const month = body.month ?? 'current';
    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId: request.user?.sub,
        action: 'PRINT_ANALYTICS_EMAIL_SCHEDULED',
        recordType: 'PrintAnalytics',
        recordId: month,
        risk: 'low',
      },
    });

    return {
      status: 'scheduled',
      message: `Monthly report email schedule saved for ${month}.`,
    };
  }
}

function csvIds(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}
