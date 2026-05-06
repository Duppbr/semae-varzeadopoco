import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const params = req.nextUrl.searchParams;
    const status = params.get('status');

    const pedidos = await prisma.pedidoCompra.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      orderBy: { numero: 'desc' },
      include: {
        escola: { select: { id: true, nome: true, tipo: true } },
        responsavel: { select: { id: true, nome: true, cargo: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
            unidade: { select: { id: true, abreviacao: true } },
          },
        },
      },
    });

    return NextResponse.json(pedidos, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao listar pedidos de compra:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao listar pedidos de compra.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const body = await req.json();
    const { data, escolaId, responsavelId, observacao, itens } = body as {
      data: string;
      escolaId?: string;
      responsavelId?: string;
      observacao?: string;
      itens: { produtoId: string; quantidade: number; unidadeId: string }[];
    };

    if (!data || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios: data, itens (não vazio).' },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const pedido = await prisma.pedidoCompra.create({
      data: {
        data: new Date(data),
        escolaId: escolaId || null,
        responsavelId: responsavelId || null,
        observacao: observacao || null,
        status: 'RASCUNHO',
        itens: {
          create: itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            unidadeId: item.unidadeId,
          })),
        },
      },
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
      acao: 'CRIAR',
      entidade: 'PedidoCompra',
      entidadeId: pedido.id,
      resumo: `Pedido de compra nº ${pedido.numero} criado com ${itens.length} item(ns).`,
      detalhes: { numero: pedido.numero, escolaId, itens },
    });

    return NextResponse.json(pedido, { status: 201, headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao criar pedido de compra:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao criar pedido de compra.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
