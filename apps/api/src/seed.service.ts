import { Injectable } from '@nestjs/common';
import { DeviceStatus, LabelType, Prisma, UploadStatus } from '@prisma/client';
import { hashPassword } from './auth/password';
import { PrismaService } from './prisma.service';

export const DEFAULT_ADMIN_PASSWORD = 'ChangeMe123!';

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeedData() {
    const defaultPasswordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    const count = await this.prisma.company.count();
    if (count > 0) {
      await this.backfillDemoPasswords(defaultPasswordHash);
      await this.ensureDemoOutletUsers(defaultPasswordHash);
      return;
    }

    const siteAdmin = await this.prisma.user.create({
      data: {
        name: 'Site Admin',
        email: 'site.admin@jrlabels.example',
        passwordHash: defaultPasswordHash,
        role: 'SITE_ADMIN',
      },
    });

    const company = await this.prisma.company.create({
      data: {
        name: 'JR Foods',
        code: 'JRFOODS',
        status: 'ACTIVE',
        maxPrinterConnections: 10,
      },
    });

    const [companyAdmin, centralKitchen, orchard, tampines, jurong] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          companyId: company.id,
          name: 'Grace Tan',
          email: 'grace@jrfoods.example',
          passwordHash: defaultPasswordHash,
          role: 'COMPANY_ADMIN',
        },
      }),
      this.prisma.outlet.create({
        data: { companyId: company.id, name: 'Central Kitchen', code: 'OUT-CK', shortCode: 'CK' },
      }),
      this.prisma.outlet.create({
        data: { companyId: company.id, name: 'Orchard Outlet', code: 'OUT-ORC', shortCode: 'ORC' },
      }),
      this.prisma.outlet.create({
        data: { companyId: company.id, name: 'Tampines Outlet', code: 'OUT-TMP', shortCode: 'TMP' },
      }),
      this.prisma.outlet.create({
        data: { companyId: company.id, name: 'Jurong Outlet', code: 'OUT-JUR', shortCode: 'JUR' },
      }),
    ]);

    await this.prisma.user.createMany({
      data: [
        {
          companyId: company.id,
          name: 'CK Shift Lead',
          email: 'cklead@jrfoods.example',
          passwordHash: defaultPasswordHash,
          role: 'OUTLET_USER',
        },
        {
          companyId: company.id,
          name: 'Tampines Staff',
          email: 'tmp@jrfoods.example',
          passwordHash: defaultPasswordHash,
          role: 'OUTLET_USER',
        },
        {
          companyId: company.id,
          name: 'Orchard Staff',
          email: 'orchard@jrfoods.example',
          passwordHash: defaultPasswordHash,
          role: 'OUTLET_USER',
        },
      ],
    });

    await this.ensureDemoOutletUsers(defaultPasswordHash);

    await this.prisma.userOutletAccess.create({
      data: {
        userId: companyAdmin.id,
        outletId: centralKitchen.id,
      },
    });

    const [eggs, readyToEat, dairy, sauces] = await this.prisma.$transaction([
      this.prisma.productCategory.create({ data: { companyId: company.id, name: 'Eggs', codePrefix: 'EG' } }),
      this.prisma.productCategory.create({ data: { companyId: company.id, name: 'Ready To Eat', codePrefix: 'RTE' } }),
      this.prisma.productCategory.create({ data: { companyId: company.id, name: 'Dairy', codePrefix: 'DY' } }),
      this.prisma.productCategory.create({ data: { companyId: company.id, name: 'Sauces', codePrefix: 'SE' } }),
    ]);

    const products = await Promise.all([
      this.prisma.product.create({
        data: {
          companyId: company.id,
          categoryId: eggs.id,
          productCode: 'EG001',
          nameEn: 'Pasteurized Liquid Egg',
          nameZh: 'Chinese name stored',
          daysToExpire: 1,
          hoursToExpire: 0,
          storageMethodEn: 'Chilled',
          storageMethodZh: 'Chilled translation stored',
          imageStatus: 'ready',
        },
      }),
      this.prisma.product.create({
        data: {
          companyId: company.id,
          categoryId: readyToEat.id,
          productCode: 'RTE002',
          nameEn: 'Cooked Food',
          nameZh: 'Chinese name stored',
          daysToExpire: 0,
          hoursToExpire: 4,
          storageMethodEn: 'Hot',
          storageMethodZh: 'Hot translation stored',
          imageStatus: 'ready',
        },
      }),
      this.prisma.product.create({
        data: {
          companyId: company.id,
          categoryId: dairy.id,
          productCode: 'DY005',
          nameEn: 'Butter / Margarine',
          nameZh: 'Chinese name stored',
          daysToExpire: 7,
          hoursToExpire: 0,
          storageMethodEn: 'Chilled',
          storageMethodZh: 'Chilled translation stored',
          imageStatus: 'missing',
        },
      }),
      this.prisma.product.create({
        data: {
          companyId: company.id,
          categoryId: sauces.id,
          productCode: 'SE004',
          nameEn: 'Sauces in Use',
          nameZh: 'Chinese name stored',
          daysToExpire: 1,
          hoursToExpire: 0,
          storageMethodEn: 'Ambient',
          storageMethodZh: 'Ambient translation stored',
          active: false,
        },
      }),
    ]);

    for (const outlet of [centralKitchen, orchard, tampines, jurong]) {
      for (const product of products) {
        await this.prisma.outletProduct.create({
          data: {
            outletId: outlet.id,
            productId: product.id,
            active: product.active,
          },
        });
      }
    }

    const devices = await Promise.all([
      this.prisma.device.create({
        data: {
          companyId: company.id,
          outletId: centralKitchen.id,
          deviceName: 'CK-01 Android',
          appVersion: '0.2.0',
          deviceIdentifier: 'ck-01',
          printerName: 'M324F-CK',
          printerMacAddress: '58:93:D8:11:2A:91',
          lastPrinterConnectedAt: new Date(),
          lastSyncedAt: new Date(),
          status: DeviceStatus.ACTIVE,
        },
      }),
      this.prisma.device.create({
        data: {
          companyId: company.id,
          outletId: orchard.id,
          deviceName: 'ORC-02 Android',
          appVersion: '0.2.0',
          deviceIdentifier: 'orc-02',
          printerName: 'Gainscha-ORC',
          printerMacAddress: '58:93:D8:11:2B:04',
          lastPrinterConnectedAt: new Date(),
          lastSyncedAt: new Date(),
          status: DeviceStatus.ACTIVE,
        },
      }),
      this.prisma.device.create({
        data: {
          companyId: company.id,
          outletId: tampines.id,
          deviceName: 'TMP-01 Android',
          appVersion: '0.2.0',
          deviceIdentifier: 'tmp-01',
          printerName: 'M324F-TMP',
          printerMacAddress: '58:93:D8:11:2C:77',
          lastPrinterConnectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          lastSyncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: DeviceStatus.OFFLINE,
        },
      }),
      this.prisma.device.create({
        data: {
          companyId: company.id,
          outletId: jurong.id,
          deviceName: 'JUR-01 Android',
          appVersion: '0.2.0',
          deviceIdentifier: 'jur-01',
          status: DeviceStatus.NEEDS_SETUP,
        },
      }),
    ]);

    const printJobs: Prisma.PrintJobCreateManyInput[] = [];
    const monthStart = new Date('2026-06-01T08:00:00.000Z');
    const rows = [
      [centralKitchen.id, devices[0].id, products[0].id, 'EG001', 'Pasteurized Liquid Egg', LabelType.PRODUCT, '60x40', 2184, 'M324F-CK', '58:93:D8:11:2A:91'],
      [centralKitchen.id, devices[0].id, products[2].id, 'DY005', 'Butter / Margarine', LabelType.COMPACT_PRODUCT, '40x20', 940, 'M324F-CK', '58:93:D8:11:2A:91'],
      [centralKitchen.id, devices[0].id, products[1].id, 'RTE002', 'Cooked Food', LabelType.TIMESTAMP, '40x30', 388, 'M324F-CK', '58:93:D8:11:2A:91'],
      [orchard.id, devices[1].id, products[0].id, 'EG001', 'Pasteurized Liquid Egg', LabelType.PRODUCT, '60x40', 1336, 'Gainscha-ORC', '58:93:D8:11:2B:04'],
      [orchard.id, devices[1].id, products[2].id, 'DY005', 'Butter / Margarine', LabelType.COMPACT_PRODUCT, '40x20', 512, 'Gainscha-ORC', '58:93:D8:11:2B:04'],
      [orchard.id, devices[1].id, products[1].id, 'RTE002', 'Cooked Food', LabelType.TIMESTAMP, '40x30', 420, 'Gainscha-ORC', '58:93:D8:11:2B:04'],
      [tampines.id, devices[2].id, products[0].id, 'EG001', 'Pasteurized Liquid Egg', LabelType.PRODUCT, '60x40', 1104, 'M324F-TMP', '58:93:D8:11:2C:77'],
      [tampines.id, devices[2].id, products[2].id, 'DY005', 'Butter / Margarine', LabelType.COMPACT_PRODUCT, '40x20', 361, 'M324F-TMP', '58:93:D8:11:2C:77'],
      [tampines.id, devices[2].id, products[1].id, 'RTE002', 'Cooked Food', LabelType.TIMESTAMP, '40x30', 292, 'M324F-TMP', '58:93:D8:11:2C:77'],
      [jurong.id, devices[3].id, products[0].id, 'EG001', 'Pasteurized Liquid Egg', LabelType.PRODUCT, '60x40', 712, 'M324F-JUR', '58:93:D8:11:2D:09'],
      [jurong.id, devices[3].id, products[2].id, 'DY005', 'Butter / Margarine', LabelType.COMPACT_PRODUCT, '40x20', 276, 'M324F-JUR', '58:93:D8:11:2D:09'],
      [jurong.id, devices[3].id, products[1].id, 'RTE002', 'Cooked Food', LabelType.TIMESTAMP, '40x30', 145, 'M324F-JUR', '58:93:D8:11:2D:09'],
    ] as const;

    rows.forEach((row, index) => {
      printJobs.push({
        clientJobId: `seed-${index}`,
        companyId: company.id,
        outletId: row[0],
        deviceId: row[1],
        productId: row[2],
        productCodeSnapshot: row[3],
        productNameSnapshot: row[4],
        labelType: row[5],
        labelSize: row[6],
        quantity: row[7],
        printerName: row[8],
        printerMacAddress: row[9],
        printedAt: new Date(monthStart.getTime() + index * 60 * 60 * 1000),
        uploadStatus: index === 2 ? UploadStatus.PENDING : UploadStatus.UPLOADED,
      });
    });

    await this.prisma.printJob.createMany({ data: printJobs });

    await this.prisma.auditLog.createMany({
      data: [
        {
          companyId: company.id,
          actorId: companyAdmin.id,
          action: 'Updated shelf life for EG001',
          recordType: 'Product',
          recordId: products[0].id,
          risk: 'medium',
        },
        {
          companyId: company.id,
          actorId: siteAdmin.id,
          action: 'Created company JR Foods',
          recordType: 'Company',
          recordId: company.id,
          risk: 'low',
        },
        {
          companyId: company.id,
          action: 'Device uploaded print jobs',
          recordType: 'PrintJob',
          risk: 'low',
        },
      ],
    });
  }

  private async backfillDemoPasswords(passwordHash: string) {
    await this.prisma.user.updateMany({
      where: {
        email: { in: ['site.admin@jrlabels.example', 'grace@jrfoods.example', 'cklead@jrfoods.example', 'tmp@jrfoods.example', 'orchard@jrfoods.example'] },
        passwordHash: null,
      },
      data: { passwordHash },
    });
  }

  private async ensureDemoOutletUsers(passwordHash: string) {
    const company = await this.prisma.company.findUnique({ where: { code: 'JRFOODS' } });
    if (!company) return;

    const [centralKitchen, jurong, tampines, orchard] = await Promise.all([
      this.prisma.outlet.findFirst({ where: { companyId: company.id, code: 'OUT-CK' } }),
      this.prisma.outlet.findFirst({ where: { companyId: company.id, code: 'OUT-JUR' } }),
      this.prisma.outlet.findFirst({ where: { companyId: company.id, code: 'OUT-TMP' } }),
      this.prisma.outlet.findFirst({ where: { companyId: company.id, code: 'OUT-ORC' } }),
    ]);
    const [ckLead, tmpStaff, orchardStaff] = await Promise.all([
      this.prisma.user.upsert({
        where: { email: 'cklead@jrfoods.example' },
        create: { companyId: company.id, name: 'CK Shift Lead', email: 'cklead@jrfoods.example', passwordHash, role: 'OUTLET_USER', status: 'ACTIVE' },
        update: { companyId: company.id, passwordHash, role: 'OUTLET_USER', status: 'ACTIVE' },
      }),
      this.prisma.user.upsert({
        where: { email: 'tmp@jrfoods.example' },
        create: { companyId: company.id, name: 'Tampines Staff', email: 'tmp@jrfoods.example', passwordHash, role: 'OUTLET_USER', status: 'ACTIVE' },
        update: { companyId: company.id, passwordHash, role: 'OUTLET_USER', status: 'ACTIVE' },
      }),
      this.prisma.user.upsert({
        where: { email: 'orchard@jrfoods.example' },
        create: { companyId: company.id, name: 'Orchard Staff', email: 'orchard@jrfoods.example', passwordHash, role: 'OUTLET_USER', status: 'ACTIVE' },
        update: { companyId: company.id, passwordHash, role: 'OUTLET_USER', status: 'ACTIVE' },
      }),
    ]);

    if (ckLead) {
      for (const outlet of [centralKitchen, jurong].filter(Boolean)) {
        await this.prisma.userOutletAccess.upsert({
          where: { userId_outletId: { userId: ckLead.id, outletId: outlet!.id } },
          create: { userId: ckLead.id, outletId: outlet!.id },
          update: {},
        });
      }
    }

    if (tmpStaff && tampines) {
      await this.prisma.userOutletAccess.upsert({
        where: { userId_outletId: { userId: tmpStaff.id, outletId: tampines.id } },
        create: { userId: tmpStaff.id, outletId: tampines.id },
        update: {},
      });
    }

    if (orchardStaff && orchard) {
      await this.prisma.userOutletAccess.upsert({
        where: { userId_outletId: { userId: orchardStaff.id, outletId: orchard.id } },
        create: { userId: orchardStaff.id, outletId: orchard.id },
        update: {},
      });
    }
  }
}
