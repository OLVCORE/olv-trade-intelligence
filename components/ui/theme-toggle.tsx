'use client';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = (theme === 'system' ? systemTheme : theme) || 'light';
  const isDark = current === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 items-center rounded-xl border border-white/10 px-3 text-sm text-slate-300 transition hover:bg-white/5"
      aria-label="Alternar tema"
    >
      {isDark ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
      {isDark ? 'Claro' : 'Escuro'}
    </button>
  );
}


