-- ============================================================================
-- IMPORTAR 15 DEALERS USA - SQL LIMPO (SEM MARKDOWN)
-- ============================================================================

-- PASSO 1: Deletar os dealers com company_name vazio
DELETE FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND country = 'United States'
  AND industry IN ('Sporting Goods', 'Wholesale', 'Medical Devices', 'Import & Export', 'Health & Wellness')
  AND (company_name IS NULL OR company_name = '');

-- PASSO 2: Inserir os 15 dealers com nomes corretos
DO $$
DECLARE
  v_tenant_id UUID := '2afccefc-011a-4fb4-98e1-c47994b6f137';
  v_workspace_id UUID := (
    SELECT id FROM public.workspaces 
    WHERE tenant_id = v_tenant_id AND name = 'Export - Global' 
    LIMIT 1
  );
BEGIN

INSERT INTO public.companies (
  tenant_id, 
  workspace_id, 
  company_name,
  website, 
  industry, 
  employee_count,
  city, 
  state, 
  country
)
VALUES
(v_tenant_id, v_workspace_id, 'Advanced Solution', 'http://www.advancedsolution.health', 'Medical Devices', 100, 'Carlisle', 'PA', 'United States'),
(v_tenant_id, v_workspace_id, 'The Foresight International Group', 'http://www.foresightintl.com', 'Medical Devices', 90, 'Doral', 'FL', 'United States'),
(v_tenant_id, v_workspace_id, 'ZURICH Corp.', 'http://www.zurichcorp.com', 'Import & Export', 80, 'Miami', 'FL', 'United States'),
(v_tenant_id, v_workspace_id, 'Bill Hicks & Co., Ltd.', 'http://www.billhicksco.com', 'Wholesale', 75, 'Plymouth', 'MA', 'United States'),
(v_tenant_id, v_workspace_id, 'Wink Fasteners, Inc.', 'http://www.winkfast.com', 'Wholesale', 70, 'Richmond', 'VA', 'United States'),
(v_tenant_id, v_workspace_id, 'Premier Medical Systems', 'http://www.premedsystems.com', 'Medical Devices', 65, 'Berkeley Heights', 'NJ', 'United States'),
(v_tenant_id, v_workspace_id, 'Mid Central Medical', 'http://www.midcentralmedical.com', 'Medical Devices', 60, 'Pembina', 'ND', 'United States'),
(v_tenant_id, v_workspace_id, 'Tuffcare, Inc.', 'http://www.tuffcare.com', 'Medical Devices', 55, 'Anaheim', 'CA', 'United States'),
(v_tenant_id, v_workspace_id, 'Canadawide Sports', 'http://www.canadawidesports.com', 'Sporting Goods', 50, 'Compton', 'CA', 'United States'),
(v_tenant_id, v_workspace_id, 'Welch Allyn Protocol', 'http://www.welchallynwarehouse.com', 'Medical Devices', 50, 'Sugar Land', 'TX', 'United States'),
(v_tenant_id, v_workspace_id, 'Jaco Medical Equipment', 'http://www.jacomed.com', 'Medical Devices', 45, 'Poway', 'CA', 'United States'),
(v_tenant_id, v_workspace_id, 'All States M.E.D.', 'http://www.allstatesmed.com', 'Medical Devices', 40, 'Hialeah', 'FL', 'United States'),
(v_tenant_id, v_workspace_id, 'Wound Care Support LLC', 'http://www.woundcaresupport.com', 'Health & Wellness', 35, 'Fort Worth', 'TX', 'United States'),
(v_tenant_id, v_workspace_id, 'Mountain States Rep Group', 'http://www.mtnstatesreps.com', 'Sporting Goods', 30, 'Denver', 'CO', 'United States'),
(v_tenant_id, v_workspace_id, 'P. K. ENTERPRISES', 'http://www.pkenterprisesindia.in', 'Wholesale', 25, 'Coronado', 'CA', 'United States');

RAISE NOTICE '15 dealers USA importados com sucesso';

END $$;

-- PASSO 3: Ver os dealers importados
SELECT 
  company_name,
  industry,
  employee_count,
  city,
  state,
  website
FROM public.companies
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137'
  AND country = 'United States'
  AND industry IN ('Sporting Goods', 'Wholesale', 'Medical Devices', 'Import & Export', 'Health & Wellness')
ORDER BY employee_count DESC;

