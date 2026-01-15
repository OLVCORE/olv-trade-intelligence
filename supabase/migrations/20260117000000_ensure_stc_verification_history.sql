-- ========================================
-- MIGRATION: GARANTIR EXISTÊNCIA DE stc_verification_history
-- OBJETIVO: Garantir que a tabela existe para armazenar relatórios SCI
-- ========================================

-- Criar tabela apenas se não existir
CREATE TABLE IF NOT EXISTS stc_verification_history (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    
    -- Resultados da verificação
    status TEXT NOT NULL DEFAULT 'unknown',
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
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices apenas se não existirem
CREATE INDEX IF NOT EXISTS idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX IF NOT EXISTS idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX IF NOT EXISTS idx_stc_history_created ON stc_verification_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stc_history_company_created ON stc_verification_history(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stc_history_full_report ON stc_verification_history USING GIN (full_report);

-- Habilitar RLS
ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow authenticated to view stc history" ON stc_verification_history;
DROP POLICY IF EXISTS "Allow authenticated to insert stc history" ON stc_verification_history;
DROP POLICY IF EXISTS "Allow authenticated to update stc history" ON stc_verification_history;

-- Criar políticas RLS
CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated to update stc history" 
ON stc_verification_history FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Comentários
COMMENT ON TABLE stc_verification_history IS 'Histórico completo de todas as verificações SCI (Strategic Commercial Intelligence) realizadas';
COMMENT ON COLUMN stc_verification_history.status IS 'Status da verificação: hot_lead, warm_lead, cold_lead, unknown';
COMMENT ON COLUMN stc_verification_history.confidence IS 'Nível de confiança: high, medium, low';
COMMENT ON COLUMN stc_verification_history.evidences IS 'Array de evidências encontradas (snippets, URLs)';
COMMENT ON COLUMN stc_verification_history.full_report IS 'Relatório completo SCI para reabertura sem consumir créditos';

-- Forçar refresh do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
