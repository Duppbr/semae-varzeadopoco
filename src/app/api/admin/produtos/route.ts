import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }
  const lojaId = req.nextUrl.searchParams.get('lojaId');
  if (!lojaId) return NextResponse.json({ erro: 'lojaId obrigatório' }, { status: 400 });
  const produtos = await prisma.produtoLoja.findMany({
    where: { lojaId: parseInt(lojaId) },
    include: { produto: true },
    orderBy: { produto: { nome: 'asc' } },
  });
  return NextResponse.json(produtos);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }
  const body = await req.json();
  const { id, precoCartao, precoCartao3x, precoAvista, precoAvistaMinimo, quantidadeEstoque, ativo, prioridade } = body;
  const data: any = {};
  if (precoCartao !== undefined) data.precoCartao = precoCartao;
  if (precoCartao3x !== undefined) data.precoCartao3x = precoCartao3x;
  if (precoAvista !== undefined) data.precoAvista = precoAvista;
  if (precoAvistaMinimo !== undefined) data.precoAvistaMinimo = precoAvistaMinimo;
  if (quantidadeEstoque !== undefined) data.quantidadeEstoque = quantidadeEstoque;
  if (ativo !== undefined) data.ativo = ativo;
  if (prioridade !== undefined) data.prioridade = prioridade;
  const updated = await prisma.produtoLoja.update({ where: { id }, data });
  return NextResponse.json(updated);
}