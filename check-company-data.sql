-- Verificar raw_data das empresas importadas
SELECT 
  company_name,
  website,
  city,
  state,
  country,
  linkedin_url,
  apollo_id,
  raw_data->>'linkedin_url' as raw_linkedin,
  raw_data->>'apollo_id' as raw_apollo,
  raw_data->>'apollo_link' as raw_apollo_link,
  raw_data->>'source' as raw_source,
  data_source
FROM public.companies
WHERE company_name IN ('Balanced Body', 'Merrithew STOTT Pilates', 'Elina Pilates')
ORDER BY company_name
LIMIT 5;
