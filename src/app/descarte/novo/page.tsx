'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Trash2, Search } from 'lucide-react';

interface Produto { id: string; nome: string; unidade: { id: string; abreviacao: string }; categoria: { nome: string }; estoque: { quantidade: number } | null }
interface Responsavel { id: string; nome: string; cargo: string | null }
interface ItemForm { produtoId: string; produtoNome: string; unidadeId: string; unidadeAbrev: string; estoqueAtual: number; quantidade: string }

const MOTIVOS = [
  { value: 'VENCIMENTO', label: 'Vencimento do produto' },
  { value: 'DETERIORACAO', label: 'Deterioração / apodrecimento' },
  { value: 'DANO', label: 'Dano físico na embalagem' },
  { value: 'CONTAMINACAO', label: 'Contaminação' },
  { value: 'OUTRO', label: 'Outro motivo' },
];

export default function NovoDescartePage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [busca, setBusca] = useState('');
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/estoque').then(r => r.json()).then(setProdutos);
    fetch('/api/responsaveis?ativo=true').then(r => r.json()).catch(() => []).then(setResponsaveis);
  }, []);

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) && !itens.find(i => i.produtoId === p.id)
  );

  const adicionarProduto = (p: Produto) => {
    setItens(prev => [...prev, { produtoId: p.id, produtoNome: p.nome, unidadeId: p.unidade.id, unidadeAbrev: p.unidade.abreviacao, estoqueAtual: p.estoque?.quantidade ?? 0, quantidade: '' }]);
    setBusca('');
  };

  const removerItem = (idx: number) => setItens(prev => prev.filter((_, i) => i !== idx));
  const atualizarQtd = (idx: number, v: string) => setItens(prev => prev.map((it, i) => i === idx ? { ...it, quantidade: v } : it));

  const salvar = async () => {
    if (!motivo) { setErro('Selecione o motivo do descarte.'); return; }
    const itensValidos = itens.filter(i => parseFloat(i.quantidade) > 0);
    if (itensValidos.length === 0) { setErro('Adicione pelo menos um produto com quantidade.'); return; }
    setSalvando(true); setErro('');
    try {
      const res = await fetch('/api/descarte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data, motivo,
          responsavelId: responsavelId || undefined,
          observacao: observacao || undefined,
          itens: itensValidos.map(i => ({ produtoId: i.produtoId, quantidade: parseFloat(i.quantidade), unidadeId: i.unidadeId })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setErro(d.erro || 'Erro ao salvar.'); setSalvando(false); return; }
      router.push('/descarte');
    } catch { setErro('Erro de rede.'); setSalvando(false); }
  };

  return (
    <AppShell title="Novo Descarte" backHref="/descarte">
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Informações gerais</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Motivo do descarte *</label>
            <select value={motivo} onChange={e => setMotivo(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900">
              <option value="">Selecionar motivo...</option>
              {MOTIVOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsável</label>
            <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900">
              <option value="">Selecionar responsável</option>
              {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}{r.cargo ? ` – ${r.cargo}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observação / Detalhes *</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)}
              placeholder="Descreva o motivo detalhadamente..." rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 resize-none" />
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Produtos ({itens.length})</h3>
            <button onClick={() => setMostrarBusca(true)}
              className="flex items-center gap-1.5 bg-red-500 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-red-600">
              <Plus size={15} /> Adicionar
            </button>
          </div>
          {mostrarBusca && (
            <div className="mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." autoFocus
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900" />
              </div>
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {produtosFiltrados.length === 0 ? <p className="p-3 text-sm text-slate-500 text-center">Nenhum produto encontrado</p>
                  : produtosFiltrados.map(p => (
                    <button key={p.id} onClick={() => adicionarProduto(p)}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 border-b border-slate-100 last:border-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm">{p.nome}</p>
                        <p className="text-xs text-slate-500">Estoque: {p.estoque?.quantidade?.toFixed(1) ?? 0} {p.unidade.abreviacao}</p>
                      </div>
                      <span className="text-red-500 font-bold text-lg shrink-0">+</span>
                    </button>
                  ))
                }
              </div>
              <button onClick={() => { setMostrarBusca(false); setBusca(''); }} className="mt-2 text-sm text-slate-500 underline">Concluir seleção</button>
            </div>
          )}
          {itens.length === 0 ? (
            <div className="text-center py-6"><Trash2 size={28} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-400">Nenhum produto adicionado</p></div>
          ) : (
            <div className="space-y-3">
              {itens.map((it, idx) => (
                <div key={it.produtoId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{it.produtoNome}</p>
                    <p className="text-xs text-slate-500">Em estoque: {it.estoqueAtual.toFixed(1)} {it.unidadeAbrev}</p>
                  </div>
                  <input type="number" value={it.quantidade} onChange={e => atualizarQtd(idx, e.target.value)}
                    placeholder="Qtd" min="0" step="0.1"
                    className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-center font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
                  <button onClick={() => removerItem(idx)} className="p-2 text-red-400 hover:text-red-600 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>}

        <button onClick={salvar} disabled={salvando}
          className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-base active:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
          {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={20} />}
          {salvando ? 'Salvando...' : 'Registrar Descarte'}
        </button>
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
