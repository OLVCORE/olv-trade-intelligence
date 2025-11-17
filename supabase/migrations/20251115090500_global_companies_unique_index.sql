-- ============================================================================
-- Índice único usando fallback (domínio ou nome) para deduplicar global_companies
-- ============================================================================

ALTER TABLE public.global_companies
  DROP CONSTRAINT IF EXISTS global_companies_domain_key;

DROP INDEX IF EXISTS idx_global_companies_tenant_domain;

ALTER TABLE public.global_companies
  DROP COLUMN IF EXISTS domain_key;

ALTER TABLE public.global_companies
  ADD COLUMN domain_key text
    GENERATED ALWAYS AS (
      COALESCE(
        NULLIF(domain, ''),
        company_name || '|' || COALESCE(country, ''),
        company_name
      )
    ) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_companies_tenant_domain
ON public.global_companies (tenant_id, domain_key);

