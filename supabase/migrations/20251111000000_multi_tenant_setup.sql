-- ============================================================================
-- OLV TRADE INTELLIGENCE - MULTI-TENANT SETUP (FASE 1)
-- ============================================================================
-- Migration criada em: 2025-11-11
-- Descrição: Implementação completa de multi-tenancy com RLS
-- ============================================================================

-- 1️⃣ CRIAR TABELA TENANTS (Clientes da plataforma SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cnpj TEXT UNIQUE,
  website TEXT,
  industry TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0052CC',
  secondary_color TEXT DEFAULT '#00B8D9',
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'pro' CHECK (subscription_tier IN ('starter', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  monthly_price_brl DECIMAL DEFAULT 2997.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON public.tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(is_active);

-- 2️⃣ CRIAR TABELA WORKSPACES (Operações dentro de cada tenant)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('domestic', 'export', 'import')),
  description TEXT,
  target_countries TEXT[], -- ['US', 'DE', 'JP']
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_tenant_workspace_type UNIQUE(tenant_id, type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON public.workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON public.workspaces(type);
CREATE INDEX IF NOT EXISTS idx_workspaces_active ON public.workspaces(is_active);

-- 3️⃣ CRIAR TABELA TENANT_PRODUCTS (Catálogo de produtos)
CREATE TABLE IF NOT EXISTS public.tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT,
  hs_code TEXT, -- Código NCM/SH internacional (ex: 9506.91.00)
  price_brl DECIMAL,
  price_usd DECIMAL,
  price_eur DECIMAL,
  moq INTEGER, -- Minimum Order Quantity
  lead_time_days INTEGER,
  weight_kg DECIMAL,
  dimensions_cm TEXT, -- "100x50x30"
  certifications TEXT[], -- ['ISO 9001', 'CE', 'FDA']
  target_segments TEXT[], -- ['Pilates Studios', 'Gyms']
  image_url TEXT,
  product_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON public.tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_hs_code ON public.tenant_products(hs_code);
CREATE INDEX IF NOT EXISTS idx_tenant_products_active ON public.tenant_products(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_products_category ON public.tenant_products(category);

-- 4️⃣ ADICIONAR tenant_id E workspace_id NAS TABELAS EXISTENTES

-- Companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON public.companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_workspace ON public.companies(workspace_id);

-- ICP Analysis Results
ALTER TABLE public.icp_analysis_results ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.icp_analysis_results ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
CREATE INDEX IF NOT EXISTS idx_icp_tenant ON public.icp_analysis_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_workspace ON public.icp_analysis_results(workspace_id);

-- Leads Pool
ALTER TABLE public.leads_pool ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.leads_pool ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads_pool(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON public.leads_pool(workspace_id);

-- Decision Makers
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
CREATE INDEX IF NOT EXISTS idx_decisors_tenant ON public.decision_makers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisors_workspace ON public.decision_makers(workspace_id);

-- SDR Deals
ALTER TABLE public.sdr_deals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.sdr_deals ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_tenant ON public.sdr_deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_workspace ON public.sdr_deals(workspace_id);

-- Contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON public.contacts(workspace_id);

-- Users (adicionar tenant_id e default_workspace_id)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_workspace_id UUID REFERENCES public.workspaces(id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace ON public.users(default_workspace_id);

-- 5️⃣ HABILITAR ROW LEVEL SECURITY (RLS)

-- Tenants (usuário vê apenas seu tenant)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tenants ON public.tenants;
CREATE POLICY tenant_isolation_tenants ON public.tenants
FOR ALL USING (
  id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Workspaces (usuário vê workspaces do seu tenant)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_workspaces ON public.workspaces;
CREATE POLICY tenant_isolation_workspaces ON public.workspaces
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Tenant Products (usuário vê produtos do seu tenant)
ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_products ON public.tenant_products;
CREATE POLICY tenant_isolation_products ON public.tenant_products
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Companies (usuário vê empresas do seu tenant)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_companies ON public.companies;
CREATE POLICY tenant_isolation_companies ON public.companies
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- ICP Analysis (usuário vê análises do seu tenant)
ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_icp ON public.icp_analysis_results;
CREATE POLICY tenant_isolation_icp ON public.icp_analysis_results
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Leads Pool (usuário vê leads do seu tenant)
ALTER TABLE public.leads_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_leads ON public.leads_pool;
CREATE POLICY tenant_isolation_leads ON public.leads_pool
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Decision Makers (usuário vê decisores do seu tenant)
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_decisors ON public.decision_makers;
CREATE POLICY tenant_isolation_decisors ON public.decision_makers
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- SDR Deals (usuário vê deals do seu tenant)
ALTER TABLE public.sdr_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_sdr_deals ON public.sdr_deals;
CREATE POLICY tenant_isolation_sdr_deals ON public.sdr_deals
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Contacts (usuário vê contatos do seu tenant)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_contacts ON public.contacts;
CREATE POLICY tenant_isolation_contacts ON public.contacts
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- 6️⃣ CRIAR TABELA TRADE_DATA (Histórico de importação/exportação)
CREATE TABLE IF NOT EXISTS public.trade_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  hs_code TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('import', 'export')),
  country TEXT NOT NULL,
  year INTEGER NOT NULL,
  volume_usd DECIMAL,
  shipments_count INTEGER,
  frequency TEXT CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  suppliers_countries TEXT[], -- Para imports
  buyers_countries TEXT[], -- Para exports
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_data_company ON public.trade_data(company_id);
CREATE INDEX IF NOT EXISTS idx_trade_data_tenant ON public.trade_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trade_data_hs_code ON public.trade_data(hs_code);
CREATE INDEX IF NOT EXISTS idx_trade_data_country ON public.trade_data(country);

-- RLS para trade_data
ALTER TABLE public.trade_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_trade_data ON public.trade_data;
CREATE POLICY tenant_isolation_trade_data ON public.trade_data
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- 7️⃣ CRIAR TABELA HS_CODES (Nomenclatura internacional)
CREATE TABLE IF NOT EXISTS public.hs_codes (
  code TEXT PRIMARY KEY, -- '9506.91.00'
  description_pt TEXT,
  description_en TEXT,
  category TEXT,
  tariff_usa DECIMAL, -- Tarifa USA (%)
  tariff_eu DECIMAL,  -- Tarifa EU (%)
  tariff_cn DECIMAL,  -- Tarifa China (%)
  certifications_required TEXT[], -- ['FDA', 'CE', 'ISO']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir HS Codes relevantes para MetaLife Pilates
INSERT INTO public.hs_codes (code, description_pt, description_en, category, tariff_usa, tariff_eu, certifications_required)
VALUES 
(
  '9506.91.00',
  'Artigos e equipamentos para cultura física, ginástica ou atletismo',
  'Articles and equipment for general physical exercise, gymnastics or athletics',
  'Fitness Equipment',
  0.0, -- USA: 0% para fitness equipment
  0.0, -- EU: 0%
  ARRAY['ISO 9001'] -- Certificações recomendadas
),
(
  '9506.99.00',
  'Outros artigos e equipamentos para esporte',
  'Other articles and equipment for sports',
  'Sports Accessories',
  0.0,
  0.0,
  ARRAY[]
),
(
  '9403.60.00',
  'Outros móveis de madeira',
  'Other wooden furniture',
  'Furniture',
  0.0,
  0.0,
  ARRAY['FSC'] -- Forest Stewardship Council
)
ON CONFLICT (code) DO NOTHING;

-- 8️⃣ CRIAR FUNÇÃO HELPER: get_tenant_context()
-- Esta função retorna o contexto do tenant/workspace do usuário atual
CREATE OR REPLACE FUNCTION public.get_tenant_context()
RETURNS TABLE (
  tenant_id UUID,
  workspace_id UUID,
  workspace_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.tenant_id,
    u.default_workspace_id AS workspace_id,
    w.type AS workspace_type
  FROM public.users u
  LEFT JOIN public.workspaces w ON w.id = u.default_workspace_id
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9️⃣ INSERIR TENANT METALIFE (Primeiro cliente)
INSERT INTO public.tenants (id, name, slug, cnpj, website, industry, primary_color, subscription_tier)
VALUES (
  'c8f5e8d0-1234-5678-90ab-cdef12345678', -- UUID fixo para facilitar referências
  'MetaLife Pilates',
  'metalife',
  '06334616000185',
  'https://metalifepilates.com.br/',
  'Fitness Equipment Manufacturing',
  '#10B981', -- Verde MetaLife
  'pro'
) ON CONFLICT (slug) DO NOTHING;

-- 🔟 CRIAR 3 WORKSPACES PARA METALIFE
INSERT INTO public.workspaces (tenant_id, name, type, target_countries, description)
VALUES 
(
  'c8f5e8d0-1234-5678-90ab-cdef12345678',
  'Prospecção Brasil',
  'domestic',
  ARRAY['BR'],
  'Vender equipamentos MetaLife no mercado brasileiro (B2B e B2C)'
),
(
  'c8f5e8d0-1234-5678-90ab-cdef12345678',
  'Export Intelligence',
  'export',
  ARRAY['US', 'DE', 'JP', 'AU', 'ES', 'IT', 'CA', 'UK'],
  'Encontrar importadores, dealers e distribuidores internacionais de equipamentos de pilates (B2B APENAS)'
),
(
  'c8f5e8d0-1234-5678-90ab-cdef12345678',
  'Import Sourcing',
  'import',
  ARRAY['CN', 'TW', 'KR', 'IN', 'TH'],
  'Encontrar fornecedores internacionais de componentes, matéria-prima e acessórios'
)
ON CONFLICT (tenant_id, type) DO NOTHING;

-- ============================================================================
-- ✅ VERIFICAÇÃO DO SETUP
-- ============================================================================
DO $$
DECLARE
  tenant_count INT;
  workspace_count INT;
  hs_code_count INT;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM public.tenants;
  SELECT COUNT(*) INTO workspace_count FROM public.workspaces;
  SELECT COUNT(*) INTO hs_code_count FROM public.hs_codes;
  
  RAISE NOTICE '======================================';
  RAISE NOTICE 'MULTI-TENANT SETUP COMPLETO!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Tenants criados: %', tenant_count;
  RAISE NOTICE 'Workspaces criados: %', workspace_count;
  RAISE NOTICE 'HS Codes cadastrados: %', hs_code_count;
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Próximo passo: Executar FASE 1.5-1.9';
  RAISE NOTICE '(TenantContext, WorkspaceSwitcher, etc)';
  RAISE NOTICE '======================================';
END $$;

