'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import {
  ArrowLeft,
  Car,
  Download,
  History,
  LayoutDashboard,
  Map,
  Menu,
  Package,
  SlidersHorizontal,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { titulo: 'Painel', href: '/admin', icone: LayoutDashboard },
  { titulo: 'Visão Geral', href: '/admin/todas-lojas', icone: Map },
  { titulo: 'Produtos', href: '/admin/produtos', icone: Package },
  { titulo: 'Usuários', href: '/admin/usuarios', icone: Users },
  { titulo: 'Opções', href: '/admin/opcoes', icone: SlidersHorizontal },
  { titulo: 'Atalhos', href: '/admin/atalhos', icone: Zap },
  { titulo: 'Aplicações', href: '/admin/aplicacoes', icone: Car },
  { titulo: 'Importar', href: '/admin/importar', icone: Upload },
  { titulo: 'Backup', href: '/admin/backup', icone: Download },
  { titulo: 'Logs', href: '/admin/logs', icone: History, masterOnly: true },
];

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

  const sair = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <button onClick={() => setSidebarAberto(true)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Abrir menu">
          <Menu size={24} />
        </button>
        <h1 className="font-bold text-lg">Rios Baterias</h1>
        <button onClick={sair} className="text-red-600 text-sm font-medium">
          Sair
        </button>
      </div>

      {sidebarAberto && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarAberto(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-200">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold">
              RB
            </div>
            <div>
              <span className="font-bold block leading-tight">Rios Baterias</span>
              <span className="text-xs text-slate-500">Painel administrativo</span>
            </div>
          </Link>
          <button onClick={() => setSidebarAberto(false)} className="lg:hidden p-1 rounded hover:bg-slate-100" aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.filter(item => !item.masterOnly || user.protegido).map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarAberto(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  ativo
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <item.icone size={18} />
                {item.titulo}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button onClick={sair} className="flex items-center gap-2 text-red-600 text-sm font-medium w-full px-4 py-2 rounded-lg hover:bg-red-50">
            <ArrowLeft size={16} />
            Sair do painel
          </button>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <div className="hidden lg:flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-slate-500">Bem-vindo, {user.nome}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              Voltar ao site
            </Link>
            <button onClick={sair} className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100">
              Sair
            </button>
          </div>
        </div>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
