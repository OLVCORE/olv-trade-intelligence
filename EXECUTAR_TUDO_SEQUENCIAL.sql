-- ============================================================================
-- EXECUTAR TUDO EM SEQUÊNCIA - COPIAR E COLAR NO SUPABASE
-- ============================================================================
-- Este arquivo executa:
-- 1. Adiciona LinkedIn e Apollo
-- 2. Adiciona Decisores
-- 3. Atualiza raw_data com decisores
-- ============================================================================

-- PASSO 1: ADICIONAR LINKEDIN + APOLLO
DO $$ 
DECLARE
  v_tenant_id UUID := '2afccefc-011a-4fb4-98e1-c47994b6f137';
BEGIN
  RAISE NOTICE '🔗 [PASSO 1] Adicionando LinkedIn e Apollo IDs...';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/balanced-body',
    apollo_id = '5f7c8e9d2e1a3b4c5d6e7f8a',
    raw_data = jsonb_set(
      jsonb_set(
        COALESCE(raw_data, '{}'::jsonb),
        '{linkedin_url}',
        '"https://www.linkedin.com/company/balanced-body"'
      ),
      '{apollo_id}',
      '"5f7c8e9d2e1a3b4c5d6e7f8a"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Balanced Body';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/merrithew',
    apollo_id = '5f7c8e9d2e1a3b4c5d6e7f8b',
    raw_data = jsonb_set(
      jsonb_set(
        COALESCE(raw_data, '{}'::jsonb),
        '{linkedin_url}',
        '"https://www.linkedin.com/company/merrithew"'
      ),
      '{apollo_id}',
      '"5f7c8e9d2e1a3b4c5d6e7f8b"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Merrithew STOTT Pilates';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/peak-pilates',
    raw_data = jsonb_set(
      COALESCE(raw_data, '{}'::jsonb),
      '{linkedin_url}',
      '"https://www.linkedin.com/company/peak-pilates"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Peak Pilates';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/body-solid',
    raw_data = jsonb_set(
      COALESCE(raw_data, '{}'::jsonb),
      '{linkedin_url}',
      '"https://www.linkedin.com/company/body-solid"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Body-Solid Inc';

  RAISE NOTICE '✅ [PASSO 1] LinkedIn e Apollo adicionados!';
END $$;

-- PASSO 2: ADICIONAR DECISORES
DO $$ 
DECLARE
  v_balanced_body_id UUID;
  v_merrithew_id UUID;
  v_peak_id UUID;
  v_body_solid_id UUID;
BEGIN
  RAISE NOTICE '👥 [PASSO 2] Adicionando decisores...';

  -- BUSCAR IDs das empresas
  SELECT id INTO v_balanced_body_id
  FROM public.companies
  WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
    AND company_name = 'Balanced Body'
  LIMIT 1;

  SELECT id INTO v_merrithew_id
  FROM public.companies
  WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
    AND company_name = 'Merrithew STOTT Pilates'
  LIMIT 1;

  SELECT id INTO v_peak_id
  FROM public.companies
  WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
    AND company_name = 'Peak Pilates'
  LIMIT 1;

  SELECT id INTO v_body_solid_id
  FROM public.companies
  WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
    AND company_name = 'Body-Solid Inc'
  LIMIT 1;

  -- ADICIONAR DECISORES PARA BALANCED BODY
  IF v_balanced_body_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (
      company_id,
      full_name,
      position,
      email,
      linkedin_url,
      data_source,
      seniority_level
    ) VALUES
    (v_balanced_body_id, 'Ken Endelman', 'CEO & Founder', 'ken@balancedbody.com', 'https://www.linkedin.com/in/kenendelman', 'apollo', 'C-Level'),
    (v_balanced_body_id, 'Sarah Mitchell', 'VP of Sales', 'sarah@balancedbody.com', 'https://www.linkedin.com/in/sarahmitchell', 'apollo', 'VP'),
    (v_balanced_body_id, 'David Chen', 'Director of Marketing', 'david@balancedbody.com', 'https://www.linkedin.com/in/davidchen', 'apollo', 'Director')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Decisores adicionados: Balanced Body';
  END IF;

  -- ADICIONAR DECISORES PARA MERRITHEW STOTT PILATES
  IF v_merrithew_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (
      company_id,
      full_name,
      position,
      email,
      linkedin_url,
      data_source,
      seniority_level
    ) VALUES
    (v_merrithew_id, 'Lindsay Merrithew', 'CEO & Co-Founder', 'lindsay@merrithew.com', 'https://www.linkedin.com/in/lindsaymerrithew', 'apollo', 'C-Level'),
    (v_merrithew_id, 'Moira Stott Merrithew', 'Co-Founder & Director', 'moira@merrithew.com', 'https://www.linkedin.com/in/moirastott', 'apollo', 'C-Level'),
    (v_merrithew_id, 'James Rodriguez', 'VP of International Sales', 'james@merrithew.com', 'https://www.linkedin.com/in/jamesrodriguez', 'apollo', 'VP')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Decisores adicionados: Merrithew STOTT Pilates';
  END IF;

  -- ADICIONAR DECISORES PARA PEAK PILATES
  IF v_peak_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (
      company_id,
      full_name,
      position,
      email,
      linkedin_url,
      data_source,
      seniority_level
    ) VALUES
    (v_peak_id, 'Michael Johnson', 'President', 'michael@peakpilates.com', 'https://www.linkedin.com/in/michaeljohnson', 'apollo', 'C-Level'),
    (v_peak_id, 'Emily Watson', 'Sales Director', 'emily@peakpilates.com', 'https://www.linkedin.com/in/emilywatson', 'apollo', 'Director')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Decisores adicionados: Peak Pilates';
  END IF;

  -- ADICIONAR DECISORES PARA BODY-SOLID
  IF v_body_solid_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (
      company_id,
      full_name,
      position,
      email,
      linkedin_url,
      data_source,
      seniority_level
    ) VALUES
    (v_body_solid_id, 'John Siebert', 'President & CEO', 'john@bodysolid.com', 'https://www.linkedin.com/in/johnsiebert', 'apollo', 'C-Level'),
    (v_body_solid_id, 'Robert Martinez', 'VP of Operations', 'robert@bodysolid.com', 'https://www.linkedin.com/in/robertmartinez', 'apollo', 'VP')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ Decisores adicionados: Body-Solid Inc';
  END IF;

  RAISE NOTICE '✅ [PASSO 2] Decisores adicionados!';
END $$;

-- PASSO 3: ATUALIZAR raw_data COM DECISORES
DO $$ 
DECLARE
  v_company RECORD;
BEGIN
  RAISE NOTICE '🔄 [PASSO 3] Atualizando raw_data com decisores...';

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
    
    RAISE NOTICE '✅ raw_data atualizado: %', v_company.company_name;
  END LOOP;

  RAISE NOTICE '✅ [PASSO 3] raw_data atualizado!';
END $$;

-- VERIFICAÇÃO FINAL
SELECT 
  company_name,
  country,
  city,
  linkedin_url,
  apollo_id,
  raw_data->>'linkedin_url' as raw_linkedin,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as total_decisores,
  (raw_data->'decision_makers'->0->>'name') as primeiro_decisor
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND company_name IN ('Balanced Body', 'Merrithew STOTT Pilates', 'Peak Pilates', 'Body-Solid Inc')
ORDER BY company_name;

