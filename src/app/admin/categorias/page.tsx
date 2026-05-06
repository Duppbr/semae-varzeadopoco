'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Edit3, Trash2, Check, X, Tag } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

const emptyForm = { nome: '', cor: '#3b82f6' };

export default function AdminCategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [erro, setErro] = useState('');
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/categorias');
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) setCategorias(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.isLoggedIn) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      carregar();
    });
  }, []);

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const iniciarEditar = (c: Categoria) => {
    setEditandoId(c.id);
    setForm({ nome: c.nome, cor: c.cor || '#3b82f6' });
    setMostrando(true);
    setErro('');
  };

  const cancelar = () => {
    setEditandoId(null);
    setForm({ ...emptyForm });
    setMostrando(false);
    setErro('');
  };

  const salvar = async () => {
    if (!form.nome.trim()) { setErro('Nome e obrigatorio.'); return; }
    setSalvando(true);
    setErro('');
    try {
      const method = editandoId ? 'PUT' : 'POST';
      const url = editandoId ? `/api/admin/categorias/${editandoId}` : '/api/admin/categorias';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome.trim(), cor: form.cor }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErro(d.erro || 'Erro ao salvar.');
        setSalvando(false);
        return;
      }
      cancelar();
      await carregar();
    } catch {
      setErro('Erro de rede.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    await fetch(`/api/admin/categorias/${id}`, { method: 'DELETE' });
    setConfirmandoId(null);
    await carregar();
  };

  return (
    <AppShell
      title="Categorias"
      backHref="/admin"
      actions={
        !mostrando ? (
          <button
            onClick={() => { setMostrando(true); setEditandoId(null); setForm({ ...emptyForm }); }}
            className="flex items-center gap-1.5 bg-pink-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-pink-700"
          >
            <Plus size={16} /> Nova
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {mostrando && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800">
              {editandoId ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setField('nome', e.target.value)}
                placeholder="Ex: Graos, Laticinios, Hortifrutti..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cor</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.cor}
                  onChange={e => setField('cor', e.target.value)}
                  className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                />
                <div className="flex-1">
                  <div
                    className="h-10 rounded-xl border flex items-center px-3"
                    style={{ backgroundColor: form.cor + '20', borderColor: form.cor + '60' }}
                  >
                    <span className="text-sm font-semibold" style={{ color: form.cor }}>
                      {form.nome || 'Pre-visualizacao'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Clique no quadrado colorido para escolher a cor</p>
            </div>
            {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={cancelar}
                className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm active:bg-slate-100">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-semibold text-sm active:bg-pink-700 disabled:opacity-60">
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <Tag size={32} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Nenhuma categoria cadastrada</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Nova" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categorias.map(c => (
              <div key={c.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: c.cor + '25' }}
                >
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.cor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm">{c.nome}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium font-mono"
                      style={{ backgroundColor: c.cor + '20', color: c.cor }}
                    >
                      {c.cor}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => iniciarEditar(c)}
                    className="p-2 border border-slate-200 text-slate-600 rounded-xl active:bg-slate-100">
                    <Edit3 size={15} />
                  </button>
                  {confirmandoId === c.id ? (
                    <>
                      <button onClick={() => excluir(c.id)}
                        className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl active:bg-red-700 flex items-center gap-1">
                        <Check size={12} /> Confirmar
                      </button>
                      <button onClick={() => setConfirmandoId(null)}
                        className="p-2 border border-slate-200 text-slate-600 rounded-xl active:bg-slate-100">
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmandoId(c.id)}
                      className="p-2 border border-red-200 text-red-500 rounded-xl active:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
