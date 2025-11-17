import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralizado para valor total do pipeline
 * Fonte única de verdade para pipeline value
 * Usa sdr_deals (fonte principal de deals ativos)
 */
export function usePipelineValue() {
  return useQuery({
    queryKey: ['pipeline-value'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_deals')
        .select('deal_value')
        .in('deal_stage', ['discovery', 'qualification', 'proposal', 'negotiation']);

      if (error) throw error;

      const totalValue = (data || []).reduce((sum, deal) => {
        return sum + (Number(deal.deal_value) || 0);
      }, 0);

      return totalValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

