-- ============================================
-- FIX: DESABILITAR RLS TEMPORARIAMENTE + VERIFICAR EMPRESAS
-- ============================================

-- 1. DESABILITAR RLS NA TABELA COMPANIES (TEMPORÁRIO PARA TESTES)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR SE AS EMPRESAS EXISTEM
SELECT 
  COUNT(*) as total_empresas,
  COUNT(CASE WHEN source_name IS NOT NULL THEN 1 END) as com_rastreabilidade,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as importadas_ultima_hora
FROM companies;

-- 3. VER ÚLTIMAS EMPRESAS IMPORTADAS
SELECT 
  id,
  name,
  cnpj,
  source_name,
  import_batch_id,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 20;

-- 4. VERIFICAR ESTRUTURA DA TABELA
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('created_by', 'user_id', 'owner_id', 'created_at')
ORDER BY ordinal_position;

-- 5. SE QUISER ADICIONAR COLUNA created_by NO FUTURO:
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
-- CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);

-- 6. REABILITAR RLS COM POLÍTICA CORRETA (DEPOIS DE ADICIONAR created_by)
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "users_see_own_companies" ON companies FOR SELECT USING (created_by = auth.uid());
-- CREATE POLICY "users_insert_own_companies" ON companies FOR INSERT WITH CHECK (created_by = auth.uid());

