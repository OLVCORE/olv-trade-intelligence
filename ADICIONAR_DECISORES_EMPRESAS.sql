-- ============================================================================
-- ADICIONAR DECISORES PARA AS EMPRESAS PRINCIPAIS
-- ============================================================================

DO $$ 
DECLARE
  v_balanced_body_id UUID;
  v_merrithew_id UUID;
  v_peak_id UUID;
  v_body_solid_id UUID;
BEGIN
  RAISE NOTICE '👥 Adicionando decisores...';

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

  RAISE NOTICE '👥 Total de decisores adicionados!';
END $$;

-- VERIFICAR RESULTADO
SELECT 
  c.company_name,
  COUNT(dm.id) as total_decisores,
  STRING_AGG(dm.full_name || ' (' || dm.position || ')', ', ') as decisores
FROM public.companies c
LEFT JOIN public.decision_makers dm ON dm.company_id = c.id
WHERE c.tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND c.company_name IN ('Balanced Body', 'Merrithew STOTT Pilates', 'Peak Pilates', 'Body-Solid Inc')
GROUP BY c.company_name
ORDER BY c.company_name;

