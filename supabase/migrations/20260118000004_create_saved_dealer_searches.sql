-- ✅ Migration: Tabela para salvar buscas de dealers
-- Permite salvar buscas realizadas para consultar depois

-- Criar tabela saved_dealer_searches
CREATE TABLE IF NOT EXISTS public.saved_dealer_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- Nome da busca (definido pelo usuário)
  name VARCHAR(255) NOT NULL,
  
  -- Parâmetros da busca (JSONB completo)
  search_params JSONB NOT NULL,
  
  -- Metadados
  results_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT saved_dealer_searches_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Índices
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

-- RLS Policies
ALTER TABLE public.saved_dealer_searches ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver buscas do próprio tenant
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

-- Política: Usuários podem criar buscas no próprio tenant
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

-- Política: Usuários podem atualizar buscas do próprio tenant
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

-- Política: Usuários podem deletar buscas do próprio tenant
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

-- ✅ Criar função update_updated_by_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_saved_dealer_searches_updated_at ON public.saved_dealer_searches;
CREATE TRIGGER trigger_update_saved_dealer_searches_updated_at
  BEFORE UPDATE ON public.saved_dealer_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Atualizar updated_by
DROP TRIGGER IF EXISTS trigger_update_saved_dealer_searches_updated_by ON public.saved_dealer_searches;
CREATE TRIGGER trigger_update_saved_dealer_searches_updated_by
  BEFORE UPDATE ON public.saved_dealer_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ✅ PERMISSÕES PARA API (PostgREST) - CRÍTICO!
-- Garantir que a tabela seja acessível via API REST
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_dealer_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_dealer_searches TO anon;

-- Comentários
COMMENT ON TABLE public.saved_dealer_searches IS 'Buscas de dealers salvas pelos usuários para consulta futura';
COMMENT ON COLUMN public.saved_dealer_searches.search_params IS 'Parâmetros completos da busca (hsCodes, keywords, countries, usageContext, etc)';
COMMENT ON COLUMN public.saved_dealer_searches.results_count IS 'Número de resultados da última execução';
COMMENT ON COLUMN public.saved_dealer_searches.last_run_at IS 'Data/hora da última execução da busca';
