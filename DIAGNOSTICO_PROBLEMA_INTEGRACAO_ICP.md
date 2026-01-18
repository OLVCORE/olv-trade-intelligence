# 🔍 DIAGNÓSTICO: Problema de Integração de Empresas ao ICP

## 📋 PROBLEMA RELATADO

**Sintoma:**
- Ao clicar em "Integrar ao ICP" na tabela de empresas, o sistema informa que as empresas foram integradas
- Porém, ao acessar a página "Quarentena ICP", as empresas não aparecem
- As empresas não foram migradas efetivamente para a quarentena

---

## 🔎 ANÁLISE DO CÓDIGO

### **1. CÓDIGO DE INSERÇÃO (CompaniesManagementPage.tsx - Linha 1423-1449)**

```typescript
const { error: insertError } = await supabase
  .from('icp_analysis_results')
  .insert({
    // ✅ OBRIGATÓRIOS (NOT NULL)
    company_id: fullCompany.id,
    cnpj: fullCompany.cnpj,
    razao_social: fullCompany.company_name || receitaData.razao_social || receitaData.nome || 'N/A',
    
    // ✅ OPCIONAIS (mas importantes)
    nome_fantasia: receitaData.nome_fantasia || receitaData.fantasia || null,
    uf: (fullCompany.location as any)?.state || receitaData.uf || null,
    municipio: (fullCompany.location as any)?.city || receitaData.municipio || null,
    // ... outros campos ...
    
    // ✅ RASTREABILIDADE
    status: 'pendente',
    source_type: fullCompany.source_type || 'manual',
    source_name: fullCompany.source_name || 'Estoque',
    import_batch_id: fullCompany.import_batch_id,
    
    // ✅ RAW DATA (mantém TUDO)
    raw_data: fullCompany.raw_data || {}
  });
```

**❌ PROBLEMA 1: Campos Multi-Tenant NÃO estão sendo preenchidos**
- `user_id` → **NÃO está sendo inserido** (NULL)
- `tenant_id` → **NÃO está sendo inserido** (NULL)
- `workspace_id` → **NÃO está sendo inserido** (NULL)

---

### **2. POLÍTICA RLS (20251115090000_restore_core_tables.sql - Linha 72-75)**

```sql
CREATE POLICY icp_analysis_results_select_policy
ON public.icp_analysis_results
FOR SELECT
USING (auth.uid() = user_id);
```

**❌ PROBLEMA 2: Política RLS bloqueia registros sem user_id**
- A política exige que `user_id = auth.uid()` para retornar registros
- Como `user_id` é NULL na inserção, a política RLS **bloqueia** a visualização
- **Resultado:** Os registros são inseridos no banco, mas não aparecem nas queries

---

### **3. QUERY DA QUARENTENA (useICPQuarantine.ts - Linha 70-73)**

```typescript
let query = supabase
  .from('icp_analysis_results')
  .select('*')
  .order('icp_score', { ascending: false });
```

**❌ PROBLEMA 3: Query não filtra por tenant_id/workspace_id**
- A query não aplica filtros de tenant/workspace
- Depende apenas da política RLS para isolamento
- Mas a política RLS está bloqueando porque `user_id` é NULL

---

## 🎯 CAUSA RAIZ IDENTIFICADA

### **Causa Principal:**
A inserção em `icp_analysis_results` **não preenche os campos obrigatórios para RLS**:
- `user_id` → Deve ser `auth.uid()` (usuário autenticado)
- `tenant_id` → Deve vir do contexto do tenant (via `useTenant()`)
- `workspace_id` → Deve vir do contexto do workspace (via `useTenant()`)

### **Consequência:**
1. ✅ Registros são inseridos no banco (INSERT funciona)
2. ❌ Política RLS bloqueia SELECT porque `user_id IS NULL`
3. ❌ Query da Quarentena retorna vazio (RLS bloqueia)
4. ❌ Usuário não vê as empresas na Quarentena ICP

---

## 📊 ESTRUTURA DA TABELA (Confirmada)

```sql
CREATE TABLE IF NOT EXISTS public.icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- ⚠️ OBRIGATÓRIO PARA RLS
  tenant_id UUID REFERENCES public.tenants(id),              -- ⚠️ OBRIGATÓRIO PARA ISOLAMENTO
  workspace_id UUID REFERENCES public.workspaces(id),        -- ⚠️ OBRIGATÓRIO PARA ISOLAMENTO
  
  razao_social TEXT,
  cnpj TEXT,
  status TEXT DEFAULT 'pendente',
  -- ... outros campos ...
);
```

**Campos Multi-Tenant:**
- `user_id` → Referência ao usuário que criou o registro
- `tenant_id` → Referência ao tenant (isolamento multi-tenant)
- `workspace_id` → Referência ao workspace (isolamento por workspace)

---

## 🔧 SOLUÇÃO NECESSÁRIA

### **Correção na Inserção (CompaniesManagementPage.tsx)**

**ANTES (❌ ERRADO):**
```typescript
.insert({
  company_id: fullCompany.id,
  cnpj: fullCompany.cnpj,
  razao_social: fullCompany.company_name || 'N/A',
  // ... outros campos ...
  // ❌ FALTANDO: user_id, tenant_id, workspace_id
});
```

**DEPOIS (✅ CORRETO):**
```typescript
// 1. Obter contexto do tenant/workspace
const { currentTenant, currentWorkspace } = useTenant();

// 2. Obter usuário autenticado
const { data: { user } } = await supabase.auth.getUser();

// 3. Inserir com TODOS os campos multi-tenant
.insert({
  company_id: fullCompany.id,
  cnpj: fullCompany.cnpj,
  razao_social: fullCompany.company_name || 'N/A',
  
  // ✅ CAMPOS MULTI-TENANT (OBRIGATÓRIOS)
  user_id: user?.id,                    // ⚠️ CRÍTICO para RLS
  tenant_id: currentTenant?.id,          // ⚠️ CRÍTICO para isolamento
  workspace_id: currentWorkspace?.id,    // ⚠️ CRÍTICO para isolamento
  
  // ... outros campos ...
});
```

---

## 📝 CHECKLIST DE CORREÇÃO

- [ ] **1. Obter contexto do tenant/workspace**
  - Usar `useTenant()` hook para obter `currentTenant` e `currentWorkspace`
  - Validar que ambos existem antes de inserir

- [ ] **2. Obter usuário autenticado**
  - Usar `supabase.auth.getUser()` para obter `user.id`
  - Validar que usuário está autenticado

- [ ] **3. Incluir campos multi-tenant na inserção**
  - `user_id: user?.id`
  - `tenant_id: currentTenant?.id`
  - `workspace_id: currentWorkspace?.id`

- [ ] **4. Validar antes de inserir**
  - Verificar se `user_id`, `tenant_id` e `workspace_id` não são NULL
  - Exibir erro se algum estiver faltando

- [ ] **5. Testar após correção**
  - Inserir empresa ao ICP
  - Verificar se aparece na Quarentena ICP
  - Verificar isolamento entre tenants

---

## 🧪 TESTE DE VALIDAÇÃO

### **Teste 1: Verificar Inserção no Banco**
```sql
-- Executar no Supabase SQL Editor
SELECT 
  id,
  company_id,
  user_id,      -- ⚠️ Deve ter valor (não NULL)
  tenant_id,    -- ⚠️ Deve ter valor (não NULL)
  workspace_id, -- ⚠️ Deve ter valor (não NULL)
  razao_social,
  status,
  created_at
FROM icp_analysis_results
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado Esperado:**
- Todos os registros devem ter `user_id`, `tenant_id` e `workspace_id` preenchidos
- Se algum estiver NULL, a correção não foi aplicada

---

### **Teste 2: Verificar Política RLS**
```sql
-- Executar como usuário autenticado
SELECT COUNT(*) 
FROM icp_analysis_results
WHERE user_id = auth.uid();
```

**Resultado Esperado:**
- Deve retornar o número de empresas do usuário
- Se retornar 0 mas houver registros no banco, a política RLS está bloqueando

---

### **Teste 3: Verificar Isolamento Multi-Tenant**
```sql
-- Executar como usuário do Tenant A
SELECT COUNT(*) FROM icp_analysis_results;

-- Executar como usuário do Tenant B
SELECT COUNT(*) FROM icp_analysis_results;
```

**Resultado Esperado:**
- Cada tenant deve ver apenas seus próprios registros
- Se um tenant vê dados de outro, há problema de isolamento

---

## ⚠️ IMPACTO DA CORREÇÃO

### **Antes da Correção:**
- ❌ Empresas inseridas mas não visíveis na Quarentena
- ❌ Política RLS bloqueia visualização
- ❌ Dados "perdidos" no banco (existem mas não aparecem)

### **Depois da Correção:**
- ✅ Empresas inseridas e visíveis na Quarentena
- ✅ Política RLS permite visualização
- ✅ Isolamento multi-tenant funcionando corretamente
- ✅ Dados rastreáveis (user_id, tenant_id, workspace_id)

---

## 🔍 OUTROS PONTOS PROBLEMÁTICOS IDENTIFICADOS

### **2. globalToCompanyFlow.ts (Linha 208-245)**

**Problema:** Mesmo problema na função `transferGlobalToCompanies`

```typescript
const quarantineEntry = {
  company_id: companyId,
  cnpj: isInternational ? null : (fullCompany?.cnpj || null),
  razao_social: globalCompany.company_name,
  // ... outros campos ...
  // ❌ FALTANDO: user_id, tenant_id, workspace_id
};

// Inserção sem campos multi-tenant
await supabase
  .from('icp_analysis_results')
  .insert(quarantineEntries);
```

**Impacto:** Empresas transferidas da Sala Global também não aparecem na Quarentena ICP.

---

## 📚 REFERÊNCIAS

### **Arquivos Envolvidos:**
1. `src/pages/CompaniesManagementPage.tsx` (linha 1376-1475)
   - Função `onSendToQuarantine` que faz a inserção
   - **❌ PROBLEMA:** Não preenche user_id, tenant_id, workspace_id

2. `src/services/globalToCompanyFlow.ts` (linha 208-245)
   - Função `transferGlobalToCompanies` que transfere empresas da Sala Global
   - **❌ PROBLEMA:** Não preenche user_id, tenant_id, workspace_id

3. `src/hooks/useICPQuarantine.ts` (linha 62-95)
   - Hook `useQuarantineCompanies` que busca empresas na quarentena
   - **✅ OK:** Query está correta, problema é na inserção

4. `supabase/migrations/20251115090000_restore_core_tables.sql` (linha 18-100)
   - Estrutura da tabela `icp_analysis_results`
   - Políticas RLS
   - **✅ OK:** Políticas estão corretas, problema é na inserção

5. `src/contexts/TenantContext.tsx`
   - Contexto que fornece `currentTenant` e `currentWorkspace`
   - **✅ OK:** Contexto está disponível, precisa ser usado na inserção

---

## ✅ CONCLUSÃO

**Problema Identificado:**
A inserção em `icp_analysis_results` não preenche os campos `user_id`, `tenant_id` e `workspace_id`, causando bloqueio pela política RLS.

**Solução:**
Incluir esses campos na inserção, obtendo os valores do contexto do tenant e do usuário autenticado.

**Próximo Passo:**
Aplicar a correção no código de inserção conforme descrito acima.
