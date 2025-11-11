-- =====================================================
-- SALES CRM COMPLETO (Migrado do TOTVS Intelligence)
-- Descrição: Sistema completo de CRM com Pipeline Kanban,
--            Email Sequences, Smart Tasks, Automations
-- Contexto: Export/Import Intelligence (Internacional)
-- =====================================================

-- 1. Tabela de Deals (Negócios/Oportunidades)
CREATE TABLE IF NOT EXISTS sales_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT, -- ID externo (Bitrix24, etc)
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Dealer/Prospect
  contact_id UUID, -- ID do decisor
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Pipeline & Estágio
  pipeline_id UUID, -- Para múltiplos pipelines
  stage TEXT NOT NULL DEFAULT 'prospect',
  stage_order INTEGER DEFAULT 0,
  
  -- Valores
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  lost_reason TEXT,
  won_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  source TEXT, -- inbound, outbound, referral, etc
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Tenant (Multi-tenancy)
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Sync external CRM
  external_synced_at TIMESTAMP WITH TIME ZONE,
  external_data JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_sales_deals_company ON sales_deals(company_id);
CREATE INDEX idx_sales_deals_contact ON sales_deals(contact_id);
CREATE INDEX idx_sales_deals_assigned ON sales_deals(assigned_to);
CREATE INDEX idx_sales_deals_stage ON sales_deals(stage);
CREATE INDEX idx_sales_deals_status ON sales_deals(status);
CREATE INDEX idx_sales_deals_tenant ON sales_deals(tenant_id);
CREATE INDEX idx_sales_deals_workspace ON sales_deals(workspace_id);
CREATE INDEX idx_sales_deals_external ON sales_deals(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_sales_deals_close_date ON sales_deals(expected_close_date) WHERE expected_close_date IS NOT NULL;

-- RLS (Row Level Security)
ALTER TABLE sales_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation sales_deals" ON sales_deals
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =====================================================

-- 2. Tabela de Pipeline Stages (Estágios Customizáveis)
CREATE TABLE IF NOT EXISTS sales_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  probability_default INTEGER DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,
  automation_rules JSONB DEFAULT '[]'::JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_sales_pipeline_stages_tenant ON sales_pipeline_stages(tenant_id);
CREATE INDEX idx_sales_pipeline_stages_order ON sales_pipeline_stages(order_index);

-- RLS
ALTER TABLE sales_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation sales_pipeline_stages" ON sales_pipeline_stages
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Inserir estágios padrão para export/import context
INSERT INTO sales_pipeline_stages (tenant_id, name, key, order_index, color, probability_default, is_closed, is_won)
SELECT 
  t.id as tenant_id,
  stage.name,
  stage.key,
  stage.order_index,
  stage.color,
  stage.probability_default,
  stage.is_closed,
  stage.is_won
FROM tenants t
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

-- =====================================================

-- 3. Tabela de Deal Activities (Histórico)
CREATE TABLE IF NOT EXISTS sales_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sales_deals(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL, -- stage_change, note, email, call, task, etc
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_deal_activities_deal ON sales_deal_activities(deal_id);
CREATE INDEX idx_sales_deal_activities_type ON sales_deal_activities(activity_type);
CREATE INDEX idx_sales_deal_activities_created ON sales_deal_activities(created_at DESC);

-- RLS
ALTER TABLE sales_deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read activities" ON sales_deal_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert activities" ON sales_deal_activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================

-- 4. Email Sequences
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'stage_change', 'deal_created', 'time_based')),
  
  metadata JSONB DEFAULT '{}'::JSONB,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_sequences_tenant ON email_sequences(tenant_id);
CREATE INDEX idx_email_sequences_status ON email_sequences(status);

-- RLS
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation email_sequences" ON email_sequences
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =====================================================

-- 5. Email Sequence Steps
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  
  step_order INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  send_time TIME, -- Horário específico (ex: 09:00)
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(sequence_id, step_order)
);

CREATE INDEX idx_email_sequence_steps_sequence ON email_sequence_steps(sequence_id);
CREATE INDEX idx_email_sequence_steps_order ON email_sequence_steps(step_order);

-- RLS
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage steps" ON email_sequence_steps
  FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================

-- 6. Smart Tasks
CREATE TABLE IF NOT EXISTS smart_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  deal_id UUID REFERENCES sales_deals(id) ON DELETE CASCADE,
  
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  
  ai_suggested BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_smart_tasks_tenant ON smart_tasks(tenant_id);
CREATE INDEX idx_smart_tasks_deal ON smart_tasks(deal_id);
CREATE INDEX idx_smart_tasks_assigned ON smart_tasks(assigned_to);
CREATE INDEX idx_smart_tasks_status ON smart_tasks(status);
CREATE INDEX idx_smart_tasks_due_date ON smart_tasks(due_date);

-- RLS
ALTER TABLE smart_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation smart_tasks" ON smart_tasks
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =====================================================

-- 7. Automations (Workflows)
CREATE TABLE IF NOT EXISTS sales_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  trigger_type TEXT NOT NULL, -- stage_change, time_based, field_update
  trigger_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  conditions JSONB DEFAULT '[]'::JSONB, -- Array de conditions (if/else)
  actions JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array de actions (send_email, create_task, etc)
  
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  executions_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_automations_tenant ON sales_automations(tenant_id);
CREATE INDEX idx_sales_automations_active ON sales_automations(is_active);
CREATE INDEX idx_sales_automations_trigger ON sales_automations(trigger_type);

-- RLS
ALTER TABLE sales_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation sales_automations" ON sales_automations
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =====================================================

-- 8. Triggers & Functions

-- Trigger: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_sales_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_deals_updated_at
  BEFORE UPDATE ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_deals_updated_at();

-- Trigger: Log stage change
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sales_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Stage changed from ' || OLD.stage || ' to ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();

-- Trigger: Auto-create contract on deal won
CREATE OR REPLACE FUNCTION auto_create_contract_on_deal_won()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'won' AND (OLD.status IS NULL OR OLD.status <> 'won') THEN
    -- Criar contrato automaticamente (se FASE 7 estiver implementada)
    -- INSERT INTO dealer_contracts (...) VALUES (...);
    
    -- Por enquanto, apenas log
    INSERT INTO sales_deal_activities (deal_id, activity_type, description, created_by)
    VALUES (
      NEW.id,
      'deal_won',
      'Deal marked as won! Ready to create contract.',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_create_contract
  AFTER UPDATE ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_contract_on_deal_won();

-- =====================================================

-- 9. Views úteis

-- View: Deals com detalhes
CREATE OR REPLACE VIEW sales_deals_detailed AS
SELECT 
  d.*,
  c.company_name AS dealer_name,
  c.city AS dealer_city,
  c.country AS dealer_country,
  s.name AS stage_name,
  s.color AS stage_color,
  s.probability_default AS stage_probability,
  u.email AS assigned_email,
  (SELECT COUNT(*) FROM sales_deal_activities a WHERE a.deal_id = d.id) AS activities_count,
  (SELECT COUNT(*) FROM smart_tasks t WHERE t.deal_id = d.id AND t.status <> 'done') AS open_tasks_count
FROM sales_deals d
LEFT JOIN companies c ON c.id = d.company_id
LEFT JOIN sales_pipeline_stages s ON s.key = d.stage AND s.tenant_id = d.tenant_id
LEFT JOIN auth.users u ON u.id = d.assigned_to;

-- View: Pipeline metrics
CREATE OR REPLACE VIEW sales_pipeline_metrics AS
SELECT 
  tenant_id,
  stage,
  COUNT(*) AS deals_count,
  SUM(value) AS total_value,
  AVG(value) AS avg_value,
  AVG(probability) AS avg_probability,
  COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')) AS hot_deals
FROM sales_deals
WHERE status = 'open'
GROUP BY tenant_id, stage;

-- =====================================================

COMMENT ON TABLE sales_deals IS 'Negócios/Oportunidades de vendas (Export/Import)';
COMMENT ON TABLE sales_pipeline_stages IS 'Estágios customizáveis do pipeline';
COMMENT ON TABLE sales_deal_activities IS 'Histórico de atividades dos deals';
COMMENT ON TABLE email_sequences IS 'Sequências de email automatizadas';
COMMENT ON TABLE email_sequence_steps IS 'Steps das sequências de email';
COMMENT ON TABLE smart_tasks IS 'Tarefas inteligentes com sugestões de IA';
COMMENT ON TABLE sales_automations IS 'Automações e workflows de vendas';

