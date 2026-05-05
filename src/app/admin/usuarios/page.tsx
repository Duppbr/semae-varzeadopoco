'use client';

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { LockKeyhole, Power, RotateCcw, Search, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';

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

const roleStyle: Record<string, string> = {
  admin: 'bg-red-50 text-red-700',
  supervisor: 'bg-amber-50 text-amber-700',
  funcionario: 'bg-sky-50 text-sky-700',
};

// MUDANÇA: modal de confirmação de exclusão.
// Exige que o admin digite o identificador do usuário para confirmar.
// Previne exclusões acidentais, especialmente em mobile onde o toque é impreciso.
function ModalConfirmarExclusao({
  usuario,
  onConfirmar,
  onCancelar,
}: {
  usuario: Usuario;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState('');
  const correto = texto === usuario.identificador;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Excluir usuário</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Esta ação é irreversível. O usuário <strong>{usuario.nome}</strong> será removido permanentemente.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-700 mb-1.5">
            Para confirmar, digite o identificador: <span className="font-mono font-bold text-slate-900">{usuario.identificador}</span>
          </label>
          <input
            type="text"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder={`Digite "${usuario.identificador}"`}
            className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="flex-1 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={!correto}
            className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// MUDANÇA: card de usuário para mobile — substitui linha de tabela.
// Agrupa nome, loja, role e status visualmente sem scroll horizontal.
function UsuarioCard({
  u,
  podeFazerAcao,
  podeExcluir,
  onToggleAtivo,
  onResetar,
  onExcluir,
}: {
  u: Usuario;
  podeFazerAcao: (u: Usuario) => boolean;
  podeExcluir: (u: Usuario) => boolean;
  onToggleAtivo: (u: Usuario) => void;
  onResetar: (u: Usuario) => void;
  onExcluir: (u: Usuario) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      {/* Linha principal: nome + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">{u.nome}</span>
            {u.protegido && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                <LockKeyhole size={11} />
                Dono
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{u.identificador}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleStyle[u.role] ?? 'bg-slate-100 text-slate-700'}`}>
            {roleLabel[u.role] ?? u.role}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
            {u.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-1.5">{u.loja.nome}</p>

      {/* Ações */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => onResetar(u)}
          disabled={!podeFazerAcao(u)}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={13} />
          Resetar senha
        </button>
        <button
          onClick={() => onToggleAtivo(u)}
          disabled={u.protegido && u.ativo}
          className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition ${
            u.ativo ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <Power size={13} />
          {u.ativo ? 'Desativar' : 'Ativar'}
        </button>
        {/* MUDANÇA: botão excluir — só aparece para usuários não-protegidos */}
        {podeExcluir(u) && (
          <button
            onClick={() => onExcluir(u)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 size={13} />
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminUsuarios() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('');
  const [msg, setMsg] = useState('');

  // MUDANÇA: estado para o modal de confirmação de exclusão
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | null>(null);

  const [form, setForm] = useState({
    identificador: '', senha: '', nome: '', role: 'funcionario', lojaId: 1,
  });

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/usuarios');
    if (res.ok) setUsuarios(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    carregarUsuarios();
  }, [user, userLoading, router, carregarUsuarios]);

  const resumo = useMemo(() => ({
    total: usuarios.length,
    ativos: usuarios.filter(u => u.ativo).length,
    admins: usuarios.filter(u => u.role === 'admin' && u.ativo).length,
    protegidos: usuarios.filter(u => u.protegido).length,
  }), [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter(u => {
      if (filtroRole && u.role !== filtroRole) return false;
      if (!termo) return true;
      return u.nome.toLowerCase().includes(termo) || u.identificador.toLowerCase().includes(termo) || u.loja.nome.toLowerCase().includes(termo);
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

  const toggleAtivo = async (u: Usuario) => {
    const res = await fetch('/api/admin/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, ativo: !u.ativo }),
    });
    if (!res.ok) { const err = await res.json(); alert(err.erro || 'Erro'); return; }
    await carregarUsuarios();
  };

  const resetarSenha = async (u: Usuario) => {
    const novaSenha = prompt(`Nova senha para ${u.nome} (mínimo 4 caracteres):`);
    if (!novaSenha || novaSenha.length < 4) return;
    const res = await fetch('/api/admin/usuarios/reset-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, novaSenha }),
    });
    if (!res.ok) { const err = await res.json(); alert(err.erro || 'Erro ao alterar senha'); return; }
    alert('Senha alterada com sucesso.');
  };

  // MUDANÇA: excluir usuário com verificação de segurança
  const confirmarExclusao = async () => {
    if (!usuarioParaExcluir) return;
    const res = await fetch('/api/admin/usuarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: usuarioParaExcluir.id }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.erro || 'Erro ao excluir usuário');
    }
    setUsuarioParaExcluir(null);
    await carregarUsuarios();
  };

  const podeFazerAcao = (u: Usuario) => !u.protegido || u.id === user?.id;
  // Usuários protegidos (donos) não podem ser excluídos por segurança
  const podeExcluir = (u: Usuario) => !u.protegido;

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-950">Usuários</h1>
          <p className="text-sm text-slate-500">Controle acessos, funções e o usuário dono protegido do sistema.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Novo usuário
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResumoCard titulo="Usuários" valor={resumo.total} icon={Users} />
        <ResumoCard titulo="Ativos" valor={resumo.ativos} icon={Power} />
        <ResumoCard titulo="Admins ativos" valor={resumo.admins} icon={ShieldCheck} />
        <ResumoCard titulo="Protegidos" valor={resumo.protegidos} icon={LockKeyhole} />
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, ID ou loja"
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filtroRole}
          onChange={e => setFiltroRole(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todas as funções</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="funcionario">Funcionário</option>
        </select>
      </div>

      {/* MUDANÇA: cards no mobile */}
      <div className="md:hidden space-y-3">
        {usuariosFiltrados.map(u => (
          <UsuarioCard
            key={u.id}
            u={u}
            podeFazerAcao={podeFazerAcao}
            podeExcluir={podeExcluir}
            onToggleAtivo={toggleAtivo}
            onResetar={resetarSenha}
            onExcluir={setUsuarioParaExcluir}
          />
        ))}
        {usuariosFiltrados.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>

      {/* MUDANÇA: tabela só no desktop + coluna Excluir adicionada */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Usuário</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Loja</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Função</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuariosFiltrados.map(u => (
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyle[u.role] ?? 'bg-slate-100 text-slate-700'}`}>
                    {roleLabel[u.role] || u.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => resetarSenha(u)}
                      disabled={!podeFazerAcao(u)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                    >
                      <RotateCcw size={13} />
                      Senha
                    </button>
                    <button
                      onClick={() => toggleAtivo(u)}
                      disabled={u.protegido && u.ativo}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                        u.ativo ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power size={13} />
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    {/* MUDANÇA: botão excluir na tabela desktop */}
                    {podeExcluir(u) && (
                      <button
                        onClick={() => setUsuarioParaExcluir(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal criar usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Novo usuário</h2>
                <p className="text-sm text-slate-500">Crie acessos comuns.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <FormInput label="ID de login" value={form.identificador} onChange={v => setForm({...form, identificador: v})} required />
              <FormInput label="Senha" type="password" value={form.senha} onChange={v => setForm({...form, senha: v})} required />
              <FormInput label="Nome completo" value={form.nome} onChange={v => setForm({...form, nome: v})} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loja</label>
                <select value={form.lojaId} onChange={e => setForm({...form, lojaId: parseInt(e.target.value)})} className="w-full border border-slate-300 p-2 rounded-lg text-sm">
                  <option value={1}>Matriz Artêmia</option>
                  <option value={2}>Filial Iguatemi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm">
                  <option value="funcionario">Funcionário</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {msg && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{msg}</div>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MUDANÇA: modal de confirmação de exclusão com campo de segurança */}
      {usuarioParaExcluir && (
        <ModalConfirmarExclusao
          usuario={usuarioParaExcluir}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setUsuarioParaExcluir(null)}
        />
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

function FormInput({ label, type = 'text', value, onChange, required }: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    </div>
  );
}
