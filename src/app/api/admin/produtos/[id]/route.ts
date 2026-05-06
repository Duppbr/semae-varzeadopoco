import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const { id } = await params;

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: {
      categoria: { select: { id: true, nome: true, cor: true } },
      unidade: { select: { id: true, nome: true, abreviacao: true } },
      estoque: { select: { quantidade: true } },
    },
  });

  if (!produto) {
    return NextResponse.json({ erro: 'Produto não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  return NextResponse.json(produto, { headers: corsMobile(req) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const { id } = await params;

  const existente = await prisma.produto.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: 'Produto não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, categoriaId, unidadeId, estoqueMinimo, ativo } = body;

  if (nome && nome !== existente.nome) {
    const duplicado = await prisma.produto.findUnique({ where: { nome } });
    if (duplicado) {
      return NextResponse.json(
        { erro: 'Já existe um produto com esse nome.' },
        { status: 409, headers: corsMobile(req) },
      );
    }
  }

  if (categoriaId) {
    const categoriaExiste = await prisma.categoria.findUnique({ where: { id: categoriaId } });
    if (!categoriaExiste) {
      return NextResponse.json({ erro: 'Categoria não encontrada.' }, { status: 404, headers: corsMobile(req) });
    }
  }

  if (unidadeId) {
    const unidadeExiste = await prisma.unidadeMedida.findUnique({ where: { id: unidadeId } });
    if (!unidadeExiste) {
      return NextResponse.json({ erro: 'Unidade de medida não encontrada.' }, { status: 404, headers: corsMobile(req) });
    }
  }

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (categoriaId !== undefined) data.categoriaId = categoriaId;
  if (unidadeId !== undefined) data.unidadeId = unidadeId;
  if (estoqueMinimo !== undefined) data.estoqueMinimo = Number(estoqueMinimo);
  if (ativo !== undefined) data.ativo = ativo;

  const produto = await prisma.produto.update({
    where: { id },
    data,
    include: {
      categoria: { select: { id: true, nome: true, cor: true } },
      unidade: { select: { id: true, nome: true, abreviacao: true } },
      estoque: { select: { quantidade: true } },
    },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'produto_atualizado',
    entidade: 'Produto',
    entidadeId: id,
    resumo: `${session.nome} atualizou o produto "${produto.nome}".`,
    detalhes: { alteracoes: data },
  });

  return NextResponse.json(produto, { headers: corsMobile(req) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const { id } = await params;

  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) {
    return NextResponse.json({ erro: 'Produto não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  const atualizado = await prisma.produto.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, nome: true, ativo: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'produto_desativado',
    entidade: 'Produto',
    entidadeId: id,
    resumo: `${session.nome} desativou o produto "${produto.nome}".`,
    detalhes: { nome: produto.nome },
  });

  return NextResponse.json(atualizado, { headers: corsMobile(req) });
}
