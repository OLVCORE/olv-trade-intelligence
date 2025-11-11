# 🚀 QUICK START - OLV TRADE INTELLIGENCE

## ⚠️ ERRO: "Could not find the table 'public.users'"

**CAUSA:** As migrations ainda NÃO foram executadas no Supabase!

---

## 📋 PASSO A PASSO (5 MINUTOS)

### 1️⃣ EXECUTAR MIGRATIONS NO SUPABASE

Acesse: https://app.supabase.com/project/qtcwetabhhkhvomcrqgm/sql

Execute os **5 arquivos SQL** na ordem (copiar e colar no SQL Editor):

#### **Migration 1: Multi-Tenant Setup**
```sql
-- Copie TODO o conteúdo de:
supabase/migrations/20251111000000_multi_tenant_setup.sql

-- Cole no SQL Editor e clique "Run"
```

#### **Migration 2: Commercial Proposals**
```sql
-- Copie TODO o conteúdo de:
supabase/migrations/20251111000001_commercial_proposals.sql

-- Cole no SQL Editor e clique "Run"
```

#### **Migration 3: Tenant Branding**
```sql
-- Copie TODO o conteúdo de:
supabase/migrations/20251111000002_tenant_branding.sql

-- Cole no SQL Editor e clique "Run"
```

#### **Migration 4: Dealer Relationship Management**
```sql
-- Copie TODO o conteúdo de:
supabase/migrations/20251111000003_dealer_relationship_management.sql

-- Cole no SQL Editor e clique "Run"
```

#### **Migration 5: Create Users Table (FIX)**
```sql
-- Copie TODO o conteúdo de:
supabase/migrations/20251111000004_create_users_table.sql

-- Cole no SQL Editor e clique "Run"
```

---

### 2️⃣ VERIFICAR TABELAS CRIADAS

No Supabase, vá em **Table Editor** e confirme:

- ✅ `tenants` (deve ter 1 registro: MetaLife)
- ✅ `workspaces` (deve ter 3 registros: Prospecção Brasil, Export, Import)
- ✅ `users` (deve ter seus usuários)
- ✅ `tenant_products`
- ✅ `commercial_proposals`
- ✅ `dealer_contracts`
- ✅ `dealer_orders`
- ✅ `dealer_performance`
- ✅ `marketing_materials`
- ✅ `dealer_incentives`

---

### 3️⃣ ASSOCIAR SEU USUÁRIO AO TENANT METALIFE

No **SQL Editor**, execute:

```sql
-- 1. Buscar ID do tenant MetaLife
SELECT id, name FROM public.tenants WHERE slug = 'metalife';
-- Copie o UUID retornado

-- 2. Buscar seu usuário
SELECT id, email FROM public.users WHERE email = 'SEU-EMAIL-AQUI';

-- 3. Associar ao MetaLife (substitua <UUID_METALIFE> abaixo)
UPDATE public.users
SET tenant_id = '<UUID_METALIFE>'
WHERE email = 'SEU-EMAIL-AQUI';

-- 4. Verificar
SELECT 
  u.email, 
  t.name AS tenant,
  t.primary_color
FROM public.users u
JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'SEU-EMAIL-AQUI';

-- Deve retornar: email | MetaLife Pilates | #10B981
```

---

### 4️⃣ REINICIAR SERVIDOR LOCAL

```bash
# Pare o servidor (Ctrl+C)
# Reinicie:
npm run dev
```

---

### 5️⃣ TESTAR

1. Acesse: http://localhost:5173/
2. Faça login
3. Deve aparecer:
   - WorkspaceSwitcher no header (Prospecção Brasil)
   - Logo/iniciais do MetaLife
   - Todas as rotas funcionando

---

## ⚠️ SE AINDA DER ERRO 404

Execute esta correção no SQL Editor:

```sql
-- Recriar a tabela users manualmente
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  default_workspace_id UUID REFERENCES public.workspaces(id),
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_users_workspace ON public.users(default_workspace_id);
CREATE INDEX idx_users_email ON public.users(email);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Migrar usuários de auth.users
INSERT INTO public.users (id, email, full_name)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT * FROM public.users;
```

---

## 🎯 RESUMO

**Problema:** Migrations não executadas  
**Solução:** Executar 5 migrations no Supabase SQL Editor  
**Tempo:** 5 minutos  
**Resultado:** Plataforma 100% funcional  

---

## 📞 SE PRECISAR DE AJUDA

1. Verifique se as tabelas existem: **Table Editor** no Supabase
2. Verifique se usuário está associado ao tenant: Query SQL acima
3. Verifique logs do navegador: F12 → Console

**Quando tudo estiver OK, tela branca vai sumir e app vai carregar!** ✅

