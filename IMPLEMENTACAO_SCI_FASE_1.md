# 🚀 IMPLEMENTAÇÃO SCI - FASE 1: Estrutura Base com Serper

## 📋 DECISÕES TOMADAS

### **1. Catálogo Exportável:**
✅ Confirmado: É o catálogo do tenant (`tenant_products`)

### **2. APIs Ativas:**
✅ **Apenas Serper API** (47 fontes mantidas, adaptadas para internacional)
❌ **Panjiva API:** Estrutura pronta, desabilitada até contrato MetaLife
❌ **Crunchbase API:** Estrutura pronta, desabilitada até contrato MetaLife
❌ **SimilarWeb API:** Estrutura pronta, desabilitada até contrato MetaLife

### **3. Nomenclatura:**
- **Componente:** SCI (Strategic Commercial Intelligence)
- **Relatório:** Dossiê Estratégico de Prospecção Internacional
- **Edge Function:** `strategic-intelligence-check`

---

## 🔧 ESTRUTURA DA NOVA EDGE FUNCTION

### **Arquivos a Criar:**
```
supabase/functions/strategic-intelligence-check/
├── index.ts (função principal)
└── deno.json (configuração)
```

### **Estrutura de Resposta:**
```typescript
interface StrategicIntelligenceResult {
  // 1. Company Health Score
  company_health: {
    overall_score: number, // 0-100
    activity_score: number,
    growth_score: number,
    stability_score: number,
    international_score: number
  },
  
  // 2. Expansion Signals
  expansion_signals: {
    new_offices: Array<{...}>,
    mass_hiring: {...},
    partnerships: Array<{...}>,
    funding_rounds: Array<{...}>
  },
  
  // 3. Procurement Readiness
  procurement_readiness: {
    budget_signals: {...},
    rfp_opportunities: Array<{...}>,
    expressed_needs: Array<{...}>
  },
  
  // 4. International Trade (DESABILITADO - estrutura pronta)
  international_trade?: {
    // Estrutura pronta para Panjiva
    enabled: false,
    note: "Aguardando contrato MetaLife"
  },
  
  // 5. Product Fit Analysis
  product_fit: {
    tenant_catalog_products: Array<{...}>, // Do tenant_products
    matching_products: Array<{...}>,
    fit_score: number // 0-100
  },
  
  // Status final
  status: 'hot_lead' | 'warm_prospect' | 'cold_lead' | 'not_viable',
  confidence: number, // 0-100
  recommendation: string,
  estimated_revenue_potential: number,
  timeline_to_close: string
}
```

---

## 📊 QUERIES SERPER ADAPTADAS (47 fontes)

### **Remover:**
❌ Queries específicas de TOTVS
❌ Validação de produtos TOTVS

### **Adicionar (para mercado internacional):**

#### **1. Company Health:**
```
"{company_name} opening new office"
"{company_name} expanding to"
"{company_name} hiring 50+ employees"
"{company_name} bankruptcy"
"{company_name} closing"
"{company_name} acquired"
```

#### **2. Expansion Signals:**
```
"{company_name} funding round"
"{company_name} strategic partnership"
"{company_name} joint venture"
"{company_name} new location"
"{company_name} expansion"
```

#### **3. Procurement Readiness:**
```
"{company_name} budget approved for"
"{company_name} RFP procurement"
"{company_name} seeking supplier"
"{company_name} need for equipment"
"{company_name} looking for vendor"
```

#### **4. International Trade (estrutura pronta, dados mockados):**
```
// Estrutura pronta, mas retorna dados mockados até Panjiva
// "Aguardando contrato MetaLife"
```

---

## 🔗 INTEGRAÇÃO COM TENANT PRODUCTS

### **Query para buscar catálogo do tenant:**
```typescript
const { data: tenantProducts } = await supabase
  .from('tenant_products')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
  .order('category', { ascending: true });
```

### **Product Fit Analysis:**
```typescript
// Comparar empresa (setor, porte, necessidades) com produtos do tenant
function calculateProductFit(company: Company, products: TenantProduct[]) {
  // Lógica de matching
  return {
    matching_products: [...],
    fit_score: number // 0-100
  };
}
```

---

## 🚧 ESTRUTURA PRONTA PARA APIs FUTURAS

### **Panjiva API (desabilitada):**
```typescript
// Estrutura pronta, mas comentada até contrato
// const panjivaData = await fetchPanjivaData(companyName);
// if (panjivaEnabled) {
//   result.international_trade = panjivaData;
// }
```

### **Crunchbase API (desabilitada):**
```typescript
// Estrutura pronta, mas comentada até contrato
// if (crunchbaseEnabled) {
//   result.expansion_signals.funding_rounds = await fetchCrunchbase(...);
// }
```

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Criar edge function `strategic-intelligence-check`
2. ✅ Adaptar queries Serper para internacional
3. ✅ Integrar `tenant_products` para Product Fit
4. ✅ Deixar estrutura pronta para outras APIs
5. ✅ Atualizar componentes frontend

---

**Status:** 🚧 Em implementação
