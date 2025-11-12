import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnrichmentStatus {
  companyId: string;
  companyName: string;
  hasReceitaWS: boolean;
  hasDecisionMakers: boolean;
  hasDigitalPresence: boolean;
  hasMaturityScore: boolean;
  hasFitScore: boolean;
  hasLegalData: boolean;
  hasInsights: boolean;
  completionPercentage: number;
  isFullyEnriched: boolean;
}

export function useEnrichmentStatus(companyId?: string) {
  return useQuery({
    queryKey: ['enrichment-status', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data: company, error } = await supabase
        .from('companies')
        .select(`
          id,
          company_name,
          hunter_domain_data
        `)
        .eq('id', companyId)
        .single();

      if (error) throw error;

      // ✅ LÓGICA SIMPLIFICADA: Conta apenas enriquecimentos REAIS e ÚTEIS
      const rawData = (company.hunter_domain_data as any) || {};
      
      const status: EnrichmentStatus = {
        companyId: company.id,
        companyName: company.company_name,
        hasReceitaWS: false, // N/A para empresas internacionais
        hasDecisionMakers: false,
        hasDigitalPresence: !!(rawData?.fit_score),
        hasMaturityScore: !!(rawData?.fit_score),
        hasFitScore: !!(rawData?.fit_score),
        hasLegalData: false,
        hasInsights: false,
        completionPercentage: 0,
        isFullyEnriched: false,
      };

      // Calcula percentual de completude
      const checks = [
        !!(rawData?.fit_score),      // 1. Fit Score
        !!(rawData?.validated),      // 2. Validado
        !!company.company_name,      // 3. Nome
        !!company.website,           // 4. Website
      ];
      
      status.completionPercentage = Math.round(
        (checks.filter(Boolean).length / checks.length) * 100
      );
      
      status.isFullyEnriched = status.completionPercentage === 100;

      return status;
    },
    enabled: !!companyId,
    refetchInterval: 10000, // ✅ REVALIDA a cada 10 segundos
    staleTime: 5000, // ✅ Considera dados válidos por apenas 5 segundos
    refetchOnWindowFocus: true, // ✅ Revalida ao focar janela
  });
}

export function useAllEnrichmentStatus() {
  return useQuery({
    queryKey: ['all-enrichment-status'],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          id,
          company_name,
          website,
          hunter_domain_data
        `);

      if (error) throw error;

      const statusList: EnrichmentStatus[] = companies.map(company => {
        // ✅ LÓGICA SIMPLIFICADA: Dados de hunter_domain_data
        const rawData = (company.hunter_domain_data as any) || {};
        
        const status: EnrichmentStatus = {
          companyId: company.id,
          companyName: company.company_name,
          hasReceitaWS: false, // N/A para empresas internacionais
          hasDecisionMakers: false,
          hasDigitalPresence: !!(rawData?.fit_score),
          hasMaturityScore: !!(rawData?.fit_score),
          hasFitScore: !!(rawData?.fit_score),
          hasLegalData: !!(rawData?.validated),
          hasInsights: false,
          completionPercentage: 0,
          isFullyEnriched: false,
        };

        // Calcula percentual de completude
        const checks = [
          !!(rawData?.fit_score),      // 1. Fit Score
          !!(rawData?.validated),      // 2. Validado
          !!company.company_name,      // 3. Nome
          !!company.website,           // 4. Website
        ];
        
        status.completionPercentage = Math.round(
          (checks.filter(Boolean).length / checks.length) * 100
        );
        
        status.isFullyEnriched = status.completionPercentage === 100;

        return status;
      });

      return statusList;
    },
    refetchInterval: false, // Desabilitado - use manual refetch quando necessário
    staleTime: 30000, // Considera dados válidos por 30 segundos
  });
}
