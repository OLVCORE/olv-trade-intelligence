-- Verificar raw_data das empresas importadas
SELECT 
  company_name,
  website,
  linkedin_url,
  apollo_id,
  raw_data->>'linkedin_url' as raw_linkedin,
  raw_data->>'apollo_id' as raw_apollo,
  raw_data->>'apollo_link' as raw_apollo_link
FROM public.companies
WHERE company_name IN ('Balanced Body', 'Merrithew STOTT Pilates', 'Elina Pilates')
LIMIT 5;
