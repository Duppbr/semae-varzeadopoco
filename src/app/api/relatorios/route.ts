import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

type PeriodoRange = { inicio: Date; fim: Date };

function resolverPeriodo(
  periodo: string,
  dataInicio?: string | null,
  dataFim?: string | null
): PeriodoRange {
  const agora = new Date();

  switch (periodo) {
    case 'hoje': {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
      return { inicio, fim };
    }
    case 'semana': {
      const inicio = new Date(agora);
      inicio.setDate(agora.getDate() - 7);
      inicio.setHours(0, 0, 0, 0);
      return { inicio, fim: agora };
    }
    case 'quinzena': {
      const inicio = new Date(agora);
      inicio.setDate(agora.getDate() - 15);
      inicio.setHours(0, 0, 0, 0);
      return { inicio, fim: agora };
    }
    case 'mes': {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
      return { inicio, fim };
    }
    case 'trimestre': {
      const inicio = new Date(agora);
      inicio.setMonth(agora.getMonth() - 3);
      inicio.setHours(0, 0, 0, 0);
      return { inicio, fim: agora };
    }
    case 'ano': {
      const inicio = new Date(agora.getFullYear(), 0, 1);
      const fim = new Date(agora.getFullYear() + 1, 0, 1);
      return { inicio, fim };
    }
    case 'custom': {
      if (!dataInicio || !dataFim) {
        throw new Error('Para período "custom", dataInicio e dataFim são obrigatórios.');
      }
      return { inicio: new Date(dataInicio), fim: new Date(dataFim + 'T23:59:59.999Z') };
    }
    default: {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
      return { inicio, fim };
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const params = req.nextUrl.searchParams;
    const tipo = params.get('tipo') ?? '';
    const periodo = params.get('periodo') ?? 'mes';
    const escolaId = params.get('escolaId');
    const categoriaId = params.get('categoriaId');
    const dataInicio = params.get('dataInicio');
    const dataFim = params.get('dataFim');

    let range: PeriodoRange;
    try {
      range = resolverPeriodo(periodo, dataInicio, dataFim);
    } catch (err) {
      return NextResponse.json(
        { erro: err instanceof Error ? err.message : 'Período inválido.' },
        { status: 400, headers: corsMobile(req) }
      );
    }

    const tiposValidos = [
      'produtos-mais-usados',
      'produtos-mais-descartados',
      'produtos-mais-comprados',
      'saidas-por-escola',
      'movimentacao-periodo',
      'estoque-atual',
    ];

    if (!tipo || !tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { erro: `Tipo de relatório inválido. Valores aceitos: ${tiposValidos.join(', ')}.` },
        { status: 400, headers: corsMobile(req) }
      );
    }

    let dados: unknown[] = [];

    // ---------- produtos-mais-usados ----------
    if (tipo === 'produtos-mais-usados') {
      const itensSaida = await prisma.itemSaida.findMany({
        where: {
          saida: {
            data: { gte: range.inicio, lt: range.fim },
            ...(escolaId ? { escolaId } : {}),
          },
          ...(categoriaId ? { produto: { categoriaId } } : {}),
        },
        select: {
          produtoId: true,
          quantidade: true,
          produto: {
            select: {
              nome: true,
              categoria: { select: { nome: true, cor: true } },
              unidade: { select: { abreviacao: true } },
            },
          },
        },
      });

      const agrupado = new Map<string, { nome: string; categoria: string; unidade: string; total: number }>();
      for (const item of itensSaida) {
        const entry = agrupado.get(item.produtoId);
        if (entry) {
          entry.total += item.quantidade;
        } else {
          agrupado.set(item.produtoId, {
            nome: item.produto.nome,
            categoria: item.produto.categoria.nome,
            unidade: item.produto.unidade.abreviacao,
            total: item.quantidade,
          });
        }
      }

      dados = Array.from(agrupado.entries())
        .map(([produtoId, v]) => ({ produtoId, ...v }))
        .sort((a, b) => b.total - a.total);
    }

    // ---------- produtos-mais-descartados ----------
    else if (tipo === 'produtos-mais-descartados') {
      const itensDescarte = await prisma.itemDescarte.findMany({
        where: {
          descarte: {
            data: { gte: range.inicio, lt: range.fim },
          },
          ...(categoriaId ? { produto: { categoriaId } } : {}),
        },
        select: {
          produtoId: true,
          quantidade: true,
          produto: {
            select: {
              nome: true,
              categoria: { select: { nome: true, cor: true } },
              unidade: { select: { abreviacao: true } },
            },
          },
        },
      });

      const agrupado = new Map<string, { nome: string; categoria: string; unidade: string; total: number }>();
      for (const item of itensDescarte) {
        const entry = agrupado.get(item.produtoId);
        if (entry) {
          entry.total += item.quantidade;
        } else {
          agrupado.set(item.produtoId, {
            nome: item.produto.nome,
            categoria: item.produto.categoria.nome,
            unidade: item.produto.unidade.abreviacao,
            total: item.quantidade,
          });
        }
      }

      dados = Array.from(agrupado.entries())
        .map(([produtoId, v]) => ({ produtoId, ...v }))
        .sort((a, b) => b.total - a.total);
    }

    // ---------- produtos-mais-comprados ----------
    else if (tipo === 'produtos-mais-comprados') {
      const itensEntrada = await prisma.itemEntrada.findMany({
        where: {
          entrada: {
            data: { gte: range.inicio, lt: range.fim },
          },
          ...(categoriaId ? { produto: { categoriaId } } : {}),
        },
        select: {
          produtoId: true,
          quantidade: true,
          produto: {
            select: {
              nome: true,
              categoria: { select: { nome: true, cor: true } },
              unidade: { select: { abreviacao: true } },
            },
          },
        },
      });

      const agrupado = new Map<string, { nome: string; categoria: string; unidade: string; total: number }>();
      for (const item of itensEntrada) {
        const entry = agrupado.get(item.produtoId);
        if (entry) {
          entry.total += item.quantidade;
        } else {
          agrupado.set(item.produtoId, {
            nome: item.produto.nome,
            categoria: item.produto.categoria.nome,
            unidade: item.produto.unidade.abreviacao,
            total: item.quantidade,
          });
        }
      }

      dados = Array.from(agrupado.entries())
        .map(([produtoId, v]) => ({ produtoId, ...v }))
        .sort((a, b) => b.total - a.total);
    }

    // ---------- saidas-por-escola ----------
    else if (tipo === 'saidas-por-escola') {
      const itensSaida = await prisma.itemSaida.findMany({
        where: {
          saida: {
            data: { gte: range.inicio, lt: range.fim },
            ...(escolaId ? { escolaId } : {}),
          },
          ...(categoriaId ? { produto: { categoriaId } } : {}),
        },
        select: {
          quantidade: true,
          saida: {
            select: {
              id: true,
              escolaId: true,
              escola: { select: { nome: true, tipo: true } },
            },
          },
        },
      });

      const agrupado = new Map<
        string,
        { nome: string; tipo: string; totalQuantidade: number; saidaIds: Set<string> }
      >();

      for (const item of itensSaida) {
        const eId = item.saida.escolaId;
        if (!agrupado.has(eId)) {
          agrupado.set(eId, {
            nome: item.saida.escola.nome,
            tipo: item.saida.escola.tipo,
            totalQuantidade: 0,
            saidaIds: new Set(),
          });
        }
        const entry = agrupado.get(eId)!;
        entry.totalQuantidade += item.quantidade;
        entry.saidaIds.add(item.saida.id);
      }

      dados = Array.from(agrupado.entries())
        .map(([eId, v]) => ({
          escolaId: eId,
          nome: v.nome,
          tipo: v.tipo,
          totalQuantidade: v.totalQuantidade,
          totalSaidas: v.saidaIds.size,
        }))
        .sort((a, b) => b.totalQuantidade - a.totalQuantidade);
    }

    // ---------- movimentacao-periodo ----------
    else if (tipo === 'movimentacao-periodo') {
      const [entradas, saidas, descartes] = await Promise.all([
        prisma.entrada.findMany({
          where: { data: { gte: range.inicio, lt: range.fim } },
          select: { data: true, itens: { select: { quantidade: true } } },
        }),
        prisma.saida.findMany({
          where: {
            data: { gte: range.inicio, lt: range.fim },
            ...(escolaId ? { escolaId } : {}),
          },
          select: { data: true, itens: { select: { quantidade: true } } },
        }),
        prisma.descarte.findMany({
          where: { data: { gte: range.inicio, lt: range.fim } },
          select: { data: true, itens: { select: { quantidade: true } } },
        }),
      ]);

      const porDia = new Map<
        string,
        { data: string; totalEntradas: number; totalSaidas: number; totalDescartes: number }
      >();

      const toDataKey = (d: Date) => d.toISOString().slice(0, 10);

      for (const e of entradas) {
        const key = toDataKey(e.data);
        if (!porDia.has(key)) porDia.set(key, { data: key, totalEntradas: 0, totalSaidas: 0, totalDescartes: 0 });
        porDia.get(key)!.totalEntradas += e.itens.reduce((s, i) => s + i.quantidade, 0);
      }
      for (const s of saidas) {
        const key = toDataKey(s.data);
        if (!porDia.has(key)) porDia.set(key, { data: key, totalEntradas: 0, totalSaidas: 0, totalDescartes: 0 });
        porDia.get(key)!.totalSaidas += s.itens.reduce((s, i) => s + i.quantidade, 0);
      }
      for (const d of descartes) {
        const key = toDataKey(d.data);
        if (!porDia.has(key)) porDia.set(key, { data: key, totalEntradas: 0, totalSaidas: 0, totalDescartes: 0 });
        porDia.get(key)!.totalDescartes += d.itens.reduce((s, i) => s + i.quantidade, 0);
      }

      dados = Array.from(porDia.values()).sort((a, b) => a.data.localeCompare(b.data));
    }

    // ---------- estoque-atual ----------
    else if (tipo === 'estoque-atual') {
      const produtos = await prisma.produto.findMany({
        where: {
          ativo: true,
          ...(categoriaId ? { categoriaId } : {}),
        },
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          estoqueMinimo: true,
          categoria: { select: { id: true, nome: true, cor: true } },
          unidade: { select: { id: true, nome: true, abreviacao: true } },
          estoque: { select: { quantidade: true, updatedAt: true } },
        },
      });

      dados = produtos.map((p) => ({
        id: p.id,
        nome: p.nome,
        estoqueMinimo: p.estoqueMinimo,
        categoria: p.categoria,
        unidade: p.unidade,
        quantidade: p.estoque?.quantidade ?? 0,
        atualizadoEm: p.estoque?.updatedAt ?? null,
        abaixoMinimo: (p.estoque?.quantidade ?? 0) < p.estoqueMinimo,
      }));
    }

    return NextResponse.json(
      { tipo, periodo, dados },
      { headers: corsMobile(req) }
    );
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao gerar relatório.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
