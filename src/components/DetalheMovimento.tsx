import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Printer, Calendar, User, Truck, FileText, Trash2, Package, ClipboardList, ChevronRight } from 'lucide-react';
import { getSession } from '@/lib/session';
import { buscarMovimento } from '@/lib/operacoes';
import { formatarData } from '@/lib/regras';
import AppShell from '@/components/AppShell';
import Historico from '@/components/Historico';

export default async function DetalheMovimento({ tipo, id }: { tipo: 'entrada' | 'descarte'; id: string }) {
  if (!(await getSession()).isLoggedIn) redirect('/login');
  const doc = await buscarMovimento(tipo, id);
  if (!doc) notFound();
  const ehEntrada = tipo === 'entrada';

  return <AppShell title={`${ehEntrada ? 'Entrada' : 'Descarte'} #${doc.numero}`} backHref={`/${tipo}`}
    actions={<Link href={`/${tipo}/${id}/pdf`} className="flex items-center gap-1.5 bg-slate-800 text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:bg-slate-900"><Printer size={16} /> PDF</Link>}>
    <div className="space-y-4">
      {/* Dados do documento */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <Calendar size={18} className="text-slate-400 shrink-0" />
          <div><p className="text-xs text-slate-500">Data</p><p className="font-medium text-slate-900">{formatarData(doc.data)}</p></div>
        </div>
        <div className="p-4 flex items-center gap-3 border-t border-slate-100">
          <User size={18} className="text-blue-500 shrink-0" />
          <div><p className="text-xs text-slate-500">Responsável</p><p className="font-medium text-slate-900">{doc.responsavel?.nome || '—'}</p></div>
        </div>
        {'fornecedor' in doc && doc.fornecedor && <div className="p-4 flex items-center gap-3 border-t border-slate-100">
          <Truck size={18} className="text-slate-400 shrink-0" />
          <div><p className="text-xs text-slate-500">Fornecedor</p><p className="font-medium text-slate-900">{doc.fornecedor}</p></div>
        </div>}
        {'motivo' in doc && doc.motivo && <div className="p-4 flex items-center gap-3 border-t border-slate-100">
          <Trash2 size={18} className="text-red-400 shrink-0" />
          <div><p className="text-xs text-slate-500">Motivo</p><p className="font-medium text-slate-900">{doc.motivo}</p></div>
        </div>}
        {'pedido' in doc && doc.pedido && <Link href={`/pedido-compra/${doc.pedido.id}`} className="p-4 flex items-center gap-3 border-t border-slate-100 active:bg-slate-50">
          <ClipboardList size={18} className="text-blue-500 shrink-0" />
          <div className="flex-1"><p className="text-xs text-slate-500">Pedido de origem</p><p className="font-medium text-blue-700">#{doc.pedido.numero}</p></div>
          <ChevronRight size={18} className="text-slate-300" />
        </Link>}
        {doc.observacao && <div className="p-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FileText size={13} /> Observação</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap italic">{doc.observacao}</p>
        </div>}
      </div>

      {/* Itens */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Package size={16} className="text-slate-400" /> Itens ({doc.itens.length})</h2>
        <div className="divide-y divide-slate-100">
          {doc.itens.map(i => <Link key={i.id} href={`/estoque/${i.produtoId}`} className="flex items-center gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-slate-50">
            <span className="text-sm text-slate-700 min-w-0 flex-1 truncate">{i.produto?.nome}</span>
            <span className="shrink-0 font-bold text-slate-900 text-sm">{i.quantidade} {i.unidade.abreviacao}</span>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
          </Link>)}
        </div>
      </div>

      <Link href={`/${tipo}/${id}/pdf`} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-bold text-base active:bg-slate-900 shadow-sm">
        <Printer size={20} /> Gerar PDF / Imprimir
      </Link>

      <Historico origemId={id} />
    </div>
  </AppShell>;
}
