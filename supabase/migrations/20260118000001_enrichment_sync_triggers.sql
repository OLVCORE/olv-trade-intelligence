-- Migration: Triggers PostgreSQL para sincronização automática de dados de enriquecimento
-- Data: 2026-01-18
-- Objetivo: Sincronizar automaticamente dados entre companies, icp_analysis_results e leads_pool

-- ============================================================
-- FUNÇÃO: Sincronizar ICP para Companies
-- ============================================================
CREATE OR REPLACE FUNCTION sync_icp_to_companies()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só sincronizar se company_id existe
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
      -- Evitar loops: só atualizar se realmente mudou
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

-- Trigger para atualizar companies quando icp_analysis_results é atualizado
DROP TRIGGER IF EXISTS sync_icp_to_companies_trigger ON icp_analysis_results;
CREATE TRIGGER sync_icp_to_companies_trigger
AFTER UPDATE ON icp_analysis_results
FOR EACH ROW
EXECUTE FUNCTION sync_icp_to_companies();

-- ============================================================
-- FUNÇÃO: Sincronizar Companies para ICP
-- ============================================================
CREATE OR REPLACE FUNCTION sync_companies_to_icp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar todos os registros ICP que referenciam esta company
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
    -- Evitar loops: só atualizar se realmente mudou
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

-- Trigger para atualizar icp_analysis_results quando companies é atualizado
DROP TRIGGER IF EXISTS sync_companies_to_icp_trigger ON companies;
CREATE TRIGGER sync_companies_to_icp_trigger
AFTER UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION sync_companies_to_icp();

-- ============================================================
-- FUNÇÃO: Sincronizar Companies para Leads Pool
-- ============================================================
CREATE OR REPLACE FUNCTION sync_companies_to_leads_pool()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar todos os registros leads_pool que referenciam esta company
  UPDATE leads_pool
  SET 
    razao_social = COALESCE(NEW.company_name, leads_pool.razao_social),
    country = COALESCE(NEW.country, leads_pool.country),
    city = COALESCE(NEW.city, leads_pool.city),
    state = COALESCE(NEW.state, leads_pool.state),
    website = COALESCE(NEW.website, leads_pool.website),
    updated_at = NOW()
  WHERE company_id = NEW.id
    -- Evitar loops: só atualizar se realmente mudou
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

-- Trigger para atualizar leads_pool quando companies é atualizado
DROP TRIGGER IF EXISTS sync_companies_to_leads_pool_trigger ON companies;
CREATE TRIGGER sync_companies_to_leads_pool_trigger
AFTER UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION sync_companies_to_leads_pool();

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON FUNCTION sync_icp_to_companies IS 'Sincroniza dados de icp_analysis_results para companies quando ICP é atualizado';
COMMENT ON FUNCTION sync_companies_to_icp IS 'Sincroniza dados de companies para icp_analysis_results quando company é atualizado';
COMMENT ON FUNCTION sync_companies_to_leads_pool IS 'Sincroniza dados de companies para leads_pool quando company é atualizado';

-- ============================================================
-- NOTA: Prevenção de Loops
-- ============================================================
-- Os triggers incluem verificações de mudança real (IS DISTINCT FROM)
-- para evitar loops infinitos. Ainda assim, se houver necessidade de
-- desabilitar triggers temporariamente, use:
--   ALTER TABLE companies DISABLE TRIGGER sync_companies_to_icp_trigger;
--   ALTER TABLE companies DISABLE TRIGGER sync_companies_to_leads_pool_trigger;
--   ALTER TABLE icp_analysis_results DISABLE TRIGGER sync_icp_to_companies_trigger;
