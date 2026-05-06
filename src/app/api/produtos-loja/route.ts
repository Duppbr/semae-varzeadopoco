import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const lojaId = req.nextUrl.searchParams.get('lojaId');
  if (!lojaId) {
    return NextResponse.json({ erro: 'lojaId obrigatório' }, { status: 400 });
  }

  const produtosLoja = await prisma.produtoLoja.findMany({
    where: {
      lojaId: parseInt(lojaId),
      ativo: true,
    },
    include: { produto: true },
    orderBy: { produto: { nome: 'asc' } },
  });

  // MUDANÇA: adicionado campo prioridade na resposta para exibir indicador visual
  // no ProdutoCard da tela de consulta (estava faltando, por isso nunca aparecia)
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

  return NextResponse.json(formatados, { headers: CORS });
}