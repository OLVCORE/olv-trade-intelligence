// Barra fixa de ações críticas do relatório ICP
// Consolidação de: Status + Salvar + Aprovar + Exportar PDF
// Elimina botões redundantes espalhados pela UI

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, Loader2, Save, FileText, Send, Shield } from 'lucide-react';
import { TabIndicator } from '@/components/icp/tabs/TabIndicator';
import { isDiagEnabled, dlog, dgroup, dgroupEnd, dtable } from '@/lib/diag';
import { SAFE_MODE, BLOCK_WRITES } from '@/lib/flags';

type TabStatus = 'draft' | 'processing' | 'completed' | 'error';

interface SaveBarProps {
  statuses: Record<string, TabStatus>; // Status por aba (keywords, totvs, etc)
  onSaveAll: () => Promise<void>;
  onApprove: () => Promise<void>;
  onExportPdf?: () => void;
  readOnly?: boolean;
  isSaving?: boolean;
}

export default function SaveBar({
  statuses,
  onSaveAll,
  onApprove,
  onExportPdf,
  readOnly = false,
  isSaving = false,
}: SaveBarProps) {
  console.info('[SaveBar] ✅ SaveBar montada — exibindo ações unificadas');
  
  const diag = isDiagEnabled();
  const anyProcessing = Object.values(statuses).some(s => s === 'processing');
  const allCompleted = Object.values(statuses).every(s => s === 'completed');
  const anyDraft = Object.values(statuses).some(s => s === 'draft');
  const anyError = Object.values(statuses).some(s => s === 'error');

  // 🔍 SPEC #005.D.2: Padding-top no body durante diagnóstico (evita cobrir conteúdo)
  useEffect(() => {
    if (!diag) return;
    const prev = document.body.style.paddingTop;
    document.body.style.paddingTop = '80px'; // altura da SaveBar + margem
    dlog('SaveBar', '📐 Body padding-top aplicado: 80px');
    return () => { 
      document.body.style.paddingTop = prev;
      dlog('SaveBar', '📐 Body padding-top restaurado:', prev);
    };
  }, [diag]);

  // 🔍 SPEC #005.D.1: Diagnóstico ciclo de vida (telemetria centralizada)
  useEffect(() => {
    if (!diag) return;
    
    const entries = Object.entries(statuses || {});
    dgroup('SaveBar', 'mount/update');
    dlog('SaveBar', 'readOnly:', readOnly, '| isSaving:', isSaving);
    dtable(entries.map(([tab, st]) => ({ tab, status: st })));
    dlog('SaveBar', 'Agregados → anyProcessing:', anyProcessing, '| allCompleted:', allCompleted, '| anyDraft:', anyDraft, '| anyError:', anyError);
    dlog('SaveBar', 'DOM element:', document.querySelector('.sticky.top-0.z-40, .fixed.top-0.z-\\[9999\\]') ? '✅ Found' : '❌ Not found');
    dgroupEnd();
  }, [statuses, readOnly, isSaving, anyProcessing, allCompleted, anyDraft, anyError, diag]);

  // 🔍 SPEC #005.D.2: Fixed position durante diagnóstico (maior z-index para debug)
  const wrapperClass = diag
    ? "fixed inset-x-0 top-0 z-[9999] border-b-2 border-yellow-500/70 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-md shadow-2xl"
    : "sticky top-0 z-40 border-b-2 border-slate-700/70 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md shadow-lg";

  return (
    <div className={wrapperClass}>
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-3">
        {/* 📊 Semáforos por aba */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 mr-2">Status das Abas:</span>
          {Object.entries(statuses).map(([tab, status]) => (
            <TooltipProvider key={tab}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-100 transition-colors cursor-help">
                    <TabIndicator status={status} />
                    <span className="capitalize font-medium">{tab}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-950 border-slate-700">
                  <p className="text-xs">
                    {status === 'completed' && '✅ Aba salva com sucesso'}
                    {status === 'draft' && '🟡 Aba em rascunho (não salva)'}
                    {status === 'processing' && '🔵 Processando análise...'}
                    {status === 'error' && '❌ Erro ao salvar'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* 🎯 Ações Críticas */}
        <div className="flex items-center gap-3">
          {/* Indicador de mudanças não salvas */}
          {!readOnly && anyDraft && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="font-semibold">Alterações não salvas</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Existem abas em rascunho. Clique em "Salvar Relatório".</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!readOnly && allCompleted && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold">Tudo salvo</span>
            </div>
          )}

          {/* 💾 Salvar (ÚNICO botão de salvamento) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onSaveAll}
                  disabled={readOnly || isSaving || allCompleted}
                  size="sm"
                  variant={allCompleted ? "outline" : "default"}
                  className={`gap-2 ${allCompleted ? '' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSaving || anyProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-semibold">
                  {allCompleted ? '✅ Relatório salvo' : '💾 Salvar todas as abas'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* 🛡️ SPEC #SAFE-00: Aviso de Safe Mode */}
          {SAFE_MODE && (
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {BLOCK_WRITES ? 'writes bloqueadas' : 'modo seguro'}
            </span>
          )}

          {/* 📄 Botão Exportar PDF (SECONDARY - opcional) */}
          {onExportPdf && (
            <Button
              onClick={onExportPdf}
              disabled={!allCompleted || readOnly}
              variant="outline"
              size="sm"
              className="gap-2 font-semibold"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
          )}

          {/* ✅ Botão Aprovar & Mover para Pool (ACTION) */}
          <Button
            onClick={onApprove}
            disabled={readOnly || !allCompleted || anyError}
            size="sm"
            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Aprovar & Mover para Pool
          </Button>
        </div>
      </div>
    </div>
  );
}

