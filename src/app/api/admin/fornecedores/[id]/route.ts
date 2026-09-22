import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

const campos = {
  id: true, nome: true, cnpj: true, telefone: true, email: true,
  endereco: true, contato: true, observacao: true, ativo: true,
} as const;

const opcional = (valor: unknown) => {
  const texto = valor === undefined || valor === null ? '' : String(valor).trim();
  return texto === '' ? null : texto;
};

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const { id } = await params;

  const fornecedor = await prisma.fornecedor.findUnique({ where: { id }, select: campos });
  if (!fornecedor) {
    return NextResponse.json({ erro: 'Fornecedor não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  return NextResponse.json(fornecedor, { headers: corsMobile(req) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const { id } = await params;

  const existente = await prisma.fornecedor.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: 'Fornecedor não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) {
    const nome = opcional(body.nome);
    if (!nome) {
      return NextResponse.json(
        { erro: 'O nome da empresa é obrigatório.' },
        { status: 400, headers: corsMobile(req) },
      );
    }
    if (nome !== existente.nome) {
      const duplicado = await prisma.fornecedor.findUnique({ where: { nome } });
      if (duplicado) {
        return NextResponse.json(
          { erro: 'Já existe um fornecedor com esse nome.' },
          { status: 409, headers: corsMobile(req) },
        );
      }
    }
    data.nome = nome;
  }
  for (const campo of ['cnpj', 'telefone', 'email', 'endereco', 'contato', 'observacao'] as const) {
    if (body[campo] !== undefined) data[campo] = opcional(body[campo]);
  }
  if (body.ativo !== undefined) data.ativo = body.ativo;

  const fornecedor = await prisma.fornecedor.update({ where: { id }, data, select: campos });

  await registrarAuditoria({
    req,
    session,
    acao: 'fornecedor_atualizado',
    entidade: 'Fornecedor',
    entidadeId: id,
    resumo: `${session.nome} atualizou o fornecedor "${fornecedor.nome}".`,
    detalhes: { alteracoes: data },
  });

  return NextResponse.json(fornecedor, { headers: corsMobile(req) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403, headers: corsMobile(req) });
  }

  const { id } = await params;

  const fornecedor = await prisma.fornecedor.findUnique({ where: { id } });
  if (!fornecedor) {
    return NextResponse.json({ erro: 'Fornecedor não encontrado.' }, { status: 404, headers: corsMobile(req) });
  }

  // Desativa em vez de apagar: os pedidos e entradas antigos continuam mostrando o fornecedor.
  const atualizado = await prisma.fornecedor.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, nome: true, ativo: true },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'fornecedor_desativado',
    entidade: 'Fornecedor',
    entidadeId: id,
    resumo: `${session.nome} desativou o fornecedor "${fornecedor.nome}".`,
    detalhes: { nome: fornecedor.nome },
  });

  return NextResponse.json(atualizado, { headers: corsMobile(req) });
}
