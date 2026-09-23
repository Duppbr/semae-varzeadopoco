'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { requisitar } from '@/lib/http-client';
import { hoje } from '@/lib/regras';
import AdicionarProduto from '@/components/AdicionarProduto';

interface Escola { id: string; nome: string; tipo: string }
interface Produto {
  id: string;
  nome: string;
  unidade: { id: string; abreviacao: string };
  categoria: { nome: string };
  estoque: { quantidade: number } | null;
}
interface Responsavel { id: string; nome: string; cargo: string | null }
interface Fornecedor { id: string; nome: string }
interface ItemForm {
  produtoId: string;
  produtoNome: string;
  unidadeId: string;
  unidadeAbrev: string;
  estoqueAtual: number;
  quantidade: string;
}

interface Unidade { id: string; nome: string; abreviacao: string }

// Excecao, nao o caminho normal: fica escondido dentro do painel "Adicionar"
// e so abre o formulario quando alguem pede.
function ItemSemCadastro({ unidades, onAdicionar }: { unidades: Unidade[]; onAdicionar: (nome: string, unidade: Unidade) => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  if (!aberto) return <button type="button" onClick={() => setAberto(true)}
    className="mt-3 w-full text-center text-xs text-slate-500 underline active:text-slate-700">Não encontrou? Adicionar item sem cadastro</button>;
  const unidade = unidades.find(u => u.id === unidadeId);
  return <fieldset className="mt-3 pt-3 border-t border-slate-100 space-y-2">
    <legend className="sr-only">Item sem cadastro</legend>
    <p className="text-xs text-slate-500">Só para o que ainda não existe no cadastro. Na hora de receber, ele precisa ser vinculado a um produto.</p>
    <input aria-label="Nome do item sem cadastro" placeholder="Nome do item" maxLength={200} autoFocus value={nome} onChange={e => setNome(e.target.value)}
      className="w-full p-3 border border-slate-300 rounded-xl" />
    <select aria-label="Unidade do item sem cadastro" value={unidadeId} onChange={e => setUnidadeId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl bg-white">
      <option value="">Unidade</option>{unidades.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.abreviacao})</option>)}
    </select>
    <button type="button" disabled={!nome.trim() || !unidade} onClick={() => unidade && onAdicionar(nome.trim(), unidade)}
      className="w-full flex justify-center gap-2 items-center bg-purple-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-40 active:bg-purple-700">
      <Plus size={18} /> Adicionar item ao pedido
    </button>
  </fieldset>;
}

export default function NovoPedidoCompraPage() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [data, setData] = useState(hoje);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [escolaId, setEscolaId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([
      requisitar<Escola[]>('/api/escolas?ativo=true'),
      requisitar<Produto[]>('/api/estoque'),
      requisitar<Responsavel[]>('/api/responsaveis?ativo=true'),
      requisitar<{ id: string; nome: string; abreviacao: string }[]>('/api/unidades'),
      requisitar<Fornecedor[]>('/api/fornecedores?ativo=true'),
    ]).then(([esc, prod, resp, un, forn]) => {
      setEscolas(esc);
      setProdutos(prod);
      setResponsaveis(resp);
      setUnidades(un);
      setFornecedores(forn);
    }).catch(e => setErro(e.message));
  }, []);

  const adicionarProduto = (p: Produto) => {
    setItens(prev => [
      ...prev,
      {
        produtoId: p.id,
        produtoNome: p.nome,
        unidadeId: p.unidade.id,
        unidadeAbrev: p.unidade.abreviacao,
        estoqueAtual: p.estoque?.quantidade ?? 0,
        quantidade: '',
      },
    ]);
  };

  const removerItem = (idx: number) => setItens(prev => prev.filter((_, i) => i !== idx));
  const atualizarQtd = (idx: number, v: string) =>
    setItens(prev => prev.map((it, i) => (i === idx ? { ...it, quantidade: v } : it)));

  const salvar = async () => {
    const itensValidos = itens;
    if (!fornecedorId) {
      setErro('Selecione o fornecedor para quem o pedido será enviado.');
      return;
    }
    if (!itensValidos.length || itens.some(i => !Number.isFinite(Number(i.quantidade)) || Number(i.quantidade) <= 0)) {
      setErro('Informe uma quantidade positiva para todos os itens.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/pedido-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          escolaId: escolaId || undefined,
          fornecedorId: fornecedorId || undefined,
          responsavelId: responsavelId || undefined,
          observacao: observacao || undefined,
          itens: itensValidos.map(i => ({
            produtoId: i.produtoId,
            descricao: i.produtoId ? undefined : i.produtoNome,
            quantidade: parseFloat(i.quantidade),
            unidadeId: i.unidadeId,
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErro(d.erro || 'Erro ao salvar.');
        setSalvando(false);
        return;
      }
      const saved = await res.json();
      router.push(`/pedido-compra/${saved.id}`);
    } catch {
      setErro('Erro de rede.');
      setSalvando(false);
    }
  };

  return (
    <AppShell title="Novo Pedido de Compra" backHref="/pedido-compra">
      <div className="space-y-4">
        {/* Dados gerais */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Informações gerais</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fornecedor *</label>
            <select
              aria-label="Fornecedor"
              value={fornecedorId}
              onChange={e => setFornecedorId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            >
              <option value="">Selecionar fornecedor</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
            {fornecedores.length === 0 && (
              <p className="text-xs text-slate-500 mt-1.5">
                Nenhum fornecedor cadastrado. Cadastre em Administração &rsaquo; Fornecedores.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Destino (opcional)
            </label>
            <select
              value={escolaId}
              onChange={e => setEscolaId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            >
              <option value="">Sem destino específico</option>
              {escolas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nome} ({e.tipo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data do pedido *</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsável (SEMAE)</label>
            <select
              value={responsavelId}
              onChange={e => setResponsavelId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            >
              <option value="">Selecionar responsável</option>
              {responsaveis.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nome}{r.cargo ? ` – ${r.cargo}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observação</label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 resize-none"
            />
          </div>
        </div>

        {/* Produtos: o cadastro e o caminho normal; item sem cadastro fica escondido no painel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Produtos ({itens.length})</h3>
            <AdicionarProduto produtos={produtos} escolhidos={itens.map(i => i.produtoId).filter(Boolean)}
              onEscolher={adicionarProduto} acento="purple"
              detalhe={p => <>{p.categoria.nome} · Estoque:{' '}
                <span className={`font-semibold ${(p.estoque?.quantidade ?? 0) <= 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  {p.estoque?.quantidade?.toFixed(1) ?? '0'} {p.unidade.abreviacao}
                </span></>}
              rodape={fechar => <ItemSemCadastro unidades={unidades} onAdicionar={(nome, u) => {
                setItens(prev => [...prev, { produtoId: '', produtoNome: nome, unidadeId: u.id, unidadeAbrev: u.abreviacao, estoqueAtual: 0, quantidade: '' }]);
                fechar();
              }} />} />
          </div>
          {itens.length === 0 ? (
            <div className="text-center py-6">
              <ShoppingCart size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Nenhum produto adicionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((it, idx) => (
                <div key={`${it.produtoId}-${idx}`} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{it.produtoNome}</p>
                      <p className="text-xs text-slate-500">
                        {it.produtoId ? `Estoque atual: ${it.estoqueAtual.toFixed(1)} ${it.unidadeAbrev}` : 'Item sem cadastro'}
                      </p>
                    </div>
                    <button
                      onClick={() => removerItem(idx)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-lg shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={it.quantidade}
                      onChange={e => atualizarQtd(idx, e.target.value)}
                      placeholder="Quantidade"
                      min="0"
                      step="0.1"
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-center font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                    <span className="text-sm font-medium text-slate-500 shrink-0">{it.unidadeAbrev}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>
        )}

        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-base active:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
        >
          {salvando ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShoppingCart size={20} />
          )}
          {salvando ? 'Salvando...' : 'Registrar pedido'}
        </button>
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
