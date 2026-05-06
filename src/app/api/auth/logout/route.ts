import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true }, { headers: corsMobile(req) });
}
