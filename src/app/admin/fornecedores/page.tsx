'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Edit3, Trash2, Check, X, Truck } from 'lucide-react';

interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  contato?: string | null;
  observacao?: string | null;
  ativo: boolean;
}

const emptyForm = { nome: '', cnpj: '', telefone: '', email: '', endereco: '', contato: '', observacao: '', ativo: true };

const inputCls = 'w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900';

export default function AdminFornecedoresPage() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [erro, setErro] = useState('');
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/fornecedores');
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) setFornecedores(await res.json());
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

  const iniciarEditar = (f: Fornecedor) => {
    setEditandoId(f.id);
    setForm({
      nome: f.nome,
      cnpj: f.cnpj || '',
      telefone: f.telefone || '',
      email: f.email || '',
      endereco: f.endereco || '',
      contato: f.contato || '',
      observacao: f.observacao || '',
      ativo: f.ativo,
    });
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
    if (!form.nome.trim()) { setErro('O nome da empresa é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      const method = editandoId ? 'PUT' : 'POST';
      const url = editandoId ? `/api/admin/fornecedores/${editandoId}` : '/api/admin/fornecedores';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          cnpj: form.cnpj,
          telefone: form.telefone,
          email: form.email,
          endereco: form.endereco,
          contato: form.contato,
          observacao: form.observacao,
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

  const toggleAtivo = async (f: Fornecedor) => {
    await fetch(`/api/admin/fornecedores/${f.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !f.ativo }),
    });
    await carregar();
  };

  const desativar = async (id: string) => {
    await fetch(`/api/admin/fornecedores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: false }),
    });
    setConfirmandoId(null);
    await carregar();
  };

  return (
    <AppShell
      title="Fornecedores"
      backHref="/admin"
      actions={
        !mostrando ? (
          <button
            onClick={() => { setMostrando(true); setEditandoId(null); setForm({ ...emptyForm }); }}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-indigo-700"
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
              {editandoId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h3>
            <p className="text-xs text-slate-500">
              Só o nome da empresa é obrigatório. O que ficar em branco não aparece no pedido.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da empresa *</label>
              <input type="text" value={form.nome} onChange={e => setField('nome', e.target.value)}
                placeholder="Razão social ou nome fantasia" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CNPJ</label>
              <input type="text" value={form.cnpj} onChange={e => setField('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pessoa de contato</label>
              <input type="text" value={form.contato} onChange={e => setField('contato', e.target.value)}
                placeholder="Com quem falar na empresa" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
              <input type="tel" value={form.telefone} onChange={e => setField('telefone', e.target.value)}
                placeholder="(00) 00000-0000" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)}
                placeholder="contato@empresa.com.br" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
              <input type="text" value={form.endereco} onChange={e => setField('endereco', e.target.value)}
                placeholder="Endereço da empresa" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Observação</label>
              <textarea value={form.observacao} onChange={e => setField('observacao', e.target.value)}
                placeholder="Prazo de entrega, condições de pagamento, etc." rows={2}
                className={`${inputCls} resize-none`} />
            </div>
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={cancelar}
                className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm active:bg-slate-100">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm active:bg-indigo-700 disabled:opacity-60">
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
        ) : fornecedores.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <Truck size={32} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Nenhum fornecedor cadastrado</p>
            <p className="text-sm text-slate-500 mt-1">Cadastre para poder emitir pedidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fornecedores.map(f => (
              <div key={f.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${f.ativo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                    <Truck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{f.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {f.cnpj && <p className="text-xs text-slate-500 mt-0.5">CNPJ: {f.cnpj}</p>}
                    {f.contato && <p className="text-xs text-slate-500">Contato: {f.contato}</p>}
                    {f.telefone && <p className="text-xs text-slate-500">{f.telefone}</p>}
                    {f.email && <p className="text-xs text-slate-500 truncate">{f.email}</p>}
                    {f.endereco && <p className="text-xs text-slate-500 truncate">{f.endereco}</p>}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => iniciarEditar(f)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl active:bg-slate-100">
                    <Edit3 size={13} /> Editar
                  </button>
                  <button onClick={() => toggleAtivo(f)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl ${
                      f.ativo ? 'bg-red-50 text-red-600 active:bg-red-100' : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100'
                    }`}>
                    {f.ativo ? <><X size={13} /> Desativar</> : <><Check size={13} /> Ativar</>}
                  </button>
                  {confirmandoId === f.id ? (
                    <button onClick={() => desativar(f.id)}
                      className="flex items-center justify-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:bg-red-700">
                      <Trash2 size={13} /> Confirmar
                    </button>
                  ) : (
                    <button onClick={() => setConfirmandoId(f.id)}
                      className="flex items-center justify-center gap-1 border border-red-200 text-red-500 text-xs font-semibold px-3 py-2 rounded-xl active:bg-red-50">
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
