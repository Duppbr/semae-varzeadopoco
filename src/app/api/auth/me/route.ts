// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }
  return NextResponse.json({
    isLoggedIn: true,
    id: session.userId,
    identificador: session.identificador,
    nome: session.nome,
    role: session.role,
    lojaId: session.lojaId,
    protegido: session.protegido,
  });
}
