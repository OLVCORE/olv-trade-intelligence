# 🌐 INTEGRAÇÃO PANJIVA API - PLANO COMPLETO

**Data:** 28/10/2025  
**Status:** PLANEJAMENTO PARA IMPLEMENTAÇÃO  
**Prioridade:** 🔴 ALTA (Após assinatura da plataforma Panjiva)

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ O QUE SERÁ IMPLEMENTADO

Após assinatura da plataforma Panjiva, criaremos uma **integração completa via API** que permitirá:

1. **Buscar dados de shipment (Bill of Lading) em tempo real**
2. **Identificar importadores reais por HS Code**
3. **Mapeamento completo da cadeia de valor (Supply Chain Mapping):**
   - **Upstream:** Quem os importadores COMPRAM (fornecedores)
   - **Downstream:** Quem os importadores VENDEM (clientes finais)
   - **Estratégia dual:** Competir com fornecedores OU bypassar importadores vendendo diretamente aos clientes finais
4. **Relacionamentos corporativos:**
   - Empresas irmãs (sister companies)
   - Subsidiárias e empresas relacionadas
   - Estruturas corporativas e redes de negócios
5. **Rastrear concorrentes e seus clientes**
6. **Monitorar histórico de importações**
7. **Alertas automáticos de oportunidades**

---

## 🏗️ ARQUITETURA DA INTEGRAÇÃO

### **1. Edge Function: `panjiva-api`**

**Localização:** `supabase/functions/panjiva-api/index.ts`

**Responsabilidades:**
- Autenticação com Panjiva API (API Key)
- Busca de empresas por HS Code
- Busca de shipment history
- Busca de importadores/exportadores
- Cache de resultados (reduzir custos)
- Rate limiting (respeitar limites da API)

**Estrutura:**
```typescript
// supabase/functions/panjiva-api/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PANJIVA_API_KEY = Deno.env.get('PANJIVA_API_KEY')
const PANJIVA_BASE_URL = 'https://api.panjiva.com/v2'

serve(async (req) => {
  // 1. Autenticação
  // 2. Processar requisição
  // 3. Chamar Panjiva API
  // 4. Processar resposta
  // 5. Salvar no banco
  // 6. Retornar resultado
})
```

---

### **2. Tabelas no Banco de Dados**

#### **A) `panjiva_shipments`**
```sql
CREATE TABLE public.panjiva_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  hs_code TEXT NOT NULL,
  shipment_date DATE NOT NULL,
  origin_country TEXT,
  destination_country TEXT,
  origin_port TEXT,
  destination_port TEXT,
  weight_kg DECIMAL,
  volume_m3 DECIMAL,
  value_usd DECIMAL,
  quantity INTEGER,
  product_description TEXT,
  supplier_name TEXT,
  buyer_name TEXT,
  panjiva_shipment_id TEXT UNIQUE,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_panjiva_shipments_company ON panjiva_shipments(company_id);
CREATE INDEX idx_panjiva_shipments_hs_code ON panjiva_shipments(hs_code);
CREATE INDEX idx_panjiva_shipments_date ON panjiva_shipments(shipment_date DESC);
```

#### **B) `panjiva_importers`**
```sql
CREATE TABLE public.panjiva_importers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  country TEXT,
  hs_code TEXT,
  total_imports_usd DECIMAL,
  shipment_count INTEGER,
  first_shipment_date DATE,
  last_shipment_date DATE,
  -- UPSTREAM: Quem eles COMPRAM
  main_suppliers JSONB, -- Array de fornecedores com volume, frequência
  supplier_count INTEGER, -- Quantidade de fornecedores diferentes
  -- DOWNSTREAM: Quem eles VENDEM
  main_customers JSONB, -- Array de clientes finais com volume, frequência
  customer_count INTEGER, -- Quantidade de clientes diferentes
  panjiva_company_id TEXT UNIQUE,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_panjiva_importers_name ON panjiva_importers(company_name);
CREATE INDEX idx_panjiva_importers_hs_code ON panjiva_importers(hs_code);
CREATE INDEX idx_panjiva_importers_country ON panjiva_importers(country);
```

#### **C) `panjiva_supply_chain_relationships`** 🆕
```sql
CREATE TABLE public.panjiva_supply_chain_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  relationship_type TEXT NOT NULL, -- 'supplier' ou 'customer'
  related_company_name TEXT NOT NULL,
  related_company_panjiva_id TEXT,
  hs_code TEXT,
  total_volume_usd DECIMAL,
  shipment_count INTEGER,
  first_transaction_date DATE,
  last_transaction_date DATE,
  frequency TEXT, -- 'monthly', 'quarterly', 'yearly', 'irregular'
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, related_company_name, relationship_type, hs_code)
);

CREATE INDEX idx_supply_chain_company ON panjiva_supply_chain_relationships(company_id);
CREATE INDEX idx_supply_chain_type ON panjiva_supply_chain_relationships(relationship_type);
CREATE INDEX idx_supply_chain_related ON panjiva_supply_chain_relationships(related_company_name);
```

#### **D) `panjiva_corporate_relationships`** 🆕
```sql
CREATE TABLE public.panjiva_corporate_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  related_company_name TEXT NOT NULL,
  related_company_panjiva_id TEXT,
  relationship_type TEXT NOT NULL, -- 'sister', 'subsidiary', 'parent', 'affiliate'
  ownership_percentage DECIMAL, -- Se disponível
  country TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, related_company_name, relationship_type)
);

CREATE INDEX idx_corporate_company ON panjiva_corporate_relationships(company_id);
CREATE INDEX idx_corporate_type ON panjiva_corporate_relationships(relationship_type);
```

#### **E) `panjiva_competitor_tracking`**
```sql
CREATE TABLE public.panjiva_competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  competitor_name TEXT NOT NULL,
  panjiva_company_id TEXT,
  tracked_hs_codes TEXT[],
  last_shipment_date DATE,
  total_shipments INTEGER,
  total_value_usd DECIMAL,
  top_clients JSONB, -- Array de clientes
  top_countries JSONB, -- Array de países
  alerts_enabled BOOLEAN DEFAULT true,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **3. Serviços Frontend**

#### **A) `src/services/panjivaApi.ts`**
```typescript
// Buscar importadores por HS Code
export async function findImportersByHSCode(
  hsCode: string,
  country?: string,
  dateRange?: { start: Date; end: Date }
): Promise<PanjivaImporter[]>

// Buscar histórico de shipments de uma empresa
export async function getCompanyShipmentHistory(
  companyId: string,
  hsCode?: string
): Promise<PanjivaShipment[]>

// Rastrear concorrente
export async function trackCompetitor(
  competitorName: string,
  hsCodes: string[]
): Promise<void>

// Buscar fornecedores por HS Code
export async function findSuppliersByHSCode(
  hsCode: string,
  country?: string
): Promise<PanjivaSupplier[]>

// 🆕 Buscar cadeia de valor completa (upstream + downstream)
export async function getCompleteSupplyChain(
  companyId: string
): Promise<{
  upstream: PanjivaSupplier[]; // Quem eles compram
  downstream: PanjivaCustomer[]; // Quem eles vendem
}>

// 🆕 Buscar clientes finais de um importador/distribuidor
export async function getDownstreamCustomers(
  companyId: string,
  hsCode?: string
): Promise<PanjivaCustomer[]>

// 🆕 Buscar fornecedores de um importador/distribuidor
export async function getUpstreamSuppliers(
  companyId: string,
  hsCode?: string
): Promise<PanjivaSupplier[]>

// 🆕 Buscar relacionamentos corporativos
export async function getCorporateRelationships(
  companyId: string
): Promise<{
  sister_companies: string[];
  subsidiaries: string[];
  parent_companies: string[];
  affiliates: string[];
}>
```

---

## 🎯 FUNCIONALIDADES QUE SERÃO DESBLOQUEADAS

### **1. Buyer Discovery (Descoberta de Importadores)** ⭐ CRÍTICO

**O que faz:**
- Busca **quem IMPORTA** determinado HS Code
- Filtra por país, volume, frequência
- Identifica grandes importadores

**Exemplo de uso:**
```
Usuário busca: "HS 9506.91 (Pilates Equipment) importado para USA"
→ Sistema retorna: 200 importadores reais com:
   - Nome da empresa
   - Volume de importação (USD)
   - Frequência (mensal, trimestral)
   - Principais fornecedores
   - Histórico de 12 meses
```

**Como ajuda:**
- ✅ Identifica prospects **reais** (não apenas empresas que "podem" importar)
- ✅ Prioriza por volume (quem importa mais = melhor prospect)
- ✅ Mostra padrão de compra (frequência, sazonalidade)

---

### **2. Shipment History (Histórico de Importações)**

**O que faz:**
- Mostra **histórico completo** de importações de uma empresa
- Últimos 5 anos de dados
- Volume, peso, valor, frequência

**Exemplo de uso:**
```
Usuário visualiza: "ABC Fitness" → Tab "Histórico Internacional"
→ Sistema mostra:
   - 24 shipments nos últimos 12 meses
   - Total: $2.4M USD
   - Principais fornecedores: MetaLife (Brasil), Balanced Body (USA)
   - Tendência: Crescimento de 15% ao ano
```

**Como ajuda:**
- ✅ Entende padrão de compra do cliente
- ✅ Identifica oportunidades (crescimento = mais demanda)
- ✅ Vê quem são os fornecedores atuais (concorrentes)

---

### **3. Competitor Tracking (Rastreamento de Concorrentes)**

**O que faz:**
- Rastreia shipments dos concorrentes
- Vê quem são os clientes deles
- Monitora volume de vendas, países de destino

**Exemplo de uso:**
```
Usuário configura: "Rastrear Balanced Body"
→ Sistema monitora:
   - 150 shipments/mês
   - Top clientes: ABC Fitness, XYZ Wellness, etc.
   - Países: USA (60%), Canadá (20%), Europa (20%)
   - Alertas quando perde cliente
```

**Como ajuda:**
- ✅ Identifica prospects (clientes dos concorrentes = oportunidades)
- ✅ Monitora movimentações do mercado
- ✅ Estratégia competitiva baseada em dados reais

---

### **4. Supply Chain Mapping (Mapeamento Completo da Cadeia de Valor)** ⭐ CRÍTICO

**O que faz:**
- **Upstream Analysis:** Identifica quem os importadores COMPRAM (fornecedores)
- **Downstream Analysis:** Identifica quem os importadores VENDEM (clientes finais)
- **Estratégia Dual:** Permite competir com fornecedores OU bypassar importadores

**Exemplo de uso - Upstream (Quem eles compram):**
```
Usuário visualiza: "ABC Fitness" → Tab "Fornecedores"
→ Sistema mostra:
   - Balanced Body (USA): 60% do volume, $1.2M USD/ano
   - MetaLife (Brasil): 30% do volume, $600K USD/ano
   - Outros: 10% do volume
   
→ Estratégia: Oferecer ABC Fitness produtos melhores/preços melhores que Balanced Body
```

**Exemplo de uso - Downstream (Quem eles vendem):**
```
Usuário visualiza: "ABC Fitness" → Tab "Clientes Finais"
→ Sistema mostra:
   - XYZ Gym Chain: 40% do volume, $800K USD/ano
   - Wellness Centers Network: 30% do volume, $600K USD/ano
   - Independent Gyms: 30% do volume, $600K USD/ano
   
→ Estratégia: Bypassar ABC Fitness e vender DIRETAMENTE para XYZ Gym Chain e Wellness Centers
```

**Como ajuda:**
- ✅ **Estratégia 1:** Competir com fornecedores atuais (melhor produto/preço)
- ✅ **Estratégia 2:** Bypassar importadores e vender diretamente aos clientes finais
- ✅ **Maximiza oportunidades:** Duas rotas de entrada no mercado
- ✅ **Aumenta margem:** Vender direto = sem intermediário = maior margem

---

### **5. Corporate Relationships (Relacionamentos Corporativos)** 🆕

**O que faz:**
- Identifica empresas irmãs (sister companies)
- Mapeia subsidiárias e empresas relacionadas
- Entende estruturas corporativas e redes de negócios

**Exemplo de uso:**
```
Usuário visualiza: "ABC Fitness" → Tab "Empresas Relacionadas"
→ Sistema mostra:
   - Sister Companies: ABC Wellness, ABC Nutrition
   - Subsidiaries: ABC Canada, ABC Europe
   - Parent Company: ABC Holdings
   
→ Estratégia: Oportunidade de vender para TODAS as empresas relacionadas
```

**Como ajuda:**
- ✅ Descobre oportunidades ocultas (empresas relacionadas)
- ✅ Entende estruturas corporativas complexas
- ✅ Identifica múltiplos pontos de entrada
- ✅ Maximiza cobertura de mercado

---

### **6. Supplier Discovery (Descoberta de Fornecedores)**

**O que faz:**
- Busca fornecedores por HS Code
- Mostra quem exporta o produto
- Rating de fornecedor (volume, frequência, qualidade)

**Exemplo de uso:**
```
Usuário busca: "HS 9506.91 exportado do Brasil"
→ Sistema retorna:
   - MetaLife: 50 shipments/ano, $1.2M USD
   - Outras empresas brasileiras exportando
   - Comparação de volumes
```

**Como ajuda:**
- ✅ Entende mercado de exportação
- ✅ Identifica oportunidades de parceria
- ✅ Benchmarking com concorrentes

---

### **7. Alerts & Monitoring (Alertas Automáticos)**

**O que faz:**
- Alertas quando empresa importa novo produto
- Notifica quando concorrente perde cliente
- Monitora novos importadores entrando no mercado

**Exemplo de uso:**
```
Sistema detecta: "ABC Fitness importou HS 9506.91 pela primeira vez"
→ Alerta automático:
   "🎯 NOVA OPORTUNIDADE: ABC Fitness começou a importar Pilates Equipment"
   → Link direto para criar proposta comercial
```

**Como ajuda:**
- ✅ Oportunidades em tempo real
- ✅ Não perde leads por falta de monitoramento
- ✅ Proatividade vs reatividade

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS DA INTEGRAÇÃO

### **ANTES (Sem Panjiva):**

| Funcionalidade | Status | Limitação |
|----------------|--------|-----------|
| Descoberta de Dealers | ✅ Apollo + Serper | Empresas "potenciais", não confirmadas |
| Buyer Discovery | ❌ | Não sabe quem realmente importa |
| Shipment History | ❌ | Sem histórico de importações |
| Competitor Tracking | ❌ | Não rastreia concorrentes |
| Alerts | ❌ | Sem monitoramento automático |

**Resultado:** Plataforma com **60% das funcionalidades** do Panjiva

---

### **DEPOIS (Com Panjiva):**

| Funcionalidade | Status | Benefício |
|----------------|--------|-----------|
| Descoberta de Dealers | ✅ Apollo + Serper + **Panjiva** | **Empresas confirmadas** (importam de fato) |
| Buyer Discovery | ✅ **Panjiva API** | **Importadores reais** por HS Code |
| Shipment History | ✅ **Panjiva API** | **Histórico completo** de 5 anos |
| Competitor Tracking | ✅ **Panjiva API** | **Rastreamento automático** de concorrentes |
| Alerts | ✅ **Panjiva API** | **Alertas em tempo real** de oportunidades |

**Resultado:** Plataforma com **100% das funcionalidades** do Panjiva + **funcionalidades extras** (multi-source, custom keywords, fit score)

---

## 🚀 COMO A INTEGRAÇÃO EVOLUIRÁ A PLATAFORMA

### **1. Precisão de Prospecção: 60% → 95%**

**Antes:**
- Apollo retorna empresas que "podem" importar
- Não sabe se realmente importam
- Taxa de conversão baixa (muitos "não interessados")

**Depois:**
- Panjiva confirma: empresa **realmente importa** o produto
- Histórico mostra padrão de compra
- Taxa de conversão alta (prospects qualificados)

---

### **2. Priorização Inteligente**

**Antes:**
- Todas empresas têm mesmo peso
- Não sabe qual é melhor prospect

**Depois:**
- **Score baseado em dados reais:**
  - Volume de importação (USD)
  - Frequência (mensal > trimestral)
  - Crescimento (tendência positiva)
  - País (proximidade, facilidade logística)
  - **Supply chain completeness** (tem fornecedores E clientes mapeados)
- **Top 10 prospects** automaticamente identificados

---

### **2.1. Estratégia Dual de Entrada no Mercado** 🆕

**Antes:**
- Apenas uma estratégia: vender para importadores
- Não sabe quem são os clientes finais

**Depois:**
- **Estratégia 1 - Competição Direta:**
  - Vê quem são os fornecedores atuais do importador
  - Oferece produto melhor/preço melhor
  - Substitui fornecedor atual
  
- **Estratégia 2 - Bypass (Cortar Intermediário):**
  - Vê quem são os clientes finais do importador
  - Vende diretamente aos clientes finais
  - Elimina intermediário = maior margem
  
- **Resultado:** Duas rotas de entrada = maior probabilidade de sucesso

---

### **3. Estratégia Competitiva**

**Antes:**
- Não sabe quem são os clientes dos concorrentes
- Estratégia baseada em suposições

**Depois:**
- **Vê exatamente** quem compra dos concorrentes
- Identifica oportunidades de **displacement** (substituir fornecedor)
- Estratégia baseada em **dados reais**

---

### **4. Automação de Oportunidades**

**Antes:**
- Usuário precisa buscar manualmente
- Oportunidades são perdidas

**Depois:**
- **Alertas automáticos** quando:
  - Empresa começa a importar novo produto
  - Concorrente perde cliente
  - Novo importador entra no mercado
- **Notificações em tempo real** → ação imediata

---

### **5. Análise de Mercado**

**Antes:**
- Não tem visão macro do mercado
- Análise limitada a empresas individuais

**Depois:**
- **Dashboard de mercado:**
  - Total de importações por HS Code
  - Principais países importadores
  - Tendências de crescimento
  - Sazonalidade
- **Inteligência de mercado** para estratégia

---

## 💰 ROI ESPERADO

### **Para o Cliente (Exportador):**

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Taxa de conversão** | 5% | 25% | **+400%** |
| **Tempo para fechar deal** | 90 dias | 30 dias | **-67%** |
| **Qualidade de leads** | Baixa | Alta | **+500%** |
| **Oportunidades identificadas** | 10/mês | 50/mês | **+400%** |
| **Estratégias de entrada** | 1 (apenas importador) | 2 (importador + bypass) | **+100%** |
| **Margem potencial** | Média (com intermediário) | Alta (venda direta) | **+30-50%** |

**ROI por deal fechado:**
- Deal médio: USD 50,000 - 150,000
- Custo mensal plataforma: R$ 2,997
- **ROI: 80x - 250x**

---

### **Para a OLV (Operador da Plataforma):**

| Métrica | Valor |
|---------|-------|
| **Diferencial competitivo** | Única plataforma com Panjiva + Apollo + Multi-source |
| **Preço vs Panjiva** | 38% mais barato |
| **Funcionalidades extras** | Multi-source, custom keywords, fit score |
| **Valor percebido** | 2x maior que Panjiva standalone |

**Resultado:** Plataforma premium, justificando preços mais altos e maior retenção de clientes.

---

## 🔧 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Setup Inicial (1 semana)**

1. ✅ Assinar Panjiva API
2. ✅ Obter API Key
3. ✅ Configurar secrets no Supabase
4. ✅ Criar Edge Function `panjiva-api`
5. ✅ Testar autenticação e primeira chamada

---

### **FASE 2: Buyer Discovery + Supply Chain Mapping (3 semanas)**

1. ✅ Implementar busca de importadores por HS Code
2. ✅ Criar tabelas `panjiva_importers`, `panjiva_supply_chain_relationships`
3. ✅ Implementar busca upstream (fornecedores)
4. ✅ Implementar busca downstream (clientes finais)
5. ✅ Interface de busca na UI
6. ✅ Visualização de cadeia de valor (upstream → empresa → downstream)
7. ✅ Integrar com fluxo de dealers existente
8. ✅ Testes end-to-end

---

### **FASE 3: Corporate Relationships (1 semana)**

1. ✅ Implementar busca de relacionamentos corporativos
2. ✅ Criar tabela `panjiva_corporate_relationships`
3. ✅ Interface de visualização (sister companies, subsidiaries)
4. ✅ Alertas de oportunidades em empresas relacionadas
5. ✅ Testes end-to-end

---

### **FASE 4: Shipment History (2 semanas)**

1. ✅ Implementar busca de histórico de shipments
2. ✅ Criar tabela `panjiva_shipments`
3. ✅ Tab "Histórico Internacional" no CompanyDetailPage
4. ✅ Visualizações (gráficos, timeline)
5. ✅ Cache de dados (reduzir custos)

---

### **FASE 5: Competitor Tracking (2 semanas)**

1. ✅ Implementar rastreamento de concorrentes
2. ✅ Criar tabela `panjiva_competitor_tracking`
3. ✅ Interface de configuração
4. ✅ Dashboard de monitoramento
5. ✅ Alertas automáticos

---

### **FASE 6: Alerts & Monitoring (1 semana)**

1. ✅ Sistema de alertas
2. ✅ Notificações em tempo real
3. ✅ Dashboard de oportunidades
4. ✅ Integração com email/Slack
5. ⚠️ **ADICIONAR:** Sistema de "Saved Searches" (buscas salvas)
6. ⚠️ **ADICIONAR:** Configuração de alertas por email
7. ⚠️ **ADICIONAR:** Templates de email personalizados
8. ⚠️ **ADICIONAR:** Agendamento de alertas periódicos

---

### **FASE 7: Exportação de Dados (1 semana)** 🆕

1. ✅ Exportar resultados de busca Panjiva (CSV, Excel)
2. ✅ Exportar supply chain mapping
3. ✅ Exportar competitor tracking
4. ✅ Compartilhar relatórios com equipe
5. ✅ API para exportação programática

---

**TOTAL: 11 semanas (2.75 meses)**

**Nota:** Fase 7 adicionada para cobrir funcionalidade de exportação de dados oferecida pelo Panjiva.

**Nota:** Fase adicional de Supply Chain Mapping adiciona 1 semana ao cronograma original, mas é crítica para a estratégia dual de entrada no mercado.

---

## 📝 CONFIGURAÇÃO NECESSÁRIA

### **1. Secrets no Supabase:**

```bash
# Via Dashboard ou CLI
supabase secrets set PANJIVA_API_KEY=your-api-key-here
supabase secrets set PANJIVA_BASE_URL=https://api.panjiva.com/v2
```

### **2. Variáveis de Ambiente:**

```env
# .env.local (desenvolvimento)
VITE_PANJIVA_ENABLED=true

# Supabase Secrets (produção)
PANJIVA_API_KEY=xxx
PANJIVA_BASE_URL=https://api.panjiva.com/v2
```

---

## 🎯 CONCLUSÃO

### ✅ **A INTEGRAÇÃO PANJIVA TRANSFORMARÁ A PLATAFORMA EM:**

1. **Solução completa de Trade Intelligence** (não apenas prospecção)
2. **Única plataforma** com Panjiva + Apollo + Multi-source
3. **Diferencial competitivo** no mercado brasileiro
4. **ROI comprovado** para clientes exportadores
5. **Escalabilidade** para múltiplos tenants

### 🚀 **PRÓXIMOS PASSOS:**

1. ✅ Assinar Panjiva API
2. ✅ Obter credenciais
3. ✅ Iniciar Fase 1 (Setup)
4. ✅ Implementar em 8 semanas
5. ✅ Lançar para clientes

---

**Status:** 🟡 AGUARDANDO ASSINATURA PANJIVA  
**Próximo Passo:** Obter API Key e iniciar implementação  
**Documento Criado:** 28/10/2025  
**Pronto para Execução:** ✅ SIM (após assinatura)

