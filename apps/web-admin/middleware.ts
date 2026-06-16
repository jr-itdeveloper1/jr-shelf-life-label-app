import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('jr_access_token')?.value;
  const role = request.cookies.get('jr_user_role')?.value;

  if (pathname.startsWith('/company-admin')) {
    if (!token || (role !== 'COMPANY_ADMIN' && role !== 'OUTLET_USER')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (role === 'OUTLET_USER' && !pathname.startsWith('/company-admin/dashboard') && !pathname.startsWith('/company-admin/availability')) {
      return NextResponse.redirect(new URL('/company-admin/dashboard', request.url));
    }
  }

  if (pathname.startsWith('/site-admin') && pathname !== '/site-admin/login') {
    if (!token || role !== 'SITE_ADMIN') {
      return NextResponse.redirect(new URL('/site-admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/company-admin/:path*', '/site-admin/:path*'],
};
