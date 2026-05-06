'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Edit3, Power, Check, X, Search } from 'lucide-react';

interface Produto { id: string; nome: string; estoqueMinimo: number; ativo: boolean; categoria: { id: string; nome: string; cor: string }; unidade: { id: string; nome: string; abreviacao: string }; estoque: { quantidade: number } | null }
interface Categoria { id: string; nome: string; cor: string }
interface Unidade { id: string; nome: string; abreviacao: string }

const emptyForm = { nome: '', categoriaId: '', unidadeId: '', estoqueMinimo: '0' };

export default function ProdutosAdminPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mostrando, setMostrando] = useState(false);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => {
    Promise.all([
      fetch('/api/admin/produtos').then(r => r.json()),
      fetch('/api/admin/categorias').then(r => r.json()),
      fetch('/api/admin/unidades').then(r => r.json()),
    ]).then(([p, c, u]) => { setProdutos(p); setCategorias(c); setUnidades(u); }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (r.status === 401) router.push('/login'); return r.json(); })
      .then(d => { if (d?.role !== 'admin') router.push('/dashboard'); });
    carregar();
  }, []);

  const salvar = async () => {
    if (!form.nome || !form.categoriaId || !form.unidadeId) { setErro('Nome, categoria e unidade são obrigatórios.'); return; }
    setSalvando(true); setErro('');
    const url = editando ? `/api/admin/produtos/${editando}` : '/api/admin/produtos';
    const res = await fetch(url, { method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, categoriaId: form.categoriaId, unidadeId: form.unidadeId, estoqueMinimo: parseFloat(form.estoqueMinimo) || 0 }) });
    if (!res.ok) { const d = await res.json(); setErro(d.erro || 'Erro.'); setSalvando(false); return; }
    setMostrando(false); setEditando(null); setForm(emptyForm); carregar(); setSalvando(false);
  };

  const toggleAtivo = async (p: Produto) => {
    await fetch(`/api/admin/produtos/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !p.ativo }) });
    carregar();
  };

  const iniciarEdicao = (p: Produto) => {
    setEditando(p.id); setForm({ nome: p.nome, categoriaId: p.categoria.id, unidadeId: p.unidade.id, estoqueMinimo: p.estoqueMinimo.toString() });
    setMostrando(true);
  };

  const produtosFiltrados = busca ? produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())) : produtos;

  return (
    <AppShell title="Produtos" backHref="/admin"
      actions={<button onClick={() => { setMostrando(true); setEditando(null); setForm(emptyForm); }}
        className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl"><Plus size={16} /> Novo</button>}>
      <div className="space-y-3">
        {mostrando && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800">{editando ? 'Editar produto' : 'Novo produto'}</h3>
            <input type="text" placeholder="Nome do produto" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.categoriaId} onChange={e => setForm(f => ({...f, categoriaId: e.target.value}))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Categoria...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select value={form.unidadeId} onChange={e => setForm(f => ({...f, unidadeId: e.target.value}))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Unidade de medida...</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.abreviacao})</option>)}
            </select>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Estoque mínimo</label>
              <input type="number" placeholder="0" value={form.estoqueMinimo} onChange={e => setForm(f => ({...f, estoqueMinimo: e.target.value}))} min="0" step="0.1"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <div className="flex gap-2">
              <button onClick={salvar} disabled={salvando}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60">
                <Check size={15} /> {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => { setMostrando(false); setEditando(null); setErro(''); }}
                className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold">
                <X size={15} /> Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>

        {loading ? [1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />) :
          produtosFiltrados.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${!p.ativo ? 'opacity-60 border-slate-100' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.categoria.cor }} />
                    <p className="font-semibold text-slate-900 truncate">{p.nome}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{p.categoria.nome}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{p.unidade.abreviacao}</span>
                    {p.estoque && <span className="text-xs font-medium text-blue-600">Estoque: {p.estoque.quantidade.toFixed(1)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => iniciarEdicao(p)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Edit3 size={15} /></button>
                  <button onClick={() => toggleAtivo(p)} className={`p-2 rounded-lg ${p.ativo ? 'text-slate-400 hover:text-orange-500' : 'text-orange-400 hover:text-green-600'}`}>
                    <Power size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </AppShell>
  );
}
