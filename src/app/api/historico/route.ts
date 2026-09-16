import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { ErroValidacao } from '@/lib/validacao';

export async function GET(req: NextRequest) {
  return api(req, async () => {
    const produtoId = req.nextUrl.searchParams.get('produtoId');
    const origemId = req.nextUrl.searchParams.get('origemId');
    if (!produtoId && !origemId) throw new ErroValidacao('Informe o produto ou documento.');
    const offset = Math.max(0, Math.floor(Number(req.nextUrl.searchParams.get('offset')) || 0));
    const movimentos = await prisma.movimentoEstoque.findMany({
      where: produtoId ? { produtoId } : { OR: [{ origemId: origemId! }, { pedidoId: origemId! }] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: offset, take: 51,
    });
    const auditorias = origemId && offset === 0 ? await prisma.auditoria.findMany({ where: { entidadeId: origemId },
      orderBy: { createdAt: 'desc' }, take: 50,
      select: { id: true, createdAt: true, resumo: true, usuarioNome: true } }) : [];
    return { movimentos: movimentos.slice(0, 50), mais: movimentos.length > 50, auditorias };
  });
}
