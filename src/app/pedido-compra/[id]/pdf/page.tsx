import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface Props { params: Promise<{ id: string }> }

export default async function PedidoCompraPdfPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');
  const { id } = await params;
  const pedido = await prisma.pedidoCompra.findUnique({
    where: { id },
    include: {
      escola: true,
      responsavel: true,
      itens: { include: { produto: true, unidade: true } },
    },
  });

  if (!pedido) notFound();

  const fmtData = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const numeroFormatado = pedido.numero.toString().padStart(4, '0');

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pedido de Compra Nº {numeroFormatado} – SEMAE</title>
        <style>{`
          @page { size: A4; margin: 1cm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; background: #f1f5f9; color: #1e293b; font-size: 12px; }
          .action-bar { display: flex; gap: 8px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
          .back-btn { background: #64748b; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
          .share-btn { background: #f97316; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
          .print-btn { background: #4c1d95; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
          .page { max-width: 800px; margin: 24px auto; padding: 32px; background: white; position: relative; border-radius: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }
          .watermark {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 320px; height: 320px;
            background-image: url('/logo-semae.png');
            background-size: contain; background-repeat: no-repeat; background-position: center;
            opacity: 0.05; z-index: 0; pointer-events: none;
          }
          .content { position: relative; z-index: 1; }
          .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #6d28d9; padding-bottom: 16px; margin-bottom: 20px; }
          .header img { width: 64px; height: 64px; object-fit: contain; }
          .header-text h1 { font-size: 18px; font-weight: 700; color: #4c1d95; }
          .header-text p { color: #64748b; font-size: 11px; margin-top: 2px; }
          .doc-title { background: #4c1d95; color: white; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
          .doc-title h2 { font-size: 14px; font-weight: 700; }
          .doc-title span { font-size: 12px; opacity: 0.9; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
          .info-box label { display: block; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .info-box p { font-weight: 600; color: #1e293b; }
          .info-box span { font-size: 10px; color: #64748b; }
          .info-full { grid-column: 1 / -1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead th { background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
          tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }
          td.num { text-align: right; font-weight: 600; }
          td.idx { color: #94a3b8; }
          .total-row { background: #f8fafc; }
          .total-row td { font-weight: 700; color: #1e293b; font-size: 13px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }
          .sig-box { text-align: center; }
          .sig-line { border-top: 1.5px solid #334155; margin-bottom: 8px; }
          .sig-box p { font-size: 11px; color: #475569; }
          .sig-box strong { display: block; font-size: 12px; color: #1e293b; }
          .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; }
          .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #ede9fe; color: #4c1d95; margin-left: 8px; }
          @media print {
            .action-bar { display: none !important; }
            body { background: white; }
            .page { margin: 0; padding: 0; box-shadow: none; border-radius: 0; max-width: 100%; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
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
              <img src="/logo-semae.png" alt="SEMAE" onError={(e: any) => { e.target.style.display = 'none'; }} />
              <div className="header-text">
                <h1>SEMAE – Setor Municipal de Alimentação Escolar</h1>
                <p>Prefeitura Municipal de Várzea do Poço – BA · CNPJ: ___.___.___/____-__</p>
              </div>
            </div>

            <div className="doc-title">
              <h2>Pedido de Compra Nº {numeroFormatado}</h2>
              <span>
                Data: {fmtData(pedido.data)}
                <span className="status-badge">
                  {pedido.status === 'RASCUNHO' ? 'Rascunho'
                    : pedido.status === 'ENVIADO' ? 'Enviado'
                    : pedido.status === 'ATENDIDO' ? 'Atendido'
                    : 'Cancelado'}
                </span>
              </span>
            </div>

            <div className="info-grid">
              <div className="info-box">
                <label>Escola / Destino</label>
                {pedido.escola ? (
                  <>
                    <p>{pedido.escola.nome}</p>
                    <span>{pedido.escola.tipo}</span>
                  </>
                ) : (
                  <p>Geral / SEMAE</p>
                )}
              </div>
              <div className="info-box">
                <label>Data do Pedido</label>
                <p>{fmtData(pedido.data)}</p>
              </div>
              <div className="info-box">
                <label>Responsável SEMAE</label>
                <p>{pedido.responsavel?.nome || '___________________________'}</p>
                {pedido.responsavel?.cargo && <span>{pedido.responsavel.cargo}</span>}
              </div>
              <div className="info-box">
                <label>Número do Pedido</label>
                <p>#{numeroFormatado}</p>
              </div>
              {pedido.observacao && (
                <div className="info-box info-full">
                  <label>Observação</label>
                  <p style={{ fontWeight: 400 }}>{pedido.observacao}</p>
                </div>
              )}
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '60%' }}>Produto</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Quantidade</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Unidade</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="idx">{idx + 1}</td>
                    <td>{it.produto.nome}</td>
                    <td className="num">{it.quantidade}</td>
                    <td className="num">{it.unidade.abreviacao}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={2} style={{ fontWeight: 700 }}>Total de itens:</td>
                  <td colSpan={2} className="num">{pedido.itens.length} produto(s)</td>
                </tr>
              </tbody>
            </table>

            <div className="signatures">
              <div className="sig-box">
                <div style={{ height: '48px' }} />
                <div className="sig-line" />
                <strong>{pedido.responsavel?.nome || 'Responsável SEMAE'}</strong>
                <p>{pedido.responsavel?.cargo || 'Assinatura do Responsável SEMAE'}</p>
                <p style={{ fontSize: '10px', marginTop: '4px' }}>Data: ___/___/______</p>
              </div>
              <div className="sig-box">
                <div style={{ height: '48px' }} />
                <div className="sig-line" />
                <strong>Secretaria Municipal</strong>
                <p>Assinatura / Carimbo</p>
                <p style={{ fontSize: '10px', marginTop: '4px' }}>Data: ___/___/______</p>
              </div>
            </div>

            <div className="footer">
              Documento gerado em {new Date().toLocaleDateString('pt-BR')} ·
              SEMAE – Prefeitura Municipal de Várzea do Poço ·
              Pedido #{numeroFormatado}
            </div>
          </div>
        </div>

      </body>
    </html>
  );
}
