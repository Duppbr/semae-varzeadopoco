'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import Link from 'next/link';

const formatReal = (valor: number | null) => {
  if (valor === null || valor === 0) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const PrioridadeDot = ({ prioridade }: { prioridade?: string }) => {
  if (!prioridade) return null;
  const cores: Record<string, string> = {
    verde: 'bg-green-500',
    amarelo: 'bg-yellow-400',
    vermelho: 'bg-red-500',
  };
  const titulos: Record<string, string> = {
    verde: 'Prioridade Normal',
    amarelo: 'Prioridade Media',
    vermelho: 'Prioridade Alta',
  };
  if (!cores[prioridade]) return null;
  return (
    <span
      title={titulos[prioridade]}
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${cores[prioridade]} ring-2 ring-white shadow-sm`}
    />
  );
};

// MUDANÇA: ProdutoCard completamente redesenhado para consulta
// Problema anterior: amperagem e tipo ficavam escondidos no drawer expandível,
// obrigando o usuário a expandir cada card para confirmar que é a bateria certa.
// Agora as características ficam visíveis como pills no topo do card,
// os preços ficam grandes e centralizados, e o design é mais limpo e moderno.
export default function ProdutoCard({
  produto,
  precoCartao,
  precoCartao3x,
  precoAvista,
  precoAvistaMinimo,
  quantidadeEstoque,
  podeVerEstoque,
  prioridade,
  isAdmin,
}: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all">

      {/* Pills de características — amperagem e tipo visíveis sem expandir */}
      {(produto.amperagem || produto.tipo || prioridade) && (
        <div className="px-4 pt-3.5 flex items-center gap-1.5 flex-wrap">
          {produto.amperagem && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full leading-none">
              {produto.amperagem}
            </span>
          )}
          {produto.tipo && (
            <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full leading-none">
              {produto.tipo}
            </span>
          )}
          <PrioridadeDot prioridade={prioridade} />
        </div>
      )}

      {/* Nome e marca */}
      <div className="px-4 pt-2 pb-1">
        <h3 className="font-semibold text-slate-900 leading-snug text-[15px]">{produto.nome}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{produto.marca}</p>
      </div>

      {/* Preços — destaque principal */}
      <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2">
        <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
          <p className="text-xs text-slate-400 mb-0.5">Cartao</p>
          <p className="font-bold text-slate-900 text-base">{formatReal(precoCartao)}</p>
        </div>
        <div className="bg-green-50 rounded-xl px-3 py-2.5 text-center">
          <p className="text-xs text-slate-400 mb-0.5">A vista</p>
          <p className="font-bold text-green-700 text-base">{formatReal(precoAvista)}</p>
        </div>
      </div>

      {/* Rodapé: garantia + indicador estoque + botão expandir */}
      <div
        className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-500 truncate">
            {produto.garantia ? `Garantia: ${produto.garantia}` : 'Sem info de garantia'}
          </span>
          <span className={`text-[11px] font-medium flex-shrink-0 ${quantidadeEstoque > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {quantidadeEstoque > 0 ? '● Estoque' : '● Sem estoque'}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium flex-shrink-0 ml-2">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Menos' : 'Detalhes'}
        </span>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {produto.sku && (
              <>
                <span className="text-slate-400 text-xs">SKU</span>
                <span className="font-mono text-xs text-slate-700">{produto.sku}</span>
              </>
            )}
            {produto.cca ? (
              <>
                <span className="text-slate-400 text-xs">CCA</span>
                <span className="text-slate-700 text-xs">{produto.cca}</span>
              </>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white rounded-lg px-3 py-2 border border-slate-100">
              <p className="text-xs text-slate-400">Cartao 3x</p>
              <p className="font-semibold text-slate-800 text-sm">{formatReal(precoCartao3x)}</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 border border-slate-100">
              <p className="text-xs text-slate-400">A vista min</p>
              <p className="font-semibold text-slate-800 text-sm">{formatReal(precoAvistaMinimo)}</p>
            </div>
          </div>
          {podeVerEstoque && (
            <p className={`text-xs font-medium ${quantidadeEstoque > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Estoque: {quantidadeEstoque} unidade{quantidadeEstoque !== 1 ? 's' : ''}
            </p>
          )}

          {isAdmin && (
            <Link
              href={`/admin/produtos?sku=${encodeURIComponent(produto.sku)}`}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 transition w-fit"
              onClick={e => e.stopPropagation()}
            >
              <Pencil size={10} />
              Editar no admin
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
