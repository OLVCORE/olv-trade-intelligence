-- ============================================================================
-- SOLUÇÃO FINAL: Corrigir TODOS os erros restantes de uma vez
-- Copie e cole no Supabase Dashboard → SQL Editor → RUN
-- ============================================================================

-- 1. DESABILITAR RLS EM TODAS AS TABELAS PROBLEMÁTICAS (TEMPORÁRIO)
-- ----------------------------------------------------------------------------
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_pipeline_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE deal_health_scores DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR SE DEU CERTO
-- ----------------------------------------------------------------------------
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('companies', 'sdr_deals', 'sdr_pipeline_stages', 'deal_health_scores');

-- 3. VERIFICAR DADOS
-- ----------------------------------------------------------------------------
SELECT 'companies' as table_name, COUNT(*) as rows FROM companies
UNION ALL
SELECT 'sdr_deals', COUNT(*) FROM sdr_deals
UNION ALL
SELECT 'sdr_pipeline_stages', COUNT(*) FROM sdr_pipeline_stages
UNION ALL
SELECT 'deal_health_scores', COUNT(*) FROM deal_health_scores;

