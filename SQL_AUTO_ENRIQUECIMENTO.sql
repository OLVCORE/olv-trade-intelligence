-- ============================================================================
-- SQL: ADICIONAR CAMPOS PARA AUTO-ENRIQUECIMENTO
-- ============================================================================

-- Adicionar campos para rastrear origem do enriquecimento
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ DEFAULT NULL;

-- Criar índice para buscar empresas não enriquecidas rapidamente
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_source 
ON public.companies(enrichment_source);

-- Comentários dos campos
COMMENT ON COLUMN public.companies.enrichment_source IS 
  'Origem do enriquecimento: NULL (não enriquecido), auto (automático), manual (validado pelo usuário)';

COMMENT ON COLUMN public.companies.enriched_at IS 
  'Data/hora do último enriquecimento (auto ou manual)';

-- ============================================================================
-- VERIFICAR EMPRESAS QUE PRECISAM DE ENRIQUECIMENTO
-- ============================================================================

-- Empresas SEM Apollo (nunca enriquecidas)
SELECT 
  id,
  company_name,
  city,
  country,
  website,
  enrichment_source,
  'Nunca enriquecida' as status
FROM public.companies
WHERE apollo_id IS NULL
  AND enrichment_source IS NULL
ORDER BY company_name
LIMIT 20;

-- Empresas com Apollo AUTO (podem ser re-enriquecidas se necessário)
SELECT 
  id,
  company_name,
  city,
  country,
  apollo_id,
  enrichment_source,
  enriched_at,
  'Auto-enriquecida - pode refinar' as status
FROM public.companies
WHERE enrichment_source = 'auto'
ORDER BY enriched_at DESC
LIMIT 20;

-- Empresas com Apollo MANUAL (NÃO re-enriquecer automaticamente!)
SELECT 
  id,
  company_name,
  city,
  country,
  apollo_id,
  enrichment_source,
  enriched_at,
  'Validada manualmente - NÃO sobrescrever' as status
FROM public.companies
WHERE enrichment_source = 'manual'
ORDER BY enriched_at DESC
LIMIT 20;

-- ============================================================================
-- ESTATÍSTICAS DE ENRIQUECIMENTO
-- ============================================================================

SELECT 
  COALESCE(enrichment_source, 'não_enriquecido') as origem,
  COUNT(*) as total_empresas,
  COUNT(DISTINCT apollo_id) as com_apollo,
  COUNT(DISTINCT linkedin_url) as com_linkedin,
  AVG(JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb))) as media_decisores
FROM public.companies
GROUP BY enrichment_source
ORDER BY 
  CASE enrichment_source
    WHEN 'manual' THEN 1
    WHEN 'auto' THEN 2
    ELSE 3
  END;

-- ============================================================================
-- FUNÇÕES ÚTEIS
-- ============================================================================

-- Resetar empresas AUTO para re-enriquecer
-- ⚠️ CUIDADO: Isso permite re-processar empresas que foram auto-enriquecidas
/*
UPDATE public.companies
SET 
  enrichment_source = NULL,
  enriched_at = NULL
WHERE enrichment_source = 'auto'
  AND company_name = 'Nome da Empresa'; -- Especificar empresa
*/

-- Marcar empresa como MANUAL (proteger contra sobrescrita automática)
/*
UPDATE public.companies
SET 
  enrichment_source = 'manual',
  enriched_at = NOW()
WHERE id = 'company-id-here';
*/

-- Buscar empresas duplicadas (mesmo nome + cidade)
SELECT 
  company_name,
  city,
  country,
  COUNT(*) as duplicatas,
  ARRAY_AGG(id) as company_ids
FROM public.companies
WHERE company_name IS NOT NULL
GROUP BY company_name, city, country
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

