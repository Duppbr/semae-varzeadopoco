import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  const atalhos = await prisma.atalho.findMany({ orderBy: { posicao: 'asc' } });
  return NextResponse.json(atalhos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  const body = await req.json();
  const novo = await prisma.atalho.create({ data: body });
  return NextResponse.json(novo);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  const { id, posicao, amperagem, tipo, marca, ativo } = await req.json();
  const atualizado = await prisma.atalho.update({
    where: { id },
    data: { posicao, amperagem, tipo, marca, ativo },
  });
  return NextResponse.json(atualizado);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  const { id } = await req.json();
  await prisma.atalho.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}