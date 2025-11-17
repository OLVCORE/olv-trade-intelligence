-- ============================================================================
-- MIGRAÇÃO DE CONTINGÊNCIA
-- Restaura todas as tabelas legadas usadas pelos módulos SDR / ICP / Estratégia
-- ============================================================================

-- Garantir função utilitária para updated_at (idempotente)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. Tabela icp_analysis_results (Quarentena ICP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  workspace_id UUID REFERENCES public.workspaces(id),

  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  domain TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  origem TEXT,

  icp_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  temperatura TEXT,
  reviewed BOOLEAN DEFAULT false,
  moved_to_pool BOOLEAN DEFAULT false,

  setor TEXT,
  uf TEXT,
  regiao TEXT,
  cidade TEXT,
  porte TEXT,
  faixa_funcionarios TEXT,
  municipio TEXT,
  cnae_principal TEXT,

  is_totvs_client BOOLEAN DEFAULT false,
  totvs_confidence INTEGER DEFAULT 0,
  totvs_products TEXT[],

  analysis_data JSONB,
  raw_data JSONB,
  full_report JSONB,

  batch_id UUID,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icp_analysis_company_id ON public.icp_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_user_id ON public.icp_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_tenant ON public.icp_analysis_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_workspace ON public.icp_analysis_results(workspace_id);

ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS icp_analysis_results_select_policy ON public.icp_analysis_results;
CREATE POLICY icp_analysis_results_select_policy
ON public.icp_analysis_results
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS icp_analysis_results_insert_policy ON public.icp_analysis_results;
CREATE POLICY icp_analysis_results_insert_policy
ON public.icp_analysis_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS icp_analysis_results_update_policy ON public.icp_analysis_results;
CREATE POLICY icp_analysis_results_update_policy
ON public.icp_analysis_results
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS icp_analysis_results_delete_policy ON public.icp_analysis_results;
CREATE POLICY icp_analysis_results_delete_policy
ON public.icp_analysis_results
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_icp_analysis_results_updated_at ON public.icp_analysis_results;
CREATE TRIGGER update_icp_analysis_results_updated_at
BEFORE UPDATE ON public.icp_analysis_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. Tabela sdr_notifications (Campainha / alertas Trevo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sdr_notifications_user_id ON public.sdr_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_is_read ON public.sdr_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_created_at ON public.sdr_notifications(created_at DESC);

ALTER TABLE public.sdr_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sdr_notifications_select_policy ON public.sdr_notifications;
CREATE POLICY sdr_notifications_select_policy
ON public.sdr_notifications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS sdr_notifications_insert_policy ON public.sdr_notifications;
CREATE POLICY sdr_notifications_insert_policy
ON public.sdr_notifications
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS sdr_notifications_update_policy ON public.sdr_notifications;
CREATE POLICY sdr_notifications_update_policy
ON public.sdr_notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS sdr_notifications_delete_policy ON public.sdr_notifications;
CREATE POLICY sdr_notifications_delete_policy
ON public.sdr_notifications
FOR DELETE
USING (auth.uid() = user_id);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sdr_notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END;
$$;

-- ============================================================================
-- 3. leads_pool (templates antigos utilizados pelos hooks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. user_roles (enum + tabela para RBAC)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'viewer');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role = p_role::public.app_role
  );
$$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_self_view ON public.user_roles;
CREATE POLICY user_roles_self_view
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_roles_admin_manage ON public.user_roles;
CREATE POLICY user_roles_admin_manage
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 5. conversations + messages (motor SDR)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  channel JSONB DEFAULT '{"whatsapp": false, "email": false}'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  status TEXT CHECK (status IN ('open','pending','closed','archived')) DEFAULT 'open',
  assigned_to UUID,
  priority TEXT CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  sla_due_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_company ON public.conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_sla ON public.conversations(sla_due_at);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('in','out')) NOT NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  from_id TEXT,
  to_id TEXT,
  body TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  provider_message_id TEXT,
  status TEXT CHECK (status IN ('sent','delivered','read','failed')) DEFAULT 'sent',
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_unique ON public.messages(provider_message_id) WHERE provider_message_id IS NOT NULL;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_manage_policy ON public.contacts;
CREATE POLICY contacts_manage_policy ON public.contacts FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS conversations_manage_policy ON public.conversations;
CREATE POLICY conversations_manage_policy ON public.conversations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS messages_manage_policy ON public.messages;
CREATE POLICY messages_manage_policy ON public.messages FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. account_strategies (motor estratégico + GIE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.account_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  persona_id UUID,
  decision_maker_id UUID,
  status TEXT DEFAULT 'draft',
  current_stage TEXT DEFAULT 'cold_outreach',
  priority TEXT DEFAULT 'medium',
  value_proposition TEXT,
  approach_strategy TEXT,
  expected_timeline TEXT,
  identified_gaps JSONB DEFAULT '[]'::jsonb,
  recommended_products JSONB DEFAULT '[]'::jsonb,
  transformation_roadmap JSONB DEFAULT '{}'::jsonb,
  projected_roi NUMERIC,
  investment_required NUMERIC,
  payback_period TEXT,
  annual_value NUMERIC,
  stakeholder_map JSONB DEFAULT '[]'::jsonb,
  relationship_score INTEGER DEFAULT 0,
  engagement_level TEXT DEFAULT 'cold',
  last_touchpoint_at TIMESTAMPTZ,
  next_action_due TIMESTAMPTZ,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_strategies_company ON public.account_strategies(company_id);
CREATE INDEX IF NOT EXISTS idx_account_strategies_status ON public.account_strategies(status);
CREATE INDEX IF NOT EXISTS idx_account_strategies_stage ON public.account_strategies(current_stage);

ALTER TABLE public.account_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS account_strategies_manage_policy ON public.account_strategies;
CREATE POLICY account_strategies_manage_policy
ON public.account_strategies
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS update_account_strategies_updated_at ON public.account_strategies;
CREATE TRIGGER update_account_strategies_updated_at
BEFORE UPDATE ON public.account_strategies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. executive_reports + versions (motor de relatórios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  content JSONB,
  data_quality_score NUMERIC,
  sources_used JSONB,
  run_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS executive_reports_company_type_idx
  ON public.executive_reports(company_id, report_type);

ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS executive_reports_read_policy ON public.executive_reports;
CREATE POLICY executive_reports_read_policy
ON public.executive_reports
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS executive_reports_write_policy ON public.executive_reports;
CREATE POLICY executive_reports_write_policy
ON public.executive_reports
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS executive_reports_update_policy ON public.executive_reports;
CREATE POLICY executive_reports_update_policy
ON public.executive_reports
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_executive_reports_updated_at ON public.executive_reports;
CREATE TRIGGER trg_executive_reports_updated_at
BEFORE UPDATE ON public.executive_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.executive_reports_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.executive_reports(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_report_versions_report ON public.executive_reports_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_versions_company ON public.executive_reports_versions(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_versions_unique
  ON public.executive_reports_versions(company_id, report_type, version_number);

ALTER TABLE public.executive_reports_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS executive_reports_versions_read_policy ON public.executive_reports_versions;
CREATE POLICY executive_reports_versions_read_policy
ON public.executive_reports_versions
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS executive_reports_versions_insert_policy ON public.executive_reports_versions;
CREATE POLICY executive_reports_versions_insert_policy
ON public.executive_reports_versions
FOR INSERT TO authenticated
WITH CHECK (true);

