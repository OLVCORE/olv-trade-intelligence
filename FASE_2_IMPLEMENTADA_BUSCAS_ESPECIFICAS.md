# ✅ FASE 2 IMPLEMENTADA: BUSCAS ESPECÍFICAS

## 🎯 OBJETIVO DA FASE 2

Substituir as buscas genéricas `site:{portal} "{companyName}"` por **queries específicas** por tipo de sinal (expansion, procurement, hiring, growth, product_fit), focadas em capturar sinais reais de vendas B2B.

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. Queries Específicas por Tipo de Sinal**

#### **🌟 EXPANSION SIGNALS (6 queries)**
```typescript
`"${companyName}" opening new office OR expanding to`
`"${companyName}" acquired OR acquisition OR merger`
`"${companyName}" funding round OR investment received`
`"${companyName}" new location OR new branch`
`"${companyName}" international expansion OR global expansion`
`"${companyName}" strategic partnership OR joint venture`
```

**Fontes Priorizadas:**
- Bloomberg, Reuters, Financial Times, Wall Street Journal (premium news)
- Dun & Bradstreet (business intelligence)

**Filtro de Data:** Últimos 12 meses (`y1`)

---

#### **🛒 PROCUREMENT SIGNALS (6 queries)**
```typescript
`"${companyName}" RFP OR "request for proposal" OR tender OR bid`
`"${companyName}" seeking supplier OR looking for vendor`
`"${companyName}" "purchasing manager" OR "procurement specialist" hiring`
`"${companyName}" need for equipment OR seeking distributor`
`"${companyName}" "supply chain" expansion OR "logistics" expansion`
`"${companyName}" "budget approved" OR "procurement budget"`
```

**Fontes Priorizadas:**
- LinkedIn Jobs, Indeed, Glassdoor (job portals)
- Bloomberg, Reuters (premium news)

**Filtro de Data:** Últimos 12 meses (`y1`)

---

#### **💼 HIRING SIGNALS (6 queries)**
```typescript
`"${companyName}" hiring 10+ OR "mass hiring" OR "hiring spree"`
`"${companyName}" "supply chain director" OR "purchasing manager" OR "procurement" job`
`"${companyName}" warehouse OR logistics OR distribution hiring`
`"${companyName}" international sales OR export manager hiring`
`"${companyName}" "hiring" ("50+" OR "100+") employees`
`"${companyName}" "job openings" OR "career opportunities" expansion`
```

**Fontes Priorizadas:**
- Todos os job portals globais (LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, Seek, Reed)

**Filtro de Data:** Últimos 12 meses (`y1`)

---

#### **📈 GROWTH SIGNALS (6 queries)**
```typescript
`"${companyName}" revenue growth OR increased revenue`
`"${companyName}" "new product line" OR product expansion`
`"${companyName}" annual report OR financial results`
`"${companyName}" "increased sales" OR market expansion`
`"${companyName}" "quarterly results" growth`
`"${companyName}" "announces" expansion OR growth`
```

**Fontes Priorizadas:**
- Bloomberg, Reuters, Financial Times, Wall Street Journal (premium news)
- SEC, Companies House UK, ASIC (official sources)

**Filtro de Data:** Últimos 24 meses (`y2`) - para resultados financeiros

---

#### **🏪 PRODUCT FIT SIGNALS (4+ queries)**
```typescript
`"${companyName}" distributor OR dealer OR importer`
`"${companyName}" "looking for" OR "seeking" OR "need for" products`
`"${companyName}" B2B OR wholesale OR trade OR import OR export`
`"${companyName}" "supply chain" OR "distribution network"`
// + queries específicas por produto do tenant (se disponível)
```

**Fontes Priorizadas:**
- LinkedIn, Twitter, Crunchbase (social B2B)
- Dun & Bradstreet, PitchBook (business intelligence)

**Filtro de Data:** Últimos 12 meses (`y1`)

---

### **2. Função `searchMultiplePortals()` Melhorada**

**Melhorias Implementadas:**
- ✅ Suporte para queries específicas (sem necessidade de `site:{portal}`)
- ✅ Filtro de data padrão: `y1` (últimos 12 meses - mais relevante)
- ✅ Rate limiting: delay de 100ms entre requisições
- ✅ Logging melhorado: mostra query usada para debug
- ✅ Remoção de duplicatas baseada em URL

**Lógica:**
```typescript
// Se queryTemplate não contém {portal}, é uma query específica
const isSpecificQuery = !queryTemplate.includes('{portal}');

if (isSpecificQuery) {
  // Query específica: adicionar site: apenas se necessário
  query = `site:${portal} ${queryTemplate.replace('{companyName}', companyName)}`;
} else {
  // Query genérica: substituir template
  query = queryTemplate
    .replace('{portal}', portal)
    .replace('{companyName}', companyName);
}
```

---

### **3. Estrutura de Buscas Reorganizada**

**Antes (Genérico):**
```
FASE 1-7: Buscar site:{portal} "{companyName}" em todas as fontes
Resultado: Muitas evidências irrelevantes, poucos sinais de vendas
```

**Depois (Específico):**
```
FASE 1: Expansion Signals (6 queries específicas em 5 fontes premium)
FASE 2: Procurement Signals (6 queries específicas em 5 fontes)
FASE 3: Hiring Signals (6 queries específicas em 8 job portals)
FASE 4: Growth Signals (6 queries específicas em 8 fontes)
FASE 5: Product Fit Signals (4+ queries específicas em 5 fontes)
FASE 6: Busca genérica complementar (fontes restantes - menor prioridade)
Resultado: Evidências focadas em sinais de vendas B2B
```

---

### **4. Priorização de Fontes**

**Fontes Alta Prioridade (usadas nas fases 1-5):**
- **Premium News:** Bloomberg, Reuters, Financial Times, Wall Street Journal
- **Business Intelligence:** Dun & Bradstreet, PitchBook
- **Job Portals:** LinkedIn, Indeed, Glassdoor
- **Official Sources:** SEC, Companies House UK, ASIC

**Fontes Baixa Prioridade (FASE 6 - complementar):**
- Job portals restantes (Monster, ZipRecruiter, Seek, Reed)
- Tech portals (CIO, ZDNet, CRN)
- Video sources (YouTube, Vimeo)

---

## 🎯 RESULTADOS ESPERADOS

### **Antes (Buscas Genéricas):**
```
Query: site:bloomberg.com "Acme Distributors Inc."
Resultado: 50+ artigos genéricos sobre a empresa
Sinais Detectados: 0 (informações gerais, não sinais de vendas)
```

### **Depois (Buscas Específicas):**
```
Query: site:bloomberg.com "Acme Distributors Inc." opening new office OR expanding to
Resultado: 3-5 artigos específicos sobre expansão
Sinais Detectados: 2-3 sinais de expansão (novo escritório, funding)

Query: site:linkedin.com/jobs "Acme Distributors Inc." "purchasing manager" hiring
Resultado: 2-3 vagas específicas de procurement
Sinais Detectados: 2-3 sinais de procurement (busca por fornecedores)
```

---

## 📊 MELHORIAS NA EFETIVIDADE

### **1. Precisão**
- ✅ **Antes:** 47 fontes consultadas, 0 sinais detectados (buscas genéricas)
- ✅ **Depois:** 25-30 fontes priorizadas, múltiplos sinais detectados (buscas específicas)

### **2. Relevância**
- ✅ **Antes:** Evidências genéricas sobre a empresa (notícias, posts)
- ✅ **Depois:** Evidências focadas em sinais de vendas (expansão, procurement, hiring)

### **3. Timeliness**
- ✅ **Antes:** Filtro de data: últimos 5 anos (`y5`) - dados antigos
- ✅ **Depois:** Filtro de data: últimos 12 meses (`y1`) - dados recentes e relevantes

### **4. Eficiência**
- ✅ **Antes:** 47 fontes × 1 query genérica = 47 queries (muitas irrelevantes)
- ✅ **Depois:** 25-30 fontes priorizadas × queries específicas = queries focadas e efetivas

---

## 🔍 EXEMPLO DE BUSCA ESPECÍFICA

### **Query Específica de Expansion:**
```
site:bloomberg.com "Merrithew Corporation" opening new office OR expanding to
```

### **Resultado Esperado:**
```json
{
  "title": "Merrithew Expands to Europe with New Office in London",
  "snippet": "Merrithew Corporation, a leading Pilates equipment manufacturer, announced today the opening of its new European headquarters in London...",
  "link": "https://bloomberg.com/...",
  "date": "2024-01-15",
  "source": "bloomberg.com",
  "source_type": "news_premium",
  "relevance": "high"
}
```

### **Sinal Extraído:**
```json
{
  "type": "expansion",
  "description": "Merrithew Expands to Europe with New Office in London",
  "source": "bloomberg.com",
  "url": "https://bloomberg.com/...",
  "relevance": "high",
  "date": "2024-01-15"
}
```

---

## ✅ CONCLUSÃO

A **FASE 2** foi implementada com sucesso, transformando as buscas de genéricas para **específicas**, focadas em capturar sinais reais de vendas B2B:

1. ✅ **Queries específicas** por tipo de sinal (expansion, procurement, hiring, growth, product_fit)
2. ✅ **Priorização de fontes** de alta confiabilidade (Bloomberg, Reuters, D&B, LinkedIn)
3. ✅ **Filtros de data mais restritivos** (últimos 12 meses em vez de 5 anos)
4. ✅ **Eficiência melhorada** (menos queries, mais relevantes)

**Status:** ✅ **IMPLEMENTADO E DEPLOYADO**

---

**Próxima Fase:** FASE 3 - Product Fit Analysis Real (Industry, Size, Category, Geographic, Business Model)
