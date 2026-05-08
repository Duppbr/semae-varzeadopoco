import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface Props { params: Promise<{ id: string }> }

export default async function SaidaPdfPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');
  const { id } = await params;
  const saida = await prisma.saida.findUnique({
    where: { id },
    include: {
      escola: true,
      responsavel: true,
      itens: { include: { produto: true, unidade: true } },
    },
  });

  if (!saida) notFound();

  const fmtData = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const css = `
    @page { size: A4; margin: 1cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f1f5f9; color: #1e293b; font-size: 12px; }
    .action-bar { display: flex; gap: 8px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
    .back-btn { background: #64748b; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
    .share-btn { background: #f97316; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
    .print-btn { background: #1e3a5f; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
    .page { max-width: 800px; margin: 24px auto; padding: 32px; background: white; position: relative; border-radius: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 320px; height: 320px; background-image: url('/logo-semae.png'); background-size: contain; background-repeat: no-repeat; background-position: center; opacity: 0.05; z-index: 0; pointer-events: none; }
    .content { position: relative; z-index: 1; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 20px; }
    .header img { width: 64px; height: 64px; object-fit: contain; }
    .header-text h1 { font-size: 18px; font-weight: 700; color: #1e3a5f; }
    .header-text p { color: #64748b; font-size: 11px; margin-top: 2px; }
    .doc-title { background: #1e3a5f; color: white; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .doc-title h2 { font-size: 14px; font-weight: 700; }
    .doc-title span { font-size: 12px; opacity: 0.9; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
    .info-box label { display: block; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-box p { font-weight: 600; color: #1e293b; }
    .info-box small { color: #64748b; font-size: 10px; }
    .info-full { grid-column: 1 / -1; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }
    .num { text-align: right; }
    .total-row { background: #f8fafc; font-weight: 700; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1.5px solid #334155; margin-bottom: 8px; }
    .sig-box p { font-size: 11px; color: #475569; }
    .sig-box strong { display: block; font-size: 12px; color: #1e293b; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; }
    @media print {
      .action-bar { display: none !important; }
      body { background: white; }
      .page { margin: 0; padding: 0; box-shadow: none; border-radius: 0; max-width: 100%; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Saída #${saida.numero} – SEMAE`}</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          function pdfVoltar() {
            var url = window.location.pathname;
            if (url.endsWith('/pdf')) {
              window.location.href = url.slice(0, -4);
            } else {
              window.history.back();
            }
          }
          function pdfImprimir() { window.print(); }
          function pdfCompartilhar() {
            if (navigator.share) {
              navigator.share({ title: document.title, url: window.location.href })
                .catch(function(e) { if (e.name !== 'AbortError') window.print(); });
            } else {
              window.print();
            }
          }
        ` }} />

        <div className="action-bar">
          <button className="back-btn" type="button" onClick="pdfVoltar()">← Voltar</button>
          <button className="share-btn" type="button" onClick="pdfCompartilhar()">📤 Compartilhar</button>
          <button className="print-btn" type="button" onClick="pdfImprimir()">🖨️ Imprimir</button>
        </div>

        <div className="watermark" />
        <div className="page">
          <div className="content">
            <div className="header">
              <img src="/logo-semae.png" alt="SEMAE" />
              <div className="header-text">
                <h1>SEMAE – Setor Municipal de Alimentação Escolar</h1>
                <p>Prefeitura Municipal de Várzea do Poço – BA</p>
              </div>
            </div>

            <div className="doc-title">
              <h2>Controle de Saída de Mercadorias</h2>
              <span>Pedido Nº {saida.numero.toString().padStart(4, '0')}</span>
            </div>

            <div className="info-grid">
              <div className="info-box">
                <label>Escola / Creche</label>
                <p>{saida.escola.nome}</p>
                <small>{saida.escola.tipo}</small>
              </div>
              <div className="info-box">
                <label>Data</label>
                <p>{fmtData(saida.data)}</p>
              </div>
              <div className="info-box">
                <label>Responsável SEMAE</label>
                <p>{saida.responsavel?.nome || '___________________________'}</p>
                {saida.responsavel?.cargo && <small>{saida.responsavel.cargo}</small>}
              </div>
              <div className="info-box">
                <label>Recebedor</label>
                <p>{saida.recebedor || '___________________________'}</p>
              </div>
              {saida.observacao && (
                <div className="info-box info-full">
                  <label>Observação</label>
                  <p>{saida.observacao}</p>
                </div>
              )}
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '65%' }}>Produto</th>
                  <th className="num" style={{ width: '15%' }}>Quantidade</th>
                  <th className="num" style={{ width: '15%' }}>Unid.</th>
                </tr>
              </thead>
              <tbody>
                {saida.itens.map((it, idx) => (
                  <tr key={it.id}>
                    <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                    <td>{it.produto.nome}</td>
                    <td className="num">{it.quantidade}</td>
                    <td className="num">{it.unidade.abreviacao}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={2}>Total de itens:</td>
                  <td colSpan={2} className="num">{saida.itens.length} produto(s)</td>
                </tr>
              </tbody>
            </table>

            <div className="signatures">
              <div className="sig-box">
                <div style={{ height: '48px' }} />
                <div className="sig-line" />
                <strong>{saida.responsavel?.nome || 'Responsável SEMAE'}</strong>
                <p>{saida.responsavel?.cargo || 'Assinatura do Responsável'}</p>
                <p style={{ fontSize: '10px', marginTop: '4px' }}>Data: ___/___/______</p>
              </div>
              <div className="sig-box">
                <div style={{ height: '48px' }} />
                <div className="sig-line" />
                <strong>{saida.recebedor || 'Recebedor'}</strong>
                <p>Assinatura do Recebedor</p>
                <p style={{ fontSize: '10px', marginTop: '4px' }}>Data: ___/___/______</p>
              </div>
            </div>

            <div className="footer">
              Documento gerado em {new Date().toLocaleDateString('pt-BR')} · SEMAE – Prefeitura Municipal de Várzea do Poço · Pedido #{saida.numero.toString().padStart(4, '0')}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
