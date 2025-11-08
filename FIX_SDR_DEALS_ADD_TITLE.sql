-- ========================================
-- FIX CRÍTICO: Adicionar coluna 'title' na tabela sdr_deals
-- ========================================
-- Erro: "Could not find the 'title' column of 'sdr_deals' in the schema cache"
-- Solução: Adicionar a coluna title (obrigatória para criar deals)
-- ========================================

-- 1. Adicionar coluna 'title' se não existir
ALTER TABLE sdr_deals 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Novo Deal';

-- 2. Remover o default após adicionar (para forçar preenchimento futuro)
ALTER TABLE sdr_deals 
ALTER COLUMN title DROP DEFAULT;

-- 3. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- ========================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ========================================

