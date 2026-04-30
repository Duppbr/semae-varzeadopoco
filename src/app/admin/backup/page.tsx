'use client';

import { useState } from 'react';

export default function BackupPage() {
  const [aba, setAba] = useState<'exportar' | 'restaurar'>('exportar');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Seleções de restauração
  const [restoreProdutos, setRestoreProdutos] = useState(true);
  const [restoreEstoqueMatriz, setRestoreEstoqueMatriz] = useState(false);
  const [restoreEstoqueFilial, setRestoreEstoqueFilial] = useState(false);
  const [restorePrecosMatriz, setRestorePrecosMatriz] = useState(false);
  const [restorePrecosFilial, setRestorePrecosFilial] = useState(false);
  const [restorePrioridadeMatriz, setRestorePrioridadeMatriz] = useState(false);
  const [restorePrioridadeFilial, setRestorePrioridadeFilial] = useState(false);

  const exportarBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup/export');
      if (!res.ok) throw new Error('Erro ao exportar');
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-rios-baterias-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      setMensagem('Backup exportado com sucesso.');
    } catch (e) {
      setMensagem('Erro ao exportar backup.');
    }
    setLoading(false);
  };

  const restaurarBackup = async () => {
    if (!file) return;
    setLoading(true);
    const texto = await file.text();
    const backup = JSON.parse(texto);

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

    const res = await fetch('/api/admin/backup/restore', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setMensagem(data.mensagem || 'Restauração concluída.');
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">💾 Backup & Restauração</h1>

      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${aba === 'exportar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setAba('exportar')}
        >
          Exportar Backup
        </button>
        <button
          className={`px-4 py-2 rounded ${aba === 'restaurar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setAba('restaurar')}
        >
          Restaurar Backup
        </button>
      </div>

      {aba === 'exportar' && (
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="mb-4">Clique no botão abaixo para gerar um arquivo de backup completo (produtos, preços e estoque).</p>
          <button
            onClick={exportarBackup}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : '📥 Baixar Backup'}
          </button>
        </div>
      )}

      {aba === 'restaurar' && (
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="mb-4">Faça upload do arquivo de backup (.json) e selecione os componentes que deseja restaurar.</p>
          <input type="file" accept=".json" onChange={e => setFile(e.target.files?.[0] || null)} className="border p-2 rounded mb-4 block" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Dados Comuns</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={restoreProdutos} onChange={e => setRestoreProdutos(e.target.checked)} />
                Produtos (nome, marca, amperagem, tipo, CCA, garantia)
              </label>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Estoque</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={restoreEstoqueMatriz} onChange={e => setRestoreEstoqueMatriz(e.target.checked)} />
                Matriz
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={restoreEstoqueFilial} onChange={e => setRestoreEstoqueFilial(e.target.checked)} />
                Filial
              </label>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Preços</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={restorePrecosMatriz} onChange={e => setRestorePrecosMatriz(e.target.checked)} />
                Matriz
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={restorePrecosFilial} onChange={e => setRestorePrecosFilial(e.target.checked)} />
                Filial
              </label>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Prioridade/Ativo</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={restorePrioridadeMatriz} onChange={e => setRestorePrioridadeMatriz(e.target.checked)} />
                Matriz
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={restorePrioridadeFilial} onChange={e => setRestorePrioridadeFilial(e.target.checked)} />
                Filial
              </label>
            </div>
          </div>

          <button
            onClick={restaurarBackup}
            disabled={!file || loading}
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Restaurando...' : '↩️ Restaurar Selecionados'}
          </button>
        </div>
      )}

      {mensagem && (
        <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded">{mensagem}</div>
      )}
    </div>
  );
}