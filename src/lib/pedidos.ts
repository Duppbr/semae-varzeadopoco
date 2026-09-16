import { prisma } from '@/lib/prisma';
import type { SessionData } from '@/lib/session';
import { auditar, movimentar, transacao } from '@/lib/operacoes';
import { dataCivil, ErroValidacao, lista, numero, objeto, texto } from '@/lib/validacao';
import { pendente } from '@/lib/regras';

export const incluirPedido = { escola: true, responsavel: true,
  itens: { include: { produto: true, unidade: true } },
  entradas: { select: { id: true, numero: true, data: true } } } as const;

export async function criarPedido(valor: unknown, session: SessionData) {
  const b = objeto(valor);
  const data = dataCivil(b.data);
  const itens = lista(b.itens).map(i => ({ produtoId: texto(i.produtoId, 'produto', false, 100) || null,
    descricao: texto(i.descricao, 'descricao', !i.produtoId, 200) || null,
    unidadeId: texto(i.unidadeId, 'unidade', true, 100), quantidade: numero(i.quantidade, 'quantidade', 0.000001) }));
  return transacao(async tx => {
    for (const item of itens) {
      if (!await tx.unidadeMedida.findUnique({ where: { id: item.unidadeId } })) throw new ErroValidacao('Unidade inexistente.');
      if (item.produtoId && !await tx.produto.findFirst({ where: { id: item.produtoId, ativo: true, unidadeId: item.unidadeId } }))
        throw new ErroValidacao('Produto ou unidade invalida.');
    }
    const escolaId = texto(b.escolaId, 'escola', false, 100) || null;
    const responsavelId = texto(b.responsavelId, 'responsavel', false, 100) || null;
    if (escolaId && !await tx.escola.findFirst({ where: { id: escolaId, ativo: true } })) throw new ErroValidacao('Escola invalida.');
    if (responsavelId && !await tx.responsavel.findFirst({ where: { id: responsavelId, ativo: true } })) throw new ErroValidacao('Responsavel invalido.');
    const pedido = await tx.pedidoCompra.create({ data: { data, escolaId, responsavelId,
      observacao: texto(b.observacao, 'observacao'), status: 'PENDENTE', itens: { create: itens } }, include: incluirPedido });
    await auditar(tx, session, 'pedido-compra', pedido.id, 'CRIAR', `Pedido #${pedido.numero} criado.`, pedido);
    return pedido;
  });
}

export async function alterarPedido(id: string, valor: unknown, session: SessionData) {
  const status = texto(objeto(valor).status, 'status', true);
  if (!['ENVIADO', 'CANCELADO'].includes(status)) throw new ErroValidacao('O atendimento e calculado pelo recebimento dos itens.');
  return transacao(async tx => {
    const pedido = await tx.pedidoCompra.findUnique({ where: { id }, include: incluirPedido });
    if (!pedido) throw new ErroValidacao('Pedido nao encontrado.', 404);
    if (pedido.status === status) return pedido;
    if (['CANCELADO', 'ATENDIDO'].includes(pedido.status)) throw new ErroValidacao('Pedido encerrado.', 409);
    if (status === 'ENVIADO' && !['PENDENTE', 'RASCUNHO'].includes(pedido.status)) throw new ErroValidacao('Pedido ja enviado ou parcialmente recebido.', 409);
    if (status === 'CANCELADO') for (const item of pedido.itens)
      await tx.itemPedido.update({ where: { id: item.id }, data: { cancelado: { increment: pendente(item) } } });
    const novo = await tx.pedidoCompra.update({ where: { id }, data: { status }, include: incluirPedido });
    await auditar(tx, session, 'pedido-compra', id, 'STATUS', `Pedido #${pedido.numero}: ${status}.`, { antes: pedido, depois: novo });
    return novo;
  });
}

export async function receberPedido(id: string, valor: unknown, session: SessionData) {
  const b = objeto(valor);
  const chave = texto(b.chaveOperacao, 'identificador do recebimento', true, 100);
  const data = dataCivil(b.data);
  const motivo = texto(b.observacao, 'observacao');
  const itens = lista(b.itens).map(i => ({ id: texto(i.id, 'item', true, 100),
    produtoId: texto(i.produtoId, 'produto', false, 100), quantidade: numero(i.quantidade, 'quantidade recebida', 0),
    encerrar: i.encerrar === true }));
  if (new Set(itens.map(i => i.id)).size !== itens.length) throw new ErroValidacao('Item duplicado.');
  if (!itens.some(i => i.quantidade > 0 || i.encerrar)) throw new ErroValidacao('Selecione itens para receber ou encerrar.');
  // A chave e persistente: retry depois de resposta perdida nao cria outra entrada.
  return transacao(async tx => {
    const anterior = await tx.entrada.findUnique({ where: { chaveOperacao: chave } });
    if (anterior) {
      if (anterior.pedidoId !== id) throw new ErroValidacao('Identificador ja utilizado.', 409);
      return anterior;
    }
    const pedido = await tx.pedidoCompra.findUnique({ where: { id }, include: incluirPedido });
    if (!pedido) throw new ErroValidacao('Pedido nao encontrado.', 404);
    if (['CANCELADO', 'ATENDIDO'].includes(pedido.status)) throw new ErroValidacao('Pedido encerrado.', 409);
    const recebidos: { produtoId: string; unidadeId: string; quantidade: number }[] = [];
    for (const item of itens) {
      const original = pedido.itens.find(i => i.id === item.id);
      if (!original) throw new ErroValidacao('Item nao pertence a este pedido.');
      const restante = pendente(original);
      if (item.quantidade > restante) throw new ErroValidacao('Recebimento maior que a quantidade pendente.');
      if (item.encerrar && restante > item.quantidade && !motivo) throw new ErroValidacao('Justifique o encerramento de itens nao entregues.');
      if (item.quantidade > 0) {
        const produtoId = item.produtoId || original.produtoId;
        if (!produtoId || !await tx.produto.findFirst({ where: { id: produtoId, ativo: true, unidadeId: original.unidadeId } }))
          throw new ErroValidacao('Vincule cada item recebido a um produto ativo com a mesma unidade.');
        recebidos.push({ produtoId, unidadeId: original.unidadeId, quantidade: item.quantidade });
      }
      await tx.itemPedido.update({ where: { id: item.id }, data: {
        recebido: { increment: item.quantidade }, cancelado: { increment: item.encerrar ? restante - item.quantidade : 0 },
      } });
    }
    const entrada = await tx.entrada.create({ data: { data, pedidoId: id, chaveOperacao: chave,
      responsavelId: pedido.responsavelId, fornecedor: texto(b.fornecedor, 'fornecedor'), observacao: motivo,
      itens: { create: recebidos } }, include: { itens: true } });
    for (const item of recebidos) await movimentar(tx, session, item,
      { tipo: 'entrada', origemId: entrada.id, numero: entrada.numero, pedidoId: id, data, motivo: `Pedido #${pedido.numero}. ${motivo}` });
    const atualizados = await tx.itemPedido.findMany({ where: { pedidoId: id } });
    const aberto = atualizados.some(i => pendente(i) > 0);
    const status = aberto ? (atualizados.some(i => i.recebido > 0) ? 'PARCIAL' : pedido.status) :
      (atualizados.some(i => i.recebido > 0) ? 'ATENDIDO' : 'CANCELADO');
    await tx.pedidoCompra.update({ where: { id }, data: { status } });
    await auditar(tx, session, 'pedido-compra', id, 'RECEBER', `Pedido #${pedido.numero}: entrada #${entrada.numero}.`, { antes: pedido.itens, depois: atualizados, entrada, itens });
    await auditar(tx, session, 'entrada', entrada.id, 'CRIAR', `Entrada #${entrada.numero} do pedido #${pedido.numero}.`, entrada);
    return entrada;
  });
}

export async function excluirPedido(id: string, session: SessionData) {
  return transacao(async tx => {
    const pedido = await tx.pedidoCompra.findUnique({ where: { id }, include: incluirPedido });
    if (!pedido) throw new ErroValidacao('Pedido nao encontrado.', 404);
    if (pedido.entradas.length) throw new ErroValidacao('Pedido com recebimentos nao pode ser excluido.', 409);
    await tx.pedidoCompra.delete({ where: { id } });
    await auditar(tx, session, 'pedido-compra', id, 'EXCLUIR', `Pedido #${pedido.numero} excluido.`, pedido);
    return { mensagem: 'Pedido excluido.' };
  });
}

export const buscarPedido = (id: string) => prisma.pedidoCompra.findUnique({ where: { id }, include: incluirPedido });
