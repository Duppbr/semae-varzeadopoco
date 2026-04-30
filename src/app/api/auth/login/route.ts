// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { identificador, senha } = await req.json();

  if (!identificador || !senha) {
    return NextResponse.json({ erro: 'ID e senha são obrigatórios' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findFirst({
    where: { identificador, ativo: true },
  });

  if (!usuario) {
    return NextResponse.json({ erro: 'Usuário ou senha inválidos' }, { status: 401 });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return NextResponse.json({ erro: 'Usuário ou senha inválidos' }, { status: 401 });
  }

  const session = await getSession();
  session.userId = usuario.id;
  session.identificador = usuario.identificador;
  session.nome = usuario.nome;
  session.role = usuario.role;
  session.lojaId = usuario.lojaId;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ ok: true, role: usuario.role, lojaId: usuario.lojaId });
}