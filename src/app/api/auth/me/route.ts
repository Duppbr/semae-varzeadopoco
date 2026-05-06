import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) { return optionsResponse(req); }

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ isLoggedIn: false }, { status: 401, headers: corsMobile(req) });
  return NextResponse.json({
    isLoggedIn: true,
    id: session.userId,
    identificador: session.identificador,
    nome: session.nome,
    role: session.role,
    protegido: session.protegido,
  }, { headers: corsMobile(req) });
}
