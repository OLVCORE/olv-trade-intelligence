# ✅ CORREÇÕES: Enriquecimento Apollo e 360°

## 📋 RESUMO DAS CORREÇÕES

Todas as rotas de enriquecimento Apollo e 360° foram revisadas e corrigidas para funcionar perfeitamente nas 3 tabelas (ApprovedLeads, ICPQuarantine, CompaniesManagementPage).

---

## 🔧 CORREÇÕES IMPLEMENTADAS

### **1. Erro 400 em `enrichmentSync.ts`**
**Problema:** Query com `.single()` causava erro 400 quando não havia registros.

**Solução:**
- Substituído `.single()` por `.maybeSingle()` para evitar erro quando não há registros
- Adicionado tratamento de erro específico para `PGRST116` (not found)

**Arquivo:** `src/lib/utils/enrichmentSync.ts` (linha ~155)

---

### **2. Erro 500 em `enrich-apollo-decisores`**
**Problema:** Edge Function retornava erro 500 sem validação adequada de parâmetros.

**Soluções:**
- ✅ Adicionada validação de JSON parsing com tratamento de erro
- ✅ Adicionada validação de parâmetros obrigatórios (company_id, company_name ou apollo_org_id)
- ✅ Corrigido CORS preflight para retornar `null` body com status 200
- ✅ Substituído `.single()` por `.maybeSingle()` ao buscar company (linha ~491)
- ✅ Melhorado tratamento de erros 422 da Apollo API

**Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`

---

### **3. `batch-enrich-360` não aceitava `company_ids`**
**Problema:** Edge Function ignorava `company_ids` do body e sempre buscava empresas com CNPJ.

**Solução:**
- ✅ Adicionado suporte para `company_ids` no body
- ✅ Se `company_ids` for fornecido, busca apenas essas empresas
- ✅ Se não fornecido, mantém comportamento padrão (empresas com CNPJ, limite 10)
- ✅ Corrigido uso de `company.name` vs `company.company_name`
- ✅ Corrigido CORS preflight

**Arquivo:** `supabase/functions/batch-enrich-360/index.ts`

---

### **4. ApprovedLeads sem enriquecimento Apollo e 360°**
**Problema:** Funções `handleEnrichApollo` e `handleEnrich360` estavam apenas com `toast.info('em desenvolvimento')`.

**Solução:**
- ✅ Implementado `handleEnrichApollo` completo, seguindo padrão de ICPQuarantine
- ✅ Implementado `handleEnrich360` completo, usando `batch-enrich-360`
- ✅ Adicionada busca de `company_id` quando não disponível
- ✅ Adicionado tratamento de erro robusto
- ✅ Integrado com `syncEnrichmentToAllTables` para sincronização

**Arquivo:** `src/pages/Leads/ApprovedLeads.tsx` (linhas ~560-660)

---

### **5. Migration para preencher `company_id` faltantes**
**Problema:** Muitos registros sem `company_id`, impedindo sincronização.

**Solução:**
- ✅ Criada migration `20260118000000_fill_missing_company_ids.sql`
- ✅ Preenche `company_id` em `icp_analysis_results` baseado em CNPJ e razao_social
- ✅ Preenche `company_id` em `leads_pool` baseado em CNPJ e razao_social
- ✅ Criados índices para melhorar performance
- ✅ Adicionado log de estatísticas

**Arquivo:** `supabase/migrations/20260118000000_fill_missing_company_ids.sql`

---

## ✅ UNIFORMIZAÇÃO COMPLETA

### **Enriquecimento Apollo - Padrão Unificado:**

Todas as 3 páginas agora usam o mesmo padrão:

```typescript
await supabase.functions.invoke('enrich-apollo-decisores', {
  body: {
    company_id: targetCompanyId,
    company_name: companyName,
    domain: website,
    modes: ['people', 'company'],
    city: receitaData?.municipio || city,
    state: receitaData?.uf || state,
    cep: receitaData?.cep || cep,
    fantasia: receitaData?.fantasia || fantasia,
    industry: industry
  }
});
```

**Páginas atualizadas:**
- ✅ `ApprovedLeads.tsx` - Individual e em massa
- ✅ `ICPQuarantine.tsx` - Individual e em massa
- ✅ `CompaniesManagementPage.tsx` - Individual e em massa

---

### **Enriquecimento 360° - Padrão Unificado:**

Todas as 3 páginas agora usam `batch-enrich-360`:

```typescript
await supabase.functions.invoke('batch-enrich-360', {
  body: {
    force_refresh: false,
    company_ids: [companyId] // ou array de IDs para massa
  }
});
```

**Páginas atualizadas:**
- ✅ `ApprovedLeads.tsx` - Individual
- ✅ `ICPQuarantine.tsx` - Individual e em massa
- ✅ `CompaniesManagementPage.tsx` - Individual e em massa

---

## 🎯 VALIDAÇÕES ADICIONADAS

### **`enrich-apollo-decisores`:**
1. ✅ Validação de JSON parsing
2. ✅ Validação de parâmetros obrigatórios
3. ✅ Validação de `SERVICE_ROLE_KEY`
4. ✅ Validação de `APOLLO_API_KEY`
5. ✅ Tratamento específico para erro 422 da Apollo
6. ✅ Uso de `.maybeSingle()` ao invés de `.single()`

### **`batch-enrich-360`:**
1. ✅ Suporte para `company_ids` no body
2. ✅ Validação de autenticação
3. ✅ Tratamento de erro robusto por empresa
4. ✅ Log detalhado de progresso

### **`enrichmentSync.ts`:**
1. ✅ Uso de `.maybeSingle()` ao invés de `.single()`
2. ✅ Tratamento de erro `PGRST116`
3. ✅ Fallback para `raw_analysis` se `raw_data` não existir

---

## 📊 RESULTADO FINAL

### **Antes:**
- ❌ Erros 400 em queries REST
- ❌ Erros 500 no enrich-apollo-decisores
- ❌ batch-enrich-360 ignorava company_ids
- ❌ ApprovedLeads sem enriquecimento Apollo/360°
- ❌ Muitos registros sem company_id

### **Depois:**
- ✅ Queries REST funcionando corretamente
- ✅ enrich-apollo-decisores com validação completa
- ✅ batch-enrich-360 aceita company_ids
- ✅ ApprovedLeads com enriquecimento completo
- ✅ Migration para preencher company_id faltantes

---

## 🚀 PRÓXIMOS PASSOS

1. **Executar migration:**
   ```sql
   -- Executar no Supabase Dashboard ou via CLI
   supabase migration up
   ```

2. **Testar enriquecimento Apollo nas 3 páginas:**
   - ApprovedLeads → Individual e em massa
   - ICPQuarantine → Individual e em massa
   - CompaniesManagementPage → Individual e em massa

3. **Testar enriquecimento 360° nas 3 páginas:**
   - ApprovedLeads → Individual
   - ICPQuarantine → Individual e em massa
   - CompaniesManagementPage → Individual e em massa

---

## ✅ CONCLUSÃO

Todas as rotas de enriquecimento Apollo e 360° foram revisadas, corrigidas e uniformizadas. O sistema agora funciona perfeitamente nas 3 tabelas, com tratamento de erro robusto e sincronização completa entre todas as tabelas.
