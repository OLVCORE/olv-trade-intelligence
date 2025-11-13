-- ============================================================================
-- EXECUTAR AGORA - ORDEM EXATA
-- ============================================================================
-- Copie TODO este arquivo e execute NO SUPABASE SQL EDITOR
-- ============================================================================

-- PASSO 1: DELETAR DECISORES FICTÍCIOS
DO $$ 
BEGIN
  RAISE NOTICE '🗑️ [PASSO 1] Deletando decisores fictícios...';

  DELETE FROM public.decision_makers
  WHERE company_id IN (
    SELECT id FROM public.companies 
    WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  )
  AND (
    full_name IN ('Ken Endelman', 'Sarah Mitchell', 'David Chen', 
                  'Lindsay Merrithew', 'Moira Stott Merrithew', 'James Rodriguez',
                  'Michael Johnson', 'Emily Watson', 
                  'John Siebert', 'Robert Martinez')
  );

  UPDATE public.companies
  SET raw_data = raw_data - 'decision_makers'
  WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
    AND data_source = 'dealer_discovery';

  RAISE NOTICE '✅ [PASSO 1] Decisores fictícios removidos!';
END $$;

-- PASSO 2: ADICIONAR LINKEDIN PARA TODAS AS 30 EMPRESAS
DO $$ 
DECLARE
  v_tenant_id UUID := '2afccefc-011a-4fb4-98e1-c47994b6f137';
BEGIN
  RAISE NOTICE '🔗 [PASSO 2] Adicionando LinkedIn...';

  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/balanced-body', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/balanced-body"') WHERE tenant_id = v_tenant_id AND company_name = 'Balanced Body';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/merrithew', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/merrithew"') WHERE tenant_id = v_tenant_id AND company_name = 'Merrithew STOTT Pilates';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/elina-pilates', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/elina-pilates"') WHERE tenant_id = v_tenant_id AND company_name = 'Elina Pilates';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/gratz-industries', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/gratz-industries"') WHERE tenant_id = v_tenant_id AND company_name = 'Gratz Industries';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/peak-pilates', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/peak-pilates"') WHERE tenant_id = v_tenant_id AND company_name = 'Peak Pilates';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/align-pilates', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/align-pilates"') WHERE tenant_id = v_tenant_id AND company_name = 'Align-Pilates';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/pepilates', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/pepilates"') WHERE tenant_id = v_tenant_id AND company_name = 'P.E.Pilates';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/jaaleefit', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/jaaleefit"') WHERE tenant_id = v_tenant_id AND company_name = 'Jaalee Fit';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/wellreformer', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/wellreformer"') WHERE tenant_id = v_tenant_id AND company_name = 'WellReformer';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/aeropilates', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/aeropilates"') WHERE tenant_id = v_tenant_id AND company_name = 'Aero Pilates';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/pilates-mad', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/pilates-mad"') WHERE tenant_id = v_tenant_id AND company_name = 'Pilates-Mad';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/empower-pilates', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/empower-pilates"') WHERE tenant_id = v_tenant_id AND company_name = 'Empower Pilates';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/pilates-international', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/pilates-international"') WHERE tenant_id = v_tenant_id AND company_name = 'Pilates International';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/studio-pilates-international', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/studio-pilates-international"') WHERE tenant_id = v_tenant_id AND company_name = 'Studio Pilates International';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/active-agile', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/active-agile"') WHERE tenant_id = v_tenant_id AND company_name = 'Active & Agile';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/body-solid', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/body-solid"') WHERE tenant_id = v_tenant_id AND company_name = 'Body-Solid Inc';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/jordan-fitness', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/jordan-fitness"') WHERE tenant_id = v_tenant_id AND company_name = 'Jordan Fitness';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/athleticum-fitness', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/athleticum-fitness"') WHERE tenant_id = v_tenant_id AND company_name = 'Athleticum Fitness';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/sport-tiedje', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/sport-tiedje"') WHERE tenant_id = v_tenant_id AND company_name = 'Sport-Tiedje';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/fitness-depot', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/fitness-depot"') WHERE tenant_id = v_tenant_id AND company_name = 'Fitness Depot';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/tonic-performance', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/tonic-performance"') WHERE tenant_id = v_tenant_id AND company_name = 'Tonic Performance';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/escape-fitness', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/escape-fitness"') WHERE tenant_id = v_tenant_id AND company_name = 'Escape Fitness';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/metflex', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/metflex"') WHERE tenant_id = v_tenant_id AND company_name = 'Metflex';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/gofitstrength', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/gofitstrength"') WHERE tenant_id = v_tenant_id AND company_name = 'Gofitstrength';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/expert-fitness-supply', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/expert-fitness-supply"') WHERE tenant_id = v_tenant_id AND company_name = 'Expert Fitness Supply';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/cunruope', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/cunruope"') WHERE tenant_id = v_tenant_id AND company_name = 'Cunruope';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/fitness-concept', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/fitness-concept"') WHERE tenant_id = v_tenant_id AND company_name = 'Fitness Concept';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/fitness-zone-mexico', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/fitness-zone-mexico"') WHERE tenant_id = v_tenant_id AND company_name = 'Fitness Zone Mexico';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/sport-systems', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/sport-systems"') WHERE tenant_id = v_tenant_id AND company_name = 'Sport Systems';
  UPDATE public.companies SET linkedin_url = 'https://www.linkedin.com/company/sportlife-chile', raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/sportlife-chile"') WHERE tenant_id = v_tenant_id AND company_name = 'Sportlife Chile';

  RAISE NOTICE '✅ [PASSO 2] LinkedIn adicionado em TODAS as 30!';
END $$;

-- VERIFICAÇÃO FINAL
SELECT 
  company_name,
  country,
  city,
  state,
  website,
  linkedin_url,
  apollo_id,
  data_source,
  (raw_data->>'fit_score')::integer as fit_score,
  raw_data->>'type' as tipo,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as decisores
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND data_source = 'dealer_discovery'
ORDER BY (raw_data->>'fit_score')::integer DESC, company_name;

