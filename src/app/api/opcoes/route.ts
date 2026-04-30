import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/opcoes?categoria=marca (acessível a qualquer usuário autenticado, mas público também)
export async function GET(req: NextRequest) {
  const categoria = req.nextUrl.searchParams.get('categoria');
  const where = categoria ? { categoria } : {};

  const opcoes = await prisma.opcao.findMany({
    where,
    orderBy: { valor: 'asc' },
  });

  return NextResponse.json(opcoes);
}