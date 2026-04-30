import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const lojas = await prisma.loja.findMany();
  return NextResponse.json(lojas);
}