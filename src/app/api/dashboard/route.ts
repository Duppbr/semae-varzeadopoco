import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
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
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

    const [
      totalProdutos,
      estoques,
      entradasHoje,
      saidasHoje,
      descartesMes,
      ultimasSaidas,
      alertasEstoque,
    ] = await Promise.all([
      prisma.produto.count({ where: { ativo: true } }),

      prisma.estoque.findMany({ select: { quantidade: true } }),

      prisma.entrada.count({
        where: { createdAt: { gte: inicioDia, lt: fimDia } },
      }),

      prisma.saida.count({
        where: { createdAt: { gte: inicioDia, lt: fimDia } },
      }),

      prisma.descarte.count({
        where: { createdAt: { gte: inicioMes, lt: fimMes } },
      }),

      prisma.saida.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          data: true,
          status: true,
          escola: { select: { nome: true } },
          _count: { select: { itens: true } },
        },
      }),

      prisma.produto.findMany({
        where: { ativo: true },
        select: {
          id: true,
          nome: true,
          estoqueMinimo: true,
          unidade: { select: { abreviacao: true } },
          estoque: { select: { quantidade: true } },
        },
      }),
    ]);

    const totalEstoque = estoques.reduce((acc, e) => acc + e.quantidade, 0);

    const produtosAbaixoMinimo = alertasEstoque.filter((p) => {
      const qtd = p.estoque?.quantidade ?? 0;
      return qtd < p.estoqueMinimo;
    }).length;

    const alertasFiltrados = alertasEstoque
      .filter((p) => {
        const qtd = p.estoque?.quantidade ?? 0;
        return qtd < p.estoqueMinimo;
      })
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        estoqueMinimo: p.estoqueMinimo,
        unidade: p.unidade,
        estoque: p.estoque ?? { quantidade: 0 },
      }));

    return NextResponse.json(
      {
        totalProdutos,
        totalEstoque,
        produtosAbaixoMinimo,
        entradasHoje,
        saidasHoje,
        descartesMes,
        ultimasSaidas,
        alertasEstoque: alertasFiltrados,
      },
      { headers: corsMobile(req) }
    );
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao carregar dashboard.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
