// SPEC #SAFE-00 — Banner de aviso de Safe Mode
// Exibe quando flags de proteção estão ativas

import { SAFE_MODE, DISABLE_AUTOSAVE, DISABLE_AUTO_DISCOVERY, BLOCK_WRITES, getActiveFlagsReport } from '@/lib/flags';
import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

export default function SafeModeBanner() {
  const [expanded, setExpanded] = useState(false);
  
  // Não renderiza se Safe Mode não estiver ativo
  if (!SAFE_MODE) return null;

  const flags = getActiveFlagsReport();
  const activeCount = Object.values(flags).filter(Boolean).length;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md">
      <div className="rounded-xl bg-gradient-to-r from-amber-900 to-amber-800 text-amber-50 shadow-2xl border-2 border-amber-500">
        {/* Header compacto */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-800/50 transition-colors rounded-t-xl"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-200" />
            <div className="text-left">
              <div className="font-bold text-sm">🛡️ SAFE MODE ATIVO</div>
              <div className="text-xs text-amber-200">{activeCount} proteções ativas</div>
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>

        {/* Detalhes expandidos */}
        {expanded && (
          <div className="px-4 py-3 border-t border-amber-600/50 text-xs space-y-2">
            {DISABLE_AUTOSAVE && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span>Autosave desabilitado</span>
              </div>
            )}
            {DISABLE_AUTO_DISCOVERY && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span>Auto-discovery desabilitado</span>
              </div>
            )}
            {BLOCK_WRITES && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                <span className="font-semibold">Todas as escritas bloqueadas (dry-run)</span>
              </div>
            )}
            <div className="pt-2 border-t border-amber-600/30 text-amber-300">
              ℹ️ Para desativar, edite <code className="bg-amber-950/50 px-1 rounded">.env.local</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

