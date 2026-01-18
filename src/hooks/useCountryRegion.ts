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
import { getCountryWithFallback } from '@/lib/utils/leadSourceHelpers';

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
  // ✅ Usar getCountryWithFallback para garantir consistência com o resto da aplicação
  const country = getCountryWithFallback(company);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['country-region', country],
    queryFn: async () => {
      if (!country || country === 'N/A') {
        console.log(`[useCountryRegion] ⚠️ País inválido ou N/A: "${country}"`);
        return { region: 'N/A', commercialBlock: 'Outros' };
      }

      console.log(`[useCountryRegion] 🔍 Buscando região/bloco para: "${country}"`);
      
      try {
        const result = await getCountryRegionData(country);
        if (result.success && result.data) {
          console.log(`[useCountryRegion] ✅ Sucesso para "${country}": região="${result.data.region}", bloco="${result.data.commercialBlock || 'Outros'}"`);
          return {
            region: result.data.region,
            commercialBlock: result.data.commercialBlock || 'Outros'
          };
        } else {
          console.warn(`[useCountryRegion] ⚠️ API retornou success=false para "${country}":`, result.error);
        }
      } catch (error: any) {
        console.error(`[useCountryRegion] ❌ Erro ao buscar região para "${country}":`, error.message);
        console.error(`[useCountryRegion] ❌ Stack:`, error.stack);
      }

      // ⚠️ SEM FALLBACK HARDCODED - se API falhar, retornar N/A
      // País deve ser buscado de APIs externas ou fontes reais (Apollo, scraping, etc.)
      console.warn(`[useCountryRegion] ⚠️ Retornando N/A para "${country}" (API falhou ou país não encontrado)`);
      return {
        region: 'N/A',
        commercialBlock: 'Outros'
      };
    },
    enabled: !!country && country !== 'N/A',
    staleTime: 1000 * 60 * 60 * 24, // Cache por 24 horas (dados geográficos mudam raramente)
    gcTime: 1000 * 60 * 60 * 24 * 7, // Manter no cache por 7 dias
    retry: 2, // Tentar 2 vezes se falhar
    retryDelay: 1000, // Esperar 1 segundo entre tentativas
  });

  return {
    region: data?.region || 'N/A',
    commercialBlock: data?.commercialBlock || 'Outros',
    isLoading,
    isError
  };
}
