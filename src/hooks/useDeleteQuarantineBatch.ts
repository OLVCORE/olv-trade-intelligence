import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeleteQuarantineBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisIds: string[]) => {
      console.log('[DELETE BATCH] ⚠️ ATENÇÃO: Deletando permanentemente:', {
        count: analysisIds.length,
        ids: analysisIds,
        warning: 'Esta ação é IRREVERSÍVEL. As empresas serão APAGADAS do banco de dados.',
      });

      const { error } = await supabase
        .from('icp_analysis_results')
        .delete()
        .in('id', analysisIds);

      if (error) {
        console.error('[DELETE BATCH] ❌ Erro:', error);
        throw error;
      }

      console.log('[DELETE BATCH] ✅ Empresas deletadas permanentemente do banco de dados');
      return analysisIds;
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      toast.warning(
        `⚠️ ${deletedIds.length} empresa(s) deletada(s) PERMANENTEMENTE`,
        {
          description: 'Esta ação é irreversível. Para recuperar empresas, use "Descartar" em vez de "Deletar".',
          duration: 5000,
        }
      );
    },
    onError: (error: any) => {
      console.error('[DELETE BATCH] ❌ Erro:', error);
      toast.error(`Erro ao deletar empresas: ${error.message}`);
    },
  });
}
