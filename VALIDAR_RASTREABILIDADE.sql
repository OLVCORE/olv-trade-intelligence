-- ============================================
-- VALIDAÇÃO COMPLETA DE RASTREABILIDADE
-- ============================================

-- 1. VER EMPRESAS IMPORTADAS COM ORIGEM
SELECT 
  company_name,
  source_name,
  source_type,
  import_batch_id,
  import_date,
  created_at
FROM companies
ORDER BY import_date DESC
LIMIT 20;

-- 2. CONTAR POR ORIGEM
SELECT 
  source_name,
  COUNT(*) as total_empresas,
  MIN(import_date) as primeira_importacao,
  MAX(import_date) as ultima_importacao
FROM companies
WHERE source_name IS NOT NULL
GROUP BY source_name
ORDER BY total_empresas DESC;

-- 3. VERIFICAR SE EMPRESAS ESTÃO NA QUARENTENA
SELECT 
  c.company_name,
  c.source_name,
  icp.status,
  icp.source_name as icp_source_name,
  icp.created_at
FROM companies c
LEFT JOIN icp_analysis_results icp ON c.id = icp.company_id
ORDER BY c.created_at DESC
LIMIT 20;

-- 4. CONTAR STATUS NA QUARENTENA
SELECT 
  status,
  source_name,
  COUNT(*) as total
FROM icp_analysis_results
WHERE source_name IS NOT NULL
GROUP BY status, source_name
ORDER BY source_name, status;

-- 5. VERIFICAR BATCH ID
SELECT 
  import_batch_id,
  source_name,
  COUNT(*) as empresas_no_lote,
  MIN(created_at) as inicio,
  MAX(created_at) as fim
FROM companies
WHERE import_batch_id IS NOT NULL
GROUP BY import_batch_id, source_name
ORDER BY inicio DESC;

