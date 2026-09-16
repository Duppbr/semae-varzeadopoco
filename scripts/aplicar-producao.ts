// Aplica a reconciliacao do catalogo (formulario SEMAE) na PRODUCAO.
// Faz um backup fresco antes de escrever. Idempotente.
// Guarda: so escreve se CONFIRMAR=SIM.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { aplicarCatalogo } from './catalogo-formulario';

function loadEnv(path: string) {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

async function main() {
  loadEnv('.env.local');
  const url = process.env.DATABASE_URL || '';
  const alvo = url.match(/postgres\.([a-z0-9]+)/)?.[1] || url.match(/@([^/]+)/)?.[1] || '???';
  console.log(`Alvo (producao): ${alvo}`);

  const { prisma } = await import('../src/lib/prisma');

  // Backup fresco imediatamente antes da escrita
  const [unidades, categorias, produtos] = await Promise.all([
    prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } }),
    prisma.categoria.findMany({ orderBy: { nome: 'asc' } }),
    prisma.produto.findMany({ include: { unidade: true, categoria: true }, orderBy: { nome: 'asc' } }),
  ]);
  const snap = {
    exportadoEm: new Date().toISOString(),
    unidades: unidades.map(u => ({ id: u.id, nome: u.nome, abreviacao: u.abreviacao })),
    categorias: categorias.map(c => ({ id: c.id, nome: c.nome })),
    produtos: produtos.map(p => ({ id: p.id, nome: p.nome, estoqueMinimo: p.estoqueMinimo, ativo: p.ativo, unidadeAbrev: p.unidade?.abreviacao ?? null, categoriaNome: p.categoria?.nome ?? null })),
  };
  mkdirSync('backups', { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const bkp = `backups/PRE-APLICACAO-producao-${stamp}.json`;
  writeFileSync(bkp, JSON.stringify(snap, null, 2));
  console.log(`Backup salvo: ${bkp} (${snap.produtos.length} produtos)`);

  if (process.env.CONFIRMAR !== 'SIM') {
    console.log('\n[SIMULACAO] CONFIRMAR!=SIM — nada foi escrito. Backup gerado apenas.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nAplicando reconciliacao na PRODUCAO...');
  const r = await aplicarCatalogo(prisma);
  console.log(`\nUnidades trocadas: ${r.atualizados.length}`);
  r.atualizados.forEach(x => console.log('  ~ ' + x));
  console.log(`\nProdutos criados: ${r.criados.length}`);
  r.criados.forEach(x => console.log('  + ' + x));
  if (r.avisos.length) { console.log(`\nAVISOS: ${r.avisos.length}`); r.avisos.forEach(x => console.log('  ! ' + x)); }
  console.log('\nConcluido.');
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
