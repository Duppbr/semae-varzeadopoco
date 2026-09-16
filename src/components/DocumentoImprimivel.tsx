import type { Documento } from '@/lib/documento';
import PdfActions from '@/components/PdfActions';

export default function DocumentoImprimivel({ documento }: { documento: Documento }) {
  // Somente o layout raiz cria html/body; eventos ficam no componente cliente.
  return <div className="documento">
    <style>{`
      .documento {font-family:Arial,sans-serif;color:#1e293b;}
      .pdf-actions {position:sticky;top:0;background:white;border-bottom:1px solid #ddd;padding:12px;z-index:30;}
      .pdf-actions nav {display:flex;gap:8px;flex-wrap:wrap;}
      .pdf-actions a,.pdf-actions button {display:flex;align-items:center;gap:6px;padding:9px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;cursor:pointer;}
      .pdf-actions button:disabled {opacity:.5;}
      .pdf-actions p {color:#b91c1c;margin-top:8px;}
      .documento article {max-width:820px;margin:20px auto;background:white;padding:28px;}
      .doc-header {display:flex;gap:16px;align-items:center;border-bottom:2px solid #1e3a5f;padding-bottom:16px;}
      .doc-header img {width:56px;height:56px;object-fit:contain;}
      .doc-header h1 {font-size:18px;font-weight:700;}
      .doc-header p {font-size:11px;}
      .documento h2 {font-size:16px;font-weight:700;margin:18px 0;overflow-wrap:anywhere;}
      .doc-campos {display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
      .doc-campos dt {font-size:11px;color:#64748b;}
      .doc-campos dd {font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;}
      .documento table {width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;}
      .documento th,.documento td {padding:8px;border-bottom:1px solid #ddd;text-align:left;overflow-wrap:anywhere;}
      .documento th {background:#e2e8f0;}
      .documento th:first-child {width:45%;}
      .documento tr {break-inside:avoid;}
      .doc-assinaturas {display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:70px;break-inside:avoid;}
      .doc-assinaturas p {border-top:1px solid #334155;text-align:center;padding-top:8px;font-size:12px;}
      @media(max-width:480px) {.documento article {padding:12px;margin:0;} .doc-header {gap:8px;} .doc-header h1 {font-size:15px;} .documento td,.documento th {padding:5px;font-size:11px;} }
      @page {size:A4;margin:12mm;}
      @media print {.pdf-actions {display:none!important;} .documento article {max-width:none;margin:0;padding:0;} body {background:white!important;} thead {display:table-header-group;} }
    `}</style>
    <PdfActions documento={documento} />
    <article>
      <header className="doc-header">
        {/* Imagens estaticas sem handlers no Server Component. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-semae.png" alt="SEMAE" />
        <div><h1>SEMAE</h1><p>Setor Municipal de Alimentação Escolar</p><p>Prefeitura Municipal de Várzea do Poço - BA</p></div>
      </header>
      <h2>{documento.titulo}</h2>
      <dl className="doc-campos">{documento.campos.map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{valor || '-'}</dd></div>)}</dl>
      <table><thead><tr>{documento.colunas.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{documento.linhas.map((linha, i) => <tr key={i}>{linha.map((valor, j) => <td key={j}>{valor}</td>)}</tr>)}</tbody></table>
      <footer className="doc-assinaturas">{documento.assinaturas.map((a, i) => <p key={i}>{a}</p>)}</footer>
    </article>
  </div>;
}
