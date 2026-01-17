-- Migration: Preencher company_id faltantes em icp_analysis_results e leads_pool
-- Data: 2026-01-18
-- Objetivo: Garantir que todos os registros tenham company_id para sincronização funcionar

-- 1. Preencher company_id em icp_analysis_results baseado em CNPJ
UPDATE public.icp_analysis_results iar
SET company_id = c.id
FROM public.companies c
WHERE iar.company_id IS NULL
  AND iar.cnpj IS NOT NULL
  AND iar.cnpj = c.cnpj
  AND c.cnpj IS NOT NULL;

-- 2. Preencher company_id em icp_analysis_results baseado em razao_social (se CNPJ não funcionar)
UPDATE public.icp_analysis_results iar
SET company_id = c.id
FROM public.companies c
WHERE iar.company_id IS NULL
  AND iar.razao_social IS NOT NULL
  AND LOWER(TRIM(iar.razao_social)) = LOWER(TRIM(c.company_name))
  AND NOT EXISTS (
    SELECT 1 FROM public.icp_analysis_results iar2 
    WHERE iar2.id = iar.id AND iar2.company_id IS NOT NULL
  );

-- 3. Preencher company_id em leads_pool baseado em CNPJ
UPDATE public.leads_pool lp
SET company_id = c.id
FROM public.companies c
WHERE lp.company_id IS NULL
  AND lp.cnpj IS NOT NULL
  AND lp.cnpj = c.cnpj
  AND c.cnpj IS NOT NULL;

-- 4. Preencher company_id em leads_pool baseado em razao_social (se CNPJ não funcionar)
UPDATE public.leads_pool lp
SET company_id = c.id
FROM public.companies c
WHERE lp.company_id IS NULL
  AND lp.razao_social IS NOT NULL
  AND LOWER(TRIM(lp.razao_social)) = LOWER(TRIM(c.company_name))
  AND NOT EXISTS (
    SELECT 1 FROM public.leads_pool lp2 
    WHERE lp2.id = lp.id AND lp2.company_id IS NOT NULL
  );

-- 5. Criar índices para melhorar performance das queries de sincronização
CREATE INDEX IF NOT EXISTS idx_icp_analysis_results_company_id_null 
ON public.icp_analysis_results(company_id) 
WHERE company_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_pool_company_id_null 
ON public.leads_pool(company_id) 
WHERE company_id IS NULL;

-- 6. Log de estatísticas
DO $$
DECLARE
  icp_updated INTEGER;
  leads_updated INTEGER;
  icp_without_company INTEGER;
  leads_without_company INTEGER;
BEGIN
  SELECT COUNT(*) INTO icp_updated
  FROM public.icp_analysis_results
  WHERE company_id IS NOT NULL;
  
  SELECT COUNT(*) INTO leads_updated
  FROM public.leads_pool
  WHERE company_id IS NOT NULL;
  
  SELECT COUNT(*) INTO icp_without_company
  FROM public.icp_analysis_results
  WHERE company_id IS NULL;
  
  SELECT COUNT(*) INTO leads_without_company
  FROM public.leads_pool
  WHERE company_id IS NULL;
  
  RAISE NOTICE 'Migration concluída:';
  RAISE NOTICE '  - icp_analysis_results com company_id: %', icp_updated;
  RAISE NOTICE '  - leads_pool com company_id: %', leads_updated;
  RAISE NOTICE '  - icp_analysis_results SEM company_id: %', icp_without_company;
  RAISE NOTICE '  - leads_pool SEM company_id: %', leads_without_company;
END $$;
