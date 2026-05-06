import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const { id } = await params;

    const saida = await prisma.saida.findUnique({
      where: { id },
      include: {
        escola: { select: { id: true, nome: true, tipo: true, endereco: true } },
        responsavel: { select: { id: true, nome: true, cargo: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
            unidade: { select: { id: true, nome: true, abreviacao: true } },
          },
        },
      },
    });

    if (!saida) {
      return NextResponse.json(
        { erro: 'Saída não encontrada.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    return NextResponse.json(saida, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao buscar saída:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao buscar saída.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: 'PENDENTE' | 'ENTREGUE' | 'CANCELADO' };

    const statusValidos = ['PENDENTE', 'ENTREGUE', 'CANCELADO'];
    if (!status || !statusValidos.includes(status)) {
      return NextResponse.json(
        { erro: `Status inválido. Valores aceitos: ${statusValidos.join(', ')}.` },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const saidaExistente = await prisma.saida.findUnique({ where: { id } });
    if (!saidaExistente) {
      return NextResponse.json(
        { erro: 'Saída não encontrada.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    const saida = await prisma.saida.update({
      where: { id },
      data: { status },
      include: {
        escola: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
            unidade: { select: { id: true, abreviacao: true } },
          },
        },
      },
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'ATUALIZAR',
      entidade: 'Saida',
      entidadeId: id,
      resumo: `Status da saída nº ${saida.numero} alterado de "${saidaExistente.status}" para "${status}".`,
      detalhes: { statusAnterior: saidaExistente.status, statusNovo: status },
    });

    return NextResponse.json(saida, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao atualizar status da saída:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao atualizar status da saída.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const { id } = await params;

    const saida = await prisma.saida.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!saida) {
      return NextResponse.json(
        { erro: 'Saída não encontrada.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Reverter estoque: adicionar de volta o que foi subtraído na saída
      for (const item of saida.itens) {
        await tx.estoque.upsert({
          where: { produtoId: item.produtoId },
          update: { quantidade: { increment: item.quantidade } },
          create: { produtoId: item.produtoId, quantidade: item.quantidade },
        });
      }

      await tx.saida.delete({ where: { id } });
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'EXCLUIR',
      entidade: 'Saida',
      entidadeId: id,
      resumo: `Saída nº ${saida.numero} excluída. Estoque revertido.`,
      detalhes: { numero: saida.numero, itensRevertidos: saida.itens.length },
    });

    return NextResponse.json(
      { mensagem: 'Saída excluída e estoque revertido.' },
      { headers: corsMobile(req) }
    );
  } catch (error) {
    console.error('Erro ao excluir saída:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao excluir saída.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
