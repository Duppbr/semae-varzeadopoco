// Servidor de teste LOCAL e ISOLADO do SEMAE.
//
// - Sobe um PostgreSQL em memoria (PGlite) com o schema atual de prisma/schema.prisma.
// - Popula alguns dados ficticios (unidades, categoria, produtos, escola, usuario admin).
// - Inicia o Next.js em uma porta propria (padrao 4000, longe de 3000/3100/3107).
// - NUNCA le .env.local nem toca no banco de producao (Supabase).
//
// Uso:  npx tsx scripts/preview-local.ts        (porta 4000)
//       PORT=4567 npx tsx scripts/preview-local.ts  (outra porta)
//
// Encerrar: Ctrl+C. O banco em memoria e descartado.

import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import bcrypt from 'bcryptjs';

const PORT = process.env.PORT || '4000';
const DB_PORT = 55440; // socket interno do PGlite (diferente do 55439 usado pelos testes)
const URL = `http://localhost:${PORT}`;
const LOGIN = 'admin';
const SENHA = 'teste123';

async function main() {
  // Define o destino do banco ANTES de importar o Prisma. Aponta para o PGlite em memoria.
  process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres?sslmode=disable&connection_limit=1`;
  process.env.SECRET_COOKIE_PASSWORD = randomBytes(32).toString('hex');

  console.log('> Construindo o schema a partir de prisma/schema.prisma...');
  const sql = execFileSync(
    process.execPath,
    ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
    { encoding: 'utf8', env: process.env },
  );

  const db = new PGlite();
  await db.exec(sql);
  const socket = new PGLiteSocketServer({ db, host: '127.0.0.1', port: DB_PORT, maxConnections: 10 });
  await socket.start();

  const { prisma } = await import('../src/lib/prisma');
  const snapPath = 'scripts/catalogo-producao.snapshot.json';

  if (existsSync(snapPath)) {
    // Carrega o CATALOGO REAL da producao (snapshot) e aplica a reconciliacao
    // do formulario, para voce conferir o resultado exato antes da producao.
    console.log('> Carregando catalogo real da producao (snapshot)...');
    const snap = JSON.parse(readFileSync(snapPath, 'utf8')) as {
      unidades: { nome: string; abreviacao: string }[];
      categorias: { nome: string; cor: string | null }[];
      produtos: { nome: string; estoqueMinimo: number; ativo: boolean; unidadeAbrev: string | null; categoriaNome: string | null }[];
    };
    const uMap = new Map<string, string>();
    for (const u of snap.unidades) { const c = await prisma.unidadeMedida.create({ data: { nome: u.nome, abreviacao: u.abreviacao } }); uMap.set(u.abreviacao, c.id); }
    const cMap = new Map<string, string>();
    for (const cat of snap.categorias) { const c = await prisma.categoria.create({ data: { nome: cat.nome, ...(cat.cor ? { cor: cat.cor } : {}) } }); cMap.set(cat.nome, c.id); }
    for (const p of snap.produtos) {
      const prod = await prisma.produto.create({ data: { nome: p.nome, estoqueMinimo: p.estoqueMinimo, ativo: p.ativo, unidadeId: uMap.get(p.unidadeAbrev ?? '')!, categoriaId: cMap.get(p.categoriaNome ?? '')! } });
      await prisma.estoque.create({ data: { produtoId: prod.id, quantidade: 0 } });
    }
    console.log(`  ${snap.produtos.length} produtos carregados. Aplicando reconciliacao do formulario...`);
    const { aplicarCatalogo } = await import('./catalogo-formulario');
    const res = await aplicarCatalogo(prisma);
    console.log(`  unidades trocadas: ${res.atualizados.length} | novos produtos: ${res.criados.length} | sem mudanca: ${res.semMudanca.length}`);
    if (res.avisos.length) console.log('  AVISOS:', res.avisos.join(' | '));
  } else {
    console.log('> Snapshot ausente; populando catalogo minimo ficticio...');
    const kg = await prisma.unidadeMedida.create({ data: { nome: 'Quilograma', abreviacao: 'kg' } });
    const cat = await prisma.categoria.create({ data: { nome: 'Alimentos' } });
    await prisma.produto.create({ data: { nome: 'Arroz', categoriaId: cat.id, unidadeId: kg.id, estoqueMinimo: 20 } });
    await prisma.produto.create({ data: { nome: 'Feijao', categoriaId: cat.id, unidadeId: kg.id, estoqueMinimo: 15 } });
  }

  const escola = await prisma.escola.create({ data: { nome: 'Escola Municipal Centro' } });
  await prisma.escola.create({ data: { nome: 'Creche Bem-Me-Quer' } });
  const admin = await prisma.usuario.create({ data: { identificador: LOGIN, nome: 'Administrador (teste)', senhaHash: await bcrypt.hash(SENHA, 6), role: 'admin' } });

  // Fornecedores de exemplo. O segundo tem so o nome, de proposito: e assim que
  // da para ver os campos vazios sumirem do documento em vez de virar linha em
  // branco. O terceiro esta inativo e nao deve aparecer na hora de fazer pedido.
  const fornecedor = await prisma.fornecedor.create({ data: {
    nome: 'Distribuidora Central Alimentos', cnpj: '12.345.678/0001-90', contato: 'Marcos Pereira',
    telefone: '(14) 99999-0000', email: 'vendas@distribuidoracentral.com.br',
    endereco: 'Rua das Industrias, 100 - Varzea do Poco', observacao: 'Entrega as segundas e quintas.' } });
  await prisma.fornecedor.create({ data: { nome: 'Hortifruti do Vale' } });
  await prisma.fornecedor.create({ data: { nome: 'Frigorifico Boa Carne (inativo)', cnpj: '98.765.432/0001-10', ativo: false } });

  // Lancamentos de exemplo para visualizar as telas de detalhe/historico.
  try {
    const { criarMovimento } = await import('../src/lib/operacoes');
    const { criarPedido } = await import('../src/lib/pedidos');
    const session = { userId: admin.id, identificador: LOGIN, nome: admin.nome, role: 'admin', protegido: false, isLoggedIn: true };
    const data = '2026-08-26';
    // Pega os produtos que existirem, em vez de nomes fixos: funciona tanto com o
    // catalogo real da producao quanto com o catalogo minimo ficticio.
    const [p1, p2] = await prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' }, take: 2 });
    if (p1 && p2) {
      const it = (p: { id: string; unidadeId: string }, q: number) => ({ produtoId: p.id, unidadeId: p.unidadeId, quantidade: q });
      await criarMovimento('entrada', { data, fornecedorId: fornecedor.id, itens: [it(p1, 10), it(p2, 12)] }, session);
      await criarMovimento('saida', { data, escolaId: escola.id, itens: [it(p1, 3)] }, session);
      await criarMovimento('descarte', { data, motivo: 'VENCIMENTO', itens: [it(p2, 1)] }, session);
      await criarPedido({ data, fornecedorId: fornecedor.id, itens: [it(p1, 20), it(p2, 8)] }, session);
      console.log('  lancamentos de exemplo criados (1 entrada, 1 saida, 1 descarte, 1 pedido com fornecedor).');
    }
  } catch (e) { console.log('  (aviso) nao criei lancamentos de exemplo:', (e as Error).message); }

  await prisma.$disconnect();
  // Libera prepared statements para o cliente do Next reconectar sem conflito.
  await db.exec('DEALLOCATE ALL');

  console.log(`> Iniciando o servidor Next.js na porta ${PORT}...`);
  const server: ChildProcess = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'dev', '-p', PORT, '--hostname', '127.0.0.1'],
    { env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', PREVIEW_DISTDIR: '.next-local' }, stdio: 'inherit', windowsHide: true },
  );

  const encerrar = async () => {
    if (server.exitCode === null) server.kill();
    try { await socket.stop(); } catch { /* ignora */ }
    try { await db.close(); } catch { /* ignora */ }
    process.exit(0);
  };
  process.once('SIGINT', encerrar);
  process.once('SIGTERM', encerrar);
  server.once('exit', () => { void encerrar(); });

  // Espera o servidor responder e entao mostra as instrucoes e abre o navegador.
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) return;
    try { if ((await fetch(`${URL}/login`)).ok) break; } catch { /* aguardando */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\n============================================================');
  console.log('  PREVIA LOCAL PRONTA (dados ficticios, sem tocar na producao)');
  console.log(`  URL:   ${URL}/login`);
  console.log(`  Login: ${LOGIN}`);
  console.log(`  Senha: ${SENHA}`);
  console.log('  Encerrar: Ctrl+C nesta janela.');
  console.log('');
  console.log('  NOVIDADE - cadastro de fornecedores:');
  console.log('   - Administracao > Fornecedores  (cadastrar, editar, desativar)');
  console.log('   - Pedidos > Novo pedido         (agora pede o fornecedor)');
  console.log('   - Abra o pedido de exemplo e clique em PDF');
  console.log('============================================================\n');
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', `${URL}/login`], { windowsHide: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
