-- ========================================
-- 🚨 EXECUTAR AGORA NO SUPABASE SQL EDITOR
-- ========================================
-- COPIE E COLE ESTE SCRIPT (SEM OS DADOS ANTIGOS)
-- Dashboard → SQL Editor → New Query → Cole aqui → RUN
-- ========================================

-- PASSO 1: Drop tabela antiga (está corrompida)
DROP TABLE IF EXISTS stc_verification_history CASCADE;
DROP TABLE IF EXISTS stc_verification_history_backup CASCADE;
DROP TABLE IF EXISTS stc_verification_history_backup_20251107 CASCADE;

-- PASSO 2: Criar tabela NOVA com schema CORRETO
CREATE TABLE stc_verification_history (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    
    -- Resultados da verificação
    status TEXT NOT NULL,
    confidence TEXT DEFAULT 'medium',
    
    -- Métricas de matches
    triple_matches INTEGER DEFAULT 0,
    double_matches INTEGER DEFAULT 0,
    single_matches INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    
    -- Evidências e dados brutos
    evidences JSONB DEFAULT '[]'::jsonb,
    full_report JSONB DEFAULT '{}'::jsonb,
    
    -- Metadados de execução
    sources_consulted INTEGER DEFAULT 0,
    queries_executed INTEGER DEFAULT 0,
    verification_duration_ms INTEGER,
    
    -- Auditoria
    verified_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 3: Criar índices
CREATE INDEX idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX idx_stc_history_created ON stc_verification_history(created_at DESC);
CREATE INDEX idx_stc_history_company_created ON stc_verification_history(company_id, created_at DESC);
CREATE INDEX idx_stc_history_full_report ON stc_verification_history USING GIN (full_report);

-- PASSO 4: RLS Policies
ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated to update stc history" 
ON stc_verification_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- PASSO 5: Comentários
COMMENT ON TABLE stc_verification_history IS 'Histórico completo de todas as verificações STC (TOTVS Check)';
COMMENT ON COLUMN stc_verification_history.status IS 'Status: go (prospect) | no-go (cliente) | revisar (incerto)';
COMMENT ON COLUMN stc_verification_history.confidence IS 'Confiança: high | medium | low';
COMMENT ON COLUMN stc_verification_history.triple_matches IS 'Empresa + TOTVS + Produto';
COMMENT ON COLUMN stc_verification_history.double_matches IS 'Empresa + TOTVS';
COMMENT ON COLUMN stc_verification_history.single_matches IS 'Apenas Empresa ou TOTVS';
COMMENT ON COLUMN stc_verification_history.full_report IS 'Relatório completo JSONB (detection + decisors + digital)';

-- PASSO 6: Forçar reload do schema cache
NOTIFY pgrst, 'reload schema';

-- PASSO 7: VALIDAÇÃO FINAL
SELECT 
    '=== ✅ TABELA CRIADA COM SUCESSO! ===' AS resultado,
    COUNT(*) AS total_colunas
FROM information_schema.columns
WHERE table_name = 'stc_verification_history';

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stc_verification_history'
ORDER BY ordinal_position;

