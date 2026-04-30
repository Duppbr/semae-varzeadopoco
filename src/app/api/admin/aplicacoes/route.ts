import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const busca = req.nextUrl.searchParams.get('busca') || '';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const where: any = {};
  if (busca) {
    where.OR = [
      { carBrand: { contains: busca, mode: 'insensitive' } },
      { carModel: { contains: busca, mode: 'insensitive' } },
    ];
  }

  const [aplicacoes, total] = await Promise.all([
    prisma.aplicacaoVeiculo.findMany({
      where,
      orderBy: { carBrand: 'asc' },
      skip,
      take: limit,
    }),
    prisma.aplicacaoVeiculo.count({ where }),
  ]);

  return NextResponse.json({
    data: aplicacoes,
    total,
    pagina: page,
    totalPaginas: Math.ceil(total / limit),
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 });

  const atualizado = await prisma.aplicacaoVeiculo.update({
    where: { id },
    data,
  });
  return NextResponse.json(atualizado);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 });

  await prisma.aplicacaoVeiculo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  // Gera um id único se não fornecido
  const id = body.id || crypto.randomUUID();
  try {
    const novo = await prisma.aplicacaoVeiculo.create({
      data: { id, ...body },
    });
    return NextResponse.json(novo);
  } catch (e: any) {
    return NextResponse.json({ erro: e.message }, { status: 400 });
  }
}