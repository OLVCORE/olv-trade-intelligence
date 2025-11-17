import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralizado para contagem de hot leads
 * Fonte única de verdade para hot leads count (temperatura='hot' + status='aprovado')
 */
export function useHotLeadsCount() {
  return useQuery({
    queryKey: ['hot-leads-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('icp_analysis_results')
        .select('*', { count: 'exact', head: true })
        .eq('temperatura', 'hot')
        .eq('status', 'aprovado');

      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

