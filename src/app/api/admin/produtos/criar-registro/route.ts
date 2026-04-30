import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }
  const { produtoId, lojaId } = await req.json();
  const existente = await prisma.produtoLoja.findUnique({
    where: { produtoId_lojaId: { produtoId, lojaId } },
  });
  if (existente) return NextResponse.json(existente);
  const novo = await prisma.produtoLoja.create({
    data: {
      produtoId,
      lojaId,
      precoCartao: null,
      precoCartao3x: null,
      precoAvista: null,
      precoAvistaMinimo: null,
      quantidadeEstoque: 0,
      ativo: true,
      prioridade: 'verde',
    },
    include: { produto: true },
  });
  return NextResponse.json(novo);
}