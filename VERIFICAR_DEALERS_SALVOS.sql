-- ============================================================================
-- VERIFICAR SE OS 174 DEALERS ESTÃO SALVOS NO BANCO DE DADOS
-- ============================================================================

-- Substitua 'SEARCH_ID_AQUI' pelo ID da busca salva que você quer verificar
-- Você pode encontrar o ID na tabela saved_dealer_searches

-- 1. VERIFICAR BUSCAS SALVAS DO TENANT
SELECT 
  id,
  name,
  results_count,
  jsonb_array_length(COALESCE(search_results, '[]'::jsonb)) as resultados_salvos_json,
  created_at,
  last_run_at
FROM public.saved_dealer_searches
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'  -- MetaLife Pilates
ORDER BY created_at DESC
LIMIT 10;

-- 2. VERIFICAR SE HÁ DEALERS SALVOS NO BANCO COM saved_search_id
-- Substitua 'ID_DA_BUSCA_SALVA' pelo ID real da busca
SELECT 
  COUNT(*) as total_dealers_salvos,
  MIN(created_at) as primeira_criacao,
  MAX(created_at) as ultima_criacao
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND data_source = 'dealer_discovery'
  AND raw_data->>'saved_search_id' IS NOT NULL;

-- 3. VER DEALERS SALVOS POR BUSCA ESPECÍFICA
-- Substitua 'ID_DA_BUSCA_SALVA' pelo ID real da busca
SELECT 
  id,
  company_name,
  website,
  country,
  city,
  state,
  data_source,
  raw_data->>'saved_search_id' as saved_search_id,
  raw_data->>'fit_score' as fit_score,
  created_at
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND data_source = 'dealer_discovery'
  AND raw_data->>'saved_search_id' = 'ID_DA_BUSCA_SALVA'  -- ⚠️ SUBSTITUIR PELO ID REAL
ORDER BY created_at DESC
LIMIT 174;

-- 4. ESTATÍSTICAS GERAIS DE DEALERS SALVOS
SELECT 
  raw_data->>'saved_search_id' as saved_search_id,
  COUNT(*) as total_dealers,
  COUNT(DISTINCT country) as paises_diferentes,
  MIN(created_at) as primeira_criacao,
  MAX(created_at) as ultima_criacao
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND data_source = 'dealer_discovery'
  AND raw_data->>'saved_search_id' IS NOT NULL
GROUP BY raw_data->>'saved_search_id'
ORDER BY total_dealers DESC;

-- 5. COMPARAR results_count COM DEALERS REALMENTE SALVOS
SELECT 
  s.id as search_id,
  s.name as search_name,
  s.results_count as resultados_esperados,
  jsonb_array_length(COALESCE(s.search_results, '[]'::jsonb)) as resultados_no_json,
  COUNT(c.id) as dealers_reais_no_banco,
  CASE 
    WHEN COUNT(c.id) = s.results_count THEN '✅ CORRETO'
    WHEN COUNT(c.id) < s.results_count THEN '⚠️ FALTANDO DEALERS'
    ELSE '❓ MAIS DEALERS QUE ESPERADO'
  END as status
FROM public.saved_dealer_searches s
LEFT JOIN public.companies c 
  ON c.tenant_id = s.tenant_id
  AND c.data_source = 'dealer_discovery'
  AND c.raw_data->>'saved_search_id' = s.id::text
WHERE s.tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
GROUP BY s.id, s.name, s.results_count, s.search_results
ORDER BY s.created_at DESC
LIMIT 10;
