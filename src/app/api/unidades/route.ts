import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export async function GET(req: NextRequest) {
  return api(req, () => prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } }));
}
