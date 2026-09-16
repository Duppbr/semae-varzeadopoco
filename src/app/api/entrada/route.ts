import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api } from '@/lib/api';
import { criarMovimento, incluirItens } from '@/lib/operacoes';
import { optionsResponse } from '@/lib/cors-mobile';

export const OPTIONS = optionsResponse;
export async function GET(req: NextRequest) {
  return api(req, async () => {
    const p = req.nextUrl.searchParams;
    const limit = Math.min(100, Math.max(1, Number(p.get('limit')) || 50));
    const offset = Math.max(0, Number(p.get('offset')) || 0);
    return prisma.entrada.findMany({
      take: Math.floor(limit), skip: Math.floor(offset), orderBy: { numero: 'desc' },
      
      include: { ...incluirItens },
    });
  });
}
export async function POST(req: NextRequest) {
  return api(req, async session => criarMovimento('entrada', await req.json(), session), 201);
}
