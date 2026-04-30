'use client';

import { useState } from 'react';

export default function ImportarPage() {
  const [tipo, setTipo] = useState('estoque');
  const [lojaId, setLojaId] = useState<number>(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [sobrescreverPrecos, setSobrescreverPrecos] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setArquivo(file || null);
    if (file) {
      const text = await file.text();
      // Divide em linhas e colunas para prévia simples
      const linhas = text.split('\n').filter(l => l.trim()).map(l => l.split(';'));
      setPreview(linhas.slice(0, 10));
    }
  };

  const importar = async () => {
    if (!arquivo) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('tipo', tipo);
    formData.append('sobrescreverPrecos', String(sobrescreverPrecos));
    if (tipo === 'estoque' || tipo === 'custo') {
      formData.append('lojaId', String(lojaId));
    }
    try {
      const res = await fetch('/api/admin/importar-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResultado(data);
    } catch (e) {
      alert('Erro de rede');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📥 Importar CSV</h1>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de arquivo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="border p-2 rounded">
              <option value="estoque">Estoque (SKU;Qtd)</option>
              <option value="produtos">Produtos (cadastro)</option>
              <option value="custo">Relação de Custo (SKU;PrecoSugerido)</option>
            </select>
          </div>

          {(tipo === 'estoque' || tipo === 'custo') && (
            <div>
              <label className="block text-sm font-medium mb-1">Loja</label>
              <select value={lojaId} onChange={e => setLojaId(Number(e.target.value))} className="border p-2 rounded">
                <option value={1}>Matriz Artêmia</option>
                <option value={2}>Filial Iguatemi</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Arquivo CSV</label>
            <input type="file" accept=".csv" onChange={handleFileChange} className="border p-2 rounded" />
          </div>
        </div>

        {tipo === 'custo' && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={sobrescreverPrecos}
              onChange={e => setSobrescreverPrecos(e.target.checked)}
            />
            <label className="text-sm">Sobrescrever preços existentes</label>
          </div>
        )}

        {preview.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <h3 className="font-semibold mb-2">Prévia (primeiras 10 linhas)</h3>
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {preview[0].map((col, i) => <th key={i} className="border px-2 py-1">{col.replace(/"/g, '')}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((linha, i) => (
                  <tr key={i}>
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
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {resultado && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-2">Resultado</h2>
          <p>Processadas: {resultado.processadas}</p>
          {resultado.erros && resultado.erros.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold text-red-600">Erros:</h3>
              <ul className="list-disc list-inside text-sm">
                {resultado.erros.map((err: string, i: number) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}