import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const atalhos = await prisma.atalho.findMany({
    where: { ativo: true },
    orderBy: { posicao: 'asc' },
  });
  return NextResponse.json(atalhos, { headers: CORS });
}