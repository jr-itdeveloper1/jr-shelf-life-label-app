import { Injectable } from '@nestjs/common';
import { LabelType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultCompanyId() {
    const company = await this.prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!company) {
      throw new Error('Seed company not found');
    }
    return company.id;
  }

  async monthlyStickerTotals(companyId: string, month = currentMonth(), outletIds?: string[]) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const jobs = await this.prisma.printJob.findMany({
      where: {
        companyId,
        ...(outletIds ? { outletId: { in: outletIds } } : {}),
        printedAt: { gte: start, lt: end },
      },
      include: {
        outlet: true,
      },
    });

    const byOutlet = new Map<string, {
      outletId: string;
      outletName: string;
      productLabel60x40: number;
      compactProductLabel40x20: number;
      timestampLabel40x30: number;
      totalStickers: number;
      topPrinterName: string;
      printerCounts: Map<string, number>;
    }>();

    jobs.forEach((job) => {
      const current = byOutlet.get(job.outletId) ?? {
        outletId: job.outletId,
        outletName: job.outlet.name,
        productLabel60x40: 0,
        compactProductLabel40x20: 0,
        timestampLabel40x30: 0,
        totalStickers: 0,
        topPrinterName: job.printerName ?? 'Unknown',
        printerCounts: new Map<string, number>(),
      };

      if (job.labelType === LabelType.PRODUCT) {
        current.productLabel60x40 += job.quantity;
      }

      if (job.labelType === LabelType.COMPACT_PRODUCT) {
        current.compactProductLabel40x20 += job.quantity;
      }

      if (job.labelType === LabelType.TIMESTAMP) {
        current.timestampLabel40x30 += job.quantity;
      }

      current.totalStickers += job.quantity;
      const printerName = job.printerName ?? 'Unknown';
      current.printerCounts.set(printerName, (current.printerCounts.get(printerName) ?? 0) + job.quantity);
      current.topPrinterName = [...current.printerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';
      byOutlet.set(job.outletId, current);
    });

    return [...byOutlet.values()].map(({ printerCounts: _printerCounts, ...row }) => row);
  }

  statusLabel(value: string) {
    return value.toLowerCase().replace(/_/g, ' ');
  }
}

export function currentMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
