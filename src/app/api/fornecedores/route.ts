import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) { return optionsResponse(req); }

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  const ativo = req.nextUrl.searchParams.get('ativo');
  const where = ativo === 'true' ? { ativo: true } : ativo === 'false' ? { ativo: false } : {};

  const fornecedores = await prisma.fornecedor.findMany({
    where,
    select: { id: true, nome: true, cnpj: true, telefone: true, email: true, endereco: true, contato: true, observacao: true, ativo: true },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(fornecedores, { headers: corsMobile(req) });
}
