import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SimpleProductCheckParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  enabled?: boolean;
}

export const useSimpleProductCheck = ({
  companyId,
  companyName,
  cnpj,
  domain,
  enabled = false,
}: SimpleProductCheckParams) => {
  return useQuery({
    queryKey: ['simple-product-check', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] Chamando strategic-intelligence-check...');

      const { data, error } = await supabase.functions.invoke('strategic-intelligence-check', {
        body: {
          company_id: companyId,
          company_name: companyName,
          cnpj,
          domain,
        },
      });

      if (error) {
        console.error('[HOOK] Erro:', error);
        throw error;
      }

      console.log('[HOOK] Resultado:', data);
      
      // 💾 AUTO-SALVAR NO HISTÓRICO SCI + FULL_REPORT (evitar desperdício de créditos!)
      if (data && companyId) {
        try {
          const result = data.data || data;
          
          // 1) Salvar na tabela stc_verification_history (SCI)
          const reportData = {
            company_id: companyId,
            company_name: companyName || 'N/A',
            cnpj: cnpj || null,
            status: result.status || 'unknown',
            confidence: result.confidence || 'medium',
            triple_matches: result.triple_matches || 0,
            double_matches: result.double_matches || 0,
            single_matches: result.single_matches || 0,
            total_score: result.total_score || result.total_weight || 0,
            evidences: result.evidences || [],
            sources_consulted: result.sources_consulted || result.methodology?.searched_sources || 0,
            queries_executed: result.queries_executed || result.methodology?.total_queries || 0,
            verification_duration_ms: result.execution_time_ms || parseInt(result.methodology?.execution_time) || 0,
            full_report: {
              __meta: {
                created_at: new Date().toISOString(),
                status: 'completed',
                company_name: companyName || 'N/A',
                cnpj: cnpj || null,
              },
              __status: {
                detection: { status: 'completed', updated_at: new Date().toISOString() },
              },
              detection_report: result // 🔥 SALVA RESULTADO COMPLETO DA ABA 1 (Strategic Intelligence Check)
            }
          };
          
          const { data: insertedData, error: insertError } = await supabase
            .from('stc_verification_history')
            .insert(reportData)
            .select('id')
            .single();
          
          if (insertError) {
            if (insertError.code === 'PGRST116' || insertError.message?.includes('does not exist')) {
              console.warn('[SCI] ⚠️ Tabela stc_verification_history não existe. Execute a migration: 20260117000000_ensure_stc_verification_history.sql');
            } else {
              console.error('[SCI] ❌ Erro ao salvar histórico:', insertError);
            }
          } else {
            console.log('[SCI] ✅ Relatório SCI salvo no histórico. ID:', insertedData?.id);
          }
        } catch (historyError: any) {
          console.error('[SCI] ❌ Erro ao salvar histórico (não crítico):', historyError);
          // Não falha a verificação se salvar histórico falhar
        }
      }
      
      return data;
    },
    enabled: enabled && (!!companyName || !!cnpj),
    staleTime: 1000 * 60 * 60 * 24, // ⚡ 24 HORAS (não reconsumir!)
    gcTime: 1000 * 60 * 60 * 24,    // 24h em cache
    refetchOnMount: false,           // ❌ NÃO refetch ao montar!
    refetchOnWindowFocus: false,     // ❌ NÃO refetch ao trocar aba!
  });
};
