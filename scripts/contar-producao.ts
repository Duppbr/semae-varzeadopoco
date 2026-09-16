// SOMENTE LEITURA. Conta movimentacoes/estoque na producao para avaliar risco de mudanca de unidade.
import { readFileSync } from 'node:fs';
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
  const q: Record<string, number> = {};
  q.entradas = await prisma.entrada.count();
  q.saidas = await prisma.saida.count();
  q.descartes = await prisma.descarte.count();
  q.pedidos = await prisma.pedidoCompra.count();
  q.estoqueRegistros = await prisma.estoque.count();
  q.estoqueComSaldoNaoZero = await prisma.estoque.count({ where: { NOT: { quantidade: 0 } } });
  q.escolas = await prisma.escola.count();
  q.usuarios = await prisma.usuario.count();
  console.log(JSON.stringify(q, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
