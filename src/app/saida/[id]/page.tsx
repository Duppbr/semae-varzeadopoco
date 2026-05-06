'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Printer, CheckCircle, XCircle, Calendar, School } from 'lucide-react';

interface Saida {
  id: string; numero: number; data: string; status: string; recebedor: string | null; observacao: string | null;
  escola: { nome: string; tipo: string };
  responsavel: { nome: string; cargo: string | null } | null;
  itens: { id: string; quantidade: number; produto: { nome: string }; unidade: { abreviacao: string } }[];
}

const statusColors: Record<string, string> = { PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200', ENTREGUE: 'bg-green-100 text-green-800 border-green-200', CANCELADO: 'bg-red-100 text-red-800 border-red-200' };
const statusLabels: Record<string, string> = { PENDENTE: 'Pendente', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' };

export default function SaidaDetalhe() {
  const params = useParams();
  const router = useRouter();
  const [saida, setSaida] = useState<Saida | null>(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    fetch(`/api/saida/${params.id}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } if (r.status === 404) { router.push('/saida'); return null; } return r.json(); })
      .then(d => { if (d) setSaida(d); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const atualizarStatus = async (novoStatus: string) => {
    if (!saida) return;
    setAtualizando(true);
    await fetch(`/api/saida/${saida.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
    setSaida(prev => prev ? { ...prev, status: novoStatus } : null);
    setAtualizando(false);
  };

  const fmtData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) return <AppShell title="Saída" backHref="/saida"><div className="h-64 bg-white rounded-2xl animate-pulse" /></AppShell>;
  if (!saida) return null;

  return (
    <AppShell title={`Saída #${saida.numero}`} backHref="/saida"
      actions={
        <Link href={`/saida/${saida.id}/pdf`} target="_blank"
          className="flex items-center gap-1.5 bg-slate-800 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-slate-900">
          <Printer size={16} /> PDF
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Status badge */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${statusColors[saida.status]}`}>
          <span className="font-bold text-base">Status: {statusLabels[saida.status]}</span>
          {saida.status === 'PENDENTE' && (
            <div className="flex gap-2">
              <button disabled={atualizando} onClick={() => atualizarStatus('ENTREGUE')}
                className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
                <CheckCircle size={14} /> Entregue
              </button>
              <button disabled={atualizando} onClick={() => atualizarStatus('CANCELADO')}
                className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
                <XCircle size={14} /> Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <School size={18} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Escola / Creche</p>
              <p className="font-semibold text-slate-900">{saida.escola.nome} <span className="text-xs text-slate-400">({saida.escola.tipo})</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Data</p>
              <p className="font-medium text-slate-900">{fmtData(saida.data)}</p>
            </div>
          </div>
          {saida.responsavel && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Responsável SEMAE</p>
              <p className="font-medium text-slate-900">{saida.responsavel.nome}</p>
              {saida.responsavel.cargo && <p className="text-xs text-slate-500">{saida.responsavel.cargo}</p>}
            </div>
          )}
          {saida.recebedor && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Recebedor</p>
              <p className="font-medium text-slate-900">{saida.recebedor}</p>
            </div>
          )}
          {saida.observacao && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Observação</p>
              <p className="text-sm text-slate-700 italic">"{saida.observacao}"</p>
            </div>
          )}
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Produtos ({saida.itens.length})</h3>
          <div className="space-y-2">
            {saida.itens.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm text-slate-700">{it.produto.nome}</p>
                <span className="font-bold text-slate-900 text-sm">{it.quantidade} {it.unidade.abreviacao}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PDF button */}
        <Link href={`/saida/${saida.id}/pdf`} target="_blank"
          className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-bold text-base active:bg-slate-900 shadow-sm">
          <Printer size={20} /> Gerar PDF / Imprimir
        </Link>
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
