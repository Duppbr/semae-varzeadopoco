import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401, headers: corsMobile(req) });
  }

  const atalhos = await prisma.atalho.findMany({
    where: { ativo: true },
    orderBy: { posicao: 'asc' },
  });
  return NextResponse.json(atalhos, { headers: corsMobile(req) });
}
