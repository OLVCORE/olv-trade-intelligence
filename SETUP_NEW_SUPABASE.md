# 🚀 SETUP NOVO PROJETO SUPABASE - qjymxswxphxkjbtrjymu

## 1️⃣ ATUALIZAR `.env.local`

Abra `C:\Projects\olv-trade-intelligence\.env.local` e substitua:

```env
VITE_SUPABASE_URL=https://qjymxswxphxkjbtrjymu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqeW14c3d4cGh4a2pidHJqeW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MzEwOTYsImV4cCI6MjA3ODQwNzA5Nn0.1111111111111111111111111111111111111111111111111111111111111111
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqeW14c3d4cGh4a2pidHJqeW11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMTA5NiwiZXhwIjoyMDc4NDA3MDk2fQ.2222222222222222222222222222222222222222222222222222222222222222

# Outras chaves necessárias
VITE_APOLLO_API_KEY=seu_apollo_key
VITE_OPENAI_API_KEY=seu_openai_key
VITE_FREIGHTOS_API_KEY=seu_freightos_key
VITE_SERPER_API_KEY=seu_serper_key
```

---

## 2️⃣ EXECUTAR MIGRATIONS SQL (EM ORDEM!)

**Acesse:** https://app.supabase.com/project/qjymxswxphxkjbtrjymu/sql

Execute cada migration **NA ORDEM EXATA:**

### **Migration 1: Multi-Tenant Setup (FIXED)**
📄 Arquivo: `supabase/migrations/20251111000000_multi_tenant_setup_FIXED.sql`

**Copie TODO o conteúdo → Cole no SQL Editor → Clique "Run"**

### **Migration 2: Commercial Proposals**
📄 Arquivo: `supabase/migrations/20251111000001_commercial_proposals.sql`

**Copie TODO o conteúdo → Cole → Run**

### **Migration 3: Tenant Branding**
📄 Arquivo: `supabase/migrations/20251111000002_tenant_branding.sql`

**Copie TODO o conteúdo → Cole → Run**

### **Migration 4: Dealer Relationship Management**
📄 Arquivo: `supabase/migrations/20251111000003_dealer_relationship_management.sql`

**Copie TODO o conteúdo → Cole → Run**

---

## 3️⃣ CRIAR USUÁRIO NO AUTHENTICATION

**Acesse:** https://app.supabase.com/project/qjymxswxphxkjbtrjymu/auth/users

1. Clique **"Add user"**
2. **Email:** `metalife@olvinternacional.com.br`
3. **Senha:** `metalife#olv2025`
4. ✅ Marque **"Auto Confirm User"**
5. Clique **"Create user"**

---

## 4️⃣ ASSOCIAR USUÁRIO AO TENANT METALIFE

No **SQL Editor**, execute:

```sql
-- 1. Buscar ID do MetaLife
SELECT id FROM public.tenants WHERE slug = 'metalife';
-- Copie o UUID retornado

-- 2. Buscar ID do workspace "Export - Global"
SELECT id FROM public.workspaces WHERE type = 'export';
-- Copie o UUID retornado

-- 3. Associar usuário (substitua os UUIDs pelos copiados)
UPDATE public.users
SET 
  tenant_id = '<UUID_DO_METALIFE>',
  default_workspace_id = '<UUID_DO_EXPORT_WORKSPACE>'
WHERE email = 'metalife@olvinternacional.com.br';
```

---

## 5️⃣ REINICIAR SERVIDOR E TESTAR

```powershell
cd C:\Projects\olv-trade-intelligence
npm run dev
```

Acesse: http://localhost:5173/login

**Login:**
- Email: `metalife@olvinternacional.com.br`
- Senha: `metalife#olv2025`

---

## 6️⃣ VERIFICAR FILTROS B2B CLICÁVEIS

Após login, acesse: http://localhost:5173/export-dealers

**Você deve ver:**
- ✅ Card verde com checkboxes INCLUIR
- ❌ Card verde com checkboxes EXCLUIR
- 📊 Contador de keywords
- 🎯 Todas as checkboxes clicáveis

---

## 7️⃣ DEPLOY DAS EDGE FUNCTIONS (OPCIONAL)

Se quiser testar com Apollo.io real:

```powershell
cd C:\Projects\olv-trade-intelligence
npx supabase functions deploy discover-dealers-b2b --project-ref qjymxswxphxkjbtrjymu
```

---

## ✅ CHECKLIST FINAL

- [ ] `.env.local` atualizado com novas chaves
- [ ] 4 migrations executadas em ordem
- [ ] Usuário criado no Authentication
- [ ] Usuário associado ao tenant MetaLife
- [ ] Servidor rodando (`npm run dev`)
- [ ] Login funcionando
- [ ] Filtros B2B clicáveis aparecendo
- [ ] Edge Functions deployed (opcional)

---

**ME AVISE QUANDO COMPLETAR O SETUP!** 🚀

