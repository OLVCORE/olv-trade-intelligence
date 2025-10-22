'use client';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

export default function InsightDock() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 top-24 z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-2xl bg-olv-primary/90 px-4 py-2 text-white shadow-neon transition hover:scale-[1.02]"
      >
        <Sparkles size={16} className="mr-2 inline" /> Insights
      </button>

      {open && (
        <div className="mt-3 max-h-[70vh] w-[380px] overflow-hidden">
          <GlassPanel className="p-4">
            <h3 className="font-semibold text-slate-100">OLV Insight Dock</h3>
            <p className="mt-1 text-sm text-slate-400">
              Pergunte algo como:{' '}
              <em>"Quais empresas têm maior FIT esta semana?"</em>
            </p>
            <div className="mt-3">
              <textarea
                placeholder="Escreva sua pergunta…"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-olv-accent/40"
                rows={3}
              />
              <div className="mt-3 flex gap-2">
                <button className="rounded-xl bg-olv-accent/90 px-4 py-2 font-medium text-slate-900 hover:brightness-110">
                  Perguntar
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-slate-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}


