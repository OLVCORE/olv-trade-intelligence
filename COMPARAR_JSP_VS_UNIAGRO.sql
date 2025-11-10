-- Comparar estrutura de dados entre JSP (que funciona) e Uniagro (que não funciona)

-- JSP Brasil
SELECT 
  'JSP Brasil' as empresa,
  name,
  (raw_data->'apollo_organization'->>'name') as apollo_org_name,
  (raw_data->'apollo_organization'->>'industry') as apollo_industry,
  (raw_data->'apollo_organization'->>'keywords') as apollo_keywords,
  (raw_data->'apollo_organization'->>'estimated_num_employees') as apollo_employees,
  (raw_data->'apollo_organization'->>'founded_year') as apollo_founded,
  (raw_data->'apollo_organization'->>'short_description') as apollo_description,
  (raw_data->>'enriched_apollo') as enriched_apollo
FROM companies 
WHERE name ILIKE '%JSP BRASIL%'
LIMIT 1;

-- Uniagro
SELECT 
  'Uniagro' as empresa,
  name,
  (raw_data->'apollo_organization'->>'name') as apollo_org_name,
  (raw_data->'apollo_organization'->>'industry') as apollo_industry,
  (raw_data->'apollo_organization'->>'keywords') as apollo_keywords,
  (raw_data->'apollo_organization'->>'estimated_num_employees') as apollo_employees,
  (raw_data->'apollo_organization'->>'founded_year') as apollo_founded,
  (raw_data->'apollo_organization'->>'short_description') as apollo_description,
  (raw_data->>'enriched_apollo') as enriched_apollo
FROM companies 
WHERE name ILIKE '%Uniagro%'
LIMIT 1;

-- Ver TODA a estrutura raw_data de JSP
SELECT 
  'JSP raw_data' as debug,
  jsonb_pretty(raw_data->'apollo_organization') as apollo_org_completo
FROM companies 
WHERE name ILIKE '%JSP BRASIL%'
LIMIT 1;

-- Ver TODA a estrutura raw_data de Uniagro
SELECT 
  'Uniagro raw_data' as debug,
  jsonb_pretty(raw_data->'apollo_organization') as apollo_org_completo
FROM companies 
WHERE name ILIKE '%Uniagro%'
LIMIT 1;

