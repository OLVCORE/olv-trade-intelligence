-- ============================================================================
-- ATUALIZAR raw_data COM DECISORES PARA APARECER NO CARD
-- ============================================================================

DO $$ 
DECLARE
  v_company RECORD;
  v_decisores JSONB;
BEGIN
  RAISE NOTICE '🔄 Atualizando raw_data com decisores...';

  -- PARA CADA EMPRESA COM DECISORES
  FOR v_company IN 
    SELECT 
      c.id,
      c.company_name,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'name', dm.full_name,
          'title', dm.position,
          'email', dm.email,
          'linkedin_url', dm.linkedin_url,
          'seniority', dm.seniority_level
        )
      ) as decisores_json
    FROM public.companies c
    INNER JOIN public.decision_makers dm ON dm.company_id = c.id
    WHERE c.tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
      AND dm.data_source = 'apollo'
    GROUP BY c.id, c.company_name
  LOOP
    -- ATUALIZAR raw_data
    UPDATE public.companies
    SET raw_data = jsonb_set(
      COALESCE(raw_data, '{}'::jsonb),
      '{decision_makers}',
      v_company.decisores_json
    )
    WHERE id = v_company.id;
    
    RAISE NOTICE '✅ Decisores adicionados ao raw_data: %', v_company.company_name;
  END LOOP;

  RAISE NOTICE '🎉 raw_data atualizado com decisores!';
END $$;

-- VERIFICAR RESULTADO
SELECT 
  company_name,
  linkedin_url,
  raw_data->>'linkedin_url' as raw_linkedin,
  JSONB_ARRAY_LENGTH(raw_data->'decision_makers') as total_decisores_raw_data,
  (raw_data->'decision_makers'->0->>'name') as primeiro_decisor
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND raw_data->'decision_makers' IS NOT NULL
ORDER BY company_name;

