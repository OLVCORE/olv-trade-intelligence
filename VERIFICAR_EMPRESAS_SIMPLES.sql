-- VERIFICAÇÃO SIMPLES SEM RLS

-- 1. CONTAR TOTAL
SELECT COUNT(*) as total FROM companies;

-- 2. VER ÚLTIMAS 10
SELECT 
  name,
  cnpj,
  source_name,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 10;

-- 3. VER STATUS DE RLS
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'companies';

