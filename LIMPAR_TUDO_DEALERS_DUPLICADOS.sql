-- ============================================================================
-- LIMPAR BAGUNÇA - DELETAR TODOS OS DEALERS DUPLICADOS
-- ============================================================================

-- DELETAR TODOS os dealers USA importados (limpar tudo)
DELETE FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND country = 'United States'
  AND company_name IN (
    'Advanced Solution',
    'The Foresight International Group',
    'ZURICH Corp.',
    'Bill Hicks & Co., Ltd.',
    'Wink Fasteners, Inc.',
    'Premier Medical Systems',
    'Mid Central Medical',
    'Tuffcare, Inc.',
    'Canadawide Sports',
    'Welch Allyn Protocol',
    'Jaco Medical Equipment',
    'All States M.E.D.',
    'Wound Care Support LLC',
    'Mountain States Rep Group',
    'P. K. ENTERPRISES'
  );

-- Ver quantos foram deletados
SELECT 'Dealers duplicados deletados' AS status;

-- Ver se ainda sobrou alguma coisa
SELECT COUNT(*) as total_restante
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND country = 'United States';

