import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
  }));

  return NextResponse.json(formatados);
}