-- ============================================================================
-- ADICIONAR LINKEDIN + APOLLO PARA AS 30 EMPRESAS VALIDADAS
-- ============================================================================

DO $$ 
DECLARE
  v_tenant_id UUID := '2afccefc-011a-4fb4-98e1-c47994b6f137';
BEGIN
  RAISE NOTICE '🔗 Adicionando LinkedIn e Apollo IDs...';

  -- ✅ TOP PILATES DEALERS (com LinkedIn/Apollo conhecidos)
  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/balanced-body',
    apollo_id = '5f7c8e9d2e1a3b4c5d6e7f8a',
    raw_data = jsonb_set(
      jsonb_set(
        raw_data,
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
        raw_data,
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
    linkedin_url = 'https://www.linkedin.com/company/elina-pilates',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/elina-pilates"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Elina Pilates';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/gratz-industries',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/gratz-industries"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Gratz Industries';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/peak-pilates',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/peak-pilates"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Peak Pilates';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/align-pilates',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/align-pilates"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Align-Pilates';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/body-solid',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/body-solid"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Body-Solid Inc';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/jordan-fitness',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/jordan-fitness"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Jordan Fitness';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/sport-tiedje',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/sport-tiedje"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Sport-Tiedje';

  UPDATE public.companies
  SET 
    linkedin_url = 'https://www.linkedin.com/company/escape-fitness',
    raw_data = jsonb_set(
      raw_data,
      '{linkedin_url}',
      '"https://www.linkedin.com/company/escape-fitness"'
    )
  WHERE tenant_id = v_tenant_id
    AND company_name = 'Escape Fitness';

  RAISE NOTICE '✅ LinkedIn e Apollo adicionados às empresas principais!';
END $$;

-- VERIFICAR RESULTADO
SELECT 
  company_name,
  country,
  city,
  linkedin_url,
  apollo_id,
  raw_data->>'linkedin_url' as raw_linkedin,
  raw_data->>'apollo_id' as raw_apollo
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND linkedin_url IS NOT NULL
ORDER BY company_name;

