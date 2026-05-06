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

  const unidade = await prisma.unidadeMedida.findUnique({
    where: { id },
    select: { id: true, nome: true, abreviacao: true },
  });

  if (!unidade) {
    return NextResponse.json({ erro: 'Unidade de medida não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  return NextResponse.json(unidade, { headers: corsMobile(req) });
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

  const existente = await prisma.unidadeMedida.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: 'Unidade de medida não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, abreviacao } = body;

  if (nome && nome !== existente.nome) {
    const duplicado = await prisma.unidadeMedida.findUnique({ where: { nome } });
    if (duplicado) {
      return NextResponse.json(
        { erro: 'Já existe uma unidade com esse nome.' },
        { status: 409, headers: corsMobile(req) },
      );
    }
  }

  if (abreviacao && abreviacao !== existente.abreviacao) {
    const duplicado = await prisma.unidadeMedida.findUnique({ where: { abreviacao } });
    if (duplicado) {
      return NextResponse.json(
        { erro: 'Já existe uma unidade com essa abreviação.' },
        { status: 409, headers: corsMobile(req) },
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (abreviacao !== undefined) data.abreviacao = abreviacao;

  const unidade = await prisma.unidadeMedida.update({
    where: { id },
    data,
    select: { id: true, nome: true, abreviacao: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'unidade_atualizada',
    entidade: 'UnidadeMedida',
    entidadeId: id,
    resumo: `${session.nome} atualizou a unidade de medida "${unidade.nome}".`,
    detalhes: { alteracoes: data },
  });

  return NextResponse.json(unidade, { headers: corsMobile(req) });
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

  const unidade = await prisma.unidadeMedida.findUnique({ where: { id } });
  if (!unidade) {
    return NextResponse.json({ erro: 'Unidade de medida não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const emUsoProdutos = await prisma.produto.count({ where: { unidadeId: id } });
  if (emUsoProdutos > 0) {
    return NextResponse.json(
      { erro: `Não é possível excluir: essa unidade está vinculada a ${emUsoProdutos} produto(s).` },
      { status: 409, headers: corsMobile(req) },
    );
  }

  await prisma.unidadeMedida.delete({ where: { id } });

  await registrarAuditoria({
    req,
    session,
    acao: 'unidade_excluida',
    entidade: 'UnidadeMedida',
    entidadeId: id,
    resumo: `${session.nome} excluiu a unidade de medida "${unidade.nome}" (${unidade.abreviacao}).`,
    detalhes: { nome: unidade.nome, abreviacao: unidade.abreviacao },
  });

  return NextResponse.json({ ok: true }, { headers: corsMobile(req) });
}
