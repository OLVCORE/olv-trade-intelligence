-- TESTE MANUAL: INSERIR 1 EMPRESA DIRETAMENTE NO BANCO

INSERT INTO companies (
  name,
  cnpj,
  source_type,
  source_name,
  import_batch_id,
  import_date,
  created_at
) VALUES (
  'Empresa Teste Manual',
  '10.921.911/0014-20',
  'csv',
  'Teste Manual Direto',
  gen_random_uuid(),
  NOW(),
  NOW()
);

-- VERIFICAR SE FOI SALVA
SELECT 
  id,
  name,
  cnpj,
  source_name,
  created_at
FROM companies
WHERE cnpj = '10.921.911/0014-20';

-- CONTAR TOTAL
SELECT COUNT(*) as total FROM companies;

