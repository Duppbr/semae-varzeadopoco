import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { criarPedido, incluirPedido } from '@/lib/pedidos';
import { optionsResponse } from '@/lib/cors-mobile';
export const OPTIONS = optionsResponse;
export async function GET(req: NextRequest) {
  return api(req, async () => {
    const status = req.nextUrl.searchParams.get('status');
    return prisma.pedidoCompra.findMany({ where: status ? { status: status === 'PENDENTE' ? { in: ['PENDENTE', 'RASCUNHO'] } : status } : {},
      orderBy: { numero: 'desc' }, take: 100, include: incluirPedido });
  });
}
export async function POST(req: NextRequest) {
  return api(req, async session => criarPedido(await req.json(), session), 201);
}
