'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

type Opcao = {
  id: number;
  categoria: string;
  valor: string;
};

export default function AdminOpcoesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('marca');
  const [novoValor, setNovoValor] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoValor, setEditandoValor] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    carregarOpcoes();
  }, [user, userLoading, categoriaFiltro]);

  const carregarOpcoes = async () => {
    setLoading(true);
    const url = categoriaFiltro
      ? `/api/admin/opcoes?categoria=${categoriaFiltro}`
      : '/api/admin/opcoes';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setOpcoes(data);
    }
    setLoading(false);
  };

  const adicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoValor.trim()) return;
    const res = await fetch('/api/admin/opcoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria: novaCategoria, valor: novoValor.trim() }),
    });
    if (res.ok) {
      setNovoValor('');
      carregarOpcoes();
    } else {
      alert('Erro ao adicionar (pode já existir).');
    }
  };

  const salvarEdicao = async (id: number) => {
    if (!editandoValor.trim()) return;
    const res = await fetch('/api/admin/opcoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, valor: editandoValor.trim() }),
    });
    if (res.ok) {
      setEditandoId(null);
      setEditandoValor('');
      carregarOpcoes();
    } else {
      alert('Erro ao editar.');
    }
  };

  const excluir = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta opção?')) return;
    const res = await fetch('/api/admin/opcoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      carregarOpcoes();
    } else {
      alert('Erro ao excluir.');
    }
  };

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">⚙️ Gerenciar Opções (Marcas, Amperagens, Tipos, Garantias, etc.)</h1>

      {/* Formulário de adição */}
      <div className="bg-white p-4 rounded-xl shadow mb-8">
        <form onSubmit={adicionar} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm mb-1">Categoria</label>
            <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="border p-2 rounded">
              <option value="marca">Marca</option>
              <option value="amperagem">Amperagem</option>
              <option value="tipo">Tipo</option>
              <option value="garantia">Garantia</option>
              <option value="marca_veiculo">Marca de Veículo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Valor</label>
            <input
              type="text"
              value={novoValor}
              onChange={e => setNovoValor(e.target.value)}
              placeholder="Ex: Moura, 60ah, AGM..."
              className="border p-2 rounded"
              required
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            ➕ Adicionar
          </button>
        </form>
      </div>

      {/* Filtro por categoria */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="text-sm">Filtrar por categoria:</label>
        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)} className="border p-2 rounded">
          <option value="">Todas</option>
          <option value="marca">Marca</option>
          <option value="amperagem">Amperagem</option>
          <option value="tipo">Tipo</option>
          <option value="garantia">Garantia</option>
          <option value="marca_veiculo">Marca de Veículo</option>
        </select>
      </div>

      {/* Tabela de opções */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Categoria</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody>
            {opcoes.map(op => (
              <tr key={op.id}>
                <td className="px-4 py-2 text-sm">{op.categoria}</td>
                <td className="px-4 py-2 text-sm">
                  {editandoId === op.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editandoValor}
                        onChange={e => setEditandoValor(e.target.value)}
                        className="border p-1 rounded text-sm"
                      />
                      <button onClick={() => salvarEdicao(op.id)} className="text-green-600 hover:underline">Salvar</button>
                      <button onClick={() => setEditandoId(null)} className="text-gray-500 hover:underline">Cancelar</button>
                    </div>
                  ) : (
                    op.valor
                  )}
                </td>
                <td className="px-4 py-2 text-sm space-x-2">
                  {editandoId !== op.id && (
                    <>
                      <button
                        onClick={() => { setEditandoId(op.id); setEditandoValor(op.valor); }}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button onClick={() => excluir(op.id)} className="text-red-600 hover:underline">Excluir</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}