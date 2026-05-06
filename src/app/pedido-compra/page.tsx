'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Plus, ShoppingCart, Calendar } from 'lucide-react';

interface PedidoCompra {
  id: string;
  numero: number;
  data: string;
  status: string;
  escola: { nome: string };
  responsavel: { nome: string } | null;
  itens: { quantidade: number; produto: { nome: string }; unidade: { abreviacao: string } }[];
}

const statusColors: Record<string, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-700 border-slate-200',
  ENVIADO: 'bg-blue-100 text-blue-800 border-blue-200',
  ATENDIDO: 'bg-green-100 text-green-800 border-green-200',
  CANCELADO: 'bg-red-100 text-red-800 border-red-200',
};
const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado',
  ATENDIDO: 'Atendido',
  CANCELADO: 'Cancelado',
};

const filtros = [
  { label: 'Todos', value: '' },
  { label: 'Rascunho', value: 'RASCUNHO' },
  { label: 'Enviado', value: 'ENVIADO' },
  { label: 'Atendido', value: 'ATENDIDO' },
  { label: 'Cancelado', value: 'CANCELADO' },
];

export default function PedidoCompraPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    const qs = filtroStatus ? `?status=${filtroStatus}` : '';
    fetch(`/api/pedido-compra${qs}`)
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then(d => { if (d) setPedidos(d); })
      .finally(() => setLoading(false));
  }, [filtroStatus]);

  const fmtData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <AppShell
      title="Pedidos de Compra"
      actions={
        <Link
          href="/pedido-compra/novo"
          className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-purple-700"
        >
          <Plus size={16} /> Novo
        </Link>
      }
    >
      {/* Filtros */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filtros.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroStatus(f.value)}
            className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${
              filtroStatus === f.value
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
            <ShoppingCart size={28} className="text-purple-400" />
          </div>
          <p className="font-semibold text-slate-700">Nenhum pedido encontrado</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">Crie um pedido de compra para o SEMAE</p>
          <Link
            href="/pedido-compra/novo"
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm"
          >
            Criar pedido
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map(p => (
            <Link
              key={p.id}
              href={`/pedido-compra/${p.id}`}
              className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active:bg-slate-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      #{p.numero.toString().padStart(4, '0')}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 truncate">
                    {p.escola?.nome || 'Geral / SEMAE'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={11} />{fmtData(p.data)}
                    </span>
                    {p.responsavel && (
                      <span className="text-xs text-slate-400">· {p.responsavel.nome}</span>
                    )}
                  </div>
                </div>
                <div className="bg-slate-100 rounded-xl px-3 py-1.5 ml-2 shrink-0">
                  <p className="text-xs text-slate-600 font-medium">{p.itens.length} item(ns)</p>
                </div>
              </div>
              {p.itens.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {p.itens.slice(0, 2).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-600 truncate">{it.produto.nome}</span>
                      <span className="font-medium text-slate-900 ml-2 shrink-0">
                        {it.quantidade} {it.unidade.abreviacao}
                      </span>
                    </div>
                  ))}
                  {p.itens.length > 2 && (
                    <p className="text-xs text-slate-400">+ {p.itens.length - 2} produto(s)</p>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
