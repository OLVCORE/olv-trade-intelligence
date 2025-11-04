-- ⚡ VERIFICAR SE ENRIQUECIMENTOS FORAM SALVOS
-- Execute no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new

-- 1. Ver empresas na quarentena com dados enriquecidos
SELECT 
    id,
    razao_social,
    cnpj,
    uf,
    municipio,
    porte,
    cnae_principal,
    status,
    created_at,
    -- Ver se raw_data tem enriquecimentos
    raw_data -> 'receita_federal' as receita_data,
    raw_data -> 'enrichment_360' as scores_360,
    raw_data -> 'receita_source' as fonte
FROM public.icp_analysis_results
WHERE cnpj = '46142725000115' -- CNPJ da empresa "Protheus / APS"
ORDER BY created_at DESC
LIMIT 1;

-- 2. Contar empresas por status
SELECT 
    status,
    COUNT(*) as total,
    AVG(icp_score) as score_medio
FROM public.icp_analysis_results
GROUP BY status
ORDER BY total DESC;

-- 3. Ver se alguma empresa tem dados de enriquecimento
SELECT 
    COUNT(*) as total_empresas,
    COUNT(CASE WHEN raw_data -> 'receita_federal' IS NOT NULL THEN 1 END) as com_receita,
    COUNT(CASE WHEN raw_data -> 'enrichment_360' IS NOT NULL THEN 1 END) as com_360,
    COUNT(CASE WHEN uf IS NOT NULL THEN 1 END) as com_uf,
    COUNT(CASE WHEN municipio IS NOT NULL THEN 1 END) as com_municipio
FROM public.icp_analysis_results;

