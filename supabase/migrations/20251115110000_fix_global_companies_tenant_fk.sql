-- ============================================================================
-- CORREÇÃO CRÍTICA: Corrigir foreign key de global_companies para usar tenants
-- ============================================================================

-- 1. Remover a foreign key antiga (se existir)
ALTER TABLE public.global_companies
  DROP CONSTRAINT IF EXISTS global_companies_tenant_id_fkey;

-- 2. Criar a foreign key correta apontando para tenants (não tenant_profiles)
ALTER TABLE public.global_companies
  ADD CONSTRAINT global_companies_tenant_id_fkey
  FOREIGN KEY (tenant_id)
  REFERENCES public.tenants(id)
  ON DELETE CASCADE;

-- 3. Verificar se há registros órfãos (tenant_id que não existe em tenants)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.global_companies gc
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tenants t WHERE t.id = gc.tenant_id
  );
  
  IF orphan_count > 0 THEN
    RAISE WARNING 'Existem % registros em global_companies com tenant_id inválido', orphan_count;
  ELSE
    RAISE NOTICE 'Todos os tenant_id em global_companies são válidos';
  END IF;
END $$;


