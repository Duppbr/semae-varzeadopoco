'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import ModalEditarProduto from '@/components/ModalEditarProduto';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';

type Produto = {
  id: number;
  sku: string;
  nome: string;
  marca: string;
  amperagem: string | null;
  tipo: string | null;
  cca: number | null;
  garantia: string | null;
};

type ProdutoLoja = {
  id: number;
  produtoId: number;
  lojaId: number;
  produto: Produto;
  precoCartao: number | null;
  precoCartao3x: number | null;
  precoAvista: number | null;
  precoAvistaMinimo: number | null;
  quantidadeEstoque: number;
  ativo: boolean;
  prioridade: string;
};

type LinhaComparativa = {
  produto: Produto;
  matriz: ProdutoLoja | null;
  filial: ProdutoLoja | null;
};

const formatReal = (valor: number | null) => {
  if (valor === null || valor === 0) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// MUDANÇA: badge reutilizável de prioridade (sem emojis, só cor)
function PrioridadeBadge({ prioridade }: { prioridade: string | undefined }) {
  if (!prioridade) return <span className="text-slate-400 text-xs">—</span>;
  const map: Record<string, string> = {
    vermelho: 'bg-red-100 text-red-800',
    amarelo: 'bg-yellow-100 text-yellow-800',
    verde: 'bg-green-100 text-green-800',
  };
  const labels: Record<string, string> = { vermelho: 'Alta', amarelo: 'Média', verde: 'Baixa' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[prioridade] ?? map.verde}`}>
      {labels[prioridade] ?? 'Baixa'}
    </span>
  );
}

// MUDANÇA: card comparativo mobile — substitui as linhas da tabela de 13 colunas.
// Mostra Matriz e Filial lado a lado dentro do card, evitando scroll horizontal.
// Detalhes técnicos ficam em gaveta expansível.
function LinhaCardMobile({
  linha,
  onEditar,
}: {
  linha: LinhaComparativa;
  onEditar: (p: Produto) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const m = linha.matriz;
  const f = linha.filial;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-mono">{linha.produto.sku}</p>
            <h3 className="font-semibold text-slate-900 text-sm leading-snug mt-0.5">{linha.produto.nome}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {linha.produto.marca}
              {linha.produto.amperagem && ` · ${linha.produto.amperagem}`}
              {linha.produto.tipo && ` · ${linha.produto.tipo}`}
            </p>
          </div>
          <button
            onClick={() => onEditar(linha.produto)}
            className="flex items-center gap-1 text-blue-600 text-xs font-medium border border-blue-200 rounded-lg px-2 py-1.5 hover:bg-blue-50 flex-shrink-0"
          >
            <Pencil size={12} />
            Editar
          </button>
        </div>

        {/* Comparativo Matriz vs Filial em 2 colunas */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-lg p-2.5">
            <p className="text-xs font-semibold text-blue-700 mb-1.5">Matriz</p>
            {m ? (
              <>
                <p className="text-sm font-bold text-slate-900">{formatReal(m.precoCartao)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Estoque: {m.quantidadeEstoque}</p>
                <div className="mt-1"><PrioridadeBadge prioridade={m.prioridade} /></div>
              </>
            ) : (
              <p className="text-xs text-slate-400">Sem registro</p>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-2.5">
            <p className="text-xs font-semibold text-green-700 mb-1.5">Filial</p>
            {f ? (
              <>
                <p className="text-sm font-bold text-slate-900">{formatReal(f.precoCartao)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Estoque: {f.quantidadeEstoque}</p>
                <div className="mt-1"><PrioridadeBadge prioridade={f.prioridade} /></div>
              </>
            ) : (
              <p className="text-xs text-slate-400">Sem registro</p>
            )}
          </div>
        </div>
      </div>

      {/* Gaveta com detalhes técnicos */}
      {aberto && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 text-xs text-slate-600 space-y-1">
          {linha.produto.garantia && <p><span className="text-slate-400">Garantia:</span> {linha.produto.garantia}</p>}
          {linha.produto.cca && <p><span className="text-slate-400">CCA:</span> {linha.produto.cca}</p>}
          {m && <p><span className="text-slate-400">Matriz à vista:</span> {formatReal(m.precoAvista)}</p>}
          {f && <p><span className="text-slate-400">Filial à vista:</span> {formatReal(f.precoAvista)}</p>}
        </div>
      )}

      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 border-t border-slate-100 hover:bg-slate-50"
      >
        {aberto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {aberto ? 'Menos' : 'Detalhes técnicos'}
      </button>
    </div>
  );
}

export default function TodasLojasPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [linhas, setLinhas] = useState<LinhaComparativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoLoja | null>(null);

  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroAmperagem, setFiltroAmperagem] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroGarantia, setFiltroGarantia] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    carregarDados();
  }, [user, userLoading]);

  const carregarDados = async () => {
    setLoading(true);
    const [resMatriz, resFilial] = await Promise.all([
      fetch('/api/admin/produtos?lojaId=1'),
      fetch('/api/admin/produtos?lojaId=2'),
    ]);
    const matrizData = await resMatriz.json();
    const filialData = await resFilial.json();

    const mapa = new Map<number, LinhaComparativa>();
    for (const pl of matrizData) {
      mapa.set(pl.produtoId, { produto: pl.produto, matriz: pl, filial: null });
    }
    for (const pl of filialData) {
      if (mapa.has(pl.produtoId)) {
        mapa.get(pl.produtoId)!.filial = pl;
      } else {
        mapa.set(pl.produtoId, { produto: pl.produto, matriz: null, filial: pl });
      }
    }
    setLinhas(Array.from(mapa.values()));
    setLoading(false);
  };

  const handleEditar = (produto: Produto) => {
    setProdutoEditando({
      id: -1, produtoId: produto.id, lojaId: 1, produto,
      precoCartao: null, precoCartao3x: null, precoAvista: null, precoAvistaMinimo: null,
      quantidadeEstoque: 0, ativo: true, prioridade: 'verde',
    });
    setModalOpen(true);
  };

  const salvarEdicao = async (updates: { matriz?: any; filial?: any }, dadosProduto: any) => {
    try {
      if (dadosProduto && Object.keys(dadosProduto).length) {
        const res = await fetch('/api/admin/produtos/produto', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: produtoEditando?.produtoId, ...dadosProduto }),
        });
        if (!res.ok) { alert('Erro ao salvar dados comuns'); return; }
      }
      if (updates.matriz?.id) {
        await fetch('/api/admin/produtos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates.matriz) });
      }
      if (updates.filial?.id) {
        await fetch('/api/admin/produtos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates.filial) });
      }
      await carregarDados();
    } catch (e) {
      alert('Erro de rede: ' + (e as any).message);
    }
  };

  const linhasFiltradas = linhas.filter(l => {
    const busca = buscaTexto.toLowerCase();
    if (busca && !l.produto.nome.toLowerCase().includes(busca) && !l.produto.sku.toLowerCase().includes(busca)) return false;
    if (filtroAmperagem && (l.produto.amperagem ?? '') !== filtroAmperagem) return false;
    if (filtroTipo && (l.produto.tipo ?? '') !== filtroTipo) return false;
    if (filtroMarca && l.produto.marca !== filtroMarca) return false;
    if (filtroGarantia && (l.produto.garantia ?? '') !== filtroGarantia) return false;
    return true;
  });

  const amperagens = [...new Set(linhas.map(l => l.produto.amperagem).filter(Boolean))] as string[];
  const tipos = [...new Set(linhas.map(l => l.produto.tipo).filter(Boolean))] as string[];
  const marcas = [...new Set(linhas.map(l => l.produto.marca))];
  const garantias = [...new Set(linhas.map(l => l.produto.garantia).filter(Boolean))] as string[];

  const limparFiltros = () => {
    setBuscaTexto(''); setFiltroAmperagem(''); setFiltroTipo(''); setFiltroMarca(''); setFiltroGarantia('');
  };

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900">Visão Geral — Todas as Lojas</h1>

      {/* MUDANÇA: filtros em grid 2x2 no mobile */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <input
          type="text"
          value={buscaTexto}
          onChange={e => setBuscaTexto(e.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <select value={filtroAmperagem} onChange={e => setFiltroAmperagem(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Amperagem</option>
            {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Tipo</option>
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Marca</option>
            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filtroGarantia} onChange={e => setFiltroGarantia(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Garantia</option>
            {garantias.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={limparFiltros} className="border border-slate-300 px-4 py-2 rounded-lg text-sm bg-white hover:bg-slate-50 col-span-2 md:col-span-1">
            Limpar
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">{linhasFiltradas.length} produto(s) encontrado(s)</p>

      {/* MUDANÇA: cards no mobile — substitui tabela de 13 colunas */}
      <div className="md:hidden space-y-3">
        {linhasFiltradas.map(linha => (
          <LinhaCardMobile key={linha.produto.id} linha={linha} onEditar={handleEditar} />
        ))}
        {linhasFiltradas.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      {/* MUDANÇA: tabela só no desktop — mantida intacta para uso em computador */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amper.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Garantia</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500" colSpan={2}>Preço Cartão</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500" colSpan={2}>Estoque</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500" colSpan={2}>Prioridade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ações</th>
            </tr>
            <tr className="bg-gray-100 text-xs text-center text-gray-500">
              <th colSpan={6}></th>
              <th className="px-2 py-1">Matriz</th>
              <th className="px-2 py-1">Filial</th>
              <th className="px-2 py-1">Matriz</th>
              <th className="px-2 py-1">Filial</th>
              <th className="px-2 py-1">Matriz</th>
              <th className="px-2 py-1">Filial</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {linhasFiltradas.map((linha) => {
              const m = linha.matriz;
              const f = linha.filial;
              return (
                <tr key={linha.produto.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{linha.produto.sku}</td>
                  <td className="px-4 py-2 font-medium">{linha.produto.nome}</td>
                  <td className="px-4 py-2">{linha.produto.marca}</td>
                  <td className="px-4 py-2">{linha.produto.amperagem ?? ''}</td>
                  <td className="px-4 py-2">{linha.produto.tipo ?? ''}</td>
                  <td className="px-4 py-2">{linha.produto.garantia ?? ''}</td>
                  <td className="px-4 py-2 text-right">{formatReal(m?.precoCartao ?? null)}</td>
                  <td className="px-4 py-2 text-right">{formatReal(f?.precoCartao ?? null)}</td>
                  <td className="px-4 py-2 text-center">{m?.quantidadeEstoque ?? '—'}</td>
                  <td className="px-4 py-2 text-center">{f?.quantidadeEstoque ?? '—'}</td>
                  <td className="px-4 py-2 text-center"><PrioridadeBadge prioridade={m?.prioridade} /></td>
                  <td className="px-4 py-2 text-center"><PrioridadeBadge prioridade={f?.prioridade} /></td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleEditar(linha.produto)} className="text-blue-600 hover:underline text-sm">Editar</button>
                  </td>
                </tr>
              );
            })}
            {linhasFiltradas.length === 0 && (
              <tr><td colSpan={13} className="px-4 py-8 text-center text-slate-400 text-sm">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && produtoEditando && (
        <ModalEditarProduto
          produtoOriginal={produtoEditando}
          onClose={() => setModalOpen(false)}
          onSave={salvarEdicao}
          carregarCallback={carregarDados}
        />
      )}
    </div>
  );
}
