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

  const unidades = await prisma.unidadeMedida.findMany({
    select: { id: true, nome: true, abreviacao: true },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(unidades, { headers: corsMobile(req) });
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
  const { nome, abreviacao } = body;

  if (!nome || !abreviacao) {
    return NextResponse.json(
      { erro: 'Os campos "nome" e "abreviacao" são obrigatórios.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  const existenteNome = await prisma.unidadeMedida.findUnique({ where: { nome } });
  if (existenteNome) {
    return NextResponse.json(
      { erro: 'Já existe uma unidade com esse nome.' },
      { status: 409, headers: corsMobile(req) },
    );
  }

  const existenteAbrev = await prisma.unidadeMedida.findUnique({ where: { abreviacao } });
  if (existenteAbrev) {
    return NextResponse.json(
      { erro: 'Já existe uma unidade com essa abreviação.' },
      { status: 409, headers: corsMobile(req) },
    );
  }

  const unidade = await prisma.unidadeMedida.create({
    data: { nome, abreviacao },
    select: { id: true, nome: true, abreviacao: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'unidade_criada',
    entidade: 'UnidadeMedida',
    entidadeId: unidade.id,
    resumo: `${session.nome} criou a unidade de medida "${unidade.nome}" (${unidade.abreviacao}).`,
    detalhes: { nome: unidade.nome, abreviacao: unidade.abreviacao },
  });

  return NextResponse.json(unidade, { status: 201, headers: corsMobile(req) });
}
