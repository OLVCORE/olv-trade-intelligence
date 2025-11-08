-- ========================================
-- TRIGGER: AUTO-MOVER EMPRESAS DESCARTADAS
-- ========================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- Quando empresa.status = 'descartada' → move para discarded_companies
-- ========================================

-- PASSO 1: Função que executa ao descartar empresa
CREATE OR REPLACE FUNCTION auto_move_to_discarded()
RETURNS TRIGGER AS $$
BEGIN
  -- Se mudou para 'descartada' e ainda não está em discarded_companies
  IF NEW.status = 'descartada' AND (OLD.status IS NULL OR OLD.status != 'descartada') THEN
    
    -- Buscar dados do STC se existir
    DECLARE
      stc_data RECORD;
    BEGIN
      SELECT status, triple_matches, double_matches, total_score
      INTO stc_data
      FROM stc_verification_history
      WHERE cnpj = NEW.cnpj
      ORDER BY created_at DESC
      LIMIT 1;
      
      -- Inserir em discarded_companies (se ainda não existe)
      INSERT INTO discarded_companies (
        company_id,
        company_name,
        cnpj,
        discard_reason_id,
        discard_reason_label,
        discard_category,
        stc_status,
        stc_triple_matches,
        stc_double_matches,
        stc_total_score,
        original_icp_score,
        original_icp_temperature,
        discarded_at
      )
      VALUES (
        NEW.company_id,
        NEW.razao_social,
        NEW.cnpj,
        'manual_discard',
        'Descartada manualmente pelo usuário',
        'other',
        stc_data.status,
        stc_data.triple_matches,
        stc_data.double_matches,
        stc_data.total_score,
        NEW.icp_score,
        NEW.temperatura,
        NOW()
      )
      ON CONFLICT (cnpj) DO NOTHING; -- Evita duplicatas
      
      RAISE NOTICE 'Empresa % movida para discarded_companies', NEW.razao_social;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 2: Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_discard ON icp_analysis_results;

CREATE TRIGGER trigger_auto_discard
  AFTER UPDATE OF status ON icp_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION auto_move_to_discarded();

-- PASSO 3: Trigger para RESTAURAR (quando status muda de 'descartada' para outro)
CREATE OR REPLACE FUNCTION auto_restore_from_discarded()
RETURNS TRIGGER AS $$
BEGIN
  -- Se estava 'descartada' e mudou para outro status
  IF OLD.status = 'descartada' AND NEW.status != 'descartada' THEN
    
    -- Remover de discarded_companies
    DELETE FROM discarded_companies
    WHERE cnpj = NEW.cnpj;
    
    RAISE NOTICE 'Empresa % removida de discarded_companies (restaurada)', NEW.razao_social;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_restore ON icp_analysis_results;

CREATE TRIGGER trigger_auto_restore
  AFTER UPDATE OF status ON icp_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION auto_restore_from_discarded();

-- PASSO 4: Validar
SELECT '=== ✅ TRIGGERS CRIADOS COM SUCESSO! ===' AS resultado;
SELECT 'TRIGGER 1: Descartar → move para discarded_companies' AS info1;
SELECT 'TRIGGER 2: Restaurar → remove de discarded_companies' AS info2;

