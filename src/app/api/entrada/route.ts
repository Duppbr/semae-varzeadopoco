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

    const entradas = await prisma.entrada.findMany({
      take: limit,
      skip: offset,
      orderBy: { numero: 'desc' },
      include: {
        responsavel: { select: { id: true, nome: true, cargo: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
            unidade: { select: { id: true, abreviacao: true } },
          },
        },
      },
    });

    return NextResponse.json(entradas, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao listar entradas:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao listar entradas.' },
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
    const { data, responsavelId, fornecedor, observacao, itens } = body as {
      data: string;
      responsavelId?: string;
      fornecedor?: string;
      observacao?: string;
      itens: { produtoId: string; quantidade: number; unidadeId: string }[];
    };

    if (!data || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios: data, itens (não vazio).' },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const entrada = await prisma.$transaction(async (tx) => {
      const novaEntrada = await tx.entrada.create({
        data: {
          data: new Date(data),
          responsavelId: responsavelId || null,
          fornecedor: fornecedor || null,
          observacao: observacao || null,
          itens: {
            create: itens.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              unidadeId: item.unidadeId,
            })),
          },
        },
        include: {
          responsavel: { select: { id: true, nome: true } },
          itens: {
            include: {
              produto: { select: { id: true, nome: true } },
              unidade: { select: { id: true, abreviacao: true } },
            },
          },
        },
      });

      // Atualizar estoque para cada item
      for (const item of itens) {
        await tx.estoque.upsert({
          where: { produtoId: item.produtoId },
          update: { quantidade: { increment: item.quantidade } },
          create: { produtoId: item.produtoId, quantidade: item.quantidade },
        });
      }

      return novaEntrada;
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'CRIAR',
      entidade: 'Entrada',
      entidadeId: entrada.id,
      resumo: `Entrada nº ${entrada.numero} criada com ${itens.length} item(ns).`,
      detalhes: { numero: entrada.numero, fornecedor, itens },
    });

    return NextResponse.json(entrada, { status: 201, headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao criar entrada:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao criar entrada.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
