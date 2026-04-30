// src/app/admin/usuarios/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

type Usuario = {
  id: number;
  identificador: string;
  nome: string;
  role: string;
  ativo: boolean;
  lojaId: number;
  loja: { nome: string };
};

export default function AdminUsuarios() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    identificador: '',
    senha: '',
    nome: '',
    role: 'funcionario',
    lojaId: 1,
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    carregarUsuarios();
  }, [user, userLoading, router]);

  const carregarUsuarios = async () => {
    const res = await fetch('/api/admin/usuarios');
    const data = await res.json();
    setUsuarios(data);
    setLoading(false);
  };

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
      carregarUsuarios();
      setForm({ identificador: '', senha: '', nome: '', role: 'funcionario', lojaId: 1 });
    } else {
      const err = await res.json();
      setMsg(err.erro || 'Erro ao criar usuário');
    }
  };

  const toggleAtivo = async (id: number, ativo: boolean) => {
    await fetch('/api/admin/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    carregarUsuarios();
  };

  const resetarSenha = async (id: number) => {
    const novaSenha = prompt('Digite a nova senha (mínimo 4 caracteres):');
    if (!novaSenha || novaSenha.length < 4) return;
    await fetch('/api/admin/usuarios/reset-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, novaSenha }),
    });
    alert('Senha alterada!');
    carregarUsuarios();
  };

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👥 Gerenciar Usuários</h1>
        <button onClick={() => setShowModal(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Novo Funcionário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identificador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 text-sm">{u.id}</td>
                <td className="px-6 py-4 text-sm font-mono">{u.identificador}</td>
                <td className="px-6 py-4 text-sm">{u.nome}</td>
                <td className="px-6 py-4 text-sm">{u.loja.nome}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    u.role === 'admin' ? 'bg-red-100 text-red-800' : 
                    u.role === 'supervisor' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {u.role === 'admin' ? 'Admin' : u.role === 'supervisor' ? 'Supervisor' : 'Funcionário'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    u.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => resetarSenha(u.id)} className="text-blue-600 hover:underline">Resetar senha</button>
                  <button onClick={() => toggleAtivo(u.id, u.ativo)} className="text-red-600 hover:underline">
                    {u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal criar usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 max-w-md">
            <h2 className="text-xl font-bold mb-4">Novo Funcionário</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="block text-sm font-medium">ID (login)</label>
                <input
                  type="text"
                  value={form.identificador}
                  onChange={e => setForm({...form, identificador: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium">Senha</label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={e => setForm({...form, senha: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium">Nome completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({...form, nome: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium">Loja</label>
                <select
                  value={form.lojaId}
                  onChange={e => setForm({...form, lojaId: parseInt(e.target.value)})}
                  className="w-full border p-2 rounded"
                >
                  <option value={1}>Matriz Artêmia</option>
                  <option value={2}>Filial Iguatemi</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium">Função</label>
                <select
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full border p-2 rounded"
                >
                  <option value="funcionario">Funcionário (só vê preços)</option>
                  <option value="supervisor">Supervisor (vê preços + estoque)</option>
                  <option value="admin">Administrador (acesso total)</option>
                </select>
              </div>
              {msg && <div className="text-red-600 text-sm mb-3">{msg}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}