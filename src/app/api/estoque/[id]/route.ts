import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { auditar, movimentar, transacao } from '@/lib/operacoes';
import { numero, objeto, texto, ErroValidacao } from '@/lib/validacao';
import { optionsResponse } from '@/lib/cors-mobile';
export const OPTIONS = optionsResponse;
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return api(req, async session => {
    const { id: produtoId } = await params;
    const b = objeto(await req.json());
    const quantidade = numero(b.quantidade, 'quantidade');
    const motivo = texto(b.motivo, 'motivo', true);
    return transacao(async tx => {
      if (!await tx.produto.findFirst({ where: { id: produtoId, ativo: true } })) throw new ErroValidacao('Produto nao encontrado.', 404);
      const antes = await tx.estoque.findUnique({ where: { produtoId } });
      if (b.quantidadeAnterior !== undefined && numero(b.quantidadeAnterior, 'saldo anterior') !== (antes?.quantidade ?? 0))
        throw new ErroValidacao('O saldo mudou. Atualize a pagina antes de ajustar.', 409);
      const estoque = await movimentar(tx, session, { produtoId, quantidade: quantidade - (antes?.quantidade ?? 0) },
        { tipo: 'ajuste', origemId: produtoId, data: new Date(), motivo });
      await auditar(tx, session, 'estoque', produtoId, 'AJUSTAR', 'Ajuste manual de estoque.', { antes, depois: estoque, motivo });
      return estoque;
    });
  });
}
