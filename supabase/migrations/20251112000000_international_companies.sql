-- =====================================================
-- INTERNATIONAL COMPANIES SUPPORT
-- =====================================================
-- Purpose: Support non-Brazilian companies (dealers, importers)
-- Date: 2025-11-12
-- =====================================================

-- 1. Tornar CNPJ nullable (empresas internacionais não têm CNPJ)
ALTER TABLE public.companies
  ALTER COLUMN cnpj DROP NOT NULL;

-- 2. Adicionar colunas para empresas internacionais
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS employees_count INTEGER,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS b2b_type TEXT CHECK (b2b_type IN ('distributor', 'wholesaler', 'importer', 'manufacturer', 'retailer', 'trader')),
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS hunter_domain_data JSONB,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Criar índices para performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_apollo_id_unique 
  ON public.companies(apollo_id) 
  WHERE apollo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_country 
  ON public.companies(country) 
  WHERE country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_b2b_type 
  ON public.companies(b2b_type) 
  WHERE b2b_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_employees 
  ON public.companies(employees_count) 
  WHERE employees_count IS NOT NULL;

-- 4. Constraint: Ao menos um identificador único
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_has_identifier;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_has_identifier 
  CHECK (
    (cnpj IS NOT NULL AND cnpj != '') OR 
    (website IS NOT NULL AND website != '') OR 
    (apollo_id IS NOT NULL AND apollo_id != '')
  );

-- 5. Comentários para documentação
COMMENT ON COLUMN public.companies.country IS 'País da empresa (código ISO-2 ou nome completo)';
COMMENT ON COLUMN public.companies.b2b_type IS 'Tipo de empresa B2B: distributor, wholesaler, importer, manufacturer, retailer, trader';
COMMENT ON COLUMN public.companies.employees_count IS 'Número de colaboradores (fonte: LinkedIn/Apollo)';
COMMENT ON COLUMN public.companies.revenue_range IS 'Faixa de receita anual (ex: $10M-$50M, €5M-€10M)';
COMMENT ON COLUMN public.companies.apollo_id IS 'ID único do Apollo.io (evita duplicatas)';
COMMENT ON COLUMN public.companies.linkedin_url IS 'URL do perfil LinkedIn da empresa';
COMMENT ON COLUMN public.companies.hunter_domain_data IS 'Dados do Hunter.io (email pattern, score, etc)';
COMMENT ON COLUMN public.companies.description IS 'Descrição da empresa (Apollo/LinkedIn/Website)';

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Next: Create useUnsavedChanges hook
-- =====================================================
