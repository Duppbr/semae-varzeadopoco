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

export default function AdminProdutos() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [lojaId, setLojaId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoLoja | null>(null);

  // Filtros
  const [filtroAmperagem, setFiltroAmperagem] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [filtroGarantia, setFiltroGarantia] = useState('');
  const [buscaTexto, setBuscaTexto] = useState('');

  const [showCriarModal, setShowCriarModal] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    sku: '', nome: '', marca: '', amperagem: '', tipo: '', cca: '', garantia: '',
    precoCartao: '', precoCartao3x: '', precoAvista: '', precoAvistaMinimo: '',
    quantidadeEstoque: '0', prioridade: 'verde',
  });

  // Opções padronizadas
  const [opcoes, setOpcoes] = useState<{ id: number; categoria: string; valor: string }[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    carregarProdutos();
    carregarOpcoes();
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

  // Listas para selects
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
      if (updates.matriz && updates.matriz.id) {
        const res = await fetch('/api/admin/produtos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates.matriz),
        });
        if (!res.ok) alert('Erro ao salvar Matriz');
      }
      if (updates.filial && updates.filial.id) {
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

  const formatReal = (valor: number | null) => {
    if (valor === null || valor === 0) return '—';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filtragem incluindo busca textual e garantia
  const produtosFiltrados = produtos.filter(p => {
    const busca = buscaTexto.toLowerCase();
    if (busca && !p.produto.nome.toLowerCase().includes(busca) && !p.produto.sku.toLowerCase().includes(busca))
      return false;
    if (filtroAmperagem && (p.produto.amperagem ?? '') !== filtroAmperagem) return false;
    if (filtroTipo && (p.produto.tipo ?? '') !== filtroTipo) return false;
    if (filtroMarca && p.produto.marca !== filtroMarca) return false;
    if (filtroGarantia && (p.produto.garantia ?? '') !== filtroGarantia) return false;
    if (filtroPrioridade && p.prioridade !== filtroPrioridade) return false;
    return true;
  });

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">📦 Gerenciar Produtos</h1>
        <div className="flex gap-2">
          <select value={lojaId} onChange={(e) => setLojaId(Number(e.target.value))} className="border p-2 rounded">
            <option value={1}>Matriz Artêmia</option>
            <option value={2}>Filial Iguatemi</option>
          </select>
          <button onClick={() => setShowCriarModal(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + Novo Produto
          </button>
        </div>
      </div>

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
          {amperagens.map(amp => <option key={amp} value={amp}>{amp}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border p-2 rounded">
          <option value="">Todos tipos</option>
          {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
        <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="border p-2 rounded">
          <option value="">Todas marcas</option>
          {marcas.map(marca => <option key={marca} value={marca}>{marca}</option>)}
        </select>
        <select value={filtroGarantia} onChange={e => setFiltroGarantia(e.target.value)} className="border p-2 rounded">
          <option value="">Todas garantias</option>
          {garantias.map(gar => <option key={gar} value={gar}>{gar}</option>)}
        </select>
        <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)} className="border p-2 rounded">
          <option value="">Todas prioridades</option>
          <option value="vermelho">🔴 Alta</option>
          <option value="amarelo">🟡 Média</option>
          <option value="verde">🟢 Baixa</option>
        </select>
        <button
          onClick={() => {
            setFiltroAmperagem('');
            setFiltroTipo('');
            setFiltroMarca('');
            setFiltroGarantia('');
            setFiltroPrioridade('');
            setBuscaTexto('');
          }}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Limpar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
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
          <tbody>
            {produtosFiltrados.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-sm">{p.produto.sku}</td>
                <td className="px-4 py-2 text-sm">{p.produto.nome}</td>
                <td className="px-4 py-2 text-sm">{p.produto.marca}</td>
                <td className="px-4 py-2 text-sm">{p.produto.amperagem ?? ''}</td>
                <td className="px-4 py-2 text-sm">{p.produto.tipo ?? ''}</td>
                <td className="px-4 py-2 text-sm">{p.produto.garantia ?? ''}</td>
                <td className="px-4 py-2 text-sm">{p.quantidadeEstoque}</td>
                <td className="px-4 py-2 text-sm">{formatReal(p.precoCartao)}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${p.prioridade === 'vermelho' ? 'bg-red-100 text-red-800' : p.prioridade === 'amarelo' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {p.prioridade === 'vermelho' ? '🔴 Alta' : p.prioridade === 'amarelo' ? '🟡 Média' : '🟢 Baixa'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <button onClick={() => toggleAtivo(p.id, p.ativo)} className={`px-2 py-1 rounded text-xs ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-4 py-2 text-sm">
                  <button onClick={() => handleEditar(p)} className="text-blue-600 hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição – agora importado */}
      {modalOpen && produtoEditando && (
        <ModalEditarProduto
          produtoOriginal={produtoEditando}
          onClose={() => setModalOpen(false)}
          onSave={salvarEdicao}
          carregarCallback={carregarProdutos}
        />
      )}

      {/* Modal de Criação */}
      {showCriarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Novo Produto</h2>
            <form onSubmit={criarProduto} className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="SKU *" value={novoProduto.sku} onChange={e => setNovoProduto({...novoProduto, sku: e.target.value})} className="border p-2 rounded" required />
              <input type="text" placeholder="Nome *" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} className="border p-2 rounded" required />

              <select value={novoProduto.marca} onChange={e => setNovoProduto({...novoProduto, marca: e.target.value})} className="border p-2 rounded" required>
                <option value="">Marca *</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <select value={novoProduto.amperagem} onChange={e => setNovoProduto({...novoProduto, amperagem: e.target.value})} className="border p-2 rounded">
                <option value="">Amperagem</option>
                {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select value={novoProduto.tipo} onChange={e => setNovoProduto({...novoProduto, tipo: e.target.value})} className="border p-2 rounded">
                <option value="">Tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <input type="text" placeholder="CCA" value={novoProduto.cca} onChange={e => setNovoProduto({...novoProduto, cca: e.target.value})} className="border p-2 rounded" />

              {/* SELECT DE GARANTIA */}
              <select value={novoProduto.garantia} onChange={e => setNovoProduto({...novoProduto, garantia: e.target.value})} className="border p-2 rounded">
                <option value="">Garantia</option>
                {garantias.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <input type="number" step="0.01" placeholder="Preço Cartão" value={novoProduto.precoCartao} onChange={e => setNovoProduto({...novoProduto, precoCartao: e.target.value})} className="border p-2 rounded" />
              <input type="number" step="0.01" placeholder="Preço Cartão 3x" value={novoProduto.precoCartao3x} onChange={e => setNovoProduto({...novoProduto, precoCartao3x: e.target.value})} className="border p-2 rounded" />
              <input type="number" step="0.01" placeholder="Preço À vista" value={novoProduto.precoAvista} onChange={e => setNovoProduto({...novoProduto, precoAvista: e.target.value})} className="border p-2 rounded" />
              <input type="number" step="0.01" placeholder="Preço À vista mínimo" value={novoProduto.precoAvistaMinimo} onChange={e => setNovoProduto({...novoProduto, precoAvistaMinimo: e.target.value})} className="border p-2 rounded" />
              <input type="number" placeholder="Estoque" value={novoProduto.quantidadeEstoque} onChange={e => setNovoProduto({...novoProduto, quantidadeEstoque: e.target.value})} className="border p-2 rounded" />
              <select value={novoProduto.prioridade} onChange={e => setNovoProduto({...novoProduto, prioridade: e.target.value})} className="border p-2 rounded">
                <option value="verde">🟢 Baixa</option>
                <option value="amarelo">🟡 Média</option>
                <option value="vermelho">🔴 Alta</option>
              </select>
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowCriarModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}