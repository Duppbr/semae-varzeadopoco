import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionData } from '@/lib/session';
import { dataCivil, ErroValidacao, lista, numero, objeto, texto } from '@/lib/validacao';

export type TipoMovimento = 'entrada' | 'saida' | 'descarte';
export const incluirItens = { responsavel: true, itens: { include: { produto: true, unidade: true } } } as const;

// Serializacao impede dois recebimentos/estornos de consumir o mesmo saldo pendente.
export function transacao<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
}

export async function auditar(tx: Prisma.TransactionClient, session: SessionData, entidade: string, id: string, acao: string, resumo: string, detalhes: unknown) {
  await tx.auditoria.create({ data: {
    usuarioId: session.userId, usuarioNome: session.nome, usuarioIdentificador: session.identificador,
    entidade, entidadeId: id, acao, resumo,
    detalhes: JSON.parse(JSON.stringify(detalhes)) as Prisma.InputJsonValue,
  } });
}

export async function validarItens(tx: Prisma.TransactionClient, valor: unknown) {
  const itens = lista(valor).map(i => ({ produtoId: texto(i.produtoId, 'produto', true, 100),
    unidadeId: texto(i.unidadeId, 'unidade', true, 100), quantidade: numero(i.quantidade, 'quantidade', 0.000001) }));
  if (new Set(itens.map(i => i.produtoId)).size !== itens.length) throw new ErroValidacao('Produto repetido na mesma movimentacao.');
  const produtos = await tx.produto.findMany({ where: { id: { in: itens.map(i => i.produtoId) }, ativo: true } });
  for (const item of itens) {
    if (!produtos.some(p => p.id === item.produtoId && p.unidadeId === item.unidadeId))
      throw new ErroValidacao('Produto inativo, inexistente ou unidade diferente do cadastro.');
  }
  return itens;
}

export async function movimentar(tx: Prisma.TransactionClient, session: SessionData, item: { produtoId: string; quantidade: number }, origem: {
  tipo: string; origemId: string; numero?: number; pedidoId?: string | null; data: Date; motivo?: string | null;
}) {
  const produto = await tx.produto.findUniqueOrThrow({ where: { id: item.produtoId }, include: { unidade: true } });
  // Saldo negativo continua permitido; historico e saldo sempre gravam na mesma transacao.
  const estoque = await tx.estoque.upsert({ where: { produtoId: item.produtoId },
    create: { produtoId: item.produtoId, quantidade: item.quantidade }, update: { quantidade: { increment: item.quantidade } } });
  await tx.movimentoEstoque.create({ data: { ...origem, produtoId: item.produtoId, quantidade: item.quantidade, saldo: estoque.quantidade,
    produtoNome: produto.nome, unidade: produto.unidade.abreviacao, usuarioNome: session.nome } });
  return estoque;
}

export async function criarMovimento(tipo: TipoMovimento, valor: unknown, session: SessionData) {
  const b = objeto(valor);
  const data = dataCivil(b.data);
  const responsavelId = texto(b.responsavelId, 'responsavel', false, 100) || null;
  const observacao = texto(b.observacao, 'observacao') || null;
  return transacao(async tx => {
    const itens = await validarItens(tx, b.itens);
    if (responsavelId && !await tx.responsavel.findFirst({ where: { id: responsavelId, ativo: true } })) throw new ErroValidacao('Responsavel invalido.');
    const comum = { data, responsavelId, observacao, itens: { create: itens } };
    let documento;
    if (tipo === 'entrada') {
      const fornecedorId = texto(b.fornecedorId, 'fornecedor', false, 100) || null;
      if (fornecedorId && !await tx.fornecedor.findFirst({ where: { id: fornecedorId, ativo: true } })) throw new ErroValidacao('Fornecedor invalido.');
      // fornecedorNome so sobrevive das entradas antigas, digitadas antes do cadastro existir.
      documento = await tx.entrada.create({ data: { ...comum, fornecedorId, fornecedorNome: texto(b.fornecedor, 'fornecedor') || null },
        include: { ...incluirItens, fornecedor: true } });
    } else if (tipo === 'saida') {
      const escolaId = texto(b.escolaId, 'escola', true, 100);
      if (!await tx.escola.findFirst({ where: { id: escolaId, ativo: true } })) throw new ErroValidacao('Escola invalida.');
      documento = await tx.saida.create({ data: { ...comum, escolaId, recebedor: texto(b.recebedor, 'recebedor') }, include: incluirItens });
    } else documento = await tx.descarte.create({ data: { ...comum, motivo: texto(b.motivo, 'motivo', true) }, include: incluirItens });
    for (const item of itens) await movimentar(tx, session, { ...item, quantidade: item.quantidade * (tipo === 'entrada' ? 1 : -1) },
      { tipo, origemId: documento.id, numero: documento.numero, data, motivo: observacao });
    await auditar(tx, session, tipo, documento.id, 'CRIAR', `${tipo} #${documento.numero} registrada.`, documento);
    return documento;
  });
}

export async function buscarMovimento(tipo: TipoMovimento, id: string) {
  if (tipo === 'entrada') return prisma.entrada.findUnique({ where: { id }, include: { ...incluirItens, fornecedor: true, pedido: { select: { id: true, numero: true } } } });
  if (tipo === 'saida') return prisma.saida.findUnique({ where: { id }, include: { ...incluirItens, escola: true } });
  return prisma.descarte.findUnique({ where: { id }, include: incluirItens });
}

export async function excluirMovimento(tipo: TipoMovimento, id: string, session: SessionData) {
  return transacao(async tx => {
    const doc = tipo === 'entrada' ? await tx.entrada.findUnique({ where: { id }, include: incluirItens }) :
      tipo === 'saida' ? await tx.saida.findUnique({ where: { id }, include: incluirItens }) :
        await tx.descarte.findUnique({ where: { id }, include: incluirItens });
    if (!doc) throw new ErroValidacao('Documento nao encontrado.', 404);
    // Recebimentos vinculados nao podem ser apagados e perder a rastreabilidade do pedido.
    if ('pedidoId' in doc && doc.pedidoId) throw new ErroValidacao('Entrada vinculada a pedido: registre um ajuste de estoque com justificativa.', 409);
    if (!('status' in doc) || doc.status !== 'CANCELADO') {
      for (const item of doc.itens) await movimentar(tx, session, { ...item, quantidade: item.quantidade * (tipo === 'entrada' ? -1 : 1) },
        { tipo: `estorno-${tipo}`, origemId: id, numero: doc.numero, data: new Date(), motivo: 'Exclusao do documento' });
    }
    if (tipo === 'entrada') await tx.entrada.delete({ where: { id } });
    else if (tipo === 'saida') await tx.saida.delete({ where: { id } });
    else await tx.descarte.delete({ where: { id } });
    await auditar(tx, session, tipo, id, 'EXCLUIR', `${tipo} #${doc.numero} excluida.`, doc);
    return { mensagem: 'Documento excluido; estorno registrado no historico.' };
  });
}

export async function statusSaida(id: string, valor: unknown, session: SessionData) {
  const status = texto(objeto(valor).status, 'status', true);
  if (!['PENDENTE', 'ENTREGUE', 'CANCELADO'].includes(status)) throw new ErroValidacao('Status invalido.');
  return transacao(async tx => {
    const antes = await tx.saida.findUnique({ where: { id }, include: incluirItens });
    if (!antes) throw new ErroValidacao('Saida nao encontrada.', 404);
    if (antes.status === status) return antes;
    if (antes.status === 'CANCELADO') throw new ErroValidacao('Saida cancelada nao pode ser reaberta. Crie outra saida.', 409);
    if (status === 'CANCELADO') for (const item of antes.itens) await movimentar(tx, session, item,
      { tipo: 'estorno-saida', origemId: id, numero: antes.numero, data: new Date(), motivo: 'Cancelamento' });
    const depois = await tx.saida.update({ where: { id }, data: { status }, include: { ...incluirItens, escola: true } });
    await auditar(tx, session, 'saida', id, 'STATUS', `Saida #${antes.numero}: ${status}.`, { antes: antes.status, depois: status });
    return depois;
  });
}
