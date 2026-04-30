'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

type Opcao = {
  id: number;
  categoria: string;
  valor: string;
};

export default function AdminAtalhosPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [atalhos, setAtalhos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [novaAmperagem, setNovaAmperagem] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [novaMarca, setNovaMarca] = useState('');

  // Estado para controle do drag
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    carregar();
    carregarOpcoes();
  }, [user, userLoading]);

  const carregar = async () => {
    const res = await fetch('/api/admin/atalhos');
    const data = await res.json();
    setAtalhos(data);
    setLoading(false);
  };

  const carregarOpcoes = async () => {
    const res = await fetch('/api/admin/opcoes');
    const data = await res.json();
    setOpcoes(data);
  };

  const amperagens = opcoes.filter((o) => o.categoria === 'amperagem').map((o) => o.valor);
  const tipos = opcoes.filter((o) => o.categoria === 'tipo').map((o) => o.valor);
  const marcas = opcoes.filter((o) => o.categoria === 'marca').map((o) => o.valor);

  const adicionar = async () => {
    if (!novaAmperagem) return;
    await fetch('/api/admin/atalhos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posicao: atalhos.length + 1,
        amperagem: novaAmperagem,
        tipo: novoTipo || null,
        marca: novaMarca || null,
        ativo: true,
      }),
    });
    setNovaAmperagem('');
    setNovoTipo('');
    setNovaMarca('');
    carregar();
  };

  const excluir = async (id: number) => {
    await fetch('/api/admin/atalhos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    carregar();
  };

  // Funções de drag & drop
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // necessário para permitir o drop
  };

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) return;

    // Reordena localmente
    const novaLista = [...atalhos];
    const [removido] = novaLista.splice(dragIndex, 1);
    novaLista.splice(index, 0, removido);

    // Atualiza a posição de cada item
    const atualizacoes = novaLista.map((item, i) => ({
      id: item.id,
      posicao: i + 1,
    }));

    // Envia todas as atualizações de posição
    await Promise.all(
      atualizacoes.map((up) =>
        fetch('/api/admin/atalhos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: up.id, posicao: up.posicao }),
        })
      )
    );

    setAtalhos(novaLista);
    setDragIndex(null);
  };

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">⚡ Gerenciar Atalhos da Consulta</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-2 items-end flex-wrap">
        <div>
          <label className="block text-xs mb-1">Amperagem *</label>
          <select
            value={novaAmperagem}
            onChange={(e) => setNovaAmperagem(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Selecione...</option>
            {amperagens.map((amp) => (
              <option key={amp} value={amp}>
                {amp}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Tipo (opcional)</label>
          <select
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Marca (opcional)</label>
          <select
            value={novaMarca}
            onChange={(e) => setNovaMarca(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={adicionar}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Adicionar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 w-10"></th>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Amperagem</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Marca</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {atalhos.map((a, index) => (
              <tr
                key={a.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`cursor-grab active:cursor-grabbing ${
                  dragIndex === index ? 'opacity-50' : ''
                }`}
              >
                <td className="px-2 py-2 text-gray-400 text-center">⠿</td>
                <td className="px-4 py-2">{a.posicao}</td>
                <td className="px-4 py-2">{a.amperagem}</td>
                <td className="px-4 py-2">{a.tipo || '—'}</td>
                <td className="px-4 py-2">{a.marca || '—'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => excluir(a.id)}
                    className="text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 p-4 pt-0">
          Arraste as linhas para reordenar (pelos ícones ⠿)
        </p>
      </div>
    </div>
  );
}