// Gera 3 PDFs de saída: 10, 30 e todos os produtos
// Uso: node --env-file=.env.local scripts/gerar-pdf-teste.mjs

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

const CSS = `
  @page { size: A4; margin: 1cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f1f5f9; color: #1e293b; font-size: 12px; }
  .action-bar { display: flex; gap: 8px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; }
  .back-btn  { background: #64748b; color: white; border: none; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .share-btn { background: #f97316; color: white; border: none; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .print-btn { background: #1e3a5f; color: white; border: none; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .page { max-width: 820px; margin: 20px auto; padding: 28px 32px; background: white; border-radius: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }
  .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 14px; }
  .header img { width: 56px; height: 56px; object-fit: contain; }
  .header-text h1 { font-size: 16px; font-weight: 700; color: #1e3a5f; }
  .header-text p { color: #64748b; font-size: 10px; margin-top: 2px; }
  .doc-title { background: #1e3a5f; color: white; padding: 8px 14px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
  .doc-title h2 { font-size: 13px; font-weight: 700; }
  .doc-title span { font-size: 11px; opacity: 0.9; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 11px; }
  .info-box label { display: block; font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .info-box p { font-weight: 600; color: #1e293b; font-size: 11px; }
  .info-box small { color: #64748b; font-size: 9px; }
  /* Tabela coluna única */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th { background: #f1f5f9; color: #475569; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 11px; }
  tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }
  .num { text-align: right; }
  .total-row { background: #f8fafc; font-weight: 700; }
  /* Duas colunas */
  .items-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
  .items-cols table { margin-bottom: 0; }
  .col-table thead th { font-size: 8px; padding: 5px 7px; }
  .col-table tbody td { font-size: 10px; padding: 4px 7px; }
  .col-table tbody tr:last-child td { border-bottom: 1px solid #e2e8f0; }
  .items-total { text-align: right; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 16px; }
  /* Assinaturas */
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 32px; }
  .sig-box { text-align: center; }
  .sig-line { border-top: 1.5px solid #334155; margin-bottom: 6px; }
  .sig-box p { font-size: 10px; color: #475569; }
  .sig-box strong { display: block; font-size: 11px; color: #1e293b; }
  .footer { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 16px; text-align: center; font-size: 9px; color: #94a3b8; }
  @media print { .action-bar { display: none !important; } body { background: white; } .page { margin: 0; box-shadow: none; } }
`;

function renderItens(itens, useTwoCols) {
  if (!useTwoCols) {
    const rows = itens.map((it, i) => `
      <tr>
        <td style="color:#94a3b8">${i + 1}</td>
        <td>${it.produto.nome}</td>
        <td class="num">${it.quantidade}</td>
        <td class="num">${it.unidade.abreviacao}</td>
      </tr>`).join('');
    return `
      <table>
        <thead><tr>
          <th style="width:5%">#</th>
          <th style="width:65%">Produto</th>
          <th class="num" style="width:15%">Quantidade</th>
          <th class="num" style="width:15%">Unid.</th>
        </tr></thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="2">Total de itens:</td>
            <td colspan="2" class="num">${itens.length} produto(s)</td>
          </tr>
        </tbody>
      </table>`;
  }

  const half = Math.ceil(itens.length / 2);
  const colA = itens.slice(0, half);
  const colB = itens.slice(half);

  const renderCol = (col, offset) => `
    <table class="col-table">
      <thead><tr>
        <th style="width:9%">#</th>
        <th style="width:58%">Produto</th>
        <th class="num" style="width:18%">Qtd</th>
        <th class="num" style="width:15%">Un.</th>
      </tr></thead>
      <tbody>
        ${col.map((it, i) => `
          <tr>
            <td style="color:#94a3b8">${offset + i + 1}</td>
            <td>${it.produto.nome}</td>
            <td class="num">${it.quantidade}</td>
            <td class="num">${it.unidade.abreviacao}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  return `
    <div class="items-cols">
      ${renderCol(colA, 0)}
      ${renderCol(colB, half)}
    </div>
    <p class="items-total">Total: ${itens.length} produto(s)</p>`;
}

function renderHtml(saida, numero) {
  const fmtData = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const useTwoCols = saida.itens.length > 15;
  const numFmt = numero.toString().padStart(4, '0');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Saída #${numFmt} – SEMAE (${saida.itens.length} itens)</title>
  <style>${CSS}</style>
  <script>
    function pdfVoltar() { window.close(); }
    function pdfImprimir() { window.print(); }
    function pdfCompartilhar() {
      if (navigator.share) { navigator.share({ title: document.title, url: window.location.href }).catch(() => window.print()); }
      else { window.print(); }
    }
  </script>
</head>
<body>
  <div class="action-bar">
    <button class="back-btn" onclick="pdfVoltar()">&#8592; Fechar</button>
    <button class="share-btn" onclick="pdfCompartilhar()">&#128228; Compartilhar</button>
    <button class="print-btn" onclick="pdfImprimir()">&#128438; Imprimir</button>
  </div>
  <div class="page">
    <div class="header">
      <img src="../public/logo-semae.png" alt="SEMAE" onerror="this.style.display='none'" />
      <div class="header-text">
        <h1>SEMAE – Setor Municipal de Alimentação Escolar</h1>
        <p>Prefeitura Municipal de Várzea do Poço – BA</p>
      </div>
    </div>

    <div class="doc-title">
      <h2>Controle de Saída de Mercadorias</h2>
      <span>Pedido Nº ${numFmt}</span>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <label>Escola / Creche</label>
        <p>${saida.escola.nome}</p>
        <small>${saida.escola.tipo}</small>
      </div>
      <div class="info-box">
        <label>Data</label>
        <p>${fmtData(saida.data)}</p>
      </div>
      <div class="info-box">
        <label>Responsável SEMAE</label>
        <p>${saida.responsavel?.nome ?? '___________________________'}</p>
        ${saida.responsavel?.cargo ? `<small>${saida.responsavel.cargo}</small>` : ''}
      </div>
      <div class="info-box">
        <label>Recebedor</label>
        <p>${saida.recebedor ?? '___________________________'}</p>
      </div>
      ${saida.observacao ? `<div class="info-box" style="grid-column:1/-1"><label>Observação</label><p>${saida.observacao}</p></div>` : ''}
    </div>

    ${renderItens(saida.itens, useTwoCols)}

    <div class="signatures">
      <div class="sig-box">
        <div style="height:44px"></div>
        <div class="sig-line"></div>
        <strong>${saida.responsavel?.nome ?? 'Responsável SEMAE'}</strong>
        <p>${saida.responsavel?.cargo ?? 'Assinatura do Responsável'}</p>
        <p style="font-size:9px;margin-top:4px">Data: ___/___/______</p>
      </div>
      <div class="sig-box">
        <div style="height:44px"></div>
        <div class="sig-line"></div>
        <strong>${saida.recebedor ?? 'Recebedor'}</strong>
        <p>Assinatura do Recebedor</p>
        <p style="font-size:9px;margin-top:4px">Data: ___/___/______</p>
      </div>
    </div>

    <div class="footer">
      Documento gerado em ${new Date().toLocaleDateString('pt-BR')} · SEMAE – Prefeitura Municipal de Várzea do Poço · Pedido #${numFmt}
    </div>
  </div>
</body>
</html>`;
}

async function criarSaida(produtos, escola, responsavel, qtd, label) {
  const saida = await prisma.saida.create({
    data: {
      data: new Date(),
      escolaId: escola.id,
      responsavelId: responsavel?.id ?? null,
      recebedor: `Recebedor Teste (${label})`,
      observacao: `Simulação: ${label} – ${produtos.length} produto(s), ${qtd} unidades cada.`,
      status: 'PENDENTE',
      itens: {
        create: produtos.map(p => ({
          produtoId: p.id,
          quantidade: qtd,
          unidadeId: p.unidadeId,
        })),
      },
    },
    include: {
      escola: true,
      responsavel: true,
      itens: {
        include: { produto: true, unidade: true },
        orderBy: { produto: { nome: 'asc' } },
      },
    },
  });
  return saida;
}

async function main() {
  console.log('Buscando dados do banco...');

  const todosProdutos = await prisma.produto.findMany({
    where: { ativo: true },
    include: { unidade: true },
    orderBy: { nome: 'asc' },
  });

  if (todosProdutos.length === 0) { console.error('Nenhum produto. Rode o seed primeiro.'); process.exit(1); }

  const escola = await prisma.escola.findFirst({ where: { ativo: true } });
  if (!escola) { console.error('Nenhuma escola.'); process.exit(1); }
  const responsavel = await prisma.responsavel.findFirst({ where: { ativo: true } });

  const cenarios = [
    { label: '10 produtos', produtos: todosProdutos.slice(0, 10),  qtd: 5,  arquivo: 'pdf-cenario-10.html'  },
    { label: '30 produtos', produtos: todosProdutos.slice(0, 30),  qtd: 12, arquivo: 'pdf-cenario-30.html'  },
    { label: 'todos os produtos', produtos: todosProdutos,          qtd: 25, arquivo: 'pdf-cenario-todos.html' },
  ];

  const arquivos = [];

  for (const c of cenarios) {
    console.log(`\nCriando saída: ${c.label} (qtd=${c.qtd})...`);
    const saida = await criarSaida(c.produtos, escola, responsavel, c.qtd, c.label);
    const html  = renderHtml(saida, saida.numero);
    const path  = resolve('scripts', c.arquivo);
    writeFileSync(path, html, 'utf-8');
    arquivos.push(path);
    console.log(`  Saída #${saida.numero.toString().padStart(4,'0')} – ${saida.itens.length} itens → ${c.arquivo}`);
  }

  console.log('\nAbrindo os 3 arquivos no navegador...');
  arquivos.forEach(p => { try { execSync(`start "" "${p}"`); } catch {} });
  console.log('\nPronto! Confira os 3 arquivos em scripts/');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
