/**
 * Dashboard Page - Página principal da aplicação
 * Design: OLV Galáxia Premium
 */
'use client';
import SearchHub from '@/components/SearchHub';
import { useCompany } from '@/lib/state/company';
import Link from 'next/link';
import { GlassPanel } from '@/components/olvg/GlassPanel';
import { GradientText } from '@/components/olvg/GradientText';
import {
  Building2,
  TrendingUp,
  FileText,
  Target,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

const modules = [
  {
    href: '/companies',
    icon: Building2,
    title: 'Empresas',
    desc: 'Visualize, filtre e gerencie empresas',
    active: true,
  },
  {
    href: '/playbooks',
    icon: Target,
    title: 'Playbooks',
    desc: 'SDR automatizado e sequências',
    active: true,
  },
  {
    href: '/reports',
    icon: FileText,
    title: 'Relatórios',
    desc: 'PDFs com inteligência 360°',
    active: true,
  },
  {
    href: '/analytics',
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Dashboards e métricas em tempo real',
    active: true,
  },
  {
    href: '/alerts',
    icon: AlertCircle,
    title: 'Alertas',
    desc: 'Watchers e notificações automáticas',
    active: true,
  },
];

export default function DashboardPage() {
  const companyId = useCompany((s) => s.companyId);

  return (
    <div className="space-y-8">
      <GlassPanel className="relative overflow-hidden p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-olv-accent/20 blur-3xl" />
        <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">
          Bem-vindo ao <GradientText>OLV Intelligent Prospect</GradientText>
        </h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Prospecção de alto desempenho com enriquecimento real, fit explicável e
          SDR integrado.
        </p>
        <div className="mt-6">
          <SearchHub />
        </div>
      </GlassPanel>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          🚀 Módulos Disponíveis
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href}>
                <GlassPanel className="group p-6 transition-all hover:scale-[1.02] hover:shadow-neon">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-olv-accent/20 to-olv-primary/20 p-2">
                      <Icon size={20} className="text-olv-accent" />
                    </div>
                    <h3 className="font-semibold text-slate-100">{mod.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{mod.desc}</p>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      </div>

      {companyId && (
        <GlassPanel className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-green-500/20 p-2">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Empresa Ativa</h3>
              <p className="mt-1 text-sm text-slate-400">
                Navegue pelos módulos ou{' '}
                <Link href="/companies" className="text-olv-accent underline">
                  visualize todas as empresas
                </Link>
                .
              </p>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

