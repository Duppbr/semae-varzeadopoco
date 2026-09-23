// "Refazer pedido": copia um pedido antigo para um formulario novo. So entra o que
// ainda esta ativo; o resto vira aviso. O produto usa a unidade ATUAL do cadastro,
// e se ela mudou desde o pedido antigo o item vem marcado para conferir a quantidade.

export interface ItemRefeito {
  produtoId: string; produtoNome: string; unidadeId: string; unidadeAbrev: string;
  estoqueAtual: number; quantidade: string; aviso?: string;
}

export interface PedidoBase {
  numero: number; observacao: string | null;
  escolaId: string | null; responsavelId: string | null; fornecedorId: string | null;
  fornecedor: { nome: string } | null; escola: { nome: string } | null; responsavel: { nome: string } | null;
  itens: { produtoId: string | null; descricao: string | null; unidadeId: string; quantidade: number;
    produto: { nome: string } | null; unidade: { abreviacao: string } }[];
}

interface ProdutoAtual { id: string; nome: string; unidade: { id: string; abreviacao: string }; estoque?: { quantidade: number } | null }

export function montarDaBase(base: PedidoBase, listas: {
  produtos: ProdutoAtual[]; unidades: { id: string; abreviacao: string }[];
  fornecedores: { id: string }[]; escolas: { id: string }[]; responsaveis: { id: string }[];
}) {
  const avisos: string[] = [];
  const ativo = (lista: { id: string }[], id: string | null) => Boolean(id && lista.some(x => x.id === id));
  const fornecedorId = ativo(listas.fornecedores, base.fornecedorId) ? base.fornecedorId! : '';
  if (base.fornecedorId && !fornecedorId) avisos.push(`O fornecedor "${base.fornecedor?.nome ?? ''}" está inativo. Escolha outro.`);
  const escolaId = ativo(listas.escolas, base.escolaId) ? base.escolaId! : '';
  if (base.escolaId && !escolaId) avisos.push(`O destino "${base.escola?.nome ?? ''}" está inativo e não foi copiado.`);
  const responsavelId = ativo(listas.responsaveis, base.responsavelId) ? base.responsavelId! : '';
  if (base.responsavelId && !responsavelId) avisos.push(`O responsável "${base.responsavel?.nome ?? ''}" está inativo e não foi copiado.`);

  const itens: ItemRefeito[] = [];
  const foraDeLinha: string[] = [];
  for (const i of base.itens) {
    const quantidade = String(i.quantidade);
    if (i.produtoId) {
      const p = listas.produtos.find(p => p.id === i.produtoId);
      if (!p) { foraDeLinha.push(i.produto?.nome ?? 'produto'); continue; }
      if (itens.some(x => x.produtoId === p.id)) continue;
      itens.push({ produtoId: p.id, produtoNome: p.nome, unidadeId: p.unidade.id, unidadeAbrev: p.unidade.abreviacao,
        estoqueAtual: p.estoque?.quantidade ?? 0, quantidade,
        aviso: p.unidade.id !== i.unidadeId ? `Unidade mudou: era ${i.unidade.abreviacao}, agora ${p.unidade.abreviacao}. Confira a quantidade.` : undefined });
    } else {
      const u = listas.unidades.find(u => u.id === i.unidadeId);
      if (!u) { foraDeLinha.push(i.descricao ?? 'item'); continue; }
      itens.push({ produtoId: '', produtoNome: i.descricao ?? '', unidadeId: u.id, unidadeAbrev: u.abreviacao, estoqueAtual: 0, quantidade });
    }
  }
  if (foraDeLinha.length) avisos.push(`Não copiados por estarem inativos no cadastro: ${foraDeLinha.join(', ')}.`);
  return { fornecedorId, escolaId, responsavelId, observacao: base.observacao ?? '', itens, avisos };
}
