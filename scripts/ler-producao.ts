// SOMENTE LEITURA da producao. Usa a conexao do .env.local, nao escreve nada.
import { readFileSync } from 'node:fs';

function loadEnv(path: string) {
  const txt = readFileSync(path, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

async function main() {
  loadEnv('.env.local');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente no .env.local');
  const { prisma } = await import('../src/lib/prisma');
  const [unidades, categorias, produtos] = await Promise.all([
    prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } }),
    prisma.categoria.findMany({ orderBy: { nome: 'asc' } }),
    prisma.produto.findMany({ include: { unidade: true, categoria: true }, orderBy: { nome: 'asc' } }),
  ]);
  console.log('=== UNIDADES (%d) ===', unidades.length);
  for (const u of unidades) console.log(`- ${u.nome} [${u.abreviacao}]`);
  console.log('\n=== CATEGORIAS (%d) ===', categorias.length);
  for (const c of categorias) console.log(`- ${c.nome}`);
  console.log('\n=== PRODUTOS (%d) ===', produtos.length);
  for (const p of produtos) console.log(`- ${p.nome} | un=${p.unidade?.abreviacao ?? '?'} | cat=${p.categoria?.nome ?? '?'} | min=${p.estoqueMinimo} | ativo=${p.ativo}`);
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
