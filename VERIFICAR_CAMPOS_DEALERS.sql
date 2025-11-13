-- ============================================================================
-- VERIFICAR SE DEALERS TÊM TODOS OS CAMPOS PARA CARD EXPANSÍVEL
-- ============================================================================

-- Empresas que vieram do dealer_discovery
SELECT 
  company_name,
  data_source,
  city,
  state,
  country,
  linkedin_url,
  apollo_id,
  industry,
  description,
  raw_data->>'linkedin_url' as raw_linkedin,
  raw_data->>'apollo_id' as raw_apollo,
  raw_data->>'apollo_link' as raw_apollo_link,
  raw_data->>'fit_score' as fit_score,
  raw_data->>'source' as raw_source,
  JSONB_ARRAY_LENGTH(COALESCE(raw_data->'decision_makers', '[]'::jsonb)) as total_decisores
FROM public.companies
WHERE data_source = 'dealer_discovery'
  OR (raw_data->>'source') = 'dealer_discovery_realtime'
ORDER BY company_name
LIMIT 10;

-- Estatísticas gerais
SELECT 
  data_source,
  COUNT(*) as total,
  COUNT(city) as tem_city,
  COUNT(state) as tem_state,
  COUNT(country) as tem_country,
  COUNT(linkedin_url) as tem_linkedin,
  COUNT(apollo_id) as tem_apollo,
  AVG(CAST(raw_data->>'fit_score' AS INTEGER)) as fit_score_medio
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
GROUP BY data_source
ORDER BY total DESC;

