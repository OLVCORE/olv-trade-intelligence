-- ============================================================================
-- COMMERCIAL PROPOSALS - SISTEMA DE PROPOSTAS B2B
-- ============================================================================
-- Migration criada em: 2025-11-11
-- Descrição: Tabela para geração e tracking de propostas comerciais
-- ============================================================================

-- 1️⃣ CRIAR TABELA commercial_proposals
CREATE TABLE IF NOT EXISTS public.commercial_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
  
  -- Dealer/Distribuidor
  dealer_id UUID REFERENCES public.companies(id), -- Dealer B2B descoberto
  dealer_name TEXT NOT NULL,
  dealer_email TEXT,
  dealer_country TEXT,
  dealer_city TEXT,
  
  -- Identificação
  proposal_number TEXT UNIQUE NOT NULL, -- 'PROP-2025-001'
  
  -- Produtos selecionados
  products JSONB NOT NULL, -- [{ product_id, name, hs_code, quantity, unit_price_usd, total_usd }]
  
  -- Pricing (calculado)
  subtotal_usd DECIMAL NOT NULL,
  shipping_cost_usd DECIMAL DEFAULT 0,
  insurance_cost_usd DECIMAL DEFAULT 0,
  total_value_usd DECIMAL NOT NULL,
  
  -- Incoterm selecionado
  incoterm TEXT NOT NULL CHECK (incoterm IN ('EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP')),
  
  -- Todos os Incoterms calculados (para referência)
  all_incoterms JSONB, -- { EXW: 100, FOB: 120, CIF: 140, ... }
  
  -- Logística
  origin_port TEXT DEFAULT 'BRSSZ', -- Santos, Brasil
  destination_port TEXT,
  destination_address TEXT,
  transport_mode TEXT CHECK (transport_mode IN ('ocean', 'air', 'road', 'rail')),
  estimated_delivery_days INTEGER,
  
  -- Incentivos fiscais Brasil aplicados
  export_incentives JSONB, -- { icms: 18%, drawback: 25%, total: 43% }
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'negotiating', 'accepted', 'rejected', 'expired')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  valid_until DATE, -- Data de validade da proposta
  
  -- Arquivos
  pdf_url TEXT, -- URL do PDF no Supabase Storage
  pdf_filename TEXT,
  
  -- Email tracking
  email_sent_to TEXT,
  email_opened BOOLEAN DEFAULT false,
  email_opened_at TIMESTAMPTZ,
  
  -- Notas internas
  notes TEXT,
  internal_notes TEXT, -- Notas privadas (não vão no PDF)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON public.commercial_proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposals_workspace ON public.commercial_proposals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proposals_dealer ON public.commercial_proposals(dealer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.commercial_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON public.commercial_proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_number ON public.commercial_proposals(proposal_number);

-- 2️⃣ HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.commercial_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_proposals ON public.commercial_proposals;
CREATE POLICY tenant_isolation_proposals ON public.commercial_proposals
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- 3️⃣ FUNÇÃO: Gerar número de proposta automático
CREATE OR REPLACE FUNCTION public.generate_proposal_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  proposal_num TEXT;
BEGIN
  -- Ano atual (últimos 2 dígitos)
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  -- Buscar último número de proposta do tenant no ano
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(proposal_number, '[^0-9]+', '', 'g') AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM public.commercial_proposals
  WHERE tenant_id = p_tenant_id
    AND proposal_number LIKE 'PROP-' || year_suffix || '%';
  
  -- Formatar: PROP-25-001
  proposal_num := 'PROP-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN proposal_num;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ TRIGGER: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_commercial_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_proposals_updated_at ON public.commercial_proposals;
CREATE TRIGGER trigger_update_proposals_updated_at
BEFORE UPDATE ON public.commercial_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_commercial_proposals_updated_at();

-- 5️⃣ CRIAR STORAGE BUCKET para PDFs de propostas
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-pdfs', 'proposal-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Política de acesso ao bucket (apenas usuários autenticados do tenant)
DROP POLICY IF EXISTS "Tenant users can upload proposals" ON storage.objects;
CREATE POLICY "Tenant users can upload proposals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proposal-pdfs' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::TEXT FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Tenant users can read proposals" ON storage.objects;
CREATE POLICY "Tenant users can read proposals"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proposal-pdfs' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::TEXT FROM public.users WHERE id = auth.uid())
);

-- ============================================================================
-- ✅ VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'COMMERCIAL PROPOSALS SETUP COMPLETO!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Tabela: commercial_proposals criada';
  RAISE NOTICE 'RLS: Habilitado';
  RAISE NOTICE 'Storage Bucket: proposal-pdfs criado';
  RAISE NOTICE 'Função: generate_proposal_number() criada';
  RAISE NOTICE '======================================';
END $$;

