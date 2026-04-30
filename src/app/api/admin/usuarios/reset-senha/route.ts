import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { id, novaSenha } = await req.json();
  if (!id || !novaSenha || novaSenha.length < 4) {
    return NextResponse.json({ erro: 'Senha deve ter pelo menos 4 caracteres' }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({
    where: { id },
    data: { senhaHash },
  });
  return NextResponse.json({ ok: true });
}