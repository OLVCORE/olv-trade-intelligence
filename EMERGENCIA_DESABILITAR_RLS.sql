-- ============================================================================
-- EMERGÊNCIA: Desabilitar RLS temporariamente para testar
-- CUIDADO: Isso remove segurança! Use apenas para desenvolvimento!
-- ============================================================================

-- Desabilitar RLS na tabela companies
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'companies';

-- Testar query
SELECT id, name, cnpj FROM companies LIMIT 5;

