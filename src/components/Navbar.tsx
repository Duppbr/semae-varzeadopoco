'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useRouter, usePathname } from 'next/navigation';
import { BatteryCharging, ChevronRight, Menu, Settings, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  // MUDANÇA: Navbar não renderiza em rotas /admin/* porque o AdminLayout
  // já tem seu próprio header/sidebar. Renderizar os dois causava duplo menu.
  if (pathname.startsWith('/admin')) return null;

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) return <div className="h-14 bg-white border-b border-slate-100 animate-pulse" />;

  // MUDANÇA: Navbar redesenhado — mais compacto (h-14 em vez de h-16), visual consistente
  // com o sistema (slate em vez de gray), sem emojis, chevrons em vez de bullets no mobile
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <BatteryCharging size={16} />
            </div>
            <span className="text-base">Rios Baterias</span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link href="/consulta/1" className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                  Matriz
                </Link>
                <Link href="/consulta/2" className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                  Filial
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition ml-2">
                    <Settings size={13} />
                    Admin
                  </Link>
                )}
                <button onClick={logout} className="text-sm text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition ml-1">
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline px-3 py-2">
                Entrar
              </Link>
            )}
          </div>

          {/* Botão hamburguer mobile */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Menu mobile — drawer compacto com visual de lista nativa */}
        {menuAberto && (
          <div className="md:hidden border-t border-slate-100 py-2 pb-3">
            {user ? (
              <div className="space-y-0.5">
                <Link
                  href="/consulta/1"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700"
                >
                  Matriz Artemio
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
                <Link
                  href="/consulta/2"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700"
                >
                  Filial Iguatemi
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuAberto(false)}
                    className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-blue-50 text-sm font-medium text-blue-700"
                  >
                    Painel Admin
                    <ChevronRight size={16} className="text-blue-400" />
                  </Link>
                )}
                <div className="pt-1 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => { logout(); setMenuAberto(false); }}
                    className="w-full text-left px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Sair da conta ({user.nome})
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuAberto(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-blue-600"
              >
                Entrar
                <ChevronRight size={16} className="text-blue-400" />
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
