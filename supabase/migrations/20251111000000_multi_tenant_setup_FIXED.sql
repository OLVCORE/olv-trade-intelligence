-- ============================================================================
-- OLV TRADE INTELLIGENCE - MULTI-TENANT SETUP (VERSÃO SIMPLIFICADA)
-- ============================================================================
-- Migration criada em: 2025-11-11
-- Versão: FIXED (para Supabase NOVO sem tabelas legacy)
-- ============================================================================

-- 1️⃣ CRIAR TABELA TENANTS (Clientes da plataforma SaaS)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON public.tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(is_active);

-- 2️⃣ CRIAR TABELA WORKSPACES (Operações dentro de cada tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('domestic', 'export', 'import')),
  description TEXT,
  target_countries TEXT[],
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_tenant_workspace_type UNIQUE(tenant_id, type)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON public.workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON public.workspaces(type);
CREATE INDEX IF NOT EXISTS idx_workspaces_active ON public.workspaces(is_active);

-- 3️⃣ CRIAR TABELA TENANT_PRODUCTS (Catálogo de produtos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT,
  hs_code TEXT,
  price_brl DECIMAL,
  price_usd DECIMAL,
  price_eur DECIMAL,
  moq INTEGER,
  lead_time_days INTEGER,
  weight_kg DECIMAL,
  volume_m3 DECIMAL,
  dimensions_cm TEXT,
  certifications TEXT[],
  target_segments TEXT[],
  image_url TEXT,
  product_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON public.tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_hs_code ON public.tenant_products(hs_code);
CREATE INDEX IF NOT EXISTS idx_tenant_products_active ON public.tenant_products(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_products_category ON public.tenant_products(category);

-- 4️⃣ CRIAR TABELA USERS (mapeia auth.users para multi-tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  default_workspace_id UUID REFERENCES public.workspaces(id),
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace ON public.users(default_workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 5️⃣ CRIAR TABELA COMPANIES (base de empresas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  company_name TEXT NOT NULL,
  cnpj TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  industry TEXT,
  employee_count INTEGER,
  revenue_usd DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_tenant ON public.companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_workspace ON public.companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);

-- 6️⃣ ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON public.tenants;
CREATE POLICY "tenant_isolation_tenants" ON public.tenants
FOR ALL USING (
  id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_workspaces" ON public.workspaces;
CREATE POLICY "tenant_isolation_workspaces" ON public.workspaces
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Tenant Products
ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_products" ON public.tenant_products;
CREATE POLICY "tenant_isolation_products" ON public.tenant_products
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own" ON public.users;
CREATE POLICY "users_view_own" ON public.users
FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (id = auth.uid());

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_companies" ON public.companies;
CREATE POLICY "tenant_isolation_companies" ON public.companies
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- 7️⃣ TRIGGER: Auto-insert em public.users quando usuário faz signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8️⃣ MIGRAR USUÁRIOS EXISTENTES (se houver)
-- ============================================================================

INSERT INTO public.users (id, email, full_name)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 9️⃣ INSERIR DADOS INICIAIS: METALIFE PILATES
-- ============================================================================

-- Tenant MetaLife
INSERT INTO public.tenants (name, slug, cnpj, website, industry, primary_color, secondary_color)
VALUES (
  'MetaLife Pilates',
  'metalife',
  '06.334.616/0001-85',
  'https://metalifepilates.com.br/',
  'Fitness Equipment Manufacturing',
  '#10B981',
  '#059669'
)
ON CONFLICT (slug) DO NOTHING;

-- Workspaces do MetaLife
INSERT INTO public.workspaces (tenant_id, name, type, target_countries, description)
VALUES 
  (
    (SELECT id FROM public.tenants WHERE slug = 'metalife'),
    'Prospecção Brasil',
    'domestic',
    ARRAY['BR'],
    'Prospecção de clientes no mercado doméstico brasileiro'
  ),
  (
    (SELECT id FROM public.tenants WHERE slug = 'metalife'),
    'Export - Global',
    'export',
    ARRAY['US', 'DE', 'JP', 'AU', 'ES', 'IT', 'CA', 'GB'],
    'Descoberta de dealers e distribuidores internacionais'
  ),
  (
    (SELECT id FROM public.tenants WHERE slug = 'metalife'),
    'Import - Sourcing',
    'import',
    ARRAY['CN', 'TW', 'KR'],
    'Sourcing de componentes e matérias-primas'
  )
ON CONFLICT (tenant_id, type) DO NOTHING;

-- 🔟 VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  tenant_count INTEGER;
  workspace_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM public.tenants;
  SELECT COUNT(*) INTO workspace_count FROM public.workspaces;
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  RAISE NOTICE '======================================';
  RAISE NOTICE 'MULTI-TENANT SETUP COMPLETO!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Tenants criados: %', tenant_count;
  RAISE NOTICE 'Workspaces criados: %', workspace_count;
  RAISE NOTICE 'Usuários migrados: %', user_count;
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  1. tenants';
  RAISE NOTICE '  2. workspaces';
  RAISE NOTICE '  3. tenant_products';
  RAISE NOTICE '  4. users';
  RAISE NOTICE '  5. companies';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'RLS Policies: 5 tabelas protegidas';
  RAISE NOTICE 'Trigger: Auto-create user on signup';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'PROXIMO PASSO:';
  RAISE NOTICE 'Associe seu usuario ao tenant MetaLife!';
  RAISE NOTICE '======================================';
END $$;

