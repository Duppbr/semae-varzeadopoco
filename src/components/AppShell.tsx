'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import TabBar from '@/components/TabBar';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export default function AppShell({ children, title, backHref, actions, noPadding }: AppShellProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* Top navbar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 flex items-center h-14 px-4 gap-3"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {backHref ? (
          <Link href={backHref} className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200">
            <ArrowLeft size={20} />
          </Link>
        ) : (
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 sr-only">
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="flex-1">
          <h1 className="font-bold text-slate-900 text-base leading-tight truncate">{title}</h1>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {!backHref && (
          <button
            onClick={handleLogout}
            className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        )}
      </header>

      {/* Main content */}
      <main className={`flex-1 ${noPadding ? '' : 'px-4 py-4'} pb-24`}>
        {children}
      </main>

      <TabBar />
    </div>
  );
}
