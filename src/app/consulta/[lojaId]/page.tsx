// src/app/consulta/[lojaId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ListaProdutos from '@/components/ListaProdutos';
import { useUser } from '@/hooks/useUser';

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
}

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
    // Se não for admin e a loja da URL for diferente da dele, redireciona
    if (user.role !== 'admin' && parseInt(lojaId) !== user.lojaId) {
      router.push(`/consulta/${user.lojaId}`);
      return;
    }
    const fetchProdutos = async () => {
      const res = await fetch(`/api/produtos-loja?lojaId=${lojaId}`);
      if (res.ok) {
        const data = await res.json();
        // Ordena por precoCartao do maior para o menor
        data.sort((a: any, b: any) => (b.precoCartao || 0) - (a.precoCartao || 0));
        setProdutos(data);
      }
      setLoading(false);
    };
    fetchProdutos();
  }, [lojaId, user, userLoading, router]);

  if (userLoading || loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-2 py-3 md:px-4 md:py-6">
      <h1 className="text-xl font-bold mb-4 text-center md:text-left">🔋 Consulta de Baterias</h1>
      <ListaProdutos produtosIniciais={produtos} userRole={user?.role} />
    </div>
  );
}