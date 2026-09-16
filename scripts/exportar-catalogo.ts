// SOMENTE LEITURA. Exporta o catalogo de producao (unidades, categorias, produtos)
// para um JSON. Serve para alimentar o preview local e como backup de rollback.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
function loadEnv(path: string) {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
async function main() {
  loadEnv('.env.local');
  const { prisma } = await import('../src/lib/prisma');
  const [unidades, categorias, produtos] = await Promise.all([
    prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } }),
    prisma.categoria.findMany({ orderBy: { nome: 'asc' } }),
    prisma.produto.findMany({ include: { unidade: true, categoria: true }, orderBy: { nome: 'asc' } }),
  ]);
  const snap = {
    exportadoEm: new Date().toISOString(),
    unidades: unidades.map(u => ({ id: u.id, nome: u.nome, abreviacao: u.abreviacao })),
    categorias: categorias.map(c => ({ id: c.id, nome: c.nome, cor: (c as { cor?: string | null }).cor ?? null })),
    produtos: produtos.map(p => ({
      id: p.id, nome: p.nome, estoqueMinimo: p.estoqueMinimo, ativo: p.ativo,
      unidadeAbrev: p.unidade?.abreviacao ?? null, categoriaNome: p.categoria?.nome ?? null,
    })),
  };
  mkdirSync('backups', { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const proj = `backups/catalogo-producao-${stamp}.json`;
  writeFileSync(proj, JSON.stringify(snap, null, 2));
  // copia estavel para o preview consumir
  writeFileSync('scripts/catalogo-producao.snapshot.json', JSON.stringify(snap, null, 2));
  console.log(`OK: ${snap.unidades.length} unidades, ${snap.categorias.length} categorias, ${snap.produtos.length} produtos`);
  console.log(`Backup: ${proj}`);
  console.log('Snapshot p/ preview: scripts/catalogo-producao.snapshot.json');
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
