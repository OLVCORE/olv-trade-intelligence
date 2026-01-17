-- ============================================================================
-- CORREÇÃO: Constraints CNPJ para Suportar Empresas Internacionais
-- ============================================================================
-- Purpose: Remover constraints UNIQUE no CNPJ que impedem empresas internacionais
-- Date: 2026-01-16
-- ============================================================================
-- 
-- PROBLEMA:
-- - Constraint UNIQUE no CNPJ impede múltiplas empresas internacionais (CNPJ = NULL)
-- - Empresas internacionais não têm CNPJ, então todas teriam CNPJ = NULL
-- - PostgreSQL permite múltiplos NULLs em UNIQUE, mas a constraint pode causar confusão
--
-- SOLUÇÃO:
-- - Remover constraint UNIQUE do CNPJ em icp_analysis_results
-- - Remover constraint UNIQUE do CNPJ em leads_pool (se existir)
-- - Manter constraint UNIQUE apenas para CNPJ não-nulo (via índice parcial)
-- ============================================================================

-- 1. Remover constraint UNIQUE do CNPJ em icp_analysis_results
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'icp_analysis_results_cnpj_unique'
  ) THEN
    ALTER TABLE public.icp_analysis_results
    DROP CONSTRAINT icp_analysis_results_cnpj_unique;
    
    RAISE NOTICE 'Constraint icp_analysis_results_cnpj_unique removida';
  END IF;
END $$;

-- 2. Criar índice parcial UNIQUE apenas para CNPJ não-nulo (evita duplicatas brasileiras)
-- Isso permite múltiplos NULLs (empresas internacionais) mas mantém unicidade para CNPJs brasileiros
CREATE UNIQUE INDEX IF NOT EXISTS idx_icp_analysis_results_cnpj_unique_not_null
  ON public.icp_analysis_results(cnpj)
  WHERE cnpj IS NOT NULL;

-- 3. Remover constraint UNIQUE do CNPJ em leads_pool (se existir)
-- ⚠️ Verificar se a coluna cnpj existe antes de tentar remover constraint
DO $$
BEGIN
  -- Verificar se a coluna cnpj existe na tabela leads_pool
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'cnpj'
  ) THEN
    -- Remover constraint se existir
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'leads_pool_cnpj_unique'
    ) THEN
      ALTER TABLE public.leads_pool
      DROP CONSTRAINT leads_pool_cnpj_unique;
      
      RAISE NOTICE 'Constraint leads_pool_cnpj_unique removida';
    END IF;
    
    -- Criar índice parcial UNIQUE apenas para CNPJ não-nulo em leads_pool
    CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_pool_cnpj_unique_not_null
      ON public.leads_pool(cnpj)
      WHERE cnpj IS NOT NULL;
      
    RAISE NOTICE 'Índice parcial UNIQUE criado para leads_pool.cnpj';
  ELSE
    RAISE NOTICE 'Coluna cnpj não existe em leads_pool - pulando correções';
  END IF;
END $$;

-- 5. Verificar e remover outras constraints UNIQUE problemáticas
DO $$
BEGIN
  -- Remover constraint de companies se existir (já deve ter sido removida em migration anterior)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'companies_cnpj_unique'
  ) THEN
    ALTER TABLE public.companies
    DROP CONSTRAINT companies_cnpj_unique;
    
    RAISE NOTICE 'Constraint companies_cnpj_unique removida';
  END IF;
END $$;

-- 6. Criar índice parcial UNIQUE apenas para CNPJ não-nulo em companies
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_cnpj_unique_not_null
  ON public.companies(cnpj)
  WHERE cnpj IS NOT NULL;

-- ============================================================================
-- RESULTADO:
-- ✅ Múltiplas empresas internacionais podem ter CNPJ = NULL
-- ✅ Empresas brasileiras ainda têm unicidade garantida (CNPJ único)
-- ✅ Não há mais conflitos ao inserir empresas internacionais
-- ============================================================================
