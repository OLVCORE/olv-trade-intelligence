import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook otimizado para métricas do fluxo ICP
 * Usa Promise.all() para paralelismo (performance melhorada)
 */
export function useICPFlowMetrics() {
  return useQuery({
    queryKey: ['icp-flow-metrics'],
    queryFn: async () => {
      // PARALLEL QUERIES PARA MÁXIMA PERFORMANCE
      const [
        { count: quarentena },
        { count: pool },
        { count: ativas },
      ] = await Promise.all([
        supabase
          .from('icp_analysis_results')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pendente'),
        supabase
          .from('leads_pool')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('companies')
          .select('id', { count: 'exact', head: true }),
      ]);

      return {
        quarentena: quarentena || 0,
        pool: pool || 0,
        ativas: ativas || 0,
        total: (quarentena || 0) + (pool || 0) + (ativas || 0),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}
