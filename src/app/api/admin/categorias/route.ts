import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const categorias = await prisma.categoria.findMany({
    select: { id: true, nome: true, cor: true },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(categorias, { headers: corsMobile(req) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const body = await req.json();
  const { nome, cor } = body;

  if (!nome || !cor) {
    return NextResponse.json(
      { erro: 'Os campos "nome" e "cor" são obrigatórios.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  const existente = await prisma.categoria.findUnique({ where: { nome } });
  if (existente) {
    return NextResponse.json(
      { erro: 'Já existe uma categoria com esse nome.' },
      { status: 409, headers: corsMobile(req) },
    );
  }

  const categoria = await prisma.categoria.create({
    data: { nome, cor },
    select: { id: true, nome: true, cor: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'categoria_criada',
    entidade: 'Categoria',
    entidadeId: categoria.id,
    resumo: `${session.nome} criou a categoria "${categoria.nome}".`,
    detalhes: { nome: categoria.nome, cor: categoria.cor },
  });

  return NextResponse.json(categoria, { status: 201, headers: corsMobile(req) });
}
