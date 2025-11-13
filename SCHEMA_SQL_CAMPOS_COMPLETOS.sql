-- ============================================================================
-- SCHEMA SQL COMPLETO - TODOS OS CAMPOS PARA CARD EXPANSÍVEL
-- ============================================================================
-- 
-- COPIE E COLE ESTE SQL NO SUPABASE SQL EDITOR DO OUTRO PROJETO
-- 
-- Este schema suporta TODAS as informações:
--   ✅ Informações Gerais (Nome, Indústria, Origem)
--   ✅ Localização (Cidade, Estado, País)
--   ✅ Descrição
--   ✅ Fit Score
--   ✅ Tipo (Distributor/Manufacturer)
--   ✅ Links Externos (Website, LinkedIn, Apollo)
--   ✅ Decisores (Nome, Título, LinkedIn, Email)
--   ✅ Enriquecimento (Auto vs Manual)
-- ============================================================================

-- ============================================================================
-- TABELA: companies
-- ============================================================================

ALTER TABLE public.companies
  -- ========== INFORMAÇÕES GERAIS ==========
  ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  
  -- ========== LOCALIZAÇÃO ==========
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States',
  
  -- ========== DESCRIÇÃO ==========
  ADD COLUMN IF NOT EXISTS description TEXT,
  
  -- ========== LINKS EXTERNOS ==========
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  
  -- ========== CONTROLE DE ENRIQUECIMENTO ==========
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT DEFAULT NULL, -- NULL | 'auto' | 'manual'
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ DEFAULT NULL,
  
  -- ========== NORMALIZADOR UNIVERSAL (JSONB) ==========
  ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
  
  -- ========== METADADOS ==========
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS workspace_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- COMENTÁRIOS (DOCUMENTAÇÃO DOS CAMPOS)
-- ============================================================================

COMMENT ON COLUMN public.companies.company_name IS 
  'Nome da empresa (ex: "Balanced Body")';

COMMENT ON COLUMN public.companies.industry IS 
  'Indústria/Setor (ex: "health, wellness & fitness")';

COMMENT ON COLUMN public.companies.data_source IS 
  'Origem dos dados: "manual", "csv_upload", "dealer_discovery", "apollo"';

COMMENT ON COLUMN public.companies.city IS 
  'Cidade (ex: "Sacramento")';

COMMENT ON COLUMN public.companies.state IS 
  'Estado/Província (ex: "California")';

COMMENT ON COLUMN public.companies.country IS 
  'País (ex: "United States")';

COMMENT ON COLUMN public.companies.description IS 
  'Descrição completa da empresa (pode vir do Apollo/LinkedIn)';

COMMENT ON COLUMN public.companies.website IS 
  'URL do website (ex: "https://balancedbody.com")';

COMMENT ON COLUMN public.companies.linkedin_url IS 
  'URL do LinkedIn da empresa';

COMMENT ON COLUMN public.companies.apollo_id IS 
  'ID da organização no Apollo.io';

COMMENT ON COLUMN public.companies.enrichment_source IS 
  'Origem do enriquecimento: NULL (não enriquecido) | "auto" (automático) | "manual" (validado)';

COMMENT ON COLUMN public.companies.enriched_at IS 
  'Data/hora do último enriquecimento';

COMMENT ON COLUMN public.companies.raw_data IS 
  'NORMALIZADOR UNIVERSAL - Armazena TODOS os dados extras em formato JSONB:
  {
    "fit_score": 95,
    "type": "Distributor/Manufacturer",
    "notes": "Observações internas",
    "apollo_link": "https://app.apollo.io/#/companies/...",
    "decision_makers": [
      {
        "name": "Ken Endelman",
        "title": "CEO & Founder",
        "email": "ken@example.com",
        "linkedin_url": "https://linkedin.com/in/...",
        "apollo_link": "https://app.apollo.io/#/people/...",
        "classification": "CEO",
        "priority": 1
      }
    ],
    "auto_enrich_method": "DOMAIN" | "NAME_LOCATION",
    "auto_enriched_at": "2025-11-13T12:00:00Z"
  }';

-- ============================================================================
-- ÍNDICES (PERFORMANCE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_company_name 
ON public.companies(company_name);

CREATE INDEX IF NOT EXISTS idx_companies_industry 
ON public.companies(industry);

CREATE INDEX IF NOT EXISTS idx_companies_country 
ON public.companies(country);

CREATE INDEX IF NOT EXISTS idx_companies_data_source 
ON public.companies(data_source);

CREATE INDEX IF NOT EXISTS idx_companies_enrichment_source 
ON public.companies(enrichment_source);

CREATE INDEX IF NOT EXISTS idx_companies_tenant_workspace 
ON public.companies(tenant_id, workspace_id);

-- Índice GIN para busca em raw_data (JSONB)
CREATE INDEX IF NOT EXISTS idx_companies_raw_data 
ON public.companies USING gin(raw_data);

-- ============================================================================
-- TABELA: decision_makers (DECISORES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.decision_makers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- ========== INFORMAÇÕES PESSOAIS ==========
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  
  -- ========== LINKS EXTERNOS ==========
  linkedin_url TEXT,
  apollo_link TEXT,
  
  -- ========== CLASSIFICAÇÃO AUTOMÁTICA ==========
  classification TEXT, -- "CEO", "CFO", "CTO", "VP", "Director", "Manager", "Other"
  seniority_level TEXT, -- "C-Level", "VP", "Director", "Manager", "Individual Contributor"
  priority INTEGER DEFAULT 99, -- 1 = CEO (mais importante), 99 = Other
  
  -- ========== METADADOS ==========
  data_source TEXT DEFAULT 'manual', -- "manual", "apollo_auto", "apollo_manual", "linkedin"
  raw_data JSONB DEFAULT '{}'::jsonb, -- Dados extras do Apollo/LinkedIn
  
  -- ========== TIMESTAMPS ==========
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMENTÁRIOS (TABELA decision_makers)
-- ============================================================================

COMMENT ON TABLE public.decision_makers IS 
  'Decisores/Contatos de cada empresa (C-Levels, VPs, Diretores)';

COMMENT ON COLUMN public.decision_makers.name IS 
  'Nome completo (ex: "Ken Endelman")';

COMMENT ON COLUMN public.decision_makers.title IS 
  'Cargo/Título (ex: "CEO & Founder")';

COMMENT ON COLUMN public.decision_makers.classification IS 
  'Classificação automática baseada no título: CEO, CFO, CTO, COO, VP, Director, Manager, Other';

COMMENT ON COLUMN public.decision_makers.priority IS 
  'Prioridade para exibição (1 = mais importante): CEO=1, CFO=2, CTO=3, COO=4, VP=5, Director=6, Manager=7, Other=99';

COMMENT ON COLUMN public.decision_makers.data_source IS 
  'Origem: "manual" (adicionado pelo usuário), "apollo_auto" (auto-enriquecimento), "apollo_manual" (busca manual), "linkedin"';

-- ============================================================================
-- ÍNDICES (decision_makers)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_decision_makers_company 
ON public.decision_makers(company_id);

CREATE INDEX IF NOT EXISTS idx_decision_makers_tenant 
ON public.decision_makers(tenant_id);

CREATE INDEX IF NOT EXISTS idx_decision_makers_classification 
ON public.decision_makers(classification);

CREATE INDEX IF NOT EXISTS idx_decision_makers_priority 
ON public.decision_makers(priority);

-- Índice único para evitar duplicatas (mesma empresa + email + nome)
CREATE UNIQUE INDEX IF NOT EXISTS idx_decision_makers_unique 
ON public.decision_makers(company_id, email, name)
WHERE email IS NOT NULL;

-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) - OPCIONAL
-- ============================================================================

-- Habilitar RLS (se ainda não estiver habilitado)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só vê empresas do seu tenant
CREATE POLICY IF NOT EXISTS "Users can view companies from their tenant"
ON public.companies FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Política: Usuário pode inserir empresas no seu tenant
CREATE POLICY IF NOT EXISTS "Users can insert companies in their tenant"
ON public.companies FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Política: Usuário pode atualizar empresas do seu tenant
CREATE POLICY IF NOT EXISTS "Users can update companies from their tenant"
ON public.companies FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Política: Usuário pode deletar empresas do seu tenant
CREATE POLICY IF NOT EXISTS "Users can delete companies from their tenant"
ON public.companies FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Mesmas políticas para decision_makers
CREATE POLICY IF NOT EXISTS "Users can view decision makers from their tenant"
ON public.decision_makers FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can insert decision makers in their tenant"
ON public.decision_makers FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can update decision makers from their tenant"
ON public.decision_makers FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete decision makers from their tenant"
ON public.decision_makers FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- ============================================================================
-- EXEMPLO DE INSERÇÃO (BALANCED BODY)
-- ============================================================================

-- Exemplo de como inserir uma empresa com todos os campos
INSERT INTO public.companies (
  company_name,
  industry,
  data_source,
  city,
  state,
  country,
  description,
  website,
  linkedin_url,
  apollo_id,
  enrichment_source,
  enriched_at,
  raw_data,
  tenant_id,
  workspace_id
) VALUES (
  'Balanced Body',
  'health, wellness & fitness',
  'dealer_discovery',
  'Sacramento',
  'California',
  'United States',
  'Balanced Body, founded in 1976 by Ken Endelman, is the largest provider of Pilates equipment and education globally...',
  'https://www.pilates.com',
  'https://www.linkedin.com/company/balanced-body',
  '5f7e8d9c0000000000000001',
  'manual',
  NOW(),
  '{
    "fit_score": 95,
    "type": "Distributor/Manufacturer",
    "apollo_link": "https://app.apollo.io/#/companies/5f7e8d9c0000000000000001",
    "decision_makers": [
      {
        "name": "Ken Endelman",
        "title": "CEO & Founder",
        "email": "ken@pilates.com",
        "linkedin_url": "https://www.linkedin.com/in/kenendelman",
        "apollo_link": "https://app.apollo.io/#/people/...",
        "classification": "CEO",
        "priority": 1
      },
      {
        "name": "Sarah Mitchell",
        "title": "VP of Sales",
        "email": "sarah.mitchell@pilates.com",
        "linkedin_url": "https://www.linkedin.com/in/sarahmitchell",
        "classification": "VP",
        "priority": 5
      },
      {
        "name": "David Chen",
        "title": "Director of Marketing",
        "email": "david.chen@pilates.com",
        "linkedin_url": "https://www.linkedin.com/in/davidchen",
        "classification": "Director",
        "priority": 6
      }
    ],
    "auto_enrich_method": "DOMAIN",
    "auto_enriched_at": "2025-11-13T12:00:00Z"
  }'::jsonb,
  'your-tenant-id-here'::uuid,
  'your-workspace-id-here'::uuid
)
ON CONFLICT DO NOTHING;

-- Exemplo de como inserir decisores separadamente
INSERT INTO public.decision_makers (
  company_id,
  tenant_id,
  name,
  title,
  email,
  linkedin_url,
  apollo_link,
  classification,
  priority,
  data_source
) VALUES
  (
    'company-id-here'::uuid,
    'tenant-id-here'::uuid,
    'Ken Endelman',
    'CEO & Founder',
    'ken@pilates.com',
    'https://www.linkedin.com/in/kenendelman',
    'https://app.apollo.io/#/people/...',
    'CEO',
    1,
    'apollo_manual'
  ),
  (
    'company-id-here'::uuid,
    'tenant-id-here'::uuid,
    'Sarah Mitchell',
    'VP of Sales',
    'sarah.mitchell@pilates.com',
    'https://www.linkedin.com/in/sarahmitchell',
    NULL,
    'VP',
    5,
    'apollo_manual'
  ),
  (
    'company-id-here'::uuid,
    'tenant-id-here'::uuid,
    'David Chen',
    'Director of Marketing',
    'david.chen@pilates.com',
    'https://www.linkedin.com/in/davidchen',
    NULL,
    'Director',
    6,
    'apollo_manual'
  )
ON CONFLICT (company_id, email, name) DO NOTHING;

-- ============================================================================
-- QUERIES ÚTEIS
-- ============================================================================

-- Ver todas as empresas com seus decisores
SELECT 
  c.company_name,
  c.industry,
  c.city,
  c.state,
  c.country,
  c.raw_data->>'fit_score' as fit_score,
  c.raw_data->>'type' as type,
  c.enrichment_source,
  COUNT(dm.id) as total_decisores
FROM companies c
LEFT JOIN decision_makers dm ON dm.company_id = c.id
GROUP BY c.id, c.company_name, c.industry, c.city, c.state, c.country
ORDER BY c.company_name;

-- Ver decisores de uma empresa específica (ordenados por prioridade)
SELECT 
  name,
  title,
  email,
  linkedin_url,
  classification,
  priority,
  data_source
FROM decision_makers
WHERE company_id = 'company-id-here'::uuid
ORDER BY priority ASC, name ASC;

-- Empresas que precisam de enriquecimento
SELECT 
  company_name,
  city,
  country,
  website,
  enrichment_source
FROM companies
WHERE 
  (apollo_id IS NULL OR enrichment_source IS NULL OR enrichment_source = 'auto')
  AND company_name IS NOT NULL
ORDER BY company_name;

-- Empresas enriquecidas manualmente (protegidas)
SELECT 
  company_name,
  enrichment_source,
  enriched_at,
  apollo_id
FROM companies
WHERE enrichment_source = 'manual'
ORDER BY enriched_at DESC;

-- Estatísticas de enriquecimento
SELECT 
  enrichment_source,
  COUNT(*) as total
FROM companies
GROUP BY enrichment_source
ORDER BY total DESC;

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- ✅ CAMPOS IMPLEMENTADOS:
--
-- TABELA companies:
--   ✅ company_name (Nome da empresa)
--   ✅ industry (Indústria/Setor)
--   ✅ data_source (Origem dos dados)
--   ✅ city (Cidade)
--   ✅ state (Estado)
--   ✅ country (País)
--   ✅ description (Descrição completa)
--   ✅ website (Website)
--   ✅ linkedin_url (LinkedIn)
--   ✅ apollo_id (Apollo ID)
--   ✅ enrichment_source (Controle auto/manual)
--   ✅ enriched_at (Data do enriquecimento)
--   ✅ raw_data (JSONB com fit_score, type, decision_makers, etc.)
--
-- TABELA decision_makers:
--   ✅ name (Nome)
--   ✅ title (Cargo)
--   ✅ email (Email)
--   ✅ linkedin_url (LinkedIn)
--   ✅ apollo_link (Apollo Link)
--   ✅ classification (CEO, VP, Director, etc.)
--   ✅ priority (1-99, ordenação)
--   ✅ data_source (Origem)
--
-- ============================================================================
-- PRONTO PARA COPIAR E COLAR NO OUTRO PROJETO!
-- ============================================================================

