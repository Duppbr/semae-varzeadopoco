// Aplica o patch SQL statement-a-statement (autocommit) — compativel com o
// pooler pgbouncer, onde BEGIN/COMMIT explicitos nao persistem.
// Cada statement do patch e idempotente (IF NOT EXISTS / ON CONFLICT).
import { readFileSync } from 'node:fs';
function loadEnv(path: string) {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
// Splitter ciente de dollar-quoting ($$...$$), ignorando BEGIN/COMMIT e comentarios.
function statements(sql: string): string[] {
  const out: string[] = []; let buf = ''; let dollar = false;
  const semComentarios = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  for (let i = 0; i < semComentarios.length; i++) {
    const dois = semComentarios.slice(i, i + 2);
    if (dois === '$$') { dollar = !dollar; buf += '$$'; i++; continue; }
    const ch = semComentarios[i];
    if (ch === ';' && !dollar) { const s = buf.trim(); if (s) out.push(s); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(s => !/^(BEGIN|COMMIT)$/i.test(s.trim()));
}
async function main() {
  loadEnv('.env.local');
  const arquivo = process.argv[2] || 'prisma/patches/20260913-operacoes.sql';
  const sql = readFileSync(arquivo, 'utf8');
  const stmts = statements(sql);
  const { prisma } = await import('../src/lib/prisma');
  console.log(`Aplicando ${stmts.length} statements de ${arquivo}...`);
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i];
    const rotulo = s.replace(/\s+/g, ' ').slice(0, 70);
    try { await prisma.$executeRawUnsafe(s); console.log(`  [${i + 1}/${stmts.length}] OK  ${rotulo}`); }
    catch (e) { console.log(`  [${i + 1}/${stmts.length}] ERRO ${rotulo}\n      -> ${(e as Error).message.split('\n')[0]}`); throw e; }
  }
  console.log('\nPatch aplicado.');
  await prisma.$disconnect();
}
main().catch(e => { console.error('FALHOU:', e?.message || e); process.exit(1); });
