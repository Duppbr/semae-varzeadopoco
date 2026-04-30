'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Battery, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) return <div className="h-16 bg-white border-b animate-pulse"></div>;

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
              <Battery size={18} />
            </div>
            Rios Baterias
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                  Início
                </Link>
                <Link href="/consulta/1" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                  Matriz
                </Link>
                <Link href="/consulta/2" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                  Filial
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    <Settings size={14} />
                    Admin
                  </Link>
                )}
                <button onClick={logout} className="text-sm text-red-600 font-medium hover:underline">
                  Sair ({user.nome})
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
                Entrar
              </Link>
            )}
          </div>

          {/* Botão mobile */}
          <button onClick={() => setMenuAberto(!menuAberto)} className="md:hidden p-2 rounded hover:bg-gray-100">
            {menuAberto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile */}
        {menuAberto && (
          <div className="md:hidden border-t py-4 space-y-3">
            {user ? (
              <>
                <Link href="/" onClick={() => setMenuAberto(false)} className="block text-sm font-medium text-gray-700">
                  🏠 Início
                </Link>
                <Link href="/consulta/1" onClick={() => setMenuAberto(false)} className="block text-sm font-medium text-gray-700">
                  🏢 Matriz
                </Link>
                <Link href="/consulta/2" onClick={() => setMenuAberto(false)} className="block text-sm font-medium text-gray-700">
                  🏬 Filial
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" onClick={() => setMenuAberto(false)} className="block text-sm font-medium text-blue-600">
                    ⚙️ Painel Admin
                  </Link>
                )}
                <button onClick={() => { logout(); setMenuAberto(false); }} className="text-sm text-red-600 font-medium">
                  🚪 Sair
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuAberto(false)} className="block text-sm font-medium text-blue-600">
                🔐 Entrar
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}