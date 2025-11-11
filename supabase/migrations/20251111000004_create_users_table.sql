-- ============================================================================
-- CREATE PUBLIC.USERS TABLE
-- ============================================================================
-- Migration criada em: 2025-11-11
-- Descrição: Criar tabela public.users que mapeia auth.users para multi-tenant
-- ============================================================================

-- 1. CRIAR TABELA PUBLIC.USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  default_workspace_id UUID REFERENCES public.workspaces(id),
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'user', 'dealer'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace ON public.users(default_workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. RLS POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 3. TRIGGER: Auto-criar registro em public.users quando usuário faz signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. MIGRAR USUÁRIOS EXISTENTES (se houver)
-- ============================================================================

INSERT INTO public.users (id, email, full_name)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  RAISE NOTICE '======================================';
  RAISE NOTICE 'TABELA PUBLIC.USERS CRIADA!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Usuários migrados: %', user_count;
  RAISE NOTICE 'RLS Policies: 3 policies ativas';
  RAISE NOTICE 'Trigger: Auto-create user on signup';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'STATUS: PRONTO!';
  RAISE NOTICE '======================================';
END $$;

