'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import {
  ArrowLeft,
  Building2,
  Car,
  Download,
  History,
  LayoutDashboard,
  Map,
  Menu,
  Package,
  SlidersHorizontal,
  Store,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { titulo: 'Painel', href: '/admin', icone: LayoutDashboard },
  { titulo: 'Visao Geral', href: '/admin/todas-lojas', icone: Map },
  { titulo: 'Produtos', href: '/admin/produtos', icone: Package },
  { titulo: 'Usuarios', href: '/admin/usuarios', icone: Users },
  { titulo: 'Opcoes', href: '/admin/opcoes', icone: SlidersHorizontal },
  { titulo: 'Atalhos', href: '/admin/atalhos', icone: Zap },
  { titulo: 'Aplicacoes', href: '/admin/aplicacoes', icone: Car },
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

  // MUDANÇA: título da página atual derivado do pathname — exibido no header mobile
  // para o usuário saber onde está sem precisar abrir o menu
  const paginaAtual = menuItems.find(item => item.href === pathname)?.titulo ?? 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* MUDANÇA: Header mobile redesenhado
          Antes: [Menu] [Rios Baterias] [Sair] — sem indicação da página atual e sem volta ao site
          Depois: [Menu] [Título da página] [← Consulta] — mostra onde está e dá saída ao site */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => setSidebarAberto(true)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 leading-none mb-0.5">Admin</p>
          <h1 className="font-bold text-sm text-slate-900 truncate">{paginaAtual}</h1>
        </div>
        {/* Botão de volta ao site — resolve o problema de não conseguir sair do admin no mobile */}
        <Link
          href="/"
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
        >
          <ArrowLeft size={13} />
          Inicio
        </Link>
      </div>

      {/* Overlay ao abrir sidebar no mobile */}
      {sidebarAberto && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarAberto ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-slate-200 flex-shrink-0">
          <Link href="/admin" onClick={() => setSidebarAberto(false)} className="flex items-center gap-3">
            <img src="/icon-192.png" alt="Rios Baterias" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
            <div>
              <span className="font-bold block leading-tight text-slate-900">Rios Baterias</span>
              <span className="text-xs text-slate-500">Painel admin</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarAberto(false)}
            className="lg:hidden p-1 rounded hover:bg-slate-100 text-slate-400"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav principal */}
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {menuItems.filter(item => !item.masterOnly || user.protegido).map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarAberto(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  ativo
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <item.icone size={17} />
                {item.titulo}
              </Link>
            );
          })}

          {/* MUDANÇA: seção "Ir para consulta" adicionada na sidebar
              Antes: não havia como ir à consulta pelo menu lateral — precisava abrir Navbar (que foi removida do admin)
              Agora: links diretos para Matriz e Filial acessíveis de qualquer página do admin */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Consulta</p>
            <Link
              href="/consulta/1"
              onClick={() => setSidebarAberto(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition-colors"
            >
              <Building2 size={17} />
              Matriz Artemio
            </Link>
            <Link
              href="/consulta/2"
              onClick={() => setSidebarAberto(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition-colors"
            >
              <Store size={17} />
              Filial Iguatemi
            </Link>
          </div>
        </nav>

        {/* Rodapé: sair */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={sair}
            className="flex items-center gap-2 text-red-600 text-sm font-medium w-full px-3 py-2.5 rounded-lg hover:bg-red-50 transition"
          >
            <ArrowLeft size={16} />
            Sair do painel
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header desktop */}
        <div className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{paginaAtual}</h1>
            <p className="text-sm text-slate-500">Bem-vindo, {user.nome}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* MUDANÇA: links de consulta no header desktop — mais visíveis que antes */}
            <Link href="/consulta/1" className="text-sm text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
              Matriz
            </Link>
            <Link href="/consulta/2" className="text-sm text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
              Filial
            </Link>
            <button onClick={sair} className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition">
              Sair
            </button>
          </div>
        </div>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
