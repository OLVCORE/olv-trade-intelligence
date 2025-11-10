import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseProductGapsParams {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  detectedProducts?: string[];
  detectedEvidences?: Array<{
    product: string;
    sources: Array<{ url: string; title: string; source_name: string }>;
  }>;
  competitors?: any[];
  similarCompanies?: any[];
  decisorsData?: any;
  digitalData?: any;
  analysis360Data?: any;
  enabled?: boolean;
}

export function useProductGaps({
  companyId,
  companyName,
  cnpj,
  sector,
  cnae,
  size,
  employees,
  detectedProducts = [],
  detectedEvidences = [],
  competitors = [],
  similarCompanies = [],
  decisorsData,
  digitalData,
  analysis360Data,
  enabled = true
}: UseProductGapsParams) {
  return useQuery({
    queryKey: ['product-gaps', companyId, companyName, sector, detectedProducts.join(',')],
    queryFn: async () => {
      console.log('[useProductGaps] 🧠 ANÁLISE HOLÍSTICA - Buscando recomendações para:', companyName);
      console.log('[useProductGaps] 📦 Setor:', sector, '| CNAE:', cnae, '| Funcionários:', employees);
      console.log('[useProductGaps] 🔍 Produtos detectados:', detectedProducts.length);
      console.log('[useProductGaps] 📋 Evidências:', detectedEvidences.length);
      console.log('[useProductGaps] 👥 Decisores:', decisorsData?.total || 0);
      console.log('[useProductGaps] 🌐 Digital Score:', digitalData?.maturityScore || 0);
      console.log('[useProductGaps] 💰 Saúde:', analysis360Data?.healthScore || 'unknown');

      const { data, error } = await supabase.functions.invoke('generate-product-gaps', {
        body: {
          companyId,
          companyName,
          cnpj,
          sector,
          cnae,
          size,
          employees,
          detectedProducts,
          detectedEvidences,
          competitors,
          similarCompanies,
          // 🧠 CONTEXTO HOLÍSTICO
          decisorsData,
          digitalData,
          analysis360Data
        }
      });

      if (error) {
        console.error('[useProductGaps] Erro:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar recomendações');
      }

      console.log('[useProductGaps] Sucesso:', data.recommended_products?.length || 0, 'produtos');

      return data;
    },
    enabled: enabled && !!companyName,
    staleTime: 1000 * 60 * 60 * 24, // ⚡ 24 HORAS (cache longo)
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,     // ❌ NÃO refetch ao trocar aba!
    refetchOnMount: false,           // ❌ NÃO refetch ao montar!
    retry: 2
  });
}

