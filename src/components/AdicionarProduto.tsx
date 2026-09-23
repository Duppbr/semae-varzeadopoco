'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import SeletorProdutos, { type ProdutoSeletor } from '@/components/SeletorProdutos';

const BOTAO = {
  purple: 'bg-purple-600 active:bg-purple-700',
  blue: 'bg-blue-600 active:bg-blue-700',
  red: 'bg-red-500 active:bg-red-600',
  orange: 'bg-orange-500 active:bg-orange-600',
} as const;

// Botao "Adicionar" com o seletor num painel ancorado logo abaixo dele.
// O painel fica aberto para escolher varios; cada escolhido aparece marcado
// e um toque desmarca. Fecha por "Concluir", clique fora ou Esc.
// `rodape` recebe `fechar` para acoes extras (ex.: item sem cadastro no pedido).
export default function AdicionarProduto<T extends ProdutoSeletor>({ produtos, escolhidos, onEscolher, onRemover, detalhe, acento = 'blue', rodape }: {
  produtos: T[];
  escolhidos: string[];
  onEscolher: (produto: T) => void;
  onRemover: (produto: T) => void;
  detalhe?: (produto: T) => ReactNode;
  acento?: keyof typeof BOTAO;
  rodape?: (fechar: () => void) => ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const fechar = () => setAberto(false);

  useEffect(() => {
    if (!aberto) return;
    // Traz o painel inteiro para a tela (o cartao pode estar no fim da pagina).
    const quadro = requestAnimationFrame(() => painel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    const fora = (e: PointerEvent) => { if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => { cancelAnimationFrame(quadro); document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  return <div ref={caixa} className="relative">
    <button type="button" onClick={() => setAberto(v => !v)} aria-expanded={aberto} aria-haspopup="dialog"
      className={`flex items-center gap-1.5 text-white text-sm font-semibold px-3 py-1.5 rounded-xl ${BOTAO[acento]}`}>
      <Plus size={15} /> Adicionar
    </button>
    {/* A folga invisivel embaixo (pb-28) deixa a pagina rolar alem da barra inferior
        do celular; sem ela, o fim do painel ficava escondido atras da TabBar. */}
    {aberto && <div className="absolute right-0 top-full z-30 pt-2 pb-28 pointer-events-none">
      <div ref={painel} role="dialog" aria-label="Adicionar produto"
        className="pointer-events-auto scroll-mt-20 scroll-mb-28 w-[min(28rem,calc(100vw_-_4rem))] bg-white border border-slate-200 rounded-2xl shadow-xl p-3">
        <SeletorProdutos produtos={produtos} escolhidos={escolhidos} detalhe={detalhe} acento={acento} autoFocus
          onEscolher={onEscolher} onRemover={onRemover} />
        {rodape?.(fechar)}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600" aria-live="polite">
            {escolhidos.length === 0 ? 'Nenhum selecionado' : `${escolhidos.length} selecionado${escolhidos.length > 1 ? 's' : ''}`}
          </span>
          <button type="button" onClick={fechar}
            className={`text-white text-sm font-semibold px-4 py-2 rounded-xl ${BOTAO[acento]}`}>Concluir</button>
        </div>
      </div>
    </div>}
  </div>;
}
