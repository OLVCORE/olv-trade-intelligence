import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralizado para contagem de empresas aprovadas
 * Fonte única de verdade para approved count (status='aprovado')
 */
export function useApprovedCount() {
  return useQuery({
    queryKey: ['approved-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('icp_analysis_results')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aprovado');

      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

