# 🚀 DEPLOY URGENTE - Edge Function discover-dealers-b2b

## 🚨 PROBLEMA:
A função `discover-dealers-b2b` NÃO está deployada no Supabase, por isso está dando erro CORS.

---

## ✅ SOLUÇÃO 1: Deploy via Supabase CLI (Recomendado)

### **Passo 1: Instalar Supabase CLI** (se não tiver)
```powershell
# Windows (PowerShell como Admin)
scoop install supabase

# Ou via npm
npm install -g supabase
```

### **Passo 2: Login no Supabase**
```powershell
cd C:\Projects\olv-trade-intelligence
supabase login
```

### **Passo 3: Link com o projeto**
```powershell
supabase link --project-ref kdalsopwfkrxiaxxophh
```

### **Passo 4: Deploy da função**
```powershell
supabase functions deploy discover-dealers-b2b
```

**Tempo:** ~2-3 minutos

---

## ✅ SOLUÇÃO 2: Deploy Manual (Copiar e Colar)

### **Passo 1: Acesse o Supabase Dashboard**
https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/functions

### **Passo 2: Clique em "New Function"**

### **Passo 3: Preencha:**
- **Name:** `discover-dealers-b2b`
- **Handler:** Cole TODO o conteúdo de:
  `C:\Projects\olv-trade-intelligence\supabase\functions\discover-dealers-b2b\index.ts`

### **Passo 4: Configure Secrets**

Vá em: https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/settings/vault/secrets

Adicione:
- **APOLLO_API_KEY** = (sua chave Apollo)

### **Passo 5: Deploy**
Clique em "Deploy"

**Tempo:** ~5 minutos

---

## ✅ SOLUÇÃO 3: Deploy Todas as Funções de Uma Vez

Se você quer garantir que TODAS as Edge Functions estejam deployadas:

```powershell
cd C:\Projects\olv-trade-intelligence

# Deploy TODAS as funções
supabase functions deploy
```

**Tempo:** ~10-15 minutos (vai deployar ~100 funções)

---

## 🎯 RECOMENDAÇÃO PARA DEMO AMANHÃ:

### **AGORA (Hoje à noite):**
✅ **Deploy apenas a função necessária:**
```powershell
supabase functions deploy discover-dealers-b2b
```

### **Verificar se funcionou:**
1. Aguarde 2-3 minutos após deploy
2. Refresh a página do frontend (Ctrl+Shift+R)
3. Tente fazer busca novamente
4. Deve funcionar!

---

## 📋 CHECKLIST PÓS-DEPLOY:

- [ ] Função deployada (ver no dashboard Supabase)
- [ ] APOLLO_API_KEY configurado nos secrets
- [ ] Teste busca no frontend
- [ ] Salvar 5-10 dealers
- [ ] Gerar 1 proposta

---

## 🔧 SE AINDA DER ERRO:

### **Erro: "APOLLO_API_KEY não configurado"**
**Solução:** Adicionar chave nos Secrets do Supabase

### **Erro: "Failed to fetch"**
**Solução:** Aguardar 2-3 minutos (propagação)

### **Erro: "Invalid API Key"**
**Solução:** Verificar se a chave Apollo está correta

---

## 📞 APÓS O DEPLOY:

**ME AVISE:** "Deploy feito!" 

Eu te ajudo a testar a busca e preparar os dados para amanhã! 🚀

