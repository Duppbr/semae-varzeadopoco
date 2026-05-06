'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  BarChart2,
  PackageMinus,
  ShoppingCart,
  School,
  ArrowDownUp,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface RelatorioData {
  tipo: string;
  periodo: string;
  dados: any[];
}

const periodos = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Semana', value: 'semana' },
  { label: 'Quinzena', value: 'quinzena' },
  { label: 'Mês', value: 'mes' },
  { label: 'Trimestre', value: 'trimestre' },
  { label: 'Ano', value: 'ano' },
];

const tiposRelatorio = [
  {
    value: 'movimentacao-periodo',
    label: 'Movimentação do Período',
    descricao: 'Entradas, saídas e descartes',
    icon: ArrowDownUp,
    cor: 'text-blue-600 bg-blue-50',
  },
  {
    value: 'produtos-mais-usados',
    label: 'Produtos Mais Usados',
    descricao: 'Ranking de saídas por produto',
    icon: PackageMinus,
    cor: 'text-orange-600 bg-orange-50',
  },
  {
    value: 'produtos-mais-descartados',
    label: 'Produtos Mais Descartados',
    descricao: 'Ranking de descartes por produto',
    icon: PackageMinus,
    cor: 'text-red-600 bg-red-50',
  },
  {
    value: 'produtos-mais-comprados',
    label: 'Produtos Mais Comprados',
    descricao: 'Ranking de pedidos de compra',
    icon: ShoppingCart,
    cor: 'text-purple-600 bg-purple-50',
  },
  {
    value: 'saidas-por-escola',
    label: 'Saídas por Escola',
    descricao: 'Total distribuído por unidade',
    icon: School,
    cor: 'text-green-600 bg-green-50',
  },
  {
    value: 'estoque-atual',
    label: 'Estoque Atual',
    descricao: 'Quantidade atual de cada produto',
    icon: Package,
    cor: 'text-slate-600 bg-slate-100',
  },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-full mb-2" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
  );
}

function MovimentacaoResult({ dados }: { dados: any[] }) {
  const item = dados[0] || {};
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-green-200 p-4 text-center shadow-sm">
        <p className="text-xs text-green-600 font-semibold uppercase mb-1">Entradas</p>
        <p className="text-3xl font-bold text-green-700">{item.entradas ?? 0}</p>
        <p className="text-xs text-slate-500 mt-1">itens</p>
      </div>
      <div className="bg-white rounded-2xl border border-orange-200 p-4 text-center shadow-sm">
        <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Saídas</p>
        <p className="text-3xl font-bold text-orange-600">{item.saidas ?? 0}</p>
        <p className="text-xs text-slate-500 mt-1">itens</p>
      </div>
      <div className="bg-white rounded-2xl border border-red-200 p-4 text-center shadow-sm">
        <p className="text-xs text-red-600 font-semibold uppercase mb-1">Descartes</p>
        <p className="text-3xl font-bold text-red-600">{item.descartes ?? 0}</p>
        <p className="text-xs text-slate-500 mt-1">itens</p>
      </div>
    </div>
  );
}

function RankingList({ dados, unidadeKey = 'unidade' }: { dados: any[]; unidadeKey?: string }) {
  if (dados.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <BarChart2 size={28} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">Nenhum dado para o período selecionado</p>
      </div>
    );
  }
  const max = Math.max(...dados.map((d: any) => d.total ?? d.quantidade ?? 0));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {dados.map((d: any, idx: number) => {
        const val = d.total ?? d.quantidade ?? 0;
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={idx} className="px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{d.nome || d.produto}</p>
                {d[unidadeKey] && (
                  <p className="text-xs text-slate-500">{d[unidadeKey]}</p>
                )}
                <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900 shrink-0">{val}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EscolaList({ dados }: { dados: any[] }) {
  if (dados.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <School size={28} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">Nenhuma saída no período</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {dados.map((d: any, idx: number) => (
        <div key={idx} className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 text-sm">{d.escola || d.nome}</p>
            {d.tipo && <p className="text-xs text-slate-500">{d.tipo}</p>}
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-900 text-sm">{d.total ?? d.quantidade ?? 0}</span>
            <p className="text-xs text-slate-500">itens</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EstoqueTable({ dados }: { dados: any[] }) {
  if (dados.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Package size={28} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">Nenhum produto cadastrado</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {dados.map((d: any, idx: number) => {
        const qtd = d.quantidade ?? d.estoque ?? 0;
        const minimo = d.estoqueMinimo ?? d.minimo ?? 0;
        const baixo = qtd <= minimo && minimo > 0;
        return (
          <div
            key={idx}
            className={`px-4 py-3 border-b border-slate-100 last:border-0 flex items-center justify-between ${baixo ? 'bg-red-50' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900 text-sm truncate">{d.nome || d.produto}</p>
                {baixo && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
              </div>
              {d.categoria && <p className="text-xs text-slate-500">{d.categoria}</p>}
            </div>
            <div className="text-right ml-2 shrink-0">
              <span className={`font-bold text-sm ${baixo ? 'text-red-600' : 'text-slate-900'}`}>
                {qtd}
              </span>
              <span className="text-xs text-slate-500 ml-1">{d.unidade || d.abreviacao || ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState('mes');
  const [tipo, setTipo] = useState('movimentacao-periodo');
  const [resultado, setResultado] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(false);

  const buscarRelatorio = useCallback(async () => {
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/relatorios?tipo=${tipo}&periodo=${periodo}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (res.ok) {
        const d = await res.json();
        setResultado(d);
      }
    } finally {
      setLoading(false);
    }
  }, [tipo, periodo, router]);

  useEffect(() => {
    buscarRelatorio();
  }, [buscarRelatorio]);

  const renderResultado = () => {
    if (!resultado || !resultado.dados) return null;
    const dados = resultado.dados;

    if (dados.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <BarChart2 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">Sem dados para o período</p>
          <p className="text-sm text-slate-400 mt-1">Tente selecionar um período diferente</p>
        </div>
      );
    }

    switch (tipo) {
      case 'movimentacao-periodo':
        return <MovimentacaoResult dados={dados} />;
      case 'produtos-mais-usados':
      case 'produtos-mais-descartados':
      case 'produtos-mais-comprados':
        return <RankingList dados={dados} />;
      case 'saidas-por-escola':
        return <EscolaList dados={dados} />;
      case 'estoque-atual':
        return <EstoqueTable dados={dados} />;
      default:
        return null;
    }
  };

  const tipoAtual = tiposRelatorio.find(t => t.value === tipo);

  return (
    <AppShell title="Relatórios">
      <div className="space-y-4">
        {/* Seletor de período */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Período</p>
          <div className="flex gap-2 flex-wrap">
            {periodos.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`text-sm font-semibold px-3 py-2 rounded-xl border transition-colors ${
                  periodo === p.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de tipo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Tipo de Relatório</p>
          <div className="grid grid-cols-2 gap-2">
            {tiposRelatorio.map(t => (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                  tipo === t.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.cor}`}>
                  <t.icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold leading-tight ${tipo === t.value ? 'text-blue-700' : 'text-slate-800'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{t.descricao}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resultado */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {tipoAtual && (
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tipoAtual.cor}`}>
                <tipoAtual.icon size={14} />
              </div>
            )}
            <p className="font-semibold text-slate-800">{tipoAtual?.label}</p>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {periodos.find(p => p.value === periodo)?.label}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            renderResultado()
          )}
        </div>

        <div className="h-2" />
      </div>
    </AppShell>
  );
}
