-- ============================================================================
-- ATUALIZAR EMPRESAS EXISTENTES COM NOVOS CAMPOS + LINKEDIN
-- ============================================================================
-- Este SQL atualiza as 30 empresas existentes sem deletar nada!
-- ============================================================================

DO $$ 
DECLARE
  v_tenant_id UUID := '2afccefc-011a-4fb4-98e1-c47994b6f137';
  v_count INTEGER;
BEGIN
  RAISE NOTICE '🔧 INICIANDO ATUALIZAÇÃO DAS EMPRESAS EXISTENTES...';
  
  -- PASSO 1: Adicionar campos novos (se não existirem)
  RAISE NOTICE '📦 Passo 1: Adicionando novos campos...';
  
  ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS enrichment_source TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ DEFAULT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_companies_enrichment_source 
  ON public.companies(enrichment_source);
  
  RAISE NOTICE '✅ Campos adicionados com sucesso!';
  
  -- PASSO 2: Adicionar LinkedIn para todas as 30 empresas
  RAISE NOTICE '📦 Passo 2: Adicionando LinkedIn URLs...';
  
  -- TOP 15 PILATES DEALERS
  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/balanced-body',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/balanced-body"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Balanced Body';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/merrithew',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/merrithew"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Merrithew STOTT Pilates';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/elina-pilates',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/elina-pilates"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Elina Pilates';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/gratz-industries',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/gratz-industries"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Gratz Industries';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/peak-pilates',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/peak-pilates"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Peak Pilates';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/align-pilates',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/align-pilates"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Align-Pilates';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/pepilates',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/pepilates"')
  WHERE tenant_id = v_tenant_id AND company_name = 'P.E.Pilates';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/jaaleefit',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/jaaleefit"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Jaalee Fit';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/wellreformer',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/wellreformer"')
  WHERE tenant_id = v_tenant_id AND company_name = 'WellReformer';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/aeropilates',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/aeropilates"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Aero Pilates';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/pilates-mad',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/pilates-mad"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Pilates-Mad';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/empower-pilates',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/empower-pilates"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Empower Pilates';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/pilates-international',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/pilates-international"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Pilates International';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/studio-pilates-international',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/studio-pilates-international"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Studio Pilates International';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/active-and-agile',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/active-and-agile"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Active & Agile';

  -- TOP 15 FITNESS DISTRIBUTORS
  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/body-solid-inc',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/body-solid-inc"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Body-Solid Inc';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/jordan-fitness',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/jordan-fitness"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Jordan Fitness';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/athleticum',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/athleticum"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Athleticum Fitness';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/sport-tiedje',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/sport-tiedje"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Sport-Tiedje';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/fitness-depot',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/fitness-depot"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Fitness Depot';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/tonic-performance',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/tonic-performance"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Tonic Performance';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/escape-fitness',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/escape-fitness"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Escape Fitness';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/metflex-fitness',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/metflex-fitness"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Metflex';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/gofitstrength',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/gofitstrength"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Gofitstrength';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/expert-fitness-supply',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/expert-fitness-supply"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Expert Fitness Supply';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/cunruope',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/cunruope"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Cunruope';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/fitness-concept-singapore',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/fitness-concept-singapore"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Fitness Concept';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/fitness-zone-mexico',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/fitness-zone-mexico"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Fitness Zone Mexico';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/sport-systems',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/sport-systems"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Sport Systems';

  UPDATE public.companies SET 
    linkedin_url = 'https://www.linkedin.com/company/sportlife-chile',
    raw_data = jsonb_set(COALESCE(raw_data, '{}'::jsonb), '{linkedin_url}', '"https://www.linkedin.com/company/sportlife-chile"')
  WHERE tenant_id = v_tenant_id AND company_name = 'Sportlife Chile';
  
  -- Contar quantas empresas foram atualizadas
  SELECT COUNT(*) INTO v_count
  FROM public.companies
  WHERE tenant_id = v_tenant_id
    AND linkedin_url IS NOT NULL;
  
  RAISE NOTICE '✅ LinkedIn adicionado! Total de empresas com LinkedIn: %', v_count;
  
  RAISE NOTICE '🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Fazer hard refresh na página /companies (Ctrl+Shift+R)';
  RAISE NOTICE '2. Clicar no botão "✨ Auto-Enriquecer Todas"';
  RAISE NOTICE '3. Aguardar processamento (~30-60 segundos)';
  RAISE NOTICE '4. Expandir cards → Apollo + Decisores aparecerão!';
  
END $$;

-- ============================================================================
-- VERIFICAR RESULTADO
-- ============================================================================

SELECT 
  company_name,
  country,
  CASE WHEN linkedin_url IS NOT NULL THEN '✅' ELSE '❌' END as tem_linkedin,
  CASE WHEN apollo_id IS NOT NULL THEN '✅' ELSE '❌' END as tem_apollo,
  enrichment_source,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as num_decisores
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
ORDER BY company_name
LIMIT 30;

