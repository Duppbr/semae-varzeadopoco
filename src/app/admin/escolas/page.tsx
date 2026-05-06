'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Edit3, Trash2, Check, X, School } from 'lucide-react';

interface Escola {
  id: string;
  nome: string;
  tipo: string;
  endereco?: string | null;
  telefone?: string | null;
  ativo: boolean;
}

const TIPO_OPTIONS = [
  { value: 'ESCOLA', label: 'Escola' },
  { value: 'CRECHE', label: 'Creche' },
];

const emptyForm = { nome: '', tipo: 'ESCOLA', endereco: '', telefone: '', ativo: true };

export default function AdminEscolasPage() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [erro, setErro] = useState('');
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/escolas');
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) setEscolas(await res.json());
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

  const iniciarEditar = (e: Escola) => {
    setEditandoId(e.id);
    setForm({ nome: e.nome, tipo: e.tipo, endereco: e.endereco || '', telefone: e.telefone || '', ativo: e.ativo });
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
      const url = editandoId ? `/api/admin/escolas/${editandoId}` : '/api/admin/escolas';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          tipo: form.tipo,
          endereco: form.endereco || undefined,
          telefone: form.telefone || undefined,
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

  const toggleAtivo = async (e: Escola) => {
    await fetch(`/api/admin/escolas/${e.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !e.ativo }),
    });
    await carregar();
  };

  const excluir = async (id: string) => {
    await fetch(`/api/admin/escolas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: false }),
    });
    setConfirmandoId(null);
    await carregar();
  };

  return (
    <AppShell
      title="Escolas / Creches"
      backHref="/admin"
      actions={
        !mostrando ? (
          <button
            onClick={() => { setMostrando(true); setEditandoId(null); setForm({ ...emptyForm }); }}
            className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-green-700"
          >
            <Plus size={16} /> Nova
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Formulário */}
        {mostrando && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800">
              {editandoId ? 'Editar Escola' : 'Nova Escola'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setField('nome', e.target.value)}
                placeholder="Nome da escola ou creche"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo *</label>
              <select
                value={form.tipo}
                onChange={e => setField('tipo', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
              >
                {TIPO_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={e => setField('endereco', e.target.value)}
                placeholder="Endereço (opcional)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={e => setField('telefone', e.target.value)}
                placeholder="Telefone (opcional)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
              />
            </div>
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
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm active:bg-green-700 disabled:opacity-60"
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
        ) : escolas.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <School size={32} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Nenhuma escola cadastrada</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Nova" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {escolas.map(e => (
              <div
                key={e.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${e.ativo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${e.tipo === 'CRECHE' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                    <School size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{e.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.tipo === 'CRECHE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {e.tipo === 'CRECHE' ? 'Creche' : 'Escola'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {e.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    {e.endereco && <p className="text-xs text-slate-500 mt-0.5 truncate">{e.endereco}</p>}
                    {e.telefone && <p className="text-xs text-slate-500">{e.telefone}</p>}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => iniciarEditar(e)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl active:bg-slate-100"
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(e)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl ${
                      e.ativo
                        ? 'bg-red-50 text-red-600 active:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100'
                    }`}
                  >
                    {e.ativo ? <><X size={13} /> Desativar</> : <><Check size={13} /> Ativar</>}
                  </button>
                  {confirmandoId === e.id ? (
                    <button
                      onClick={() => excluir(e.id)}
                      className="flex items-center justify-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:bg-red-700"
                    >
                      <Trash2 size={13} /> Confirmar
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmandoId(e.id)}
                      className="flex items-center justify-center gap-1 border border-red-200 text-red-500 text-xs font-semibold px-3 py-2 rounded-xl active:bg-red-50"
                    >
                      <Trash2 size={13} />
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
