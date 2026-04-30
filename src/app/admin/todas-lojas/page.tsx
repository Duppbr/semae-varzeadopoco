'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import ModalEditarProduto from '@/components/ModalEditarProduto';

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

export default function TodasLojasPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [linhas, setLinhas] = useState<LinhaComparativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoLoja | null>(null);

  // Filtros
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroAmperagem, setFiltroAmperagem] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroGarantia, setFiltroGarantia] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
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

    // Mapeia por produtoId
    const mapa = new Map<number, LinhaComparativa>();
    for (const pl of matrizData) {
      mapa.set(pl.produtoId, {
        produto: pl.produto,
        matriz: pl,
        filial: null,
      });
    }
    for (const pl of filialData) {
      if (mapa.has(pl.produtoId)) {
        mapa.get(pl.produtoId)!.filial = pl;
      } else {
        mapa.set(pl.produtoId, {
          produto: pl.produto,
          matriz: null,
          filial: pl,
        });
      }
    }

    setLinhas(Array.from(mapa.values()));
    setLoading(false);
  };

  const handleEditar = (produto: Produto) => {
    // Cria um ProdutoLoja fake para o modal (ele só usa produtoId e produto)
    setProdutoEditando({
      id: -1,
      produtoId: produto.id,
      lojaId: 1,
      produto,
      precoCartao: null,
      precoCartao3x: null,
      precoAvista: null,
      precoAvistaMinimo: null,
      quantidadeEstoque: 0,
      ativo: true,
      prioridade: 'verde',
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
        if (!res.ok) {
          const err = await res.json();
          alert('Erro ao salvar dados comuns: ' + (err.erro || res.status));
          return;
        }
      }
      if (updates.matriz && updates.matriz.id) {
        await fetch('/api/admin/produtos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates.matriz),
        });
      }
      if (updates.filial && updates.filial.id) {
        await fetch('/api/admin/produtos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates.filial),
        });
      }
      await carregarDados();
    } catch (e) {
      alert('Erro de rede: ' + (e as any).message);
    }
  };

  const formatReal = (valor: number | null) => {
    if (valor === null || valor === 0) return '—';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const linhasFiltradas = linhas.filter(l => {
    const busca = buscaTexto.toLowerCase();
    if (busca && !l.produto.nome.toLowerCase().includes(busca) && !l.produto.sku.toLowerCase().includes(busca))
      return false;
    if (filtroAmperagem && (l.produto.amperagem ?? '') !== filtroAmperagem) return false;
    if (filtroTipo && (l.produto.tipo ?? '') !== filtroTipo) return false;
    if (filtroMarca && l.produto.marca !== filtroMarca) return false;
    if (filtroGarantia && (l.produto.garantia ?? '') !== filtroGarantia) return false;
    return true;
  });

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">🏢🏬 Visão Completa: Todas as Lojas</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded shadow items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Buscar nome/SKU</label>
          <input
            type="text"
            value={buscaTexto}
            onChange={e => setBuscaTexto(e.target.value)}
            placeholder="Digite nome ou SKU..."
            className="border p-2 rounded"
          />
        </div>
        <select value={filtroAmperagem} onChange={e => setFiltroAmperagem(e.target.value)} className="border p-2 rounded">
          <option value="">Todas amperagens</option>
          {[...new Set(linhas.map(l => l.produto.amperagem).filter(Boolean))].map(amp => <option key={amp} value={amp!}>{amp}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border p-2 rounded">
          <option value="">Todos tipos</option>
          {[...new Set(linhas.map(l => l.produto.tipo).filter(Boolean))].map(tipo => <option key={tipo} value={tipo!}>{tipo}</option>)}
        </select>
        <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="border p-2 rounded">
          <option value="">Todas marcas</option>
          {[...new Set(linhas.map(l => l.produto.marca))].map(marca => <option key={marca} value={marca}>{marca}</option>)}
        </select>
        <select value={filtroGarantia} onChange={e => setFiltroGarantia(e.target.value)} className="border p-2 rounded">
          <option value="">Todas garantias</option>
          {[...new Set(linhas.map(l => l.produto.garantia).filter(Boolean))].map(gar => <option key={gar} value={gar!}>{gar}</option>)}
        </select>
        <button
          onClick={() => {
            setBuscaTexto('');
            setFiltroAmperagem('');
            setFiltroTipo('');
            setFiltroMarca('');
            setFiltroGarantia('');
          }}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Limpar
        </button>
      </div>

      {/* Tabela comparativa */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Produto</th>
              <th className="px-4 py-3 text-left">Marca</th>
              <th className="px-4 py-3 text-left">Amper.</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Garantia</th>
              <th className="px-4 py-3 text-center" colSpan={2}>Preço Cartão</th>
              <th className="px-4 py-3 text-center" colSpan={2}>Estoque</th>
              <th className="px-4 py-3 text-center" colSpan={2}>Prioridade</th>
              <th className="px-4 py-3 text-left">Ações</th>
            </tr>
            <tr className="bg-gray-100">
              <th></th><th></th><th></th><th></th><th></th><th></th>
              <th className="px-2 py-1 text-xs text-center">Matriz</th>
              <th className="px-2 py-1 text-xs text-center">Filial</th>
              <th className="px-2 py-1 text-xs text-center">Matriz</th>
              <th className="px-2 py-1 text-xs text-center">Filial</th>
              <th className="px-2 py-1 text-xs text-center">Matriz</th>
              <th className="px-2 py-1 text-xs text-center">Filial</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map((linha) => {
              const m = linha.matriz;
              const f = linha.filial;
              return (
                <tr key={linha.produto.id} className="border-t">
                  <td className="px-4 py-2">{linha.produto.sku}</td>
                  <td className="px-4 py-2">{linha.produto.nome}</td>
                  <td className="px-4 py-2">{linha.produto.marca}</td>
                  <td className="px-4 py-2">{linha.produto.amperagem ?? ''}</td>
                  <td className="px-4 py-2">{linha.produto.tipo ?? ''}</td>
                  <td className="px-4 py-2">{linha.produto.garantia ?? ''}</td>
                  <td className="px-4 py-2 text-right">{formatReal(m?.precoCartao ?? null)}</td>
                  <td className="px-4 py-2 text-right">{formatReal(f?.precoCartao ?? null)}</td>
                  <td className="px-4 py-2 text-center">{m?.quantidadeEstoque ?? '—'}</td>
                  <td className="px-4 py-2 text-center">{f?.quantidadeEstoque ?? '—'}</td>
                  <td className="px-4 py-2 text-center">
                    {m ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${m.prioridade === 'vermelho' ? 'bg-red-100 text-red-800' : m.prioridade === 'amarelo' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {m.prioridade === 'vermelho' ? '🔴' : m.prioridade === 'amarelo' ? '🟡' : '🟢'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {f ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${f.prioridade === 'vermelho' ? 'bg-red-100 text-red-800' : f.prioridade === 'amarelo' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {f.prioridade === 'vermelho' ? '🔴' : f.prioridade === 'amarelo' ? '🟡' : '🟢'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleEditar(linha.produto)} className="text-blue-600 hover:underline">Editar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
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