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

  const params = req.nextUrl.searchParams;
  const ativoParam = params.get('ativo');

  const where: { ativo?: boolean } = {};
  if (ativoParam === 'true') where.ativo = true;
  if (ativoParam === 'false') where.ativo = false;

  const responsaveis = await prisma.responsavel.findMany({
    where,
    select: {
      id: true,
      nome: true,
      cargo: true,
      ativo: true,
    },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(responsaveis, { headers: corsMobile(req) });
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
  const { nome, cargo } = body;

  if (!nome) {
    return NextResponse.json(
      { erro: 'O campo "nome" é obrigatório.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  const responsavel = await prisma.responsavel.create({
    data: {
      nome,
      cargo: cargo ?? null,
      ativo: true,
    },
    select: { id: true, nome: true, cargo: true, ativo: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'responsavel_criado',
    entidade: 'Responsavel',
    entidadeId: responsavel.id,
    resumo: `${session.nome} criou o responsável "${responsavel.nome}".`,
    detalhes: { nome: responsavel.nome, cargo: responsavel.cargo },
  });

  return NextResponse.json(responsavel, { status: 201, headers: corsMobile(req) });
}
