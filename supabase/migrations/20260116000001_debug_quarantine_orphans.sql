-- ============================================================================
-- DEBUG: Verificar registros órfãos na quarentena ICP
-- ============================================================================
-- Purpose: Identificar registros sem user_id que podem estar causando problemas
-- Date: 2026-01-16
-- ============================================================================

-- 1. Verificar registros sem user_id (órfãos)
SELECT 
  COUNT(*) as total_orphans,
  COUNT(DISTINCT company_id) as unique_companies
FROM public.icp_analysis_results
WHERE user_id IS NULL;

-- 2. Verificar registros por user_id (para diagnóstico)
SELECT 
  user_id,
  COUNT(*) as total_records,
  COUNT(DISTINCT company_id) as unique_companies
FROM public.icp_analysis_results
GROUP BY user_id
ORDER BY total_records DESC
LIMIT 10;

-- 3. Verificar registros com user_id mas sem tenant_id
SELECT 
  COUNT(*) as records_without_tenant
FROM public.icp_analysis_results
WHERE user_id IS NOT NULL 
  AND tenant_id IS NULL;

-- 4. Verificar registros com user_id mas sem workspace_id
SELECT 
  COUNT(*) as records_without_workspace
FROM public.icp_analysis_results
WHERE user_id IS NOT NULL 
  AND workspace_id IS NULL;
