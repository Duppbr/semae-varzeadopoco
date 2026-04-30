'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import {
  LayoutDashboard,
  Users,
  Package,
  SlidersHorizontal,
  Zap,
  Car,
  Map,
  Upload,
  Download,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarAberto, setSidebarAberto] = useState(false);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const menuItems = [
    { titulo: 'Visão Geral', href: '/admin/todas-lojas', icone: Map },
    { titulo: 'Produtos', href: '/admin/produtos', icone: Package },
    { titulo: 'Usuários', href: '/admin/usuarios', icone: Users },
    { titulo: 'Opções', href: '/admin/opcoes', icone: SlidersHorizontal },
    { titulo: 'Atalhos', href: '/admin/atalhos', icone: Zap },
    { titulo: 'Aplicações', href: '/admin/aplicacoes', icone: Car },
    { titulo: 'Importar', href: '/admin/importar', icone: Upload },
    { titulo: 'Backup', href: '/admin/backup', icone: Download },
  ];

  const sair = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho para mobile */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => setSidebarAberto(true)} className="p-2 rounded hover:bg-gray-100">
          <Menu size={24} />
        </button>
        <h1 className="font-bold text-lg">Rios Baterias</h1>
        <button onClick={sair} className="text-red-600 text-sm font-medium">
          Sair
        </button>
      </div>

      {/* Overlay para mobile */}
      {sidebarAberto && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">
              RB
            </div>
            <span className="font-bold text-xl">Rios Baterias</span>
          </Link>
          <button onClick={() => setSidebarAberto(false)} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarAberto(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icone size={18} />
              {item.titulo}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button onClick={sair} className="flex items-center gap-2 text-red-600 text-sm font-medium w-full px-4 py-2 rounded hover:bg-red-50">
            <ArrowLeft size={16} />
            Sair do painel
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="lg:ml-64 p-4 lg:p-8 min-h-screen">
        {/* Cabeçalho desktop */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-sm text-gray-500">Bem-vindo, {user.nome}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Voltar ao site
            </Link>
            <button onClick={sair} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200">
              Sair
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}