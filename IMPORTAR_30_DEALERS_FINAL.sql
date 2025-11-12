-- ============================================================================
-- IMPORTAR 30 DEALERS PILATES REAIS (Fit Score 60-95)
-- ============================================================================

DO $$ 
DECLARE
  v_tenant_id UUID := '2afccefc-011a-4fb4-98e1-c47994b6f137';
  v_workspace_id UUID;
BEGIN
  -- BUSCAR O WORKSPACE "Export - Global" AUTOMATICAMENTE
  SELECT id INTO v_workspace_id 
  FROM public.workspaces 
  WHERE tenant_id = v_tenant_id 
  LIMIT 1;
  
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Workspace não encontrado para tenant %', v_tenant_id;
  END IF;
  
  RAISE NOTICE 'Usando workspace: %', v_workspace_id;
  
  -- IMPORTAR 30 DEALERS PILATES
  INSERT INTO public.companies (
    tenant_id, workspace_id, company_name, website, country, city, industry, hunter_domain_data
  ) VALUES
  (v_tenant_id, v_workspace_id, 'Balanced Body', 'https://www.balancedbody.com', 'United States', 'Sacramento CA', 'sporting goods', '{"fit_score":95,"type":"Distributor/Manufacturer","notes":"Líder global Pilates","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Merrithew STOTT Pilates', 'https://www.merrithew.com', 'Canada', 'Toronto', 'sporting goods', '{"fit_score":95,"type":"Manufacturer/Global Distributor","notes":"Líder mundial Pilates","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Elina Pilates', 'https://www.elinapilates.com.au', 'Australia', 'Australia', 'sporting goods', '{"fit_score":95,"type":"Manufacturer/Distributor","notes":"Fabricante Pilates","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Gratz Industries', 'https://www.gratzindustries.com', 'United States', 'New York', 'sporting goods', '{"fit_score":95,"type":"Manufacturer","notes":"Authentic Pilates","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Peak Pilates', 'https://www.peakpilates.com', 'United States', 'Colorado', 'sporting goods', '{"fit_score":90,"type":"Manufacturer/Distributor","notes":"Pilates equipment","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Align-Pilates', 'https://www.align-pilates.com', 'United Kingdom', 'UK', 'sporting goods', '{"fit_score":90,"type":"Manufacturer/Distributor","notes":"Pilates equipment UK","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'P.E.Pilates', 'https://pepilates.com', 'United States', 'Los Angeles CA', 'sporting goods', '{"fit_score":85,"type":"Distributor/OEM","notes":"OEM Pilates","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Jaalee Fit', 'https://jaaleefit.com', 'United States', 'Los Angeles CA', 'sporting goods', '{"fit_score":85,"type":"Distributor/Manufacturer","notes":"Pilates equipment","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'WellReformer', 'https://wellreformer.com', 'United States', 'Los Angeles CA', 'sporting goods', '{"fit_score":85,"type":"Distributor","notes":"Reformer specialist","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Aero Pilates', 'https://www.aeropilates.com', 'United States', 'USA', 'sporting goods', '{"fit_score":85,"type":"Manufacturer","notes":"Pilates reformers","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Pilates-Mad', 'https://www.pilates-mad.com', 'United Kingdom', 'UK', 'sporting goods', '{"fit_score":80,"type":"Distributor","notes":"Pilates accessories","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Empower Pilates', 'https://www.empowerpilates.com.au', 'Australia', 'Australia', 'sporting goods', '{"fit_score":80,"type":"Distributor","notes":"Pilates equipment AU","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Pilates International', 'https://pilatesinternational.com.au', 'Australia', 'Australia', 'sporting goods', '{"fit_score":80,"type":"Distributor","notes":"Pilates wholesale","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Studio Pilates International', 'https://www.studiopilates.com', 'Australia', 'Australia', 'sporting goods', '{"fit_score":75,"type":"Chain/Equipment","notes":"Maior rede Pilates AU","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Active & Agile', 'https://activeandagile.com.au', 'Australia', 'Australia', 'sporting goods', '{"fit_score":75,"type":"Distributor","notes":"Pilates equipment","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Body-Solid Inc', 'https://bodysolid.com', 'United States', 'Forest Park IL', 'sporting goods', '{"fit_score":70,"type":"Manufacturer/Distributor","notes":"Sporting goods","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Jordan Fitness', 'https://www.jordanfitness.com', 'United Kingdom', 'King''s Lynn', 'sporting goods', '{"fit_score":70,"type":"Distributor","notes":"Fitness equipment","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Athleticum Fitness', 'https://www.athleticum.co.uk', 'United Kingdom', 'UK', 'sporting goods', '{"fit_score":70,"type":"Premium Distributor","notes":"High-end fitness","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Sport-Tiedje', 'https://www.sport-tiedje.de', 'Germany', 'Hamburg', 'sporting goods', '{"fit_score":70,"type":"Distributor","notes":"Maior distribuidor Europa","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Fitness Depot', 'https://www.fitnessdepot.ca', 'Canada', 'Multiple', 'sporting goods', '{"fit_score":65,"type":"Distributor","notes":"Fitness wholesale Canada","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Tonic Performance', 'https://tonicperformance.ca', 'Canada', 'Canada', 'sporting goods', '{"fit_score":65,"type":"Distributor","notes":"Performance equipment","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Escape Fitness', 'https://www.escapefitness.com', 'United Kingdom', 'UK', 'sporting goods', '{"fit_score":65,"type":"Manufacturer/Distributor","notes":"Commercial fitness","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Metflex', 'https://metflexfitness.com', 'United States', 'Los Angeles CA', 'sporting goods', '{"fit_score":65,"type":"Distributor/OEM","notes":"Fitness wholesale","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Gofitstrength', 'https://gofitstrength.com', 'United States', 'Multiple', 'sporting goods', '{"fit_score":65,"type":"Manufacturer/Exporter","notes":"Fitness equipment","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Expert Fitness Supply', 'https://expertfitnesssupply.com', 'United States', 'USA', 'sporting goods', '{"fit_score":65,"type":"Distributor","notes":"Fitness wholesale","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Cunruope', 'https://cunruope.com', 'United States', 'Los Angeles CA', 'wholesale', '{"fit_score":60,"type":"Wholesaler","notes":"Fitness wholesale","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Fitness Concept', 'https://fitnessconcept.com.sg', 'Singapore', 'Singapore', 'sporting goods', '{"fit_score":60,"type":"Distributor","notes":"Premium fitness","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Fitness Zone Mexico', 'https://fitnesszone.com.mx', 'Mexico', 'Mexico', 'sporting goods', '{"fit_score":60,"type":"Distributor","notes":"Fitness wholesale","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Sport Systems', 'https://sportsystems.com.mx', 'Mexico', 'Mexico City', 'sporting goods', '{"fit_score":60,"type":"Distributor","notes":"Sporting goods","validated":true}'::jsonb),
  (v_tenant_id, v_workspace_id, 'Sportlife Chile', 'https://sportlife.cl', 'Chile', 'Santiago', 'sporting goods', '{"fit_score":60,"type":"Distributor","notes":"Fitness equipment","validated":true}'::jsonb);
  
  RAISE NOTICE '✅ 30 dealers Pilates importados (Fit Score 60-95)!';
END $$;

-- VERIFICAR SE FORAM IMPORTADOS
SELECT 
  company_name,
  country,
  city,
  website,
  (hunter_domain_data->>'fit_score')::integer as fit_score,
  hunter_domain_data->>'type' as tipo,
  hunter_domain_data->>'notes' as notas
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND (hunter_domain_data->>'validated')::boolean = true
ORDER BY (hunter_domain_data->>'fit_score')::integer DESC;

