'use client';

import { useState } from 'react';

type ResultadoImportacao = {
  processadas?: number;
  erros?: string[];
  erro?: string;
  detalhe?: string;
};

export default function ImportarPage() {
  const [tipo, setTipo] = useState('estoque');
  const [lojaId, setLojaId] = useState<number>(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [sobrescreverPrecos, setSobrescreverPrecos] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [statusOperacao, setStatusOperacao] = useState<'idle' | 'processando' | 'sucesso' | 'erro' | 'parcial'>('idle');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setArquivo(file || null);
    setResultado(null);
    setStatusOperacao('idle');
    if (file) {
      const text = await file.text();
      const linhas = text.split('\n').filter(l => l.trim()).map(l => l.split(';'));
      setPreview(linhas.slice(0, 10));
    } else {
      setPreview([]);
    }
  };

  const importar = async () => {
    if (!arquivo) return;
    setLoading(true);
    setResultado(null);
    setStatusOperacao('processando');

    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('tipo', tipo);
    formData.append('sobrescreverPrecos', String(sobrescreverPrecos));
    if (tipo === 'estoque' || tipo === 'custo') {
      formData.append('lojaId', String(lojaId));
    }

    try {
      const res = await fetch('/api/admin/importar-csv', { method: 'POST', body: formData });
      const data = await res.json();
      setResultado(data);
      if (!res.ok || data.erro) setStatusOperacao('erro');
      else if (data.erros?.length > 0) setStatusOperacao('parcial');
      else setStatusOperacao('sucesso');
    } catch (error) {
      setStatusOperacao('erro');
      setResultado({ erro: 'Erro de rede', detalhe: error instanceof Error ? error.message : 'Erro desconhecido' });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Importar CSV</h1>
        <p className="text-sm text-slate-500">Importe estoque, cadastro de produtos ou relacao de custo com status claro da operacao.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de arquivo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg">
              <option value="estoque">Estoque (SKU;Qtd)</option>
              <option value="produtos">Produtos (cadastro)</option>
              <option value="custo">Relacao de Custo</option>
            </select>
          </div>

          {(tipo === 'estoque' || tipo === 'custo') && (
            <div>
              <label className="block text-sm font-medium mb-1">Loja</label>
              <select value={lojaId} onChange={e => setLojaId(Number(e.target.value))} className="w-full border border-slate-300 p-2 rounded-lg">
                <option value={1}>Matriz Artemia</option>
                <option value={2}>Filial Iguatemi</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Arquivo CSV</label>
            <input type="file" accept=".csv" onChange={handleFileChange} className="w-full border border-slate-300 p-2 rounded-lg text-sm" />
          </div>
        </div>

        {tipo === 'custo' && (
          <label className="flex items-center gap-2 mb-4 text-sm">
            <input
              type="checkbox"
              checked={sobrescreverPrecos}
              onChange={e => setSobrescreverPrecos(e.target.checked)}
            />
            Sobrescrever precos existentes
          </label>
        )}

        {preview.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <h3 className="font-semibold mb-2">Previa (primeiras 10 linhas)</h3>
            <table className="min-w-full border text-sm">
              <tbody>
                {preview.map((linha, i) => (
                  <tr key={i} className={i === 0 ? 'bg-slate-100 font-medium' : ''}>
                    {linha.map((cel, j) => <td key={j} className="border px-2 py-1">{cel.replace(/"/g, '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={importar}
          disabled={!arquivo || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {statusOperacao !== 'idle' && (
        <div className={`rounded-xl border p-4 ${
          statusOperacao === 'sucesso' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          statusOperacao === 'parcial' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          statusOperacao === 'erro' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <p className="font-semibold">
            {statusOperacao === 'processando' && 'Importacao em andamento...'}
            {statusOperacao === 'sucesso' && 'Importacao concluida com sucesso.'}
            {statusOperacao === 'parcial' && 'Importacao concluida com avisos.'}
            {statusOperacao === 'erro' && 'Importacao falhou.'}
          </p>
          <p className="text-sm mt-1">Este evento tambem fica registrado em Logs e auditoria para o admin master.</p>
        </div>
      )}

      {resultado && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h2 className="text-xl font-bold mb-2">Resultado</h2>
          {resultado.erro ? (
            <p className="text-red-700">{resultado.erro}: {resultado.detalhe}</p>
          ) : (
            <p>Processadas: {resultado.processadas ?? 0}</p>
          )}
          {resultado.erros && resultado.erros.length > 0 && (
            <div className="mt-3">
              <h3 className="font-semibold text-red-600">Avisos/erros:</h3>
              <ul className="list-disc list-inside text-sm">
                {resultado.erros.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
