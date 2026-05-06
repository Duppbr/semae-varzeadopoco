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
    const limit = parseInt(params.get('limit') ?? '50', 10);
    const offset = parseInt(params.get('offset') ?? '0', 10);
    const escolaId = params.get('escolaId');
    const status = params.get('status');

    const saidas = await prisma.saida.findMany({
      take: limit,
      skip: offset,
      where: {
        ...(escolaId ? { escolaId } : {}),
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

    return NextResponse.json(saidas, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao listar saídas:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao listar saídas.' },
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
    const { data, escolaId, responsavelId, recebedor, observacao, itens } = body as {
      data: string;
      escolaId: string;
      responsavelId?: string;
      recebedor?: string;
      observacao?: string;
      itens: { produtoId: string; quantidade: number; unidadeId: string }[];
    };

    if (!data || !escolaId || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios: data, escolaId, itens (não vazio).' },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const saida = await prisma.$transaction(async (tx) => {
      const novaSaida = await tx.saida.create({
        data: {
          data: new Date(data),
          escolaId,
          responsavelId: responsavelId || null,
          recebedor: recebedor || null,
          observacao: observacao || null,
          status: 'PENDENTE',
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

      // Decrementar estoque (pode ficar negativo — apenas registrar)
      for (const item of itens) {
        const estoqueAtual = await tx.estoque.findUnique({
          where: { produtoId: item.produtoId },
        });

        await tx.estoque.upsert({
          where: { produtoId: item.produtoId },
          update: { quantidade: { decrement: item.quantidade } },
          create: { produtoId: item.produtoId, quantidade: -item.quantidade },
        });

        const novaQtd = (estoqueAtual?.quantidade ?? 0) - item.quantidade;
        if (novaQtd < 0) {
          console.warn(
            `Produto ${item.produtoId} ficou com estoque negativo (${novaQtd}) após saída nº ${novaSaida.numero}.`
          );
        }
      }

      return novaSaida;
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'CRIAR',
      entidade: 'Saida',
      entidadeId: saida.id,
      resumo: `Saída nº ${saida.numero} criada para escola ${saida.escola.nome} com ${itens.length} item(ns).`,
      detalhes: { numero: saida.numero, escolaId, itens },
    });

    return NextResponse.json(saida, { status: 201, headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao criar saída:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao criar saída.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
