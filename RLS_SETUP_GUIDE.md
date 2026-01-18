# 🔒 GUIA COMPLETO: Aplicar RLS (Row Level Security) no Projeto

## 📋 SUMÁRIO

Este guia explica como aplicar políticas RLS (Row Level Security) em todas as tabelas públicas do projeto Supabase, garantindo isolamento completo entre tenants (multi-tenant).

---

## 🎯 OBJETIVO

Garantir que:
1. ✅ **Usuários não autenticados** não possam acessar NADA
2. ✅ **Usuários autenticados** só vejam/modifiquem dados do seu próprio tenant
3. ✅ **Isolamento completo** entre tenants (multi-tenant)
4. ✅ **Service role** continue tendo acesso total (para backend/Edge Functions)

---

## 📁 ARQUIVOS CRIADOS

### 1. `supabase/migrations/20250226000000_apply_rls_all_tables.sql`
Migration principal que aplica RLS em todas as tabelas públicas.

### 2. `DIAGNOSTICO_RLS_TABELAS.sql`
Script SQL para diagnóstico e verificação do status atual do RLS.

---

## 🚀 PROCESSO DE IMPLEMENTAÇÃO

### **ETAPA 1: DIAGNÓSTICO (ANTES)**

Execute o script de diagnóstico no Supabase SQL Editor:

```sql
-- Executar: DIAGNOSTICO_RLS_TABELAS.sql
```

Este script vai mostrar:
- ✅ Quais tabelas têm RLS habilitado
- ❌ Quais tabelas NÃO têm RLS
- ⚠️ Quais tabelas têm RLS mas sem políticas
- 📊 Estrutura de cada tabela (tenant_id, company_id, ou global)

**Anote os resultados** para validação posterior.

---

### **ETAPA 2: APLICAR MIGRATION**

Execute a migration principal:

```sql
-- Executar: supabase/migrations/20250226000000_apply_rls_all_tables.sql
```

A migration irá:

1. **Identificar automaticamente** todas as tabelas públicas sem RLS
2. **Verificar a estrutura** de cada tabela (tenant_id, company_id, ou global)
3. **Aplicar políticas apropriadas** baseadas na estrutura:
   - **Padrão A**: Tabelas com `tenant_id` → Isolamento direto por tenant
   - **Padrão B**: Tabelas com `company_id` → Isolamento via JOIN com companies
   - **Padrão C**: Tabelas globais → Apenas autenticação necessária

---

### **ETAPA 3: VALIDAÇÃO (DEPOIS)**

Execute novamente o script de diagnóstico para validar:

```sql
-- Executar: DIAGNOSTICO_RLS_TABELAS.sql
```

**Verifique:**
- ✅ Todas as tabelas têm RLS habilitado
- ✅ Todas as tabelas com RLS têm políticas criadas
- ✅ Nenhuma tabela está bloqueada (RLS sem políticas)

---

## 📊 PADRÕES DE RLS APLICADOS

### **PADRÃO A: Tabela com `tenant_id` diretamente**

```sql
-- Política de isolamento por tenant
tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
```

**Aplicado em:**
- Tabelas que têm coluna `tenant_id` diretamente
- Exemplos: `tenants`, `workspaces`, `tenant_products`, `companies`, etc.

**Políticas criadas:**
- SELECT: Usuário vê apenas dados do seu tenant
- INSERT: Usuário insere apenas no seu tenant
- UPDATE: Usuário atualiza apenas dados do seu tenant
- DELETE: Usuário deleta apenas dados do seu tenant

---

### **PADRÃO B: Tabela com `company_id` (via JOIN)**

```sql
-- Política de isolamento via companies
EXISTS (
  SELECT 1 FROM public.companies c
  JOIN public.users u ON u.tenant_id = c.tenant_id
  WHERE c.id = tabela.company_id
    AND u.id = auth.uid()
)
```

**Aplicado em:**
- Tabelas que têm coluna `company_id` que referencia `companies`
- Exemplos: `sales_deals`, `dealer_contracts`, `account_strategies`, etc.

**Políticas criadas:**
- SELECT: Via JOIN com companies para obter tenant_id
- INSERT: Verifica que a company pertence ao tenant do usuário
- UPDATE: Verifica tenant antes e depois da atualização
- DELETE: Verifica tenant antes de deletar

---

### **PADRÃO C: Tabela global/compartilhada**

```sql
-- Apenas autenticação necessária
auth.uid() IS NOT NULL
```

**Aplicado em:**
- Tabelas sem `tenant_id` nem `company_id`
- Tabelas de configuração global, dados de referência
- Exemplos: `hs_codes`, tabelas de lookup, etc.

**Políticas criadas:**
- SELECT: Apenas usuários autenticados podem ler
- INSERT/UPDATE/DELETE: Bloqueados para usuários normais (service_role pode fazer tudo)

---

## ⚠️ TABELAS EXCLUÍDAS DA MIGRATION

A migration **NÃO** processa tabelas que já têm RLS configurado corretamente:

- `tenants`
- `workspaces`
- `tenant_products`
- `users`
- `companies`
- `sales_deals`
- `sales_pipeline_stages`
- `sales_deal_activities`
- `email_sequences`
- `email_sequence_steps`
- `smart_tasks`
- `sales_automations`
- `commercial_proposals`
- `dealer_contracts`
- `dealer_orders`
- `dealer_performance`
- `marketing_materials`
- `dealer_incentives`
- `icp_analysis_results`
- `sdr_notifications`
- `user_roles`
- `contacts`
- `conversations`
- `messages`
- `account_strategies`
- `executive_reports`
- `executive_reports_versions`

**Motivo:** Essas tabelas já têm políticas RLS específicas e testadas. A migration não vai sobrescrever políticas existentes.

---

## 🔍 CASOS ESPECIAIS

### **1. Service Role (Bypass RLS)**

O **service_role** do Supabase **automaticamente bypassa RLS**. Não é necessário criar políticas específicas para service_role.

**Uso em Edge Functions:**
```typescript
// Edge Functions que usam service_role terão acesso total
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role bypassa RLS
);
```

---

### **2. Tabela `leads_pool` (Staging/Temporária)**

Se existir, recebe política especial:
- Todos os usuários autenticados podem gerenciar
- Não há isolamento por tenant (é uma tabela de staging)

---

### **3. Tabelas `global_*` (Global Engine)**

Tabelas do Global Engine que têm `tenant_id` via `tenant_profiles`:
- Serão processadas com **Padrão A** (tenant_id)
- Políticas serão aplicadas normalmente

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após aplicar a migration, verifique:

- [ ] **Todas as tabelas têm RLS habilitado**
  ```sql
  SELECT COUNT(*) FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = false;
  -- Resultado esperado: 0 (ou apenas views)
  ```

- [ ] **Todas as tabelas com RLS têm políticas**
  ```sql
  SELECT COUNT(*) FROM (
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public' AND t.rowsecurity = true
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = t.tablename
      )
  ) as missing_policies;
  -- Resultado esperado: 0
  ```

- [ ] **Testar isolamento entre tenants**
  - Criar dois tenants diferentes
  - Criar usuários em cada tenant
  - Verificar que um usuário não vê dados do outro tenant

- [ ] **Testar acesso de usuários não autenticados**
  - Tentar acessar tabelas sem autenticação
  - Deve retornar erro ou vazio

- [ ] **Testar service_role (Edge Functions)**
  - Edge Functions devem ter acesso total
  - Não devem ser bloqueadas por RLS

---

## 🧪 TESTES RECOMENDADOS

### **Teste 1: Isolamento entre Tenants**

```sql
-- Como usuário do Tenant A
SELECT * FROM companies; -- Deve ver apenas companies do Tenant A

-- Como usuário do Tenant B  
SELECT * FROM companies; -- Deve ver apenas companies do Tenant B
-- NÃO deve ver companies do Tenant A
```

### **Teste 2: Bloqueio de Usuários Não Autenticados**

```sql
-- Sem autenticação
SELECT * FROM companies; -- Deve retornar erro ou vazio
```

### **Teste 3: Service Role Bypass**

```typescript
// Edge Function com service_role
const { data, error } = await supabase
  .from('companies')
  .select('*'); // Deve funcionar normalmente
```

---

## 📝 NOTAS IMPORTANTES

### **1. Performance**

Políticas RLS com JOINs podem ser mais lentas. Certifique-se de ter índices em:
- `tenant_id` (em todas as tabelas que têm)
- `company_id` (em todas as tabelas que têm)

```sql
-- Verificar índices
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexdef LIKE '%tenant_id%';
```

### **2. Migrations Futuras**

Ao criar novas tabelas, **sempre**:
1. Adicione `tenant_id` ou `company_id` quando apropriado
2. Habilite RLS: `ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;`
3. Crie políticas imediatamente

### **3. Edge Functions**

Edge Functions que precisam acessar dados de múltiplos tenants devem usar **service_role**, não o token do usuário.

---

## 🚨 TROUBLESHOOTING

### **Problema: Tabela bloqueada (RLS habilitado mas sem políticas)**

**Sintoma:** Tabela tem RLS mas não retorna dados mesmo para usuários autenticados.

**Solução:**
```sql
-- Criar política temporária
CREATE POLICY "temp_select" ON public.tabela
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- Ou remover RLS temporariamente (apenas para debug!)
ALTER TABLE public.tabela DISABLE ROW LEVEL SECURITY;
```

---

### **Problema: Performance lenta após aplicar RLS**

**Sintoma:** Queries ficaram lentas após aplicar RLS.

**Solução:**
1. Verificar se há índices em `tenant_id` e `company_id`
2. Criar índices se necessário:
```sql
CREATE INDEX IF NOT EXISTS idx_tabela_tenant ON public.tabela(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tabela_company ON public.tabela(company_id);
```

---

### **Problema: Edge Function bloqueada**

**Sintoma:** Edge Function não consegue acessar tabelas.

**Solução:**
- Verificar se está usando `SUPABASE_SERVICE_ROLE_KEY` (não `SUPABASE_ANON_KEY`)
- Service role automaticamente bypassa RLS

---

## 📚 RECURSOS

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## ✅ CONCLUSÃO

Após seguir este guia:

✅ **Público (não autenticado)**: Bloqueado completamente  
✅ **Usuários autenticados**: Acesso apenas aos dados do seu tenant  
✅ **Service Role**: Acesso total (para backend/Edge Functions)  
✅ **Isolamento completo**: Tenants não veem dados uns dos outros  

**A plataforma está segura e pronta para produção!** 🎉

