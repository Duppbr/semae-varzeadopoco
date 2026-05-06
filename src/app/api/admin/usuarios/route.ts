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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const usuarios = await prisma.usuario.findMany({
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
    orderBy: [
      { protegido: 'desc' },
      { ativo: 'desc' },
      { nome: 'asc' },
    ],
  });

  return NextResponse.json(usuarios, { headers: corsMobile(req) });
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
  const { identificador, senha, nome, role } = body;

  if (!identificador || !senha || !nome || !role) {
    return NextResponse.json(
      { erro: 'Os campos "identificador", "senha", "nome" e "role" são obrigatórios.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  if (!rolesPermitidas.has(role)) {
    return NextResponse.json(
      { erro: 'O campo "role" deve ser "admin" ou "funcionario".' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  if (String(senha).length < 4) {
    return NextResponse.json(
      { erro: 'A senha deve ter pelo menos 4 caracteres.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  const existente = await prisma.usuario.findUnique({ where: { identificador } });
  if (existente) {
    return NextResponse.json(
      { erro: 'Já existe um usuário com esse identificador.' },
      { status: 409, headers: corsMobile(req) },
    );
  }

  const senhaHash = await bcrypt.hash(String(senha), 12);

  const usuario = await prisma.usuario.create({
    data: {
      identificador,
      senhaHash,
      nome,
      role,
      ativo: true,
      protegido: false,
    },
    select: {
      id: true,
      identificador: true,
      nome: true,
      role: true,
      ativo: true,
      protegido: true,
      createdAt: true,
    },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'usuario_criado',
    entidade: 'Usuario',
    entidadeId: usuario.id,
    resumo: `${session.nome} criou o usuário "${usuario.nome}" (${usuario.identificador}).`,
    detalhes: { identificador: usuario.identificador, nome: usuario.nome, role: usuario.role },
  });

  return NextResponse.json(usuario, { status: 201, headers: corsMobile(req) });
}
