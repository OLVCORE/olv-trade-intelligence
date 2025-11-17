import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralizado para contagem de empresas em quarentena
 * Fonte única de verdade para quarantine count (status='pendente')
 */
export function useQuarantineCount() {
  return useQuery({
    queryKey: ['quarantine-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('icp_analysis_results')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

