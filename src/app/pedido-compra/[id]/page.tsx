'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PackagePlus, Printer, Send, Trash2, XCircle, Calendar, School, User, FileText, ChevronRight } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Historico from '@/components/Historico';
import { requisitar } from '@/lib/http-client';
import { formatarData, hoje, pendente, statusPedido } from '@/lib/regras';

interface Item { id: string; produtoId: string | null; descricao: string | null; unidadeId: string; quantidade: number; recebido: number; cancelado: number; produto: { nome: string } | null; unidade: { abreviacao: string } }
interface Pedido { id: string; numero: number; data: string; status: string; observacao: string | null; escola: { nome: string } | null; responsavel: { nome: string } | null; itens: Item[]; entradas: { id: string; numero: number; data: string }[] }
interface Linha { id: string; produtoId: string; quantidade: string; encerrar: boolean; selecionado: boolean }
interface Produto { id: string; nome: string; unidade: { id: string } }

const statusCor: Record<string, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ENVIADO: 'bg-blue-100 text-blue-800 border-blue-200',
  PARCIAL: 'bg-amber-100 text-amber-800 border-amber-200',
  ATENDIDO: 'bg-green-100 text-green-800 border-green-200',
  CANCELADO: 'bg-red-100 text-red-800 border-red-200',
};
const chip = 'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido>();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [recebendo, setRecebendo] = useState(false);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [data, setData] = useState(hoje);
  const [fornecedor, setFornecedor] = useState('');
  const [observacao, setObservacao] = useState('');
  const tentativa = useRef<{ payload: string; chave: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    requisitar<Pedido>(`/api/pedido-compra/${id}`, { signal: controller.signal }).then(setPedido).catch(e => { if (!controller.signal.aborted) setErro(e.message); });
    return () => controller.abort();
  }, [id]);

  async function status(novo: string) {
    if (novo === 'CANCELADO' && !window.confirm('Cancelar os itens ainda pendentes? Os recebimentos existentes serão preservados.')) return;
    setOcupado(true); setErro('');
    try { setPedido(await requisitar<Pedido>(`/api/pedido-compra/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novo }) })); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao atualizar.'); }
    finally { setOcupado(false); }
  }
  async function iniciar() {
    if (!pedido) return;
    setOcupado(true); setErro('');
    try {
      setProdutos(await requisitar<Produto[]>('/api/estoque'));
      setLinhas(pedido.itens.filter(i => pendente(i) > 0).map(i => ({ id: i.id, produtoId: i.produtoId || '', quantidade: String(pendente(i)), encerrar: false, selecionado: true })));
      setRecebendo(true);
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao carregar produtos.'); }
    finally { setOcupado(false); }
  }
  const editar = (id: string, alteracao: Partial<Linha>) => setLinhas(prev => prev.map(l => l.id === id ? { ...l, ...alteracao } : l));
  async function confirmar() {
    if (ocupado) return;
    const escolhidas = linhas.filter(l => l.selecionado);
    if (!escolhidas.length || escolhidas.some(l => l.quantidade.trim() === '' || !Number.isFinite(Number(l.quantidade)) || Number(l.quantidade) < 0)) {
      setErro('Selecione itens e confira as quantidades.'); return;
    }
    const payload = JSON.stringify({ data, fornecedor, observacao, itens: escolhidas.map(l => ({ id: l.id, produtoId: l.produtoId, quantidade: Number(l.quantidade), encerrar: l.encerrar })) });
    // Mantem a chave em retries da mesma confirmacao, inclusive quando a resposta se perde.
    if (tentativa.current?.payload !== payload) tentativa.current = { payload, chave: crypto.randomUUID() };
    setOcupado(true); setErro('');
    try {
      await requisitar(`/api/pedido-compra/${id}/receber`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...JSON.parse(payload), chaveOperacao: tentativa.current.chave }) });
      setPedido(await requisitar<Pedido>(`/api/pedido-compra/${id}`));
      setRecebendo(false); tentativa.current = null; setObservacao('');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha no recebimento.'); }
    finally { setOcupado(false); }
  }
  const aberto = pedido && !['ATENDIDO', 'CANCELADO'].includes(pedido.status);
  const inputCls = 'block w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400';

  return <AppShell title={pedido ? `Pedido #${pedido.numero}` : 'Pedido'} backHref="/pedido-compra"
    actions={pedido ? <Link href={`/pedido-compra/${id}/pdf`} className="flex items-center gap-1.5 bg-slate-800 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-slate-900"><Printer size={16} /> PDF</Link> : undefined}>
    {erro && <p role="alert" className="bg-red-50 text-red-700 p-3 mb-4 rounded-xl text-sm">{erro}</p>}
    {!pedido && !erro && <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />}
    {pedido && <div className="space-y-4">
      {/* Status + acoes */}
      <div className={`rounded-2xl border p-4 shadow-sm ${statusCor[pedido.status] || 'bg-white border-slate-200'}`}>
        <p className="font-bold text-base">{statusPedido[pedido.status] || pedido.status}</p>
        <div className="flex gap-2 flex-wrap mt-3">
          {aberto && !recebendo && <button disabled={ocupado} onClick={iniciar} className="flex gap-1.5 items-center bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50 active:bg-green-700"><PackagePlus size={15} /> Receber no estoque</button>}
          {['PENDENTE', 'RASCUNHO'].includes(pedido.status) && <button disabled={ocupado} onClick={() => status('ENVIADO')} className="flex items-center gap-1.5 bg-white/70 text-blue-800 text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50"><Send size={15} /> Marcar enviado</button>}
          {aberto && <button disabled={ocupado} onClick={() => status('CANCELADO')} className="flex items-center gap-1.5 bg-white/70 text-red-700 text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50"><XCircle size={15} /> Cancelar pendências</button>}
        </div>
      </div>

      {/* Dados do pedido */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <Calendar size={18} className="text-slate-400 shrink-0" />
          <div><p className="text-xs text-slate-500">Data</p><p className="font-medium text-slate-900">{formatarData(pedido.data)}</p></div>
        </div>
        <div className="p-4 flex items-center gap-3 border-t border-slate-100">
          <School size={18} className="text-blue-500 shrink-0" />
          <div><p className="text-xs text-slate-500">Escola / Destino</p><p className="font-medium text-slate-900">{pedido.escola?.nome || 'Geral / SEMAE'}</p></div>
        </div>
        <div className="p-4 flex items-center gap-3 border-t border-slate-100">
          <User size={18} className="text-slate-400 shrink-0" />
          <div><p className="text-xs text-slate-500">Responsável</p><p className="font-medium text-slate-900">{pedido.responsavel?.nome || '—'}</p></div>
        </div>
        {pedido.observacao && <div className="p-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FileText size={13} /> Observação</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap italic">{pedido.observacao}</p>
        </div>}
      </div>

      {!recebendo ? <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        {pedido.status === 'ATENDIDO' && !pedido.entradas.length && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">Pedido encerrado no sistema anterior. As quantidades recebidas não foram apuradas.</p>}
        <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><PackagePlus size={16} className="text-slate-400" /> Itens do pedido ({pedido.itens.length})</h2>
        <div className="divide-y divide-slate-100">
          {pedido.itens.map(i => <div key={i.id} className="py-3">
            <p className="font-medium text-slate-900">{i.produto?.nome || i.descricao} <span className="text-xs font-normal text-slate-400">({i.unidade.abreviacao})</span></p>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              <span className={`${chip} bg-slate-100 text-slate-600`}>Pedido: {i.quantidade}</span>
              <span className={`${chip} bg-green-50 text-green-700`}>Recebido: {i.recebido}</span>
              {pendente(i) > 0 && <span className={`${chip} bg-amber-50 text-amber-700`}>Pendente: {pendente(i)}</span>}
              {i.cancelado > 0 && <span className={`${chip} bg-red-50 text-red-600`}>Cancelado: {i.cancelado}</span>}
            </div>
          </div>)}
        </div>
      </div> : <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><PackagePlus size={16} className="text-green-600" /> Conferência do recebimento</h2>
        <label className="block text-sm font-medium text-slate-600">Data<input type="date" value={data} onChange={e => setData(e.target.value)} className={`${inputCls} mt-1`} /></label>
        <label className="block text-sm font-medium text-slate-600">Fornecedor<input value={fornecedor} onChange={e => setFornecedor(e.target.value)} className={`${inputCls} mt-1`} /></label>
        <fieldset disabled={ocupado} className="space-y-3">
          {linhas.map(l => {
            const i = pedido.itens.find(i => i.id === l.id)!;
            return <div key={l.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center gap-3">
                <label className="flex gap-2 items-center flex-1 font-medium text-slate-800"><input type="checkbox" className="w-4 h-4" checked={l.selecionado} onChange={e => editar(l.id, { selecionado: e.target.checked })} />{i.produto?.nome || i.descricao}</label>
                <button title="Retirar deste recebimento" aria-label={`Retirar ${i.produto?.nome || i.descricao} deste recebimento`} onClick={() => editar(l.id, { selecionado: false })} className="text-slate-400 active:text-red-500"><Trash2 size={18} /></button>
              </div>
              {l.selecionado && <>
                <p className="text-xs text-slate-500">Pendente: {pendente(i)} {i.unidade.abreviacao}</p>
                <label className="block text-sm font-medium text-slate-600">Produto recebido<select value={l.produtoId} onChange={e => editar(l.id, { produtoId: e.target.value })} className={`${inputCls} mt-1`}>
                  <option value="">Vincular ao cadastro</option>
                  {produtos.filter(p => p.unidade.id === i.unidadeId).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select></label>
                {!l.produtoId && <div className="flex gap-3 flex-wrap text-xs text-blue-700">
                  <Link className="underline" href="/admin/produtos" target="_blank" rel="noopener">Cadastrar produto (administrador)</Link>
                  <button type="button" className="underline" onClick={async () => {
                    try { setProdutos(await requisitar<Produto[]>('/api/estoque')); }
                    catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao atualizar cadastros.'); }
                  }}>Atualizar cadastros</button>
                </div>}
                <label className="block text-sm font-medium text-slate-600">Quantidade recebida<input aria-label={`Quantidade recebida de ${i.produto?.nome || i.descricao}`} type="number" min="0" max={pendente(i)} step="any" value={l.quantidade} onChange={e => editar(l.id, { quantidade: e.target.value })} className={`${inputCls} mt-1`} /></label>
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="w-4 h-4" checked={l.encerrar} onChange={e => editar(l.id, { encerrar: e.target.checked })} />Encerrar o saldo não entregue deste item</label>
              </>}
            </div>;
          })}
        </fieldset>
        <label className="block text-sm font-medium text-slate-600">Observação / justificativa<textarea value={observacao} onChange={e => setObservacao(e.target.value)} className={`${inputCls} mt-1`} /></label>
        <div className="flex gap-2 pt-1">
          <button disabled={ocupado} onClick={confirmar} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 active:bg-green-700">{ocupado ? 'Registrando...' : 'Confirmar recebimento'}</button>
          <button disabled={ocupado} onClick={() => setRecebendo(false)} className="px-4 py-3 rounded-xl font-medium text-slate-600 border border-slate-200">Voltar</button>
        </div>
      </div>}

      {pedido.entradas.length > 0 && <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-1">Entradas vinculadas</h2>
        <div className="divide-y divide-slate-100">
          {pedido.entradas.map(e => <Link key={e.id} className="flex items-center gap-2 py-3 active:bg-slate-50 -mx-1 px-1 rounded-lg" href={`/entrada/${e.id}`}>
            <span className="flex-1 text-sm text-blue-700 font-medium">Entrada #{e.numero}</span>
            <span className="text-xs text-slate-400">{formatarData(e.data)}</span>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>)}
        </div>
      </div>}

      <Historico key={pedido.entradas.length + pedido.status} origemId={id} />
    </div>}
  </AppShell>;
}
