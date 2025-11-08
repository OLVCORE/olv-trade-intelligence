-- ========================================
-- MIGRAR AS 7 EMPRESAS DESCARTADAS ATUAIS
-- ========================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- Executa DEPOIS do TRIGGER_AUTO_DISCARD.sql
-- ========================================

-- PASSO 1: Garantir constraint UNIQUE (se ainda não existe)
ALTER TABLE discarded_companies
  DROP CONSTRAINT IF EXISTS discarded_companies_cnpj_key;

ALTER TABLE discarded_companies
  ADD CONSTRAINT discarded_companies_cnpj_key UNIQUE (cnpj);

SELECT '=== ✅ Constraint UNIQUE em CNPJ criada! ===' AS passo1;

-- PASSO 2: Migrar empresas que já estão com status='descartada'
INSERT INTO discarded_companies (
  company_id,
  company_name,
  cnpj,
  discard_reason_id,
  discard_reason_label,
  discard_category,
  stc_status,
  stc_confidence,
  stc_triple_matches,
  stc_double_matches,
  stc_total_score,
  original_icp_score,
  original_icp_temperature,
  discarded_at
)
SELECT 
  iar.company_id,
  iar.razao_social,
  iar.cnpj,
  'migrated_from_quarantine',
  'Migrado automaticamente (estava descartada na quarentena)',
  'other',
  svh.status,
  svh.confidence,
  svh.triple_matches,
  svh.double_matches,
  svh.total_score,
  iar.icp_score,
  iar.temperatura,
  COALESCE(iar.updated_at, iar.created_at) -- Usar data de update ou criação
FROM icp_analysis_results iar
LEFT JOIN stc_verification_history svh ON svh.cnpj = iar.cnpj
WHERE iar.status = 'descartada'
ON CONFLICT (cnpj) DO NOTHING; -- Evita duplicatas

-- Contar quantas foram migradas
SELECT 
  '=== ✅ MIGRAÇÃO CONCLUÍDA! ===' AS resultado,
  COUNT(*) as empresas_migradas
FROM discarded_companies;

-- Mostrar as empresas migradas
SELECT 
  company_name,
  cnpj,
  discard_reason_label,
  stc_status,
  stc_triple_matches,
  discarded_at
FROM discarded_companies
ORDER BY discarded_at DESC;

