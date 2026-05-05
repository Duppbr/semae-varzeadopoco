// src/app/consulta/[lojaId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ListaProdutos from '@/components/ListaProdutos';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { ArrowLeft, Building2, Store } from 'lucide-react';

interface ProdutoLojaData {
  produto: {
    id: number;
    sku: string;
    nome: string;
    marca: string;
    amperagem: string | null;
    tipo: string | null;
    cca: number | null;
    garantia: string | null;
  };
  precoCartao: number | null;
  precoCartao3x: number | null;
  precoAvista: number | null;
  precoAvistaMinimo: number | null;
  quantidadeEstoque: number;
  prioridade: string;
}

// MUDANÇA: mapeamento de lojas centralizado — usado no header e no botão de troca
const lojaInfo: Record<string, { nome: string; icone: typeof Building2; cor: string }> = {
  '1': { nome: 'Matriz Artemio', icone: Building2, cor: 'text-blue-600' },
  '2': { nome: 'Filial Iguatemi', icone: Store, cor: 'text-green-600' },
};

export default function ConsultaPage() {
  const params = useParams();
  const router = useRouter();
  const lojaId = params.lojaId as string;
  const { user, loading: userLoading } = useUser();
  const [produtos, setProdutos] = useState<ProdutoLojaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin' && parseInt(lojaId) !== user.lojaId) {
      router.push(`/consulta/${user.lojaId}`);
      return;
    }

    const fetchProdutos = async () => {
      const res = await fetch(`/api/produtos-loja?lojaId=${lojaId}`);
      if (res.ok) {
        const data = (await res.json()) as ProdutoLojaData[];
        data.sort((a, b) => (b.precoCartao || 0) - (a.precoCartao || 0));
        setProdutos(data);
      }
      setLoading(false);
    };

    fetchProdutos();
  }, [lojaId, user, userLoading, router]);

  if (userLoading || loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  const loja = lojaInfo[lojaId] ?? lojaInfo['1'];
  const outraLojaId = lojaId === '1' ? '2' : '1';
  const outraLoja = lojaInfo[outraLojaId];
  const OutraLojaIcone = outraLoja.icone;

  return (
    <div className="max-w-5xl mx-auto px-3 pt-3 pb-8 md:px-4 md:pt-5">
      {/* MUDANÇA: Header da consulta redesenhado
          Antes: só <h1>Consulta de Baterias</h1> sem contexto nem navegação
          Depois: botão voltar + nome da loja + botão de troca de loja (admin) */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/"
          className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-900 transition flex-shrink-0"
          aria-label="Voltar ao inicio"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 leading-none mb-0.5">Consulta de precos</p>
          <h1 className={`font-bold text-slate-900 text-base leading-tight flex items-center gap-1.5`}>
            <loja.icone size={16} className={loja.cor} />
            {loja.nome}
          </h1>
        </div>

        {/* Botão de troca de loja — visível apenas para admin */}
        {user?.role === 'admin' && (
          <Link
            href={`/consulta/${outraLojaId}`}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition"
          >
            <OutraLojaIcone size={13} className={outraLoja.cor} />
            {outraLoja.nome.split(' ')[0]}
          </Link>
        )}
      </div>

      <ListaProdutos produtosIniciais={produtos} userRole={user?.role} />
    </div>
  );
}
