'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Package, AlertTriangle, Search, Edit3, Check, X } from 'lucide-react';

interface ProdutoEstoque {
  id: string; nome: string; estoqueMinimo: number; ativo: boolean;
  categoria: { id: string; nome: string; cor: string };
  unidade: { id: string; nome: string; abreviacao: string };
  estoque: { quantidade: number } | null;
}

export default function EstoquePage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novaQtd, setNovaQtd] = useState('');
  const [motivoEdit, setMotivoEdit] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [filtroBaixo, setFiltroBaixo] = useState(false);

  const carregar = useCallback((search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`/api/estoque${qs}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setProdutos(d); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { carregar(); }, [carregar]);

  const debouncedBusca = useCallback((v: string) => {
    setBusca(v);
    const t = setTimeout(() => carregar(v), 400);
    return () => clearTimeout(t);
  }, [carregar]);

  const iniciarEdicao = (p: ProdutoEstoque) => {
    setEditandoId(p.id);
    setNovaQtd((p.estoque?.quantidade ?? 0).toString());
    setMotivoEdit('');
  };

  const cancelarEdicao = () => { setEditandoId(null); setNovaQtd(''); setMotivoEdit(''); };

  const salvarEdicao = async (produtoId: string) => {
    setSalvando(true);
    await fetch(`/api/estoque/${produtoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade: parseFloat(novaQtd), motivo: motivoEdit || 'Ajuste manual de estoque' }),
    });
    setProdutos(prev => prev.map(p => p.id === produtoId ? { ...p, estoque: { quantidade: parseFloat(novaQtd) } } : p));
    cancelarEdicao();
    setSalvando(false);
  };

  const produtosFiltrados = filtroBaixo
    ? produtos.filter(p => (p.estoque?.quantidade ?? 0) < p.estoqueMinimo || (p.estoque?.quantidade ?? 0) === 0)
    : produtos;

  const baixoEstoque = produtos.filter(p => (p.estoque?.quantidade ?? 0) < p.estoqueMinimo && p.estoqueMinimo > 0).length;

  return (
    <AppShell title="Estoque">
      <div className="space-y-4">
        {/* Sumário */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium mb-1">Total de produtos</p>
            <p className="text-2xl font-bold text-slate-900">{produtos.length}</p>
          </div>
          <button onClick={() => setFiltroBaixo(!filtroBaixo)}
            className={`rounded-2xl border p-4 shadow-sm text-left transition ${filtroBaixo ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-200'}`}>
            <p className={`text-xs font-medium mb-1 ${filtroBaixo ? 'text-orange-100' : 'text-slate-500'}`}>Estoque baixo</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${filtroBaixo ? 'text-white' : 'text-orange-600'}`}>{baixoEstoque}</p>
              {baixoEstoque > 0 && <AlertTriangle size={16} className={filtroBaixo ? 'text-orange-100' : 'text-orange-500'} />}
            </div>
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busca} onChange={e => debouncedBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm" />
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <Package size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{filtroBaixo ? 'Nenhum produto com estoque baixo' : 'Nenhum produto encontrado'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {produtosFiltrados.map(p => {
              const qtd = p.estoque?.quantidade ?? 0;
              const baixo = p.estoqueMinimo > 0 && qtd < p.estoqueMinimo;
              const editando = editandoId === p.id;

              return (
                <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${baixo ? 'border-orange-200' : 'border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: p.categoria.cor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{p.nome}</p>
                          <p className="text-xs text-slate-500">{p.categoria.nome}</p>
                        </div>
                        {!editando && (
                          <button onClick={() => iniciarEdicao(p)}
                            className="shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl active:bg-blue-100">
                            <Edit3 size={15} />
                          </button>
                        )}
                      </div>

                      {editando ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="number" value={novaQtd} onChange={e => setNovaQtd(e.target.value)}
                              placeholder="Qtd" step="0.1" min="0"
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <span className="text-sm text-slate-600 shrink-0">{p.unidade.abreviacao}</span>
                          </div>
                          <input type="text" value={motivoEdit} onChange={e => setMotivoEdit(e.target.value)}
                            placeholder="Motivo do ajuste (opcional)"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <div className="flex gap-2">
                            <button onClick={() => salvarEdicao(p.id)} disabled={salvando}
                              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
                              <Check size={14} /> Salvar
                            </button>
                            <button onClick={cancelarEdicao}
                              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-semibold">
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {baixo && <AlertTriangle size={14} className="text-orange-500" />}
                            <span className={`text-lg font-bold ${baixo ? 'text-orange-600' : 'text-slate-900'}`}>
                              {qtd.toFixed(1)}
                            </span>
                            <span className="text-sm text-slate-500">{p.unidade.abreviacao}</span>
                          </div>
                          {p.estoqueMinimo > 0 && (
                            <span className="text-xs text-slate-400">mín: {p.estoqueMinimo} {p.unidade.abreviacao}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
