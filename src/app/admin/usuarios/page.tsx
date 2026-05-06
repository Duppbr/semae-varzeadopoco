'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Edit3, Check, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  identificador: string;
  role: string;
  ativo: boolean;
  protegido: boolean;
}

const ROLE_OPTIONS = [
  { value: 'funcionario', label: 'Funcionario' },
  { value: 'admin', label: 'Administrador' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  funcionario: 'bg-blue-100 text-blue-700',
};

const emptyForm = { nome: '', identificador: '', senha: '', role: 'funcionario', ativo: true };

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/usuarios');
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) setUsuarios(await res.json());
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

  const iniciarEditar = (u: Usuario) => {
    setEditandoId(u.id);
    setForm({ nome: u.nome, identificador: u.identificador, senha: '', role: u.role, ativo: u.ativo });
    setMostrando(true);
    setErro('');
  };

  const cancelar = () => {
    setEditandoId(null);
    setForm({ ...emptyForm });
    setMostrando(false);
    setErro('');
    setMostrarSenha(false);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { setErro('Nome e obrigatorio.'); return; }
    if (!form.identificador.trim()) { setErro('Identificador e obrigatorio.'); return; }
    if (!editandoId && !form.senha) { setErro('Senha e obrigatoria para novo usuario.'); return; }
    setSalvando(true);
    setErro('');
    try {
      const method = editandoId ? 'PUT' : 'POST';
      const url = editandoId ? `/api/admin/usuarios/${editandoId}` : '/api/admin/usuarios';
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        identificador: form.identificador.trim(),
        role: form.role,
        ativo: form.ativo,
      };
      if (!editandoId) body.senha = form.senha;
      else if (form.senha) body.senha = form.senha;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const toggleAtivo = async (u: Usuario) => {
    if (u.protegido) return;
    await fetch(`/api/admin/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    });
    await carregar();
  };

  return (
    <AppShell
      title="Usuarios"
      backHref="/admin"
      actions={
        !mostrando ? (
          <button
            onClick={() => { setMostrando(true); setEditandoId(null); setForm({ ...emptyForm }); }}
            className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-red-700"
          >
            <Plus size={16} /> Novo
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {mostrando && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800">
              {editandoId ? 'Editar Usuario' : 'Novo Usuario'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome *</label>
              <input type="text" value={form.nome} onChange={e => setField('nome', e.target.value)}
                placeholder="Nome completo"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Identificador (login) *</label>
              <input type="text" value={form.identificador} onChange={e => setField('identificador', e.target.value)}
                placeholder="ID de login" autoCapitalize="none" autoCorrect="off"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {editandoId ? 'Nova Senha (opcional)' : 'Senha *'}
              </label>
              <div className="relative">
                <input type={mostrarSenha ? 'text' : 'password'} value={form.senha}
                  onChange={e => setField('senha', e.target.value)}
                  placeholder={editandoId ? 'Deixe vazio para manter' : 'Senha'}
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900" />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Funcao</label>
              <select value={form.role} onChange={e => setField('role', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900">
                {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {editandoId && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Status:</label>
                <button type="button" onClick={() => setField('ativo', !form.ativo)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
                    form.ativo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                  {form.ativo ? <><Check size={14} /> Ativo</> : <><X size={14} /> Inativo</>}
                </button>
              </div>
            )}
            {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={cancelar}
                className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm active:bg-slate-100">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold text-sm active:bg-red-700 disabled:opacity-60">
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <ShieldCheck size={32} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Nenhum usuario cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map(u => (
              <div key={u.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${u.ativo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${u.protegido ? 'bg-amber-50' : 'bg-slate-100'}`}>
                    <ShieldCheck size={18} className={u.protegido ? 'text-amber-600' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{u.nome}</p>
                      {u.protegido && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Protegido
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_OPTIONS.find(o => o.value === u.role)?.label || u.role}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{u.identificador}</p>
                  </div>
                </div>
                {!u.protegido && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => iniciarEditar(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl active:bg-slate-100">
                      <Edit3 size={13} /> Editar
                    </button>
                    <button onClick={() => toggleAtivo(u)}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl ${
                        u.ativo ? 'bg-red-50 text-red-600 active:bg-red-100' : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100'
                      }`}>
                      {u.ativo ? <><X size={13} /> Desativar</> : <><Check size={13} /> Ativar</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
