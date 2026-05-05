'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';

type Opcao = {
  id: number;
  categoria: string;
  valor: string;
};

const categoriaLabels: Record<string, string> = {
  marca: 'Marca',
  amperagem: 'Amperagem',
  tipo: 'Tipo',
  garantia: 'Garantia',
  marca_veiculo: 'Marca de Veículo',
};

const categoriaOrdem = ['marca', 'amperagem', 'tipo', 'garantia', 'marca_veiculo'];

// MUDANÇA: em vez de uma tabela plana de 3 colunas, as opções são exibidas
// agrupadas por categoria em seções com chips. Isso elimina o scroll horizontal
// e torna muito mais fácil encontrar e gerenciar valores no mobile.
function GrupoCategoria({
  categoria,
  opcoes,
  onEditar,
  onExcluir,
}: {
  categoria: string;
  opcoes: Opcao[];
  onEditar: (op: Opcao) => void;
  onExcluir: (id: number) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        {categoriaLabels[categoria] ?? categoria}
        <span className="ml-2 text-xs font-normal text-slate-400">{opcoes.length} ite{opcoes.length === 1 ? 'm' : 'ns'}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(op => (
          <div
            key={op.id}
            className="group flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
          >
            <span className="text-sm text-slate-800">{op.valor}</span>
            <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditar(op)}
                className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                aria-label="Editar"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => onExcluir(op.id)}
                className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                aria-label="Excluir"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {opcoes.length === 0 && (
          <p className="text-xs text-slate-400">Nenhum valor cadastrado.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminOpcoesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('marca');
  const [novoValor, setNovoValor] = useState('');

  // MUDANÇA: edição agora via modal inline, não inline na tabela
  const [editando, setEditando] = useState<Opcao | null>(null);
  const [editandoValor, setEditandoValor] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    carregarOpcoes();
  }, [user, userLoading, categoriaFiltro]);

  const carregarOpcoes = async () => {
    setLoading(true);
    const url = categoriaFiltro ? `/api/admin/opcoes?categoria=${categoriaFiltro}` : '/api/admin/opcoes';
    const res = await fetch(url);
    if (res.ok) setOpcoes(await res.json());
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

  const iniciarEdicao = (op: Opcao) => {
    setEditando(op);
    setEditandoValor(op.valor);
  };

  const salvarEdicao = async () => {
    if (!editando || !editandoValor.trim()) return;
    const res = await fetch('/api/admin/opcoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editando.id, valor: editandoValor.trim() }),
    });
    if (res.ok) {
      setEditando(null);
      setEditandoValor('');
      carregarOpcoes();
    } else {
      alert('Erro ao editar.');
    }
  };

  const excluir = async (id: number) => {
    if (!confirm('Excluir esta opção?')) return;
    const res = await fetch('/api/admin/opcoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) carregarOpcoes();
    else alert('Erro ao excluir.');
  };

  // Agrupa por categoria para a visão de chips
  const agrupado = categoriaOrdem.reduce<Record<string, Opcao[]>>((acc, cat) => {
    const filtradas = opcoes.filter(o => o.categoria === cat);
    if (!categoriaFiltro || categoriaFiltro === cat) {
      acc[cat] = filtradas;
    }
    return acc;
  }, {});

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900">Opções do sistema</h1>
      <p className="text-sm text-slate-500 -mt-3">Marcas, amperagens, tipos, garantias e marcas de veículos usados nos selects do sistema.</p>

      {/* Formulário de adição */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Plus size={16} className="text-green-600" />
          Adicionar nova opção
        </h2>
        <form onSubmit={adicionar} className="flex flex-col sm:flex-row gap-2">
          <select
            value={novaCategoria}
            onChange={e => setNovaCategoria(e.target.value)}
            className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white flex-shrink-0"
          >
            <option value="marca">Marca</option>
            <option value="amperagem">Amperagem</option>
            <option value="tipo">Tipo</option>
            <option value="garantia">Garantia</option>
            <option value="marca_veiculo">Marca de Veículo</option>
          </select>
          <input
            type="text"
            value={novoValor}
            onChange={e => setNovoValor(e.target.value)}
            placeholder="Ex: Moura, 60ah, AGM..."
            className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex-shrink-0"
          >
            Adicionar
          </button>
        </form>
      </div>

      {/* Filtro por categoria */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoriaFiltro('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${!categoriaFiltro ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
        >
          Todas
        </button>
        {categoriaOrdem.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaFiltro(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${categoriaFiltro === cat ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            {categoriaLabels[cat]}
          </button>
        ))}
      </div>

      {/* MUDANÇA: grupos de chips por categoria — substitui tabela de 3 colunas.
          Cada categoria vira uma seção com chips clicáveis para editar/excluir.
          Sem scroll horizontal, muito mais legível no mobile. */}
      <div className="space-y-3">
        {Object.entries(agrupado).map(([cat, itens]) => (
          <GrupoCategoria
            key={cat}
            categoria={cat}
            opcoes={itens}
            onEditar={iniciarEdicao}
            onExcluir={excluir}
          />
        ))}
      </div>

      {/* MUDANÇA: modal de edição do valor — em vez de input inline na tabela */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">
                Editar — <span className="text-slate-500 font-normal">{categoriaLabels[editando.categoria]}</span>
              </h2>
              <button onClick={() => setEditando(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              value={editandoValor}
              onChange={e => setEditandoValor(e.target.value)}
              className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') setEditando(null); }}
            />
            <div className="flex gap-2">
              <button onClick={() => setEditando(null)} className="flex-1 border border-slate-300 px-4 py-2 rounded-xl text-sm">Cancelar</button>
              <button onClick={salvarEdicao} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
                <Check size={15} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
