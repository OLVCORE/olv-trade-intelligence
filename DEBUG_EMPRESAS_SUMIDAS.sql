-- VERIFICAR SE AS EMPRESAS FORAM REALMENTE SALVAS

-- 1. CONTAR EMPRESAS NA TABELA
SELECT COUNT(*) as total_empresas FROM companies;

-- 2. VER ÚLTIMAS EMPRESAS IMPORTADAS
SELECT 
  id,
  name,
  company_name,
  cnpj,
  source_name,
  import_date,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 10;

-- 3. VERIFICAR RLS (ROW LEVEL SECURITY)
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'companies';

-- 4. VER POLÍTICAS DE RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'companies';

-- 5. VERIFICAR SE USER TEM ACESSO
SELECT 
  auth.uid() as current_user_id,
  (SELECT COUNT(*) FROM companies) as total_empresas,
  (SELECT COUNT(*) FROM companies WHERE created_by = auth.uid()) as minhas_empresas;

