# 🧪 TESTAR EDGE FUNCTION APOLLO

## ❌ PROBLEMA ATUAL:
```
Failed to send a request to the Edge Function
```

## ✅ SOLUÇÕES:

### **SOLUÇÃO 1: Executar SQL primeiro (OBRIGATÓRIO)**

**Por quê?** As empresas ainda não têm LinkedIn/Apollo no banco. O SQL adiciona esses dados.

1. Abra **Supabase SQL Editor**
2. Copie e cole todo o conteúdo de `EXECUTAR_TUDO_SEQUENCIAL.sql`
3. Execute (Run)
4. Aguarde as 3 mensagens:
   - ✅ [PASSO 1] LinkedIn e Apollo adicionados!
   - ✅ [PASSO 2] Decisores adicionados!
   - ✅ [PASSO 3] raw_data atualizado!

### **SOLUÇÃO 2: Verificar se Edge Function está deployada**

```bash
# No terminal do projeto:
cd C:\Projects\olv-trade-intelligence
npx supabase functions deploy enrich-apollo-decisores
```

### **SOLUÇÃO 3: Testar Edge Function manualmente**

```bash
# Testar no terminal:
curl -X POST https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/enrich-apollo-decisores \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "apollo_org_id": "5f7c8e9d2e1a3b4c5d6e7f8a",
    "company_id": "ID_DA_BALANCED_BODY"
  }'
```

### **SOLUÇÃO 4: Usar "Apollo ID Manual" ao invés de "Ações em Massa"**

Se o enriquecimento em massa continuar falhando:

1. Clique em **"Apollo ID Manual"** (no topo da página)
2. Cole o Apollo Organization ID da empresa
3. Teste com uma empresa por vez

---

## 🎯 ORDEM DE EXECUÇÃO:

1. ✅ **PRIMEIRO:** Execute `EXECUTAR_TUDO_SEQUENCIAL.sql`
2. ✅ **SEGUNDO:** Recarregue a página (`Ctrl+Shift+R`)
3. ✅ **TERCEIRO:** Expanda "Balanced Body" - deve mostrar LinkedIn/Apollo/Decisores
4. ❌ **Se NÃO aparecer:** Faça redeploy da Edge Function (Solução 2)

---

## 📊 VERIFICAR SE FUNCIONOU:

Após executar o SQL, rode no Supabase:

```sql
SELECT 
  company_name,
  linkedin_url,
  apollo_id,
  raw_data->>'linkedin_url' as raw_linkedin,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as total_decisores
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND company_name IN ('Balanced Body', 'Merrithew STOTT Pilates')
ORDER BY company_name;
```

**Resultado esperado:**
```
company_name          | linkedin_url                                | apollo_id               | total_decisores
----------------------+---------------------------------------------+-------------------------+----------------
Balanced Body         | https://www.linkedin.com/company/balanced-body | 5f7c8e9d2e1a3b4c5d6e7f8a | 3
Merrithew STOTT       | https://www.linkedin.com/company/merrithew     | 5f7c8e9d2e1a3b4c5d6e7f8b | 3
```

