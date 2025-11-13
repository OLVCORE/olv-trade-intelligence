# 🔐 VERIFICAR SECRETS DO APOLLO

## Se a Edge Function falhar, verifique se o APOLLO_API_KEY está configurado:

### **1. Verifique no Supabase Dashboard:**

1. Acesse: https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/settings/functions
2. Vá em: **Edge Functions** → **Secrets**
3. Verifique se existe: `APOLLO_API_KEY`

### **2. Se NÃO existir, adicione:**

```bash
npx supabase secrets set APOLLO_API_KEY=sua_chave_aqui
```

**Onde conseguir a chave:**
1. Acesse: https://app.apollo.io/settings/integrations/api
2. Copie sua API Key
3. Execute o comando acima

### **3. Depois de adicionar, faça redeploy:**

```bash
npx supabase functions deploy enrich-apollo-decisores
```

---

## 🧪 TESTAR MANUALMENTE (via Terminal):

```bash
curl -X POST https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/enrich-apollo-decisores \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "apollo_org_id": "5f7c8e9d2e1a3b4c5d6e7f8a"
  }'
```

Se retornar erro `401 Unauthorized`, falta configurar o SECRET.

---

## 📊 VERIFICAR LOGS DA EDGE FUNCTION:

1. Acesse: https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/logs/edge-functions
2. Selecione: `enrich-apollo-decisores`
3. Veja os erros em tempo real

---

## ✅ ALTERNATIVA: Adicionar decisores manualmente

Se o Apollo não funcionar agora, você pode:

1. Ir na página da empresa
2. Rolar até "Decisores"
3. Clicar em "Adicionar Decisor"
4. Preencher manualmente com dados do LinkedIn

Depois, quando o Apollo estiver funcionando, enriquece automaticamente!

