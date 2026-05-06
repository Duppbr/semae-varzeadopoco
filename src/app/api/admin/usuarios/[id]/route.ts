import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';
import bcrypt from 'bcryptjs';

const rolesPermitidas = new Set(['admin', 'funcionario']);

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

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      identificador: true,
      nome: true,
      role: true,
      ativo: true,
      protegido: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!usuario) {
    return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  return NextResponse.json(usuario, { headers: corsMobile(req) });
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

  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, role, ativo, senha } = body;

  if (role !== undefined && !rolesPermitidas.has(role)) {
    return NextResponse.json(
      { erro: 'O campo "role" deve ser "admin" ou "funcionario".' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  if (existente.protegido && ativo === false) {
    return NextResponse.json(
      { erro: 'O usuário protegido (admin master) não pode ser desativado.' },
      { status: 403, headers: corsMobile(req) },
    );
  }

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (role !== undefined) data.role = role;
  if (ativo !== undefined) data.ativo = ativo;

  if (senha !== undefined && senha !== null && String(senha).length > 0) {
    if (String(senha).length < 4) {
      return NextResponse.json(
        { erro: 'A senha deve ter pelo menos 4 caracteres.' },
        { status: 400, headers: corsMobile(req) },
      );
    }
    data.senhaHash = await bcrypt.hash(String(senha), 12);
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: {
      id: true,
      identificador: true,
      nome: true,
      role: true,
      ativo: true,
      protegido: true,
      updatedAt: true,
    },
  });

  const detalhes: Record<string, unknown> = { alteracoes: {} };
  const alteracoes: Record<string, unknown> = {};
  if (nome !== undefined) alteracoes.nome = nome;
  if (role !== undefined) alteracoes.role = role;
  if (ativo !== undefined) alteracoes.ativo = ativo;
  if (senha !== undefined && String(senha).length > 0) alteracoes.senha = '(atualizada)';
  detalhes.alteracoes = alteracoes;

  await registrarAuditoria({
    req,
    session,
    acao: 'usuario_atualizado',
    entidade: 'Usuario',
    entidadeId: id,
    resumo: `${session.nome} atualizou o usuário "${usuario.nome}" (${usuario.identificador}).`,
    detalhes,
  });

  return NextResponse.json(usuario, { headers: corsMobile(req) });
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

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  if (usuario.protegido) {
    return NextResponse.json(
      { erro: 'O usuário protegido (admin master) não pode ser excluído.' },
      { status: 403, headers: corsMobile(req) },
    );
  }

  const atualizado = await prisma.usuario.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, identificador: true, nome: true, ativo: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'usuario_desativado',
    entidade: 'Usuario',
    entidadeId: id,
    resumo: `${session.nome} desativou o usuário "${usuario.nome}" (${usuario.identificador}).`,
    detalhes: { identificador: usuario.identificador, nome: usuario.nome, role: usuario.role },
  });

  return NextResponse.json(atualizado, { headers: corsMobile(req) });
}
