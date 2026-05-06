'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Edit3, Check, X, Users } from 'lucide-react';

interface Responsavel {
  id: string;
  nome: string;
  cargo: string | null;
  ativo: boolean;
}

const emptyForm = { nome: '', cargo: '', ativo: true };

export default function AdminResponsaveisPage() {
  const router = useRouter();
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/responsaveis');
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) setResponsaveis(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.isLoggedIn) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      carregar();
    });
  }, []);

  const setField = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const iniciarEditar = (r: Responsavel) => {
    setEditandoId(r.id);
    setForm({ nome: r.nome, cargo: r.cargo || '', ativo: r.ativo });
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
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      const method = editandoId ? 'PUT' : 'POST';
      const url = editandoId
        ? `/api/admin/responsaveis/${editandoId}`
        : '/api/admin/responsaveis';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          cargo: form.cargo.trim() || undefined,
          ativo: form.ativo,
        }),
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

  const toggleAtivo = async (r: Responsavel) => {
    await fetch(`/api/admin/responsaveis/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !r.ativo }),
    });
    await carregar();
  };

  return (
    <AppShell
      title="Responsáveis"
      backHref="/admin"
      actions={
        !mostrando ? (
          <button
            onClick={() => { setMostrando(true); setEditandoId(null); setForm({ ...emptyForm }); }}
            className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-purple-700"
          >
            <Plus size={16} /> Novo
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Formulário */}
        {mostrando && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800">
              {editandoId ? 'Editar Responsável' : 'Novo Responsável'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setField('nome', e.target.value)}
                placeholder="Nome completo"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo</label>
              <input
                type="text"
                value={form.cargo}
                onChange={e => setField('cargo', e.target.value)}
                placeholder="Ex: Nutricionista, Coordenador..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
              />
            </div>
            {editandoId && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Status:</label>
                <button
                  type="button"
                  onClick={() => setField('ativo', !form.ativo)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    form.ativo
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {form.ativo ? <><Check size={14} /> Ativo</> : <><X size={14} /> Inativo</>}
                </button>
              </div>
            )}
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={cancelar}
                className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm active:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm active:bg-purple-700 disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : responsaveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <Users size={32} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Nenhum responsável cadastrado</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Novo" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {responsaveis.map(r => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${r.ativo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{r.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {r.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {r.cargo && <p className="text-xs text-slate-500 mt-0.5">{r.cargo}</p>}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => iniciarEditar(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl active:bg-slate-100"
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(r)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl ${
                      r.ativo
                        ? 'bg-red-50 text-red-600 active:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100'
                    }`}
                  >
                    {r.ativo ? <><X size={13} /> Desativar</> : <><Check size={13} /> Ativar</>}
                  </button>
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
