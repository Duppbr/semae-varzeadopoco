'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Check, X } from 'lucide-react';

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

// MUDANÇA: campo de preço reutilizável com label acima, visual consistente com o sistema
function CampoPreco({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? null : (parseFloat(e.target.value) || null))}
          className="w-full border border-slate-300 pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

// MUDANÇA: bloco de campos de uma loja — extraído para não duplicar código entre Matriz e Filial
function BlocoLoja({
  titulo,
  cor,
  dados,
  onChange,
  onCriar,
}: {
  titulo: string;
  cor: 'blue' | 'green';
  dados: ProdutoLoja | null;
  onChange: (dados: ProdutoLoja) => void;
  onCriar: () => void;
}) {
  const corBorda = cor === 'blue' ? 'border-blue-200 bg-blue-50/30' : 'border-green-200 bg-green-50/30';
  const corTitulo = cor === 'blue' ? 'text-blue-800' : 'text-green-800';
  const corHeader = cor === 'blue' ? 'bg-blue-50' : 'bg-green-50';

  if (!dados) {
    return (
      <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center ${cor === 'blue' ? 'border-blue-200' : 'border-green-200'}`}>
        <p className="text-sm text-slate-500">Sem registro para esta loja</p>
        <button
          onClick={onCriar}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          + Criar registro
        </button>
      </div>
    );
  }

  const prioridadeOpcoes = [
    { value: 'verde', label: 'Baixa' },
    { value: 'amarelo', label: 'Media' },
    { value: 'vermelho', label: 'Alta' },
  ];
  const corDot: Record<string, string> = {
    verde: 'bg-green-500',
    amarelo: 'bg-yellow-400',
    vermelho: 'bg-red-500',
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${corBorda}`}>
      <div className={`px-4 py-3 ${corHeader} flex items-center justify-between`}>
        <h4 className={`font-semibold text-sm ${corTitulo}`}>{titulo}</h4>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={dados.ativo}
            onChange={e => onChange({ ...dados, ativo: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          Ativo
        </label>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CampoPreco label="Preco Cartao" value={dados.precoCartao} onChange={v => onChange({ ...dados, precoCartao: v })} />
          <CampoPreco label="Cartao 3x" value={dados.precoCartao3x} onChange={v => onChange({ ...dados, precoCartao3x: v })} />
          <CampoPreco label="A vista" value={dados.precoAvista} onChange={v => onChange({ ...dados, precoAvista: v })} />
          <CampoPreco label="A vista min" value={dados.precoAvistaMinimo} onChange={v => onChange({ ...dados, precoAvistaMinimo: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estoque</label>
            <input
              type="number"
              min="0"
              value={dados.quantidadeEstoque}
              onChange={e => onChange({ ...dados, quantidadeEstoque: parseInt(e.target.value) || 0 })}
              className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Prioridade</label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${corDot[dados.prioridade] ?? 'bg-green-500'}`} />
              <select
                value={dados.prioridade}
                onChange={e => onChange({ ...dados, prioridade: e.target.value })}
                className="w-full border border-slate-300 pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
              >
                {prioridadeOpcoes.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModalEditarProduto({
  produtoOriginal,
  onClose,
  onSave,
  carregarCallback,
}: {
  produtoOriginal: ProdutoLoja;
  onClose: () => void;
  onSave: (updates: { matriz?: any; filial?: any }, dadosComuns: any) => Promise<void>;
  carregarCallback?: () => void;
}) {
  const [dadosComuns, setDadosComuns] = useState({
    sku: produtoOriginal.produto.sku,
    nome: produtoOriginal.produto.nome,
    marca: produtoOriginal.produto.marca || '',
    amperagem: produtoOriginal.produto.amperagem || '',
    tipo: produtoOriginal.produto.tipo || '',
    cca: produtoOriginal.produto.cca || '',
    garantia: produtoOriginal.produto.garantia || '',
  });

  const [matriz, setMatriz] = useState<ProdutoLoja | null>(null);
  const [filial, setFilial] = useState<ProdutoLoja | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const produtoId = produtoOriginal.produtoId;

  const [opcoes, setOpcoes] = useState<{ id: number; categoria: string; valor: string }[]>([]);
  useEffect(() => {
    fetch('/api/admin/opcoes')
      .then(res => res.json())
      .then(data => setOpcoes(data))
      .catch(() => {});
  }, []);

  const marcas = opcoes.filter(o => o.categoria === 'marca').map(o => o.valor);
  const amperagens = opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor);
  const tipos = opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor);
  const garantias = opcoes.filter(o => o.categoria === 'garantia').map(o => o.valor);

  const carregarRegistros = async () => {
    setLoading(true);
    const [resMatriz, resFilial] = await Promise.all([
      fetch(`/api/admin/produtos/by-produto?produtoId=${produtoId}&lojaId=1`),
      fetch(`/api/admin/produtos/by-produto?produtoId=${produtoId}&lojaId=2`),
    ]);
    const matrizData = await resMatriz.json();
    const filialData = await resFilial.json();
    setMatriz(matrizData && matrizData.id ? matrizData : null);
    setFilial(filialData && filialData.id ? filialData : null);
    setLoading(false);
  };

  useEffect(() => {
    carregarRegistros();
  }, [produtoId]);

  const criarRegistroLoja = async (lojaId: number) => {
    const res = await fetch('/api/admin/produtos/criar-registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtoId, lojaId }),
    });
    if (res.ok) await carregarRegistros();
    else alert('Erro ao criar registro para a loja');
  };

  // MUDANÇA: copiarMatrizParaFilial e copiarFilialParaMatriz preservados — mesma lógica, mesmo nome
  const copiarMatrizParaFilial = () => {
    if (!matriz) return;
    setFilial(prev => ({
      ...(prev || {
        id: -1, produtoId, lojaId: 2,
        produto: matriz.produto,
        precoCartao: null, precoCartao3x: null, precoAvista: null, precoAvistaMinimo: null,
        quantidadeEstoque: 0, ativo: true, prioridade: 'verde',
      }),
      precoCartao: matriz.precoCartao,
      precoCartao3x: matriz.precoCartao3x,
      precoAvista: matriz.precoAvista,
      precoAvistaMinimo: matriz.precoAvistaMinimo,
      quantidadeEstoque: matriz.quantidadeEstoque,
      ativo: matriz.ativo,
      prioridade: matriz.prioridade,
    }));
  };

  const copiarFilialParaMatriz = () => {
    if (!filial) return;
    setMatriz(prev => ({
      ...(prev || {
        id: -1, produtoId, lojaId: 1,
        produto: filial.produto,
        precoCartao: null, precoCartao3x: null, precoAvista: null, precoAvistaMinimo: null,
        quantidadeEstoque: 0, ativo: true, prioridade: 'verde',
      }),
      precoCartao: filial.precoCartao,
      precoCartao3x: filial.precoCartao3x,
      precoAvista: filial.precoAvista,
      precoAvistaMinimo: filial.precoAvistaMinimo,
      quantidadeEstoque: filial.quantidadeEstoque,
      ativo: filial.ativo,
      prioridade: filial.prioridade,
    }));
  };

  const handleSave = async () => {
    setSalvando(true);
    const updates: any = {};
    if (matriz && matriz.id !== -1) {
      updates.matriz = {
        id: matriz.id,
        precoCartao: matriz.precoCartao,
        precoCartao3x: matriz.precoCartao3x,
        precoAvista: matriz.precoAvista,
        precoAvistaMinimo: matriz.precoAvistaMinimo,
        quantidadeEstoque: matriz.quantidadeEstoque,
        ativo: matriz.ativo,
        prioridade: matriz.prioridade,
      };
    }
    if (filial && filial.id !== -1) {
      updates.filial = {
        id: filial.id,
        precoCartao: filial.precoCartao,
        precoCartao3x: filial.precoCartao3x,
        precoAvista: filial.precoAvista,
        precoAvistaMinimo: filial.precoAvistaMinimo,
        quantidadeEstoque: filial.quantidadeEstoque,
        ativo: filial.ativo,
        prioridade: filial.prioridade,
      };
    }
    await onSave(updates, dadosComuns);
    setSalvando(false);
    if (carregarCallback) carregarCallback();
    onClose();
  };

  return (
    // MUDANÇA: bottom sheet no mobile (items-end), modal centralizado no desktop (md:items-center)
    // Antes era só items-center sem adaptar ao mobile, ocupava muito espaço e era difícil de usar
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-4xl rounded-t-2xl md:rounded-2xl flex flex-col max-h-[92dvh]">

        {/* Header fixo — SKU + nome do produto, botão fechar */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-xs text-slate-400 font-mono leading-none mb-0.5">{dadosComuns.sku}</p>
            <h2 className="font-bold text-slate-900 text-base leading-tight truncate">{dadosComuns.nome}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="overflow-y-auto flex-1 p-4 md:p-6 space-y-5">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Carregando dados das lojas...</div>
          ) : (
            <>
              {/* Seção: Dados gerais do produto */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dados Gerais</h3>
                {/* MUDANÇA: grid 2 cols no mobile, 4 cols no desktop — antes era sempre 2/4 mas sem label */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>
                    <input type="text" value={dadosComuns.sku} onChange={e => setDadosComuns({...dadosComuns, sku: e.target.value})} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
                    <input type="text" value={dadosComuns.nome} onChange={e => setDadosComuns({...dadosComuns, nome: e.target.value})} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Marca</label>
                    <select value={dadosComuns.marca} onChange={e => setDadosComuns({...dadosComuns, marca: e.target.value})} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">Selecione...</option>
                      {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Amperagem</label>
                    <select value={dadosComuns.amperagem} onChange={e => setDadosComuns({...dadosComuns, amperagem: e.target.value})} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">Selecione...</option>
                      {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                    <select value={dadosComuns.tipo} onChange={e => setDadosComuns({...dadosComuns, tipo: e.target.value})} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">Selecione...</option>
                      {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">CCA</label>
                    <input type="text" value={dadosComuns.cca} onChange={e => setDadosComuns({...dadosComuns, cca: e.target.value})} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Ex: 500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Garantia</label>
                    <select value={dadosComuns.garantia} onChange={e => setDadosComuns({...dadosComuns, garantia: e.target.value})} className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">Selecione...</option>
                      {garantias.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Seção: Preços por loja */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Precos e Estoque por Loja</h3>

                {/* MUDANÇA: botões de cópia agora horizontais (lado a lado), embaixo do título da seção.
                    Antes ficavam em coluna vertical centralizada entre os dois blocos — confuso no mobile. */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={copiarMatrizParaFilial}
                    disabled={!matriz}
                    className="flex-1 flex items-center justify-center gap-2 border border-slate-300 rounded-xl py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 transition"
                  >
                    <ArrowLeftRight size={14} />
                    Matriz → Filial
                  </button>
                  <button
                    onClick={copiarFilialParaMatriz}
                    disabled={!filial}
                    className="flex-1 flex items-center justify-center gap-2 border border-slate-300 rounded-xl py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 disabled:opacity-40 transition"
                  >
                    <ArrowLeftRight size={14} className="rotate-180" />
                    Filial → Matriz
                  </button>
                </div>

                {/* MUDANÇA: grid sm:grid-cols-2 — lojas ficam lado a lado a partir de 640px.
                    No mobile empilham mas cada bloco é compacto com grid 2x2 de preços. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BlocoLoja
                    titulo="Matriz Artemia"
                    cor="blue"
                    dados={matriz}
                    onChange={setMatriz}
                    onCriar={() => criarRegistroLoja(1)}
                  />
                  <BlocoLoja
                    titulo="Filial Iguatemi"
                    cor="green"
                    dados={filial}
                    onChange={setFilial}
                    onCriar={() => criarRegistroLoja(2)}
                  />
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer fixo — ações principais */}
        <div className="flex gap-3 p-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 px-4 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={salvando || loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Check size={15} />
            {salvando ? 'Salvando...' : 'Salvar Alteracoes'}
          </button>
        </div>
      </div>
    </div>
  );
}
