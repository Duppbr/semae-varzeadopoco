import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { pdfActionBarHtml, pdfActionScript } from '@/lib/pdf-actions';

interface Props { params: Promise<{ id: string }> }

// Tier defines font/padding based on item count:
// T1 ≤12  → single col, comfortable  (12px rows)
// T2 ≤20  → single col, compact      (11px rows)
// T3 ≤42  → two cols,  compact       (10px rows, fits ~1 page)
// T4  43+ → two cols,  tight         (9px rows, 2 pages)
function getTier(n: number) {
  if (n <= 12) return 1;
  if (n <= 20) return 2;
  if (n <= 42) return 3;
  return 4;
}

export default async function SaidaPdfPage({ params }: Props) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');
  const { id } = await params;
  const saida = await prisma.saida.findUnique({
    where: { id },
    include: {
      escola: true,
      responsavel: true,
      itens: { include: { produto: true, unidade: true }, orderBy: { produto: { nome: 'asc' } } },
    },
  });
  if (!saida) notFound();

  const fmtData = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const n      = saida.itens.length;
  const tier   = getTier(n);
  const twoCols = tier >= 3;
  const half   = Math.ceil(n / 2);

  // Per-tier table metrics
  const t = {
    1: { tdPad: '8px 12px', thPad: '7px 12px', tdFont: '12px', thFont: '10px', numFont: '12px' },
    2: { tdPad: '6px 10px', thPad: '6px 10px', tdFont: '11px', thFont: '9px',  numFont: '11px' },
    3: { tdPad: '4px 7px',  thPad: '5px 7px',  tdFont: '10px', thFont: '8px',  numFont: '10px' },
    4: { tdPad: '3px 6px',  thPad: '4px 6px',  tdFont: '9px',  thFont: '8px',  numFont: '9px'  },
  }[tier]!;

  const css = `
    @page { size: A4; margin: 1cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f1f5f9; color: #1e293b; font-size: 12px; }

    /* Action bar (web only) */
    .action-bar { display: flex; gap: 8px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
    .back-btn  { background: #64748b; color: white; border: none; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
    .share-btn { background: #f97316; color: white; border: none; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }
    .print-btn { background: #1e3a5f; color: white; border: none; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; -webkit-tap-highlight-color: rgba(0,0,0,0.1); }

    /* Page wrapper */
    .page { max-width: 820px; margin: 20px auto; padding: 28px 32px; background: white; border-radius: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); position: relative; overflow: hidden; }

    /* Watermark background */
    .watermark {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 60%; aspect-ratio: 1;
      background-image: url('/logo-semae.png');
      background-size: contain; background-repeat: no-repeat; background-position: center;
      opacity: 0.04; pointer-events: none; z-index: 0;
    }

    /* Content stacks header → info → items (flex grow) → sigs → footer */
    .content {
      position: relative; z-index: 1;
      display: flex; flex-direction: column;
      min-height: 228mm; /* A4 (277mm) minus header+info ~49mm */
    }

    /* Header com duas logos */
    .header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 12px; }
    .header-logo { width: 58px; height: 58px; object-fit: contain; flex-shrink: 0; }
    .header-text { flex: 1; text-align: center; }
    .header-text h1 { font-size: 15px; font-weight: 700; color: #1e3a5f; line-height: 1.2; }
    .header-text p  { color: #64748b; font-size: 10px; margin-top: 3px; }

    /* Doc title */
    .doc-title { background: #1e3a5f; color: white; padding: 8px 14px; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .doc-title h2 { font-size: 13px; font-weight: 700; }
    .doc-title span { font-size: 11px; opacity: 0.9; }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 12px; }
    .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; }
    .info-box label { display: block; font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .info-box p { font-weight: 600; color: #1e293b; font-size: 11px; }
    .info-box small { color: #64748b; font-size: 9px; }
    .info-full { grid-column: 1 / -1; }

    /* Items section grows to fill space */
    .items-section { flex: 1; }

    /* Single-column table */
    .table-single { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .table-single thead th {
      background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid #e2e8f0;
      padding: ${t.thPad}; font-size: ${t.thFont};
    }
    .table-single tbody td {
      border-bottom: 1px solid #f1f5f9; color: #1e293b;
      padding: ${t.tdPad}; font-size: ${t.tdFont};
    }
    .table-single tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }
    .table-single .total-row { background: #f8fafc; font-weight: 700; }
    .num { text-align: right; }

    /* Two-column grid */
    .items-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .col-table { width: 100%; border-collapse: collapse; }
    .col-table thead th {
      background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.3px; text-align: left; border-bottom: 1px solid #e2e8f0;
      padding: ${t.thPad}; font-size: ${t.thFont};
    }
    .col-table tbody td {
      border-bottom: 1px solid #f8fafc; color: #1e293b;
      padding: ${t.tdPad}; font-size: ${t.tdFont};
    }
    .col-table tbody tr:last-child td { border-bottom: 1px solid #e2e8f0; }
    .items-total-line {
      text-align: right; font-size: 10px; font-weight: 700; color: #475569;
      padding: 5px 0 0 0;
    }

    /* Signatures always at bottom */
    .signatures-wrap { margin-top: auto; padding-top: 18px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1.5px solid #334155; margin-bottom: 6px; }
    .sig-box p { font-size: 10px; color: #475569; }
    .sig-box strong { display: block; font-size: 11px; color: #1e293b; }

    /* Footer */
    .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px; text-align: center; font-size: 9px; color: #94a3b8; }

    @media print {
      .action-bar { display: none !important; }
      body { background: white; }
      .page { margin: 0; padding: 20px 24px; box-shadow: none; border-radius: 0; max-width: 100%; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  const colHead = (
    <thead>
      <tr>
        <th style={{ width: '9%' }}>#</th>
        <th style={{ width: '59%' }}>Produto</th>
        <th className="num" style={{ width: '18%' }}>Qtd</th>
        <th className="num" style={{ width: '14%' }}>Un.</th>
      </tr>
    </thead>
  );

  const renderRows = (items: typeof saida.itens, offset: number) =>
    items.map((it, idx) => (
      <tr key={it.id}>
        <td style={{ color: '#94a3b8' }}>{offset + idx + 1}</td>
        <td>{it.produto.nome}</td>
        <td className="num">{it.quantidade}</td>
        <td className="num">{it.unidade.abreviacao}</td>
      </tr>
    ));

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Saída #${saida.numero} – SEMAE`}</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: pdfActionScript('/saida') }} />
        <div className="action-bar" dangerouslySetInnerHTML={{ __html: pdfActionBarHtml() }} />

        <div className="page">
          <div className="watermark" />
          <div className="content">

            {/* Cabeçalho com duas logos */}
            <div className="header">
              <img className="header-logo" src="/logo-semae.png" alt="SEMAE"
                   onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="header-text">
                <h1>SEMAE – Setor Municipal de Alimentação Escolar</h1>
                <p>Prefeitura Municipal de Várzea do Poço – BA</p>
              </div>
              <img className="header-logo" src="/logo-sec-educacao.jpeg" alt="Secretaria de Educação"
                   onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>

            {/* Título */}
            <div className="doc-title">
              <h2>Controle de Saída de Mercadorias</h2>
              <span>Pedido Nº {saida.numero.toString().padStart(4, '0')}</span>
            </div>

            {/* Info */}
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

            {/* Itens — seção cresce para empurrar assinaturas ao fundo */}
            <div className="items-section">
              {twoCols ? (
                <>
                  <div className="items-cols">
                    <table className="col-table">
                      {colHead}
                      <tbody>{renderRows(saida.itens.slice(0, half), 0)}</tbody>
                    </table>
                    <table className="col-table">
                      {colHead}
                      <tbody>{renderRows(saida.itens.slice(half), half)}</tbody>
                    </table>
                  </div>
                  <p className="items-total-line">Total: {n} produto(s)</p>
                </>
              ) : (
                <table className="table-single">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '65%' }}>Produto</th>
                      <th className="num" style={{ width: '15%' }}>Quantidade</th>
                      <th className="num" style={{ width: '15%' }}>Unid.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderRows(saida.itens, 0)}
                    <tr className="total-row">
                      <td colSpan={2}>Total de itens:</td>
                      <td colSpan={2} className="num">{n} produto(s)</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Assinaturas — sempre ao fundo (margin-top: auto no wrap) */}
            <div className="signatures-wrap">
              <div className="signatures">
                <div className="sig-box">
                  <div style={{ height: '44px' }} />
                  <div className="sig-line" />
                  <strong>{saida.responsavel?.nome || 'Responsável SEMAE'}</strong>
                  <p>{saida.responsavel?.cargo || 'Assinatura do Responsável'}</p>
                  <p style={{ fontSize: '9px', marginTop: '4px' }}>Data: ___/___/______</p>
                </div>
                <div className="sig-box">
                  <div style={{ height: '44px' }} />
                  <div className="sig-line" />
                  <strong>{saida.recebedor || 'Recebedor'}</strong>
                  <p>Assinatura do Recebedor</p>
                  <p style={{ fontSize: '9px', marginTop: '4px' }}>Data: ___/___/______</p>
                </div>
              </div>
            </div>

            <div className="footer">
              Documento gerado em {new Date().toLocaleDateString('pt-BR')} ·
              SEMAE – Prefeitura Municipal de Várzea do Poço ·
              Pedido #{saida.numero.toString().padStart(4, '0')}
            </div>

          </div>
        </div>
      </body>
    </html>
  );
}
