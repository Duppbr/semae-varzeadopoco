'use client';

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Activity, AlertCircle, CheckCircle2, Clock, Search, ShieldAlert } from 'lucide-react';

type LogAuditoria = {
  id: number;
  usuarioNome: string | null;
  usuarioIdentificador: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  status: string;
  resumo: string;
  detalhes: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

function parseDispositivo(ua: string | null): string {
  if (!ua) return '';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let os = '';
  if (/Android/i.test(ua)) { const m = ua.match(/Android ([\d.]+)/); os = m ? `Android ${m[1]}` : 'Android'; }
  else if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Windows NT 10/i.test(ua)) os = 'Windows 10';
  else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  let browser = '';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) { const m = ua.match(/Chrome\/([\d]+)/); browser = m ? `Chrome ${m[1]}` : 'Chrome'; }
  else if (/Firefox\//i.test(ua)) { const m = ua.match(/Firefox\/([\d]+)/); browser = m ? `Firefox ${m[1]}` : 'Firefox'; }
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  const tipo = isMobile ? 'Celular' : 'Computador';
  return [tipo, os, browser].filter(Boolean).join(' · ');
}

const statusClass: Record<string, string> = {
  sucesso: 'bg-emerald-50 text-emerald-700',
  erro: 'bg-red-50 text-red-700',
  parcial: 'bg-amber-50 text-amber-700',
  info: 'bg-blue-50 text-blue-700',
};

export default function AdminLogsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');

  const carregarLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (buscaUsuario) params.set('usuario', buscaUsuario);
    if (filtroStatus) params.set('status', filtroStatus);
    if (filtroAcao) params.set('acao', filtroAcao);
    params.set('take', '150');

    const res = await fetch(`/api/admin/logs?${params.toString()}`);
    if (res.ok) {
      setLogs(await res.json());
    }
    setLoading(false);
  }, [buscaUsuario, filtroStatus, filtroAcao]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    if (!user.protegido) return;
    // Logs are intentionally loaded after confirming the current user is the master admin.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarLogs();
  }, [user, userLoading, router, carregarLogs]);

  const resumo = useMemo(() => ({
    total: logs.length,
    sucesso: logs.filter(log => log.status === 'sucesso').length,
    erros: logs.filter(log => log.status === 'erro').length,
    parciais: logs.filter(log => log.status === 'parcial').length,
  }), [logs]);

  const acoes = useMemo(() => [...new Set(logs.map(log => log.acao))].sort(), [logs]);

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  if (!user?.protegido) {
    return (
      <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 text-amber-700">
          <ShieldAlert size={24} />
          <h1 className="text-xl font-bold">Area restrita ao admin master</h1>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Estes logs mostram entradas, alteracoes e importacoes. Por seguranca, apenas o usuario protegido consegue acessar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Logs e auditoria</h1>
        <p className="text-sm text-slate-500">Veja quem entrou, quando entrou e quais alteracoes foram feitas.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResumoCard titulo="Eventos" valor={resumo.total} icon={Activity} />
        <ResumoCard titulo="Sucessos" valor={resumo.sucesso} icon={CheckCircle2} />
        <ResumoCard titulo="Erros" valor={resumo.erros} icon={AlertCircle} />
        <ResumoCard titulo="Parciais" valor={resumo.parciais} icon={Clock} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_auto] md:items-center">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={buscaUsuario}
              onChange={e => setBuscaUsuario(e.target.value)}
              placeholder="Buscar por usuario ou ID"
              className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos status</option>
            <option value="sucesso">Sucesso</option>
            <option value="parcial">Parcial</option>
            <option value="erro">Erro</option>
            <option value="info">Info</option>
          </select>
          <select
            value={filtroAcao}
            onChange={e => setFiltroAcao(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todas acoes</option>
            {acoes.map(acao => <option key={acao} value={acao}>{acao}</option>)}
          </select>
          <button onClick={carregarLogs} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Atualizar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map(log => (
          <article key={log.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[log.status] || 'bg-slate-100 text-slate-700'}`}>
                    {log.status}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{log.acao}</span>
                  <span className="text-xs text-slate-400">{log.entidade}{log.entidadeId ? ` #${log.entidadeId}` : ''}</span>
                </div>
                <h2 className="font-semibold text-slate-950 mt-2">{log.resumo}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {log.usuarioNome || 'Sistema'} {log.usuarioIdentificador ? `(${log.usuarioIdentificador})` : ''}
                </p>
                {(log.ip || log.userAgent) && (
                  <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    {log.ip && <span>IP: {log.ip}</span>}
                    {parseDispositivo(log.userAgent) && <span>{parseDispositivo(log.userAgent)}</span>}
                  </p>
                )}
              </div>
              <time className="text-xs text-slate-500 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString('pt-BR')}
              </time>
            </div>
            {log.detalhes ? (
              <details className="mt-3">
                <summary className="text-sm text-blue-700 cursor-pointer font-medium">Ver detalhes</summary>
                <pre className="mt-2 bg-slate-950 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(log.detalhes, null, 2)}
                </pre>
              </details>
            ) : null}
          </article>
        ))}

        {logs.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Nenhum log encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

function ResumoCard({ titulo, valor, icon: Icon }: { titulo: string; valor: number; icon: ElementType }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">{titulo}</p>
          <p className="text-2xl font-bold text-slate-950 mt-1">{valor}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
