// Colunas de preco em branco para o fornecedor preencher e devolver o orcamento.
// Desligadas por ora: o documento sai so com a lista de produtos.
export const COLUNAS_PRECO = false;

export interface Documento {
  titulo: string;
  arquivo: string;
  voltar: string;
  // Bloco em evidencia no topo; no pedido e o fornecedor a quem o documento se destina.
  destaque?: { rotulo: string; titulo: string; linhas: string[] };
  campos: [string, string][];
  colunas: string[];
  // Largura de cada coluna; sem ela a tabela usa o padrao de Produto/Quantidade.
  larguras?: string[];
  linhas: string[][];
  // Linha final da tabela, fora da listagem de itens (ex.: TOTAL GERAL).
  total?: string[];
  assinaturas?: [string, string];
  // Substitui as assinaturas quando o documento e enviado por mensagem, nao impresso.
  rodape?: [string, string];
}
