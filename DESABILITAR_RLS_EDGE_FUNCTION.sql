-- ============================================
-- DESABILITAR RLS PARA PERMITIR EDGE FUNCTION SALVAR
-- ============================================

-- 1. DESABILITAR RLS EM TODAS AS TABELAS RELACIONADAS
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE icp_analysis_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE decision_makers DISABLE ROW LEVEL SECURITY;
ALTER TABLE digital_presence DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR STATUS
SELECT 
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE tablename IN ('companies', 'icp_analysis_results', 'decision_makers', 'digital_presence')
ORDER BY tablename;

-- 3. DEPOIS DE TESTAR, VOCÊ PODE REABILITAR COM POLÍTICAS CORRETAS:
-- 
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "service_role_all" ON companies
--   FOR ALL TO service_role
--   USING (true)
--   WITH CHECK (true);
--
-- CREATE POLICY "authenticated_read_all" ON companies
--   FOR SELECT TO authenticated
--   USING (true);

