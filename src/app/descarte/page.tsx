'use client';

import { useEffect, useState } from 'react';
import { requisitar } from '@/lib/http-client';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Plus, Trash2, Calendar } from 'lucide-react';

interface Descarte {
  id: string; numero: number; data: string; motivo: string; observacao: string | null;
  responsavel: { nome: string } | null;
  itens: { quantidade: number; produto: { nome: string }; unidade: { abreviacao: string } }[];
}

const motivoLabels: Record<string, string> = {
  VENCIMENTO: 'Vencimento', DETERIORACAO: 'Deterioração', DANO: 'Dano físico', CONTAMINACAO: 'Contaminação', OUTRO: 'Outro',
};

export default function DescartePage() {
  const [descartes, setDescartes] = useState<Descarte[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    requisitar<Descarte[]>('/api/descarte?limit=50', { signal: controller.signal })
      .then(d => { if (d) setDescartes(d); })
      .catch(e => { if (!controller.signal.aborted) setErro(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const fmtData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <AppShell title="Descartes"
      actions={
        <Link href="/descarte/novo" className="flex items-center gap-1.5 bg-red-500 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-red-600">
          <Plus size={16} /> Novo
        </Link>
      }
    >
      {erro && <p role="alert" className="text-red-700">{erro}</p>}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : descartes.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Trash2 size={28} className="text-red-400" />
          </div>
          <p className="font-semibold text-slate-700">Nenhum descarte registrado</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">Registre produtos danificados ou vencidos</p>
          <Link href="/descarte/novo" className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold text-sm">Registrar descarte</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {descartes.map(d => (
            <Link href={`/descarte/${d.id}`} key={d.id} className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">#{d.numero}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Calendar size={11} />{fmtData(d.data)}</span>
                  </div>
                  <p className="font-semibold text-slate-900 mt-1">{motivoLabels[d.motivo] || d.motivo}</p>
                  {d.responsavel && <p className="text-xs text-slate-500">Resp.: {d.responsavel.nome}</p>}
                </div>
                <span className="bg-red-50 text-red-600 text-xs font-medium px-3 py-1 rounded-full">{d.itens.length} item(ns)</span>
              </div>
              {d.itens.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {d.itens.slice(0, 3).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-600 truncate">{it.produto.nome}</span>
                      <span className="font-medium text-slate-900 ml-2 shrink-0">{it.quantidade} {it.unidade.abreviacao}</span>
                    </div>
                  ))}
                  {d.itens.length > 3 && <p className="text-xs text-slate-400">+ {d.itens.length - 3} produto(s)</p>}
                </div>
              )}
              {d.observacao && <p className="mt-2 text-xs text-slate-500 italic">{d.observacao}</p>}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
