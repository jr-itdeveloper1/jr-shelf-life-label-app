import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params, 'PATCH');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params, 'POST');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params, 'GET');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params, 'DELETE');
}

async function proxy(request: NextRequest, paramsPromise: Promise<{ path: string[] }>, method: 'GET' | 'PATCH' | 'POST' | 'DELETE') {
  const params = await paramsPromise;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('jr_access_token')?.value;
  const bearerToken = request.headers.get('authorization');
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else if (bearerToken) {
    headers.set('Authorization', bearerToken);
  }

  const response = await fetch(`${API_BASE_URL}/${params.path.join('/')}${request.nextUrl.search}`, {
    method,
    headers,
    body: method === 'GET' || method === 'DELETE' ? undefined : await request.arrayBuffer(),
  });

  const body = await response.arrayBuffer();
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', response.headers.get('content-type') ?? 'application/json');
  const contentDisposition = response.headers.get('content-disposition');
  if (contentDisposition) responseHeaders.set('Content-Disposition', contentDisposition);

  return new NextResponse(body, {
    status: response.status,
    headers: responseHeaders,
  });
}
