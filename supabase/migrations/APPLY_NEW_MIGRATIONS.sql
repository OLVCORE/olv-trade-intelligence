-- ============================================================
-- APLICAR NOVAS MIGRATIONS MANUALMENTE
-- ============================================================
-- Este arquivo contém as 3 novas migrations que precisam ser aplicadas
-- Execute este arquivo diretamente no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- MIGRATION 1: Preencher company_id faltantes
-- ============================================================

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

-- ============================================================
-- MIGRATION 2: Triggers de Sincronização Automática
-- ============================================================

-- FUNÇÃO: Sincronizar ICP para Companies
CREATE OR REPLACE FUNCTION sync_icp_to_companies()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NOT NULL THEN
    UPDATE companies
    SET 
      company_name = COALESCE(NEW.razao_social, companies.company_name),
      country = COALESCE(NEW.country, companies.country),
      city = COALESCE(NEW.city, companies.city),
      state = COALESCE(NEW.state, companies.state),
      website = COALESCE(NEW.website, companies.website),
      domain = COALESCE(NEW.domain, companies.domain),
      updated_at = NOW()
    WHERE id = NEW.company_id
      AND (
        (NEW.razao_social IS NOT NULL AND NEW.razao_social IS DISTINCT FROM companies.company_name) OR
        (NEW.country IS NOT NULL AND NEW.country IS DISTINCT FROM companies.country) OR
        (NEW.city IS NOT NULL AND NEW.city IS DISTINCT FROM companies.city) OR
        (NEW.state IS NOT NULL AND NEW.state IS DISTINCT FROM companies.state) OR
        (NEW.website IS NOT NULL AND NEW.website IS DISTINCT FROM companies.website) OR
        (NEW.domain IS NOT NULL AND NEW.domain IS DISTINCT FROM companies.domain)
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_icp_to_companies_trigger ON icp_analysis_results;
CREATE TRIGGER sync_icp_to_companies_trigger
AFTER UPDATE ON icp_analysis_results
FOR EACH ROW
EXECUTE FUNCTION sync_icp_to_companies();

-- FUNÇÃO: Sincronizar Companies para ICP
CREATE OR REPLACE FUNCTION sync_companies_to_icp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE icp_analysis_results
  SET 
    razao_social = COALESCE(NEW.company_name, icp_analysis_results.razao_social),
    country = COALESCE(NEW.country, icp_analysis_results.country),
    city = COALESCE(NEW.city, icp_analysis_results.city),
    state = COALESCE(NEW.state, icp_analysis_results.state),
    website = COALESCE(NEW.website, icp_analysis_results.website),
    domain = COALESCE(NEW.domain, icp_analysis_results.domain),
    updated_at = NOW()
  WHERE company_id = NEW.id
    AND (
      (NEW.company_name IS NOT NULL AND NEW.company_name IS DISTINCT FROM icp_analysis_results.razao_social) OR
      (NEW.country IS NOT NULL AND NEW.country IS DISTINCT FROM icp_analysis_results.country) OR
      (NEW.city IS NOT NULL AND NEW.city IS DISTINCT FROM icp_analysis_results.city) OR
      (NEW.state IS NOT NULL AND NEW.state IS DISTINCT FROM icp_analysis_results.state) OR
      (NEW.website IS NOT NULL AND NEW.website IS DISTINCT FROM icp_analysis_results.website) OR
      (NEW.domain IS NOT NULL AND NEW.domain IS DISTINCT FROM icp_analysis_results.domain)
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_companies_to_icp_trigger ON companies;
CREATE TRIGGER sync_companies_to_icp_trigger
AFTER UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION sync_companies_to_icp();

-- FUNÇÃO: Sincronizar Companies para Leads Pool
CREATE OR REPLACE FUNCTION sync_companies_to_leads_pool()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE leads_pool
  SET 
    razao_social = COALESCE(NEW.company_name, leads_pool.razao_social),
    country = COALESCE(NEW.country, leads_pool.country),
    city = COALESCE(NEW.city, leads_pool.city),
    state = COALESCE(NEW.state, leads_pool.state),
    website = COALESCE(NEW.website, leads_pool.website),
    updated_at = NOW()
  WHERE company_id = NEW.id
    AND (
      (NEW.company_name IS NOT NULL AND NEW.company_name IS DISTINCT FROM leads_pool.razao_social) OR
      (NEW.country IS NOT NULL AND NEW.country IS DISTINCT FROM leads_pool.country) OR
      (NEW.city IS NOT NULL AND NEW.city IS DISTINCT FROM leads_pool.city) OR
      (NEW.state IS NOT NULL AND NEW.state IS DISTINCT FROM leads_pool.state) OR
      (NEW.website IS NOT NULL AND NEW.website IS DISTINCT FROM leads_pool.website)
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_companies_to_leads_pool_trigger ON companies;
CREATE TRIGGER sync_companies_to_leads_pool_trigger
AFTER UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION sync_companies_to_leads_pool();

-- ============================================================
-- MIGRATION 3: Funções de Validação de Consistência
-- ============================================================

CREATE OR REPLACE FUNCTION validate_enrichment_consistency()
RETURNS TABLE (
  validation_type TEXT,
  severity TEXT,
  company_id UUID,
  company_name TEXT,
  field_name TEXT,
  companies_value TEXT,
  icp_value TEXT,
  leads_pool_value TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'missing_company_id'::TEXT AS validation_type,
    'HIGH'::TEXT AS severity,
    NULL::UUID AS company_id,
    icp.razao_social AS company_name,
    'company_id'::TEXT AS field_name,
    NULL::TEXT AS companies_value,
    NULL::TEXT AS icp_value,
    NULL::TEXT AS leads_pool_value,
    'Preencher company_id baseado em CNPJ ou razao_social'::TEXT AS recommendation
  FROM icp_analysis_results icp
  WHERE icp.company_id IS NULL
    AND icp.cnpj IS NOT NULL
  LIMIT 100;
  
  RETURN QUERY
  SELECT 
    'company_name_mismatch'::TEXT AS validation_type,
    'MEDIUM'::TEXT AS severity,
    c.id AS company_id,
    c.company_name AS company_name,
    'company_name'::TEXT AS field_name,
    c.company_name AS companies_value,
    icp.razao_social AS icp_value,
    lp.razao_social AS leads_pool_value,
    'Sincronizar company_name/razao_social entre tabelas'::TEXT AS recommendation
  FROM companies c
  LEFT JOIN icp_analysis_results icp ON icp.company_id = c.id
  LEFT JOIN leads_pool lp ON lp.company_id = c.id
  WHERE (
    (icp.razao_social IS NOT NULL AND icp.razao_social IS DISTINCT FROM c.company_name) OR
    (lp.razao_social IS NOT NULL AND lp.razao_social IS DISTINCT FROM c.company_name)
  )
  LIMIT 100;
  
  RETURN QUERY
  SELECT 
    'country_mismatch'::TEXT AS validation_type,
    'MEDIUM'::TEXT AS severity,
    c.id AS company_id,
    c.company_name AS company_name,
    'country'::TEXT AS field_name,
    c.country AS companies_value,
    icp.country AS icp_value,
    lp.country AS leads_pool_value,
    'Sincronizar country entre tabelas'::TEXT AS recommendation
  FROM companies c
  LEFT JOIN icp_analysis_results icp ON icp.company_id = c.id
  LEFT JOIN leads_pool lp ON lp.company_id = c.id
  WHERE (
    (icp.country IS NOT NULL AND icp.country IS DISTINCT FROM c.country) OR
    (lp.country IS NOT NULL AND lp.country IS DISTINCT FROM c.country)
  )
  LIMIT 100;
  
  RETURN QUERY
  SELECT 
    'website_mismatch'::TEXT AS validation_type,
    'LOW'::TEXT AS severity,
    c.id AS company_id,
    c.company_name AS company_name,
    'website'::TEXT AS field_name,
    c.website AS companies_value,
    icp.website AS icp_value,
    lp.website AS leads_pool_value,
    'Sincronizar website entre tabelas'::TEXT AS recommendation
  FROM companies c
  LEFT JOIN icp_analysis_results icp ON icp.company_id = c.id
  LEFT JOIN leads_pool lp ON lp.company_id = c.id
  WHERE (
    (icp.website IS NOT NULL AND icp.website IS DISTINCT FROM c.website) OR
    (lp.website IS NOT NULL AND lp.website IS DISTINCT FROM c.website)
  )
  LIMIT 100;
  
  RETURN QUERY
  SELECT 
    'orphan_company_id'::TEXT AS validation_type,
    'HIGH'::TEXT AS severity,
    icp.company_id AS company_id,
    icp.razao_social AS company_name,
    'company_id'::TEXT AS field_name,
    NULL::TEXT AS companies_value,
    icp.company_id::TEXT AS icp_value,
    NULL::TEXT AS leads_pool_value,
    'Remover ou corrigir company_id órfão'::TEXT AS recommendation
  FROM icp_analysis_results icp
  WHERE icp.company_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = icp.company_id)
  LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION generate_consistency_report()
RETURNS TABLE (
  total_issues INTEGER,
  high_severity INTEGER,
  medium_severity INTEGER,
  low_severity INTEGER,
  missing_company_ids INTEGER,
  name_mismatches INTEGER,
  country_mismatches INTEGER,
  website_mismatches INTEGER,
  orphan_references INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validation_results RECORD;
  v_total INTEGER := 0;
  v_high INTEGER := 0;
  v_medium INTEGER := 0;
  v_low INTEGER := 0;
  v_missing INTEGER := 0;
  v_name INTEGER := 0;
  v_country INTEGER := 0;
  v_website INTEGER := 0;
  v_orphan INTEGER := 0;
BEGIN
  FOR v_validation_results IN SELECT * FROM validate_enrichment_consistency() LOOP
    v_total := v_total + 1;
    
    IF v_validation_results.severity = 'HIGH' THEN
      v_high := v_high + 1;
    ELSIF v_validation_results.severity = 'MEDIUM' THEN
      v_medium := v_medium + 1;
    ELSIF v_validation_results.severity = 'LOW' THEN
      v_low := v_low + 1;
    END IF;
    
    IF v_validation_results.validation_type = 'missing_company_id' THEN
      v_missing := v_missing + 1;
    ELSIF v_validation_results.validation_type = 'company_name_mismatch' THEN
      v_name := v_name + 1;
    ELSIF v_validation_results.validation_type = 'country_mismatch' THEN
      v_country := v_country + 1;
    ELSIF v_validation_results.validation_type = 'website_mismatch' THEN
      v_website := v_website + 1;
    ELSIF v_validation_results.validation_type = 'orphan_company_id' THEN
      v_orphan := v_orphan + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    v_total,
    v_high,
    v_medium,
    v_low,
    v_missing,
    v_name,
    v_country,
    v_website,
    v_orphan;
END;
$$;

CREATE OR REPLACE VIEW v_enrichment_consistency_report AS
SELECT * FROM validate_enrichment_consistency();

COMMENT ON FUNCTION sync_icp_to_companies IS 'Sincroniza dados de icp_analysis_results para companies quando ICP é atualizado';
COMMENT ON FUNCTION sync_companies_to_icp IS 'Sincroniza dados de companies para icp_analysis_results quando company é atualizado';
COMMENT ON FUNCTION sync_companies_to_leads_pool IS 'Sincroniza dados de companies para leads_pool quando company é atualizado';
COMMENT ON FUNCTION validate_enrichment_consistency IS 'Valida consistência de dados entre companies, icp_analysis_results e leads_pool';
COMMENT ON FUNCTION generate_consistency_report IS 'Gera relatório resumido de consistência de dados';
COMMENT ON VIEW v_enrichment_consistency_report IS 'View para consultar problemas de consistência de dados';
