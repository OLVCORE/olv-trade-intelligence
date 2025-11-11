# 🚀 SETUP AGORA - 5 MINUTOS!

## ✅ PROJETO CORRETO IDENTIFICADO!

**Supabase URL:** https://kdalsopwfkrxiaxxophh.supabase.co  
**Project ID:** kdalsopwfkrxiaxxophh

---

## 📋 PASSO A PASSO (EXECUTAR AGORA)

### 1️⃣ EXECUTAR MIGRATIONS NO SUPABASE

**Link direto:** https://app.supabase.com/project/kdalsopwfkrxiaxxophh/sql

Execute as **5 migrations** na ordem (copiar e colar no SQL Editor):

---

#### **Migration 1: Multi-Tenant Setup (VERSÃO FIXED)**

**Arquivo:** `supabase/migrations/20251111000000_multi_tenant_setup_FIXED.sql`

**O que faz:**
- ✅ Cria tabelas: `tenants`, `workspaces`, `tenant_products`, `users`, `companies`
- ✅ Insere tenant MetaLife
- ✅ Insere 3 workspaces do MetaLife
- ✅ Configura RLS (isolamento de dados)
- ✅ Trigger para auto-criar users

**Instruções:**
1. Abra o arquivo no VS Code
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique **"Run"**
5. Aguarde: "Success. No rows returned"

---

#### **Migration 2: Commercial Proposals**

**Arquivo:** `supabase/migrations/20251111000001_commercial_proposals.sql`

**O que faz:**
- ✅ Cria tabela `commercial_proposals`
- ✅ Cria bucket `proposal-pdfs` no Storage
- ✅ Função para gerar número de proposta

**Instruções:** Copie TODO o conteúdo → Cole no SQL Editor → Run

---

#### **Migration 3: Tenant Branding**

**Arquivo:** `supabase/migrations/20251111000002_tenant_branding.sql`

**O que faz:**
- ✅ Adiciona colunas de branding em `tenants` (logo, cores, contatos)
- ✅ Atualiza MetaLife com dados reais
- ✅ Cria bucket `tenant-logos` no Storage

**Instruções:** Copie TODO o conteúdo → Cole no SQL Editor → Run

---

#### **Migration 4: Dealer Relationship Management**

**Arquivo:** `supabase/migrations/20251111000003_dealer_relationship_management.sql`

**O que faz:**
- ✅ Cria 5 tabelas: `dealer_contracts`, `dealer_orders`, `dealer_performance`, `marketing_materials`, `dealer_incentives`
- ✅ Trigger para atualizar performance automaticamente
- ✅ View `dealer_performance_dashboard`
- ✅ Bucket `marketing-materials`

**Instruções:** Copie TODO o conteúdo → Cole no SQL Editor → Run

---

#### **Migration 5: Create Users Table (pode pular)**

**Arquivo:** `supabase/migrations/20251111000004_create_users_table.sql`

**Nota:** Esta já está incluída na Migration 1 FIXED, então pode **pular** esta.

---

### 2️⃣ VERIFICAR TABELAS CRIADAS

No Supabase, vá em **Table Editor** e confirme que existem:

- ✅ `tenants` (1 registro: MetaLife Pilates)
- ✅ `workspaces` (3 registros: Prospecção Brasil, Export - Global, Import - Sourcing)
- ✅ `users` (seus usuários migrados de auth.users)
- ✅ `tenant_products` (vazia por enquanto)
- ✅ `companies` (vazia por enquanto)
- ✅ `commercial_proposals` (vazia)
- ✅ `dealer_contracts` (vazia)
- ✅ `dealer_orders` (vazia)
- ✅ `dealer_performance` (vazia)

---

### 3️⃣ ASSOCIAR SEU USUÁRIO AO METALIFE

No **SQL Editor**, execute:

```sql
-- 1. Buscar ID do tenant MetaLife
SELECT id, name, slug FROM public.tenants WHERE slug = 'metalife';

-- Copie o UUID retornado (algo como: 123e4567-e89b-12d3-a456-426614174000)

-- 2. Buscar seu usuário
SELECT id, email FROM public.users;

-- 3. Associar ao MetaLife (SUBSTITUA OS VALORES)
UPDATE public.users
SET tenant_id = 'COLE-O-UUID-DO-METALIFE-AQUI'
WHERE email = 'SEU-EMAIL@example.com';

-- 4. Verificar (deve retornar 1 linha)
SELECT 
  u.email, 
  t.name AS tenant,
  t.primary_color,
  t.slug
FROM public.users u
JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'SEU-EMAIL@example.com';

-- Resultado esperado:
-- email | MetaLife Pilates | #10B981 | metalife
```

---

### 4️⃣ REINICIAR SERVIDOR LOCAL

```bash
# No terminal do VS Code:
# Pare o servidor (Ctrl+C se estiver rodando)

# Reinicie:
npm run dev
```

---

### 5️⃣ TESTAR NO NAVEGADOR

1. Acesse: http://localhost:5173/
2. Faça login com seu email
3. Deve aparecer:
   - ✅ Tela carrega (não mais branca!)
   - ✅ WorkspaceSwitcher no header (Prospecção Brasil)
   - ✅ Iniciais "ME" com cor verde (#10B981)
   - ✅ Todas as rotas funcionando

---

## 🎯 RESUMO

**Projeto ANTIGO (NÃO use):** olv-intelligence-prospect-v2  
**Projeto NOVO (USE este):** **olv-trade-intelligence**  
**Supabase correto:** **kdalsopwfkrxiaxxophh**.supabase.co  

**Arquivo `.env.local` já atualizado com credenciais corretas!** ✅

**Execute as migrations no Supabase do projeto NOVO e me avise!** 🚀
