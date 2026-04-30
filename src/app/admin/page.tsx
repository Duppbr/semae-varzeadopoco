'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import {
  Map,
  Package,
  Users,
  SlidersHorizontal,
  Zap,
  Car,
  Upload,
  Download,
} from 'lucide-react';
import Link from 'next/link';

const funcionalidades = [
  { titulo: 'Visão Completa (Lojas)', href: '/admin/todas-lojas', icone: Map, cor: 'bg-blue-500' },
  { titulo: 'Gerenciar Produtos', href: '/admin/produtos', icone: Package, cor: 'bg-indigo-500' },
  { titulo: 'Gerenciar Usuários', href: '/admin/usuarios', icone: Users, cor: 'bg-green-500' },
  { titulo: 'Opções Padronizadas', href: '/admin/opcoes', icone: SlidersHorizontal, cor: 'bg-yellow-500' },
  { titulo: 'Atalhos da Consulta', href: '/admin/atalhos', icone: Zap, cor: 'bg-orange-500' },
  { titulo: 'Aplicações de Veículos', href: '/admin/aplicacoes', icone: Car, cor: 'bg-purple-500' },
  { titulo: 'Importar CSV', href: '/admin/importar', icone: Upload, cor: 'bg-teal-500' },
  { titulo: 'Backup & Restauração', href: '/admin/backup', icone: Download, cor: 'bg-red-500' },
];

export default function AdminDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Bem-vindo, {user.nome}!</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {funcionalidades.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition hover:-translate-y-1"
          >
            <div className={`${f.cor} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <f.icone size={20} className="text-white" />
            </div>
            <h3 className="font-medium text-sm text-gray-900">{f.titulo}</h3>
            <p className="text-xs text-gray-500 mt-1">Acessar →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}