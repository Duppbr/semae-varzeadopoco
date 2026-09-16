export interface Documento {
  titulo: string;
  arquivo: string;
  voltar: string;
  campos: [string, string][];
  colunas: string[];
  linhas: string[][];
  assinaturas: [string, string];
}
