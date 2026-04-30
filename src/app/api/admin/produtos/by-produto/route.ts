import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }
  const produtoId = req.nextUrl.searchParams.get('produtoId');
  const lojaId = req.nextUrl.searchParams.get('lojaId');
  if (!produtoId || !lojaId) {
    return NextResponse.json({ erro: 'produtoId e lojaId obrigatórios' }, { status: 400 });
  }
  const produtoLoja = await prisma.produtoLoja.findUnique({
    where: {
      produtoId_lojaId: {
        produtoId: parseInt(produtoId),
        lojaId: parseInt(lojaId),
      },
    },
    include: { produto: true },
  });
  return NextResponse.json(produtoLoja);
}