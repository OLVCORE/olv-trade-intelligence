-- ============================================================================
-- DELETAR DECISORES FICTÍCIOS - MANTER APENAS ESTRUTURA VAZIA
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🗑️ Deletando decisores fictícios (Ken, Sarah, David, etc.)...';

  -- DELETAR TODOS os decisores fictícios que EU criei
  DELETE FROM public.decision_makers
  WHERE company_id IN (
    SELECT id FROM public.companies 
    WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  )
  AND data_source = 'apollo' -- Os fictícios que eu criei
  AND email LIKE '%@balancedbody.com' 
     OR email LIKE '%@merrithew.com'
     OR email LIKE '%@peakpilates.com'
     OR email LIKE '%@bodysolid.com';

  -- LIMPAR decision_makers de raw_data também
  UPDATE public.companies
  SET raw_data = raw_data - 'decision_makers'
  WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
    AND data_source = 'dealer_discovery';

  RAISE NOTICE '✅ Decisores fictícios removidos! Estrutura limpa para Apollo REAL.';
END $$;

-- VERIFICAR LIMPEZA
SELECT 
  company_name,
  linkedin_url,
  apollo_id,
  (raw_data->>'fit_score')::integer as fit_score,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as decisores_ficticios
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND data_source = 'dealer_discovery'
ORDER BY company_name
LIMIT 10;

