-- ============================================================================
-- LIMPEZA: Remover registros órfãos da quarentena ICP
-- ============================================================================
-- Purpose: Remover registros sem user_id que estão causando falsos positivos
-- Date: 2026-01-16
-- ============================================================================
-- 
-- PROBLEMA:
-- - Registros órfãos (sem user_id) estão sendo encontrados na verificação de duplicatas
-- - Mas não aparecem na query da Quarentena devido à RLS (que exige user_id = auth.uid())
-- - Isso causa falsos positivos: toast diz "já está na quarentena" mas não aparece
--
-- SOLUÇÃO:
-- - Remover registros órfãos (sem user_id) que não podem ser visualizados de qualquer forma
-- - Adicionar constraint para garantir que novos registros sempre tenham user_id
-- ============================================================================

-- 1. Verificar quantos registros órfãos existem
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.icp_analysis_results
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Registros órfãos encontrados: %', orphan_count;
END $$;

-- 2. Remover registros órfãos (sem user_id)
-- ⚠️ ATENÇÃO: Estes registros não podem ser visualizados de qualquer forma devido à RLS
-- Portanto, é seguro removê-los
DELETE FROM public.icp_analysis_results
WHERE user_id IS NULL;

-- 3. Verificar registros com user_id mas sem tenant_id/workspace_id
-- Estes podem ser corrigidos se necessário, mas não bloqueiam a visualização
DO $$
DECLARE
  missing_tenant_count INTEGER;
  missing_workspace_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_tenant_count
  FROM public.icp_analysis_results
  WHERE user_id IS NOT NULL AND tenant_id IS NULL;
  
  SELECT COUNT(*) INTO missing_workspace_count
  FROM public.icp_analysis_results
  WHERE user_id IS NOT NULL AND workspace_id IS NULL;
  
  RAISE NOTICE 'Registros sem tenant_id: %', missing_tenant_count;
  RAISE NOTICE 'Registros sem workspace_id: %', missing_workspace_count;
END $$;

-- 4. Adicionar constraint para garantir que novos registros sempre tenham user_id
-- ⚠️ Isso previne criação de novos registros órfãos
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'icp_analysis_results_user_id_not_null'
  ) THEN
    ALTER TABLE public.icp_analysis_results
    ADD CONSTRAINT icp_analysis_results_user_id_not_null 
    CHECK (user_id IS NOT NULL);
    
    RAISE NOTICE 'Constraint user_id NOT NULL adicionada';
  ELSE
    RAISE NOTICE 'Constraint user_id NOT NULL já existe';
  END IF;
END $$;

-- ============================================================================
-- RESULTADO:
-- ✅ Registros órfãos removidos
-- ✅ Constraint adicionada para prevenir novos registros órfãos
-- ✅ Falsos positivos de "já está na quarentena" devem desaparecer
-- ============================================================================
