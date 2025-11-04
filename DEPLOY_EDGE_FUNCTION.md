# 🚀 DEPLOY DA EDGE FUNCTION icp-scraper-real

## ⚡ DEPLOY VIA SUPABASE DASHBOARD (5 MINUTOS)

### PASSO 1: ABRA O DASHBOARD
```
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
```

### PASSO 2: CLIQUE EM "Deploy a new function"

### PASSO 3: CONFIGURE:
- **Name:** `icp-scraper-real`
- **Region:** Choose automatic (ou us-east-1)

### PASSO 4: COLE O CÓDIGO
Copie TODO o conteúdo do arquivo:
```
supabase/functions/icp-scraper-real/index.ts
```

### PASSO 5: CONFIGURE VARIÁVEIS (SE NECESSÁRIO)
No Dashboard → Settings → Edge Functions → Environment Variables:

Adicione (se ainda não existirem):
- `OPENAI_API_KEY`
- `SERPER_API_KEY`
- `JINA_API_KEY`

### PASSO 6: CLIQUE "DEPLOY"

### PASSO 7: AGUARDE 30-60 SEGUNDOS

### PASSO 8: TESTAR
Volte para aplicação e faça upload novamente!

---

## 🔄 OU: DEPLOY VIA CLI (SE FUNCIONAR)

```bash
# Navegue para o diretório do projeto
cd C:\Projects\olv-intelligence-prospect-v2

# Deploy
supabase functions deploy icp-scraper-real --project-ref qtcwetabhhkhvomcrqgm

# Verificar
supabase functions list --project-ref qtcwetabhhkhvomcrqgm
```

---

## ✅ APÓS DEPLOY:

1. Volte para: `http://localhost:5175/central-icp/batch`
2. Pressione: `CTRL + SHIFT + R`
3. Faça upload do CSV novamente
4. Clique "Confirmar e Analisar"
5. DEVE FUNCIONAR! ✅

---

**🎯 RECOMENDAÇÃO: Use o Dashboard (Passo 1-8)**

