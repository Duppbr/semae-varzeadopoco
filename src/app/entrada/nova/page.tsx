'use client';

import { useEffect, useState } from 'react';
import { requisitar } from '@/lib/http-client';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { hoje } from '@/lib/regras';
import { Plus, Trash2, PackagePlus } from 'lucide-react';
import SeletorProdutos from '@/components/SeletorProdutos';

interface Produto { id: string; nome: string; unidade: { id: string; abreviacao: string }; categoria: { nome: string; cor: string } }
interface Responsavel { id: string; nome: string; cargo: string | null }
interface Fornecedor { id: string; nome: string }
interface ItemForm { produtoId: string; produtoNome: string; unidadeId: string; unidadeAbrev: string; quantidade: string }

export default function NovaEntradaPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [data, setData] = useState(hoje);
  const [responsavelId, setResponsavelId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    requisitar<Produto[]>('/api/estoque').then(setProdutos).catch(e => setErro(e.message));
    requisitar<Responsavel[]>('/api/responsaveis?ativo=true').then(setResponsaveis).catch(e => setErro(e.message));
    requisitar<Fornecedor[]>('/api/fornecedores?ativo=true').then(setFornecedores).catch(e => setErro(e.message));
  }, []);

  const adicionarProduto = (p: Produto) => {
    if (itens.find(i => i.produtoId === p.id)) return;
    setItens(prev => [...prev, { produtoId: p.id, produtoNome: p.nome, unidadeId: p.unidade.id, unidadeAbrev: p.unidade.abreviacao, quantidade: '' }]);
  };

  const removerItem = (idx: number) => setItens(prev => prev.filter((_, i) => i !== idx));
  const atualizarQtd = (idx: number, v: string) => setItens(prev => prev.map((it, i) => i === idx ? { ...it, quantidade: v } : it));

  const salvar = async () => {
    if (itens.length === 0) { setErro('Adicione pelo menos um produto.'); return; }
    const itensValidos = itens;
    if (itens.some(i => !Number.isFinite(Number(i.quantidade)) || Number(i.quantidade) <= 0)) { setErro('Informe quantidade positiva em todos os itens.'); return; }
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          responsavelId: responsavelId || undefined,
          fornecedorId: fornecedorId || undefined,
          observacao: observacao || undefined,
          itens: itensValidos.map(i => ({ produtoId: i.produtoId, quantidade: parseFloat(i.quantidade), unidadeId: i.unidadeId })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setErro(d.erro || 'Erro ao salvar.'); setSalvando(false); return; }
      router.push('/entrada');
    } catch { setErro('Erro de rede.'); setSalvando(false); }
  };

  return (
    <AppShell title="Nova Entrada" backHref="/entrada">
      <div className="space-y-4">
        {/* Data */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Informações gerais</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data da entrada *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fornecedor</label>
            <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900">
              <option value="">Selecionar fornecedor</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            {fornecedores.length === 0 && <p className="text-xs text-slate-500 mt-1.5">
              Nenhum fornecedor cadastrado. Cadastre em Administração &rsaquo; Fornecedores.
            </p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsável</label>
            <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900">
              <option value="">Selecionar responsável</option>
              {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}{r.cargo ? ` – ${r.cargo}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observação</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none" />
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Produtos ({itens.length})</h3>
            <button onClick={() => setMostrarBusca(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-blue-700">
              <Plus size={15} /> Adicionar
            </button>
          </div>

          {/* Busca de produtos */}
          {mostrarBusca && (
            <div className="mb-4">
              <SeletorProdutos produtos={produtos} escolhidos={itens.map(i => i.produtoId)} onEscolher={adicionarProduto} acento="blue" autoFocus />
              <button onClick={() => setMostrarBusca(false)}
                className="mt-2 text-sm text-slate-500 underline">Concluir seleção</button>
            </div>
          )}

          {/* Lista de itens */}
          {itens.length === 0 ? (
            <div className="text-center py-6">
              <PackagePlus size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Nenhum produto adicionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((it, idx) => (
                <div key={it.produtoId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{it.produtoNome}</p>
                    <p className="text-xs text-slate-500">{it.unidadeAbrev}</p>
                  </div>
                  <input
                    type="number"
                    value={it.quantidade}
                    onChange={e => atualizarQtd(idx, e.target.value)}
                    placeholder="Qtd"
                    min="0"
                    step="0.1"
                    className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-center font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button onClick={() => removerItem(idx)} className="p-2 text-red-400 hover:text-red-600 active:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{erro}</div>}

        <button
          onClick={salvar}
          disabled={salvando || itens.length === 0}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base active:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
        >
          {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PackagePlus size={20} />}
          {salvando ? 'Salvando...' : 'Registrar Entrada'}
        </button>
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
