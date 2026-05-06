'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  PackageMinus,
  PackagePlus,
  Package,
  MoreHorizontal,
  Trash2,
  ShoppingCart,
  BarChart2,
  Settings,
  X,
} from 'lucide-react';

const tabs = [
  { href: '/dashboard', label: 'Início',   Icon: LayoutDashboard },
  { href: '/saida',     label: 'Saída',    Icon: PackageMinus     },
  { href: '/entrada',   label: 'Entrada',  Icon: PackagePlus      },
  { href: '/estoque',   label: 'Estoque',  Icon: Package          },
];

const extraMenu = [
  { href: '/descarte',       label: 'Descarte',         Icon: Trash2       },
  { href: '/pedido-compra',  label: 'Pedido de Compra', Icon: ShoppingCart },
  { href: '/relatorios',     label: 'Relatórios',       Icon: BarChart2    },
  { href: '/admin',          label: 'Administração',    Icon: Settings     },
];

export default function TabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottom sheet overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet menu */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-between items-center px-5 pt-4 pb-2">
          <span className="font-semibold text-slate-900">Mais opções</span>
          <button onClick={() => setOpen(false)} className="p-2 rounded-full bg-slate-100 active:bg-slate-200">
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="px-4 pb-6 grid grid-cols-2 gap-3">
          {extraMenu.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors active:scale-95 ${
                pathname.startsWith(href)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-center"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors active:bg-slate-50 ${active ? 'text-blue-600' : 'text-slate-500'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors active:bg-slate-50 ${open ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <MoreHorizontal size={22} strokeWidth={open ? 2.5 : 1.8} />
          <span className={`text-xs ${open ? 'font-semibold' : 'font-medium'}`}>Mais</span>
        </button>
      </nav>
    </>
  );
}
