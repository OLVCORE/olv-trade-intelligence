-- DESABILITAR RLS APENAS NAS TABELAS QUE EXISTEM

ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS icp_analysis_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS decision_makers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sdr_deals DISABLE ROW LEVEL SECURITY;

-- VERIFICAR STATUS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('companies', 'icp_analysis_results', 'decision_makers', 'sdr_deals')
  AND schemaname = 'public'
ORDER BY tablename;

