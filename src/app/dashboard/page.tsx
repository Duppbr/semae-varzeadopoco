'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  Package, PackageMinus, PackagePlus, Trash2,
  AlertTriangle, TrendingUp, ArrowRight, ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  totalProdutos: number;
  totalEstoque: number;
  produtosAbaixoMinimo: number;
  entradasHoje: number;
  saidasHoje: number;
  descartesMes: number;
  ultimasSaidas: { id: string; numero: number; data: string; escola: { nome: string }; status: string; _count: { itens: number } }[];
  alertasEstoque: { id: string; nome: string; unidade: { abreviacao: string }; estoque: { quantidade: number }; estoqueMinimo: number }[];
}

const statusColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [router]);

  const fmtData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  if (loading) return (
    <AppShell title="SEMAE – Início">
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
      </div>
    </AppShell>
  );

  return (
    <AppShell title="SEMAE – Início">
      <div className="space-y-5">
        {/* SEMAE header */}
        <div className="bg-blue-600 rounded-2xl p-5 text-white">
          <p className="text-blue-200 text-sm font-medium">Setor Municipal de Alimentação Escolar</p>
          <h2 className="text-xl font-bold mt-0.5">Várzea do Poço – BA</h2>
          <p className="text-blue-200 text-xs mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">Produtos ativos</span>
              <Package size={16} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{data?.totalProdutos ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">Total em estoque</span>
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{data?.totalEstoque?.toFixed(1) ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">Entradas hoje</span>
              <PackagePlus size={16} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{data?.entradasHoje ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">Saídas hoje</span>
              <PackageMinus size={16} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{data?.saidasHoje ?? 0}</p>
          </div>
        </div>

        {/* Alertas estoque baixo */}
        {(data?.produtosAbaixoMinimo ?? 0) > 0 && (
          <Link href="/estoque" className="block bg-orange-50 border border-orange-200 rounded-2xl p-4 active:bg-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-900 text-sm">Estoque baixo!</p>
                <p className="text-orange-700 text-xs">{data?.produtosAbaixoMinimo} produto(s) abaixo do mínimo</p>
              </div>
              <ArrowRight size={16} className="text-orange-500" />
            </div>
          </Link>
        )}

        {/* Ações rápidas */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 px-1">Ações rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/saida/nova" className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <PackageMinus size={22} className="text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Nova Saída</span>
            </Link>
            <Link href="/entrada/nova" className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <PackagePlus size={22} className="text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Nova Entrada</span>
            </Link>
            <Link href="/descarte/novo" className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Descarte</span>
            </Link>
            <Link href="/pedido-compra/novo" className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <ShoppingCart size={22} className="text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Pedido de Compra</span>
            </Link>
          </div>
        </div>

        {/* Últimas saídas */}
        {(data?.ultimasSaidas?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-slate-600">Últimas saídas</h3>
              <Link href="/saida" className="text-xs text-blue-600 font-medium">Ver todas</Link>
            </div>
            <div className="space-y-2">
              {data?.ultimasSaidas.map((s) => (
                <Link
                  key={s.id}
                  href={`/saida/${s.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 active:bg-slate-50 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <PackageMinus size={18} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{s.escola.nome}</p>
                    <p className="text-xs text-slate-500">Pedido #{s.numero} · {fmtData(s.data)} · {s._count.itens} item(ns)</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Alertas de estoque detalhado */}
        {(data?.alertasEstoque?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-slate-600">Alertas de estoque</h3>
              <Link href="/estoque" className="text-xs text-blue-600 font-medium">Ver estoque</Link>
            </div>
            <div className="space-y-2">
              {data?.alertasEstoque.slice(0, 5).map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-orange-200 p-4 flex items-center gap-3 shadow-sm">
                  <AlertTriangle size={16} className="text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{p.nome}</p>
                    <p className="text-xs text-slate-500">
                      Estoque: <span className="font-semibold text-orange-700">{p.estoque?.quantidade?.toFixed(1) ?? 0} {p.unidade.abreviacao}</span>
                      {p.estoqueMinimo > 0 && ` / Mín: ${p.estoqueMinimo} ${p.unidade.abreviacao}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-2" />
      </div>
    </AppShell>
  );
}
