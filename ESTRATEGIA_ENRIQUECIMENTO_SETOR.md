# 🎯 ESTRATÉGIA PARA ENRIQUECIMENTO DO SETOR/INDÚSTRIA

## 🔴 PROBLEMA ATUAL
**Situação:** Coluna "Setor" mostra "Não identificado" para todas as empresas
**Causa:** Receita Federal fornece CNAE (código técnico), mas não um setor amigável

---

## 🌍 COMO GRANDES PLATAFORMAS FAZEM

### **1. APOLLO.IO** ⭐ (MELHOR OPÇÃO)
**Como funciona:**
- API que retorna `industry` baseado em:
  - Website scraping
  - Machine Learning
  - Base de dados proprietária (200M+ empresas)
  
**Exemplo de retorno:**
```json
{
  "organization": {
    "name": "TOTVS",
    "industry": "Computer Software",
    "sub_industry": "Enterprise Software",
    "industry_tag_id": "5567cd4773696439b10b0000",
    "keywords": ["ERP", "Business Management", "Cloud Software"]
  }
}
```

**Vantagens:**
- ✅ Altamente preciso (90%+ accuracy)
- ✅ Categorização padronizada
- ✅ JÁ TEMOS INTEGRAÇÃO com Apollo!
- ✅ Atualização automática
- ✅ Suporta empresas B2B

**Implementação:**
```typescript
// Já temos onBulkEnrichApollo!
// Precisamos garantir que salva o campo 'industry'
```

---

### **2. CLEARBIT** (ALTERNATIVA)
**Como funciona:**
- API Enrichment que retorna firmographic data
- Baseado em domínio da empresa

**Exemplo:**
```json
{
  "company": {
    "name": "TOTVS",
    "domain": "totvs.com",
    "category": {
      "sector": "Information Technology",
      "industry_group": "Software & Services",
      "industry": "Application Software",
      "sub_industry": "Enterprise Software"
    }
  }
}
```

**Vantagens:**
- ✅ Categorização detalhada (4 níveis)
- ✅ Boa cobertura internacional
- ✅ API RESTful simples

**Desvantagens:**
- ❌ Caro ($99/mês para 2500 req)
- ❌ Focado em empresas americanas

---

### **3. ZOOMINFO** (ENTERPRISE)
**Como funciona:**
- Plataforma enterprise de B2B data
- Categorização NAICS/SIC

**Vantagens:**
- ✅ Dados mais completos
- ✅ Decisores inclusos

**Desvantagens:**
- ❌ Muito caro (enterprise only)
- ❌ Foco em mercado americano

---

### **4. MAPEAMENTO CNAE → SETOR** (FALLBACK LOCAL)
**Como funciona:**
- Criar tabela de mapeamento CNAE → Setor Amigável
- Enriquecer localmente sem API

**Exemplo:**
```typescript
const CNAE_TO_SECTOR: Record<string, string> = {
  // Indústria de Transformação
  '10': 'Indústria Alimentícia',
  '11': 'Indústria de Bebidas',
  '13': 'Indústria Têxtil',
  '22': 'Indústria de Plástico e Borracha',
  '25': 'Indústria Metalúrgica',
  
  // Comércio
  '45': 'Comércio Automotivo',
  '46': 'Comércio Atacadista',
  '47': 'Comércio Varejista',
  
  // Serviços
  '62': 'Tecnologia da Informação',
  '63': 'Serviços de Informação',
  '70': 'Consultoria Empresarial',
  
  // ... (mapeamento completo ~700 CNAEs)
};

function getSectorFromCNAE(cnae: string): string {
  const prefix = cnae.substring(0, 2);
  return CNAE_TO_SECTOR[prefix] || 'Não identificado';
}
```

**Vantagens:**
- ✅ Gratuito
- ✅ Offline
- ✅ Rápido

**Desvantagens:**
- ❌ Manutenção manual
- ❌ Menos preciso que APIs
- ❌ Categorização limitada

---

### **5. WEB SCRAPING + NLP** (AVANÇADO)
**Como funciona:**
1. Scrape página "Sobre Nós" do website
2. Extrai texto relevante
3. Usa NLP para classificar setor

**Exemplo com OpenAI:**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{
    role: "system",
    content: "Classifique o setor da empresa baseado na descrição"
  }, {
    role: "user",
    content: `Empresa: TOTVS. Descrição: ${aboutUsText}`
  }]
});

const sector = response.choices[0].message.content;
// Output: "Software Empresarial (ERP)"
```

**Vantagens:**
- ✅ Altamente flexível
- ✅ Funciona para empresas pequenas

**Desvantagens:**
- ❌ Caro (OpenAI API)
- ❌ Lento (1-2s por empresa)
- ❌ Requer website funcional

---

## 🎯 RECOMENDAÇÃO: ABORDAGEM HÍBRIDA

### **PRIORIDADE 1: APOLLO.IO** (Já temos!)
```typescript
// Modificar handleBatchEnrichApollo para salvar 'industry'
const apolloData = await enrichWithApollo(company);

await supabase
  .from('companies')
  .update({
    industry: apolloData.organization?.industry, // ✅ ADICIONAR
    segmento: apolloData.organization?.industry,
    raw_data: {
      ...company.raw_data,
      apollo: apolloData
    }
  })
  .eq('id', company.id);
```

### **PRIORIDADE 2: FALLBACK CNAE** (Quando Apollo falha)
```typescript
if (!apolloData?.organization?.industry) {
  // Usar mapeamento CNAE local
  const cnae = company.raw_data?.receita_federal?.cnae_fiscal;
  const sector = getSectorFromCNAE(cnae);
  
  await supabase
    .from('companies')
    .update({ segmento: sector })
    .eq('id', company.id);
}
```

### **PRIORIDADE 3: MANUAL** (Empresas críticas)
- Permitir edição manual do setor
- Salvar como `segmento_manual` (prioridade sobre Apollo)

---

## 📊 CAMPO DE DADOS PROPOSTO

```sql
-- Tabela: companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS segmento_manual TEXT; -- Prioridade máxima
ALTER TABLE companies ADD COLUMN IF NOT EXISTS segmento TEXT; -- Auto Apollo
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT; -- Apollo raw

-- Lógica de exibição:
-- segmento_display = segmento_manual || segmento || setor_amigavel || 'Não identificado'
```

---

## ✅ IMPLEMENTAÇÃO IMEDIATA

**ETAPA 1:** Garantir que Apollo salva `industry`
**ETAPA 2:** Criar fallback CNAE → Setor
**ETAPA 3:** Adicionar botão "Editar Setor" na tabela
**ETAPA 4:** (Futuro) Integrar Clearbit como backup

---

## 🧪 TESTE PROPOSTO

1. Enriquecer 10 empresas com Apollo
2. Verificar se campo `industry` foi salvo
3. Exibir na coluna "Setor"
4. Para empresas sem Apollo: usar CNAE
5. Resultado esperado: 90%+ com setor identificado

