'use client';

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { LockKeyhole, Power, RotateCcw, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';

type Usuario = {
  id: number;
  identificador: string;
  nome: string;
  role: string;
  ativo: boolean;
  protegido: boolean;
  lojaId: number;
  loja: { nome: string };
};

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  funcionario: 'Funcionario',
};

export default function AdminUsuarios() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    identificador: '',
    senha: '',
    nome: '',
    role: 'funcionario',
    lojaId: 1,
  });

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/usuarios');
    if (res.ok) {
      setUsuarios(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    // Admin data is loaded after the auth check so the page never flashes private rows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarUsuarios();
  }, [user, userLoading, router, carregarUsuarios]);

  const resumo = useMemo(() => {
    return {
      total: usuarios.length,
      ativos: usuarios.filter(u => u.ativo).length,
      admins: usuarios.filter(u => u.role === 'admin' && u.ativo).length,
      protegidos: usuarios.filter(u => u.protegido).length,
    };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroRole && u.role !== filtroRole) return false;
      if (!termo) return true;
      return (
        u.nome.toLowerCase().includes(termo) ||
        u.identificador.toLowerCase().includes(termo) ||
        u.loja.nome.toLowerCase().includes(termo)
      );
    });
  }, [usuarios, busca, filtroRole]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ identificador: '', senha: '', nome: '', role: 'funcionario', lojaId: 1 });
      await carregarUsuarios();
      return;
    }

    const err = await res.json();
    setMsg(err.erro || 'Erro ao criar usuario');
  };

  const toggleAtivo = async (usuario: Usuario) => {
    const res = await fetch('/api/admin/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: usuario.id, ativo: !usuario.ativo }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.erro || 'Erro ao alterar usuario');
      return;
    }
    await carregarUsuarios();
  };

  const resetarSenha = async (usuario: Usuario) => {
    const novaSenha = prompt(`Nova senha para ${usuario.nome} (minimo 4 caracteres):`);
    if (!novaSenha || novaSenha.length < 4) return;

    const res = await fetch('/api/admin/usuarios/reset-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: usuario.id, novaSenha }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.erro || 'Erro ao alterar senha');
      return;
    }
    alert('Senha alterada.');
  };

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Usuarios</h1>
          <p className="text-sm text-slate-500">Controle acessos, funcoes e o usuario dono protegido do sistema.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Novo usuario
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResumoCard titulo="Usuarios" valor={resumo.total} icon={Users} />
        <ResumoCard titulo="Ativos" valor={resumo.ativos} icon={Power} />
        <ResumoCard titulo="Admins ativos" valor={resumo.admins} icon={ShieldCheck} />
        <ResumoCard titulo="Protegidos" valor={resumo.protegidos} icon={LockKeyhole} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, ID ou loja"
              className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroRole}
            onChange={e => setFiltroRole(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todas as funcoes</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="funcionario">Funcionario</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Usuario</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Loja</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Funcao</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuariosFiltrados.map((u) => {
              const podeResetar = !u.protegido || u.id === user?.id;
              const podeDesativar = !u.protegido;
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-950 flex items-center gap-2">
                      {u.nome}
                      {u.protegido && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <LockKeyhole size={12} />
                          Dono
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{u.identificador}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{u.loja.nome}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-red-50 text-red-700' :
                      u.role === 'supervisor' ? 'bg-amber-50 text-amber-700' :
                      'bg-sky-50 text-sky-700'
                    }`}>
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => resetarSenha(u)}
                        disabled={!podeResetar}
                        title={!podeResetar ? 'Usuario protegido: apenas o proprio dono altera esta senha' : 'Resetar senha'}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <RotateCcw size={14} />
                        Senha
                      </button>
                      <button
                        onClick={() => toggleAtivo(u)}
                        disabled={!podeDesativar && u.ativo}
                        title={!podeDesativar ? 'Usuario dono nao pode ser desativado' : undefined}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-45 ${
                          u.ativo
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Power size={14} />
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-1">Novo usuario</h2>
            <p className="text-sm text-slate-500 mb-4">Crie acessos comuns. O usuario dono protegido e criado pelo seed.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <FormInput label="ID de login" value={form.identificador} onChange={value => setForm({...form, identificador: value})} required />
              <FormInput label="Senha" type="password" value={form.senha} onChange={value => setForm({...form, senha: value})} required />
              <FormInput label="Nome completo" value={form.nome} onChange={value => setForm({...form, nome: value})} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loja</label>
                <select
                  value={form.lojaId}
                  onChange={e => setForm({...form, lojaId: parseInt(e.target.value)})}
                  className="w-full border border-slate-300 p-2 rounded-lg"
                >
                  <option value={1}>Matriz Artemia</option>
                  <option value={2}>Filial Iguatemi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Funcao</label>
                <select
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full border border-slate-300 p-2 rounded-lg"
                >
                  <option value="funcionario">Funcionario</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {msg && <div className="text-red-600 text-sm">{msg}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumoCard({ titulo, valor, icon: Icon }: { titulo: string; valor: number; icon: ElementType }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">{titulo}</p>
          <p className="text-2xl font-bold text-slate-950 mt-1">{valor}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-300 p-2 rounded-lg"
        required={required}
      />
    </div>
  );
}
