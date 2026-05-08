'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Trash2, PackageMinus, Search } from 'lucide-react';

interface Escola { id: string; nome: string; tipo: string }
interface Produto { id: string; nome: string; unidade: { id: string; abreviacao: string }; categoria: { nome: string }; estoque: { quantidade: number } | null }
interface Responsavel { id: string; nome: string; cargo: string | null }
interface ItemForm { produtoId: string; produtoNome: string; unidadeId: string; unidadeAbrev: string; estoqueAtual: number; quantidade: string }

export default function NovaSaidaPage() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [escolaId, setEscolaId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [recebedor, setRecebedor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [busca, setBusca] = useState('');
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/escolas?ativo=true').then(r => r.json()),
      fetch('/api/estoque').then(r => r.json()),
      fetch('/api/responsaveis?ativo=true').then(r => r.json()).catch(() => []),
    ]).then(([esc, prod, resp]) => { setEscolas(esc); setProdutos(prod); setResponsaveis(resp); });
  }, []);

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) && !itens.find(i => i.produtoId === p.id)
  );

  const adicionarProduto = (p: Produto) => {
    setItens(prev => [...prev, {
      produtoId: p.id, produtoNome: p.nome,
      unidadeId: p.unidade.id, unidadeAbrev: p.unidade.abreviacao,
      estoqueAtual: p.estoque?.quantidade ?? 0, quantidade: '',
    }]);
    setBusca('');
  };

  const removerItem = (idx: number) => setItens(prev => prev.filter((_, i) => i !== idx));
  const atualizarQtd = (idx: number, v: string) => setItens(prev => prev.map((it, i) => i === idx ? { ...it, quantidade: v } : it));

  const salvar = async () => {
    if (!escolaId) { setErro('Selecione a escola de destino.'); return; }
    const itensValidos = itens.filter(i => parseFloat(i.quantidade) > 0);
    if (itensValidos.length === 0) { setErro('Adicione pelo menos um produto com quantidade.'); return; }
    setSalvando(true); setErro('');
    try {
      const res = await fetch('/api/saida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data, escolaId,
          responsavelId: responsavelId || undefined,
          recebedor: recebedor || undefined,
          observacao: observacao || undefined,
          itens: itensValidos.map(i => ({ produtoId: i.produtoId, quantidade: parseFloat(i.quantidade), unidadeId: i.unidadeId })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setErro(d.erro || 'Erro ao salvar.'); setSalvando(false); return; }
      const saved = await res.json();
      router.push(`/saida/${saved.id}`);
    } catch { setErro('Erro de rede.'); setSalvando(false); }
  };

  return (
    <AppShell title="Nova Saída" backHref="/saida">
      <div className="space-y-4">
        {/* Dados gerais */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Informações gerais</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Escola / Creche destino *</label>
            <select value={escolaId} onChange={e => setEscolaId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900">
              <option value="">Selecionar escola...</option>
              {escolas.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.tipo})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data da saída *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsável (SEMAE)</label>
            <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900">
              <option value="">Selecionar responsável</option>
              {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}{r.cargo ? ` – ${r.cargo}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do recebedor</label>
            <input type="text" value={recebedor} onChange={e => setRecebedor(e.target.value)}
              placeholder="Quem vai assinar como recebedor"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observação</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)}
              placeholder="Observações (opcional)" rows={2}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none" />
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Produtos ({itens.length})</h3>
            <button onClick={() => setMostrarBusca(true)}
              className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-orange-600">
              <Plus size={15} /> Adicionar
            </button>
          </div>

          {mostrarBusca && (
            <div className="mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar produto..." autoFocus
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
              </div>
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {produtosFiltrados.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500 text-center">Nenhum produto encontrado</p>
                ) : produtosFiltrados.map(p => (
                  <button key={p.id} onClick={() => adicionarProduto(p)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 active:bg-orange-100 border-b border-slate-100 last:border-0 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{p.nome}</p>
                      <p className="text-xs text-slate-500">{p.categoria.nome} · Estoque: {p.estoque?.quantidade?.toFixed(1) ?? 0} {p.unidade.abreviacao}</p>
                    </div>
                    <span className="text-orange-500 font-bold text-lg shrink-0">+</span>
                  </button>
                ))}
              </div>
              <button onClick={() => { setMostrarBusca(false); setBusca(''); }} className="mt-2 text-sm text-slate-500 underline">Concluir seleção</button>
            </div>
          )}

          {itens.length === 0 ? (
            <div className="text-center py-6">
              <PackageMinus size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Nenhum produto adicionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((it, idx) => (
                <div key={it.produtoId} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{it.produtoNome}</p>
                      <p className="text-xs text-slate-500">Estoque: {it.estoqueAtual.toFixed(1)} {it.unidadeAbrev}</p>
                    </div>
                    <button onClick={() => removerItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={it.quantidade} onChange={e => atualizarQtd(idx, e.target.value)}
                      placeholder="Quantidade" min="0" step="0.1"
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-center font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" />
                    <span className="text-sm font-medium text-slate-500 shrink-0">{it.unidadeAbrev}</span>
                  </div>
                  {parseFloat(it.quantidade) > it.estoqueAtual && (
                    <p className="text-xs text-orange-600 mt-1">⚠ Quantidade acima do estoque atual</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>}

        <button onClick={salvar} disabled={salvando}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-base active:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
          {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PackageMinus size={20} />}
          {salvando ? 'Salvando...' : 'Registrar Saída'}
        </button>
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
