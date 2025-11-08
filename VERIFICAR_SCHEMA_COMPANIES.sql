-- ============================================================================
-- VERIFICAR SCHEMA DA TABELA companies
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Ver todas as colunas da tabela companies
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- 2. Ver 1 registro de exemplo para entender a estrutura
SELECT * FROM companies LIMIT 1;

