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

  const categoria = await prisma.categoria.findUnique({
    where: { id },
    select: { id: true, nome: true, cor: true },
  });

  if (!categoria) {
    return NextResponse.json({ erro: 'Categoria não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  return NextResponse.json(categoria, { headers: corsMobile(req) });
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

  const existente = await prisma.categoria.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: 'Categoria não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, cor } = body;

  if (nome && nome !== existente.nome) {
    const duplicado = await prisma.categoria.findUnique({ where: { nome } });
    if (duplicado) {
      return NextResponse.json(
        { erro: 'Já existe uma categoria com esse nome.' },
        { status: 409, headers: corsMobile(req) },
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (cor !== undefined) data.cor = cor;

  const categoria = await prisma.categoria.update({
    where: { id },
    data,
    select: { id: true, nome: true, cor: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'categoria_atualizada',
    entidade: 'Categoria',
    entidadeId: id,
    resumo: `${session.nome} atualizou a categoria "${categoria.nome}".`,
    detalhes: { alteracoes: data },
  });

  return NextResponse.json(categoria, { headers: corsMobile(req) });
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

  const categoria = await prisma.categoria.findUnique({ where: { id } });
  if (!categoria) {
    return NextResponse.json({ erro: 'Categoria não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const emUso = await prisma.produto.count({ where: { categoriaId: id } });
  if (emUso > 0) {
    return NextResponse.json(
      { erro: `Não é possível excluir: essa categoria está vinculada a ${emUso} produto(s).` },
      { status: 409, headers: corsMobile(req) },
    );
  }

  await prisma.categoria.delete({ where: { id } });

  await registrarAuditoria({
    req,
    session,
    acao: 'categoria_excluida',
    entidade: 'Categoria',
    entidadeId: id,
    resumo: `${session.nome} excluiu a categoria "${categoria.nome}".`,
    detalhes: { nome: categoria.nome, cor: categoria.cor },
  });

  return NextResponse.json({ ok: true }, { headers: corsMobile(req) });
}
