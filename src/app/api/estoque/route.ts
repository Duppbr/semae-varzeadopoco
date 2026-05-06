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
    const params = req.nextUrl.searchParams;
    const search = params.get('search');
    const categoriaId = params.get('categoriaId');

    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
        ...(search
          ? { nome: { contains: search, mode: 'insensitive' } }
          : {}),
        ...(categoriaId ? { categoriaId } : {}),
      },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        estoqueMinimo: true,
        ativo: true,
        categoria: { select: { id: true, nome: true, cor: true } },
        unidade: { select: { id: true, nome: true, abreviacao: true } },
        estoque: { select: { quantidade: true } },
      },
    });

    const resultado = produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      estoqueMinimo: p.estoqueMinimo,
      ativo: p.ativo,
      categoria: p.categoria,
      unidade: p.unidade,
      estoque: p.estoque ?? { quantidade: 0 },
    }));

    return NextResponse.json(resultado, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao listar estoque:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao listar estoque.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
