-- ============================================================================
-- EXECUTAR ENRIQUECIMENTO AUTOMÁTICO PARA TODAS AS 30 EMPRESAS
-- ============================================================================
-- Este SQL simula o que a Edge Function fará automaticamente
-- ============================================================================

-- INSTRUÇÕES PARA VOCÊ:
-- 1. Execute DELETAR_DECISORES_FICTICIOS.sql primeiro
-- 2. Execute ADICIONAR_LINKEDIN_TODAS_30_EMPRESAS.sql segundo
-- 3. NÃO execute este SQL - use a interface!

-- COMO ENRIQUECER AUTOMATICAMENTE (VIA INTERFACE):

-- OPÇÃO A: Uma por vez (RECOMENDADO):
-- 1. Vá em /companies
-- 2. Clique no nome da empresa (ex: "Fitness Depot")
-- 3. Clique em "Apollo ID Manual"
-- 4. Cole o Organization ID ou URL do Apollo
-- 5. A Edge Function vai:
--    ✅ Buscar TODOS os colaboradores (até 100)
--    ✅ Filtrar automaticamente (CEO > VP > Directors > Managers)
--    ✅ Salvar top 5 decisores
--    ✅ Atualizar description (real do Apollo)
--    ✅ Atualizar industry (real do Apollo)
--    ✅ Salvar apollo_id e linkedin_url

-- OPÇÃO B: Em massa (CUIDADO - gasta créditos):
-- 1. Vá em /companies
-- 2. Selecione 5 empresas
-- 3. Clique "Ações em Massa" → "Enriquecer Apollo"
-- 4. Aguarde o processo (1-2min por empresa)

-- ⚠️ IMPORTANTE:
-- - Cada busca Apollo consome ~1-2 créditos
-- - Priorize as top 10 empresas (Fit Score > 80)
-- - Deixe as outras para enriquecer conforme necessidade

-- VERIFICAR QUAIS EMPRESAS PRECISAM ENRIQUECIMENTO:
SELECT 
  company_name,
  country,
  city,
  website,
  linkedin_url,
  apollo_id,
  (raw_data->>'fit_score')::integer as fit_score,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as decisores
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND data_source = 'dealer_discovery'
  AND (
    apollo_id IS NULL 
    OR JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) = 0
  )
ORDER BY (raw_data->>'fit_score')::integer DESC
LIMIT 30;

-- PRIORIDADE DE ENRIQUECIMENTO (TOP 10):
-- 1. Balanced Body (95) - JÁ TEM
-- 2. Merrithew STOTT (95) - JÁ TEM
-- 3. Elina Pilates (95) - ← PRÓXIMA
-- 4. Gratz Industries (95) - ← PRÓXIMA
-- 5. Peak Pilates (90) - ← PRÓXIMA
-- 6. Align-Pilates (90)
-- 7. P.E.Pilates (85)
-- 8. Jaalee Fit (85)
-- 9. WellReformer (85)
-- 10. Aero Pilates (85)

