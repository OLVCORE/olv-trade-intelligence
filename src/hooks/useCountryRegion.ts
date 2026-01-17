/**
 * HOOK: useCountryRegion
 * 
 * Hook React para buscar região/bloco comercial dinamicamente via API
 * 
 * ✅ Usa React Query para cache automático
 * ✅ Fallback para mapeamento estático se API falhar
 * ✅ Sem hardcoding
 */

import { useQuery } from '@tanstack/react-query';
import { getCountryRegionData } from '@/services/countryRegionService';
import { getContinentDisplay } from '@/lib/utils/leadSourceHelpers';

interface UseCountryRegionResult {
  region: string;
  commercialBlock: string;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hook para buscar região e bloco comercial de um país
 */
export function useCountryRegion(company: any): UseCountryRegionResult {
  const country = company?.country || 
                  company?.raw_data?.country || 
                  company?.raw_analysis?.country ||
                  company?.raw_data?.international_enrichment?.country ||
                  'N/A';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['country-region', country],
    queryFn: async () => {
      if (!country || country === 'N/A') {
        return { region: 'N/A', commercialBlock: 'Outros' };
      }

      try {
        const result = await getCountryRegionData(country);
        if (result.success && result.data) {
          return {
            region: result.data.region,
            commercialBlock: result.data.commercialBlock || 'Outros'
          };
        }
      } catch (error: any) {
        console.warn(`[useCountryRegion] ⚠️ Erro ao buscar região para ${country}:`, error.message);
      }

      // Fallback para mapeamento estático
      const staticRegion = getContinentDisplay(company);
      return {
        region: staticRegion,
        commercialBlock: 'Outros'
      };
    },
    enabled: !!country && country !== 'N/A',
    staleTime: 1000 * 60 * 60 * 24, // Cache por 24 horas (dados geográficos mudam raramente)
    gcTime: 1000 * 60 * 60 * 24 * 7, // Manter no cache por 7 dias
  });

  return {
    region: data?.region || 'N/A',
    commercialBlock: data?.commercialBlock || 'Outros',
    isLoading,
    isError
  };
}
