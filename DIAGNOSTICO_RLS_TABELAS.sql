-- ============================================================================
-- DIAGNÓSTICO: IDENTIFICAR TABELAS SEM RLS
-- ============================================================================
-- Execute este script ANTES da migration para verificar o status atual
-- ============================================================================

-- 1. LISTAR TODAS AS TABELAS PÚBLICAS E STATUS DE RLS
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS DESABILITADO'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY rowsecurity DESC, tablename;

-- 2. TABELAS SEM RLS HABILITADO
-- ============================================================================

SELECT 
  tablename,
  '❌ SEM RLS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
ORDER BY tablename;

-- 3. TABELAS COM RLS MAS SEM POLÍTICAS
-- ============================================================================

SELECT 
  t.tablename,
  '⚠️ RLS habilitado mas SEM políticas' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- 4. VERIFICAR ESTRUTURA DAS TABELAS (tenant_id, company_id)
-- ============================================================================

SELECT 
  t.tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t.tablename
        AND column_name = 'tenant_id'
    ) THEN '✅ Tem tenant_id'
    ELSE ''
  END as has_tenant_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t.tablename
        AND column_name = 'company_id'
    ) THEN '✅ Tem company_id'
    ELSE ''
  END as has_company_id,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t.tablename
        AND column_name = 'tenant_id'
    ) THEN 'Padrão A (tenant_id)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t.tablename
        AND column_name = 'company_id'
    ) THEN 'Padrão B (company_id)'
    ELSE 'Padrão C (global)'
  END as rls_pattern
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = false
ORDER BY t.tablename;

-- 5. LISTAR TODAS AS POLÍTICAS RLS EXISTENTES
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd as operation, -- SELECT, INSERT, UPDATE, DELETE, ALL
  CASE
    WHEN qual IS NOT NULL THEN 'Tem USING clause'
    ELSE 'Sem USING clause'
  END as has_using,
  CASE
    WHEN with_check IS NOT NULL THEN 'Tem WITH CHECK clause'
    ELSE 'Sem WITH CHECK clause'
  END as has_with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. CONTAGEM GERAL
-- ============================================================================

SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as tables_without_rls,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tables_with_policies;

-- 7. TABELAS QUE PRECISAM DE ATENÇÃO ESPECIAL
-- ============================================================================

-- Tabelas com RLS habilitado mas sem políticas (vulneráveis!)
SELECT 
  t.tablename,
  'CRÍTICO: RLS habilitado mas SEM políticas - tabela totalmente bloqueada!' as issue
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- 8. VERIFICAR SE TABELAS TÊM ÍNDICES EM tenant_id (performance)
-- ============================================================================

SELECT 
  t.tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = t.tablename
        AND indexdef LIKE '%tenant_id%'
    ) THEN '✅ Tem índice em tenant_id'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t.tablename
        AND column_name = 'tenant_id'
    ) THEN '⚠️ Tem tenant_id mas SEM índice'
    ELSE ''
  END as tenant_id_index_status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = t.tablename
      AND column_name = 'tenant_id'
  )
ORDER BY t.tablename;

-- ============================================================================
-- EXECUTAR APÓS A MIGRATION PARA VALIDAÇÃO
-- ============================================================================

-- Verificar que todas as tabelas têm RLS:
-- SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
-- Resultado esperado: 0 (ou apenas views)

-- Verificar que todas as tabelas com RLS têm políticas:
-- SELECT COUNT(*) FROM (
--   SELECT t.tablename
--   FROM pg_tables t
--   WHERE t.schemaname = 'public' AND t.rowsecurity = true
--     AND NOT EXISTS (
--       SELECT 1 FROM pg_policies p
--       WHERE p.schemaname = 'public' AND p.tablename = t.tablename
--     )
-- ) as missing_policies;
-- Resultado esperado: 0

