-- ============================================================================
-- LIMPEZA COMPLETA + IMPORTAÇÃO DAS 30 EMPRESAS VALIDADAS
-- ============================================================================

-- PASSO 1: DELETAR TODAS AS EMPRESAS DO WORKSPACE
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

  RAISE NOTICE '🗑️ Deletando empresas antigas do workspace %...', v_workspace_id;

  -- DELETAR empresas
  DELETE FROM public.companies
  WHERE tenant_id = v_tenant_id
    AND workspace_id = v_workspace_id;

  RAISE NOTICE '✅ Empresas antigas deletadas!';
END $$;

-- PASSO 2: IMPORTAR 30 EMPRESAS VALIDADAS (COM TODOS OS CAMPOS)
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

  RAISE NOTICE '📥 Importando 30 empresas validadas...';

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
    raw_data
  ) VALUES
  -- ✅ TOP 15 PILATES DEALERS (Fit Score 75-95)
  (v_tenant_id, v_workspace_id, 'Balanced Body', 'https://www.balancedbody.com', 'United States', 'Sacramento', 'California', 'sporting goods', 'dealer_discovery', 
   '{"fit_score":95,"type":"Distributor/Manufacturer","notes":"Líder global Pilates","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Merrithew STOTT Pilates', 'https://www.merrithew.com', 'Canada', 'Toronto', 'Ontario', 'sporting goods', 'dealer_discovery',
   '{"fit_score":95,"type":"Manufacturer/Global Distributor","notes":"Líder mundial Pilates","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Elina Pilates', 'https://www.elinapilates.com.au', 'Australia', 'Sydney', 'NSW', 'sporting goods', 'dealer_discovery',
   '{"fit_score":95,"type":"Manufacturer/Distributor","notes":"Fabricante Pilates","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Gratz Industries', 'https://www.gratzindustries.com', 'United States', 'New York', 'New York', 'sporting goods', 'dealer_discovery',
   '{"fit_score":95,"type":"Manufacturer","notes":"Authentic Pilates","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Peak Pilates', 'https://www.peakpilates.com', 'United States', 'Boulder', 'Colorado', 'sporting goods', 'dealer_discovery',
   '{"fit_score":90,"type":"Manufacturer/Distributor","notes":"Pilates equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Align-Pilates', 'https://www.align-pilates.com', 'United Kingdom', 'London', 'England', 'sporting goods', 'dealer_discovery',
   '{"fit_score":90,"type":"Manufacturer/Distributor","notes":"Pilates equipment UK","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'P.E.Pilates', 'https://pepilates.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   '{"fit_score":85,"type":"Distributor/OEM","notes":"OEM Pilates","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Jaalee Fit', 'https://jaaleefit.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   '{"fit_score":85,"type":"Distributor/Manufacturer","notes":"Pilates equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'WellReformer', 'https://wellreformer.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   '{"fit_score":85,"type":"Distributor","notes":"Reformer specialist","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Aero Pilates', 'https://www.aeropilates.com', 'United States', 'San Diego', 'California', 'sporting goods', 'dealer_discovery',
   '{"fit_score":85,"type":"Manufacturer","notes":"Pilates reformers","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Pilates-Mad', 'https://www.pilates-mad.com', 'United Kingdom', 'London', 'England', 'sporting goods', 'dealer_discovery',
   '{"fit_score":80,"type":"Distributor","notes":"Pilates accessories","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Empower Pilates', 'https://www.empowerpilates.com.au', 'Australia', 'Melbourne', 'Victoria', 'sporting goods', 'dealer_discovery',
   '{"fit_score":80,"type":"Distributor","notes":"Pilates equipment AU","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Pilates International', 'https://pilatesinternational.com.au', 'Australia', 'Brisbane', 'Queensland', 'sporting goods', 'dealer_discovery',
   '{"fit_score":80,"type":"Distributor","notes":"Pilates wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Studio Pilates International', 'https://www.studiopilates.com', 'Australia', 'Sydney', 'NSW', 'sporting goods', 'dealer_discovery',
   '{"fit_score":75,"type":"Chain/Equipment","notes":"Maior rede Pilates AU","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Active & Agile', 'https://activeandagile.com.au', 'Australia', 'Perth', 'Western Australia', 'sporting goods', 'dealer_discovery',
   '{"fit_score":75,"type":"Distributor","notes":"Pilates equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  -- ✅ FITNESS EQUIPMENT DISTRIBUTORS (Fit Score 60-70)
  (v_tenant_id, v_workspace_id, 'Body-Solid Inc', 'https://bodysolid.com', 'United States', 'Forest Park', 'Illinois', 'sporting goods', 'dealer_discovery',
   '{"fit_score":70,"type":"Manufacturer/Distributor","notes":"Sporting goods","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Jordan Fitness', 'https://www.jordanfitness.com', 'United Kingdom', 'King''s Lynn', 'Norfolk', 'sporting goods', 'dealer_discovery',
   '{"fit_score":70,"type":"Distributor","notes":"Fitness equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Athleticum Fitness', 'https://www.athleticum.co.uk', 'United Kingdom', 'London', 'England', 'sporting goods', 'dealer_discovery',
   '{"fit_score":70,"type":"Premium Distributor","notes":"High-end fitness","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Sport-Tiedje', 'https://www.sport-tiedje.de', 'Germany', 'Hamburg', 'Hamburg', 'sporting goods', 'dealer_discovery',
   '{"fit_score":70,"type":"Distributor","notes":"Maior distribuidor Europa","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Fitness Depot', 'https://www.fitnessdepot.ca', 'Canada', 'Toronto', 'Ontario', 'sporting goods', 'dealer_discovery',
   '{"fit_score":65,"type":"Distributor","notes":"Fitness wholesale Canada","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Tonic Performance', 'https://tonicperformance.ca', 'Canada', 'Vancouver', 'British Columbia', 'sporting goods', 'dealer_discovery',
   '{"fit_score":65,"type":"Distributor","notes":"Performance equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Escape Fitness', 'https://www.escapefitness.com', 'United Kingdom', 'Manchester', 'England', 'sporting goods', 'dealer_discovery',
   '{"fit_score":65,"type":"Manufacturer/Distributor","notes":"Commercial fitness","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Metflex', 'https://metflexfitness.com', 'United States', 'Los Angeles', 'California', 'sporting goods', 'dealer_discovery',
   '{"fit_score":65,"type":"Distributor/OEM","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Gofitstrength', 'https://gofitstrength.com', 'United States', 'Phoenix', 'Arizona', 'sporting goods', 'dealer_discovery',
   '{"fit_score":65,"type":"Manufacturer/Exporter","notes":"Fitness equipment","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Expert Fitness Supply', 'https://expertfitnesssupply.com', 'United States', 'Dallas', 'Texas', 'sporting goods', 'dealer_discovery',
   '{"fit_score":65,"type":"Distributor","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Cunruope', 'https://cunruope.com', 'United States', 'Los Angeles', 'California', 'wholesale', 'dealer_discovery',
   '{"fit_score":60,"type":"Wholesaler","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Fitness Concept', 'https://fitnessconcept.com.sg', 'Singapore', 'Singapore', 'Singapore', 'sporting goods', 'dealer_discovery',
   '{"fit_score":60,"type":"Distributor","notes":"Premium fitness","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Fitness Zone Mexico', 'https://fitnesszone.com.mx', 'Mexico', 'Mexico City', 'CDMX', 'sporting goods', 'dealer_discovery',
   '{"fit_score":60,"type":"Distributor","notes":"Fitness wholesale","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Sport Systems', 'https://sportsystems.com.mx', 'Mexico', 'Mexico City', 'CDMX', 'sporting goods', 'dealer_discovery',
   '{"fit_score":60,"type":"Distributor","notes":"Sporting goods","validated":true,"source":"dealer_discovery"}'::jsonb),
  
  (v_tenant_id, v_workspace_id, 'Sportlife Chile', 'https://sportlife.cl', 'Chile', 'Santiago', 'Santiago', 'sporting goods', 'dealer_discovery',
   '{"fit_score":60,"type":"Distributor","notes":"Fitness equipment","validated":true,"source":"dealer_discovery"}'::jsonb);

  RAISE NOTICE '✅ 30 empresas validadas importadas com TODOS os campos!';
END $$;

-- PASSO 3: VERIFICAR IMPORTAÇÃO
SELECT 
  company_name,
  country,
  city,
  state,
  website,
  data_source,
  (raw_data->>'fit_score')::integer as fit_score,
  raw_data->>'type' as tipo,
  raw_data->>'notes' as notas
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND (raw_data->>'validated')::boolean = true
ORDER BY (raw_data->>'fit_score')::integer DESC, company_name;

