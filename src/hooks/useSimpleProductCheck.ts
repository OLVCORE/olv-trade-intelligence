import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['simple-product-check', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] ✅ SCI REATIVADO - Chamando strategic-intelligence-check (OTIMIZADO)...');

      // Buscar tenant_id e user_id para Product Fit Analysis
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user?.id)
        .maybeSingle();
      
      const { data, error } = await supabase.functions.invoke('strategic-intelligence-check', {
        body: {
          company_id: companyId,
          company_name: companyName,
          cnpj,
          domain,
          tenant_id: userData?.tenant_id || null,
          user_id: user?.id || null,
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
          
          // 🔍 Verificar se já existe um relatório para esta empresa
          const { data: existingReport } = await supabase
            .from('stc_verification_history')
            .select('id')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          let savedReportId: string | null = null;
          
          if (existingReport?.id) {
            // ✅ ATUALIZAR relatório existente (evita duplicatas)
            const { data: updatedData, error: updateError } = await supabase
              .from('stc_verification_history')
              .update({
                ...reportData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingReport.id)
              .select('id')
              .single();
            
            if (updateError) {
              console.error('[SCI] ❌ Erro ao atualizar histórico:', updateError);
            } else {
              savedReportId = updatedData?.id || existingReport.id;
              console.log('[SCI] ✅ Relatório SCI ATUALIZADO no histórico. ID:', savedReportId);
            }
          } else {
            // ➕ CRIAR novo relatório (primeira vez)
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
              savedReportId = insertedData?.id || null;
              console.log('[SCI] ✅ Relatório SCI CRIADO no histórico. ID:', savedReportId);
            }
          }
          
          // 🔥 CRÍTICO: Invalidar cache do React Query para forçar recarregamento
          if (savedReportId) {
            queryClient.invalidateQueries({ queryKey: ['stc-latest', companyId, companyName] });
            queryClient.invalidateQueries({ queryKey: ['stc-history', companyId, companyName] });
            queryClient.invalidateQueries({ queryKey: ['report-history', companyName, companyId] });
            console.log('[SCI] 🔄 Cache do React Query invalidado para recarregar latestReport');
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
