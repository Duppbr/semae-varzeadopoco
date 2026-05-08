'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Plus, PackageMinus, Calendar } from 'lucide-react';

interface Saida {
  id: string; numero: number; data: string; status: string;
  escola: { nome: string };
  responsavel: { nome: string } | null;
  itens: { quantidade: number; produto: { nome: string }; unidade: { abreviacao: string } }[];
}

const statusColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};
const statusLabels: Record<string, string> = { PENDENTE: 'Pendente', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' };

export default function SaidaPage() {
  const router = useRouter();
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');

  const carregar = () => {
    const qs = filtroStatus ? `?status=${filtroStatus}&limit=50` : '?limit=50';
    fetch(`/api/saida${qs}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setSaidas(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); carregar(); }, [filtroStatus]);

  const fmtData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <AppShell title="Saídas"
      actions={
        <Link href="/saida/nova" className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-orange-600">
          <Plus size={16} /> Nova
        </Link>
      }
    >
      {/* Filtros */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['', 'PENDENTE', 'ENTREGUE', 'CANCELADO'].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)}
            className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${filtroStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
            {s === '' ? 'Todas' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : saidas.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
            <PackageMinus size={28} className="text-orange-400" />
          </div>
          <p className="font-semibold text-slate-700">Nenhuma saída registrada</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">Crie uma saída para uma escola</p>
          <Link href="/saida/nova" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold text-sm">Criar saída</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saidas.map(s => (
            <Link key={s.id} href={`/saida/${s.id}`}
              className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active:bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">#{s.numero}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>{statusLabels[s.status]}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{s.escola.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Calendar size={11} />{fmtData(s.data)}</span>
                    {s.responsavel && <span className="text-xs text-slate-400">· {s.responsavel.nome}</span>}
                  </div>
                </div>
                <div className="bg-slate-100 rounded-xl px-3 py-1.5">
                  <p className="text-xs text-slate-600 font-medium">{s.itens.length} item(ns)</p>
                </div>
              </div>
              {s.itens.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {s.itens.slice(0, 2).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-600 truncate">{it.produto.nome}</span>
                      <span className="font-medium text-slate-900 ml-2 shrink-0">{it.quantidade} {it.unidade.abreviacao}</span>
                    </div>
                  ))}
                  {s.itens.length > 2 && <p className="text-xs text-slate-400">+ {s.itens.length - 2} produto(s)</p>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
