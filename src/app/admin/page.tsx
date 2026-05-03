'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import {
  Car,
  Download,
  History,
  Map,
  Package,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

const funcionalidades = [
  {
    titulo: 'Visao completa',
    descricao: 'Compare estoque, precos e prioridade das duas lojas.',
    href: '/admin/todas-lojas',
    icone: Map,
    cor: 'bg-blue-600',
  },
  {
    titulo: 'Produtos',
    descricao: 'Cadastre, edite precos, estoque e dados tecnicos.',
    href: '/admin/produtos',
    icone: Package,
    cor: 'bg-indigo-600',
  },
  {
    titulo: 'Usuarios',
    descricao: 'Controle acessos e mantenha o dono protegido.',
    href: '/admin/usuarios',
    icone: Users,
    cor: 'bg-emerald-600',
  },
  {
    titulo: 'Opcoes',
    descricao: 'Padronize marca, amperagem, tipo e garantia.',
    href: '/admin/opcoes',
    icone: SlidersHorizontal,
    cor: 'bg-amber-500',
  },
  {
    titulo: 'Atalhos',
    descricao: 'Monte filtros rapidos para o balcao consultar melhor.',
    href: '/admin/atalhos',
    icone: Zap,
    cor: 'bg-orange-500',
  },
  {
    titulo: 'Aplicacoes',
    descricao: 'Vincule veiculos e baterias para busca guiada.',
    href: '/admin/aplicacoes',
    icone: Car,
    cor: 'bg-purple-600',
  },
  {
    titulo: 'Importar CSV',
    descricao: 'Atualize estoque, produtos e custos em lote.',
    href: '/admin/importar',
    icone: Upload,
    cor: 'bg-teal-600',
  },
  {
    titulo: 'Backup',
    descricao: 'Exporte e restaure dados importantes com cuidado.',
    href: '/admin/backup',
    icone: Download,
    cor: 'bg-rose-600',
  },
  {
    titulo: 'Logs e auditoria',
    descricao: 'Veja acessos, importacoes e alteracoes feitas no sistema.',
    href: '/admin/logs',
    icone: History,
    cor: 'bg-slate-700',
    masterOnly: true,
  },
];

export default function AdminDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return <div className="text-center py-12">Carregando...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-slate-950 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-sm text-blue-100 mb-4">
            <ShieldCheck size={16} />
            Sistema interno protegido
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Bem-vindo, {user.nome}</h2>
          <p className="text-slate-300 mt-2 max-w-2xl">
            Gerencie precos, estoque, usuarios, aplicacoes por veiculo e backups em um painel unico.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-blue-600/20 blur-3xl" />
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Acoes principais</h3>
            <p className="text-sm text-slate-500">Escolha a area que deseja administrar.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {funcionalidades.filter(f => !f.masterOnly || user.protegido).map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-lg transition"
            >
              <div className={`${f.cor} w-11 h-11 rounded-lg flex items-center justify-center mb-4 shadow-sm`}>
                <f.icone size={21} className="text-white" />
              </div>
              <h4 className="font-semibold text-slate-950 group-hover:text-blue-700">{f.titulo}</h4>
              <p className="text-sm text-slate-500 mt-1 min-h-10">{f.descricao}</p>
              <span className="text-sm text-blue-600 font-medium mt-4 inline-block">Abrir</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
