import { Body, Controller, ForbiddenException, Post, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { verifyPassword } from '../auth/password';
import { TokenService } from '../auth/token.service';
import { PrismaService } from '../prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('login')
  async login(@Body() body: { email?: string; password?: string; portal?: 'company' | 'site' | 'mobile' }) {
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';
    const portal = body.portal ?? 'company';
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { company: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User account is not active.');
    }

    if (portal === 'site' && user.role !== UserRole.SITE_ADMIN) {
      throw new ForbiddenException('Use the Company Admin login for this account.');
    }

    if ((portal === 'company' || portal === 'mobile') && user.role !== UserRole.COMPANY_ADMIN && user.role !== UserRole.OUTLET_USER) {
      throw new ForbiddenException('Use the Site Admin login for this account.');
    }

    if (user.company && user.company.status === 'DISABLED') {
      throw new ForbiddenException('Company account is disabled.');
    }

    const accessToken = this.tokenService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      portal === 'mobile' ? 60 * 60 * 24 * 180 : undefined,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: user.company ? { id: user.company.id, name: user.company.name, code: user.company.code } : null,
      },
      accessToken,
    };
  }
}
