'use client';

import { useState } from 'react';

export default function BackupPage() {
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
      a.download = `backup-rios-baterias-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMensagem('Backup exportado com sucesso.');
      setStatusOperacao('sucesso');
    } catch {
      setMensagem('Erro ao exportar backup.');
      setStatusOperacao('erro');
    }
    setLoading(false);
  };

  const restaurarBackup = async () => {
    if (!file) return;
    setLoading(true);
    setStatusOperacao('processando');
    setMensagem('Restaurando backup...');

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
    }));

    const res = await fetch('/api/admin/backup/restore', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || data.erro) {
      setMensagem(data.erro || 'Erro ao restaurar backup.');
      setStatusOperacao('erro');
    } else {
      setMensagem(data.mensagem || 'Restauracao concluida.');
      setStatusOperacao('sucesso');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Backup e restauracao</h1>
        <p className="text-sm text-slate-500">Exporte ou restaure dados com status visivel e registro em auditoria.</p>
      </div>

      <div className="flex gap-2">
        <button className={`px-4 py-2 rounded-lg ${aba === 'exportar' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`} onClick={() => setAba('exportar')}>
          Exportar Backup
        </button>
        <button className={`px-4 py-2 rounded-lg ${aba === 'restaurar' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`} onClick={() => setAba('restaurar')}>
          Restaurar Backup
        </button>
      </div>

      {aba === 'exportar' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="mb-4 text-sm text-slate-600">Gera um arquivo completo com produtos, precos, estoque e opcoes.</p>
          <button onClick={exportarBackup} disabled={loading} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Gerando...' : 'Baixar Backup'}
          </button>
        </div>
      )}

      {aba === 'restaurar' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="mb-4 text-sm text-slate-600">Envie o backup (.json) e escolha exatamente o que deseja restaurar.</p>
          <input type="file" accept=".json" onChange={e => setFile(e.target.files?.[0] || null)} className="border border-slate-300 p-2 rounded-lg mb-4 block w-full md:w-auto" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <CheckGroup titulo="Dados comuns" items={[['Produtos', restoreProdutos, setRestoreProdutos]]} />
            <CheckGroup titulo="Estoque" items={[['Matriz', restoreEstoqueMatriz, setRestoreEstoqueMatriz], ['Filial', restoreEstoqueFilial, setRestoreEstoqueFilial]]} />
            <CheckGroup titulo="Precos" items={[['Matriz', restorePrecosMatriz, setRestorePrecosMatriz], ['Filial', restorePrecosFilial, setRestorePrecosFilial]]} />
            <CheckGroup titulo="Prioridade/ativo" items={[['Matriz', restorePrioridadeMatriz, setRestorePrioridadeMatriz], ['Filial', restorePrioridadeFilial, setRestorePrioridadeFilial]]} />
          </div>

          <button onClick={restaurarBackup} disabled={!file || loading} className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50">
            {loading ? 'Restaurando...' : 'Restaurar selecionados'}
          </button>
        </div>
      )}

      {mensagem && (
        <div className={`border p-4 rounded-xl ${
          statusOperacao === 'sucesso' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          statusOperacao === 'erro' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <p className="font-semibold">{mensagem}</p>
          <p className="text-sm mt-1">Esta operacao fica registrada em Logs e auditoria para o admin master.</p>
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
    <div>
      <h3 className="font-semibold mb-2">{titulo}</h3>
      <div className="space-y-2">
        {items.map(([label, checked, setChecked]) => (
          <label key={label} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
