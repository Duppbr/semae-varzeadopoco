'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { Building2, Store, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4">
          <img src="/icon-512.png" alt="Rios Baterias" className="w-full h-full rounded-2xl object-contain" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Rios Baterias</h1>
        <p className="text-gray-500">Selecione a loja para consultar preços</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
        <Link
          href="/consulta/1"
          className="group bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <div className="font-semibold text-lg text-gray-900">Matriz Artêmia</div>
          <p className="text-sm text-gray-500 mt-1">Consultar preços</p>
          <ArrowRight size={16} className="mx-auto mt-3 text-gray-300 group-hover:text-blue-600" />
        </Link>

        <Link
          href="/consulta/2"
          className="group bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100">
            <Store size={28} className="text-green-600" />
          </div>
          <div className="font-semibold text-lg text-gray-900">Filial Iguatemi</div>
          <p className="text-sm text-gray-500 mt-1">Consultar preços</p>
          <ArrowRight size={16} className="mx-auto mt-3 text-gray-300 group-hover:text-green-600" />
        </Link>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-10">
          <Link
            href="/admin/todas-lojas"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            📊 Acessar Painel Administrativo
          </Link>
        </div>
      )}
    </div>
  );
}