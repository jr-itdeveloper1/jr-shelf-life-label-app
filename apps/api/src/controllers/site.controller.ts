import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { CompanyStatus, Prisma } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../auth/simple-auth.guard';
import { PrismaService } from '../prisma.service';

@Controller('site')
@Roles('SITE_ADMIN')
export class SiteController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async dashboard() {
    const [companies, outlets, devices, printJobs, auditEvents] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.outlet.count(),
      this.prisma.device.count({ where: { status: { not: 'INACTIVE' } } }),
      this.prisma.printJob.count(),
      this.prisma.auditLog.count(),
    ]);

    return {
      metrics: { companies, outlets, devices, printJobs, auditEvents },
      workQueue: [
        { label: 'Review failed device sync uploads', status: '3 open', kind: 'warn' },
        { label: 'Complete restore drill checklist', status: 'Due', kind: 'warn' },
        { label: 'Approve new company setup', status: '1 pending', kind: 'ok' },
      ],
      health: {
        api: 'Healthy',
        postgres: 'Healthy',
        backup: 'Latest backup 02:00',
        storage: '42% used',
      },
    };
  }

  @Get('companies')
  async companies(@Query('search') search?: string) {
    return this.prisma.company.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { users: true, outlets: true, products: true, printJobs: true, devices: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post('companies')
  async createCompany(@Req() request: AuthenticatedRequest, @Body() body: { name: string; code: string; status?: CompanyStatus; maxPrinterConnections?: number | null }) {
    if (body.status && !Object.values(CompanyStatus).includes(body.status)) throw new BadRequestException('Invalid company status');
    try {
      const company = await this.prisma.company.create({
        data: {
          name: this.boundedText(body.name, 'Company name', 2, 120),
          code: this.codeText(body.code, 'Company code', 2, 24),
          status: body.status ?? CompanyStatus.SETUP,
          maxPrinterConnections:
            body.maxPrinterConnections === undefined
              ? 10
              : this.printerLimit(body.maxPrinterConnections),
        },
      });
      await this.prisma.auditLog.create({
        data: { companyId: company.id, actorId: request.user?.sub, action: 'COMPANY_CREATED', recordType: 'Company', recordId: company.id, risk: 'medium' },
      });
      return { data: company, message: 'Company created' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Company code must be unique.');
      }
      throw error;
    }
  }

  @Get('companies/:companyId')
  async company(@Param('companyId') companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: true,
        outlets: true,
        _count: { select: { products: true, printJobs: true, devices: true } },
      },
    });
  }

  @Patch('companies/:companyId')
  async updateCompany(
    @Req() request: AuthenticatedRequest,
    @Param('companyId') companyId: string,
    @Body() body: { name?: string; code?: string; status?: CompanyStatus; maxPrinterConnections?: number | null },
  ) {
    const data: Prisma.CompanyUpdateInput = {};
    if (body.name !== undefined) data.name = this.boundedText(body.name, 'Company name', 2, 120);
    if (body.code !== undefined) data.code = this.codeText(body.code, 'Company code', 2, 24);
    if (body.status !== undefined) {
      if (!Object.values(CompanyStatus).includes(body.status)) throw new BadRequestException('Invalid company status');
      data.status = body.status;
    }
    if (body.maxPrinterConnections !== undefined) {
      data.maxPrinterConnections = this.printerLimit(body.maxPrinterConnections);
    }

    try {
      const company = await this.prisma.company.update({ where: { id: companyId }, data });
      await this.prisma.auditLog.create({
        data: { companyId, actorId: request.user?.sub, action: 'COMPANY_UPDATED', recordType: 'Company', recordId: companyId, risk: company.status === CompanyStatus.DISABLED ? 'high' : 'medium' },
      });
      return { data: company, message: 'Company saved' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Company code must be unique.');
      }
      throw error;
    }
  }

  @Get('company-admins')
  async companyAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'COMPANY_ADMIN' },
      include: { company: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('audit-log')
  async auditLog() {
    return this.prisma.auditLog.findMany({
      include: { company: true, actor: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('system-health')
  async systemHealth() {
    return {
      api: { status: 'Healthy', p95Ms: 124 },
      postgres: { status: 'Healthy', persistence: 'postgres_data volume mounted' },
      backup: { latest: '02:00', status: 'Completed', retentionDays: 14 },
      disk: { usedPercent: 42 },
      restoreChecklist: ['Start clean PostgreSQL test volume', 'Restore latest pg_dump', 'Start API', 'Verify tenant data'],
    };
  }

  @Post('backups/run')
  runBackup() {
    return { status: 'queued', message: 'Manual backup queued in mock API.' };
  }

  private boundedText(value: string, label: string, min: number, max: number) {
    const trimmed = value?.trim();
    if (!trimmed) throw new BadRequestException(`${label} is required`);
    if (trimmed.length < min || trimmed.length > max) throw new BadRequestException(`${label} must be ${min}-${max} characters`);
    return trimmed;
  }

  private codeText(value: string, label: string, min: number, max: number) {
    const text = this.boundedText(value, label, min, max).toUpperCase();
    if (!/^[A-Z0-9-]+$/.test(text)) throw new BadRequestException(`${label} can only contain uppercase letters, numbers, and hyphens`);
    return text;
  }

  private boundedInt(value: unknown, label: string, min: number, max: number) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) {
      throw new BadRequestException(`${label} must be an integer from ${min} to ${max}`);
    }
    return number;
  }

  private printerLimit(value: unknown) {
    if (value === null) {
      return null;
    }
    return this.boundedInt(value, 'Max printer connections', 1, 999);
  }
}
