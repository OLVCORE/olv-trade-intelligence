-- ============================================================================
-- CORREÇÃO: Fix leads_pool table constraints for approval flow
-- ============================================================================
-- Purpose: Corrigir constraints da tabela leads_pool para permitir aprovação
--          de empresas (individuais e em massa), incluindo empresas internacionais
-- Date: 2026-01-17
-- ============================================================================
-- 
-- PROBLEMAS IDENTIFICADOS:
-- 1. CNPJ com constraint NOT NULL impede empresas internacionais (CNPJ = NULL)
-- 2. Status com CHECK constraint conflitante (migrations diferentes definem valores diferentes)
-- 3. Colunas faltantes: company_id, source
-- 4. Origem pode não aceitar 'icp_massa' se o CHECK constraint não foi atualizado
--
-- SOLUÇÃO:
-- 1. Remover NOT NULL do CNPJ em leads_pool
-- 2. Corrigir CHECK constraint de status para aceitar 'pool'
-- 3. Adicionar colunas faltantes (company_id, source)
-- 4. Garantir que origem aceite 'icp_massa'
-- ============================================================================

-- 1. Adicionar coluna cnpj se não existir (ANTES de remover NOT NULL)
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- 2. Remover NOT NULL do CNPJ (permitir empresas internacionais)
DO $$
BEGIN
  -- Verificar se a coluna cnpj existe e tem NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'cnpj'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.leads_pool
    ALTER COLUMN cnpj DROP NOT NULL;
    
    RAISE NOTICE 'Constraint NOT NULL removida do CNPJ em leads_pool';
  ELSE
    RAISE NOTICE 'Coluna cnpj já permite NULL - pulando';
  END IF;
END $$;

-- 3. Adicionar coluna tenant_id se não existir (OBRIGATÓRIO para RLS)
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 4. Adicionar coluna company_id se não existir
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 5. Adicionar coluna source se não existir
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- 6. Adicionar coluna razao_social se não existir
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS razao_social TEXT;

-- 7. Adicionar coluna icp_score se não existir
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS icp_score INTEGER;

-- 8. Adicionar coluna temperatura se não existir
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold'));

-- 9. Adicionar coluna origem se não existir
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS origem TEXT;

-- 10. Adicionar coluna status se não existir (ANTES de criar constraint)
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pool';

-- 10a. Adicionar coluna raw_data se não existir (JSONB para dados adicionais)
-- ✅ IMPORTANTE: Esta coluna DEVE existir antes de qualquer insert/update que use raw_data
-- Se o PostgREST ainda não reconhecer após aplicar a migration, aguarde 1-2 minutos para o cache atualizar
-- ou reinicie o serviço PostgREST
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE public.leads_pool
    ADD COLUMN raw_data JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Coluna raw_data criada em leads_pool';
  ELSE
    -- Garantir que a coluna tem o valor padrão correto
    ALTER TABLE public.leads_pool
    ALTER COLUMN raw_data SET DEFAULT '{}'::jsonb;
    
    -- Atualizar registros NULL para ter um objeto vazio
    UPDATE public.leads_pool
    SET raw_data = '{}'::jsonb
    WHERE raw_data IS NULL;
    
    RAISE NOTICE 'Coluna raw_data já existe - valores padrão garantidos';
  END IF;
END $$;

-- 11. Corrigir CHECK constraint de origem para aceitar 'icp_massa'
DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_pool_origem_check'
  ) THEN
    ALTER TABLE public.leads_pool
    DROP CONSTRAINT leads_pool_origem_check;
    
    RAISE NOTICE 'Constraint leads_pool_origem_check removida';
  END IF;
  
  -- Criar nova constraint que aceita 'icp_massa'
  ALTER TABLE public.leads_pool
  ADD CONSTRAINT leads_pool_origem_check 
  CHECK (origem IN ('icp_individual', 'icp_massa', 'empresas_aqui', 'manual', 'upload_massa') OR origem IS NULL);
  
  RAISE NOTICE 'Nova constraint leads_pool_origem_check criada';
END $$;

-- 12. Corrigir CHECK constraint de status para aceitar 'pool'
DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%leads_pool_status%'
    OR conname = 'leads_pool_status_check'
  ) THEN
    -- Remover todas as constraints de status
    ALTER TABLE public.leads_pool
    DROP CONSTRAINT IF EXISTS leads_pool_status_check;
    
    -- Tentar remover constraint com nome diferente
    DO $inner$
    DECLARE
      constraint_name TEXT;
    BEGIN
      FOR constraint_name IN 
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'public.leads_pool'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%status%'
      LOOP
        EXECUTE 'ALTER TABLE public.leads_pool DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
      END LOOP;
    END $inner$;
    
    RAISE NOTICE 'Constraints antigas de status removidas';
  END IF;
  
  -- Criar nova constraint que aceita 'pool' (padrão) ou 'active', 'inactive', 'converted'
  ALTER TABLE public.leads_pool
  ADD CONSTRAINT leads_pool_status_check 
  CHECK (status IN ('pool', 'active', 'inactive', 'converted') OR status IS NULL);
  
  -- Definir valor padrão como 'pool' se não tiver
  ALTER TABLE public.leads_pool
  ALTER COLUMN status SET DEFAULT 'pool';
  
  RAISE NOTICE 'Nova constraint leads_pool_status_check criada (aceita pool, active, inactive, converted)';
END $$;

-- 13. Garantir que razao_social seja NOT NULL (obrigatório)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'razao_social'
    AND is_nullable = 'YES'
  ) THEN
    -- Primeiro atualizar registros NULL para evitar erro
    UPDATE public.leads_pool
    SET razao_social = 'Empresa sem nome'
    WHERE razao_social IS NULL OR razao_social = '';
    
    -- Agora adicionar NOT NULL
    ALTER TABLE public.leads_pool
    ALTER COLUMN razao_social SET NOT NULL;
    
    RAISE NOTICE 'Constraint NOT NULL adicionada ao razao_social em leads_pool';
  ELSE
    RAISE NOTICE 'razao_social já é NOT NULL - pulando';
  END IF;
END $$;

-- 14. Criar índices para performance (se não existirem) - apenas se as colunas existirem
DO $$
BEGIN
  -- Índice para company_id (se coluna existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'company_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_pool_company_id ON public.leads_pool(company_id) WHERE company_id IS NOT NULL;
  END IF;

  -- Índice para cnpj (se coluna existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'cnpj'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_pool_cnpj_not_null ON public.leads_pool(cnpj) WHERE cnpj IS NOT NULL;
  END IF;

  -- Índice para status (se coluna existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_pool_status ON public.leads_pool(status);
  END IF;

  -- Índice para origem (se coluna existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'origem'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_pool_origem ON public.leads_pool(origem) WHERE origem IS NOT NULL;
  END IF;

  -- Índice para icp_score (se coluna existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'icp_score'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_pool_icp_score ON public.leads_pool(icp_score DESC) WHERE icp_score IS NOT NULL;
  END IF;
END $$;

-- 15. Criar índice para tenant_id (obrigatório para RLS)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads_pool' 
    AND column_name = 'tenant_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_pool_tenant_id ON public.leads_pool(tenant_id);
  END IF;
END $$;

-- 15a. Atualizar política RLS para incluir WITH CHECK (obrigatório para INSERT)
DO $$
BEGIN
  -- Remover políticas antigas se existirem
  DROP POLICY IF EXISTS "Authenticated users can manage leads_pool" ON public.leads_pool;
  DROP POLICY IF EXISTS tenant_isolation_leads ON public.leads_pool;

  -- Habilitar RLS se não estiver habilitado
  EXECUTE 'ALTER TABLE public.leads_pool ENABLE ROW LEVEL SECURITY';

  -- Criar nova política de isolamento por tenant com USING e WITH CHECK
  CREATE POLICY tenant_isolation_leads
  ON public.leads_pool
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

  RAISE NOTICE 'Política RLS tenant_isolation_leads criada/atualizada para leads_pool';
END $$;

-- 16. Adicionar comentários para documentação
COMMENT ON COLUMN public.leads_pool.tenant_id IS 'ID do tenant (OBRIGATÓRIO para RLS - isolamento multi-tenant)';
COMMENT ON COLUMN public.leads_pool.cnpj IS 'CNPJ da empresa (NULL para empresas internacionais)';
COMMENT ON COLUMN public.leads_pool.company_id IS 'Referência à empresa na tabela companies (pode ser NULL)';
COMMENT ON COLUMN public.leads_pool.status IS 'Status do lead no pool: pool (padrão), active, inactive, converted';
COMMENT ON COLUMN public.leads_pool.origem IS 'Origem do lead: icp_individual, icp_massa, empresas_aqui, manual, upload_massa';
COMMENT ON COLUMN public.leads_pool.source IS 'Fonte detalhada do lead (ex: icp_batch_analysis, icp_auto_approval)';
COMMENT ON COLUMN public.leads_pool.raw_data IS 'Dados adicionais em formato JSONB (ex: raw_analysis, enrichment_data)';

-- ============================================================================
-- RESULTADO:
-- ✅ Coluna tenant_id adicionada (OBRIGATÓRIA para RLS multi-tenant)
-- ✅ CNPJ pode ser NULL (empresas internacionais permitidas)
-- ✅ Status aceita 'pool' (padrão) e outros valores
-- ✅ Origem aceita 'icp_massa' e outros valores válidos
-- ✅ Colunas company_id, source, razao_social, icp_score, temperatura adicionadas
-- ✅ Índices criados para performance (incluindo tenant_id)
-- ✅ Política RLS tenant_isolation_leads atualizada com USING e WITH CHECK (obrigatório para INSERT)
-- ✅ Aprovação de empresas (individual e em massa) deve funcionar agora
-- ⚠️ IMPORTANTE: Hooks devem fornecer tenant_id ao inserir leads no pool
-- ============================================================================