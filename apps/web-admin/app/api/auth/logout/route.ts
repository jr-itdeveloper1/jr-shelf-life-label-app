import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('jr_access_token');
  response.cookies.delete('jr_user_role');
  return response;
}
