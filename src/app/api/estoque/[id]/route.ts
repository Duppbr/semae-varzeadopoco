import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const { id: produtoId } = await params;
    const body = await req.json();
    const { quantidade, motivo } = body as { quantidade: number; motivo?: string };

    if (quantidade === undefined || quantidade === null || isNaN(Number(quantidade))) {
      return NextResponse.json(
        { erro: 'Campo obrigatório: quantidade (número).' },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: { id: true, nome: true },
    });

    if (!produto) {
      return NextResponse.json(
        { erro: 'Produto não encontrado.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    const estoqueAnterior = await prisma.estoque.findUnique({
      where: { produtoId },
    });

    const quantidadeAnterior = estoqueAnterior?.quantidade ?? 0;

    const estoque = await prisma.estoque.upsert({
      where: { produtoId },
      update: { quantidade: Number(quantidade) },
      create: { produtoId, quantidade: Number(quantidade) },
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'AJUSTE_ESTOQUE',
      entidade: 'Estoque',
      entidadeId: produtoId,
      resumo: `Estoque de "${produto.nome}" ajustado manualmente de ${quantidadeAnterior} para ${quantidade}.`,
      detalhes: {
        produtoId,
        produtoNome: produto.nome,
        quantidadeAnterior,
        quantidadeNova: Number(quantidade),
        motivo: motivo || null,
      },
    });

    return NextResponse.json(
      { ...estoque, quantidadeAnterior },
      { headers: corsMobile(req) }
    );
  } catch (error) {
    console.error('Erro ao ajustar estoque:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao ajustar estoque.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
