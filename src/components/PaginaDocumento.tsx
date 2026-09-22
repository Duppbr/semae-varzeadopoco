import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { buscarMovimento, type TipoMovimento } from '@/lib/operacoes';
import { buscarPedido } from '@/lib/pedidos';
import { formatarData } from '@/lib/regras';
import DocumentoImprimivel from '@/components/DocumentoImprimivel';
import { COLUNAS_PRECO, type Documento } from '@/lib/documento';

type Pedido = NonNullable<Awaited<ReturnType<typeof buscarPedido>>>;

const nomeDoItem = (item: { produto: { nome: string } | null; descricao?: string | null }) =>
  item.produto?.nome || item.descricao || '-';

// Quantidade para leitura humana: 1,5 e 1.200, nao 1.5 e 1200.
const quantidade = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

// O pedido sai do sistema como documento para o fornecedor. Status e o controle de
// recebimento sao internos e ficam so na tela do pedido, fora deste papel.
function documentoDoPedido(pedido: Pedido, id: string): Documento {
  const fornecedor = pedido.fornecedor;
  const campos: Documento['campos'] = [
    ['Data do pedido', formatarData(pedido.data)],
    ['Local de entrega', pedido.escola?.nome || 'SEMAE - Várzea do Poço/BA'],
  ];
  if (pedido.observacao) campos.push(['Observação', pedido.observacao]);
  const itens = [...pedido.itens].sort((a, b) => nomeDoItem(a).localeCompare(nomeDoItem(b), 'pt-BR'));
  return {
    titulo: `Pedido / Orçamento nº ${pedido.numero}`,
    arquivo: `semae-pedido-${pedido.numero}.pdf`,
    voltar: `/pedido-compra/${id}`,
    // Dado em branco do fornecedor nao vira linha vazia nem traco no documento.
    destaque: fornecedor ? {
      rotulo: 'Fornecedor', titulo: fornecedor.nome,
      linhas: [
        fornecedor.cnpj && `CNPJ ${fornecedor.cnpj}`,
        [fornecedor.telefone, fornecedor.email].filter(Boolean).join(' · '),
        fornecedor.contato && `A/C ${fornecedor.contato}`,
        fornecedor.endereco,
      ].filter((linha): linha is string => Boolean(linha)),
    } : undefined,
    campos,
    colunas: ['#', 'Produto', 'Qtd.', 'Un.', ...(COLUNAS_PRECO ? ['Vl. unit.', 'Total'] : [])],
    larguras: COLUNAS_PRECO ? ['6%', '43%', '13%', '11%', '13.5%', '13.5%'] : ['8%', '60%', '19%', '13%'],
    linhas: itens.map((item, i) => [String(i + 1), nomeDoItem(item), quantidade(item.quantidade), item.unidade.abreviacao,
      ...(COLUNAS_PRECO ? ['', ''] : [])]),
    total: COLUNAS_PRECO ? ['', 'TOTAL GERAL', '', '', '', ''] : undefined,
    rodape: ['Pedido realizado por', pedido.responsavel?.nome || 'SEMAE'],
  };
}

export default async function PaginaDocumento({ tipo, id }: { tipo: TipoMovimento | 'pedido-compra'; id: string }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');
  if (tipo === 'pedido-compra') {
    const pedido = await buscarPedido(id);
    if (!pedido) notFound();
    return <DocumentoImprimivel documento={documentoDoPedido(pedido, id)} />;
  }
  const doc = await buscarMovimento(tipo, id);
  if (!doc) notFound();
  const nome = { entrada: 'Entrada', saida: 'Saída', descarte: 'Descarte' }[tipo];
  const campos: Documento['campos'] = [['Data', formatarData(doc.data)], ['Responsável', doc.responsavel?.nome || '-']];
  if ('escola' in doc) campos.push(['Destino', doc.escola?.nome || 'Geral / SEMAE']);
  // Entradas novas apontam para o cadastro; as antigas so tem o nome digitado.
  const fornecedor = ('fornecedor' in doc && doc.fornecedor?.nome) || ('fornecedorNome' in doc && doc.fornecedorNome) || '';
  if (fornecedor) campos.push(['Fornecedor', fornecedor]);
  if ('recebedor' in doc) campos.push(['Recebedor', doc.recebedor || '-']);
  if ('motivo' in doc) campos.push(['Motivo', doc.motivo]);
  if ('status' in doc) campos.push(['Status', doc.status]);
  if ('pedido' in doc && doc.pedido) campos.push(['Pedido de origem', `#${doc.pedido.numero}`]);
  if (doc.observacao) campos.push(['Observação', doc.observacao]);
  return <DocumentoImprimivel documento={{ titulo: `${nome} #${doc.numero}`, arquivo: `semae-${tipo}-${doc.numero}.pdf`, voltar: `/${tipo}/${id}`,
    campos, colunas: ['Produto', 'Quantidade', 'Un.'],
    linhas: [...doc.itens].sort((a, b) => nomeDoItem(a).localeCompare(nomeDoItem(b), 'pt-BR'))
      .map(i => [nomeDoItem(i), quantidade(i.quantidade), i.unidade.abreviacao]),
    assinaturas: [doc.responsavel?.nome || 'Responsável SEMAE', ('recebedor' in doc && doc.recebedor) || 'Recebedor / Conferente'] }} />;
}
