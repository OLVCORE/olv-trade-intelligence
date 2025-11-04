-- ============================================
-- SQL 100% SEGURO - CRIA APENAS O QUE FALTA
-- ============================================
-- Execute ESTE SQL no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new

-- ============================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO TABELAS EXISTENTES ===';
END $$;

SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'companies',
    'icp_analysis_results',
    'sdr_notifications',
    'icp_mapping_templates',
    'leads_sources',
    'leads_quarantine'
)
ORDER BY table_name;

-- ============================================
-- 2. CRIAR TABELAS FALTANTES (COM IF NOT EXISTS)
-- ============================================

-- TABELA: icp_analysis_results
CREATE TABLE IF NOT EXISTS public.icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  cnae_principal TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  domain TEXT,
  
  -- Origem
  origem TEXT CHECK (origem IN ('upload_massa', 'icp_individual', 'icp_massa')),
  
  -- Resultado da análise
  icp_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  temperatura TEXT,
  
  -- Análise TOTVS
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_confidence INTEGER DEFAULT 0,
  totvs_products TEXT[],
  
  -- Relacionamentos (OPCIONAL - não dá erro se companies não existir)
  company_id UUID,
  user_id UUID,
  batch_id UUID,
  
  -- Dados completos
  raw_data JSONB,
  analysis_data JSONB,
  full_report JSONB,
  motivo_descarte TEXT,
  
  -- Controle
  moved_to_pool BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_results_cnpj ON public.icp_analysis_results(cnpj);
CREATE INDEX IF NOT EXISTS idx_icp_results_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_results_score ON public.icp_analysis_results(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_icp_results_batch_id ON public.icp_analysis_results(batch_id);

-- RLS
ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users" ON public.icp_analysis_results;
CREATE POLICY "Allow all authenticated users"
  ON public.icp_analysis_results
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TABELA: sdr_notifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sdr_notifications_user_id ON public.sdr_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_is_read ON public.sdr_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_created_at ON public.sdr_notifications(created_at DESC);

ALTER TABLE public.sdr_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users" ON public.sdr_notifications;
CREATE POLICY "Allow all authenticated users"
  ON public.sdr_notifications
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TABELA: icp_mapping_templates
-- ============================================
CREATE TABLE IF NOT EXISTS public.icp_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  nome_template TEXT NOT NULL,
  descricao TEXT,
  mappings JSONB NOT NULL,
  custom_fields TEXT[] DEFAULT '{}',
  total_colunas INTEGER DEFAULT 0,
  ultima_utilizacao TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icp_mapping_templates_user_id ON public.icp_mapping_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_icp_mapping_templates_ultima_utilizacao ON public.icp_mapping_templates(ultima_utilizacao DESC);

ALTER TABLE public.icp_mapping_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users" ON public.icp_mapping_templates;
CREATE POLICY "Allow all authenticated users"
  ON public.icp_mapping_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TABELA: leads_sources
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  source_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  api_credentials JSONB,
  config JSONB,
  
  total_captured INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_leads_sources_active ON public.leads_sources(is_active);

ALTER TABLE public.leads_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users" ON public.leads_sources;
CREATE POLICY "Allow all authenticated users"
  ON public.leads_sources
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Inserir fontes padrão
INSERT INTO public.leads_sources (source_name, is_active, priority) 
VALUES 
  ('upload_manual', true, 10),
  ('apollo_io', true, 9),
  ('linkedin_sales_navigator', true, 8),
  ('google_search', true, 7),
  ('empresas_aqui', true, 6)
ON CONFLICT (source_name) DO NOTHING;

-- ============================================
-- TABELA: leads_quarantine
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  cnpj TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  
  source_id UUID REFERENCES public.leads_sources(id),
  source_metadata JSONB,
  
  sector TEXT,
  niche TEXT,
  state TEXT,
  city TEXT,
  region TEXT,
  
  employees INTEGER,
  revenue DECIMAL(15,2),
  company_size TEXT,
  
  validation_status TEXT DEFAULT 'pending',
  
  cnpj_valid BOOLEAN DEFAULT false,
  cnpj_status TEXT,
  website_active BOOLEAN DEFAULT false,
  website_ssl BOOLEAN DEFAULT false,
  has_linkedin BOOLEAN DEFAULT false,
  has_email BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  
  auto_score INTEGER DEFAULT 0,
  validation_score INTEGER DEFAULT 0,
  data_quality_score INTEGER DEFAULT 0,
  
  enrichment_status TEXT DEFAULT 'pending',
  enriched_data JSONB,
  
  technologies_detected JSONB,
  has_totvs BOOLEAN,
  totvs_products JSONB,
  competitor_erp TEXT,
  
  buying_signals JSONB,
  intent_score INTEGER DEFAULT 0,
  
  captured_at TIMESTAMPTZ DEFAULT now(),
  validated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  validated_by UUID,
  approved_by UUID,
  rejection_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quarantine_status ON public.leads_quarantine(validation_status);
CREATE INDEX IF NOT EXISTS idx_quarantine_source ON public.leads_quarantine(source_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_captured ON public.leads_quarantine(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_cnpj ON public.leads_quarantine(cnpj);

ALTER TABLE public.leads_quarantine ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users" ON public.leads_quarantine;
CREATE POLICY "Allow all authenticated users"
  ON public.leads_quarantine
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- VIEW: source_performance
-- ============================================
CREATE OR REPLACE VIEW public.source_performance AS
SELECT 
  ls.id,
  ls.source_name,
  ls.is_active,
  ls.priority,
  COUNT(lq.id) as total_captured,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'approved') as total_approved,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'rejected') as total_rejected,
  AVG(lq.auto_score) as avg_auto_score,
  ls.created_at,
  ls.updated_at
FROM public.leads_sources ls
LEFT JOIN public.leads_quarantine lq ON lq.source_id = ls.id
GROUP BY ls.id, ls.source_name, ls.is_active, ls.priority, ls.created_at, ls.updated_at;

-- ============================================
-- FUNCTIONS (se não existirem)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
    '✅ SUCESSO! Tabelas criadas:' as status,
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as tamanho
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'icp_analysis_results',
    'sdr_notifications',
    'icp_mapping_templates',
    'leads_sources',
    'leads_quarantine'
)
ORDER BY table_name;

-- Verificar VIEW
SELECT 
    '✅ VIEW criada:' as status,
    table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'source_performance';

-- ============================================
-- FIM - TUDO PRONTO!
-- ============================================
SELECT '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as mensagem;

