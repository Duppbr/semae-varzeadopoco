import { redirect, notFound } from 'next/navigation';
import { Package, AlertTriangle, Tag, Ruler } from 'lucide-react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { estoqueBaixo } from '@/lib/regras';
import AppShell from '@/components/AppShell';
import Historico from '@/components/Historico';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession()).isLoggedIn) redirect('/login');
  const { id } = await params;
  const p = await prisma.produto.findUnique({ where: { id }, include: { estoque: true, unidade: true, categoria: true } });
  if (!p) notFound();
  const saldo = p.estoque?.quantidade ?? 0;
  const baixo = estoqueBaixo(saldo, p.estoqueMinimo);

  return <AppShell title={p.nome} backHref="/estoque">
    <div className="space-y-4">
      {/* Saldo em destaque */}
      <div className={`rounded-2xl border p-5 shadow-sm ${baixo ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
        <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Package size={14} /> Saldo atual</p>
        <p className="flex items-end gap-2">
          <span className={`text-4xl font-extrabold leading-none ${saldo < 0 ? 'text-red-600' : baixo ? 'text-amber-700' : 'text-slate-900'}`}>{saldo}</span>
          <span className="text-lg font-medium text-slate-500">{p.unidade.abreviacao}</span>
        </p>
        {baixo && <p className="flex items-center gap-1.5 text-amber-700 text-sm font-medium mt-2"><AlertTriangle size={15} /> Estoque baixo (mínimo {p.estoqueMinimo} {p.unidade.abreviacao})</p>}
      </div>

      {/* Ficha do produto */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <Tag size={18} className="text-blue-500 shrink-0" />
          <div><p className="text-xs text-slate-500">Categoria</p><p className="font-medium text-slate-900">{p.categoria?.nome ?? '—'}</p></div>
        </div>
        <div className="p-4 flex items-center gap-3 border-t border-slate-100">
          <Ruler size={18} className="text-slate-400 shrink-0" />
          <div><p className="text-xs text-slate-500">Unidade · Estoque mínimo</p><p className="font-medium text-slate-900">{p.unidade.nome} ({p.unidade.abreviacao}) · mín. {p.estoqueMinimo}</p></div>
        </div>
      </div>

      <Historico produtoId={id} />
    </div>
  </AppShell>;
}
