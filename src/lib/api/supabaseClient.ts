// ORDEM OPERACIONAL #SAFE-00 — Wrapper guardado para Supabase
// Bloqueia writes quando BLOCK_WRITES está ativo (dry-run)

import { supabase } from '@/integrations/supabase/client';
import { BLOCK_WRITES } from '@/lib/flags';

/**
 * Wrapper para operações de escrita no Supabase
 * Se BLOCK_WRITES estiver ativo, simula sucesso sem persistir (dry-run)
 * 
 * @param fn Função que retorna Promise com a operação Supabase
 * @returns Resultado da operação ou simulação
 */
export async function guardedWrite<T>(fn: () => Promise<T>): Promise<T> {
  if (BLOCK_WRITES) {
    console.info('[SAFE] 🔒 Write bloqueada (guardedWrite) — simulando sucesso sem side-effect');
    
    // Simula sucesso sem executar a operação
    // @ts-expect-error simulando sucesso
    return { ok: true, noop: true, blocked: true } as T;
  }
  
  return fn();
}

/**
 * Wrapper específico para update de full_report
 * Usado por useReportAutosave
 */
export async function updateFullReportGuarded(
  stcHistoryId: string,
  fullReport: any
): Promise<any> {
  return guardedWrite(async () => {
    const { data, error } = await supabase
      .from('stc_verification_history')
      .update({ full_report: fullReport, updated_at: new Date().toISOString() })
      .eq('id', stcHistoryId)
      .select('id, full_report')
      .single();
    
    if (error) {
      console.error('[SUPABASE] ❌ Erro ao atualizar full_report', error);
      throw error;
    }
    
    console.info('[SUPABASE] ✅ Full report atualizado com sucesso', { stcHistoryId });
    return data?.full_report ?? fullReport;
  });
}

/**
 * Re-exporta o cliente Supabase original para leituras
 * Leituras não precisam de guarda (não geram custo)
 */
export { supabase };

