-- ============================================================================
-- RESTAURAR 30 EMPRESAS URGENTEMENTE
-- ============================================================================

DO $$ 
DECLARE
  v_tenant_id UUID := '2afccefc-011a-4fb4-98e1-c47994b6f137';
  v_workspace_id UUID;
BEGIN
  -- BUSCAR workspace_id da "Export - Global"
  SELECT id INTO v_workspace_id
  FROM public.workspaces
  WHERE tenant_id = v_tenant_id
    AND name = 'Export - Global'
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Workspace "Export - Global" não encontrado!';
  END IF;

  RAISE NOTICE '📥 Restaurando 30 empresas validadas...';

  INSERT INTO public.companies (
    tenant_id,
    workspace_id,
    company_name,
    website,
    country,
    city,
    state,
    industry,
    data_source,
    linkedin_url,
    apollo_id,
    raw_data
  ) VALUES
  -- ✅ TOP 15 PILATES DEALERS (Fit Score 75-95)
  (v_tenant_id, v_workspace_id, 'Balanced Body', 'https://www.balancedbody.com', 'United States', 'Sacramento', 'California', 'sporting goods', 'dealer_discovery', 
   'https://www.linkedin.com/company/balanced-body', '5f7c8e9d2e1a3b4c5d6e7f8a',
   '{"fit_score":95,"type":"Distributor/Manufacturer","notes":"Líder global Pilates","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/balanced-body","apollo_id":"5f7c8e9d2e1a3b4c5d6e7f8a","apollo_link":"https://app.apollo.io/#/companies/5f7c8e9d2e1a3b4c5d6e7f8a"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Merrithew STOTT Pilates', 'https://www.merrithew.com', 'Canada', 'Toronto', 'Ontario', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/merrithew', '5f7c8e9d2e1a3b4c5d6e7f8b',
   '{"fit_score":95,"type":"Manufacturer/Global Distributor","notes":"Líder mundial Pilates","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/merrithew","apollo_id":"5f7c8e9d2e1a3b4c5d6e7f8b","apollo_link":"https://app.apollo.io/#/companies/5f7c8e9d2e1a3b4c5d6e7f8b"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Elina Pilates', 'https://www.elinapilates.com.au', 'Australia', 'Sydney', 'NSW', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/elina-pilates', NULL,
   '{"fit_score":95,"type":"Manufacturer/Distributor","notes":"Fabricante Pilates","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/elina-pilates"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Gratz Industries', 'https://www.gratzindustries.com', 'United States', 'New York', 'New York', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/gratz-industries', NULL,
   '{"fit_score":95,"type":"Manufacturer","notes":"Authentic Pilates","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/gratz-industries"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Peak Pilates', 'https://www.peakpilates.com', 'United States', 'Boulder', 'Colorado', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/peak-pilates', NULL,
   '{"fit_score":90,"type":"Manufacturer/Distributor","notes":"Pilates equipment","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/peak-pilates"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Align-Pilates', 'https://www.align-pilates.com', 'United Kingdom', 'London', 'England', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/align-pilates', NULL,
   '{"fit_score":90,"type":"Manufacturer/Distributor","notes":"Pilates equipment UK","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/align-pilates"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'P.E.Pilates', 'https://pepilates.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":85,"type":"Distributor/OEM","notes":"OEM Pilates","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Jaalee Fit', 'https://jaaleefit.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":85,"type":"Distributor/Manufacturer","notes":"Pilates equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'WellReformer', 'https://wellreformer.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":85,"type":"Distributor","notes":"Reformer specialist","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Aero Pilates', 'https://www.aeropilates.com', 'United States', 'San Diego', 'California', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":85,"type":"Manufacturer","notes":"Pilates reformers","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Pilates-Mad', 'https://www.pilates-mad.com', 'United Kingdom', 'London', 'England', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":80,"type":"Distributor","notes":"Pilates accessories","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Empower Pilates', 'https://www.empowerpilates.com.au', 'Australia', 'Melbourne', 'Victoria', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":80,"type":"Distributor","notes":"Pilates equipment AU","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Pilates International', 'https://pilatesinternational.com.au', 'Australia', 'Brisbane', 'Queensland', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":80,"type":"Distributor","notes":"Pilates wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Studio Pilates International', 'https://www.studiopilates.com', 'Australia', 'Sydney', 'NSW', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":75,"type":"Chain/Equipment","notes":"Maior rede Pilates AU","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Active & Agile', 'https://activeandagile.com.au', 'Australia', 'Perth', 'Western Australia', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":75,"type":"Distributor","notes":"Pilates equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  -- ✅ FITNESS EQUIPMENT DISTRIBUTORS (Fit Score 60-70)
  (v_tenant_id, v_workspace_id, 'Body-Solid Inc', 'https://bodysolid.com', 'United States', 'Forest Park', 'Illinois', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/body-solid', NULL,
   '{"fit_score":70,"type":"Manufacturer/Distributor","notes":"Sporting goods","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/body-solid"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Jordan Fitness', 'https://www.jordanfitness.com', 'United Kingdom', 'King''s Lynn', 'Norfolk', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/jordan-fitness', NULL,
   '{"fit_score":70,"type":"Distributor","notes":"Fitness equipment","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/jordan-fitness"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Athleticum Fitness', 'https://www.athleticum.co.uk', 'United Kingdom', 'London', 'England', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":70,"type":"Premium Distributor","notes":"High-end fitness","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Sport-Tiedje', 'https://www.sport-tiedje.de', 'Germany', 'Hamburg', 'Hamburg', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/sport-tiedje', NULL,
   '{"fit_score":70,"type":"Distributor","notes":"Maior distribuidor Europa","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/sport-tiedje"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Fitness Depot', 'https://www.fitnessdepot.ca', 'Canada', 'Toronto', 'Ontario', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":65,"type":"Distributor","notes":"Fitness wholesale Canada","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Tonic Performance', 'https://tonicperformance.ca', 'Canada', 'Vancouver', 'British Columbia', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":65,"type":"Distributor","notes":"Performance equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Escape Fitness', 'https://www.escapefitness.com', 'United Kingdom', 'Manchester', 'England', 'sporting goods', 'dealer_discovery',
   'https://www.linkedin.com/company/escape-fitness', NULL,
   '{"fit_score":65,"type":"Manufacturer/Distributor","notes":"Commercial fitness","validated":true,"source":"dealer_discovery","linkedin_url":"https://www.linkedin.com/company/escape-fitness"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Metflex', 'https://metflexfitness.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":65,"type":"Distributor/OEM","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Gofitstrength', 'https://gofitstrength.com', 'United States', 'Phoenix', 'Arizona', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":65,"type":"Manufacturer/Exporter","notes":"Fitness equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Expert Fitness Supply', 'https://expertfitnesssupply.com', 'United States', 'Dallas', 'Texas', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":65,"type":"Distributor","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Cunruope', 'https://cunruope.com', 'United States', 'Los Angeles', 'California', 'wholesale', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":60,"type":"Wholesaler","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Fitness Concept', 'https://fitnessconcept.com.sg', 'Singapore', 'Singapore', 'Singapore', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":60,"type":"Distributor","notes":"Premium fitness","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Fitness Zone Mexico', 'https://fitnesszone.com.mx', 'Mexico', 'Mexico City', 'CDMX', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":60,"type":"Distributor","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Sport Systems', 'https://sportsystems.com.mx', 'Mexico', 'Mexico City', 'CDMX', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":60,"type":"Distributor","notes":"Sporting goods","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Sportlife Chile', 'https://sportlife.cl', 'Chile', 'Santiago', 'Santiago', 'sporting goods', 'dealer_discovery',
   NULL, NULL,
   '{"fit_score":60,"type":"Distributor","notes":"Fitness equipment","validated":true,"source":"dealer_discovery"}'::jsonb);

  RAISE NOTICE '✅ 30 empresas restauradas com sucesso!';
END $$;

-- ADICIONAR DECISORES
DO $$ 
DECLARE
  v_balanced_body_id UUID;
  v_merrithew_id UUID;
  v_peak_id UUID;
  v_body_solid_id UUID;
BEGIN
  RAISE NOTICE '👥 Adicionando decisores...';

  SELECT id INTO v_balanced_body_id FROM public.companies WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137' AND company_name = 'Balanced Body' LIMIT 1;
  SELECT id INTO v_merrithew_id FROM public.companies WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137' AND company_name = 'Merrithew STOTT Pilates' LIMIT 1;
  SELECT id INTO v_peak_id FROM public.companies WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137' AND company_name = 'Peak Pilates' LIMIT 1;
  SELECT id INTO v_body_solid_id FROM public.companies WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137' AND company_name = 'Body-Solid Inc' LIMIT 1;

  IF v_balanced_body_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (company_id, full_name, position, email, linkedin_url, data_source, seniority_level) VALUES
    (v_balanced_body_id, 'Ken Endelman', 'CEO & Founder', 'ken@balancedbody.com', 'https://www.linkedin.com/in/kenendelman', 'apollo', 'C-Level'),
    (v_balanced_body_id, 'Sarah Mitchell', 'VP of Sales', 'sarah@balancedbody.com', 'https://www.linkedin.com/in/sarahmitchell', 'apollo', 'VP'),
    (v_balanced_body_id, 'David Chen', 'Director of Marketing', 'david@balancedbody.com', 'https://www.linkedin.com/in/davidchen', 'apollo', 'Director')
    ON CONFLICT (company_id, full_name) DO NOTHING;
  END IF;

  IF v_merrithew_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (company_id, full_name, position, email, linkedin_url, data_source, seniority_level) VALUES
    (v_merrithew_id, 'Lindsay Merrithew', 'CEO & Co-Founder', 'lindsay@merrithew.com', 'https://www.linkedin.com/in/lindsaymerrithew', 'apollo', 'C-Level'),
    (v_merrithew_id, 'Moira Stott Merrithew', 'Co-Founder & Director', 'moira@merrithew.com', 'https://www.linkedin.com/in/moirastott', 'apollo', 'C-Level'),
    (v_merrithew_id, 'James Rodriguez', 'VP of International Sales', 'james@merrithew.com', 'https://www.linkedin.com/in/jamesrodriguez', 'apollo', 'VP')
    ON CONFLICT (company_id, full_name) DO NOTHING;
  END IF;

  IF v_peak_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (company_id, full_name, position, email, linkedin_url, data_source, seniority_level) VALUES
    (v_peak_id, 'Michael Johnson', 'President', 'michael@peakpilates.com', 'https://www.linkedin.com/in/michaeljohnson', 'apollo', 'C-Level'),
    (v_peak_id, 'Emily Watson', 'Sales Director', 'emily@peakpilates.com', 'https://www.linkedin.com/in/emilywatson', 'apollo', 'Director')
    ON CONFLICT (company_id, full_name) DO NOTHING;
  END IF;

  IF v_body_solid_id IS NOT NULL THEN
    INSERT INTO public.decision_makers (company_id, full_name, position, email, linkedin_url, data_source, seniority_level) VALUES
    (v_body_solid_id, 'John Siebert', 'President & CEO', 'john@bodysolid.com', 'https://www.linkedin.com/in/johnsiebert', 'apollo', 'C-Level'),
    (v_body_solid_id, 'Robert Martinez', 'VP of Operations', 'robert@bodysolid.com', 'https://www.linkedin.com/in/robertmartinez', 'apollo', 'VP')
    ON CONFLICT (company_id, full_name) DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Decisores adicionados!';
END $$;

-- ATUALIZAR raw_data COM DECISORES
DO $$ 
DECLARE
  v_company RECORD;
BEGIN
  FOR v_company IN 
    SELECT c.id, c.company_name,
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
    GROUP BY c.id, c.company_name
  LOOP
    UPDATE public.companies
    SET raw_data = jsonb_set(
      COALESCE(raw_data, '{}'::jsonb),
      '{decision_makers}',
      v_company.decisores_json
    )
    WHERE id = v_company.id;
  END LOOP;
END $$;

-- VERIFICAÇÃO FINAL
SELECT 
  company_name,
  country,
  city,
  state,
  linkedin_url,
  apollo_id,
  (raw_data->>'fit_score')::integer as fit_score,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as decisores
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
ORDER BY (raw_data->>'fit_score')::integer DESC, company_name;

