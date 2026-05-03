import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q || q.length < 2) return NextResponse.json([]);
  const termos = q.split(/\s+/).slice(0, 4);

  const veiculos = await prisma.aplicacaoVeiculo.findMany({
    where: {
      active: true,
      AND: termos.map((termo) => ({
        OR: [
          { carBrand: { contains: termo, mode: 'insensitive' } },
          { carModel: { contains: termo, mode: 'insensitive' } },
          { battery: { contains: termo, mode: 'insensitive' } },
        ],
      })),
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
    orderBy: [
      { carBrand: 'asc' },
      { carModel: 'asc' },
      { carYearFrom: 'desc' },
    ],
    take: 30,
  });

  return NextResponse.json(veiculos);
}
