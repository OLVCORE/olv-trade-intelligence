# 🚨 GUIA URGENTE - APLICAR MIGRATIONS NO SUPABASE

## PROBLEMA: Tabelas não existem no banco remoto!

**Erros:** 404 em `icp_analysis_results` e `sdr_notifications`  
**Causa:** Migrations locais não foram aplicadas no Supabase  
**Impacto:** Análise ICP não funciona, Quarentena vazia

---

## ⚡ SOLUÇÃO IMEDIATA (2 OPÇÕES)

### OPÇÃO A: Via SQL Editor (MAIS RÁPIDO - 5 minutos) ✅

#### 1. Acessar SQL Editor:
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new

#### 2. Executar Migration icp_analysis_results:

```sql
-- Tabela icp_analysis_results
CREATE TABLE IF NOT EXISTS public.icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados básicos da empresa
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  domain TEXT,
  website TEXT,
  
  -- Resultado da análise
  icp_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente', -- pendente, approved, rejected
  temperatura TEXT, -- hot, warm, cold
  
  -- Dados enriquecidos
  setor TEXT,
  uf TEXT,
  regiao TEXT,
  cidade TEXT,
  porte TEXT,
  faixa_funcionarios TEXT,
  
  -- Análise TOTVS Check
  is_totvs_client BOOLEAN DEFAULT false,
  totvs_confidence INTEGER DEFAULT 0,
  totvs_products TEXT[],
  
  -- Relatório completo (JSON)
  full_report JSONB,
  
  -- Metadados
  batch_id UUID,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_analysis_company_id ON public.icp_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_user_id ON public.icp_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_score ON public.icp_analysis_results(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_batch_id ON public.icp_analysis_results(batch_id);

-- Enable RLS
ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see their own analysis"
ON public.icp_analysis_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis"
ON public.icp_analysis_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis"
ON public.icp_analysis_results
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis"
ON public.icp_analysis_results
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_icp_analysis_results_updated_at
BEFORE UPDATE ON public.icp_analysis_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Executar Migration sdr_notifications:

```sql
-- Tabela sdr_notifications  
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- deal_update, task_due, email_received, etc
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info', -- info, warning, error, success
  
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados contextuais
  entity_type TEXT, -- deal, company, lead, etc
  entity_id UUID,
  action_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_user_id ON public.sdr_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_read ON public.sdr_notifications(read);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_created_at ON public.sdr_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.sdr_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see their own notifications"
ON public.sdr_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.sdr_notifications
FOR INSERT
WITH CHECK (true); -- Sistema pode inserir para qualquer usuário

CREATE POLICY "Users can update their own notifications"
ON public.sdr_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.sdr_notifications
FOR DELETE
USING (auth.uid() = user_id);
```

#### 4. Clique em "RUN" para executar cada SQL

#### 5. Verificar criação:
```sql
-- Verificar se tabelas foram criadas:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('icp_analysis_results', 'sdr_notifications');
```

**Deve retornar 2 linhas!** ✅

---

### OPÇÃO B: Via Supabase CLI (5-10 minutos)

```bash
# 1. Voltar para diretório do projeto
cd C:\Projects\olv-intelligence-prospect-v2

# 2. Temporariamente mover .env.local
Move-Item .env.local .env.local.temp

# 3. Aplicar migrations
supabase db push --project-ref qtcwetabhhkhvomcrqgm

# 4. Restaurar .env.local
Move-Item .env.local.temp .env.local

# 5. Verificar
supabase db remote inspect
```

---

## 🔐 AÇÃO DE SEGURANÇA CRÍTICA

### ⚠️ VOCÊ PRECISA REVOGAR A CHAVE COMPROMETIDA!

**Acesse AGORA:**  
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/api

**Passos:**
1. Role até "Service Role Key"
2. Clique em "Reset service_role key"
3. **COPIE A NOVA CHAVE**
4. Atualize `.env.local` local
5. Atualize Vercel (se usando SERVICE_ROLE lá)

**⚠️ A chave antiga está exposta no GitHub público!**

---

## 📋 VERIFICAÇÃO PÓS-CORREÇÃO

### Após aplicar migrations, testar:

1. **Upload CSV novamente:**
   - Deve mapear colunas ✅
   - Clicar "Confirmar e Analisar"
   - Aguardar processamento (30s-1min)

2. **Verificar Quarentena:**
   - Ir para "Empresas em Quarentena"
   - Deve mostrar as 30 empresas
   - Com scores calculados
   - Aprovadas/Descartadas funcionando

3. **Verificar Dashboard:**
   - Deve mostrar estatísticas
   - Gráficos funcionando
   - Números reais (não zero)

---

## 🎯 RESUMO DAS AÇÕES

```
┌─────────────────────────────────────────────────┐
│  AÇÕES URGENTES (EXECUTAR AGORA):              │
│                                                  │
│  1. 🔴 Revogar Service Role Key (Supabase)     │
│  2. ⚡ Aplicar migrations (SQL Editor)          │
│  3. 🔄 Redeploy Vercel                          │
│  4. ✅ Testar upload CSV novamente              │
│                                                  │
│  TEMPO TOTAL: 10-15 minutos                    │
└─────────────────────────────────────────────────┘
```

---

**Assinado:**  
🤖 Chief Engineer  
🚨 Prioridade: URGENTE  
📅 04 nov 2025

