'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Plus, PackagePlus, ChevronRight, Calendar } from 'lucide-react';

interface Entrada {
  id: string;
  numero: number;
  data: string;
  fornecedor: string | null;
  observacao: string | null;
  responsavel: { nome: string } | null;
  itens: { quantidade: number; produto: { nome: string }; unidade: { abreviacao: string } }[];
}

export default function EntradaPage() {
  const router = useRouter();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    fetch('/api/entrada?limit=50')
      .then((r) => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then((d) => { if (d) setEntradas(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const fmtData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <AppShell
      title="Entradas"
      actions={
        <Link href="/entrada/nova" className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-blue-700">
          <Plus size={16} /> Nova
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : entradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <PackagePlus size={28} className="text-blue-400" />
          </div>
          <p className="font-semibold text-slate-700">Nenhuma entrada registrada</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">Registre a chegada de mercadorias</p>
          <Link href="/entrada/nova" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm active:bg-blue-700">
            Registrar entrada
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entradas.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{e.numero}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={11} />
                      {fmtData(e.data)}
                    </span>
                  </div>
                  {e.fornecedor && <p className="font-semibold text-slate-900 mt-1 text-sm">{e.fornecedor}</p>}
                  {e.responsavel && <p className="text-xs text-slate-500 mt-0.5">Resp.: {e.responsavel.nome}</p>}
                </div>
                <div className="bg-blue-50 rounded-xl px-3 py-1.5 text-right">
                  <p className="text-xs text-blue-600 font-medium">{e.itens.length} item(ns)</p>
                </div>
              </div>
              {e.itens.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    {e.itens.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 truncate">{item.produto.nome}</span>
                        <span className="font-medium text-slate-900 ml-2 shrink-0">{item.quantidade} {item.unidade.abreviacao}</span>
                      </div>
                    ))}
                    {e.itens.length > 3 && (
                      <p className="text-xs text-slate-400">+ {e.itens.length - 3} produto(s) a mais</p>
                    )}
                  </div>
                </div>
              )}
              {e.observacao && (
                <p className="mt-2 text-xs text-slate-500 italic">"{e.observacao}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
