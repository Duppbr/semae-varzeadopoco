import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';
  const allowed = ['capacitor://localhost', 'http://localhost:3000'];
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401, headers: corsHeaders(req) });
  }
  return NextResponse.json({
    isLoggedIn: true,
    id: session.userId,
    identificador: session.identificador,
    nome: session.nome,
    role: session.role,
    lojaId: session.lojaId,
    protegido: session.protegido,
  }, { headers: corsHeaders(req) });
}
