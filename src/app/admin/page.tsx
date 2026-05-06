'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Package, School, Users, Ruler, Tag, ShieldCheck } from 'lucide-react';

const cards = [
  { href: '/admin/produtos',     label: 'Produtos',           Icon: Package,     color: 'bg-blue-50 text-blue-600'   },
  { href: '/admin/escolas',      label: 'Escolas / Creches',  Icon: School,      color: 'bg-green-50 text-green-600' },
  { href: '/admin/responsaveis', label: 'Responsáveis',       Icon: Users,       color: 'bg-purple-50 text-purple-600'},
  { href: '/admin/unidades',     label: 'Unidades de Medida', Icon: Ruler,       color: 'bg-orange-50 text-orange-600'},
  { href: '/admin/categorias',   label: 'Categorias',         Icon: Tag,         color: 'bg-pink-50 text-pink-600'   },
  { href: '/admin/usuarios',     label: 'Usuários',           Icon: ShieldCheck, color: 'bg-red-50 text-red-600'     },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.status === 401) { router.push('/login'); return null; }
      return r.json();
    }).then(d => {
      if (d && d.role !== 'admin') router.push('/dashboard');
      setLoading(false);
    });
  }, [router]);

  if (loading) return (
    <AppShell title="Administração">
      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
    </AppShell>
  );

  return (
    <AppShell title="Administração">
      <div className="mb-4">
        <p className="text-sm text-slate-500">Configure produtos, escolas, responsáveis e usuários do sistema.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ href, label, Icon, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center gap-3 active:bg-slate-50">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={22} />
            </div>
            <span className="text-sm font-semibold text-slate-800 text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
