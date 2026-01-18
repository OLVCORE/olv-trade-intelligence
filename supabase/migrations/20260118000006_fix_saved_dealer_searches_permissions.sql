-- ✅ FIX CRÍTICO: Garantir que saved_dealer_searches esteja acessível via API
-- Este script corrige o erro PGRST205 "Could not find the table in the schema cache"

-- ✅ 1. Garantir que a tabela existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_dealer_searches'
  ) THEN
    -- Criar tabela se não existir
    CREATE TABLE public.saved_dealer_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      search_params JSONB NOT NULL,
      results_count INTEGER DEFAULT 0,
      last_run_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      CONSTRAINT saved_dealer_searches_name_not_empty CHECK (char_length(trim(name)) > 0)
    );
  END IF;
END $$;

-- ✅ 2. Garantir permissões para API (PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_dealer_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_dealer_searches TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ✅ 3. Habilitar RLS (já deve estar habilitado, mas garantir)
ALTER TABLE public.saved_dealer_searches ENABLE ROW LEVEL SECURITY;

-- ✅ 4. Garantir que políticas RLS existem
DROP POLICY IF EXISTS "Users can view saved searches from their tenant" ON public.saved_dealer_searches;
CREATE POLICY "Users can view saved searches from their tenant"
  ON public.saved_dealer_searches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.tenant_id = saved_dealer_searches.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can create saved searches in their tenant" ON public.saved_dealer_searches;
CREATE POLICY "Users can create saved searches in their tenant"
  ON public.saved_dealer_searches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.tenant_id = saved_dealer_searches.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can update saved searches in their tenant" ON public.saved_dealer_searches;
CREATE POLICY "Users can update saved searches in their tenant"
  ON public.saved_dealer_searches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.tenant_id = saved_dealer_searches.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.tenant_id = saved_dealer_searches.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can delete saved searches from their tenant" ON public.saved_dealer_searches;
CREATE POLICY "Users can delete saved searches from their tenant"
  ON public.saved_dealer_searches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.tenant_id = saved_dealer_searches.tenant_id
    )
  );

-- ✅ 5. Garantir índices
CREATE INDEX IF NOT EXISTS idx_saved_dealer_searches_tenant_id 
  ON public.saved_dealer_searches(tenant_id);
  
CREATE INDEX IF NOT EXISTS idx_saved_dealer_searches_workspace_id 
  ON public.saved_dealer_searches(workspace_id);
  
CREATE INDEX IF NOT EXISTS idx_saved_dealer_searches_created_by 
  ON public.saved_dealer_searches(created_by);
  
CREATE INDEX IF NOT EXISTS idx_saved_dealer_searches_name 
  ON public.saved_dealer_searches(tenant_id, name);
  
CREATE INDEX IF NOT EXISTS idx_saved_dealer_searches_last_run_at 
  ON public.saved_dealer_searches(tenant_id, last_run_at DESC);

-- ✅ 6. Criar função update_updated_by_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 7. Garantir triggers
DROP TRIGGER IF EXISTS trigger_update_saved_dealer_searches_updated_at ON public.saved_dealer_searches;
CREATE TRIGGER trigger_update_saved_dealer_searches_updated_at
  BEFORE UPDATE ON public.saved_dealer_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_saved_dealer_searches_updated_by ON public.saved_dealer_searches;
CREATE TRIGGER trigger_update_saved_dealer_searches_updated_by
  BEFORE UPDATE ON public.saved_dealer_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ✅ NOTA: Após aplicar esta migração, o PostgREST pode precisar de alguns segundos para recarregar o schema cache
-- Se o erro persistir, tente:
-- 1. Aguardar 10-30 segundos após aplicar a migração
-- 2. Recarregar a página do frontend
-- 3. Verificar no Supabase Dashboard > API > Tables se saved_dealer_searches aparece
