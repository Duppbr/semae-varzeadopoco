import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { sku, nome, marca, amperagem, tipo, cca, garantia, precoCartao, precoCartao3x, precoAvista, precoAvistaMinimo, quantidadeEstoque, prioridade, lojaId } = body;

  // Criar produto
  const produto = await prisma.produto.create({
    data: { sku, nome, marca, amperagem, tipo, cca: cca ? parseInt(cca) : null, garantia },
  });

  // Vincular à loja
  await prisma.produtoLoja.create({
    data: {
      produtoId: produto.id,
      lojaId,
      precoCartao: precoCartao ? parseFloat(precoCartao) : null,
      precoCartao3x: precoCartao3x ? parseFloat(precoCartao3x) : null,
      precoAvista: precoAvista ? parseFloat(precoAvista) : null,
      precoAvistaMinimo: precoAvistaMinimo ? parseFloat(precoAvistaMinimo) : null,
      quantidadeEstoque: parseInt(quantidadeEstoque),
      prioridade,
      ativo: true,
    },
  });

  return NextResponse.json({ ok: true });
}