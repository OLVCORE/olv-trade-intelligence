# 🗺️ MAPEAMENTO COMPLETO DE CORRELAÇÕES: PROSPECT → TRADE

## 📋 SUMÁRIO EXECUTIVO

Este documento mapeia **TODAS** as correlações, conexões, funções RPC, Edge Functions, triggers e fluxos de dados entre as tabelas do projeto **Stratevo Prospect** para implementação segura no **OLV Trade Intelligence**, **SEM** alterar os módulos protegidos.

---

## 🎯 OBJETIVO

Entender **100%** do fluxo completo do Prospect (5 etapas) e adaptar para o Trade, garantindo:
- ✅ Todas as conexões funcionando
- ✅ Sem hardcoded
- ✅ Tudo dinâmico e interativo
- ✅ Todas as abas correspondentes
- ✅ Zero impacto nos módulos protegidos

---

## 📊 AS 5 ETAPAS DO FLUXO PROSPECT

### **ETAPA 1: PROSPECTING CANDIDATES** (Entrada de Dados)
**Tabela Principal:** `prospecting_candidates`

**Fluxo:**
```
CSV/Excel/API → prospecting_candidates → process_qualification_job_sniper() → qualified_prospects
```

**Correlações:**
- `prospecting_candidates.tenant_id` → `tenants.id`
- `prospecting_candidates.icp_id` → `icp_profiles_metadata.id`
- `prospecting_candidates.source_batch_id` → Agrupa por lote

**Funções RPC:**
- `process_qualification_job_sniper(p_job_id, p_tenant_id)` - Processa candidatos em lote

**Edge Functions:**
- Nenhuma (processamento via RPC)

**Triggers:**
- Nenhum direto (processamento manual via RPC)

---

### **ETAPA 2: QUALIFIED PROSPECTS** (Motor de Qualificação)
**Tabela Principal:** `qualified_prospects`

**Fluxo:**
```
qualified_prospects → approve_prospects_bulk() → empresas (quarentena)
```

**Correlações:**
- `qualified_prospects.tenant_id` → `tenants.id`
- `qualified_prospects.job_id` → `prospect_qualification_jobs.id`
- `qualified_prospects.icp_id` → `icp_profiles_metadata.id` (opcional)
- `qualified_prospects.company_id` → `companies.id` (após enriquecimento)

**Funções RPC:**
- `approve_prospects_bulk(p_tenant_id, p_job_id, p_grades[])` - Aprova em massa
- `discard_prospects_bulk(p_tenant_id, p_job_id, p_grades[], p_reason)` - Descarta em massa
- `update_job_statistics()` - Atualiza estatísticas do job (trigger)

**Triggers:**
- `trigger_update_job_stats` - Atualiza `prospect_qualification_jobs` quando `qualified_prospects` muda
- `trigger_scan_website_on_qualified_prospect_insert` - Escaneia website automaticamente
- `trigger_scan_website_on_qualified_prospect_update` - Re-escaneia se website mudar

**Colunas Críticas:**
- `fit_score` (0-100) - Score de fit com ICP
- `grade` ('A+', 'A', 'B', 'C', 'D') - Grade baseada no fit_score
- `pipeline_status` ('new', 'approved', 'in_base', 'in_quarantine', 'discarded')
- `product_similarity_score`, `sector_fit_score`, `capital_fit_score`, `geo_fit_score`, `maturity_score`
- `website_fit_score` - Score baseado em produtos encontrados no website
- `purchase_intent_score` - Score de intenção de compra
- `purchase_intent_type` - Tipo: 'hybrid', 'ai', 'manual'

---

### **ETAPA 3: LEADS QUARANTINE** (Quarentena ICP)
**Tabela Principal:** `leads_quarantine`

**Fluxo:**
```
qualified_prospects (approved) → empresas → leads_quarantine → approve_quarantine_to_crm() → companies + leads + deals
```

**Correlações:**
- `leads_quarantine.tenant_id` → `tenants.id`
- `leads_quarantine.company_id` → `companies.id` (após criação)
- `leads_quarantine.icp_id` → `icp_profiles_metadata.id`

**Funções RPC:**
- `approve_quarantine_to_crm(p_quarantine_id, p_tenant_id)` - Aprova e cria deal automaticamente

**Triggers:**
- `trigger_recalculate_purchase_intent_on_quarantine()` - Recalcula purchase intent quando aprovado

**Colunas Críticas:**
- `validation_status` ('pending', 'approved', 'rejected')
- `review_status` ('pending', 'approved', 'rejected')
- `icp_score` - Score de fit com ICP
- `temperatura` ('hot', 'warm', 'cold')

---

### **ETAPA 4: LEADS APPROVED** (Base de Empresas)
**Tabela Principal:** `companies` (pública)

**Fluxo:**
```
leads_quarantine (approved) → companies → deals (auto-criado)
```

**Correlações:**
- `companies.tenant_id` → `tenants.id`
- `companies.id` → `deals.company_id` (deal vinculado à empresa)
- `companies.id` → `leads.company_id` (se houver lead)

**Funções RPC:**
- `calculate_purchase_intent_for_prospect(p_tenant_id, p_cnpj, p_company_id)` - Calcula purchase intent
- `calculate_purchase_intent_batch(p_tenant_id)` - Calcula em lote
- `scan_website_for_prospect(p_tenant_id, p_cnpj)` - Escaneia website
- `scan_websites_batch(p_tenant_id)` - Escaneia em lote

**Triggers:**
- `trigger_recalculate_purchase_intent_on_approval()` - Recalcula quando aprovado
- `trigger_recalculate_purchase_intent_on_website_enrichment()` - Recalcula quando website é enriquecido

**Colunas Críticas:**
- `purchase_intent_score` - Score de intenção de compra
- `purchase_intent_type` - Tipo: 'hybrid', 'ai', 'manual'
- `website_fit_score` - Score baseado em produtos no website
- `website_products_match` - Array de produtos compatíveis

---

### **ETAPA 5: PIPELINE DE VENDAS** (Deals)
**Tabela Principal:** `deals`

**Fluxo:**
```
companies → deals (auto-criado) → sales_pipeline_stages → sales_deal_activities
```

**Correlações:**
- `deals.tenant_id` → `tenants.id`
- `deals.company_id` → `companies.id` (SEMPRE - permite deal sem lead)
- `deals.lead_id` → `leads.id` (opcional - pode ser NULL)
- `deals.assigned_to` → `auth.users.id`
- `deals.stage` → `sales_pipeline_stages.key`

**Funções RPC:**
- `auto_handoff_sdr_to_seller(p_deal_id)` - Transfere deal do SDR para vendedor
- `update_deal_revenue_score(p_tenant_id)` - Atualiza score de receita
- `update_deal_risk_score(p_tenant_id)` - Atualiza score de risco

**Triggers:**
- `trigger_log_deal_stage_change()` - Loga mudança de stage
- `trigger_auto_create_contract()` - Cria contrato quando deal é ganho
- `trigger_auto_handoff_on_qualification()` - Transfere automaticamente quando atinge "qualification"

**Colunas Críticas:**
- `stage` - Estágio atual do pipeline
- `status` ('open', 'won', 'lost', 'abandoned')
- `probability` (0-100)
- `value` - Valor do deal
- `company_id` - **CRÍTICO**: Permite deal sem lead

---

## 🔗 CORRELAÇÕES ENTRE TABELAS (GRAFO COMPLETO)

### **NÚCLEO MULTI-TENANT:**
```
tenants (1) ←→ (N) users
tenants (1) ←→ (N) icp_profiles_metadata
tenants (1) ←→ (N) workspaces (TRADE)
```

### **FLUXO DE QUALIFICAÇÃO:**
```
prospecting_candidates
  ↓ (process_qualification_job_sniper)
prospect_qualification_jobs
  ↓ (processamento)
qualified_prospects
  ↓ (approve_prospects_bulk)
empresas (schema do tenant)
  ↓ (auto-insert)
leads_quarantine
  ↓ (approve_quarantine_to_crm)
companies (pública)
  ↓ (auto-create)
deals
```

### **ICP E QUALIFICAÇÃO:**
```
icp_profiles_metadata (1) ←→ (N) prospecting_candidates
icp_profiles_metadata (1) ←→ (N) qualified_prospects
icp_profiles_metadata (1) ←→ (N) leads_quarantine
```

### **COMPANIES E DEALS:**
```
companies (1) ←→ (N) deals
companies (1) ←→ (N) leads (opcional)
companies (1) ←→ (N) decision_makers
```

### **DEALS E PIPELINE:**
```
deals (N) ←→ (1) sales_pipeline_stages (via stage key)
deals (1) ←→ (N) sales_deal_activities
deals (1) ←→ (N) smart_tasks
deals (1) ←→ (N) email_sequences (via trigger)
```

---

## 📦 TABELAS DO PROSPECT (COMPLETO)

### **1. TABELAS PÚBLICAS (Multi-Tenant)**

#### `tenants`
- **Relacionamentos:**
  - `id` → `users.tenant_id`
  - `id` → `icp_profiles_metadata.tenant_id`
  - `id` → `prospecting_candidates.tenant_id`
  - `id` → `qualified_prospects.tenant_id`
  - `id` → `leads_quarantine.tenant_id`
  - `id` → `companies.tenant_id`
  - `id` → `deals.tenant_id`

#### `users`
- **Relacionamentos:**
  - `id` → `auth.users.id` (FK)
  - `tenant_id` → `tenants.id`
  - `id` → `deals.assigned_to`
  - `id` → `smart_tasks.assigned_to`

#### `icp_profiles_metadata`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `icp_profile_id` → `{schema_tenant}.icp_profile.id` (sem FK - referência dinâmica)
  - `id` → `prospecting_candidates.icp_id`
  - `id` → `qualified_prospects.icp_id`
  - `id` → `leads_quarantine.icp_id`

#### `onboarding_sessions`
- **Relacionamentos:**
  - `user_id` → `users.id`
  - `tenant_id` → `tenants.id`
  - Usado para gerar ICPs automaticamente

---

### **2. TABELAS DE PROSPECÇÃO**

#### `prospecting_candidates`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `icp_id` → `icp_profiles_metadata.id`
- **Status:** 'pending', 'processing', 'processed', 'failed'
- **Source:** 'EMPRESAS_AQUI', 'APOLLO', 'PHANTOMBUSTER', 'GOOGLE_SHEETS', 'MANUAL'

#### `prospect_qualification_jobs`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `icp_id` → `icp_profiles_metadata.id` (opcional)
  - `id` → `qualified_prospects.job_id`
- **Status:** 'pending', 'processing', 'completed', 'failed'
- **Estatísticas:** `total_cnpjs`, `processed_count`, `grade_a_plus`, `grade_a`, etc.

#### `qualified_prospects`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `job_id` → `prospect_qualification_jobs.id`
  - `icp_id` → `icp_profiles_metadata.id` (opcional)
  - `company_id` → `companies.id` (após enriquecimento)
- **Pipeline Status:** 'new', 'approved', 'in_base', 'in_quarantine', 'discarded'
- **Scores:** `fit_score`, `grade`, `product_similarity_score`, `sector_fit_score`, etc.

#### `prospect_extracted_products`
- **Relacionamentos:**
  - `qualified_prospect_id` → `qualified_prospects.id`
- Armazena produtos extraídos do website

---

### **3. TABELAS DE QUARENTENA E APROVAÇÃO**

#### `leads_quarantine`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `company_id` → `companies.id` (após criação)
  - `icp_id` → `icp_profiles_metadata.id`
- **Validation Status:** 'pending', 'approved', 'rejected'
- **Review Status:** 'pending', 'approved', 'rejected'

#### `companies` (pública)
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `id` → `deals.company_id`
  - `id` → `leads.company_id` (opcional)
  - `id` → `decision_makers.company_id`
- **Colunas Adicionais (Prospect):**
  - `purchase_intent_score`
  - `purchase_intent_type`
  - `website_fit_score`
  - `website_products_match`
  - `website_encontrado`
  - `linkedin_url`

---

### **4. TABELAS DE PIPELINE E VENDAS**

#### `deals`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `company_id` → `companies.id` (**CRÍTICO** - permite deal sem lead)
  - `lead_id` → `leads.id` (opcional)
  - `assigned_to` → `auth.users.id`
  - `stage` → `sales_pipeline_stages.key` (via tenant_id)
- **Status:** 'open', 'won', 'lost', 'abandoned'
- **Stage:** 'prospect', 'qualification', 'proposal', 'negotiation', 'contract', 'delivered', 'lost'

#### `sales_pipeline_stages`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `key` → `deals.stage` (via tenant_id)
- Customizável por tenant

#### `sales_deal_activities`
- **Relacionamentos:**
  - `deal_id` → `deals.id`
  - `created_by` → `auth.users.id`
- Histórico completo de atividades

#### `smart_tasks`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `deal_id` → `deals.id`
  - `assigned_to` → `auth.users.id`
- Tarefas inteligentes com IA

#### `email_sequences`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `created_by` → `auth.users.id`
- Sequências de email automatizadas

#### `email_sequence_steps`
- **Relacionamentos:**
  - `sequence_id` → `email_sequences.id`
- Steps das sequências

#### `sales_automations`
- **Relacionamentos:**
  - `tenant_id` → `tenants.id`
  - `created_by` → `auth.users.id`
- Workflows automatizados

---

## 🔧 FUNÇÕES RPC (COMPLETO)

### **QUALIFICAÇÃO:**

#### `process_qualification_job_sniper(p_job_id, p_tenant_id)`
- **Input:** Job ID, Tenant ID
- **Processo:**
  1. Busca `prospecting_candidates` com `status = 'pending'`
  2. Para cada candidato:
     - Enriquece dados (ReceitaWS, Apollo, Serper)
     - Calcula fit_score baseado no ICP
     - Determina grade (A+, A, B, C, D)
     - Insere em `qualified_prospects`
  3. Atualiza estatísticas do job
- **Output:** Estatísticas do processamento

#### `approve_prospects_bulk(p_tenant_id, p_job_id, p_grades[])`
- **Input:** Tenant ID, Job ID, Array de grades (ex: ['A+', 'A'])
- **Processo:**
  1. Busca `qualified_prospects` com `pipeline_status = 'new'` e `grade IN p_grades`
  2. Insere em `empresas` (schema do tenant) com `status = 'pending_review'`
  3. Atualiza `qualified_prospects.pipeline_status = 'approved'`
- **Output:** Contagem de aprovados, Array de IDs de empresas

#### `discard_prospects_bulk(p_tenant_id, p_job_id, p_grades[], p_reason)`
- **Input:** Tenant ID, Job ID, Array de grades, Razão
- **Processo:**
  1. Atualiza `qualified_prospects.pipeline_status = 'discarded'`
  2. Define `discarded_at` e `discard_reason`
- **Output:** Contagem de descartados

---

### **QUARENTENA:**

#### `approve_quarantine_to_crm(p_quarantine_id, p_tenant_id)`
- **Input:** Quarantine ID, Tenant ID
- **Processo:**
  1. Busca `leads_quarantine` com `validation_status = 'pending'`
  2. Cria/atualiza `companies` (pública)
  3. Cria `leads` (se houver email/telefone)
  4. **SEMPRE cria `deals`** (mesmo sem lead, vinculado à empresa)
  5. Atualiza `leads_quarantine.validation_status = 'approved'`
- **Output:** `empresa_id`, `lead_id`, `deal_id`, `success`, `message`

---

### **PURCHASE INTENT:**

#### `calculate_purchase_intent_for_prospect(p_tenant_id, p_cnpj, p_company_id)`
- **Input:** Tenant ID, CNPJ, Company ID
- **Processo:**
  1. Busca dados da empresa em `qualified_prospects` ou `companies`
  2. Calcula scores:
     - Similaridade com clientes existentes
     - Uso de produtos concorrentes
     - Timing de mercado
     - Website fit score
  3. Retorna score híbrido (AI + Manual)
- **Output:** JSONB com `purchase_intent_score`, `purchase_intent_type`, `signals`

#### `calculate_purchase_intent_batch(p_tenant_id)`
- **Input:** Tenant ID
- **Processo:** Calcula purchase intent para todos os prospects do tenant
- **Output:** Estatísticas do processamento

---

### **WEBSITE SCANNING:**

#### `scan_website_for_prospect(p_tenant_id, p_cnpj)`
- **Input:** Tenant ID, CNPJ
- **Processo:**
  1. Busca website da empresa
  2. Escaneia produtos no website
  3. Compara com catálogo do tenant
  4. Calcula `website_fit_score`
  5. Atualiza `qualified_prospects` ou `companies`
- **Output:** JSONB com `website_fit_score`, `products_match`, `website_encontrado`

#### `scan_websites_batch(p_tenant_id)`
- **Input:** Tenant ID
- **Processo:** Escaneia websites de todos os prospects do tenant
- **Output:** Estatísticas do processamento

---

### **PIPELINE:**

#### `auto_handoff_sdr_to_seller(p_deal_id)`
- **Input:** Deal ID
- **Processo:**
  1. Verifica se deal está em stage "qualification"
  2. Busca vendedor com menos deals ativos
  3. Atualiza `deals.assigned_to`
  4. Cria registro em `deal_handoffs`
- **Output:** Novo `assigned_to`, `handoff_id`

---

## ⚡ TRIGGERS (COMPLETO)

### **QUALIFIED_PROSPECTS:**

#### `trigger_update_job_stats`
- **Evento:** `AFTER INSERT OR UPDATE ON qualified_prospects`
- **Ação:** Atualiza estatísticas em `prospect_qualification_jobs`:
  - `processed_count`
  - `grade_a_plus`, `grade_a`, `grade_b`, `grade_c`, `grade_d`
  - `progress_percentage`

#### `trigger_scan_website_on_qualified_prospect_insert`
- **Evento:** `AFTER INSERT ON qualified_prospects`
- **Ação:** Chama `scan_website_for_prospect()` automaticamente

#### `trigger_scan_website_on_qualified_prospect_update`
- **Evento:** `AFTER UPDATE OF website, website_encontrado ON qualified_prospects`
- **Ação:** Re-escaneia website se URL mudar

#### `trigger_recalculate_purchase_intent_on_website_enrichment`
- **Evento:** `AFTER UPDATE OF website_fit_score ON qualified_prospects`
- **Ação:** Recalcula purchase intent quando website é enriquecido

---

### **LEADS_QUARANTINE:**

#### `trigger_recalculate_purchase_intent_on_quarantine`
- **Evento:** `AFTER UPDATE OF validation_status ON leads_quarantine`
- **Ação:** Recalcula purchase intent quando aprovado

---

### **COMPANIES:**

#### `trigger_recalculate_purchase_intent_on_approval`
- **Evento:** `AFTER INSERT ON companies`
- **Ação:** Recalcula purchase intent quando empresa é criada

#### `trigger_recalculate_purchase_intent_on_website_enrichment`
- **Evento:** `AFTER UPDATE OF website_fit_score ON companies`
- **Ação:** Recalcula purchase intent quando website é enriquecido

---

### **DEALS:**

#### `trigger_log_deal_stage_change`
- **Evento:** `BEFORE UPDATE ON deals`
- **Ação:** Loga mudança de stage em `sales_deal_activities`

#### `trigger_auto_create_contract`
- **Evento:** `AFTER UPDATE ON deals`
- **Ação:** Cria contrato quando `status = 'won'`

#### `trigger_auto_handoff_on_qualification`
- **Evento:** `AFTER UPDATE OF stage ON deals`
- **Ação:** Transfere deal do SDR para vendedor quando `stage = 'qualification'`

---

## 🎨 ADAPTAÇÃO PARA TRADE (SEM QUEBRAR MÓDULOS PROTEGIDOS)

### **MÓDULOS PROTEGIDOS (NÃO TOCAR):**
1. ✅ `tenant_products` (Catálogo de Produtos)
2. ✅ `workspaces` (Configurações)
3. ✅ Export Dealers (B2B) - Edge Function `discover-dealers-b2b`
4. ✅ Global Targets - Edge Function `discover-companies-global`
5. ✅ Commercial Proposals - Tabela `commercial_proposals`
6. ✅ Contracts - Tabela `dealer_contracts`
7. ✅ Dealer Portal - Páginas do portal

---

### **ESTRUTURA ATUAL DO TRADE:**

#### **Tabelas Existentes:**
- `tenants` ✅ (já existe)
- `users` ✅ (já existe)
- `companies` ✅ (já existe)
- `workspaces` ✅ (já existe)
- `tenant_products` ✅ (já existe - **PROTEGIDO**)
- `sales_deals` ✅ (já existe)
- `sales_pipeline_stages` ✅ (já existe)
- `sales_deal_activities` ✅ (já existe)
- `email_sequences` ✅ (já existe)
- `smart_tasks` ✅ (já existe)

#### **Tabelas FALTANTES (do Prospect):**
- ❌ `icp_profiles_metadata`
- ❌ `onboarding_sessions`
- ❌ `prospecting_candidates`
- ❌ `prospect_qualification_jobs`
- ❌ `qualified_prospects`
- ❌ `leads_quarantine`
- ❌ `prospect_extracted_products`
- ❌ `deal_handoffs`

---

### **PLANO DE IMPLEMENTAÇÃO (MICROCICLOS):**

#### **MICROCICLO 1: Onboarding e ICP**
**Objetivo:** Criar sistema de onboarding com 6 etapas e múltiplos ICPs

**Tabelas a Criar:**
- `icp_profiles_metadata`
- `onboarding_sessions`
- `icp_generation_counters`

**Funções RPC:**
- `create_icp_profile(...)`
- `generate_icps_from_onboarding(...)`

**Páginas React:**
- `/tenant-onboarding` (6 etapas)
- `/central-icp` (lista de ICPs)
- `/central-icp/profile/:id` (7 abas)

**Impacto:** ✅ ZERO nos módulos protegidos

---

#### **MICROCICLO 2: Motor de Qualificação**
**Objetivo:** Criar sistema de qualificação em lote

**Tabelas a Criar:**
- `prospecting_candidates`
- `prospect_qualification_jobs`
- `qualified_prospects`
- `prospect_extracted_products`

**Funções RPC:**
- `process_qualification_job_sniper(...)`
- `approve_prospects_bulk(...)`
- `discard_prospects_bulk(...)`
- `update_job_statistics()` (trigger)

**Edge Functions:**
- Nenhuma (usa motores existentes do Trade)

**Páginas React:**
- `/leads/qualification-engine` (upload e processamento)
- `/leads/qualified-stock` (visualização)

**Triggers:**
- `trigger_update_job_stats`
- `trigger_scan_website_on_qualified_prospect_insert`
- `trigger_scan_website_on_qualified_prospect_update`

**Impacto:** ✅ ZERO nos módulos protegidos (usa `companies` existente)

---

#### **MICROCICLO 3: Quarentena e Aprovação**
**Objetivo:** Criar sistema de quarentena e aprovação para Base de Empresas

**Tabelas a Criar:**
- `leads_quarantine`

**Funções RPC:**
- `approve_quarantine_to_crm(...)`

**Páginas React:**
- `/leads/quarantine` (melhorar página existente)

**Triggers:**
- `trigger_recalculate_purchase_intent_on_quarantine`

**Impacto:** ✅ ZERO nos módulos protegidos (usa `companies` e `sales_deals` existentes)

---

#### **MICROCICLO 4: Purchase Intent e Website Scanning**
**Objetivo:** Adicionar scores de purchase intent e website fit

**Colunas a Adicionar (em `companies`):**
- `purchase_intent_score` (ADD COLUMN IF NOT EXISTS)
- `purchase_intent_type` (ADD COLUMN IF NOT EXISTS)
- `website_fit_score` (ADD COLUMN IF NOT EXISTS)
- `website_products_match` (ADD COLUMN IF NOT EXISTS)
- `website_encontrado` (ADD COLUMN IF NOT EXISTS)
- `linkedin_url` (ADD COLUMN IF NOT EXISTS)

**Funções RPC:**
- `calculate_purchase_intent_for_prospect(...)`
- `calculate_purchase_intent_batch(...)`
- `scan_website_for_prospect(...)`
- `scan_websites_batch(...)`

**Triggers:**
- `trigger_recalculate_purchase_intent_on_approval`
- `trigger_recalculate_purchase_intent_on_website_enrichment`

**Impacto:** ✅ ZERO nos módulos protegidos (apenas adiciona colunas)

---

#### **MICROCICLO 5: Pipeline Avançado e Handoffs**
**Objetivo:** Adicionar handoffs automáticos e melhorias no pipeline

**Tabelas a Criar:**
- `deal_handoffs`

**Colunas a Adicionar (em `sales_deals`):**
- `company_id` (ADD COLUMN IF NOT EXISTS) - **CRÍTICO**: Permite deal sem lead

**Funções RPC:**
- `auto_handoff_sdr_to_seller(...)`

**Triggers:**
- `trigger_auto_handoff_on_qualification`

**Páginas React:**
- `/leads/pipeline` (melhorar página existente)

**Impacto:** ✅ ZERO nos módulos protegidos (apenas adiciona coluna e funcionalidade)

---

#### **MICROCICLO 6: Análise Competitiva**
**Objetivo:** Adicionar abas de análise competitiva no ICP

**Tabelas a Criar:**
- Nenhuma (usa dados existentes)

**Páginas React:**
- `/central-icp/profile/:id` → Aba "Competitiva" com sub-abas:
  - Visão Geral
  - Concorrentes (8)
  - Comparação Produtos
  - Descobrir Novos
  - Análise de Mercado
  - Análise CEO

**Impacto:** ✅ ZERO nos módulos protegidos (apenas visualização)

---

#### **MICROCICLO 7: Empresas Similares e Descartadas**
**Objetivo:** Adicionar funcionalidades de empresas similares e descartadas

**Tabelas a Criar:**
- Nenhuma (usa `similar_companies` existente)

**Páginas React:**
- `/leads/similar-companies` (melhorar página existente)
- `/leads/discarded` (nova página)

**Impacto:** ✅ ZERO nos módulos protegidos (usa tabela existente)

---

## ✅ VALIDAÇÃO DE CONEXÕES

### **CHECKLIST DE VALIDAÇÃO:**

#### **1. Multi-Tenancy:**
- [ ] Todas as tabelas têm `tenant_id`
- [ ] RLS policies aplicadas em todas as tabelas
- [ ] Funções RPC verificam `tenant_id`

#### **2. Foreign Keys:**
- [ ] Todas as FKs estão corretas
- [ ] ON DELETE CASCADE configurado corretamente
- [ ] Índices criados para todas as FKs

#### **3. Triggers:**
- [ ] Triggers não causam loops infinitos
- [ ] Triggers verificam `tenant_id`
- [ ] Triggers são idempotentes

#### **4. Funções RPC:**
- [ ] Todas as funções têm `SECURITY DEFINER`
- [ ] Todas as funções verificam `tenant_id`
- [ ] Todas as funções retornam valores consistentes

#### **5. Edge Functions:**
- [ ] Edge Functions usam motores existentes
- [ ] Edge Functions não modificam módulos protegidos
- [ ] Edge Functions têm tratamento de erros

#### **6. Páginas React:**
- [ ] Todas as páginas usam `tenant_id` do contexto
- [ ] Todas as páginas têm loading states
- [ ] Todas as páginas têm error handling

---

## 🚨 GARANTIAS DE SEGURANÇA

### **1. Isolamento Total:**
- ✅ Novas tabelas não alteram existentes
- ✅ Novas colunas usam `ADD COLUMN IF NOT EXISTS`
- ✅ Novas rotas não alteram existentes

### **2. Compatibilidade:**
- ✅ Dados existentes continuam funcionando
- ✅ Valores default compatíveis
- ✅ Migrations são idempotentes

### **3. Testes:**
- ✅ Testar cada microciclo isoladamente
- ✅ Testar fluxo completo end-to-end
- ✅ Testar com dados reais

---

## 📝 PRÓXIMOS PASSOS

1. **Revisar este documento** com a equipe
2. **Validar correlações** com o banco atual
3. **Criar migrations** para cada microciclo
4. **Implementar funções RPC** uma por uma
5. **Criar páginas React** seguindo o padrão existente
6. **Testar cada microciclo** antes de avançar
7. **Documentar** cada implementação

---

## 🎯 CONCLUSÃO

Este documento mapeia **100%** das correlações, conexões e fluxos do Prospect. A implementação será feita em **7 microciclos**, garantindo **ZERO impacto** nos módulos protegidos.

**Tudo será dinâmico, interativo e conectado, sem hardcoded.**



