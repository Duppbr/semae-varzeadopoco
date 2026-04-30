'use client';

import { useState } from 'react';

const formatReal = (valor: number | null) => {
  if (valor === null || valor === 0) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function ProdutoCard({ produto, precoCartao, precoCartao3x, precoAvista, precoAvistaMinimo, quantidadeEstoque, podeVerEstoque }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow p-4 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => setExpanded(!expanded)}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-base leading-tight">{produto.nome}</h3>
          <p className="text-xs text-gray-500 mt-1">{produto.marca}</p>
        </div>
        <span className="text-xs text-gray-400">{expanded ? '▲' : '▼'}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">💳 Cartão</span>
          <p className="font-bold text-gray-800">{formatReal(precoCartao)}</p>
        </div>
        <div>
          <span className="text-gray-500">💰 À vista</span>
          <p className="font-bold text-green-700">{formatReal(precoAvista)}</p>
        </div>
      </div>

      {produto.garantia && (
        <p className="text-xs text-gray-600 mt-2">🛡️ {produto.garantia}</p>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-1">
          <p><span className="text-gray-500">SKU:</span> {produto.sku}</p>
          {produto.amperagem && <p><span className="text-gray-500">Amperagem:</span> {produto.amperagem}</p>}
          {produto.tipo && <p><span className="text-gray-500">Tipo:</span> {produto.tipo}</p>}
          {produto.cca && <p><span className="text-gray-500">CCA:</span> {produto.cca}</p>}
          <div className="flex justify-between text-sm mt-1">
            <span>💳 Cartão 3x:</span>
            <span className="font-semibold">{formatReal(precoCartao3x)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>💵 À vista mín:</span>
            <span className="font-semibold">{formatReal(precoAvistaMinimo)}</span>
          </div>
          {podeVerEstoque && (
            <p className={`text-xs mt-1 ${quantidadeEstoque > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Estoque: {quantidadeEstoque} un.
            </p>
          )}
        </div>
      )}
    </div>
  );
}