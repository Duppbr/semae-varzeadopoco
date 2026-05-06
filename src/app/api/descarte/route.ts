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

    const descartes = await prisma.descarte.findMany({
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

    return NextResponse.json(descartes, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao listar descartes:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao listar descartes.' },
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
    const { data, responsavelId, motivo, observacao, itens } = body as {
      data: string;
      responsavelId?: string;
      motivo: string;
      observacao?: string;
      itens: { produtoId: string; quantidade: number; unidadeId: string }[];
    };

    if (!data || !motivo || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios: data, motivo, itens (não vazio).' },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const descarte = await prisma.$transaction(async (tx) => {
      const novoDescarte = await tx.descarte.create({
        data: {
          data: new Date(data),
          responsavelId: responsavelId || null,
          motivo,
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

      // Decrementar estoque
      for (const item of itens) {
        await tx.estoque.upsert({
          where: { produtoId: item.produtoId },
          update: { quantidade: { decrement: item.quantidade } },
          create: { produtoId: item.produtoId, quantidade: -item.quantidade },
        });
      }

      return novoDescarte;
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'CRIAR',
      entidade: 'Descarte',
      entidadeId: descarte.id,
      resumo: `Descarte nº ${descarte.numero} criado. Motivo: ${motivo}. ${itens.length} item(ns).`,
      detalhes: { numero: descarte.numero, motivo, itens },
    });

    return NextResponse.json(descarte, { status: 201, headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao criar descarte:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao criar descarte.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
