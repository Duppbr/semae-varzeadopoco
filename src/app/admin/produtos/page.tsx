'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// MUDANÇA: helper de formatação extraído aqui para reutilizar nos cards e na tabela
const formatReal = (valor: number | null) => {
  if (valor === null || valor === 0) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// MUDANÇA: badge de prioridade extraído como componente para evitar repetição entre card e tabela
function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  const estilos: Record<string, string> = {
    vermelho: 'bg-red-100 text-red-800',
    amarelo: 'bg-yellow-100 text-yellow-800',
    verde: 'bg-green-100 text-green-800',
  };
  const labels: Record<string, string> = {
    vermelho: '● Alta',
    amarelo: '● Média',
    verde: '● Baixa',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${estilos[prioridade] ?? estilos.verde}`}>
      {labels[prioridade] ?? '● Baixa'}
    </span>
  );
}

// MUDANÇA: card de produto para mobile — substitui a linha de tabela.
// Mostra as informações mais importantes de forma empilhada, sem scroll horizontal.
// Detalhes secundários ficam num "gaveta" expansível para não poluir a tela.
function ProdutoCardMobile({
  p,
  onEditar,
  onToggleAtivo,
}: {
  p: ProdutoLoja;
  onEditar: (p: ProdutoLoja) => void;
  onToggleAtivo: (id: number, ativo: boolean) => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Cabeçalho do card — sempre visível */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* SKU em cinza pequeno acima do nome */}
            <p className="text-xs text-slate-400 font-mono">{p.produto.sku}</p>
            <h3 className="font-semibold text-slate-900 text-sm leading-snug mt-0.5 truncate">
              {p.produto.nome}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{p.produto.marca}</p>
          </div>
          <PrioridadeBadge prioridade={p.prioridade} />
        </div>

        {/* Preços em destaque — informação mais consultada */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-500">Cartão</p>
            <p className="font-bold text-slate-900 text-sm">{formatReal(p.precoCartao)}</p>
          </div>
          <div className="bg-green-50 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-500">À vista</p>
            <p className="font-bold text-green-700 text-sm">{formatReal(p.precoAvista)}</p>
          </div>
        </div>
      </div>

      {/* Gaveta expansível com detalhes secundários */}
      {aberto && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2 bg-slate-50 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
            {p.produto.amperagem && (
              <><span className="text-slate-400 text-xs">Amperagem</span><span>{p.produto.amperagem}</span></>
            )}
            {p.produto.tipo && (
              <><span className="text-slate-400 text-xs">Tipo</span><span>{p.produto.tipo}</span></>
            )}
            {p.produto.garantia && (
              <><span className="text-slate-400 text-xs">Garantia</span><span>{p.produto.garantia}</span></>
            )}
            <span className="text-slate-400 text-xs">Estoque</span>
            <span className={p.quantidadeEstoque <= 0 ? 'text-red-600 font-medium' : ''}>{p.quantidadeEstoque} un.</span>
            <span className="text-slate-400 text-xs">Cartão 3x</span>
            <span>{formatReal(p.precoCartao3x)}</span>
            <span className="text-slate-400 text-xs">À vista mín.</span>
            <span>{formatReal(p.precoAvistaMinimo)}</span>
          </div>
        </div>
      )}

      {/* Rodapé com ações */}
      <div className="border-t border-slate-100 flex divide-x divide-slate-100">
        <button
          onClick={() => setAberto(!aberto)}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs text-slate-500 hover:bg-slate-50 transition"
        >
          {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {aberto ? 'Menos' : 'Detalhes'}
        </button>
        <button
          onClick={() => onToggleAtivo(p.id, p.ativo)}
          className={`flex-1 py-2.5 text-xs font-medium transition hover:opacity-80 ${p.ativo ? 'text-green-700' : 'text-red-600'}`}
        >
          {p.ativo ? 'Ativo' : 'Inativo'}
        </button>
        <button
          onClick={() => onEditar(p)}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs text-blue-600 font-medium hover:bg-blue-50 transition"
        >
          <Pencil size={13} />
          Editar
        </button>
      </div>
    </div>
  );
}

export default function AdminProdutos() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [lojaId, setLojaId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoLoja | null>(null);

  const [filtroAmperagem, setFiltroAmperagem] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [filtroGarantia, setFiltroGarantia] = useState('');
  const [buscaTexto, setBuscaTexto] = useState('');
  // MUDANÇA: filtro de ativo/inativo — permite ver só produtos ativos ou só inativos
  // Útil para gerenciar quais produtos estão visíveis na consulta
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('ativo');

  const [showCriarModal, setShowCriarModal] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    sku: '', nome: '', marca: '', amperagem: '', tipo: '', cca: '', garantia: '',
    precoCartao: '', precoCartao3x: '', precoAvista: '', precoAvistaMinimo: '',
    quantidadeEstoque: '0', prioridade: 'verde',
  });

  const [opcoes, setOpcoes] = useState<{ id: number; categoria: string; valor: string }[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    carregarProdutos();
    carregarOpcoes();
    const skuParam = searchParams.get('sku');
    if (skuParam) {
      setBuscaTexto(skuParam);
      setFiltroAtivo('todos');
    }
  }, [user, userLoading, lojaId]);

  const carregarProdutos = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/produtos?lojaId=${lojaId}`);
    const data = await res.json();
    setProdutos(data);
    setLoading(false);
  };

  const carregarOpcoes = async () => {
    try {
      const res = await fetch('/api/admin/opcoes');
      const data = await res.json();
      setOpcoes(data);
    } catch (e) {
      console.error('Erro ao carregar opções', e);
    }
  };

  const marcas = opcoes.filter(o => o.categoria === 'marca').map(o => o.valor);
  const amperagens = opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor);
  const tipos = opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor);
  const garantias = opcoes.filter(o => o.categoria === 'garantia').map(o => o.valor);

  const handleEditar = (produto: ProdutoLoja) => {
    setProdutoEditando(produto);
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
        if (!res.ok) {
          const err = await res.json();
          alert('Erro ao salvar dados comuns: ' + (err.erro || res.status));
          return;
        }
      }
      if (updates.matriz?.id) {
        const res = await fetch('/api/admin/produtos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates.matriz),
        });
        if (!res.ok) alert('Erro ao salvar Matriz');
      }
      if (updates.filial?.id) {
        const res = await fetch('/api/admin/produtos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates.filial),
        });
        if (!res.ok) alert('Erro ao salvar Filial');
      }
      await carregarProdutos();
    } catch (e) {
      alert('Erro de rede: ' + (e as any).message);
    }
  };

  const toggleAtivo = async (id: number, ativo: boolean) => {
    await fetch('/api/admin/produtos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    carregarProdutos();
  };

  const criarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/produtos/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...novoProduto, lojaId }),
    });
    if (res.ok) {
      setShowCriarModal(false);
      carregarProdutos();
      setNovoProduto({
        sku: '', nome: '', marca: '', amperagem: '', tipo: '', cca: '', garantia: '',
        precoCartao: '', precoCartao3x: '', precoAvista: '', precoAvistaMinimo: '',
        quantidadeEstoque: '0', prioridade: 'verde',
      });
    } else {
      alert('Erro ao criar produto');
    }
  };

  const limparFiltros = () => {
    setFiltroAmperagem('');
    setFiltroTipo('');
    setFiltroMarca('');
    setFiltroGarantia('');
    setFiltroPrioridade('');
    setBuscaTexto('');
    setFiltroAtivo('todos');
  };

  const produtosFiltrados = produtos.filter(p => {
    const busca = buscaTexto.toLowerCase();
    if (busca && !p.produto.nome.toLowerCase().includes(busca) && !p.produto.sku.toLowerCase().includes(busca))
      return false;
    if (filtroAmperagem && (p.produto.amperagem ?? '') !== filtroAmperagem) return false;
    if (filtroTipo && (p.produto.tipo ?? '') !== filtroTipo) return false;
    if (filtroMarca && p.produto.marca !== filtroMarca) return false;
    if (filtroGarantia && (p.produto.garantia ?? '') !== filtroGarantia) return false;
    if (filtroPrioridade && p.prioridade !== filtroPrioridade) return false;
    // MUDANÇA: filtro de status ativo/inativo
    if (filtroAtivo === 'ativo' && !p.ativo) return false;
    if (filtroAtivo === 'inativo' && p.ativo) return false;
    return true;
  });

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    // MUDANÇA: padding menor no mobile (p-4) e maior no desktop (md:p-8)
    // Antes era só p-8 que cortava o conteúdo nas bordas em telas pequenas
    <div className="p-4 md:p-8">

      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Gerenciar Produtos</h1>
        <div className="flex gap-2">
          <select
            value={lojaId}
            onChange={(e) => setLojaId(Number(e.target.value))}
            className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white"
          >
            <option value={1}>Matriz Artêmia</option>
            <option value={2}>Filial Iguatemi</option>
          </select>
          <button
            onClick={() => setShowCriarModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            + Novo
          </button>
        </div>
      </div>

      {/* MUDANÇA: Filtros — grid 2 colunas no mobile, flex wrap no desktop.
          Antes era só flex-wrap, o que causava transbordamento horizontal em telas pequenas. */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-3">
        {/* Busca textual — linha inteira */}
        <input
          type="text"
          value={buscaTexto}
          onChange={e => setBuscaTexto(e.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Selects em grade 2x2 no mobile, linha única no desktop */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <select value={filtroAmperagem} onChange={e => setFiltroAmperagem(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Amperagem</option>
            {amperagens.map(amp => <option key={amp} value={amp}>{amp}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Tipo</option>
            {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
          </select>
          <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Marca</option>
            {marcas.map(marca => <option key={marca} value={marca}>{marca}</option>)}
          </select>
          <select value={filtroGarantia} onChange={e => setFiltroGarantia(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Garantia</option>
            {garantias.map(gar => <option key={gar} value={gar}>{gar}</option>)}
          </select>
          <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
            <option value="">Prioridade</option>
            <option value="vermelho">Alta</option>
            <option value="amarelo">Média</option>
            <option value="verde">Baixa</option>
          </select>
          <button
            onClick={limparFiltros}
            className="border border-slate-300 px-4 py-2 rounded-lg text-sm bg-white hover:bg-slate-50 transition"
          >
            Limpar
          </button>
        </div>

        {/* MUDANÇA: filtro de status com botões pill — mais rápido que select para alternar entre ativos/inativos.
            Padrão visual igual ao filtro de categorias em /admin/opcoes */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['todos', 'ativo', 'inativo'] as const).map(op => (
            <button
              key={op}
              onClick={() => setFiltroAtivo(op)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                filtroAtivo === op
                  ? op === 'ativo'
                    ? 'bg-green-600 text-white border-green-600'
                    : op === 'inativo'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-700 text-white border-slate-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {op === 'todos' ? 'Todos' : op === 'ativo' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
          {/* Contagem inline para feedback imediato */}
          <span className="text-xs text-slate-400 ml-1">
            ({produtosFiltrados.length} de {produtos.length})
          </span>
        </div>
      </div>

      {/* Contador de resultados */}
      <p className="text-xs text-slate-500 mb-3">
        {produtosFiltrados.length} produto(s) encontrado(s)
      </p>

      {/* MUDANÇA: visão de CARDS — visível só no mobile (block md:hidden).
          Resolve o scroll horizontal porque cada produto vira um card empilhado verticalmente.
          O design mostra: SKU, nome, marca, preços em destaque, e detalhes numa gaveta expansível. */}
      <div className="md:hidden space-y-3">
        {produtosFiltrados.map(p => (
          <ProdutoCardMobile
            key={p.id}
            p={p}
            onEditar={handleEditar}
            onToggleAtivo={toggleAtivo}
          />
        ))}
        {produtosFiltrados.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      {/* MUDANÇA: visão de TABELA — visível só no desktop (hidden md:block).
          A tabela original é mantida intacta para quem usa em tela grande.
          Assim não quebramos o fluxo de trabalho de quem administra no computador. */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amperagem</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Garantia</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estoque</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Preço Cartão</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prioridade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ativo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produtosFiltrados.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm font-mono text-slate-600">{p.produto.sku}</td>
                <td className="px-4 py-2 text-sm font-medium">{p.produto.nome}</td>
                <td className="px-4 py-2 text-sm">{p.produto.marca}</td>
                <td className="px-4 py-2 text-sm">{p.produto.amperagem ?? ''}</td>
                <td className="px-4 py-2 text-sm">{p.produto.tipo ?? ''}</td>
                <td className="px-4 py-2 text-sm">{p.produto.garantia ?? ''}</td>
                <td className="px-4 py-2 text-sm">{p.quantidadeEstoque}</td>
                <td className="px-4 py-2 text-sm">{formatReal(p.precoCartao)}</td>
                <td className="px-4 py-2 text-sm"><PrioridadeBadge prioridade={p.prioridade} /></td>
                <td className="px-4 py-2 text-sm">
                  <button
                    onClick={() => toggleAtivo(p.id, p.ativo)}
                    className={`px-2 py-1 rounded text-xs font-medium ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-4 py-2 text-sm">
                  <button onClick={() => handleEditar(p)} className="text-blue-600 hover:underline text-sm">Editar</button>
                </td>
              </tr>
            ))}
            {produtosFiltrados.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {modalOpen && produtoEditando && (
        <ModalEditarProduto
          produtoOriginal={produtoEditando}
          onClose={() => setModalOpen(false)}
          onSave={salvarEdicao}
          carregarCallback={carregarProdutos}
        />
      )}

      {/* Modal de Criação
          MUDANÇA: mx-4 adicionado para dar margem lateral no mobile e não colar nas bordas da tela */}
      {showCriarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Novo Produto</h2>
            <form onSubmit={criarProduto} className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="SKU *" value={novoProduto.sku} onChange={e => setNovoProduto({...novoProduto, sku: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm" required />
              <input type="text" placeholder="Nome *" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm col-span-2 md:col-span-1" required />
              <select value={novoProduto.marca} onChange={e => setNovoProduto({...novoProduto, marca: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm bg-white" required>
                <option value="">Marca *</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={novoProduto.amperagem} onChange={e => setNovoProduto({...novoProduto, amperagem: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm bg-white">
                <option value="">Amperagem</option>
                {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={novoProduto.tipo} onChange={e => setNovoProduto({...novoProduto, tipo: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm bg-white">
                <option value="">Tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="text" placeholder="CCA" value={novoProduto.cca} onChange={e => setNovoProduto({...novoProduto, cca: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm" />
              <select value={novoProduto.garantia} onChange={e => setNovoProduto({...novoProduto, garantia: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm bg-white">
                <option value="">Garantia</option>
                {garantias.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Preço Cartão" value={novoProduto.precoCartao} onChange={e => setNovoProduto({...novoProduto, precoCartao: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm" />
              <input type="number" step="0.01" placeholder="Preço Cartão 3x" value={novoProduto.precoCartao3x} onChange={e => setNovoProduto({...novoProduto, precoCartao3x: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm" />
              <input type="number" step="0.01" placeholder="Preço À vista" value={novoProduto.precoAvista} onChange={e => setNovoProduto({...novoProduto, precoAvista: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm" />
              <input type="number" step="0.01" placeholder="Preço À vista mínimo" value={novoProduto.precoAvistaMinimo} onChange={e => setNovoProduto({...novoProduto, precoAvistaMinimo: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm" />
              <input type="number" placeholder="Estoque" value={novoProduto.quantidadeEstoque} onChange={e => setNovoProduto({...novoProduto, quantidadeEstoque: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm" />
              <select value={novoProduto.prioridade} onChange={e => setNovoProduto({...novoProduto, prioridade: e.target.value})} className="border border-slate-300 p-2 rounded-lg text-sm bg-white">
                <option value="verde">Baixa</option>
                <option value="amarelo">Média</option>
                <option value="vermelho">Alta</option>
              </select>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowCriarModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
