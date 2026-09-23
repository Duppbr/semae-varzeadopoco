'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Search, X, Check } from 'lucide-react';

export interface ProdutoSeletor { id: string; nome: string; unidade: { abreviacao: string }; categoria?: { nome: string } | null }

// Classes completas por cor: o Tailwind so gera o que aparece escrito no codigo.
const ACENTO = {
  purple: { ring: 'focus:ring-purple-500', ativo: 'bg-purple-600 text-white border-purple-600', linha: 'hover:bg-purple-50 active:bg-purple-100', mais: 'text-purple-600', marcado: 'bg-purple-50', check: 'bg-purple-600' },
  blue: { ring: 'focus:ring-blue-500', ativo: 'bg-blue-600 text-white border-blue-600', linha: 'hover:bg-blue-50 active:bg-blue-100', mais: 'text-blue-600', marcado: 'bg-blue-50', check: 'bg-blue-600' },
  red: { ring: 'focus:ring-red-500', ativo: 'bg-red-600 text-white border-red-600', linha: 'hover:bg-red-50 active:bg-red-100', mais: 'text-red-600', marcado: 'bg-red-50', check: 'bg-red-600' },
  orange: { ring: 'focus:ring-orange-500', ativo: 'bg-orange-500 text-white border-orange-500', linha: 'hover:bg-orange-50 active:bg-orange-100', mais: 'text-orange-500', marcado: 'bg-orange-50', check: 'bg-orange-500' },
} as const;

// "acucar" encontra "Açúcar": a busca ignora acentos e maiusculas.
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Produto escolhido continua na lista, marcado; tocar de novo desmarca.
// Assim um toque errado fica visivel e se desfaz na hora.
export default function SeletorProdutos<T extends ProdutoSeletor>({ produtos, escolhidos, onEscolher, onRemover, detalhe, acento = 'blue', autoFocus = false }: {
  produtos: T[];
  escolhidos: string[];
  onEscolher: (produto: T) => void;
  onRemover?: (produto: T) => void;
  detalhe?: (produto: T) => ReactNode;
  acento?: keyof typeof ACENTO;
  autoFocus?: boolean;
}) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const cor = ACENTO[acento];
  const usados = useMemo(() => new Set(escolhidos), [escolhidos]);

  const categorias = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const p of produtos) {
      const nome = p.categoria?.nome || 'Sem categoria';
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    }
    return [...contagem.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [produtos]);

  const termo = normalizar(busca.trim());
  const lista = produtos.filter(p =>
    (!categoria || (p.categoria?.nome || 'Sem categoria') === categoria) &&
    (!termo || normalizar(p.nome).includes(termo)));

  const chip = (ativo: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${ativo ? cor.ativo : 'bg-white text-slate-600 border-slate-200 active:bg-slate-100'}`;

  return <div>
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." autoFocus={autoFocus}
        aria-label="Buscar produto"
        className={`w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 ${cor.ring} text-slate-900`} />
      {busca && <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 active:text-slate-600"><X size={16} /></button>}
    </div>

    {categorias.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1 mt-2 -mx-1 px-1" role="group" aria-label="Filtrar por categoria">
      <button type="button" className={chip(!categoria)} onClick={() => setCategoria('')}>Todas ({produtos.length})</button>
      {categorias.map(([nome, n]) => <button type="button" key={nome} className={chip(categoria === nome)}
        aria-pressed={categoria === nome} onClick={() => setCategoria(categoria === nome ? '' : nome)}>{nome} ({n})</button>)}
    </div>}

    <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
      {lista.length === 0 ? <div className="p-4 text-center">
        <p className="text-sm text-slate-500">Nenhum produto encontrado{categoria ? ` em ${categoria}` : ''}.</p>
        {(categoria || busca) && <button type="button" className="mt-1 text-sm text-slate-600 underline"
          onClick={() => { setCategoria(''); setBusca(''); }}>Limpar filtros</button>}
      </div> : lista.map(p => {
        const marcado = usados.has(p.id);
        return <button type="button" key={p.id} aria-pressed={marcado}
          onClick={() => marcado ? onRemover?.(p) : onEscolher(p)}
          className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 flex items-center gap-3 ${marcado ? cor.marcado : cor.linha}`}>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${marcado ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'}`}>{p.nome}</p>
            <p className="text-xs text-slate-500">{marcado ? 'Adicionado · toque para remover' : detalhe ? detalhe(p) : `${p.categoria?.nome ?? 'Sem categoria'} · ${p.unidade.abreviacao}`}</p>
          </div>
          {marcado
            ? <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white ${cor.check}`}><Check size={15} strokeWidth={3} /></span>
            : <span className={`font-bold text-lg shrink-0 w-6 text-center ${cor.mais}`}>+</span>}
        </button>;
      })}
    </div>
  </div>;
}
