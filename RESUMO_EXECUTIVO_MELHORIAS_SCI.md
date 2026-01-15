# 📊 RESUMO EXECUTIVO: MELHORIAS PROPOSTAS PARA SCI

## 🎯 OBJETIVO

Transformar o "Dossiê Estratégico de Prospecção Internacional" de um relatório vazio (0 evidências) em uma ferramenta de inteligência comercial efetiva, com:

1. ✅ **Classificação objetiva** hot/warm/cold baseada em sinais reais
2. ✅ **Product Fit Analysis real** (comparação com catálogo do tenant)
3. ✅ **Explicações claras** do "porquê" de cada classificação
4. ✅ **Sinais acionáveis** para vendas B2B (expansão, procurement, hiring)
5. ✅ **Foco em dealers/distribuidores/importadores** (público-alvo do OLV)

---

## 🔍 PROBLEMA ATUAL

- ❌ **0 evidências** mesmo após buscar 47 fontes globais
- ❌ Classificação simplista: `evidencias.length > 0 ? 'warm' : 'cold'`
- ❌ **Sem explicação** do "porquê" da classificação
- ❌ Product Fit Score fixo em 50% (placeholder)
- ❌ Buscas genéricas não capturam sinais de vendas

---

## ✅ SOLUÇÃO PROPOSTA

### **1. Critérios de Classificação (Baseado em LinkedIn, Apollo, ZoomInfo)**

#### **🔥 HOT LEAD (Score 75-100)**
- ✅ **Expansion signals:** Novo escritório, aquisição, funding (últimos 3 meses)
- ✅ **Procurement signals:** RFP publicado, busca por fornecedores, vagas procurement
- ✅ **Product Fit Score ≥ 70%** (alto alinhamento com catálogo tenant)
- ✅ **Growth signals:** Contratações em massa (>10 vagas), receita +20%

#### **🟡 WARM LEAD (Score 40-74)**
- ✅ Sinais moderados de expansão (1-2 escritórios)
- ✅ 2-5 vagas relacionadas (últimos 6 meses)
- ✅ Product Fit Score 40-69%
- ✅ Crescimento moderado (<20%)

#### **🔵 COLD LEAD (Score 0-39)**
- ❌ Sem sinais de expansão (últimos 12 meses)
- ❌ Sem contratações relevantes
- ❌ Product Fit Score < 40%
- ❌ Estabilidade ou retração

---

### **2. Buscas Específicas (Não Mais Genéricas)**

**Antes:**
```typescript
site:{portal} "{companyName}"  // ❌ Genérico, não captura sinais
```

**Depois:**
```typescript
// Expansion
"${companyName}" opening new office OR expanding to
"${companyName}" acquired OR acquisition OR merger
"${companyName}" funding round OR investment received

// Procurement
"${companyName}" RFP OR "request for proposal" OR tender
"${companyName}" seeking supplier OR looking for vendor
"${companyName}" "purchasing manager" hiring

// Hiring
"${companyName}" hiring 10+ OR "mass hiring"
"${companyName}" "supply chain director" OR "procurement" job
```

---

### **3. Product Fit Analysis Real**

**Critérios de Cálculo (0-100):**
- **Industry Alignment:** 0-30pts (empresa no setor alvo do produto?)
- **Company Size Fit:** 0-20pts (tamanho ideal para o produto?)
- **Product Category Match:** 0-30pts (keywords matching com website)
- **Geographic Fit:** 0-10pts (região atendida pelo tenant?)
- **Business Model Fit:** 0-10pts (dealer/distribuidor/importer?)

**Resultado:**
```json
{
  "product_fit": {
    "overall_score": 65,
    "explanation": "Fit Score de 65%: (1) Industry: 25/30, (2) Size: 20/20, (3) Category: 15/30, (4) Geographic: 5/10, (5) Business Model: 10/10",
    "matching_products": [
      {
        "product_name": "Equipment X",
        "match_score": 78,
        "fit_reasons": ["Empresa distribui produtos similares", "Tamanho ideal"],
        "estimated_value": "$50,000-100,000/year"
      }
    ]
  }
}
```

---

### **4. Estrutura de Resposta Melhorada**

```json
{
  "classification": {
    "status": "warm",
    "score": 58,
    "confidence": "medium",
    "explanation": "Empresa classificada como WARM devido a: (1) 3 vagas para 'Supply Chain Manager' nos últimos 6 meses, (2) Menção de 'expansão de linha de produtos' no Bloomberg, (3) Product Fit Score de 65%. Recomendação: Abordar esta semana.",
    "signals_detected": {
      "hiring": [{ "type": "supply_chain_manager", "count": 3, "source": "linkedin.com" }],
      "growth": [{ "type": "product_expansion", "source": "bloomberg.com" }],
      "product_fit": [{ "type": "business_model_match", "score": 65 }]
    },
    "timeline_to_close": "60_days",
    "recommendation": "🟡 ABORDAR ESTA SEMANA - Oportunidade válida com sinais de crescimento"
  },
  "product_fit": { ... },
  "expansion_signals": { ... },
  "procurement_readiness": { ... }
}
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Critérios de Classificação (SEMANA 1)**
- ✅ Função para extrair sinais das evidências
- ✅ Função para calcular score baseado em sinais
- ✅ Função para gerar explicação da classificação
- ✅ Integrar na resposta da edge function

### **FASE 2: Buscas Específicas (SEMANA 2)**
- ✅ Implementar queries específicas por tipo de sinal
- ✅ Adicionar filtros de data (últimos 3-6 meses)
- ✅ Testar efetividade das novas queries

### **FASE 3: Product Fit Analysis (SEMANA 3)**
- ✅ Implementar cálculo real de Product Fit Score
- ✅ Integrar análise de website da empresa
- ✅ Comparar com catálogo do tenant

### **FASE 4: Dealer Analysis (SEMANA 4)**
- ✅ Detectar se empresa é dealer/distribuidor/importer
- ✅ Analisar modelo de negócio
- ✅ Estimar potencial de deal

---

## ✅ RESULTADO ESPERADO

### **Antes:**
```
Status: cold_lead
Confidence: low
Evidences: 0
Explanation: ❌ Nenhuma
```

### **Depois:**
```
Status: warm
Score: 58
Confidence: medium
Explanation: ✅ "Empresa classificada como WARM devido a: (1) 3 vagas para 'Supply Chain Manager', (2) Menção de 'expansão de produtos', (3) Product Fit Score de 65%. Recomendação: Abordar esta semana."
Signals: ✅ Hiring (3), Growth (1), Product Fit (65%)
Timeline: 60_days
Recommendation: ✅ "🟡 ABORDAR ESTA SEMANA - Oportunidade válida"
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Aprovar proposta** de melhorias
2. **Implementar FASE 1** (Critérios de Classificação)
3. **Testar com empresas reais** (dealers/distribuidores)
4. **Iterar** baseado em feedback
5. **Implementar FASES 2-4** progressivamente

---

**Esta proposta transforma o SCI de um "relatório vazio" em uma ferramenta de inteligência comercial verdadeiramente efetiva.**
