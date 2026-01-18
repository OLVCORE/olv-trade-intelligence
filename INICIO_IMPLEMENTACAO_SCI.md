# 🚀 INÍCIO DA IMPLEMENTAÇÃO SCI

## ✅ FASE 1: Criação da Edge Function

### **Arquivos a Criar:**

1. `supabase/functions/strategic-intelligence-check/index.ts`
   - Baseado em `simple-totvs-check/index.ts`
   - Adaptado para mercado internacional
   - 47 fontes globais calibradas
   - Integração com `tenant_products`

2. `supabase/functions/strategic-intelligence-check/deno.json`
   - Configuração Deno

---

## 📋 ESTRUTURA DA NOVA EDGE FUNCTION

### **1. Fontes Globais (47 fontes)**

```typescript
// GRUPO 1: JOB PORTALS (8 fontes)
const GLOBAL_JOB_PORTALS = [
  'linkedin.com/jobs',
  'linkedin.com/posts',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'seek.com',
  'reed.co.uk'
];

// GRUPO 2: FONTES OFICIAIS (10 fontes)
const GLOBAL_OFFICIAL_SOURCES = [
  'sec.gov',
  'edgar.sec.gov',
  'companieshouse.gov.uk',
  'beta.companieshouse.gov.uk',
  'registry.companieshouse.gov.uk',
  'asic.gov.au',
  'companies-register.govt.nz',
  'www.sedar.com',
  'opencorporates.com'
];

// GRUPO 3: NOTÍCIAS & FINANCEIRAS (12 fontes)
const GLOBAL_NEWS_SOURCES = [
  'bloomberg.com',
  'reuters.com',
  'ft.com',
  'wsj.com',
  'techcrunch.com',
  'forbes.com',
  'bbc.com/news/business',
  'economist.com',
  'cnbc.com',
  'marketwatch.com',
  'businessinsider.com',
  'venturebeat.com'
];

// GRUPO 4: PORTALS TECH (8 fontes)
const GLOBAL_TECH_PORTALS = [
  'cio.com',
  'zdnet.com',
  'crn.com',
  'computerworld.com',
  'techrepublic.com',
  'infoworld.com',
  'enterprisetech.com',
  'diginomica.com'
];

// GRUPO 5: VÍDEO & CONTEÚDO (3 fontes)
const GLOBAL_VIDEO_SOURCES = [
  'youtube.com',
  'vimeo.com',
  'slideshare.net'
];

// GRUPO 6: REDES SOCIAIS B2B (3 fontes)
const GLOBAL_SOCIAL_SOURCES = [
  'twitter.com',
  'crunchbase.com',
  'reddit.com/r/business'
];

// GRUPO 7: BUSINESS INTELLIGENCE (3 fontes)
const GLOBAL_BI_SOURCES = [
  'pitchbook.com',
  'cbinsights.com',
  'angellist.com'
];
```

### **2. Queries Adaptadas (sem TOTVS)**

```typescript
// Company Health Queries
const COMPANY_HEALTH_QUERIES = [
  `"${companyName}" opening new office`,
  `"${companyName}" expanding to`,
  `"${companyName}" hiring 50+ employees`,
  `"${companyName}" bankruptcy OR closing`,
  `"${companyName}" acquired OR merger`,
  `"${companyName}" financial results`,
  `"${companyName}" annual report`
];

// Expansion Signals Queries
const EXPANSION_SIGNALS_QUERIES = [
  `"${companyName}" funding round`,
  `"${companyName}" strategic partnership`,
  `"${companyName}" joint venture`,
  `"${companyName}" new location`,
  `"${companyName}" expansion announcement`,
  `"${companyName}" investment received`
];

// Procurement Readiness Queries
const PROCUREMENT_QUERIES = [
  `"${companyName}" budget approved for`,
  `"${companyName}" RFP procurement`,
  `"${companyName}" seeking supplier`,
  `"${companyName}" need for equipment`,
  `"${companyName}" looking for vendor`,
  `"${companyName}" tender OR bid`
];
```

### **3. Product Fit Analysis (tenant_products)**

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

## 📝 PRÓXIMOS PASSOS

### **Agora:**
1. ✅ Criar estrutura básica da edge function
2. ✅ Implementar 47 fontes globais
3. ✅ Adaptar queries para internacional

### **Depois:**
4. Integrar tenant_products
5. Estrutura pronta para APIs futuras (comentadas)
6. Testes

---

**Status:** 🚧 Iniciando implementação...
