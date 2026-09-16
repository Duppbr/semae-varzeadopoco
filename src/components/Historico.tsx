'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, ArrowUpCircle, ArrowDownCircle, ClipboardList, FileClock } from 'lucide-react';
import { requisitar } from '@/lib/http-client';
import { formatarData } from '@/lib/regras';
interface Evento { id: string; produtoNome: string; tipo: string; quantidade: number; saldo: number | null; unidade: string;
  data: string; createdAt: string; usuarioNome: string; origemId: string; numero: number | null; pedidoId: string | null; motivo: string | null }
interface Resultado { movimentos: Evento[]; mais: boolean; auditorias: { id: string; createdAt: string; resumo: string; usuarioNome: string | null }[] }

const tipoLabel: Record<string, string> = { entrada: 'Entrada', saida: 'Saída', descarte: 'Descarte', ajuste: 'Ajuste' };

export default function Historico({ produtoId, origemId }: { produtoId?: string; origemId?: string }) {
  const [dados, setDados] = useState<Resultado>();
  const [erro, setErro] = useState('');
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    requisitar<Resultado>(`/api/historico?${new URLSearchParams({ ...(produtoId ? { produtoId } : { origemId: origemId! }), offset: String(offset) })}`,
      { signal: controller.signal }).then(setDados).catch(e => { if (!controller.signal.aborted) setErro(e.message); });
    return () => controller.abort();
  }, [produtoId, origemId, offset]);

  const vazio = dados && !dados.movimentos.length && !dados.auditorias.length;

  return <section className="mt-5">
    <div className="flex items-center gap-2 mb-3">
      <History size={18} className="text-slate-400" />
      <h2 className="text-base font-semibold text-slate-800">Histórico</h2>
    </div>
    {erro && <p role="alert" className="text-red-700 text-sm mb-2">{erro}</p>}
    {!dados && !erro && <div className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />}
    {dados && !vazio && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
      {dados.movimentos.map(m => {
        const pos = m.quantidade > 0;
        return <div key={m.id} className="p-4 flex gap-3">
          <div className={`shrink-0 mt-0.5 ${pos ? 'text-green-500' : 'text-red-500'}`}>
            {pos ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-slate-900 truncate">{m.produtoNome}</p>
              <span className={`shrink-0 font-bold text-sm ${pos ? 'text-green-600' : 'text-red-600'}`}>{pos ? '+' : ''}{m.quantidade} {m.unidade}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {tipoLabel[m.tipo] ?? m.tipo}{m.numero ? ` #${m.numero}` : ''} · {formatarData(m.data)}
              {m.saldo != null && <> · Saldo: <span className="font-medium text-slate-700">{m.saldo} {m.unidade}</span></>}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {new Date(m.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {m.usuarioNome}
            </p>
            {m.motivo && <p className="text-xs text-slate-600 mt-1">Motivo: {m.motivo}</p>}
            {m.pedidoId && <Link className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium mt-1" href={`/pedido-compra/${m.pedidoId}`}><ClipboardList size={13} /> Ver pedido de origem</Link>}
          </div>
        </div>;
      })}
      {dados.auditorias.map(a => <div key={a.id} className="p-4 flex gap-3 bg-slate-50/60">
        <div className="shrink-0 mt-0.5 text-slate-300"><FileClock size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-700">{a.resumo}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{new Date(a.createdAt).toLocaleString('pt-BR')} · {a.usuarioNome || 'Sistema'}</p>
        </div>
      </div>)}
    </div>}
    {vazio && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-sm text-slate-400">Nenhum registro encontrado.</div>}
    {(offset > 0 || dados?.mais) && <div className="flex gap-2 mt-3">
      {offset > 0 && <button className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 active:bg-slate-50" onClick={() => setOffset(offset - 50)}>← Mais recentes</button>}
      {dados?.mais && <button className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 active:bg-slate-50" onClick={() => setOffset(offset + 50)}>Mais antigos →</button>}
    </div>}
  </section>;
}
