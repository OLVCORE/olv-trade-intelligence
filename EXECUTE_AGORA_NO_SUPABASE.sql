-- ⚡⚡⚡ EXECUTE ESTE SQL NO SUPABASE SQL EDITOR ⚡⚡⚡
-- URL: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new
-- AÇÃO: Copiar TODO este arquivo e clicar RUN

-- ============================================
-- TABELA 1: icp_analysis_results (CRÍTICA!)
-- ============================================
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
  status TEXT DEFAULT 'pendente', -- pendente, approved, rejected
  temperatura TEXT, -- hot, warm, cold
  
  -- Análise TOTVS Check
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_confidence INTEGER DEFAULT 0,
  totvs_products TEXT[],
  
  -- IDs relacionados
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_icp_results_company_id ON public.icp_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_results_user_id ON public.icp_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_icp_results_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_results_score ON public.icp_analysis_results(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_icp_results_batch_id ON public.icp_analysis_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_icp_results_moved ON public.icp_analysis_results(moved_to_pool);
CREATE INDEX IF NOT EXISTS idx_icp_results_totvs ON public.icp_analysis_results(is_cliente_totvs);
CREATE INDEX IF NOT EXISTS idx_icp_results_origem ON public.icp_analysis_results(origem);
CREATE INDEX IF NOT EXISTS idx_icp_results_reviewed ON public.icp_analysis_results(reviewed);

-- RLS
ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own analysis" ON public.icp_analysis_results
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Authenticated users can insert analysis" ON public.icp_analysis_results
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own analysis" ON public.icp_analysis_results
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own analysis" ON public.icp_analysis_results
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- TABELA 2: sdr_notifications (CRÍTICA!)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- deal_update, task_due, email_received, etc
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info', -- info, warning, error, success
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Dados contextuais
  entity_type TEXT, -- deal, company, lead, etc
  entity_id UUID,
  action_url TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_user_id ON public.sdr_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_is_read ON public.sdr_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_created_at ON public.sdr_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_type ON public.sdr_notifications(type);

-- RLS
ALTER TABLE public.sdr_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications" ON public.sdr_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.sdr_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.sdr_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.sdr_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TABELA 3: icp_mapping_templates
-- ============================================
CREATE TABLE IF NOT EXISTS public.icp_mapping_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_template TEXT NOT NULL,
  descricao TEXT,
  mappings JSONB NOT NULL,
  custom_fields TEXT[] DEFAULT '{}',
  total_colunas INTEGER NOT NULL DEFAULT 0,
  ultima_utilizacao TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icp_mapping_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios templates" ON public.icp_mapping_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios templates" ON public.icp_mapping_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios templates" ON public.icp_mapping_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios templates" ON public.icp_mapping_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_icp_mapping_templates_updated_at
BEFORE UPDATE ON public.icp_mapping_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_mapping_templates_user_id ON public.icp_mapping_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_icp_mapping_templates_ultima_utilizacao ON public.icp_mapping_templates(ultima_utilizacao DESC);

-- ============================================
-- FUNÇÃO: update_updated_at_column (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- FUNÇÃO: update_sdr_updated_at (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_sdr_updated_at()
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
  'SUCESSO! Tabelas criadas:' as status,
  COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('icp_analysis_results', 'sdr_notifications', 'icp_mapping_templates');

-- Deve retornar: total_tabelas = 3

