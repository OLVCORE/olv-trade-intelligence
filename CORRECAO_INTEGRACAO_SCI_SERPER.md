# 🔧 CORREÇÃO: INTEGRAÇÃO SCI COM SERPER E SALVAMENTO DE RELATÓRIOS

## 🚨 PROBLEMAS IDENTIFICADOS

1. **Edge Function Incorreta:** O hook `useSimpleProductCheck` estava chamando `simple-totvs-check` (que não existe mais) em vez de `strategic-intelligence-check`
2. **Tabela Ausente:** A tabela `stc_verification_history` não estava sendo criada no banco de dados, causando erros 404
3. **Relatórios Não Salvos:** Os relatórios SCI não estavam sendo salvos automaticamente no banco de dados

## ✅ CORREÇÕES APLICADAS

### **1. Atualização do Hook `useSimpleProductCheck.ts`**
- ✅ Atualizado para chamar `strategic-intelligence-check` em vez de `simple-totvs-check`
- ✅ Implementado salvamento automático de relatórios SCI no banco de dados
- ✅ Estrutura de salvamento ajustada para incluir `full_report` com `detection_report`

### **2. Criação da Migration `20260117000000_ensure_stc_verification_history.sql`**
- ✅ Migration criada para garantir a existência da tabela `stc_verification_history`
- ✅ Tabela criada com todas as colunas necessárias:
  - `id`, `company_id`, `company_name`, `cnpj`
  - `status`, `confidence`
  - `triple_matches`, `double_matches`, `single_matches`, `total_score`
  - `evidences`, `full_report`
  - `sources_consulted`, `queries_executed`, `verification_duration_ms`
  - `verified_by`, `created_at`, `updated_at`
- ✅ Índices criados para performance
- ✅ Políticas RLS configuradas para acesso autenticado

## 📋 PRÓXIMOS PASSOS (AÇÃO NECESSÁRIA)

### **PASSO 1: APLICAR MIGRATION NO SUPABASE**

1. **Abrir Supabase Dashboard:** https://supabase.com/dashboard
2. **Ir para:** Project → SQL Editor
3. **New Query**
4. **Copiar TODO o conteúdo de:** `supabase/migrations/20260117000000_ensure_stc_verification_history.sql`
5. **Colar no SQL Editor**
6. **Clicar em RUN** (botão verde)
7. **Aguardar até ver:** `✅ MIGRATION CONCLUÍDA COM SUCESSO!`

### **PASSO 2: VERIFICAR EDGE FUNCTION**

A edge function `strategic-intelligence-check` deve estar:
- ✅ Deployada no Supabase
- ✅ Com a variável de ambiente `SERPER_API_KEY` configurada

**Para verificar:**
1. **Ir para:** Supabase Dashboard → Edge Functions
2. **Verificar se `strategic-intelligence-check` existe**
3. **Se não existir, fazer deploy:**
   ```bash
   supabase functions deploy strategic-intelligence-check
   ```

### **PASSO 3: TESTAR A INTEGRAÇÃO**

1. **Abrir a aplicação:** `http://localhost:5174`
2. **Ir para:** ICP Quarantine
3. **Selecionar uma empresa**
4. **Clicar em "SCI - Strategic Intelligence"** (ou "Verificar Agora" na aba Strategic Intelligence)
5. **Verificar no console:**
   - ✅ `[HOOK] Chamando strategic-intelligence-check...`
   - ✅ `[SCI] ✅ Relatório SCI salvo no histórico. ID: ...`
6. **Verificar se os dados aparecem na aba Strategic Intelligence**

## 📝 NOTAS IMPORTANTES

- **Serper API:** A edge function `strategic-intelligence-check` usa a API Serper para buscar em 47 fontes globais
- **Salvamento Automático:** Relatórios são salvos automaticamente em `stc_verification_history` após cada verificação
- **Persistência:** Relatórios salvos podem ser recuperados posteriormente sem consumir créditos da API Serper
- **Formato do Relatório:** O relatório completo é salvo em `full_report.detection_report` no banco de dados

## 🔍 DEBUGGING

Se ainda houver erros:

1. **Verificar console do navegador:**
   - Procurar por `[HOOK]` e `[SCI]` nos logs
   - Verificar erros de CORS ou 404

2. **Verificar Edge Function logs:**
   - Supabase Dashboard → Edge Functions → `strategic-intelligence-check` → Logs
   - Verificar se a `SERPER_API_KEY` está configurada

3. **Verificar banco de dados:**
   - Supabase Dashboard → Table Editor → `stc_verification_history`
   - Verificar se a tabela existe e se há dados sendo inseridos
