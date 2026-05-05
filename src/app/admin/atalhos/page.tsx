'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';

type Opcao = { id: number; categoria: string; valor: string };
type Atalho = { id: number; posicao: number; amperagem: string; tipo: string | null; marca: string | null; ativo: boolean };

// MUDANÇA: no mobile não existe drag & drop nativo funcional com toque.
// Esta função reordena usando botões ↑ ↓ dentro de cada card.
// A lógica de persistência (salvar posições) é a mesma do drag & drop.
async function salvarPosicoes(lista: Atalho[]) {
  await Promise.all(
    lista.map((item, i) =>
      fetch('/api/admin/atalhos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, posicao: i + 1 }),
      })
    )
  );
}

function AtalhoCardMobile({
  atalho,
  index,
  total,
  onMover,
  onExcluir,
}: {
  atalho: Atalho;
  index: number;
  total: number;
  onMover: (de: number, para: number) => void;
  onExcluir: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 px-4 py-3">
      {/* Posição */}
      <span className="text-slate-400 text-xs w-5 text-center font-mono">{atalho.posicao}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className="font-bold text-slate-900 text-sm">{atalho.amperagem.replace('ah', '')} Ah</span>
        {atalho.tipo && <span className="text-xs text-slate-500 ml-2">{atalho.tipo}</span>}
        {atalho.marca && <span className="text-xs text-slate-400 ml-1">· {atalho.marca}</span>}
      </div>

      {/* Controles de posição */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMover(index, index - 1)}
          disabled={index === 0}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded"
          aria-label="Mover para cima"
        >
          <ChevronUp size={15} />
        </button>
        <button
          onClick={() => onMover(index, index + 1)}
          disabled={index === total - 1}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded"
          aria-label="Mover para baixo"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      {/* Excluir */}
      <button
        onClick={() => onExcluir(atalho.id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
        aria-label="Excluir"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function AdminAtalhosPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [atalhos, setAtalhos] = useState<Atalho[]>([]);
  const [loading, setLoading] = useState(true);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [novaAmperagem, setNovaAmperagem] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [novaMarca, setNovaMarca] = useState('');

  // Desktop: drag & drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
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
    setOpcoes(await res.json());
  };

  const amperagens = opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor);
  const tipos = opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor);
  const marcas = opcoes.filter(o => o.categoria === 'marca').map(o => o.valor);

  const adicionar = async () => {
    if (!novaAmperagem) return;
    await fetch('/api/admin/atalhos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posicao: atalhos.length + 1, amperagem: novaAmperagem, tipo: novoTipo || null, marca: novaMarca || null, ativo: true }),
    });
    setNovaAmperagem(''); setNovoTipo(''); setNovaMarca('');
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

  // MUDANÇA: reordenação por botões no mobile (substituiu drag & drop que não funciona bem em touch)
  const moverItem = async (de: number, para: number) => {
    if (para < 0 || para >= atalhos.length) return;
    const novaLista = [...atalhos];
    const [removido] = novaLista.splice(de, 1);
    novaLista.splice(para, 0, removido);
    setAtalhos(novaLista);
    await salvarPosicoes(novaLista);
    carregar();
  };

  // Desktop: drag & drop (preservado)
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const novaLista = [...atalhos];
    const [removido] = novaLista.splice(dragIndex, 1);
    novaLista.splice(index, 0, removido);
    await salvarPosicoes(novaLista);
    setAtalhos(novaLista);
    setDragIndex(null);
  };

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900">Atalhos da consulta</h1>
      <p className="text-sm text-slate-500 -mt-3">Os atalhos aparecem na tela de consulta para acesso rápido às baterias mais comuns.</p>

      {/* Formulário de adição */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Plus size={16} className="text-green-600" />
          Novo atalho
        </h2>
        {/* MUDANÇA: grid 2 colunas no mobile em vez de flex-wrap que transbordava */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-slate-500 mb-1">Amperagem *</label>
            <select value={novaAmperagem} onChange={e => setNovaAmperagem(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white" required>
              <option value="">Selecione...</option>
              {amperagens.map(amp => <option key={amp} value={amp}>{amp}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tipo</label>
            <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
              <option value="">Todos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Marca</label>
            <select value={novaMarca} onChange={e => setNovaMarca(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
              <option value="">Todas</option>
              {marcas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-end">
            <button
              onClick={adicionar}
              disabled={!novaAmperagem}
              className="w-full md:w-auto bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              + Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* MUDANÇA: cards com botões ↑↓ no mobile */}
      <div className="md:hidden space-y-2">
        {atalhos.map((a, index) => (
          <AtalhoCardMobile
            key={a.id}
            atalho={a}
            index={index}
            total={atalhos.length}
            onMover={moverItem}
            onExcluir={excluir}
          />
        ))}
        {atalhos.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            Nenhum atalho cadastrado.
          </div>
        )}
        <p className="text-xs text-slate-400 text-center pt-1">Use os botões ↑↓ para reordenar</p>
      </div>

      {/* MUDANÇA: tabela com drag & drop preservada para desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 w-10 text-slate-400"><GripVertical size={16} className="mx-auto" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Amperagem</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {atalhos.map((a, index) => (
              <tr
                key={a.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`cursor-grab active:cursor-grabbing hover:bg-slate-50 ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-3 text-slate-400 text-center">
                  <GripVertical size={16} className="mx-auto" />
                </td>
                <td className="px-4 py-3 text-slate-500">{a.posicao}</td>
                <td className="px-4 py-3 font-medium">{a.amperagem}</td>
                <td className="px-4 py-3">{a.tipo || '—'}</td>
                <td className="px-4 py-3">{a.marca || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => excluir(a.id)} className="inline-flex items-center gap-1 text-red-600 hover:underline text-sm">
                    <Trash2 size={13} />
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 p-4 pt-2">Arraste as linhas pelo ícone para reordenar.</p>
      </div>
    </div>
  );
}
