import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const params = req.nextUrl.searchParams;
  const ativoParam = params.get('ativo');

  const where: { ativo?: boolean } = {};
  if (ativoParam === 'true') where.ativo = true;
  if (ativoParam === 'false') where.ativo = false;

  const produtos = await prisma.produto.findMany({
    where,
    include: {
      categoria: { select: { id: true, nome: true, cor: true } },
      unidade: { select: { id: true, nome: true, abreviacao: true } },
      estoque: { select: { quantidade: true } },
    },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(produtos, { headers: corsMobile(req) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, categoriaId, unidadeId, estoqueMinimo } = body;

  if (!nome || !categoriaId || !unidadeId) {
    return NextResponse.json(
      { erro: 'Os campos "nome", "categoriaId" e "unidadeId" são obrigatórios.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  const categoriaExiste = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  if (!categoriaExiste) {
    return NextResponse.json({ erro: 'Categoria não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const unidadeExiste = await prisma.unidadeMedida.findUnique({ where: { id: unidadeId } });
  if (!unidadeExiste) {
    return NextResponse.json({ erro: 'Unidade de medida não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const existente = await prisma.produto.findUnique({ where: { nome } });
  if (existente) {
    return NextResponse.json(
      { erro: 'Já existe um produto com esse nome.' },
      { status: 409, headers: corsMobile(req) },
    );
  }

  const produto = await prisma.produto.create({
    data: {
      nome,
      categoriaId,
      unidadeId,
      estoqueMinimo: estoqueMinimo !== undefined ? Number(estoqueMinimo) : 0,
      ativo: true,
      estoque: {
        create: { quantidade: 0 },
      },
    },
    include: {
      categoria: { select: { id: true, nome: true, cor: true } },
      unidade: { select: { id: true, nome: true, abreviacao: true } },
      estoque: { select: { quantidade: true } },
    },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'produto_criado',
    entidade: 'Produto',
    entidadeId: produto.id,
    resumo: `${session.nome} criou o produto "${produto.nome}".`,
    detalhes: {
      nome: produto.nome,
      categoriaId: produto.categoriaId,
      unidadeId: produto.unidadeId,
      estoqueMinimo: produto.estoqueMinimo,
    },
  });

  return NextResponse.json(produto, { status: 201, headers: corsMobile(req) });
}
