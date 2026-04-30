import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/opcoes?categoria=marca
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const categoria = req.nextUrl.searchParams.get('categoria');
  const where = categoria ? { categoria } : {};

  const opcoes = await prisma.opcao.findMany({
    where,
    orderBy: { valor: 'asc' },
  });

  return NextResponse.json(opcoes);
}

// POST /api/admin/opcoes  (body: { categoria: "marca", valor: "ACDelco" })
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { categoria, valor } = await req.json();
  if (!categoria || !valor) {
    return NextResponse.json({ erro: 'categoria e valor são obrigatórios' }, { status: 400 });
  }

  const nova = await prisma.opcao.create({
    data: { categoria, valor },
  });

  return NextResponse.json(nova);
}

// PUT /api/admin/opcoes  (body: { id: 1, valor: "Novo Valor" })
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { id, valor } = await req.json();
  if (!id || !valor) {
    return NextResponse.json({ erro: 'id e valor são obrigatórios' }, { status: 400 });
  }

  const atualizada = await prisma.opcao.update({
    where: { id },
    data: { valor },
  });

  return NextResponse.json(atualizada);
}

// DELETE /api/admin/opcoes  (body: { id: 1 })
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 });
  }

  await prisma.opcao.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}