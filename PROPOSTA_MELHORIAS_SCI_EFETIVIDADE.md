# 🚀 PROPOSTA: MELHORIAS PARA EFETIVIDADE DO SCI (Strategic Commercial Intelligence)

## 🚨 PROBLEMA ATUAL IDENTIFICADO

### **Situação:**
- ❌ Relatório retorna **0 evidências** mesmo após buscar 47 fontes globais
- ❌ Classificação simplista: `evidencias.length > 0 ? 'warm_prospect' : 'cold_lead'`
- ❌ **Não há critérios objetivos** para classificação hot/warm/cold
- ❌ Product Fit Analysis está apenas com placeholder (50% fixo)
- ❌ **Não explica** por que a empresa foi classificada como cold/warm/hot
- ❌ Buscas genéricas (`site:{portal} "{companyName}"`) não capturam sinais de vendas
- ❌ Não foca em critérios relevantes para **dealers/distribuidores/importadores**

### **Resultado:**
- Relatório **não agrega valor** comercial
- Classificação **sem transparência** (usuário não entende o "porquê")
- **Falsa sensação de completude** (47 fontes consultadas mas 0 insights)

---

## 📊 ANÁLISE: COMO PLATAFORMAS B2B CLASSIFICAM LEADS

### **1. LinkedIn Sales Navigator**

**Critérios Hot Lead:**
- ✅ **Expansion signals:** Novos escritórios, aquisições, funding rounds
- ✅ **Hiring signals:** Contratações em massa (>10 vagas) para posições estratégicas
- ✅ **Procurement signals:** RFP publicado, busca por fornecedores, budget aprovado
- ✅ **Engagement signals:** Visualização de perfil, interação com conteúdo
- ✅ **Company growth:** Aumento de receita >20%, expansão internacional

**Critérios Warm Lead:**
- ✅ Sinais moderados de expansão (1-2 escritórios novos)
- ✅ Contratações pontuais (3-5 vagas relevantes)
- ✅ Menções em notícias de parcerias ou joint ventures
- ✅ Crescimento moderado (<20%)

**Critérios Cold Lead:**
- ❌ Sem sinais de expansão nos últimos 6 meses
- ❌ Sem contratações relevantes
- ❌ Sem menções recentes em notícias
- ❌ Estabilidade ou retração

### **2. Apollo.io**

**Critérios Hot Lead:**
- ✅ **Intent signals:** Pesquisa por produtos/serviços específicos (via Bombora/6sense)
- ✅ **Tech signals:** Mudança de stack tecnológico, adoção de novas ferramentas
- ✅ **Job signals:** Vagas para posições relacionadas ao produto
- ✅ **News signals:** Anúncios de expansão, aquisições, parcerias

**Scoring Formula:**
```
Lead Score = (
  Company Fit × 30% +
  Intent Signals × 25% +
  Engagement × 20% +
  Growth Signals × 15% +
  Tech Fit × 10%
)
```

### **3. ZoomInfo**

**Critérios Hot Lead:**
- ✅ **Trigger events:** Aquisições, IPOs, mudanças de liderança
- ✅ **Budget availability:** Aumento de budget, novos projetos aprovados
- ✅ **Timing:** Ciclo de compra em fase de decisão
- ✅ **Authority:** Decisor identificado e engajado

---

## 🎯 PROPOSTA: CRITÉRIOS DE CLASSIFICAÇÃO PARA OLV TRADE INTELLIGENCE

### **Foco: Dealers, Distribuidores e Importadores Globais**

#### **🔥 HOT LEAD (Score 75-100)**

**Sinais Obrigatórios (pelo menos 2):**
1. ✅ **Expansion Signal:** 
   - Novo escritório/filial aberto (últimos 3 meses)
   - Aquisição de concorrente ou empresa complementar
   - Anúncio de expansão internacional
   - Funding round ou investimento recebido

2. ✅ **Procurement Signal:**
   - RFP/Request for Proposal publicado (para produtos relacionados)
   - Vagas para "Purchasing Manager", "Supply Chain Director", "Procurement Specialist"
   - Anúncio de busca por fornecedores/parceiros
   - Menção de "looking for suppliers" ou "seeking distributors"

3. ✅ **Product Fit Signal:**
   - Product Fit Score ≥ 70% (alto alinhamento com catálogo do tenant)
   - Empresa menciona necessidade de produtos similares
   - Análise de website mostra interesse em produtos do tenant
   - Histórico de importação/exportação de produtos relacionados (via Panjiva - futuro)

4. ✅ **Growth Signal:**
   - Contratações em massa (>10 vagas) nos últimos 3 meses
   - Aumento de receita anunciado (>20%)
   - Expansão de linha de produtos
   - Parcerias estratégicas anunciadas

**Classificação:**
- **Score ≥ 75:** Hot Lead
- **Confidence:** High (se ≥3 sinais) ou Medium (se 2 sinais)
- **Timeline:** 30-60 dias
- **Recomendação:** "🔥 ABORDAR HOJE - Oportunidade de alto valor com sinais claros de compra"

---

#### **🟡 WARM LEAD (Score 40-74)**

**Sinais Moderados (pelo menos 2):**
1. ✅ **Moderate Expansion:**
   - 1 escritório novo (últimos 6 meses)
   - Pequenas aquisições ou joint ventures
   - Investimento moderado

2. ✅ **Moderate Procurement:**
   - 2-5 vagas para posições relacionadas (últimos 6 meses)
   - Menções de "evaluating suppliers" ou "reviewing partnerships"
   - Eventos de networking ou feiras do setor

3. ✅ **Moderate Product Fit:**
   - Product Fit Score 40-69%
   - Empresa opera em setor relacionado
   - Potencial de necessidade não confirmada

4. ✅ **Moderate Growth:**
   - Contratações pontuais (3-10 vagas)
   - Crescimento moderado (<20%)
   - Estabilidade com sinais de expansão futura

**Classificação:**
- **Score 40-74:** Warm Lead
- **Confidence:** Medium
- **Timeline:** 60-90 dias
- **Recomendação:** "🟡 ABORDAR ESTA SEMANA - Oportunidade válida com abordagem estruturada"

---

#### **🔵 COLD LEAD (Score 0-39)**

**Características:**
- ❌ Sem sinais de expansão (últimos 12 meses)
- ❌ Sem contratações relevantes
- ❌ Sem menções em notícias
- ❌ Product Fit Score < 40%
- ❌ Sem sinais de procurement
- ❌ Estabilidade ou retração

**Classificação:**
- **Score < 40:** Cold Lead
- **Confidence:** Low
- **Timeline:** 90-180 dias+
- **Recomendação:** "🔵 NUTRIÇÃO/SEGUIMENTO - Manter no radar, focar em educação e relacionamento"

---

## 🔍 PROPOSTA: MELHORIAS NAS BUSCAS SERPER

### **Problema Atual:**
```typescript
queryTemplate: `site:{portal} "{companyName}"`
```
**Resultado:** Busca genérica que retorna notícias/posts sobre a empresa, mas **não captura sinais de vendas**.

### **Solução: Buscas Específicas por Tipo de Sinal**

#### **1. Expansion Signals (Queries Específicas)**
```typescript
const EXPANSION_QUERIES = [
  `"${companyName}" opening new office OR expanding to`,
  `"${companyName}" acquired OR acquisition OR merger`,
  `"${companyName}" funding round OR investment received`,
  `"${companyName}" new location OR new branch`,
  `"${companyName}" international expansion OR global expansion`,
  `"${companyName}" strategic partnership OR joint venture`
];
```

#### **2. Procurement Signals (Queries Específicas)**
```typescript
const PROCUREMENT_QUERIES = [
  `"${companyName}" RFP OR "request for proposal" OR tender OR bid`,
  `"${companyName}" seeking supplier OR looking for vendor`,
  `"${companyName}" "purchasing manager" OR "procurement specialist" hiring`,
  `"${companyName}" need for equipment OR seeking distributor`,
  `"${companyName}" "supply chain" expansion OR "logistics" expansion`
];
```

#### **3. Hiring Signals (Queries Específicas)**
```typescript
const HIRING_QUERIES = [
  `"${companyName}" hiring 10+ OR "mass hiring" OR "hiring spree"`,
  `"${companyName}" "supply chain director" OR "purchasing manager" OR "procurement" job`,
  `"${companyName}" warehouse OR logistics OR distribution hiring`,
  `"${companyName}" international sales OR export manager hiring`
];
```

#### **4. Product Fit Signals (Queries Específicas)**
```typescript
// Buscar menções de necessidades que se alinham com produtos do tenant
const PRODUCT_FIT_QUERIES = (tenantProducts: string[]) => [
  ...tenantProducts.map(product => `"${companyName}" "${product}" OR "${product.toLowerCase()}"`),
  `"${companyName}" distributor OR dealer OR importer`,
  `"${companyName}" "looking for" OR "seeking" OR "need for" products`,
  `"${companyName}" B2B OR wholesale OR trade OR import OR export`
];
```

---

## 📦 PROPOSTA: PRODUCT FIT ANALYSIS REAL

### **Problema Atual:**
```typescript
match_score: 50, // Placeholder
fit_score: 50, // Placeholder
```

### **Solução: Análise Baseada em Critérios Objetivos**

#### **1. Industry Alignment (0-30 pontos)**
```typescript
function calculateIndustryFit(
  companyIndustry: string,
  productIndustries: string[]
): number {
  // Se empresa está em setor alvo do produto: 30pts
  // Se setor relacionado: 15pts
  // Se setor não relacionado: 0pts
}
```

#### **2. Company Size Fit (0-20 pontos)**
```typescript
function calculateSizeFit(
  companySize: string,
  productTargetSize: string[]
): number {
  // Se tamanho da empresa está no target do produto: 20pts
  // Se está próximo: 10pts
  // Se não está no target: 0pts
}
```

#### **3. Product Category Match (0-30 pontos)**
```typescript
function calculateCategoryMatch(
  companyNeeds: string[],
  productCategories: string[]
): number {
  // Análise de website/descrição da empresa vs categorias de produtos
  // Keywords matching: "equipment", "machinery", "components", etc.
  // Score baseado em overlap de keywords
}
```

#### **4. Geographic Fit (0-10 pontos)**
```typescript
function calculateGeographicFit(
  companyLocation: string,
  productRegions: string[]
): number {
  // Se empresa está em região onde tenant vende: 10pts
  // Se região próxima: 5pts
  // Se região distante: 0pts
}
```

#### **5. Business Model Fit (0-10 pontos)**
```typescript
function calculateBusinessModelFit(
  companyType: string, // dealer, distributor, importer, manufacturer
  productDistributionModel: string
): number {
  // Se empresa é dealer e produto é para dealers: 10pts
  // Se é distribuidor e produto precisa de distribuição: 10pts
  // Etc.
}
```

**Total Product Fit Score = Soma dos 5 critérios (0-100)**

---

## 🎯 PROPOSTA: ESTRUTURA DE CLASSIFICAÇÃO E EXPLICAÇÃO

### **Resposta Melhorada da Edge Function:**

```typescript
interface SCIResult {
  // 1. CLASSIFICAÇÃO PRINCIPAL
  classification: {
    status: 'hot' | 'warm' | 'cold',
    score: number, // 0-100
    confidence: 'high' | 'medium' | 'low',
    explanation: string, // EXPLICAÇÃO CLARA DO PORQUÊ
    signals_detected: {
      expansion: SignalDetail[],
      procurement: SignalDetail[],
      hiring: SignalDetail[],
      product_fit: SignalDetail[],
      growth: SignalDetail[]
    },
    timeline_to_close: '30_days' | '60_days' | '90_days' | '120_days' | '180_days+',
    recommendation: string // AÇÃO RECOMENDADA
  },

  // 2. COMPANY HEALTH SCORE (MELHORADO)
  company_health: {
    overall_score: number,
    activity_score: number, // Baseado em sinais recentes
    growth_score: number, // Baseado em crescimento
    stability_score: number, // Baseado em estabilidade
    international_score: number, // Baseado em presença internacional
    explanation: string // EXPLICAÇÃO DE CADA SCORE
  },

  // 3. EXPANSION SIGNALS (EXTRAÍDO DAS EVIDÊNCIAS)
  expansion_signals: {
    detected: boolean,
    signals: ExpansionSignal[],
    evidence: Evidence[],
    explanation: string // O QUE FOI ENCONTRADO E POR QUE IMPORTA
  },

  // 4. PROCUREMENT READINESS (EXTRAÍDO DAS EVIDÊNCIAS)
  procurement_readiness: {
    detected: boolean,
    signals: ProcurementSignal[],
    evidence: Evidence[],
    budget_confidence: 'high' | 'medium' | 'low',
    explanation: string // SINAIS DE COMPRA DETECTADOS
  },

  // 5. PRODUCT FIT ANALYSIS (REAL)
  product_fit: {
    overall_score: number, // 0-100
    matching_products: ProductMatch[],
    breakdown: {
      industry_fit: { score: number, explanation: string },
      size_fit: { score: number, explanation: string },
      category_match: { score: number, explanation: string },
      geographic_fit: { score: number, explanation: string },
      business_model_fit: { score: number, explanation: string }
    },
    recommendations: string[],
    explanation: string // POR QUE ESTE FIT SCORE
  },

  // 6. DEALER/DISTRIBUTOR SPECIFIC ANALYSIS
  dealer_analysis: {
    is_dealer: boolean,
    is_distributor: boolean,
    is_importer: boolean,
    business_model: string,
    current_suppliers: string[], // Se detectado
    distribution_reach: string, // Regional, nacional, internacional
    potential_value: number, // Estimativa de deal size
    explanation: string
  },

  // Metadata
  analyzed_at: string,
  sources_checked: number,
  total_evidences: number,
  evidences: Evidence[],
  execution_time: string
}
```

---

## 🔧 IMPLEMENTAÇÃO: MELHORIAS PRIORITÁRIAS

### **FASE 1: CRITÉRIOS DE CLASSIFICAÇÃO (SEMANA 1)**
1. ✅ Implementar lógica de classificação baseada em sinais
2. ✅ Criar funções para extrair sinais das evidências
3. ✅ Adicionar explicações para cada classificação
4. ✅ Testar com empresas reais

### **FASE 2: BUSCAS ESPECÍFICAS (SEMANA 2)**
1. ✅ Implementar queries específicas por tipo de sinal
2. ✅ Adicionar filtros de data (últimos 3-6 meses)
3. ✅ Priorizar fontes de alta confiabilidade (Bloomberg, Reuters, etc.)
4. ✅ Testar efetividade das novas queries

### **FASE 3: PRODUCT FIT ANALYSIS (SEMANA 3)**
1. ✅ Implementar cálculo real de Product Fit Score
2. ✅ Integrar análise de website da empresa
3. ✅ Comparar com catálogo do tenant
4. ✅ Gerar recomendações baseadas em fit

### **FASE 4: DEALER ANALYSIS (SEMANA 4)**
1. ✅ Detectar se empresa é dealer/distribuidor/importer
2. ✅ Analisar modelo de negócio
3. ✅ Estimar potencial de deal
4. ✅ Recomendações específicas para dealers

---

## 📋 EXEMPLO DE RESULTADO ESPERADO

### **Antes (Atual):**
```json
{
  "status": "cold_lead",
  "confidence": "low",
  "evidences": [],
  "sources_checked": 47
}
```
**Problema:** Não explica por que é cold, não há insights.

### **Depois (Proposto):**
```json
{
  "classification": {
    "status": "warm",
    "score": 58,
    "confidence": "medium",
    "explanation": "Empresa classificada como WARM devido a: (1) 3 vagas para 'Supply Chain Manager' nos últimos 6 meses (LinkedIn), (2) Menção de 'expansão de linha de produtos' em notícia do Bloomberg, (3) Product Fit Score de 65% (empresa é distribuidor e precisa de produtos do tenant). Recomendação: Abordar esta semana com proposta focada em supply chain.",
    "signals_detected": {
      "hiring": [
        {
          "type": "supply_chain_manager",
          "count": 3,
          "source": "linkedin.com/jobs",
          "url": "...",
          "relevance": "high"
        }
      ],
      "growth": [
        {
          "type": "product_expansion",
          "description": "Anúncio de expansão de linha de produtos",
          "source": "bloomberg.com",
          "url": "...",
          "relevance": "medium"
        }
      ],
      "product_fit": [
        {
          "type": "business_model_match",
          "description": "Empresa é distribuidor, produto do tenant é para distribuidores",
          "score": 65,
          "relevance": "high"
        }
      ]
    },
    "timeline_to_close": "60_days",
    "recommendation": "🟡 ABORDAR ESTA SEMANA - Oportunidade válida com sinais de crescimento e fit de produto"
  },
  "product_fit": {
    "overall_score": 65,
    "explanation": "Product Fit Score de 65%: (1) Industry Fit: 25/30 (empresa está em setor alvo), (2) Size Fit: 20/20 (tamanho correto), (3) Category Match: 15/30 (parcial), (4) Geographic Fit: 5/10 (região próxima), (5) Business Model Fit: 10/10 (distribuidor perfeito).",
    "matching_products": [
      {
        "product_id": "123",
        "product_name": "Equipment X",
        "match_score": 78,
        "fit_reasons": [
          "Empresa distribui produtos similares",
          "Tamanho da empresa ideal para este produto",
          "Região atendida pelo tenant"
        ],
        "estimated_quantity": "10-20 units/year",
        "estimated_value": "$50,000-100,000/year"
      }
    ]
  }
}
```
**Resultado:** Explicação clara, insights acionáveis, recomendações específicas.

---

## ✅ PRÓXIMOS PASSOS

1. **Aprovar proposta** de melhorias
2. **Implementar FASE 1** (Critérios de Classificação)
3. **Testar com empresas reais** (dealers/distribuidores)
4. **Iterar** baseado em feedback
5. **Implementar FASES 2-4** progressivamente

---

**Esta proposta transforma o SCI de um "relatório vazio" em uma ferramenta de inteligência comercial verdadeiramente efetiva, com explicações claras, insights acionáveis e recomendações específicas baseadas em dados reais.**
