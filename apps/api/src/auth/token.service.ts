import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { UserRole } from '@prisma/client';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  exp: number;
};

@Injectable()
export class TokenService {
  private readonly secret = process.env.AUTH_TOKEN_SECRET ?? 'dev-only-change-me';

  sign(payload: Omit<AuthTokenPayload, 'exp'>, ttlSeconds = 60 * 60 * 8) {
    const tokenPayload: AuthTokenPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = this.signature(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(token: string) {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const expectedSignature = this.signature(encodedPayload);
    if (!safeEqual(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid access token signature.');
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Access token expired.');
    }

    return payload;
  }

  private signature(encodedPayload: string) {
    return createHmac('sha256', this.secret).update(encodedPayload).digest('base64url');
  }
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
