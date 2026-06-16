import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { AuthTokenPayload, TokenService } from './token.service';

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthTokenPayload;
};

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = extractBearerToken(Array.isArray(authHeader) ? authHeader[0] : authHeader);

    if (token) {
      request.user = this.tokenService.verify(token);
    }

    if (process.env.REQUIRE_AUTH !== 'true' && !token) {
      return true;
    }

    if (!request.user) {
      throw new UnauthorizedException('Missing authenticated access token.');
    }

    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('User role is not allowed for this endpoint.');
    }

    return true;
  }
}

function extractBearerToken(value?: string) {
  if (!value?.startsWith('Bearer ')) return null;
  return value.slice('Bearer '.length).trim();
}
