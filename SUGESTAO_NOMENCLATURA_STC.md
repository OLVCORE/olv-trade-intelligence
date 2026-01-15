# 💡 SUGESTÃO DE NOMENCLATURA - STC → SCI

## 🎯 RECOMENDAÇÃO PRINCIPAL

### **Nome Sugerido:**
**"Strategic Commercial Intelligence (SCI)"**
- **Português:** Inteligência Comercial Estratégica
- **Sigla:** SCI (mantém a tradição de 3 letras)
- **Substitui:** STC (Simple TOTVS Check)

### **Relatório:**
**"Dossiê Estratégico de Prospecção Internacional"**
- **Substitui:** "Relatório de Verificação TOTVS"
- **Inspirado no:** "Dossiê Estratégico de Prospecção" (Extraterro 1 - mercado local)

---

## 🌍 RACIONAL PARA MERCADO INTERNACIONAL

### **Por que "Strategic Commercial Intelligence"?**

1. ✅ **Foco Estratégico:** Não é apenas um "check", mas uma análise estratégica completa
2. ✅ **Comercial:** Enfatiza o aspecto comercial e de vendas
3. ✅ **Inteligência:** Indica que é uma ferramenta de inteligência de negócios
4. ✅ **Internacional:** Funciona para qualquer país, não apenas Brasil
5. ✅ **Profissional:** Nome adequado para mercado B2B internacional

### **Por que "Dossiê Estratégico de Prospecção Internacional"?**

1. ✅ **Consistência:** Mantém padrão do mercado local ("Dossiê Estratégico de Prospecção")
2. ✅ **Clareza:** Indica claramente que é para mercado internacional
3. ✅ **Profissional:** Termo comercial usado em B2B internacional
4. ✅ **Completo:** "Dossiê" sugere análise completa e detalhada

---

## 📝 ONDE APLICAR A RENOMEAÇÃO

### **1. Menu Principal:**
```
❌ "Simple TOTVS Check (STC)"
✅ "SCI - Strategic Intelligence"
```

### **2. Título do Relatório:**
```
❌ "Relatório de Verificação TOTVS"
✅ "Dossiê Estratégico de Prospecção Internacional"
```

### **3. Aba 1:**
```
❌ "TOTVS Check"
✅ "Strategic Intelligence Check"
```

### **4. Componentes:**
```
❌ SimpleTOTVSCheckDialog
✅ StrategicIntelligenceDialog

❌ ProductAnalysisCard (função TOTVSCheckCard)
✅ StrategicIntelligenceCard
```

### **5. Edge Functions:**
```
❌ simple-totvs-check
✅ strategic-intelligence-check

❌ analyze-stc-automatic
✅ analyze-sci-automatic
```

### **6. Tabelas/Banco de Dados:**
```
❌ stc_verification_history
✅ sci_verification_history

❌ stc_status
✅ sci_status
```

---

## 🎯 SUBSTITUIÇÃO DA FUNCIONALIDADE

### **De (TOTVS Check):**
Verifica se empresa brasileira usa produtos TOTVS (ERP nacional)

### **Para (Strategic Intelligence Check):**
1. **Company Health Score:** Saúde e atividade da empresa
2. **Expansion Signals:** Sinais de crescimento e expansão
3. **Procurement Readiness:** Prontidão para compras
4. **International Trade:** Histórico de importações/exportações
5. **Product Fit:** Alinhamento com produtos exportáveis

---

## 📊 O QUE O NOVO CHECK ANALISA

### **Fontes Mantidas (47 fontes Serper):**
- ✅ 30 portais de vagas (adaptados para mercado internacional)
- ✅ 26 notícias & tech (Crunchbase, Bloomberg, Reuters)
- ✅ 6 vídeos & social (YouTube, LinkedIn, Twitter/X)
- ✅ 1 parceiro (Panjiva - dados de importação/exportação)

### **Novas Fontes:**
- 🆕 Panjiva API (Bill of Lading, HS Codes)
- 🆕 Crunchbase API (funding, acquisitions)
- 🆕 SimilarWeb API (website traffic por país)
- 🆕 BuiltWith/Wappalyzer (tech stack)

---

## 💰 FOCO EM VENDAS INTERNACIONAIS

### **O que analisa para vendas:**
1. **Potencial de Compra:**
   - Orçamentos aprovados (detectados em vagas)
   - RFPs publicados
   - Necessidades expressas

2. **Fit de Produto:**
   - Alinhamento com catálogo exportável
   - Porte da empresa
   - Setor/indústria

3. **Capacidade Logística:**
   - Pode receber containers?
   - Preferências de Incoterms
   - Certificações necessárias

4. **Histórico Comercial:**
   - Importações/exportações recentes
   - Principais parceiros comerciais
   - Volumes e frequência

5. **Oportunidade Estratégica:**
   - Sinais de expansão
   - Novos escritórios
   - Parcerias estratégicas

---

## 🚀 RESULTADO ESPERADO

### **Status Final (Go/No-Go/Review):**
```typescript
{
  status: 'hot_lead' | 'warm_prospect' | 'cold_lead' | 'not_viable',
  confidence: number, // 0-100
  recommendation: string,
  estimated_revenue_potential: number,
  timeline_to_close: '30_days' | '60_days' | '90_days' | '120_days' | '180_days+'
}
```

### **Ao invés de:**
```typescript
{
  status: 'go' | 'no-go' | 'revisar', // TOTVS Check
  confidence: number,
  // ...
}
```

---

## ✅ BENEFÍCIOS

1. ✅ **Relevante Internacionalmente:** Funciona para empresas de qualquer país
2. ✅ **Foco Comercial:** Analisa oportunidades de vendas reais
3. ✅ **Inteligência Estratégica:** Insights para expansão comercial
4. ✅ **Profissional:** Nome adequado para mercado B2B internacional
5. ✅ **Escalável:** Pode evoluir com novas integrações e análises

---

**Aguardando sua aprovação para iniciar a implementação!**
