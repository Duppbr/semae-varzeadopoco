import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 });
    }

    const { id, sku, nome, marca, amperagem, tipo, cca, garantia } = body;

    if (!id) {
      return NextResponse.json({ erro: 'ID do produto é obrigatório' }, { status: 400 });
    }

    if (sku !== undefined && sku.trim() === '') {
      return NextResponse.json({ erro: 'SKU não pode ser vazio' }, { status: 400 });
    }
    if (nome !== undefined && nome.trim() === '') {
      return NextResponse.json({ erro: 'Nome não pode ser vazio' }, { status: 400 });
    }
    if (marca !== undefined && marca.trim() === '') {
      return NextResponse.json({ erro: 'Marca não pode ser vazia' }, { status: 400 });
    }

    const data: any = {};
    if (sku !== undefined) data.sku = sku;
    if (nome !== undefined) data.nome = nome;
    if (marca !== undefined) data.marca = marca;
    if (amperagem !== undefined) data.amperagem = amperagem || null;
    if (tipo !== undefined) data.tipo = tipo || null;
    if (cca !== undefined) data.cca = cca ? parseInt(cca) : null;
    if (garantia !== undefined) data.garantia = garantia || null;

    const updated = await prisma.produto.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('ERRO AO ATUALIZAR PRODUTO:', error);

    if (error?.code === 'P2002') {
      return NextResponse.json({ erro: 'Já existe um produto com este SKU.' }, { status: 409 });
    }

    return NextResponse.json({
      erro: 'Erro interno do servidor',
      detalhe: error?.message || 'Erro desconhecido',
    }, { status: 500 });
  }
}