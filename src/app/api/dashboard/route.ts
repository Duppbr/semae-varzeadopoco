import { prisma } from '@/lib/prisma';
import { estoqueBaixo, hoje } from '@/lib/regras';
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
    const inicioDia = new Date(`${hoje()}T00:00:00.000Z`);
    const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);
    const inicioMes = new Date(Date.UTC(inicioDia.getUTCFullYear(), inicioDia.getUTCMonth(), 1));
    const fimMes = new Date(Date.UTC(inicioDia.getUTCFullYear(), inicioDia.getUTCMonth() + 1, 1));

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

      prisma.estoque.findMany({ where: { produto: { ativo: true } }, select: { quantidade: true } }),

      prisma.entrada.count({
        where: { data: { gte: inicioDia, lt: fimDia } },
      }),

      prisma.saida.count({
        where: { data: { gte: inicioDia, lt: fimDia }, status: { not: 'CANCELADO' } },
      }),

      prisma.descarte.count({
        where: { data: { gte: inicioMes, lt: fimMes } },
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

    // Nao soma quilogramas com litros/unidades como se fossem a mesma grandeza.
    const produtosComSaldo = estoques.filter(e => e.quantidade > 0).length;

    const produtosAbaixoMinimo = alertasEstoque.filter((p) => {
      const qtd = p.estoque?.quantidade ?? 0;
      return estoqueBaixo(qtd, p.estoqueMinimo);
    }).length;

    const alertasFiltrados = alertasEstoque
      .filter((p) => {
        const qtd = p.estoque?.quantidade ?? 0;
        return estoqueBaixo(qtd, p.estoqueMinimo);
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
        produtosComSaldo,
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
