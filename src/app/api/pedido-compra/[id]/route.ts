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

    const pedido = await prisma.pedidoCompra.findUnique({
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

    if (!pedido) {
      return NextResponse.json(
        { erro: 'Pedido de compra não encontrado.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    return NextResponse.json(pedido, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao buscar pedido de compra:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao buscar pedido de compra.' },
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
    const { status } = body as { status: 'RASCUNHO' | 'ENVIADO' | 'ATENDIDO' | 'CANCELADO' };

    const statusValidos = ['RASCUNHO', 'ENVIADO', 'ATENDIDO', 'CANCELADO'];
    if (!status || !statusValidos.includes(status)) {
      return NextResponse.json(
        { erro: `Status inválido. Valores aceitos: ${statusValidos.join(', ')}.` },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const pedidoExistente = await prisma.pedidoCompra.findUnique({ where: { id } });
    if (!pedidoExistente) {
      return NextResponse.json(
        { erro: 'Pedido de compra não encontrado.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    const pedido = await prisma.pedidoCompra.update({
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
      entidade: 'PedidoCompra',
      entidadeId: id,
      resumo: `Status do pedido nº ${pedido.numero} alterado de "${pedidoExistente.status}" para "${status}".`,
      detalhes: { statusAnterior: pedidoExistente.status, statusNovo: status },
    });

    return NextResponse.json(pedido, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido de compra:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao atualizar status do pedido de compra.' },
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

    const pedido = await prisma.pedidoCompra.findUnique({
      where: { id },
      select: { id: true, numero: true },
    });

    if (!pedido) {
      return NextResponse.json(
        { erro: 'Pedido de compra não encontrado.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    await prisma.pedidoCompra.delete({ where: { id } });

    await registrarAuditoria({
      session,
      req,
      acao: 'EXCLUIR',
      entidade: 'PedidoCompra',
      entidadeId: id,
      resumo: `Pedido de compra nº ${pedido.numero} excluído.`,
      detalhes: { numero: pedido.numero },
    });

    return NextResponse.json(
      { mensagem: 'Pedido de compra excluído.' },
      { headers: corsMobile(req) }
    );
  } catch (error) {
    console.error('Erro ao excluir pedido de compra:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao excluir pedido de compra.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
