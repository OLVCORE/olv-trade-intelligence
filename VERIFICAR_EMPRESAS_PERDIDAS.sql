-- ========================================
-- VERIFICAR ONDE ESTÃO AS EMPRESAS "PERDIDAS"
-- ========================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- ========================================

-- Ver TODOS os status possíveis
SELECT 
    status,
    COUNT(*) as total,
    array_agg(razao_social) as empresas
FROM icp_analysis_results
GROUP BY status
ORDER BY COUNT(*) DESC;

-- Ver empresas processadas recentemente (últimas 2 horas)
SELECT 
    razao_social,
    cnpj,
    status,
    temperatura,
    icp_score,
    created_at,
    updated_at
FROM icp_analysis_results
WHERE created_at > NOW() - INTERVAL '2 hours'
   OR updated_at > NOW() - INTERVAL '2 hours'
ORDER BY updated_at DESC;

-- Ver se tem em stc_verification_history mas não em quarentena
SELECT 
    svh.company_name,
    svh.cnpj,
    svh.status as stc_status,
    svh.created_at as verificado_em,
    iar.status as quarentena_status
FROM stc_verification_history svh
LEFT JOIN icp_analysis_results iar ON iar.cnpj = svh.cnpj
WHERE svh.created_at > NOW() - INTERVAL '2 hours'
ORDER BY svh.created_at DESC;

