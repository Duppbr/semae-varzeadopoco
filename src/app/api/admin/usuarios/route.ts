import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// GET - listar usuários
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const usuarios = await prisma.usuario.findMany({
    include: { loja: true },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json(usuarios);
}

// POST - criar novo usuário
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { identificador, senha, nome, role, lojaId } = await req.json();
  if (!identificador || !senha || !nome || !role || !lojaId) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { identificador } });
  if (existente) {
    return NextResponse.json({ erro: 'ID já existe' }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { identificador, senhaHash, nome, role, lojaId, ativo: true },
  });
  return NextResponse.json(usuario);
}

// PUT - ativar/desativar usuário
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { id, ativo } = await req.json();
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { ativo },
  });
  return NextResponse.json(usuario);
}