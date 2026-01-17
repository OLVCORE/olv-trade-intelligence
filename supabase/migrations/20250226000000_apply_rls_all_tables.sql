-- ============================================================================
-- APLICAR RLS (ROW LEVEL SECURITY) EM TODAS AS TABELAS PÚBLICAS
-- ============================================================================
-- Migration criada em: 2025-02-26
-- Descrição: Habilita RLS e cria políticas de isolamento multi-tenant
--            para todas as tabelas públicas que ainda não têm RLS
-- ============================================================================

-- ============================================================================
-- ETAPA 1: IDENTIFICAR ESTRUTURA DAS TABELAS
-- ============================================================================

-- Função auxiliar para verificar se uma coluna existe
CREATE OR REPLACE FUNCTION column_exists(
  p_table_schema TEXT,
  p_table_name TEXT,
  p_column_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = p_table_schema
      AND table_name = p_table_name
      AND column_name = p_column_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ETAPA 2: FUNÇÃO PARA APLICAR RLS BASEADO NA ESTRUTURA DA TABELA
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_rls_to_table(p_table_name TEXT)
RETURNS VOID AS $$
DECLARE
  v_has_tenant_id BOOLEAN;
  v_has_company_id BOOLEAN;
  v_rls_enabled BOOLEAN;
  v_has_policies BOOLEAN;
BEGIN
  -- Verificar se tabela existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    RAISE NOTICE 'Tabela % não existe, pulando...', p_table_name;
    RETURN;
  END IF;

  -- Verificar se RLS já está habilitado
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = p_table_name;

  -- Verificar se já tem políticas
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table_name
  ) INTO v_has_policies;

  -- Verificar estrutura da tabela
  SELECT column_exists('public', p_table_name, 'tenant_id') INTO v_has_tenant_id;
  SELECT column_exists('public', p_table_name, 'company_id') INTO v_has_company_id;

  -- Habilitar RLS se ainda não estiver habilitado
  IF NOT v_rls_enabled THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table_name);
    RAISE NOTICE 'RLS habilitado em %', p_table_name;
  END IF;

  -- Se já tem políticas, não recriar
  IF v_has_policies THEN
    RAISE NOTICE 'Tabela % já tem políticas RLS, pulando criação de políticas...', p_table_name;
    RETURN;
  END IF;

  -- ==========================================================================
  -- PADRÃO A: Tabela com tenant_id diretamente
  -- ==========================================================================
  IF v_has_tenant_id THEN
    -- SELECT
    EXECUTE format('
      CREATE POLICY "Tenant isolation select - %s"
      ON public.%I FOR SELECT
      TO authenticated
      USING (
        auth.uid() IS NOT NULL
        AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
      )', p_table_name, p_table_name);

    -- INSERT
    EXECUTE format('
      CREATE POLICY "Tenant isolation insert - %s"
      ON public.%I FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
      )', p_table_name, p_table_name);

    -- UPDATE
    EXECUTE format('
      CREATE POLICY "Tenant isolation update - %s"
      ON public.%I FOR UPDATE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL
        AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
      )
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
      )', p_table_name, p_table_name);

    -- DELETE
    EXECUTE format('
      CREATE POLICY "Tenant isolation delete - %s"
      ON public.%I FOR DELETE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL
        AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
      )', p_table_name, p_table_name);

    RAISE NOTICE 'Políticas RLS criadas para % (padrão tenant_id)', p_table_name;

  -- ==========================================================================
  -- PADRÃO B: Tabela com company_id (via JOIN com companies)
  -- ==========================================================================
  ELSIF v_has_company_id THEN
    -- SELECT
    EXECUTE format('
      CREATE POLICY "Tenant isolation select - %s"
      ON public.%I FOR SELECT
      TO authenticated
      USING (
        auth.uid() IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM public.companies c
            JOIN public.users u ON u.tenant_id = c.tenant_id
            WHERE c.id = %I.company_id
              AND u.id = auth.uid()
          )
          OR company_id IS NULL
        )
      )', p_table_name, p_table_name, p_table_name);

    -- INSERT
    EXECUTE format('
      CREATE POLICY "Tenant isolation insert - %s"
      ON public.%I FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.users u ON u.tenant_id = c.tenant_id
          WHERE c.id = %I.company_id
            AND u.id = auth.uid()
        )
      )', p_table_name, p_table_name, p_table_name);

    -- UPDATE
    EXECUTE format('
      CREATE POLICY "Tenant isolation update - %s"
      ON public.%I FOR UPDATE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.users u ON u.tenant_id = c.tenant_id
          WHERE c.id = %I.company_id
            AND u.id = auth.uid()
        )
      )
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.users u ON u.tenant_id = c.tenant_id
          WHERE c.id = %I.company_id
            AND u.id = auth.uid()
        )
      )', p_table_name, p_table_name, p_table_name, p_table_name);

    -- DELETE
    EXECUTE format('
      CREATE POLICY "Tenant isolation delete - %s"
      ON public.%I FOR DELETE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.users u ON u.tenant_id = c.tenant_id
          WHERE c.id = %I.company_id
            AND u.id = auth.uid()
        )
      )', p_table_name, p_table_name, p_table_name);

    RAISE NOTICE 'Políticas RLS criadas para % (padrão company_id)', p_table_name;

  -- ==========================================================================
  -- PADRÃO C: Tabela global/compartilhada (sem tenant_id nem company_id)
  -- ==========================================================================
  ELSE
    -- Para tabelas globais, apenas autenticação é necessária
    -- (exemplos: configurações globais, dados de referência)
    
    -- SELECT - apenas autenticados podem ler
    EXECUTE format('
      CREATE POLICY "Authenticated users can read - %s"
      ON public.%I FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL)', p_table_name, p_table_name);

    -- INSERT/UPDATE/DELETE bloqueados para usuários normais
    -- (service_role pode fazer tudo via bypass de RLS)
    
    RAISE NOTICE 'Políticas RLS criadas para % (padrão global - apenas leitura)', p_table_name;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ETAPA 3: LISTA DE TABELAS PARA PROCESSAR
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_table_name TEXT;
  v_tables_processed INTEGER := 0;
  v_tables_skipped INTEGER := 0;
BEGIN
  -- Lista de tabelas públicas para processar
  -- (excluindo tabelas de sistema e que já têm RLS configurado corretamente)
  
  FOR r IN 
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN (
        -- Tabelas que já têm RLS configurado corretamente
        'tenants',
        'workspaces',
        'tenant_products',
        'users',
        'companies',
        'sales_deals',
        'sales_pipeline_stages',
        'sales_deal_activities',
        'email_sequences',
        'email_sequence_steps',
        'smart_tasks',
        'sales_automations',
        'commercial_proposals',
        'dealer_contracts',
        'dealer_orders',
        'dealer_performance',
        'marketing_materials',
        'dealer_incentives',
        'icp_analysis_results',
        'sdr_notifications',
        'user_roles',
        'contacts',
        'conversations',
        'messages',
        'account_strategies',
        'executive_reports',
        'executive_reports_versions'
      )
    ORDER BY tablename
  LOOP
    v_table_name := r.tablename;
    
    BEGIN
      PERFORM apply_rls_to_table(v_table_name);
      v_tables_processed := v_tables_processed + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Erro ao processar tabela %: %', v_table_name, SQLERRM;
        v_tables_skipped := v_tables_skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE '======================================';
  RAISE NOTICE 'PROCESSAMENTO RLS CONCLUÍDO!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Tabelas processadas: %', v_tables_processed;
  RAISE NOTICE 'Tabelas com erro: %', v_tables_skipped;
  RAISE NOTICE '======================================';
END $$;

-- ============================================================================
-- ETAPA 4: VALIDAÇÃO - VERIFICAR TABELAS SEM RLS
-- ============================================================================

DO $$
DECLARE
  v_tables_without_rls INTEGER;
  r RECORD;
BEGIN
  SELECT COUNT(*) INTO v_tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT IN (
      -- Excluir views e tabelas de sistema
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
    );

  IF v_tables_without_rls > 0 THEN
    RAISE WARNING 'ATENÇÃO: % tabela(s) ainda sem RLS habilitado!', v_tables_without_rls;
    
    RAISE NOTICE 'Tabelas sem RLS:';
    FOR r IN 
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = false
      ORDER BY tablename
    LOOP
      RAISE NOTICE '  - %', r.tablename;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ Todas as tabelas públicas têm RLS habilitado!';
  END IF;
END $$;

-- ============================================================================
-- ETAPA 5: POLÍTICA PARA SERVICE ROLE (BYPASS RLS)
-- ============================================================================

-- IMPORTANTE: Service role sempre bypassa RLS automaticamente no Supabase
-- Não é necessário criar políticas específicas para service_role
-- Edge Functions que usam service_role terão acesso total

-- ============================================================================
-- ETAPA 6: CASOS ESPECIAIS (Tabelas que precisam de tratamento específico)
-- ============================================================================

-- Tabela: leads_pool (tabela de staging/temporária)
-- Se existir e não tiver tenant_id, tratar como global
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads_pool'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'leads_pool'
    ) THEN
      ALTER TABLE public.leads_pool ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Authenticated users can manage leads_pool"
      ON public.leads_pool FOR ALL
      TO authenticated
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
      
      RAISE NOTICE 'Política especial criada para leads_pool';
    END IF;
  END IF;
END $$;

-- Tabela: global_companies (pode ter tenant_id via tenant_profiles)
-- Verificar se precisa de política especial
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'global_companies'
  ) THEN
    -- Se tem tenant_id via tenant_profiles, aplicar política especial
    IF column_exists('public', 'global_companies', 'tenant_id') THEN
      -- Já será tratado pelo padrão A (tenant_id)
      RAISE NOTICE 'global_companies será processada com padrão tenant_id';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- LIMPEZA: REMOVER FUNÇÕES AUXILIARES (OPCIONAL)
-- ============================================================================

-- Manter função auxiliar para uso futuro
-- DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS apply_rls_to_table(TEXT);

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'MIGRATION RLS COMPLETA!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Para verificar tabelas sem RLS, execute:';
  RAISE NOTICE 'SELECT tablename FROM pg_tables WHERE schemaname = ''public'' AND rowsecurity = false;';
  RAISE NOTICE '';
  RAISE NOTICE 'Para verificar políticas criadas, execute:';
  RAISE NOTICE 'SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = ''public'' ORDER BY tablename, policyname;';
  RAISE NOTICE '======================================';
END $$;

