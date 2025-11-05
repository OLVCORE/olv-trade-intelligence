// Hook genérico para autosave de abas do relatório ICP
// Salva em stc_verification_history.full_report com status e cache_key
// Anti-reprocesso: se cache_key igual + status 'completed' → não reprocessa APIs

import { useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isDiagEnabled, dlog, dwarn } from '@/lib/diag';
import { DISABLE_AUTOSAVE, BLOCK_WRITES } from '@/lib/flags';

export type TabKey =
  | 'keywords' | 'totvs' | 'competitors' | 'similar'
  | 'clients' | 'decisores' | 'full360' | 'products' | 'executive';

type Params = {
  stcHistoryId: string;    // id em stc_verification_history
  tabKey: TabKey;
  cacheKey?: string;       // hash dos inputs relevantes
  initialData?: any;
};

const fetchFullReport = async (stcHistoryId: string) => {
  const { data, error } = await supabase
    .from('stc_verification_history')
    .select('id, full_report')
    .eq('id', stcHistoryId)
    .single();
  
  if (error) throw error;
  return (data?.full_report ?? {}) as any;
};

const updateFullReport = async (stcHistoryId: string, fullReport: any) => {
  // 🛡️ SPEC #SAFE-00: Bloqueio de escritas (dry-run)
  if (BLOCK_WRITES) {
    console.info('[SAFE] 🛡️ BLOCK_WRITES ativo — simulando persistência (no-op)', { stcHistoryId });
    // Retorna o payload de volta sem gravar (simula sucesso)
    return fullReport;
  }
  
  const { data, error } = await supabase
    .from('stc_verification_history')
    .update({ full_report: fullReport, updated_at: new Date().toISOString() })
    .eq('id', stcHistoryId)
    .select('id, full_report')
    .single();
  
  if (error) {
    console.error('[AUTOSAVE] ❌ Erro Supabase', error);
    throw error;
  }
  
  console.info('[AUTOSAVE] ✅ Salvo com sucesso no Supabase', { stcHistoryId });
  return data.full_report as any;
};

export function useReportAutosave({ stcHistoryId, tabKey, cacheKey, initialData }: Params) {
  const qc = useQueryClient();
  const qk = ['stc_full_report', stcHistoryId];

  // 🛡️ SPEC #SAFE-00: Flags de proteção
  const autosaveDisabled = DISABLE_AUTOSAVE;
  const blockWrites = BLOCK_WRITES;

  // 🔍 SPEC #005.D.1: Diagnóstico autosave (helpers centralizados)
  if (isDiagEnabled()) {
    dlog(`Autosave/${tabKey}`, 'init', { 
      stcHistoryId, 
      tabKey, 
      cacheKey, 
      hasInitialData: !!initialData,
      autosaveDisabled,
      blockWrites
    });
  }
  
  // 🛡️ SPEC #SAFE-00: Log de aviso se autosave desabilitado
  if (autosaveDisabled) {
    console.warn(`[SAFE] ⚠️ Autosave desabilitado para aba '${tabKey}' — nenhum salvamento automático será executado`);
  }

  const { data: fullReport, isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => fetchFullReport(stcHistoryId),
    initialData: initialData ?? {},
    staleTime: 30000, // 30s cache
  });

  const { mutateAsync: persist } = useMutation({
    mutationFn: (next: any) => {
      if (isDiagEnabled()) {
        dlog(`Autosave/${tabKey}`, 'persist:start', { payloadSize: JSON.stringify(next)?.length, tabsCount: Object.keys(next).length });
      }
      return updateFullReport(stcHistoryId, next);
    },
    onSuccess: (next) => {
      qc.setQueryData(qk, next);
      console.log(`[AUTOSAVE] ✅ Aba '${tabKey}' salva com sucesso`);
      if (isDiagEnabled()) {
        dlog(`Autosave/${tabKey}`, 'persist:success', { 
          timestamp: new Date().toISOString(),
          payloadSize: JSON.stringify(next)?.length,
          tabsInReport: Object.keys(next).length
        });
      }
    },
    onError: (error) => {
      console.error(`[AUTOSAVE] ❌ Erro ao salvar aba '${tabKey}':`, error);
      if (isDiagEnabled()) {
        dwarn(`Autosave/${tabKey}`, 'persist:error', { error, message: (error as Error)?.message });
      }
    },
  });

  const getTab = () => (fullReport?.[tabKey] ?? { data: {}, cache_key: null });
  
  const getStatus = (): 'draft' | 'processing' | 'completed' | 'error' =>
    fullReport?.__status?.[tabKey]?.status ?? 'draft';

  const setStatus = (status: 'draft' | 'processing' | 'completed' | 'error') => {
    const next = { ...(fullReport ?? {}) };
    next.__status = { ...(next.__status ?? {}) };
    next.__status[tabKey] = { status, updated_at: new Date().toISOString() };
    return next;
  };

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    async (partialData: any, status: 'draft' | 'processing' | 'completed' = 'draft') => {
      // 🛡️ SPEC #SAFE-00: Bloquear autosave se desabilitado
      if (autosaveDisabled) {
        console.info(`[SAFE] ⏸️ Autosave desabilitado — agendamento ignorado para '${tabKey}'`, { status });
        return;
      }
      
      if (timer.current) clearTimeout(timer.current);
      
      const next = setStatus(status);
      next[tabKey] = { 
        ...(getTab()), 
        data: partialData, 
        cache_key: cacheKey ?? getTab().cache_key ?? null 
      };
      
      console.log(`[AUTOSAVE] ⏳ Agendando salvamento da aba '${tabKey}' em 1.2s...`);
      if (isDiagEnabled()) {
        dlog(`Autosave/${tabKey}`, 'scheduleSave', { 
          status, 
          dataKeys: Object.keys(partialData || {}), 
          cacheKey,
          debounceMs: 1200
        });
      }
      timer.current = setTimeout(() => persist(next), 1200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stcHistoryId, tabKey, cacheKey, fullReport, autosaveDisabled]
  );

  const flushSave = useCallback(
    async (partialData: any, status: 'draft' | 'processing' | 'completed' = 'draft') => {
      // 🛡️ SPEC #SAFE-00: Bloquear flushSave se autosave desabilitado
      if (autosaveDisabled) {
        console.info(`[SAFE] ⏸️ Autosave desabilitado — flushSave ignorado para '${tabKey}'`, { status });
        return;
      }
      
      if (timer.current) clearTimeout(timer.current);
      
      const next = setStatus(status);
      next[tabKey] = { 
        ...(getTab()), 
        data: partialData, 
        cache_key: cacheKey ?? getTab().cache_key ?? null 
      };
      
      console.info('[AUTOSAVE] 🔄 flushSave()', { stcHistoryId, tabKey, status });
      if (isDiagEnabled()) {
        dlog(`Autosave/${tabKey}`, 'flushSave:immediate', { 
          status, 
          dataKeys: Object.keys(partialData || {}),
          cacheKey,
          bypass: 'debounce cleared'
        });
      }
      await persist(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stcHistoryId, tabKey, cacheKey, fullReport, autosaveDisabled]
  );

  const shouldSkipExpensiveProcessing =
    getStatus() === 'completed' && !!cacheKey && getTab().cache_key === cacheKey;

  return {
    isLoading,
    tabData: getTab().data,
    status: getStatus(),
    scheduleSave,
    flushSave,
    shouldSkipExpensiveProcessing,
  };
}

