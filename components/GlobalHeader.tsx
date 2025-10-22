/**
 * GlobalHeader - Header fixo com contexto da empresa selecionada
 * Design: OLV Galáxia Premium
 */
'use client';
import { useCompany } from '@/lib/state/company';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GradientText } from '@/components/olvg/GradientText';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/companies', label: 'Empresas' },
  { href: '/playbooks', label: 'Playbooks' },
  { href: '/reports', label: 'Relatórios' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/alerts', label: 'Alertas' },
];

export default function GlobalHeader() {
  const { companyId, name, cnpj, clear } = useCompany();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-olv-ink/40 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="group">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-glow rounded-2xl bg-gradient-to-br from-olv-accent to-olv-primary" />
              <div className="text-lg font-semibold text-slate-100">
                OLV <GradientText className="font-bold">Intelligent Prospect</GradientText> v2
              </div>
            </div>
          </Link>
          <nav className="ml-6 hidden items-center gap-2 md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-xl px-3 py-1.5 text-sm transition
                    ${active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Workspace:</span>
            <WorkspaceSwitcher />
          </div>
          {companyId && (
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
                {name}
                {cnpj ? ` (${cnpj})` : ''}
              </span>
              <button
                onClick={clear}
                className="text-xs text-slate-400 underline hover:no-underline"
              >
                Trocar
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

