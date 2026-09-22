import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Documento } from '@/lib/documento';

const CINZA: [number, number, number] = [100, 116, 139];
// Alinha as tabelas ao cabecalho escrito em x=14, em vez do recuo padrao do autoTable.
const MARGEM = { left: 14, right: 14 };

// PDF binario real, com texto selecionavel e paginacao; nunca compartilha URL autenticada.
export function gerarPdf(documento: Documento, logo?: string) {
  const pdf = new jsPDF();
  pdf.setProperties({ title: documento.titulo, author: 'SEMAE' });
  if (logo) pdf.addImage(logo, 'PNG', 14, 10, 18, 18);
  pdf.setFontSize(16);
  pdf.text('SEMAE', logo ? 36 : 14, 18);
  pdf.setFontSize(10);
  pdf.text('Prefeitura Municipal de Várzea do Poço - BA', logo ? 36 : 14, 25);
  autoTable(pdf, { startY: 34, theme: 'plain', margin: MARGEM, styles: { fontSize: 12 }, body: [[documento.titulo]] });
  if (documento.destaque) {
    const { rotulo, titulo, linhas } = documento.destaque;
    autoTable(pdf, { theme: 'plain', margin: MARGEM, styles: { fontSize: 10, overflow: 'linebreak', cellPadding: 1 }, body: [
      [{ content: rotulo.toUpperCase(), styles: { fontSize: 8, textColor: CINZA } }],
      [{ content: titulo, styles: { fontSize: 12, fontStyle: 'bold' } }],
      ...linhas.map(linha => [{ content: linha, styles: { fontSize: 9, textColor: CINZA } }]),
    ] });
  }
  autoTable(pdf, { theme: 'plain', margin: MARGEM, styles: { fontSize: 10, overflow: 'linebreak' }, body: documento.campos });
  // Larguras vem em porcentagem da area util da pagina, ja descontadas as margens.
  const util = pdf.internal.pageSize.getWidth() - MARGEM.left - MARGEM.right;
  autoTable(pdf, { head: [documento.colunas],
    body: documento.total ? [...documento.linhas, documento.total] : documento.linhas, theme: 'striped',
    styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: Object.fromEntries((documento.larguras ?? []).map((largura, i) =>
      [i, { cellWidth: (parseFloat(largura) / 100) * util }])),
    headStyles: { fillColor: [30, 58, 95] }, margin: { ...MARGEM, bottom: 20 }, rowPageBreak: 'avoid' });
  if (documento.assinaturas) autoTable(pdf, { theme: 'plain', margin: MARGEM, styles: { fontSize: 10, minCellHeight: 25, valign: 'bottom' },
    body: [documento.assinaturas.map(a => `__________________________\n${a}`)], pageBreak: 'avoid' });
  if (documento.rodape) autoTable(pdf, { theme: 'plain', margin: MARGEM, styles: { fontSize: 10, cellPadding: 1 }, pageBreak: 'avoid', body: [
    [{ content: documento.rodape[0], styles: { fontSize: 8, textColor: CINZA } }],
    [{ content: documento.rodape[1], styles: { fontStyle: 'bold' } }],
  ] });
  for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
    pdf.setPage(i); pdf.setFontSize(8);
    pdf.text(`SEMAE - ${i}/${pdf.getNumberOfPages()}`, 105, 288, { align: 'center' });
  }
  return pdf;
}
