# 🚀 PLANO DE IMPLEMENTAÇÃO: Melhorias do STRATEVO Prospect para STRATEVO Trade

## 📋 ÍNDICE

1. [Migrations SQL Necessárias](#1-migrations-sql-necessárias)
2. [Edge Functions a Criar](#2-edge-functions-a-criar)
3. [Componentes React a Implementar](#3-componentes-react-a-implementar)
4. [Tabelas e Relacionamentos](#4-tabelas-e-relacionamentos)
5. [Funções RPC do PostgreSQL](#5-funções-rpc-do-postgresql)
6. [RLS Policies](#6-rls-policies)
7. [Ordem de Implementação](#7-ordem-de-implementação)

---

## 1. MIGRATIONS SQL NECESSÁRIAS

### 1.1 Migration: Onboarding Infrastructure

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_onboarding_infrastructure.sql`

```sql
-- ============================================================================
-- MIGRATION: Criar tabelas e relacionamentos base do Onboarding + ICP
-- ============================================================================

-- Tabela de sessões de onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  step1_data JSONB,
  step2_data JSONB,
  step3_data JSONB,
  step4_data JSONB,
  step5_data JSONB,
  icp_recommendation JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','analyzed','completed')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  CONSTRAINT onboarding_sessions_user_tenant_key UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tenant ON public.onboarding_sessions(tenant_id);

-- RLS
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding sessions"
  ON public.onboarding_sessions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );
```

### 1.2 Migration: ICP Profiles Metadata

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_multiple_icp_profiles.sql`

```sql
-- ============================================================================
-- MIGRATION: Suporte a Múltiplos ICPs
-- ============================================================================

-- Tabela pública para gerenciar múltiplos ICPs (metadados)
CREATE TABLE IF NOT EXISTS public.icp_profiles_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('core', 'mercado')),
  setor_foco TEXT,
  nicho_foco TEXT,
  setores_alvo TEXT[],
  cnaes_alvo TEXT[],
  porte_alvo TEXT[],
  estados_alvo TEXT[],
  regioes_alvo TEXT[],
  faturamento_min DECIMAL,
  faturamento_max DECIMAL,
  funcionarios_min INTEGER,
  funcionarios_max INTEGER,
  caracteristicas_buscar TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT true,
  icp_principal BOOLEAN NOT NULL DEFAULT false,
  prioridade INTEGER DEFAULT 1,
  icp_recommendation JSONB, -- Análise completa da IA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_principal_per_tenant UNIQUE (tenant_id, icp_principal) 
    WHERE icp_principal = true AND ativo = true
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_tenant 
  ON public.icp_profiles_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_tipo 
  ON public.icp_profiles_metadata(tipo);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_ativo 
  ON public.icp_profiles_metadata(ativo) WHERE ativo = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_icp_profiles_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_icp_profiles_metadata_updated_at 
  ON public.icp_profiles_metadata;
CREATE TRIGGER trigger_update_icp_profiles_metadata_updated_at
  BEFORE UPDATE ON public.icp_profiles_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_icp_profiles_metadata_updated_at();

-- RLS
ALTER TABLE public.icp_profiles_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ICPs from their tenant"
  ON public.icp_profiles_metadata FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ICPs in their tenant"
  ON public.icp_profiles_metadata FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ICPs from their tenant"
  ON public.icp_profiles_metadata FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );
```

### 1.3 Migration: Motor de Qualificação

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_motor_qualificacao.sql`

```sql
-- ============================================================================
-- MOTOR DE QUALIFICAÇÃO DE PROSPECTS
-- ============================================================================

-- 1. Tabela de Jobs de Qualificação
CREATE TABLE IF NOT EXISTS prospect_qualification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  icp_id uuid,
  job_name text NOT NULL,
  source_type text NOT NULL,
  source_file_name text,
  total_cnpjs integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  enriched_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  grade_a_plus integer NOT NULL DEFAULT 0,
  grade_a integer NOT NULL DEFAULT 0,
  grade_b integer NOT NULL DEFAULT 0,
  grade_c integer NOT NULL DEFAULT 0,
  grade_d integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  progress_percentage numeric(5,2) DEFAULT 0.00,
  error_message text,
  config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela de Prospects Qualificados
CREATE TABLE IF NOT EXISTS qualified_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id uuid REFERENCES prospect_qualification_jobs(id) ON DELETE CASCADE,
  icp_id uuid,
  cnpj text NOT NULL,
  razao_social text,
  nome_fantasia text,
  cidade text,
  estado text,
  cep text,
  endereco text,
  bairro text,
  numero text,
  setor text,
  capital_social numeric,
  cnae_principal text,
  cnae_descricao text,
  situacao_cnpj text,
  porte text,
  data_abertura date,
  website text,
  produtos jsonb,
  produtos_count integer DEFAULT 0,
  fit_score numeric(5,2) NOT NULL,
  grade text NOT NULL,
  product_similarity_score numeric(5,2) DEFAULT 0,
  sector_fit_score numeric(5,2) DEFAULT 0,
  capital_fit_score numeric(5,2) DEFAULT 0,
  geo_fit_score numeric(5,2) DEFAULT 0,
  maturity_score numeric(5,2) DEFAULT 0,
  fit_reasons jsonb,
  compatible_products jsonb,
  risk_flags jsonb,
  pipeline_status text DEFAULT 'new',
  approved_at timestamptz,
  discarded_at timestamptz,
  discard_reason text,
  enrichment_data jsonb,
  ai_analysis jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, cnpj)
);

-- 3. Índices
CREATE INDEX idx_qualification_jobs_tenant ON prospect_qualification_jobs(tenant_id);
CREATE INDEX idx_qualification_jobs_status ON prospect_qualification_jobs(status);
CREATE INDEX idx_qualified_prospects_tenant ON qualified_prospects(tenant_id);
CREATE INDEX idx_qualified_prospects_job ON qualified_prospects(job_id);
CREATE INDEX idx_qualified_prospects_grade ON qualified_prospects(grade);
CREATE INDEX idx_qualified_prospects_fit_score ON qualified_prospects(fit_score DESC);
CREATE INDEX idx_qualified_prospects_pipeline_status ON qualified_prospects(pipeline_status);

-- 4. RLS
ALTER TABLE prospect_qualification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualified_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant jobs" ON prospect_qualification_jobs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert their tenant jobs" ON prospect_qualification_jobs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can view their tenant prospects" ON qualified_prospects
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert their tenant prospects" ON qualified_prospects
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );
```

### 1.4 Migration: Leads e Quarentena

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_leads_quarantine.sql`

```sql
-- ============================================================================
-- LEADS E QUARENTENA ICP
-- ============================================================================

-- Quarentena ICP
CREATE TABLE IF NOT EXISTS public.leads_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  icp_id UUID,
  reason TEXT,
  quarantine_date TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'discarded'))
);

-- Leads Descartados
CREATE TABLE IF NOT EXISTS public.leads_discarded (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  reason TEXT,
  discarded_at TIMESTAMPTZ DEFAULT NOW(),
  discarded_by UUID REFERENCES public.users(id)
);

-- Leads Qualificados (aprovados)
CREATE TABLE IF NOT EXISTS public.leads_qualified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  icp_id UUID,
  fit_score NUMERIC(5,2),
  grade TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES public.users(id)
);

-- RLS
ALTER TABLE public.leads_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_discarded ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_qualified ENABLE ROW LEVEL SECURITY;

-- Policies (similar às outras tabelas)
```

### 1.5 Migration: Análise Competitiva

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_competitive_analysis.sql`

```sql
-- ============================================================================
-- ANÁLISE COMPETITIVA
-- ============================================================================

-- Concorrentes do Tenant
CREATE TABLE IF NOT EXISTS public.tenant_competitor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  competitor_cnpj TEXT,
  competitor_name TEXT,
  product_name TEXT,
  product_category TEXT,
  match_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Análise SWOT
CREATE TABLE IF NOT EXISTS public.icp_competitive_swot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  strengths JSONB,
  weaknesses JSONB,
  opportunities JSONB,
  threats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matriz BCG
CREATE TABLE IF NOT EXISTS public.icp_bcg_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  products JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights de Mercado
CREATE TABLE IF NOT EXISTS public.icp_market_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  market_size NUMERIC,
  growth_rate NUMERIC,
  trends JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. EDGE FUNCTIONS A CRIAR

### 2.1 analyze-onboarding-icp

**Arquivo:** `supabase/functions/analyze-onboarding-icp/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { tenant_id, icp_id, regenerate, force_refresh } = await req.json()
  
  // 1. Buscar dados do onboarding_sessions
  // 2. Analisar com IA (OpenAI)
  // 3. Gerar ICP recommendation
  // 4. Criar/atualizar icp_profiles_metadata
  // 5. Retornar resultado
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 2.2 process-qualification-job-sniper

**Arquivo:** `supabase/functions/process-qualification-job-sniper/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { p_job_id, p_tenant_id } = await req.json()
  
  // 1. Buscar job
  // 2. Buscar candidatos (prospecting_candidates)
  // 3. Para cada candidato:
  //    - Enriquecer (Receita Federal, Apollo, etc)
  //    - Calcular fit_score com ICP
  //    - Classificar por grade
  //    - Inserir em qualified_prospects
  // 4. Atualizar estatísticas do job
  // 5. Retornar resultado
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 2.3 enrich-and-qualify-candidate

**Arquivo:** `supabase/functions/enrich-and-qualify-candidate/index.ts`

```typescript
// Enriquece e qualifica uma empresa individual
// Similar ao process-qualification-job-sniper, mas para uma empresa só
```

---

## 3. COMPONENTES REACT A IMPLEMENTAR

### 3.1 OnboardingWizard

**Estrutura de Arquivos:**
```
src/components/onboarding/
  ├── OnboardingWizard.tsx
  ├── ProgressBar.tsx
  ├── OnboardingStepGuide.tsx
  └── steps/
      ├── Step1DadosBasicos.tsx
      ├── Step2SetoresNichos.tsx
      ├── Step3PerfilClienteIdeal.tsx
      ├── Step4SituacaoAtual.tsx
      ├── Step5HistoricoEnriquecimento.tsx
      └── Step6ResumoReview.tsx
```

### 3.2 ICPDetail

**Estrutura de Arquivos:**
```
src/pages/CentralICP/
  ├── ICPDetail.tsx (página principal com 7 abas)
  ├── ICPProfileView.tsx
  └── components/
      ├── ICPResumo.tsx
      ├── ICPConfiguracao.tsx
      ├── ICPCriterios.tsx
      ├── ICP360.tsx
      ├── ICPCompetitiva.tsx
      ├── ICPPlano.tsx
      └── ICPRelatorios.tsx
```

### 3.3 QualificationEnginePage

**Arquivo:** `src/pages/QualificationEnginePage.tsx`

**Componentes Relacionados:**
```
src/components/qualification/
  ├── BulkUploadDialog.tsx
  ├── InlineCompanySearch.tsx
  └── QualificationJobTable.tsx
```

### 3.4 QualifiedProspectsStock

**Arquivo:** `src/pages/QualifiedProspectsStock.tsx`

**Componentes Relacionados:**
```
src/components/qualification/
  ├── QualifiedStockActionsMenu.tsx
  ├── CompanyPreviewModal.tsx
  └── WebsiteFitAnalysisCard.tsx
```

---

## 4. TABELAS E RELACIONAMENTOS

### 4.1 Diagrama de Relacionamentos

```
tenants
  ├── onboarding_sessions (1:N)
  ├── icp_profiles_metadata (1:N)
  ├── prospect_qualification_jobs (1:N)
  ├── qualified_prospects (1:N)
  ├── companies (1:N)
  └── leads (1:N)

icp_profiles_metadata
  ├── icp_competitive_swot (1:1)
  ├── icp_bcg_matrix (1:1)
  └── icp_market_insights (1:1)

prospect_qualification_jobs
  └── qualified_prospects (1:N)

companies
  ├── leads_quarantine (1:N)
  ├── leads_discarded (1:N)
  └── leads_qualified (1:N)
```

---

## 5. FUNÇÕES RPC DO POSTGRESQL

### 5.1 process_qualification_job_sniper

```sql
CREATE OR REPLACE FUNCTION process_qualification_job_sniper(
  p_job_id UUID,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job RECORD;
  v_candidate RECORD;
  v_fit_score NUMERIC;
  v_grade TEXT;
  v_processed_count INTEGER := 0;
  v_qualified_count INTEGER := 0;
BEGIN
  -- 1. Buscar job
  SELECT * INTO v_job
  FROM prospect_qualification_jobs
  WHERE id = p_job_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job não encontrado';
  END IF;
  
  -- 2. Atualizar status
  UPDATE prospect_qualification_jobs
  SET status = 'processing', started_at = NOW()
  WHERE id = p_job_id;
  
  -- 3. Processar candidatos
  FOR v_candidate IN
    SELECT * FROM prospecting_candidates
    WHERE tenant_id = p_tenant_id
      AND source_batch_id = v_job.source_file_name
      AND status = 'pending'
  LOOP
    -- 3.1 Enriquecer (chamar Edge Function)
    -- 3.2 Calcular fit_score
    -- 3.3 Classificar por grade
    -- 3.4 Inserir em qualified_prospects
    
    v_processed_count := v_processed_count + 1;
    IF v_fit_score >= 60 THEN
      v_qualified_count := v_qualified_count + 1;
    END IF;
  END LOOP;
  
  -- 4. Atualizar job
  UPDATE prospect_qualification_jobs
  SET 
    status = 'completed',
    processed_count = v_processed_count,
    enriched_count = v_qualified_count,
    completed_at = NOW()
  WHERE id = p_job_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_count', v_processed_count,
    'qualified_count', v_qualified_count
  );
END;
$$;
```

### 5.2 approve_prospects_bulk

```sql
CREATE OR REPLACE FUNCTION approve_prospects_bulk(
  p_tenant_id UUID,
  p_job_id UUID,
  p_grades TEXT[]
)
RETURNS TABLE (
  approved_count INTEGER,
  empresa_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approved_count INTEGER;
  v_empresa_ids UUID[];
BEGIN
  -- Inserir prospects qualificados na tabela companies
  WITH inserted AS (
    INSERT INTO companies (
      tenant_id, cnpj, razao_social, nome_fantasia,
      cidade, estado, setor, capital_social,
      origem, fit_score, grade, status
    )
    SELECT
      p_tenant_id, qp.cnpj, qp.razao_social, qp.nome_fantasia,
      qp.cidade, qp.estado, qp.setor, qp.capital_social,
      'motor_qualificacao', qp.fit_score, qp.grade, 'pending_review'
    FROM qualified_prospects qp
    WHERE qp.tenant_id = p_tenant_id
      AND qp.job_id = p_job_id
      AND qp.grade = ANY(p_grades)
      AND qp.pipeline_status = 'new'
    ON CONFLICT (tenant_id, cnpj) DO NOTHING
    RETURNING id
  )
  SELECT 
    COUNT(*)::INTEGER,
    array_agg(id)
  INTO v_approved_count, v_empresa_ids
  FROM inserted;
  
  -- Atualizar status dos prospects
  UPDATE qualified_prospects
  SET 
    pipeline_status = 'approved',
    approved_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND job_id = p_job_id
    AND grade = ANY(p_grades);
  
  RETURN QUERY SELECT v_approved_count, v_empresa_ids;
END;
$$;
```

---

## 6. RLS POLICIES

### 6.1 Template de Policy

```sql
-- Template para todas as tabelas multi-tenant
CREATE POLICY "Users can view their tenant data"
  ON table_name
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their tenant data"
  ON table_name
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant data"
  ON table_name
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );
```

---

## 7. ORDEM DE IMPLEMENTAÇÃO

### Semana 1-2: Fundação
1. ✅ Criar migrations de onboarding
2. ✅ Criar migrations de ICP
3. ✅ Implementar OnboardingWizard básico
4. ✅ Edge Function analyze-onboarding-icp

### Semana 3-4: Qualificação
1. ✅ Criar migrations de qualificação
2. ✅ Implementar QualificationEnginePage
3. ✅ Edge Function process-qualification-job-sniper
4. ✅ Sistema de grades

### Semana 5-6: Gestão de Leads
1. ✅ Criar migrations de leads/quarentena
2. ✅ Implementar QualifiedProspectsStock
3. ✅ Página de Gerenciar Empresas
4. ✅ Sistema de Quarentena

### Semana 7-8: ICP Completo
1. ✅ Implementar ICPDetail com 7 abas
2. ✅ Componentes de cada aba
3. ✅ Análise competitiva
4. ✅ Relatórios

### Semana 9-10: Pipeline
1. ✅ Criar migrations de pipeline
2. ✅ Implementar Pipeline de Vendas
3. ✅ Sequências Comerciais

### Semana 11-12: Refinamentos
1. ✅ Empresas similares
2. ✅ Empresas descartadas
3. ✅ Otimizações
4. ✅ Testes

---

**Fim do Plano de Implementação**



