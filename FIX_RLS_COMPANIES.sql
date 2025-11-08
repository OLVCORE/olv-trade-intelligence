-- ============================================================================
-- FIX: Corrigir RLS da tabela companies para permitir leitura
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Verificar policies existentes
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'companies';

-- 2. DESABILITAR RLS temporariamente para testar (CUIDADO!)
-- ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLICY PERMISSIVA para authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read companies" ON companies;
CREATE POLICY "Allow authenticated users to read companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
CREATE POLICY "Allow authenticated users to insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;
CREATE POLICY "Allow authenticated users to update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true);

-- 4. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'companies';

-- 5. Testar query manualmente
SELECT * FROM companies LIMIT 1;

