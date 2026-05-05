'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { AlertTriangle } from 'lucide-react';

export default function BackupPage() {
  const { user } = useUser();
  const [aba, setAba] = useState<'exportar' | 'restaurar'>('exportar');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [statusOperacao, setStatusOperacao] = useState<'idle' | 'processando' | 'sucesso' | 'erro'>('idle');

  const [restoreProdutos, setRestoreProdutos] = useState(true);
  const [restoreEstoqueMatriz, setRestoreEstoqueMatriz] = useState(false);
  const [restoreEstoqueFilial, setRestoreEstoqueFilial] = useState(false);
  const [restorePrecosMatriz, setRestorePrecosMatriz] = useState(false);
  const [restorePrecosFilial, setRestorePrecosFilial] = useState(false);
  const [restorePrioridadeMatriz, setRestorePrioridadeMatriz] = useState(false);
  const [restorePrioridadeFilial, setRestorePrioridadeFilial] = useState(false);
  const [restoreOpcoes, setRestoreOpcoes] = useState(false);
  const [restoreAtalhos, setRestoreAtalhos] = useState(false);
  const [resetCompleto, setResetCompleto] = useState(false);
  const [confirmarReset, setConfirmarReset] = useState('');

  const exportarBackup = async () => {
    setLoading(true);
    setStatusOperacao('processando');
    setMensagem('Gerando arquivo de backup...');
    try {
      const res = await fetch('/api/admin/backup/export');
      if (!res.ok) throw new Error('Erro ao exportar');
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-rios-baterias-v2-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const r = json.resumo ?? {};
      setMensagem(`Backup exportado! ${r.produtos ?? 0} produtos · ${r.opcoes ?? 0} opções · ${r.atalhos ?? 0} atalhos`);
      setStatusOperacao('sucesso');
    } catch {
      setMensagem('Erro ao exportar backup. Verifique se está conectado ao banco de dados.');
      setStatusOperacao('erro');
    }
    setLoading(false);
  };

  const restaurarBackup = async () => {
    if (!file) return;
    if (resetCompleto && confirmarReset !== 'RESETAR') {
      setMensagem('Para reset completo, escreva RESETAR no campo de confirmação.');
      setStatusOperacao('erro');
      return;
    }
    setLoading(true);
    setStatusOperacao('processando');
    setMensagem(resetCompleto ? 'Executando reset completo e restaurando...' : 'Restaurando backup...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('opcoes', JSON.stringify({
      produtos: restoreProdutos,
      estoqueMatriz: restoreEstoqueMatriz,
      estoqueFilial: restoreEstoqueFilial,
      precosMatriz: restorePrecosMatriz,
      precosFilial: restorePrecosFilial,
      prioridadeMatriz: restorePrioridadeMatriz,
      prioridadeFilial: restorePrioridadeFilial,
      opcoes: restoreOpcoes,
      atalhos: restoreAtalhos,
      resetCompleto,
    }));

    const res = await fetch('/api/admin/backup/restore', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || data.erro) {
      setMensagem(data.erro || 'Erro ao restaurar backup.');
      setStatusOperacao('erro');
    } else {
      setMensagem(data.mensagem || 'Restauração concluída.');
      setStatusOperacao('sucesso');
      setConfirmarReset('');
      setResetCompleto(false);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Backup e restauração</h1>
        <p className="text-sm text-slate-500">Exporte ou restaure dados com registro em auditoria.</p>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${aba === 'exportar' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          onClick={() => setAba('exportar')}
        >
          Exportar Backup
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${aba === 'restaurar' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          onClick={() => setAba('restaurar')}
        >
          Restaurar Backup
        </button>
      </div>

      {aba === 'exportar' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">O arquivo inclui:</p>
            <ul className="text-sm text-slate-500 space-y-1 ml-4 list-disc">
              <li>Todos os produtos (SKU, nome, marca, amperagem, tipo, CCA, garantia)</li>
              <li>Preços, estoque e prioridade por loja (Matriz e Filial)</li>
              <li>Opções do sistema (amperagem, tipo, marca, garantia)</li>
              <li>Atalhos de consulta rápida</li>
            </ul>
          </div>
          <button
            onClick={exportarBackup}
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition"
          >
            {loading ? 'Gerando...' : '⬇ Baixar Backup Completo'}
          </button>
        </div>
      )}

      {aba === 'restaurar' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
          <div>
            <p className="text-sm text-slate-600 mb-3">Envie o arquivo .json e escolha o que restaurar. Produtos inexistentes serão criados automaticamente.</p>
            <input
              type="file"
              accept=".json"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="border border-slate-300 p-2 rounded-lg text-sm block w-full md:w-auto"
            />
            {file && <p className="text-xs text-slate-400 mt-1">{file.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CheckGroup titulo="Dados do produto" items={[['Nome, marca, tipo, CCA...', restoreProdutos, setRestoreProdutos]]} />
            <CheckGroup titulo="Estoque" items={[
              ['Matriz Artêmia', restoreEstoqueMatriz, setRestoreEstoqueMatriz],
              ['Filial Iguatemi', restoreEstoqueFilial, setRestoreEstoqueFilial],
            ]} />
            <CheckGroup titulo="Preços" items={[
              ['Matriz Artêmia', restorePrecosMatriz, setRestorePrecosMatriz],
              ['Filial Iguatemi', restorePrecosFilial, setRestorePrecosFilial],
            ]} />
            <CheckGroup titulo="Prioridade / ativo" items={[
              ['Matriz Artêmia', restorePrioridadeMatriz, setRestorePrioridadeMatriz],
              ['Filial Iguatemi', restorePrioridadeFilial, setRestorePrioridadeFilial],
            ]} />
            <CheckGroup titulo="Sistema" items={[
              ['Opções (amperagem, tipo...)', restoreOpcoes, setRestoreOpcoes],
              ['Atalhos de consulta', restoreAtalhos, setRestoreAtalhos],
            ]} />
          </div>

          {/* Reset completo — apenas admin master */}
          {user?.protegido && (
            <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm">Reset Completo (Admin Master)</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Apaga TODOS os produtos e dados de loja antes de restaurar. Use quando o banco estiver muito bagunçado. Irreversível sem novo backup.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-red-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetCompleto}
                  onChange={e => { setResetCompleto(e.target.checked); setConfirmarReset(''); }}
                />
                Ativar reset completo antes de restaurar
              </label>
              {resetCompleto && (
                <div>
                  <p className="text-xs text-red-700 mb-1">Digite <strong>RESETAR</strong> para confirmar:</p>
                  <input
                    value={confirmarReset}
                    onChange={e => setConfirmarReset(e.target.value)}
                    placeholder="RESETAR"
                    className="border border-red-300 rounded-lg px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={restaurarBackup}
            disabled={!file || loading || (resetCompleto && confirmarReset !== 'RESETAR')}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium transition"
          >
            {loading ? 'Restaurando...' : resetCompleto ? '⚠ Resetar e Restaurar' : 'Restaurar selecionados'}
          </button>
        </div>
      )}

      {mensagem && (
        <div className={`border p-4 rounded-xl text-sm ${
          statusOperacao === 'sucesso' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          statusOperacao === 'erro'    ? 'bg-red-50 border-red-200 text-red-800' :
                                        'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <p className="font-semibold">{mensagem}</p>
          <p className="text-xs mt-1 opacity-70">Operação registrada em Logs e auditoria.</p>
        </div>
      )}
    </div>
  );
}

function CheckGroup({
  titulo,
  items,
}: {
  titulo: string;
  items: Array<[string, boolean, (value: boolean) => void]>;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
      <h3 className="font-semibold text-xs uppercase text-slate-500 mb-2">{titulo}</h3>
      <div className="space-y-1.5">
        {items.map(([label, checked, setChecked]) => (
          <label key={label} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="rounded" />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
