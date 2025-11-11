-- ============================================================================
-- FASE 7: DEALER RELATIONSHIP MANAGEMENT (DRM)
-- ============================================================================
-- Migration criada em: 2025-11-11
-- Descrição: Sistema completo de gestão de relacionamento com dealers
-- ============================================================================

-- 1. TABELA: dealer_contracts (Contratos 1-5 anos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dealer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Dados do Contrato
  contract_number TEXT UNIQUE NOT NULL,
  signed_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  auto_renewal BOOLEAN DEFAULT false,
  
  -- Produtos Contratados
  products JSONB NOT NULL DEFAULT '[]',
  
  -- Metas
  sales_target_usd DECIMAL(15,2),
  sales_target_units INTEGER,
  frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
  
  -- Territórios
  exclusive_territories TEXT[] DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  
  -- Termos Comerciais
  payment_terms TEXT,
  default_incoterm TEXT DEFAULT 'CIF',
  minimum_order_value_usd DECIMAL(15,2),
  discount_volume JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'active', -- 'draft', 'active', 'suspended', 'expired', 'terminated'
  
  -- Arquivos
  contract_pdf_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_dealer_contracts_dealer ON public.dealer_contracts(dealer_id);
CREATE INDEX idx_dealer_contracts_status ON public.dealer_contracts(status);
CREATE INDEX idx_dealer_contracts_end_date ON public.dealer_contracts(end_date);
CREATE INDEX idx_dealer_contracts_tenant ON public.dealer_contracts(tenant_id);

-- RLS
ALTER TABLE public.dealer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - dealer_contracts" ON public.dealer_contracts
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- 2. TABELA: dealer_orders (Pedidos Recorrentes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dealer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.dealer_contracts(id) ON DELETE CASCADE,
  
  -- Dados do Pedido
  order_number TEXT UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  requested_delivery_date DATE,
  confirmed_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Produtos
  products JSONB NOT NULL DEFAULT '[]',
  
  -- Valores
  subtotal_usd DECIMAL(15,2) NOT NULL,
  discount_usd DECIMAL(15,2) DEFAULT 0,
  shipping_usd DECIMAL(15,2) DEFAULT 0,
  total_usd DECIMAL(15,2) NOT NULL,
  
  -- Logística
  incoterm TEXT DEFAULT 'CIF',
  shipping_mode TEXT, -- 'ocean', 'air', 'road', 'rail'
  origin_port TEXT,
  destination_port TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled'
  production_status TEXT, -- 'queued', 'manufacturing', 'quality_check', 'ready'
  shipping_tracking TEXT,
  
  -- Documentos
  invoice_pdf_url TEXT,
  packing_list_pdf_url TEXT,
  bl_pdf_url TEXT,
  
  -- Notas
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dealer_orders_dealer ON public.dealer_orders(dealer_id);
CREATE INDEX idx_dealer_orders_contract ON public.dealer_orders(contract_id);
CREATE INDEX idx_dealer_orders_status ON public.dealer_orders(status);
CREATE INDEX idx_dealer_orders_date ON public.dealer_orders(order_date DESC);
CREATE INDEX idx_dealer_orders_tenant ON public.dealer_orders(tenant_id);

-- RLS
ALTER TABLE public.dealer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - dealer_orders" ON public.dealer_orders
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- 3. TABELA: dealer_performance (Metas & Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dealer_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.dealer_contracts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Período
  year INTEGER NOT NULL,
  quarter INTEGER, -- 1, 2, 3, 4 (NULL para anual)
  month INTEGER, -- 1-12 (NULL para trimestral/anual)
  
  -- Metas vs Realizado
  target_usd DECIMAL(15,2),
  achieved_usd DECIMAL(15,2) DEFAULT 0,
  achievement_percentage DECIMAL(5,2) DEFAULT 0,
  
  target_units INTEGER,
  achieved_units INTEGER DEFAULT 0,
  
  -- Métricas
  orders_count INTEGER DEFAULT 0,
  avg_order_value_usd DECIMAL(15,2),
  repeat_order_rate DECIMAL(5,2), -- % de recompra
  
  -- Rankings
  rank_region INTEGER,
  rank_global INTEGER,
  
  -- Scoring
  score DECIMAL(5,2) DEFAULT 0, -- 0-100
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(dealer_id, year, quarter, month)
);

CREATE INDEX idx_dealer_performance_dealer ON public.dealer_performance(dealer_id);
CREATE INDEX idx_dealer_performance_period ON public.dealer_performance(year, quarter, month);
CREATE INDEX idx_dealer_performance_score ON public.dealer_performance(score DESC);
CREATE INDEX idx_dealer_performance_tier ON public.dealer_performance(tier);
CREATE INDEX idx_dealer_performance_tenant ON public.dealer_performance(tenant_id);

-- RLS
ALTER TABLE public.dealer_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - dealer_performance" ON public.dealer_performance
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- 4. TABELA: marketing_materials (Biblioteca de Materiais)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Material
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'brochure', 'catalog', 'video', 'presentation', 'banner', 'social_media'
  category TEXT, -- 'product', 'brand', 'campaign'
  language TEXT DEFAULT 'en', -- 'en', 'es', 'de', 'pt', 'zh', 'ja'
  
  -- Arquivo
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'jpg', 'mp4', 'pptx', 'png'
  file_size_mb DECIMAL(8,2),
  thumbnail_url TEXT,
  
  -- Produtos Relacionados
  products TEXT[] DEFAULT '{}',
  
  -- Acesso
  is_public BOOLEAN DEFAULT false,
  allowed_dealers UUID[], -- IDs dos dealers (NULL = todos)
  
  -- Métricas
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketing_materials_tenant ON public.marketing_materials(tenant_id);
CREATE INDEX idx_marketing_materials_type ON public.marketing_materials(type);
CREATE INDEX idx_marketing_materials_language ON public.marketing_materials(language);
CREATE INDEX idx_marketing_materials_downloads ON public.marketing_materials(downloads_count DESC);

-- RLS
ALTER TABLE public.marketing_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - marketing_materials" ON public.marketing_materials
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- 5. TABELA: dealer_incentives (Gamificação & Bônus)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dealer_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Incentivo
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'volume_discount', 'early_payment', 'quarterly_bonus', 'market_development_fund', 'referral'
  
  -- Condições
  min_purchase_usd DECIMAL(15,2),
  min_purchase_units INTEGER,
  period TEXT, -- 'monthly', 'quarterly', 'yearly'
  
  -- Recompensa
  discount_percentage DECIMAL(5,2),
  bonus_usd DECIMAL(15,2),
  free_products JSONB DEFAULT '[]',
  
  -- Marketing Fund (MDF)
  mdf_percentage DECIMAL(5,2),
  mdf_max_usd DECIMAL(15,2),
  
  -- Validade
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Dealers Elegíveis
  applies_to TEXT DEFAULT 'all', -- 'all', 'tier', 'specific'
  tiers TEXT[] DEFAULT '{}', -- ['gold', 'platinum']
  dealers UUID[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dealer_incentives_tenant ON public.dealer_incentives(tenant_id);
CREATE INDEX idx_dealer_incentives_active ON public.dealer_incentives(is_active);
CREATE INDEX idx_dealer_incentives_valid ON public.dealer_incentives(valid_from, valid_until);

-- RLS
ALTER TABLE public.dealer_incentives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - dealer_incentives" ON public.dealer_incentives
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- 6. FUNÇÃO: Atualizar performance automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_dealer_performance()
RETURNS TRIGGER AS $$
DECLARE
  perf_record RECORD;
  total_achieved DECIMAL;
  total_units INTEGER;
  total_orders INTEGER;
BEGIN
  -- Calcular totais do mês
  SELECT 
    COALESCE(SUM(total_usd), 0),
    COALESCE(SUM((jsonb_array_length(products))), 0),
    COUNT(*)
  INTO total_achieved, total_units, total_orders
  FROM public.dealer_orders
  WHERE dealer_id = NEW.dealer_id
    AND contract_id = NEW.contract_id
    AND EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NEW.order_date)
    AND EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM NEW.order_date)
    AND status NOT IN ('cancelled');
  
  -- Buscar performance existente
  SELECT * INTO perf_record
  FROM public.dealer_performance
  WHERE dealer_id = NEW.dealer_id
    AND contract_id = NEW.contract_id
    AND year = EXTRACT(YEAR FROM NEW.order_date)::INTEGER
    AND month = EXTRACT(MONTH FROM NEW.order_date)::INTEGER;
  
  IF perf_record IS NULL THEN
    -- Criar novo registro
    INSERT INTO public.dealer_performance (
      dealer_id,
      contract_id,
      tenant_id,
      year,
      month,
      achieved_usd,
      achieved_units,
      orders_count,
      achievement_percentage
    ) VALUES (
      NEW.dealer_id,
      NEW.contract_id,
      NEW.tenant_id,
      EXTRACT(YEAR FROM NEW.order_date)::INTEGER,
      EXTRACT(MONTH FROM NEW.order_date)::INTEGER,
      total_achieved,
      total_units,
      total_orders,
      0 -- Será calculado quando tiver meta
    );
  ELSE
    -- Atualizar registro existente
    UPDATE public.dealer_performance
    SET 
      achieved_usd = total_achieved,
      achieved_units = total_units,
      orders_count = total_orders,
      achievement_percentage = CASE 
        WHEN target_usd > 0 THEN (total_achieved / target_usd) * 100
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = perf_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar performance
DROP TRIGGER IF EXISTS trigger_update_performance ON public.dealer_orders;
CREATE TRIGGER trigger_update_performance
AFTER INSERT OR UPDATE ON public.dealer_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_dealer_performance();

-- ============================================================================
-- 7. VIEW: Dashboard de Performance
-- ============================================================================

CREATE OR REPLACE VIEW public.dealer_performance_dashboard AS
SELECT 
  dp.*,
  c.company_name AS dealer_name,
  c.city,
  c.state,
  c.country,
  dc.contract_number,
  dc.sales_target_usd AS contract_target_usd,
  dc.sales_target_units AS contract_target_units,
  CASE 
    WHEN dp.achievement_percentage >= 120 THEN 'Excepcional'
    WHEN dp.achievement_percentage >= 100 THEN 'Meta Batida'
    WHEN dp.achievement_percentage >= 80 THEN 'Atenção'
    ELSE 'Crítico'
  END AS status_label
FROM public.dealer_performance dp
JOIN public.companies c ON c.id = dp.dealer_id
JOIN public.dealer_contracts dc ON dc.id = dp.contract_id
ORDER BY dp.score DESC, dp.achievement_percentage DESC;

-- ============================================================================
-- 8. STORAGE BUCKET: marketing-materials
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-materials', 'marketing-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para marketing-materials bucket
DROP POLICY IF EXISTS "Tenants can upload marketing materials" ON storage.objects;
CREATE POLICY "Tenants can upload marketing materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketing-materials');

DROP POLICY IF EXISTS "Marketing materials are public" ON storage.objects;
CREATE POLICY "Marketing materials are public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketing-materials');

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.dealer_contracts IS 'Contratos com dealers (1-5 anos) - exclusividade, metas, territórios';
COMMENT ON TABLE public.dealer_orders IS 'Pedidos recorrentes de dealers - rastreamento completo';
COMMENT ON TABLE public.dealer_performance IS 'Performance vs metas (mensal/trimestral/anual) - gamificação';
COMMENT ON TABLE public.marketing_materials IS 'Biblioteca de materiais de vendas - catálogos, brochures, vídeos';
COMMENT ON TABLE public.dealer_incentives IS 'Incentivos e gamificação - descontos, bônus, MDF';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'FASE 7: DEALER RELATIONSHIP MANAGEMENT';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  1. dealer_contracts';
  RAISE NOTICE '  2. dealer_orders';
  RAISE NOTICE '  3. dealer_performance';
  RAISE NOTICE '  4. marketing_materials';
  RAISE NOTICE '  5. dealer_incentives';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Views criadas:';
  RAISE NOTICE '  1. dealer_performance_dashboard';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Storage Buckets:';
  RAISE NOTICE '  1. marketing-materials (público)';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'RLS Policies: 5 tabelas protegidas';
  RAISE NOTICE 'Triggers: 1 (update_dealer_performance)';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'STATUS: COMPLETO E PRONTO!';
  RAISE NOTICE '======================================';
END $$;

