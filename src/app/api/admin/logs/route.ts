import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin' || !session.protegido) {
    return NextResponse.json({ erro: 'Apenas o admin master pode ver os logs.' }, { status: 403 });
  }

  const search = req.nextUrl.searchParams;
  const acao = search.get('acao') || undefined;
  const status = search.get('status') || undefined;
  const usuario = search.get('usuario') || undefined;
  const take = Math.min(parseInt(search.get('take') || '100'), 300);

  const logs = await prisma.auditoria.findMany({
    where: {
      ...(acao ? { acao } : {}),
      ...(status ? { status } : {}),
      ...(usuario ? {
        OR: [
          { usuarioNome: { contains: usuario, mode: 'insensitive' } },
          { usuarioIdentificador: { contains: usuario, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return NextResponse.json(logs);
}
