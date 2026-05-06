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

  const escola = await prisma.escola.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      tipo: true,
      endereco: true,
      telefone: true,
      ativo: true,
    },
  });

  if (!escola) {
    return NextResponse.json({ erro: 'Escola não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  return NextResponse.json(escola, { headers: corsMobile(req) });
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

  const existente = await prisma.escola.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: 'Escola não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, tipo, endereco, telefone, ativo } = body;

  if (tipo !== undefined && tipo !== 'ESCOLA' && tipo !== 'CRECHE') {
    return NextResponse.json(
      { erro: 'O campo "tipo" deve ser "ESCOLA" ou "CRECHE".' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  if (nome && nome !== existente.nome) {
    const duplicado = await prisma.escola.findUnique({ where: { nome } });
    if (duplicado) {
      return NextResponse.json(
        { erro: 'Já existe uma escola com esse nome.' },
        { status: 409, headers: corsMobile(req) },
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (tipo !== undefined) data.tipo = tipo;
  if (endereco !== undefined) data.endereco = endereco;
  if (telefone !== undefined) data.telefone = telefone;
  if (ativo !== undefined) data.ativo = ativo;

  const escola = await prisma.escola.update({
    where: { id },
    data,
    select: {
      id: true,
      nome: true,
      tipo: true,
      endereco: true,
      telefone: true,
      ativo: true,
    },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'escola_atualizada',
    entidade: 'Escola',
    entidadeId: id,
    resumo: `${session.nome} atualizou a escola "${escola.nome}".`,
    detalhes: { alteracoes: data },
  });

  return NextResponse.json(escola, { headers: corsMobile(req) });
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

  const escola = await prisma.escola.findUnique({ where: { id } });
  if (!escola) {
    return NextResponse.json({ erro: 'Escola não encontrada.' }, { status: 404, headers: corsMobile(req) });
  }

  const atualizada = await prisma.escola.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, nome: true, ativo: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'escola_desativada',
    entidade: 'Escola',
    entidadeId: id,
    resumo: `${session.nome} desativou a escola "${escola.nome}".`,
    detalhes: { nome: escola.nome },
  });

  return NextResponse.json(atualizada, { headers: corsMobile(req) });
}
