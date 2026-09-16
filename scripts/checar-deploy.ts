// SOMENTE LEITURA. Verifica se o patch 20260913 ja foi aplicado na producao
// e faz um backup completo (JSON) de todas as tabelas antes do deploy.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
function loadEnv(path: string) {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
async function tabelaExiste(prisma: import('@prisma/client').PrismaClient, nome: string) {
  const r = await prisma.$queryRawUnsafe<{ existe: boolean }[]>(`SELECT to_regclass('public.\"${nome}\"') IS NOT NULL AS existe`);
  return r[0]?.existe ?? false;
}
async function colunaExiste(prisma: import('@prisma/client').PrismaClient, tabela: string, coluna: string) {
  const r = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`, tabela, coluna);
  return Number(r[0]?.n ?? 0) > 0;
}
async function main() {
  loadEnv('.env.local');
  const { prisma } = await import('../src/lib/prisma');

  console.log('=== Estado do schema de producao (patch aplicado?) ===');
  const checks: Record<string, boolean> = {
    'tabela MovimentoEstoque': await tabelaExiste(prisma, 'MovimentoEstoque'),
    'ItemPedido.recebido': await colunaExiste(prisma, 'ItemPedido', 'recebido'),
    'ItemPedido.cancelado': await colunaExiste(prisma, 'ItemPedido', 'cancelado'),
    'Entrada.pedidoId': await colunaExiste(prisma, 'Entrada', 'pedidoId'),
  };
  for (const [k, v] of Object.entries(checks)) console.log(`  ${v ? 'OK ' : 'FALTA'}  ${k}`);
  const patchAplicado = Object.values(checks).every(Boolean);
  console.log(`\n=> Patch 20260913 ${patchAplicado ? 'JA aplicado' : 'AINDA NAO aplicado (necessario antes do deploy)'}`);

  console.log('\n=== Backup completo (todas as tabelas) ===');
  const dump: Record<string, unknown[]> = {};
  const tabelas = ['UnidadeMedida', 'Categoria', 'Produto', 'Estoque', 'Escola', 'Responsavel', 'Usuario',
    'Entrada', 'ItemEntrada', 'Saida', 'ItemSaida', 'Descarte', 'ItemDescarte', 'PedidoCompra', 'ItemPedido', 'Auditoria'];
  for (const t of tabelas) {
    try { dump[t] = await prisma.$queryRawUnsafe(`SELECT * FROM public."${t}"`); console.log(`  ${t}: ${dump[t].length}`); }
    catch (e) { console.log(`  ${t}: (pulado - ${(e as Error).message.slice(0, 40)})`); }
  }
  mkdirSync('backups', { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const f = `backups/DUMP-COMPLETO-producao-${stamp}.json`;
  writeFileSync(f, JSON.stringify(dump, (_k, v) => typeof v === 'bigint' ? Number(v) : v, 2));
  console.log(`\nBackup completo salvo: ${f}`);
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
