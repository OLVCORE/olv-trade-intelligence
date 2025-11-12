-- LIMPAR TODAS AS 75 DUPLICATAS DE DEALERS USA
DELETE FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND country = 'United States'
  AND company_name IN (
    'Advanced Solution', 'The Foresight International Group', 'ZURICH Corp.',
    'Bill Hicks & Co., Ltd.', 'Wink Fasteners, Inc.', 'Premier Medical Systems',
    'Mid Central Medical', 'Tuffcare, Inc.', 'Canadawide Sports',
    'Welch Allyn Protocol', 'Jaco Medical Equipment', 'All States M.E.D.',
    'Wound Care Support LLC', 'Mountain States Rep Group', 'P. K. ENTERPRISES'
  );

SELECT 'LIMPEZA CONCLUÍDA' as status;

