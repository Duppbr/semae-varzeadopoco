'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Printer, CheckCircle, XCircle, Calendar, Send, School } from 'lucide-react';

interface PedidoCompra {
  id: string;
  numero: number;
  data: string;
  status: string;
  observacao: string | null;
  escola: { nome: string; tipo: string } | null;
  responsavel: { nome: string; cargo: string | null } | null;
  itens: {
    id: string;
    quantidade: number;
    produto: { nome: string };
    unidade: { abreviacao: string };
  }[];
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

export default function PedidoCompraDetalhe() {
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<PedidoCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    fetch(`/api/pedido-compra/${params.id}`)
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        if (r.status === 404) { router.push('/pedido-compra'); return null; }
        return r.json();
      })
      .then(d => { if (d) setPedido(d); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const atualizarStatus = async (novoStatus: string) => {
    if (!pedido) return;
    setAtualizando(true);
    const res = await fetch(`/api/pedido-compra/${pedido.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
    if (res.ok) {
      setPedido(prev => prev ? { ...prev, status: novoStatus } : null);
    }
    setAtualizando(false);
  };

  const fmtData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return (
      <AppShell title="Pedido de Compra" backHref="/pedido-compra">
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </AppShell>
    );
  }
  if (!pedido) return null;

  return (
    <AppShell
      title={`Pedido #${pedido.numero.toString().padStart(4, '0')}`}
      backHref="/pedido-compra"
      actions={
        <Link
          href={`/pedido-compra/${pedido.id}/pdf`}
          target="_blank"
          className="flex items-center gap-1.5 bg-slate-800 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-slate-900"
        >
          <Printer size={16} /> PDF
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Status */}
        <div className={`border rounded-2xl p-4 flex items-start justify-between gap-3 ${statusColors[pedido.status]}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">Status</p>
            <span className="font-bold text-base">{statusLabels[pedido.status]}</span>
          </div>
          {pedido.status === 'RASCUNHO' && (
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                disabled={atualizando}
                onClick={() => atualizarStatus('ENVIADO')}
                className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
              >
                <Send size={13} /> Enviar
              </button>
              <button
                disabled={atualizando}
                onClick={() => atualizarStatus('CANCELADO')}
                className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
              >
                <XCircle size={13} /> Cancelar
              </button>
            </div>
          )}
          {pedido.status === 'ENVIADO' && (
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                disabled={atualizando}
                onClick={() => atualizarStatus('ATENDIDO')}
                className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
              >
                <CheckCircle size={13} /> Marcar Atendido
              </button>
              <button
                disabled={atualizando}
                onClick={() => atualizarStatus('CANCELADO')}
                className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
              >
                <XCircle size={13} /> Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <School size={18} className="text-purple-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Escola / Destino</p>
              <p className="font-semibold text-slate-900">
                {pedido.escola ? (
                  <>
                    {pedido.escola.nome}{' '}
                    <span className="text-xs text-slate-400">({pedido.escola.tipo})</span>
                  </>
                ) : (
                  'Geral / SEMAE'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Data</p>
              <p className="font-medium text-slate-900">{fmtData(pedido.data)}</p>
            </div>
          </div>

          {pedido.responsavel && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Responsável SEMAE</p>
              <p className="font-medium text-slate-900">{pedido.responsavel.nome}</p>
              {pedido.responsavel.cargo && (
                <p className="text-xs text-slate-500">{pedido.responsavel.cargo}</p>
              )}
            </div>
          )}

          {pedido.observacao && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Observação</p>
              <p className="text-sm text-slate-700 italic">"{pedido.observacao}"</p>
            </div>
          )}
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Produtos ({pedido.itens.length})</h3>
          <div className="space-y-2">
            {pedido.itens.map(it => (
              <div
                key={it.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <p className="text-sm text-slate-700">{it.produto.nome}</p>
                <span className="font-bold text-slate-900 text-sm ml-2 shrink-0">
                  {it.quantidade} {it.unidade.abreviacao}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PDF button */}
        <Link
          href={`/pedido-compra/${pedido.id}/pdf`}
          target="_blank"
          className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-bold text-base active:bg-slate-900 shadow-sm"
        >
          <Printer size={20} /> Gerar PDF / Imprimir
        </Link>
        <div className="h-2" />
      </div>
    </AppShell>
  );
}
