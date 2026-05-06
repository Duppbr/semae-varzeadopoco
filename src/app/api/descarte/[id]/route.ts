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

    const descarte = await prisma.descarte.findUnique({
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

    if (!descarte) {
      return NextResponse.json(
        { erro: 'Descarte não encontrado.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    return NextResponse.json(descarte, { headers: corsMobile(req) });
  } catch (error) {
    console.error('Erro ao buscar descarte:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao buscar descarte.' },
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

    const descarte = await prisma.descarte.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!descarte) {
      return NextResponse.json(
        { erro: 'Descarte não encontrado.' },
        { status: 404, headers: corsMobile(req) }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Reverter estoque: adicionar de volta o que foi descartado
      for (const item of descarte.itens) {
        await tx.estoque.upsert({
          where: { produtoId: item.produtoId },
          update: { quantidade: { increment: item.quantidade } },
          create: { produtoId: item.produtoId, quantidade: item.quantidade },
        });
      }

      await tx.descarte.delete({ where: { id } });
    });

    await registrarAuditoria({
      session,
      req,
      acao: 'EXCLUIR',
      entidade: 'Descarte',
      entidadeId: id,
      resumo: `Descarte nº ${descarte.numero} excluído. Estoque revertido.`,
      detalhes: { numero: descarte.numero, itensRevertidos: descarte.itens.length },
    });

    return NextResponse.json(
      { mensagem: 'Descarte excluído e estoque revertido.' },
      { headers: corsMobile(req) }
    );
  } catch (error) {
    console.error('Erro ao excluir descarte:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao excluir descarte.' },
      { status: 500, headers: corsMobile(req) }
    );
  }
}
