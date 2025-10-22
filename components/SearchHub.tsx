/**
 * SearchHub - Busca única por CNPJ ou Website
 * Design: OLV Galáxia Premium
 */
'use client';
import { useState } from 'react';
import { useCompany } from '@/lib/state/company';
import { GlassPanel } from '@/components/olvg/GlassPanel';
import { GradientText } from '@/components/olvg/GradientText';
import { Loader2, Search } from 'lucide-react';

type Mode = 'CNPJ' | 'Website';

export default function SearchHub() {
  const [mode, setMode] = useState<Mode>('CNPJ');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const setCompany = useCompany((s) => s.setCompany);

  async function onSearch() {
    setMsg(null);
    if (!value.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/companies/smart-search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          mode === 'CNPJ' ? { cnpj: value } : { website: value }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Falha na busca');
      
      setCompany({
        id: data.company.id,
        name: data.company.name,
        cnpj: data.company.cnpj,
        website: data.company.website,
      });
      setMsg(`✅ ${data?.company?.name || 'Empresa'} definida como ativa.`);
      setValue('');
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassPanel className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-100">
          <GradientText>SearchHub</GradientText>
        </h2>
        <p className="text-sm text-slate-400">
          Busque por <strong>CNPJ</strong> ou <strong>Website</strong> e
          definimos o contexto global.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 outline-none focus:ring-2 focus:ring-olv-accent/40"
        >
          <option value="CNPJ">CNPJ</option>
          <option value="Website">Website</option>
        </select>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? onSearch() : null)}
          placeholder={mode === 'CNPJ' ? '00.000.000/0000-00' : 'dominio.com.br'}
          className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-slate-100 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-olv-accent/40"
        />

        <button
          onClick={onSearch}
          disabled={loading}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-olv-accent to-olv-primary px-5 font-medium text-slate-900 transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} className="transition group-hover:scale-110" />
          )}
          Buscar
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-slate-300">{msg}</p>}
    </GlassPanel>
  );
}

