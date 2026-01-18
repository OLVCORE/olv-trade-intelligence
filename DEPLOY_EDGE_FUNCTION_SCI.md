# 🚀 DEPLOY: Edge Function `strategic-intelligence-check`

## 🚨 PROBLEMA ATUAL

A edge function `strategic-intelligence-check` **não está deployada** no Supabase, causando erro CORS:

```
Access to fetch at 'https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/strategic-intelligence-check' from origin 'http://localhost:5174' has been blocked by CORS policy
```

## ✅ SOLUÇÃO: DEPLOY DA EDGE FUNCTION

### **PASSO 1: VERIFICAR SE A EDGE FUNCTION EXISTE LOCALMENTE**

A edge function está localizada em:
```
supabase/functions/strategic-intelligence-check/index.ts
```

### **PASSO 2: FAZER DEPLOY DA EDGE FUNCTION**

Execute o comando no terminal (na raiz do projeto):

```bash
supabase functions deploy strategic-intelligence-check
```

**OU** se estiver usando o Supabase CLI local:

```bash
cd supabase/functions
supabase functions deploy strategic-intelligence-check --project-ref kdalsopwfkrxiaxxophh
```

### **PASSO 3: VERIFICAR VARIÁVEIS DE AMBIENTE**

Após o deploy, configure a variável de ambiente `SERPER_API_KEY`:

1. **Ir para:** Supabase Dashboard → Edge Functions → `strategic-intelligence-check` → Settings
2. **Adicionar Secret:** `SERPER_API_KEY` com o valor da sua chave Serper

**OU** via CLI:

```bash
supabase secrets set SERPER_API_KEY=seu_token_aqui --project-ref kdalsopwfkrxiaxxophh
```

### **PASSO 4: TESTAR A EDGE FUNCTION**

Após o deploy, teste manualmente:

```bash
curl -X POST 'https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/strategic-intelligence-check' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "company_name": "Magerv Pilates Equipment Factory",
    "domain": "https://www.facebook.com/MagervPilatesFactory/"
  }'
```

### **PASSO 5: VERIFICAR LOGS**

Após o deploy, monitore os logs:

1. **Ir para:** Supabase Dashboard → Edge Functions → `strategic-intelligence-check` → Logs
2. **Testar novamente** na aplicação
3. **Verificar** se há erros nos logs

## 📋 CHECKLIST

- [ ] Edge function `strategic-intelligence-check` existe localmente
- [ ] Deploy executado com sucesso
- [ ] Variável `SERPER_API_KEY` configurada
- [ ] Teste manual bem-sucedido
- [ ] Logs sem erros
- [ ] CORS funcionando (sem erros de preflight)

## 🔍 DEBUGGING

Se ainda houver erro CORS após o deploy:

1. **Verificar se a edge function está respondendo:**
   ```bash
   curl -X OPTIONS 'https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/strategic-intelligence-check' \
     -H 'Origin: http://localhost:5174' \
     -v
   ```
   
   Deve retornar: `HTTP/2 200` com headers CORS

2. **Verificar se o método serve está correto:**
   A edge function deve ter no início:
   ```typescript
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
   ```

3. **Verificar logs do Supabase:**
   - Dashboard → Edge Functions → Logs
   - Procurar por erros relacionados ao OPTIONS
