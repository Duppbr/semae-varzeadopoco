import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const { id } = await params;

    const entrada = await prisma.entrada.findUnique({
      where: { id },
      include: {
        responsavel: { select: { id: true, nome: true, cargo: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
            unidade: { select: { id: true, nome: true, abreviacao: true } },
          },
        },
      },
    });

    if (!entrada) {
      return NextResponse.json(
        { erro: 'Entrada não encontrada.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    return NextResponse.json(entrada, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao buscar entrada:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao buscar entrada.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn)
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401, headers: corsMobile(req) });

  try {
    const { id } = await params;

    const entrada = await prisma.entrada.findUnique({
      where: { id },
      include: {
        itens: true,
      },
    });

    if (!entrada) {
      return NextResponse.json(
        { erro: 'Entrada não encontrada.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Reverter estoque: subtrair o que foi adicionado na entrada
      for (const item of entrada.itens) {
        await tx.estoque.upsert({
          where: { produtoId: item.produtoId },
          update: { quantidade: { decrement: item.quantidade } },
          create: { produtoId: item.produtoId, quantidade: -item.quantidade },
        });
      }

      await tx.entrada.delete({ where: { id } });
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'EXCLUIR',
      entidade: 'Entrada',
      entidadeId: id,
      resumo: `Entrada nº ${entrada.numero} excluída. Estoque revertido.`,
      detalhes: { numero: entrada.numero, itensRevertidos: entrada.itens.length },
    });

    return NextResponse.json(
      { mensagem: 'Entrada excluída e estoque revertido.' },
      { headers: corsMobile(req) }
    );
  } catch (error) {
    console.error('Erro ao excluir entrada:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao excluir entrada.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
