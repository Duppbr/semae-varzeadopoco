import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const atalhos = await prisma.atalho.findMany({
    where: { ativo: true },
    orderBy: { posicao: 'asc' },
  });
  return NextResponse.json(atalhos);
}