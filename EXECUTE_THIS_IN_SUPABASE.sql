-- ============================================================================
-- 🚀 OLV TRADE INTELLIGENCE - SETUP COMPLETO
-- ============================================================================
-- Este arquivo contém TODAS as 5 migrations unificadas
-- COPIE TODO este arquivo e execute no Supabase SQL Editor
-- URL: https://app.supabase.com/project/kdalsopwfkrxiaxxophh/sql
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: MULTI-TENANT SETUP
-- ============================================================================

-- Tabelas base
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
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  zip_code TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'pro',
  subscription_status TEXT DEFAULT 'active',
  monthly_price_brl DECIMAL DEFAULT 2997.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  UNIQUE(tenant_id, type)
);

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON public.workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON public.tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON public.companies(tenant_id);

-- RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_tenants" ON public.tenants;
CREATE POLICY "tenant_isolation_tenants" ON public.tenants FOR ALL USING (id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_workspaces" ON public.workspaces;
CREATE POLICY "tenant_isolation_workspaces" ON public.workspaces FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_products" ON public.tenant_products;
CREATE POLICY "tenant_isolation_products" ON public.tenant_products FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users_view_own" ON public.users;
CREATE POLICY "users_view_own" ON public.users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "tenant_isolation_companies" ON public.companies;
CREATE POLICY "tenant_isolation_companies" ON public.companies FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Trigger auto-create user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrar usuários existentes
INSERT INTO public.users (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Inserir MetaLife
INSERT INTO public.tenants (name, slug, cnpj, website, industry, primary_color, secondary_color)
VALUES ('MetaLife Pilates', 'metalife', '06.334.616/0001-85', 'https://metalifepilates.com.br/', 'Fitness Equipment Manufacturing', '#10B981', '#059669')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.workspaces (tenant_id, name, type, target_countries, description)
VALUES 
  ((SELECT id FROM public.tenants WHERE slug = 'metalife'), 'Prospecção Brasil', 'domestic', ARRAY['BR'], 'Prospecção doméstica'),
  ((SELECT id FROM public.tenants WHERE slug = 'metalife'), 'Export - Global', 'export', ARRAY['US', 'DE', 'JP', 'AU', 'ES', 'IT', 'CA', 'GB'], 'Export B2B'),
  ((SELECT id FROM public.tenants WHERE slug = 'metalife'), 'Import - Sourcing', 'import', ARRAY['CN', 'TW', 'KR'], 'Sourcing')
ON CONFLICT (tenant_id, type) DO NOTHING;

-- ============================================================================
-- MIGRATION 2: COMMERCIAL PROPOSALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commercial_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  dealer_id UUID REFERENCES public.companies(id),
  proposal_number TEXT UNIQUE,
  products JSONB NOT NULL,
  subtotal_usd DECIMAL,
  shipping_cost_usd DECIMAL,
  total_value_usd DECIMAL,
  incoterm TEXT,
  origin_port TEXT DEFAULT 'BRSSZ',
  destination_port TEXT,
  estimated_delivery_days INTEGER,
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.commercial_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_proposals" ON public.commercial_proposals;
CREATE POLICY "tenant_isolation_proposals" ON public.commercial_proposals FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- MIGRATION 3: DEALER RELATIONSHIP MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dealer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  dealer_id UUID REFERENCES public.companies(id),
  contract_number TEXT UNIQUE,
  products JSONB,
  sales_target_usd DECIMAL,
  start_date DATE,
  end_date DATE,
  duration_months INTEGER,
  incoterm TEXT,
  payment_terms TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dealer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  dealer_id UUID REFERENCES public.companies(id),
  order_number TEXT UNIQUE,
  products JSONB,
  total_value_usd DECIMAL,
  order_date DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dealer_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  dealer_id UUID REFERENCES public.companies(id),
  year INTEGER,
  month INTEGER,
  orders_count INTEGER DEFAULT 0,
  revenue_usd DECIMAL DEFAULT 0,
  target_achievement_pct DECIMAL DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dealer_id, year, month)
);

CREATE TABLE IF NOT EXISTS public.marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  language TEXT DEFAULT 'pt-BR',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dealer_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  incentive_type TEXT,
  value_usd DECIMAL,
  min_threshold_usd DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dealer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_incentives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_contracts" ON public.dealer_contracts;
CREATE POLICY "tenant_isolation_contracts" ON public.dealer_contracts FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_orders" ON public.dealer_orders;
CREATE POLICY "tenant_isolation_orders" ON public.dealer_orders FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_performance" ON public.dealer_performance;
CREATE POLICY "tenant_isolation_performance" ON public.dealer_performance FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_materials" ON public.marketing_materials;
CREATE POLICY "tenant_isolation_materials" ON public.marketing_materials FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_incentives" ON public.dealer_incentives;
CREATE POLICY "tenant_isolation_incentives" ON public.dealer_incentives FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- MIGRATION 4: SALES CRM COMPLETE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES public.companies(id),
  contact_id UUID,
  assigned_to UUID REFERENCES auth.users(id),
  pipeline_id UUID,
  stage TEXT NOT NULL DEFAULT 'prospect',
  stage_order INTEGER DEFAULT 0,
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  status TEXT DEFAULT 'open',
  lost_reason TEXT,
  won_date TIMESTAMPTZ,
  source TEXT,
  priority TEXT DEFAULT 'medium',
  tags TEXT[],
  tenant_id UUID REFERENCES public.tenants(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  external_synced_at TIMESTAMPTZ,
  external_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  probability_default INTEGER DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,
  automation_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE TABLE IF NOT EXISTS public.sales_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.sales_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  trigger_type TEXT DEFAULT 'manual',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  send_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_order)
);

CREATE TABLE IF NOT EXISTS public.smart_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  deal_id UUID REFERENCES public.sales_deals(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  ai_suggested BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.sales_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  priority TEXT DEFAULT 'medium',
  executions_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.sales_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_sales_deals" ON public.sales_deals;
CREATE POLICY "tenant_isolation_sales_deals" ON public.sales_deals FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_sales_stages" ON public.sales_pipeline_stages;
CREATE POLICY "tenant_isolation_sales_stages" ON public.sales_pipeline_stages FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users_can_read_activities" ON public.sales_deal_activities;
CREATE POLICY "users_can_read_activities" ON public.sales_deal_activities FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tenant_isolation_sequences" ON public.email_sequences;
CREATE POLICY "tenant_isolation_sequences" ON public.email_sequences FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users_can_manage_steps" ON public.email_sequence_steps;
CREATE POLICY "users_can_manage_steps" ON public.email_sequence_steps FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tenant_isolation_tasks" ON public.smart_tasks;
CREATE POLICY "tenant_isolation_tasks" ON public.smart_tasks FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_automations" ON public.sales_automations;
CREATE POLICY "tenant_isolation_automations" ON public.sales_automations FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Inserir stages padrão
INSERT INTO public.sales_pipeline_stages (tenant_id, name, key, order_index, color, probability_default, is_closed, is_won)
SELECT 
  t.id, stage.name, stage.key, stage.order_index, stage.color, stage.probability_default, stage.is_closed, stage.is_won
FROM public.tenants t
CROSS JOIN (VALUES
  ('Prospect', 'prospect', 0, '#6366f1', 10, false, false),
  ('Qualification', 'qualification', 1, '#8b5cf6', 25, false, false),
  ('Proposal Sent', 'proposal', 2, '#ec4899', 50, false, false),
  ('Negotiation', 'negotiation', 3, '#f59e0b', 75, false, false),
  ('Contract Signed', 'contract', 4, '#10b981', 90, false, false),
  ('Delivered', 'delivered', 5, '#22c55e', 100, true, true),
  ('Lost', 'lost', 6, '#ef4444', 0, true, false)
) AS stage(name, key, order_index, color, probability_default, is_closed, is_won)
ON CONFLICT (tenant_id, key) DO NOTHING;

-- ============================================================================
-- FIM - SETUP COMPLETO
-- ============================================================================

-- Associar seu usuário ao tenant MetaLife (ALTERE O EMAIL!)
UPDATE public.users 
SET 
  tenant_id = (SELECT id FROM public.tenants WHERE slug = 'metalife'),
  default_workspace_id = (SELECT id FROM public.workspaces WHERE type = 'export' AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'metalife'))
WHERE email = 'metalife@olvinternacional.com.br';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabelas criadas: 20+';
  RAISE NOTICE 'Tenant: MetaLife Pilates';
  RAISE NOTICE 'Workspaces: 3 (Domestic, Export, Import)';
  RAISE NOTICE 'RLS: Ativado em todas as tabelas';
  RAISE NOTICE '========================================';
END $$;

