# 📋 PLANO DETALHADO DE IMPLEMENTAÇÃO SCI

## ✅ DECISÕES CONFIRMADAS

1. **Catálogo Exportável:** ✅ Confirmado - É `tenant_products` (catálogo do tenant)
2. **APIs Ativas:** ✅ Apenas Serper API (47 fontes)
3. **APIs Futuras:** ⏳ Estrutura pronta, desabilitadas até contrato MetaLife
4. **Nomenclatura:** SCI (Strategic Commercial Intelligence)

---

## 🎯 IMPLEMENTAÇÃO FASE 1 - ESTRUTURA BASE

### **1. Criar Edge Function `strategic-intelligence-check`**

**Localização:**
```
supabase/functions/strategic-intelligence-check/index.ts
```

**Base:**
- Copiar estrutura de `simple-totvs-check/index.ts`
- Remover todas as referências a TOTVS
- Adaptar queries Serper para mercado internacional
- Integrar `tenant_products` para Product Fit Analysis
- Estrutura pronta para APIs futuras (comentadas)

---

### **2. Queries Serper Adaptadas (47 fontes mantidas)**

#### **A. Company Health Queries:**
```typescript
const COMPANY_HEALTH_QUERIES = [
  `"${companyName}" opening new office`,
  `"${companyName}" expanding to`,
  `"${companyName}" hiring 50+ employees`,
  `"${companyName}" bankruptcy OR closing`,
  `"${companyName}" acquired OR merger`,
  `"${companyName}" financial results`,
  `"${companyName}" annual report`,
];
```

#### **B. Expansion Signals Queries:**
```typescript
const EXPANSION_SIGNALS_QUERIES = [
  `"${companyName}" funding round`,
  `"${companyName}" strategic partnership`,
  `"${companyName}" joint venture`,
  `"${companyName}" new location`,
  `"${companyName}" expansion announcement`,
  `"${companyName}" investment received`,
];
```

#### **C. Procurement Readiness Queries:**
```typescript
const PROCUREMENT_QUERIES = [
  `"${companyName}" budget approved for`,
  `"${companyName}" RFP procurement`,
  `"${companyName}" seeking supplier`,
  `"${companyName}" need for equipment`,
  `"${companyName}" looking for vendor`,
  `"${companyName}" tender OR bid`,
];
```

---

### **3. Integração com `tenant_products`**

**Query para buscar catálogo:**
```typescript
// Buscar produtos do tenant
const { data: tenantProducts } = await supabase
  .from('tenant_products')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
  .order('category', { ascending: true });

// Calcular Product Fit
function calculateProductFit(
  company: { industry?: string; size?: string; needs?: string[] },
  products: TenantProduct[]
): ProductFitResult {
  // Lógica de matching baseada em:
  // - Industry alignment
  // - Company size
  // - Expressed needs
  // - Product categories
  
  return {
    matching_products: [...],
    fit_score: number, // 0-100
    recommendations: [...]
  };
}
```

---

### **4. Estrutura de Resposta**

```typescript
interface StrategicIntelligenceResult {
  // 1. Company Health Score
  company_health: {
    overall_score: number, // 0-100
    activity_score: number,
    growth_score: number,
    stability_score: number,
    international_score: number,
    evidence: Array<{
      source: string,
      snippet: string,
      score: number
    }>
  },
  
  // 2. Expansion Signals
  expansion_signals: {
    detected: boolean,
    new_offices: Array<{
      location: string,
      country: string,
      date: string,
      source: string
    }>,
    mass_hiring: {
      detected: boolean,
      positions: string[],
      volume: number,
      source: string
    },
    partnerships: Array<{
      partner: string,
      type: string,
      date: string,
      source: string
    }>,
    funding_rounds: Array<{
      round: string,
      amount: number,
      investors: string[],
      date: string,
      source: string
    }>,
    evidence: Array<{...}>
  },
  
  // 3. Procurement Readiness
  procurement_readiness: {
    budget_signals: {
      detected: boolean,
      confidence: 'high' | 'medium' | 'low',
      evidence: string[]
    },
    rfp_opportunities: Array<{
      title: string,
      date: string,
      source: string,
      fit_score: number
    }>,
    expressed_needs: Array<{
      need: string,
      source: string,
      date: string,
      urgency: 'high' | 'medium' | 'low'
    }>,
    evidence: Array<{...}>
  },
  
  // 4. International Trade (ESTRUTURA PRONTA - DESABILITADA)
  international_trade?: {
    enabled: false,
    note: "Aguardando contrato MetaLife para ativar Panjiva API",
    // Estrutura pronta abaixo (comentada até contrato)
    // import_history: {...},
    // export_history: {...},
    // trade_patterns: {...}
  },
  
  // 5. Product Fit Analysis (INTEGRADO COM tenant_products)
  product_fit: {
    tenant_catalog_products: Array<{
      id: string,
      name: string,
      category: string,
      description: string
    }>,
    matching_products: Array<{
      product_id: string,
      product_name: string,
      match_score: number, // 0-100
      fit_reasons: string[],
      potential_quantity?: number,
      estimated_value?: number
    }>,
    fit_score: number, // 0-100 (consolidado)
    recommendations: string[]
  },
  
  // Status Final
  status: 'hot_lead' | 'warm_prospect' | 'cold_lead' | 'not_viable',
  confidence: number, // 0-100
  recommendation: string,
  estimated_revenue_potential: number,
  timeline_to_close: '30_days' | '60_days' | '90_days' | '120_days' | '180_days+',
  
  // Metadata
  analyzed_at: string,
  sources_checked: number, // 47 fontes Serper
  total_evidences: number
}
```

---

### **5. APIs Futuras (Estrutura Pronta - Desabilitadas)**

#### **A. Panjiva API (Comentada):**
```typescript
// ⏳ AGUARDANDO CONTRATO METALIFE
// if (DENO.env.get('PANJIVA_ENABLED') === 'true') {
//   const panjivaData = await fetchPanjivaData({
//     companyName,
//     apiKey: DENO.env.get('PANJIVA_API_KEY')
//   });
//   
//   result.international_trade = {
//     enabled: true,
//     import_history: panjivaData.imports,
//     export_history: panjivaData.exports,
//     trade_patterns: panjivaData.patterns
//   };
// } else {
//   result.international_trade = {
//     enabled: false,
//     note: "Aguardando contrato MetaLife"
//   };
// }
```

#### **B. Crunchbase API (Comentada):**
```typescript
// ⏳ AGUARDANDO CONTRATO METALIFE
// if (DENO.env.get('CRUNCHBASE_ENABLED') === 'true') {
//   const fundingData = await fetchCrunchbaseFunding({
//     companyName,
//     apiKey: DENO.env.get('CRUNCHBASE_API_KEY')
//   });
//   
//   result.expansion_signals.funding_rounds = fundingData;
// }
```

#### **C. SimilarWeb API (Comentada):**
```typescript
// ⏳ AGUARDANDO CONTRATO METALIFE
// if (DENO.env.get('SIMILARWEB_ENABLED') === 'true') {
//   const trafficData = await fetchSimilarWebTraffic({
//     domain,
//     apiKey: DENO.env.get('SIMILARWEB_API_KEY')
//   });
//   
//   result.digital_presence.traffic_by_country = trafficData;
// }
```

---

## 📝 ARQUIVOS A MODIFICAR/CRIAR

### **Novos:**
1. ✅ `supabase/functions/strategic-intelligence-check/index.ts`
2. ✅ `supabase/functions/strategic-intelligence-check/deno.json`

### **Modificar:**
1. ✅ `src/components/totvs/ProductAnalysisCard.tsx` → Renomear para `StrategicIntelligenceCard`
2. ✅ `src/components/intelligence/SimpleTOTVSCheckDialog.tsx` → Renomear para `StrategicIntelligenceDialog`
3. ✅ `src/hooks/useSimpleProductCheck.ts` → Adaptar para SCI
4. ✅ `src/components/icp/QuarantineRowActions.tsx` → Atualizar labels STC → SCI
5. ✅ Todos os componentes que usam `TOTVSCheckCard` → Atualizar para `StrategicIntelligenceCard`

---

## 🚀 PRÓXIMOS PASSOS

### **Semana 1-2: Estrutura Base**
- [ ] Criar edge function `strategic-intelligence-check`
- [ ] Adaptar queries Serper
- [ ] Integrar `tenant_products`
- [ ] Estrutura pronta para APIs futuras

### **Semana 3-4: Frontend**
- [ ] Renomear componentes
- [ ] Atualizar menus e labels
- [ ] Integrar nova edge function
- [ ] Testes

---

**Status:** 🚧 Pronto para iniciar implementação
