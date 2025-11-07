-- FIX: Garantir que stc_verification_history tem TODAS as colunas necessárias
-- PROBLEMA: PGRST204 - Schema cache não encontrava confidence/double_matches

-- Remover coluna confidence se existir (para recriar com constraint correto)
ALTER TABLE stc_verification_history 
DROP COLUMN IF EXISTS confidence CASCADE;

-- Adicionar confidence com valor padrão
ALTER TABLE stc_verification_history 
ADD COLUMN confidence TEXT DEFAULT 'medium';

-- Garantir que double_matches existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stc_verification_history' 
        AND column_name = 'double_matches'
    ) THEN
        ALTER TABLE stc_verification_history 
        ADD COLUMN double_matches INTEGER DEFAULT 0;
    END IF;
END $$;

-- Garantir que triple_matches existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stc_verification_history' 
        AND column_name = 'triple_matches'
    ) THEN
        ALTER TABLE stc_verification_history 
        ADD COLUMN triple_matches INTEGER DEFAULT 0;
    END IF;
END $$;

-- Garantir que single_matches existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stc_verification_history' 
        AND column_name = 'single_matches'
    ) THEN
        ALTER TABLE stc_verification_history 
        ADD COLUMN single_matches INTEGER DEFAULT 0;
    END IF;
END $$;

-- Forçar refresh do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN stc_verification_history.confidence IS 'Nível de confiança da verificação (high/medium/low)';
COMMENT ON COLUMN stc_verification_history.double_matches IS 'Número de matches duplos (Empresa + TOTVS)';
COMMENT ON COLUMN stc_verification_history.triple_matches IS 'Número de matches triplos (Empresa + TOTVS + Produto)';

