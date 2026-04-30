import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const veiculos = await prisma.aplicacaoVeiculo.findMany({
    where: {
      OR: [
        { carBrand: { contains: q, mode: 'insensitive' } },
        { carModel: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      carBrand: true,
      carModel: true,
      carYearFrom: true,
      carYearTo: true,
      vehicleType: true,
      amperagem: true,
      tipo: true,
      battery: true,
      cca: true,
      length: true,
      width: true,
      height: true,
    },
    take: 25,
  });

  return NextResponse.json(veiculos);
}