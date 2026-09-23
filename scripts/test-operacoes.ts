import assert from 'node:assert/strict';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import bcrypt from 'bcryptjs';
import { estoqueBaixo, pendente, formatarData } from '../src/lib/regras';
import { dataCivil, numero } from '../src/lib/validacao';
import { gerarPdf } from '../src/lib/gerar-pdf';
import { montarDaBase } from '../src/lib/refazer-pedido';

async function main() {
  // Sobrescreve explicitamente o destino ANTES de importar Prisma. Nunca le .env.local.
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:55439/postgres?sslmode=disable&connection_limit=1';
  process.env.SECRET_COOKIE_PASSWORD = randomBytes(32).toString('hex');
  const db = await PGlite.create();
  const sql = execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { encoding: 'utf8', env: process.env });
  await db.exec(sql);
  const patch = readFileSync('prisma/patches/20260913-operacoes.sql', 'utf8');
  await db.exec(patch);
  await db.exec(patch);
  const patchFornecedores = readFileSync('prisma/patches/20260922-fornecedores.sql', 'utf8');
  await db.exec(patchFornecedores);
  await db.exec(patchFornecedores);
  const socket = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 55439, maxConnections: 10 });
  await socket.start();
  const { prisma } = await import('../src/lib/prisma');
  const { criarMovimento, excluirMovimento, statusSaida, movimentar, transacao } = await import('../src/lib/operacoes');
  const { criarPedido, receberPedido, buscarPedido, excluirPedido } = await import('../src/lib/pedidos');
  let server: ChildProcess | undefined;
  let logs = '';
  let navegador: import('@playwright/test').Browser | undefined;
  let testes = 0;
  const ok = (nome: string) => { testes++; console.log(`PASS ${nome}`); };
  try {
    assert.equal(estoqueBaixo(0, 0), true); assert.equal(estoqueBaixo(-1, 0), true);
    assert.equal(estoqueBaixo(5, 5), true); assert.equal(estoqueBaixo(6, 5), false);
    assert.equal(pendente({ quantidade: 0.3, recebido: 0.1, cancelado: 0.2 }), 0);
    assert.throws(() => numero(Infinity, 'qtd')); assert.throws(() => numero('1', 'qtd'));
    assert.throws(() => dataCivil('2026-02-30')); assert.equal(formatarData('2026-09-15T00:00:00Z'), '15/09/2026');
    ok('regras: minimo, negativo, decimais, datas e numeros invalidos');
    const refeito = montarDaBase({ numero: 5, observacao: 'Entregar cedo', escolaId: 'escola-inativa', responsavelId: null, fornecedorId: 'f1',
      fornecedor: { nome: 'F' }, escola: { nome: 'Escola antiga' }, responsavel: null, itens: [
        { produtoId: 'p1', descricao: null, unidadeId: 'kg', quantidade: 20, produto: { nome: 'Acucar' }, unidade: { abreviacao: 'kg' } },
        { produtoId: 'p-inativo', descricao: null, unidadeId: 'kg', quantidade: 3, produto: { nome: 'Produto antigo' }, unidade: { abreviacao: 'kg' } },
        { produtoId: null, descricao: 'Item livre', unidadeId: 'un', quantidade: 2, produto: null, unidade: { abreviacao: 'un' } },
      ] }, { produtos: [{ id: 'p1', nome: 'Acucar', unidade: { id: 'fd', abreviacao: 'fd' }, estoque: { quantidade: 4 } }],
      unidades: [{ id: 'un', abreviacao: 'un' }], fornecedores: [{ id: 'f1' }], escolas: [], responsaveis: [] });
    assert.equal(refeito.fornecedorId, 'f1'); assert.equal(refeito.escolaId, ''); assert.equal(refeito.observacao, 'Entregar cedo');
    assert.deepEqual(refeito.itens.map(i => [i.produtoNome, i.quantidade, i.unidadeAbrev]), [['Acucar', '20', 'fd'], ['Item livre', '2', 'un']]);
    assert.match(refeito.itens[0].aviso ?? '', /era kg, agora fd/); assert.equal(refeito.itens[1].aviso, undefined);
    assert.ok(refeito.avisos.some(a => a.includes('Produto antigo')) && refeito.avisos.some(a => a.includes('Escola antiga')));
    ok('refazer pedido: copia so o que esta ativo e avisa unidade que mudou');

    const u = await prisma.unidadeMedida.create({ data: { nome: 'Quilograma', abreviacao: 'kg' } });
    const outraUnidade = await prisma.unidadeMedida.create({ data: { nome: 'Unidade', abreviacao: 'un' } });
    const c = await prisma.categoria.create({ data: { nome: 'Teste' } });
    const produto = await prisma.produto.create({ data: { nome: 'Arroz de teste', categoriaId: c.id, unidadeId: u.id, estoqueMinimo: 5 } });
    const escola = await prisma.escola.create({ data: { nome: 'Escola ficticia de teste' } });
    const user = await prisma.usuario.create({ data: { identificador: 'teste-local', nome: 'Operador de teste', senhaHash: await bcrypt.hash('Somente-Teste-Local-2026', 4), role: 'admin' } });
    const session = { userId: user.id, identificador: user.identificador, nome: user.nome, role: user.role, protegido: false, isLoggedIn: true };
    const item = { produtoId: produto.id, unidadeId: u.id, quantidade: 10 };
    const data = '2026-09-15';
    const entrada = await criarMovimento('entrada', { data, itens: [item] }, session);
    assert.equal((await prisma.estoque.findUniqueOrThrow({ where: { produtoId: produto.id } })).quantidade, 10);
    assert.equal(await prisma.movimentoEstoque.count(), 1);
    ok('entrada atualiza saldo e historico atomicamente');
    for (const ruim of [-1, 0, NaN, Infinity, '10']) {
      await assert.rejects(criarMovimento('entrada', { data, itens: [{ ...item, quantidade: ruim }] }, session));
    }
    await assert.rejects(criarMovimento('saida', { data, escolaId: escola.id, itens: [{ ...item, unidadeId: outraUnidade.id }] }, session));
    assert.equal(await prisma.entrada.count(), 1);
    ok('validacao rejeita quantidade e unidade invalida sem escrita parcial');
    const saida = await criarMovimento('saida', { data, escolaId: escola.id, itens: [{ ...item, quantidade: 12 }] }, session);
    assert.equal((await prisma.estoque.findUniqueOrThrow({ where: { produtoId: produto.id } })).quantidade, -2);
    await statusSaida(saida.id, { status: 'CANCELADO' }, session);
    await statusSaida(saida.id, { status: 'CANCELADO' }, session);
    assert.equal((await prisma.estoque.findUniqueOrThrow({ where: { produtoId: produto.id } })).quantidade, 10);
    await excluirMovimento('saida', saida.id, session);
    assert.equal((await prisma.estoque.findUniqueOrThrow({ where: { produtoId: produto.id } })).quantidade, 10);
    ok('negativo permitido; cancelar e excluir nao estornam duas vezes');
    const descarte = await criarMovimento('descarte', { data, motivo: 'VENCIMENTO', itens: [{ ...item, quantidade: 2 }] }, session);
    await excluirMovimento('descarte', descarte.id, session);
    assert.equal(await prisma.movimentoEstoque.count({ where: { origemId: descarte.id } }), 2);
    ok('historico do descarte sobrevive a exclusao');

    const pedido = await criarPedido({ data, itens: [item, { descricao: 'Feijao sem cadastro', unidadeId: u.id, quantidade: 4 }] }, session);
    const itemPedido = pedido.itens.find(i => i.produtoId === produto.id)!;
    const itemLivre = pedido.itens.find(i => !i.produtoId)!;
    const payload = { data, chaveOperacao: 'teste-recebimento-1', itens: [{ id: itemPedido.id, quantidade: 3 }] };
    const recebimento = await receberPedido(pedido.id, payload, session);
    const retry = await receberPedido(pedido.id, payload, session);
    assert.equal(retry.id, recebimento.id);
    assert.equal((await prisma.estoque.findUniqueOrThrow({ where: { produtoId: produto.id } })).quantidade, 13);
    assert.equal((await buscarPedido(pedido.id))?.status, 'PARCIAL');
    ok('recebimento parcial vinculado ao pedido e retry idempotente');
    await assert.rejects(receberPedido(pedido.id, { data, chaveOperacao: 'ruim-1', itens: [{ id: itemPedido.id, quantidade: 8 }] }, session));
    await assert.rejects(receberPedido(pedido.id, { data, chaveOperacao: 'ruim-2', itens: [{ id: itemLivre.id, quantidade: 1 }] }, session));
    await assert.rejects(receberPedido(pedido.id, { data, chaveOperacao: 'ruim-3', itens: [{ id: itemPedido.id, quantidade: 1, encerrar: true }] }, session));
    assert.equal((await buscarPedido(pedido.id))?.itens.find(i => i.id === itemPedido.id)?.recebido, 3);
    ok('bloqueia excesso, item sem vinculo e cancelamento sem justificativa');
    const final = await receberPedido(pedido.id, { data, chaveOperacao: 'teste-recebimento-2', observacao: 'Fornecedor nao entregara o restante',
      itens: [{ id: itemPedido.id, quantidade: 2, encerrar: true }, { id: itemLivre.id, quantidade: 4, produtoId: produto.id }] }, session);
    assert.equal(final.pedidoId, pedido.id);
    const fechado = await buscarPedido(pedido.id);
    assert.equal(fechado?.status, 'ATENDIDO');
    assert.equal(fechado?.itens.find(i => i.id === itemPedido.id)?.cancelado, 5);
    await assert.rejects(excluirPedido(pedido.id, session));
    await assert.rejects(excluirMovimento('entrada', recebimento.id, session));
    ok('edita recebimento, vincula item livre, encerra saldo e preserva origem');
    const fornecedor = await prisma.fornecedor.create({ data: { nome: 'Distribuidora ficticia de teste', cnpj: '00.000.000/0001-00' } });
    const inativo = await prisma.fornecedor.create({ data: { nome: 'Fornecedor desativado de teste', ativo: false } });
    await assert.rejects(criarPedido({ data, fornecedorId: inativo.id, itens: [item] }, session));
    await assert.rejects(criarPedido({ data, fornecedorId: 'inexistente', itens: [item] }, session));
    const comFornecedor = await criarPedido({ data, fornecedorId: fornecedor.id, itens: [item] }, session);
    assert.equal(comFornecedor.fornecedor?.nome, fornecedor.nome);
    // A entrada do recebimento herda o fornecedor do pedido sem ninguem redigitar o nome.
    const recebida = await receberPedido(comFornecedor.id, { data, chaveOperacao: 'teste-fornecedor-1',
      itens: [{ id: comFornecedor.itens[0].id, quantidade: 10 }] }, session);
    assert.equal((await prisma.entrada.findUniqueOrThrow({ where: { id: recebida.id } })).fornecedorId, fornecedor.id);
    const avulsa = await criarMovimento('entrada', { data, fornecedorId: fornecedor.id, itens: [item] }, session);
    assert.equal((await prisma.entrada.findUniqueOrThrow({ where: { id: avulsa.id } })).fornecedorId, fornecedor.id);
    await assert.rejects(criarMovimento('entrada', { data, fornecedorId: inativo.id, itens: [item] }, session));
    ok('pedido e entrada usam o fornecedor cadastrado e recusam fornecedor invalido');

    const saldoAntes = (await prisma.estoque.findUniqueOrThrow({ where: { produtoId: produto.id } })).quantidade;
    await assert.rejects(transacao(async tx => {
      await movimentar(tx, session, { produtoId: produto.id, quantidade: 100 }, { tipo: 'teste', origemId: 'rollback', data: new Date() });
      throw new Error('Falha simulada');
    }));
    assert.equal((await prisma.estoque.findUniqueOrThrow({ where: { produtoId: produto.id } })).quantidade, saldoAntes);
    assert.equal(await prisma.movimentoEstoque.count({ where: { origemId: 'rollback' } }), 0);
    ok('rollback impede saldo sem historico');

    // Testa a importacao do historico de documentos anteriores, inclusive reexecucao.
    await prisma.movimentoEstoque.deleteMany({ where: { origemId: entrada.id } });
    await db.exec(patch); await db.exec(patch);
    assert.equal(await prisma.movimentoEstoque.count({ where: { origemId: entrada.id } }), 1);
    assert.equal((await prisma.movimentoEstoque.findFirstOrThrow({ where: { origemId: entrada.id } })).saldo, null);
    ok('atualizacao SQL reaplicavel sem duplicar historico legado');
    const pdf = gerarPdf({ titulo: 'Saída de teste', arquivo: 'teste.pdf', voltar: '/', campos: [['Observação', 'Açúcar e feijão']],
      colunas: ['Produto', 'Quantidade', 'Unidade'], linhas: Array.from({ length: 150 }, (_, i) => [`Produto ${i}`, '10', 'kg']), assinaturas: ['Responsável', 'Recebedor'] });
    assert.ok(pdf.getNumberOfPages() > 1); assert.ok(pdf.output().startsWith('%PDF-'));
    ok('PDF binario valido com 150 itens e paginacao');

    if (process.argv.includes('--web') || process.argv.includes('--preview')) {
      const { chromium, expect } = await import('@playwright/test');
      const saidaWeb = await criarMovimento('saida', { data, escolaId: escola.id, itens: [item] }, session);
      const descarteWeb = await criarMovimento('descarte', { data, motivo: 'VENCIMENTO', itens: [item] }, session);
      const pedidoWeb = await criarPedido({ data, itens: [item] }, session);
      // Desconecta o cliente do teste para nao disputar a conexao com o Next.
      await prisma.$disconnect();
      // PGlite compartilha a sessao PostgreSQL entre sockets, ao contrario do servidor real.
      await db.exec('DEALLOCATE ALL');
      const url = 'http://localhost:3107';
      server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '3107', '--hostname', '127.0.0.1'], {
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
      });
      server.stdout?.on('data', d => { logs += d.toString(); });
      server.stderr?.on('data', d => { logs += d.toString(); });
      for (let i = 0; i < 90; i++) {
        if (server.exitCode !== null) throw new Error(logs);
        try { if ((await fetch(`${url}/login`)).ok) break; } catch { /* Aguardando servidor local. */ }
        await new Promise(r => setTimeout(r, 1000));
      }
      navegador = await chromium.launch({ channel: 'chrome', headless: true });
      const context = await navegador.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
      const login = await context.request.post(`${url}/api/auth/login`, { headers: { Origin: url }, data: { identificador: user.identificador, senha: 'Somente-Teste-Local-2026' } });
      assert.equal(login.status(), 200, await login.text());
      const csrf = await context.request.post(`${url}/api/entrada`, { headers: { Origin: 'https://untrusted.example' }, data: { data, itens: [item] } });
      assert.equal(csrf.status(), 403);
      const anonymous = await navegador.newContext();
      assert.equal((await anonymous.request.get(`${url}/api/estoque`)).status(), 401);
      await anonymous.close();
      ok('HTTP: login, sessao obrigatoria e bloqueio CSRF');
      const page = await context.newPage();
      const erros: string[] = [];
      page.on('pageerror', error => erros.push(error.message));
      mkdirSync('test-results', { recursive: true });
      for (const [tipo, docId] of [['entrada', entrada.id], ['saida', saidaWeb.id], ['descarte', descarteWeb.id], ['pedido-compra', pedidoWeb.id]]) {
        await page.goto(`${url}/${tipo}/${docId}/pdf`);
        await expect(page.getByRole('button', { name: 'Imprimir', exact: true })).toBeVisible();
        await expect(page.locator('article table tbody tr')).toHaveCount(1);
        const downloadEvent = page.waitForEvent('download');
        await page.getByRole('button', { name: 'PDF', exact: true }).click();
        const download = await downloadEvent;
        await download.saveAs(`test-results/${tipo}.pdf`);
        assert.equal(readFileSync(`test-results/${tipo}.pdf`).subarray(0, 5).toString(), '%PDF-');
        await page.evaluate(() => { window.print = () => document.body.setAttribute('data-print-called', 'true'); });
        await page.getByRole('button', { name: 'Imprimir', exact: true }).click();
        await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        await page.screenshot({ path: `test-results/${tipo}-mobile.png`, fullPage: true });
        await page.getByRole('link', { name: 'Voltar', exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`/${tipo}/${docId}$`));
        ok(`browser: ${tipo}, PDF, download e retorno mobile`);
      }
      await page.goto(`${url}/pedido-compra/${pedidoWeb.id}`);
      await page.getByRole('button', { name: 'Receber no estoque' }).click();
      await page.getByLabel('Quantidade recebida de Arroz de teste').fill('2');
      await page.getByRole('button', { name: 'Confirmar recebimento' }).click();
      await expect(page.getByText('Recebido parcialmente', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: /Entrada #/ })).toBeVisible();
      ok('browser: conferência parcial gera entrada vinculada');
      for (const [tipo, docId] of [['entrada', entrada.id], ['descarte', descarteWeb.id]]) {
        await page.goto(`${url}/${tipo}`);
        await page.locator(`a[href='/${tipo}/${docId}']`).click();
        await expect(page).toHaveURL(new RegExp(`/${tipo}/${docId}$`));
      }
      ok('listas de entradas e descartes abrem os detalhes');
      await page.goto(`${url}/pedido-compra/novo`);
      await page.getByLabel('Fornecedor', { exact: true }).selectOption({ label: 'Distribuidora ficticia de teste' });
      // Produto cadastrado e o caminho principal: "Adicionar" abre o painel e a
      // busca ignora maiusculas. O painel fica aberto; o escolhido aparece marcado
      // e um toque errado se desfaz tocando de novo. "Concluir" fecha.
      const adicionar = page.getByRole('button', { name: 'Adicionar', exact: true });
      await adicionar.click();
      await page.getByLabel('Buscar produto').fill('ARROZ');
      const arroz = page.getByRole('button', { name: /Arroz de teste/ });
      await arroz.click();
      await expect(arroz).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('1 selecionado', { exact: true })).toBeVisible();
      await arroz.click();
      await expect(arroz).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByText('Nenhum selecionado', { exact: true })).toBeVisible();
      await arroz.click();
      await page.getByRole('button', { name: 'Concluir', exact: true }).click();
      await expect(page.getByLabel('Buscar produto')).toHaveCount(0);
      // Item sem cadastro fica escondido dentro do painel ate ser pedido.
      await adicionar.click();
      await expect(page.getByLabel('Nome do item sem cadastro')).toHaveCount(0);
      await page.getByRole('button', { name: /Adicionar item sem cadastro/ }).click();
      await page.getByLabel('Nome do item sem cadastro').fill('Produto livre de teste');
      await page.getByLabel('Unidade do item sem cadastro').selectOption(u.id);
      await page.getByRole('button', { name: 'Adicionar item ao pedido' }).click();
      for (const campo of await page.getByPlaceholder('Quantidade', { exact: true }).all()) await campo.fill('7');
      await page.getByRole('button', { name: 'Registrar pedido' }).click();
      // Confere no pedido salvo (nao no formulario): la o item vem como "Nome (un)".
      await expect(page.getByText('Pedido pendente', { exact: true })).toBeVisible();
      await expect(page.getByText(/^Produto livre de teste/)).toBeVisible();
      await expect(page.getByText(/^Arroz de teste/)).toBeVisible();
      ok('formulario cria pedido com produto cadastrado (busca) e item sem cadastro');
      // Refazer: abre o formulario ja preenchido e registra um pedido NOVO.
      const urlOriginal = page.url();
      await page.getByRole('link', { name: /Refazer pedido/ }).click();
      await expect(page.getByText(/Refazendo o Pedido #/)).toBeVisible();
      await expect(page.getByLabel('Fornecedor', { exact: true })).not.toHaveValue('');
      await expect(page.getByText('Arroz de teste', { exact: true })).toBeVisible();
      await expect(page.getByText('Produto livre de teste', { exact: true })).toBeVisible();
      const quantidades = await page.getByPlaceholder('Quantidade', { exact: true }).all();
      assert.equal(quantidades.length, 2);
      for (const campo of quantidades) await expect(campo).toHaveValue('7');
      await page.getByRole('button', { name: 'Registrar pedido' }).click();
      await expect(page.getByText('Pedido pendente', { exact: true })).toBeVisible();
      assert.notEqual(page.url(), urlOriginal);
      await expect(page.getByText(/^Arroz de teste/)).toBeVisible();
      await expect(page.getByText(/^Produto livre de teste/)).toBeVisible();
      ok('refazer pedido abre o formulario preenchido e registra um pedido novo');
      const estoqueHttp = await (await context.request.get(`${url}/api/estoque`)).json();
      const dashboard = await (await context.request.get(`${url}/api/dashboard`)).json();
      const esperado = estoqueHttp.filter((p: { estoque: { quantidade: number }; estoqueMinimo: number }) => estoqueBaixo(p.estoque.quantidade, p.estoqueMinimo)).length;
      assert.equal(dashboard.produtosAbaixoMinimo, esperado);
      await page.goto(`${url}/relatorios`);
      await page.getByRole('button', { name: /Estoque Atual/ }).click();
      await expect(page.getByText('Arroz de teste', { exact: true })).toBeVisible();
      ok('alertas coerentes e relatorio de estoque renderizado');
      await page.goto(`${url}/estoque/${produto.id}`);
      await expect(page.getByRole('heading', { name: 'Histórico' })).toBeVisible();
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.screenshot({ path: 'test-results/historico-desktop.png', fullPage: true });
      assert.deepEqual(erros, []);
      ok('historico desktop e ausencia de erros JavaScript');
      await db.query('UPDATE "Usuario" SET ativo = false WHERE id = $1', [user.id]);
      assert.equal((await context.request.get(`${url}/api/estoque`)).status(), 401);
      await db.query('UPDATE "Usuario" SET ativo = true WHERE id = $1', [user.id]);
      ok('desativacao revoga imediatamente uma sessao existente');
      await navegador.close(); navegador = undefined;
      console.log(logs.split('\n').filter(l => /error|Error| 500 /.test(l)).join('\n'));
      if (process.argv.includes('--preview')) {
        console.log('PREVIA PRONTA: http://localhost:3107/login (somente dados ficticios)');
        await new Promise<void>(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
      }
    }
    console.log(`\n${testes} grupos de testes passaram. Banco descartavel, sem acesso a producao.`);
  } finally {
    if (server) console.log(logs.slice(-10000));
    await navegador?.close();
    if (server && server.exitCode === null) { server.kill(); await once(server, 'exit'); }
    await prisma.$disconnect(); await socket.stop(); await db.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
