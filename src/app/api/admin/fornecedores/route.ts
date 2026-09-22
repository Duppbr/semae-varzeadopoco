import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

const campos = {
  id: true, nome: true, cnpj: true, telefone: true, email: true,
  endereco: true, contato: true, observacao: true, ativo: true,
} as const;

// Apenas o nome da empresa e obrigatorio: o restante entra em branco e some do documento.
const opcional = (valor: unknown) => {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
};

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

  const ativoParam = req.nextUrl.searchParams.get('ativo');
  const where: { ativo?: boolean } = {};
  if (ativoParam === 'true') where.ativo = true;
  if (ativoParam === 'false') where.ativo = false;

  const fornecedores = await prisma.fornecedor.findMany({
    where,
    select: campos,
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(fornecedores, { headers: corsMobile(req) });
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
  const nome = opcional(body.nome);

  if (!nome) {
    return NextResponse.json(
      { erro: 'O nome da empresa é obrigatório.' },
      { status: 400, headers: corsMobile(req) },
    );
  }

  const existente = await prisma.fornecedor.findUnique({ where: { nome } });
  if (existente) {
    return NextResponse.json(
      { erro: 'Já existe um fornecedor com esse nome.' },
      { status: 409, headers: corsMobile(req) },
    );
  }

  const fornecedor = await prisma.fornecedor.create({
    data: {
      nome,
      cnpj: opcional(body.cnpj),
      telefone: opcional(body.telefone),
      email: opcional(body.email),
      endereco: opcional(body.endereco),
      contato: opcional(body.contato),
      observacao: opcional(body.observacao),
      ativo: true,
    },
    select: campos,
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'fornecedor_criado',
    entidade: 'Fornecedor',
    entidadeId: fornecedor.id,
    resumo: `${session.nome} cadastrou o fornecedor "${fornecedor.nome}".`,
    detalhes: { nome: fornecedor.nome, cnpj: fornecedor.cnpj },
  });

  return NextResponse.json(fornecedor, { status: 201, headers: corsMobile(req) });
}
