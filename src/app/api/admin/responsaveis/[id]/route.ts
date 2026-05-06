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

  const responsavel = await prisma.responsavel.findUnique({
    where: { id },
    select: { id: true, nome: true, cargo: true, ativo: true },
  });

  if (!responsavel) {
    return NextResponse.json({ erro: 'Responsável não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  return NextResponse.json(responsavel, { headers: corsMobile(req) });
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

  const existente = await prisma.responsavel.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: 'Responsável não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, cargo, ativo } = body;

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (cargo !== undefined) data.cargo = cargo;
  if (ativo !== undefined) data.ativo = ativo;

  const responsavel = await prisma.responsavel.update({
    where: { id },
    data,
    select: { id: true, nome: true, cargo: true, ativo: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'responsavel_atualizado',
    entidade: 'Responsavel',
    entidadeId: id,
    resumo: `${session.nome} atualizou o responsável "${responsavel.nome}".`,
    detalhes: { alteracoes: data },
  });

  return NextResponse.json(responsavel, { headers: corsMobile(req) });
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

  const responsavel = await prisma.responsavel.findUnique({ where: { id } });
  if (!responsavel) {
    return NextResponse.json({ erro: 'Responsável não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  const atualizado = await prisma.responsavel.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, nome: true, ativo: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'responsavel_desativado',
    entidade: 'Responsavel',
    entidadeId: id,
    resumo: `${session.nome} desativou o responsável "${responsavel.nome}".`,
    detalhes: { nome: responsavel.nome },
  });

  return NextResponse.json(atualizado, { headers: corsMobile(req) });
}
