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

  const escolas = await prisma.escola.findMany({
    where,
    select: {
      id: true,
      nome: true,
      tipo: true,
      endereco: true,
      telefone: true,
      ativo: true,
    },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(escolas, { headers: corsMobile(req) });
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
  const { nome, tipo, endereco, telefone } = body;

  if (!nome || !tipo) {
    return NextResponse.json(
      { erro: 'Os campos "nome" e "tipo" são obrigatórios.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  if (tipo !== 'ESCOLA' && tipo !== 'CRECHE') {
    return NextResponse.json(
      { erro: 'O campo "tipo" deve ser "ESCOLA" ou "CRECHE".' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  const existente = await prisma.escola.findUnique({ where: { nome } });
  if (existente) {
    return NextResponse.json(
      { erro: 'Já existe uma escola com esse nome.' },
      { status: 409, headers: corsMobile(req) },
    );
  }

  const escola = await prisma.escola.create({
    data: {
      nome,
      tipo,
      endereco: endereco ?? null,
      telefone: telefone ?? null,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      tipo: true,
      endereco: true,
      telefone: true,
      ativo: true,
    },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'escola_criada',
    entidade: 'Escola',
    entidadeId: escola.id,
    resumo: `${session.nome} criou a escola "${escola.nome}".`,
    detalhes: { nome: escola.nome, tipo: escola.tipo },
  });

  return NextResponse.json(escola, { status: 201, headers: corsMobile(req) });
}
