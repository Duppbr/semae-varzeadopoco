import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { diffCampos, registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';

const camposAuditados = [
  'precoCartao',
  'precoCartao3x',
  'precoAvista',
  'precoAvistaMinimo',
  'quantidadeEstoque',
  'ativo',
  'prioridade',
] as const;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const lojaId = req.nextUrl.searchParams.get('lojaId');
  if (!lojaId) return NextResponse.json({ erro: 'lojaId obrigatorio' }, { status: 400 });

  const produtos = await prisma.produtoLoja.findMany({
    where: { lojaId: parseInt(lojaId) },
    include: { produto: true },
    orderBy: { produto: { nome: 'asc' } },
  });

  return NextResponse.json(produtos);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { id, precoCartao, precoCartao3x, precoAvista, precoAvistaMinimo, quantidadeEstoque, ativo, prioridade } = body;
  if (!id) return NextResponse.json({ erro: 'ID obrigatorio' }, { status: 400 });

  const antes = await prisma.produtoLoja.findUnique({
    where: { id },
    include: { produto: true, loja: true },
  });
  if (!antes) return NextResponse.json({ erro: 'Registro nao encontrado' }, { status: 404 });

  const data: Record<string, number | string | boolean | null> = {};
  if (precoCartao !== undefined) data.precoCartao = precoCartao;
  if (precoCartao3x !== undefined) data.precoCartao3x = precoCartao3x;
  if (precoAvista !== undefined) data.precoAvista = precoAvista;
  if (precoAvistaMinimo !== undefined) data.precoAvistaMinimo = precoAvistaMinimo;
  if (quantidadeEstoque !== undefined) data.quantidadeEstoque = quantidadeEstoque;
  if (ativo !== undefined) data.ativo = ativo;
  if (prioridade !== undefined) data.prioridade = prioridade;

  const updated = await prisma.produtoLoja.update({
    where: { id },
    data,
    include: { produto: true, loja: true },
  });

  const alteracoes = diffCampos(antes, updated, camposAuditados);
  if (Object.keys(alteracoes).length > 0) {
    await registrarAuditoria({
      req,
      session,
      acao: 'produto_loja_atualizado',
      entidade: 'ProdutoLoja',
      entidadeId: id,
      resumo: `${session.nome} alterou ${updated.produto.sku} na loja ${updated.loja.nome}.`,
      detalhes: {
        produto: {
          id: updated.produto.id,
          sku: updated.produto.sku,
          nome: updated.produto.nome,
        },
        loja: {
          id: updated.loja.id,
          nome: updated.loja.nome,
        },
        alteracoes,
      },
    });
  }

  return NextResponse.json(updated);
}
