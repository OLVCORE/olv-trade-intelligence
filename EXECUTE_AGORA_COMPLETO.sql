-- ⚡⚡⚡ SQL COMPLETO - TODAS AS TABELAS FALTANTES ⚡⚡⚡
-- EXECUTE NO SUPABASE SQL EDITOR AGORA!
-- URL: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new

-- ============================================
-- TABELA 1: leads_sources
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  source_name TEXT NOT NULL UNIQUE CHECK (source_name IN (
    'upload_manual',
    'empresas_aqui',
    'linkedin_sales_navigator',
    'apollo_io',
    'google_search',
    'indicacao_website',
    'indicacao_parceiro',
    'lookalike_ai',
    'web_scraping_custom',
    'api_integration'
  )),
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  api_credentials JSONB,
  config JSONB,
  
  total_captured INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_sources_active ON public.leads_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_sources_priority ON public.leads_sources(priority DESC);

ALTER TABLE public.leads_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all sources" ON public.leads_sources;
CREATE POLICY "Users can view all sources"
  ON public.leads_sources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert sources" ON public.leads_sources;
CREATE POLICY "Users can insert sources"
  ON public.leads_sources FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABELA 2: leads_quarantine
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
  region TEXT CHECK (region IN ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
  
  employees INTEGER,
  revenue DECIMAL(15,2),
  company_size TEXT CHECK (company_size IN ('micro', 'pequena', 'media', 'grande')),
  
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
    'pending',
    'validating',
    'approved',
    'rejected',
    'duplicate',
    'invalid_data'
  )),
  
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
  
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN (
    'pending',
    'in_progress',
    'completed',
    'failed'
  )),
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
  
  validated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_cnpj_in_quarantine UNIQUE(cnpj),
  CONSTRAINT check_score_range CHECK (auto_score >= 0 AND auto_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_quarantine_status ON public.leads_quarantine(validation_status);
CREATE INDEX IF NOT EXISTS idx_quarantine_source ON public.leads_quarantine(source_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_captured ON public.leads_quarantine(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_cnpj ON public.leads_quarantine(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quarantine_score ON public.leads_quarantine(auto_score DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_sector_state ON public.leads_quarantine(sector, state);
CREATE INDEX IF NOT EXISTS idx_quarantine_enriched_data ON public.leads_quarantine USING GIN (enriched_data);
CREATE INDEX IF NOT EXISTS idx_quarantine_technologies ON public.leads_quarantine USING GIN (technologies_detected);

ALTER TABLE public.leads_quarantine ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can view all quarantine leads"
  ON public.leads_quarantine FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can insert quarantine leads"
  ON public.leads_quarantine FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can update quarantine leads"
  ON public.leads_quarantine FOR UPDATE
  USING (true);

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
-- TRIGGERS
-- ============================================

-- Trigger para leads_sources updated_at
DROP TRIGGER IF EXISTS update_leads_sources_updated_at ON public.leads_sources;
CREATE TRIGGER update_leads_sources_updated_at
  BEFORE UPDATE ON public.leads_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para leads_quarantine updated_at
DROP TRIGGER IF EXISTS update_leads_quarantine_updated_at ON public.leads_quarantine;
CREATE TRIGGER update_leads_quarantine_updated_at
  BEFORE UPDATE ON public.leads_quarantine
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar stats da source
CREATE OR REPLACE FUNCTION update_source_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validation_status = 'approved' AND OLD.validation_status != 'approved' THEN
    UPDATE public.leads_sources
    SET total_approved = COALESCE(total_approved, 0) + 1,
        success_rate = (COALESCE(total_approved, 0) + 1)::DECIMAL / NULLIF(total_captured, 0) * 100
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_source_stats ON public.leads_quarantine;
CREATE TRIGGER trigger_update_source_stats
  AFTER UPDATE ON public.leads_quarantine
  FOR EACH ROW
  EXECUTE FUNCTION update_source_stats();

-- ============================================
-- INSERIR FONTES PADRÃO
-- ============================================
INSERT INTO public.leads_sources (source_name, is_active, priority) 
VALUES 
  ('upload_manual', true, 10),
  ('apollo_io', true, 9),
  ('linkedin_sales_navigator', true, 8),
  ('google_search', true, 7),
  ('empresas_aqui', true, 6)
ON CONFLICT (source_name) DO NOTHING;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'SUCESSO! Tabelas e Views criadas:' as status,
  COUNT(*) as total
FROM (
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('icp_analysis_results', 'sdr_notifications', 'icp_mapping_templates', 'leads_sources', 'leads_quarantine')
  UNION ALL
  SELECT table_name FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name = 'source_performance'
) AS combined;

-- Deve retornar: total >= 6

