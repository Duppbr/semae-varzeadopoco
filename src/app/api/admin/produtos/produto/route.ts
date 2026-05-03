import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { diffCampos, registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';

const camposProduto = ['sku', 'nome', 'marca', 'amperagem', 'tipo', 'cca', 'garantia'] as const;

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ erro: 'Corpo da requisicao invalido' }, { status: 400 });
    }

    const { id, sku, nome, marca, amperagem, tipo, cca, garantia } = body;
    if (!id) return NextResponse.json({ erro: 'ID do produto e obrigatorio' }, { status: 400 });

    if (sku !== undefined && sku.trim() === '') return NextResponse.json({ erro: 'SKU nao pode ser vazio' }, { status: 400 });
    if (nome !== undefined && nome.trim() === '') return NextResponse.json({ erro: 'Nome nao pode ser vazio' }, { status: 400 });
    if (marca !== undefined && marca.trim() === '') return NextResponse.json({ erro: 'Marca nao pode ser vazia' }, { status: 400 });

    const antes = await prisma.produto.findUnique({ where: { id } });
    if (!antes) return NextResponse.json({ erro: 'Produto nao encontrado' }, { status: 404 });

    const data: Record<string, string | number | null> = {};
    if (sku !== undefined) data.sku = sku;
    if (nome !== undefined) data.nome = nome;
    if (marca !== undefined) data.marca = marca;
    if (amperagem !== undefined) data.amperagem = amperagem || null;
    if (tipo !== undefined) data.tipo = tipo || null;
    if (cca !== undefined) data.cca = cca ? parseInt(cca) : null;
    if (garantia !== undefined) data.garantia = garantia || null;

    const updated = await prisma.produto.update({ where: { id }, data });
    const alteracoes = diffCampos(antes, updated, camposProduto);

    if (Object.keys(alteracoes).length > 0) {
      await registrarAuditoria({
        req,
        session,
        acao: 'produto_atualizado',
        entidade: 'Produto',
        entidadeId: id,
        resumo: `${session.nome} alterou os dados de ${updated.sku}.`,
        detalhes: {
          produto: { id: updated.id, sku: updated.sku, nome: updated.nome },
          alteracoes,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('ERRO AO ATUALIZAR PRODUTO:', error);

    if (code === 'P2002') {
      return NextResponse.json({ erro: 'Ja existe um produto com este SKU.' }, { status: 409 });
    }

    return NextResponse.json({ erro: 'Erro interno do servidor', detalhe: message }, { status: 500 });
  }
}
