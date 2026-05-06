import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

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
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401, headers: corsHeaders(req) });
  }

  const lojaId = req.nextUrl.searchParams.get('lojaId');
  if (!lojaId) {
    return NextResponse.json({ erro: 'lojaId obrigatório' }, { status: 400, headers: corsHeaders(req) });
  }

  const produtosLoja = await prisma.produtoLoja.findMany({
    where: {
      lojaId: parseInt(lojaId),
      ativo: true,
    },
    include: { produto: true },
    orderBy: { produto: { nome: 'asc' } },
  });

  const formatados = produtosLoja.map(pl => ({
    produto: {
      id: pl.produto.id,
      sku: pl.produto.sku,
      nome: pl.produto.nome,
      marca: pl.produto.marca,
      amperagem: pl.produto.amperagem,
      tipo: pl.produto.tipo,
      cca: pl.produto.cca,
      garantia: pl.produto.garantia,
    },
    precoCartao: pl.precoCartao,
    precoCartao3x: pl.precoCartao3x,
    precoAvista: pl.precoAvista,
    precoAvistaMinimo: pl.precoAvistaMinimo,
    quantidadeEstoque: pl.quantidadeEstoque,
    prioridade: pl.prioridade,
  }));

  return NextResponse.json(formatados, { headers: corsHeaders(req) });
}
