import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Documento } from '@/lib/documento';

// PDF binario real, com texto selecionavel e paginacao; nunca compartilha URL autenticada.
export function gerarPdf(documento: Documento, logo?: string) {
  const pdf = new jsPDF();
  pdf.setProperties({ title: documento.titulo, author: 'SEMAE' });
  if (logo) pdf.addImage(logo, 'PNG', 14, 10, 18, 18);
  pdf.setFontSize(16);
  pdf.text('SEMAE', logo ? 36 : 14, 18);
  pdf.setFontSize(10);
  pdf.text('Prefeitura Municipal de Várzea do Poço - BA', logo ? 36 : 14, 25);
  autoTable(pdf, { startY: 34, theme: 'plain', styles: { fontSize: 12 }, body: [[documento.titulo]] });
  autoTable(pdf, { theme: 'plain', styles: { fontSize: 10, overflow: 'linebreak' }, body: documento.campos });
  autoTable(pdf, { head: [documento.colunas], body: documento.linhas, theme: 'striped',
    styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 58, 95] }, margin: { bottom: 20 }, rowPageBreak: 'avoid' });
  autoTable(pdf, { theme: 'plain', styles: { fontSize: 10, minCellHeight: 25, valign: 'bottom' },
    body: [documento.assinaturas.map(a => `__________________________\n${a}`)], pageBreak: 'avoid' });
  for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
    pdf.setPage(i); pdf.setFontSize(8);
    pdf.text(`SEMAE - ${i}/${pdf.getNumberOfPages()}`, 105, 288, { align: 'center' });
  }
  return pdf;
}
