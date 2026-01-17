-- Migration: Script de Validação de Consistência de Dados
-- Data: 2026-01-18
-- Objetivo: Validar e reportar inconsistências entre companies, icp_analysis_results e leads_pool

-- ============================================================
-- FUNÇÃO: Validar Consistência de Dados de Enriquecimento
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
  -- Validar company_id faltantes
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
  
  -- Validar inconsistências em company_name
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
  
  -- Validar inconsistências em country
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
  
  -- Validar inconsistências em website
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
  
  -- Validar company_id órfãos (referencia company que não existe)
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

-- ============================================================
-- FUNÇÃO: Gerar Relatório de Consistência
-- ============================================================
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
  -- Contar issues por tipo
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

-- ============================================================
-- VIEW: Relatório de Consistência (Para Consulta Fácil)
-- ============================================================
CREATE OR REPLACE VIEW v_enrichment_consistency_report AS
SELECT * FROM validate_enrichment_consistency();

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON FUNCTION validate_enrichment_consistency IS 'Valida consistência de dados entre companies, icp_analysis_results e leads_pool';
COMMENT ON FUNCTION generate_consistency_report IS 'Gera relatório resumido de consistência de dados';
COMMENT ON VIEW v_enrichment_consistency_report IS 'View para consultar problemas de consistência de dados';

-- ============================================================
-- EXEMPLO DE USO
-- ============================================================
-- Para executar a validação:
--   SELECT * FROM validate_enrichment_consistency();
--
-- Para gerar relatório resumido:
--   SELECT * FROM generate_consistency_report();
--
-- Para consultar via view:
--   SELECT * FROM v_enrichment_consistency_report WHERE severity = 'HIGH';
