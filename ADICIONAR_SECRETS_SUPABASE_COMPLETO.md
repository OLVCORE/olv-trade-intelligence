# 🔐 SECRETS SUPABASE - AÇÃO MANUAL NECESSÁRIA

**Status:** ⚠️ CRÍTICO - Edge Functions deployadas aguardando secrets  
**Tempo:** 5-10 minutos  
**Link:** https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/vault/secrets

---

## 📋 **SECRETS NECESSÁRIOS (8 TOTAL):**

### **✅ JÁ ADICIONADOS (confirmado pelo usuário):**
1. ✅ `RECEITAWS_API_TOKEN` (enriquecimento CNPJ)
2. ✅ `SERPER_API_KEY` (Google Search)
3. ✅ `JINA_API_KEY` (Scraping web)

---

### **⚠️ FALTAM ADICIONAR (5 secrets):**

#### **1. OPENAI_API_KEY** ⚠️ CRÍTICO
```
Nome: OPENAI_API_KEY
Valor: sk-proj-xxxxx... (sua chave OpenAI)
Usado por:
  - generate-product-gaps (Aba 7: Products)
  - stc-agent (Análises IA)
  - Outras análises inteligentes

SEM ESSA CHAVE: Aba Products NÃO funciona!
```

#### **2. HUNTER_API_KEY** ⚠️ NOVO
```
Nome: HUNTER_API_KEY
Valor: xxxxx... (sua chave Hunter.io)
Usado por:
  - hunter-email-verify (verificação de emails)
  - hunter-email-finder (busca de emails)
  - hunter-domain-search (descoberta de decisores)

SEM ESSA CHAVE: Aba 9 Decisores (emails) NÃO funciona!

Como obter:
1. Acessar: https://hunter.io/api_keys
2. Copiar sua API Key
3. Plano mínimo: Starter ($49/mês para 500 requests)
```

#### **3. PHANTOMBUSTER_API_KEY** ⚠️ NOVO
```
Nome: PHANTOMBUSTER_API_KEY
Valor: xxxxx... (sua chave PhantomBuster)
Usado por:
  - phantom-linkedin-decisors (extração de decisores)
  - phantom-linkedin-company (dados da empresa)

SEM ESSA CHAVE: Aba 9 Decisores (LinkedIn) NÃO funciona!

Como obter:
1. Acessar: https://phantombuster.com/api
2. Copiar sua API Key
3. Plano mínimo: Starter ($30/mês)
```

#### **4. LINKEDIN_SESSION_COOKIE** ⚠️ NOVO
```
Nome: LINKEDIN_SESSION_COOKIE
Valor: AQEDAS... (seu cookie de sessão LinkedIn)
Usado por:
  - phantom-linkedin-decisors (autenticação)
  - phantom-linkedin-company (autenticação)

SEM ESSE COOKIE: PhantomBuster NÃO funciona!

Como obter:
1. Fazer login no LinkedIn
2. Abrir DevTools (F12)
3. Aba "Application" → Cookies → linkedin.com
4. Copiar valor do cookie "li_at"
```

#### **5. PHANTOM_LINKEDIN_SEARCH_AGENT_ID** ⚠️ NOVO
```
Nome: PHANTOM_LINKEDIN_SEARCH_AGENT_ID
Valor: xxxxx (ID do agent configurado no PhantomBuster)
Usado por:
  - phantom-linkedin-decisors (agent de busca)

Como obter:
1. Acessar PhantomBuster Dashboard
2. Criar novo Agent: "LinkedIn People Search Export"
3. Copiar o ID do agent
```

#### **6. PHANTOM_LINKEDIN_COMPANY_AGENT_ID** ⚠️ NOVO
```
Nome: PHANTOM_LINKEDIN_COMPANY_AGENT_ID
Valor: xxxxx (ID do agent configurado no PhantomBuster)
Usado por:
  - phantom-linkedin-company (agent de empresa)

Como obter:
1. Acessar PhantomBuster Dashboard
2. Criar novo Agent: "LinkedIn Company Scraper"
3. Copiar o ID do agent
```

---

## 📊 **RESUMO DOS SECRETS:**

| Secret | Status | Criticidade | Usado em |
|--------|--------|-------------|----------|
| `RECEITAWS_API_TOKEN` | ✅ OK | Média | Enriquecimento CNPJ |
| `SERPER_API_KEY` | ✅ OK | Alta | Google Search (todas abas) |
| `JINA_API_KEY` | ✅ OK | Alta | SEO + Scraping |
| `OPENAI_API_KEY` | ⚠️ FALTA | CRÍTICA | Aba 7 Products |
| `HUNTER_API_KEY` | ⚠️ FALTA | Alta | Aba 9 Decisores (emails) |
| `PHANTOMBUSTER_API_KEY` | ⚠️ FALTA | Alta | Aba 9 Decisores (LinkedIn) |
| `LINKEDIN_SESSION_COOKIE` | ⚠️ FALTA | Alta | PhantomBuster auth |
| `PHANTOM_LINKEDIN_SEARCH_AGENT_ID` | ⚠️ FALTA | Média | Agent config |
| `PHANTOM_LINKEDIN_COMPANY_AGENT_ID` | ⚠️ FALTA | Média | Agent config |

---

## 🎯 **PASSO A PASSO:**

### **1. Acessar Supabase:**
```
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/vault/secrets
```

### **2. Adicionar cada secret:**
- Clicar em **"New Secret"**
- Nome: (copiar da lista acima)
- Value: (sua chave)
- Clicar **"Add Secret"**

### **3. Confirmar:**
Após adicionar, você verá:
```
✅ RECEITAWS_API_TOKEN
✅ SERPER_API_KEY
✅ JINA_API_KEY
✅ OPENAI_API_KEY ← NOVO
✅ HUNTER_API_KEY ← NOVO
✅ PHANTOMBUSTER_API_KEY ← NOVO
✅ LINKEDIN_SESSION_COOKIE ← NOVO
✅ PHANTOM_LINKEDIN_SEARCH_AGENT_ID ← NOVO
✅ PHANTOM_LINKEDIN_COMPANY_AGENT_ID ← NOVO
```

---

## ⏰ **TEMPO ESTIMADO:** 5-10 minutos

**Avise quando terminar para eu prosseguir com o teste!** ✅

