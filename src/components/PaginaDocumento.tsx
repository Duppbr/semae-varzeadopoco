import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { buscarMovimento, type TipoMovimento } from '@/lib/operacoes';
import { buscarPedido } from '@/lib/pedidos';
import { formatarData, pendente, statusPedido } from '@/lib/regras';
import DocumentoImprimivel from '@/components/DocumentoImprimivel';
import type { Documento } from '@/lib/documento';

export default async function PaginaDocumento({ tipo, id }: { tipo: TipoMovimento | 'pedido-compra'; id: string }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');
  const doc = tipo === 'pedido-compra' ? await buscarPedido(id) : await buscarMovimento(tipo, id);
  if (!doc) notFound();
  const nome = { entrada: 'Entrada', saida: 'Saída', descarte: 'Descarte', 'pedido-compra': 'Pedido de compra' }[tipo];
  const campos: Documento['campos'] = [['Data', formatarData(doc.data)], ['Responsável', doc.responsavel?.nome || '-']];
  if ('escola' in doc) campos.push(['Destino', doc.escola?.nome || 'Geral / SEMAE']);
  const fornecedor = ('fornecedor' in doc && doc.fornecedor?.nome) || ('fornecedorNome' in doc && doc.fornecedorNome) || '';
  // Dado em branco nao vira linha vazia no documento enviado ao fornecedor.
  if (fornecedor) campos.push(['Fornecedor', fornecedor]);
  if ('recebedor' in doc) campos.push(['Recebedor', doc.recebedor || '-']);
  if ('motivo' in doc) campos.push(['Motivo', doc.motivo]);
  if ('status' in doc) campos.push(['Status', tipo === 'pedido-compra' ? statusPedido[doc.status] || doc.status : doc.status]);
  if ('pedido' in doc && doc.pedido) campos.push(['Pedido de origem', `#${doc.pedido.numero}`]);
  if (doc.observacao) campos.push(['Observação', doc.observacao]);
  const pedido = tipo === 'pedido-compra';
  return <DocumentoImprimivel documento={{ titulo: `${nome} #${doc.numero}`, arquivo: `semae-${tipo}-${doc.numero}.pdf`, voltar: `/${tipo}/${id}`,
    campos, colunas: pedido ? ['Produto', 'Pedido', 'Recebido', 'Pendente', 'Un.'] : ['Produto', 'Quantidade', 'Un.'],
    linhas: [...doc.itens].sort((a, b) => (a.produto?.nome || ('descricao' in a ? a.descricao : '') || '').localeCompare(b.produto?.nome || ('descricao' in b ? b.descricao : '') || '', 'pt-BR')).map(i =>
      [i.produto?.nome || ('descricao' in i ? i.descricao : '') || '-', String(i.quantidade),
        ...('recebido' in i ? [String(i.recebido), String(pendente(i))] : []), i.unidade.abreviacao]),
    assinaturas: [doc.responsavel?.nome || 'Responsável SEMAE', ('recebedor' in doc && doc.recebedor) || 'Recebedor / Conferente'] }} />;
}
