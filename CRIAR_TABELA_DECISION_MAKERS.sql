-- ============================================================================
-- CRIAR TABELA decision_makers (SE NÃO EXISTIR)
-- ============================================================================

-- Criar tabela decision_makers
CREATE TABLE IF NOT EXISTS public.decision_makers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  position text,
  email text,
  phone text,
  linkedin_url text,
  photo_url text,
  city text,
  state text,
  country text,
  headline text,
  email_status text,
  seniority_level text,
  data_source text DEFAULT 'manual',
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prevenir duplicatas (mesmo decisor na mesma empresa)
CREATE UNIQUE INDEX IF NOT EXISTS decision_makers_company_fullname_uq
  ON public.decision_makers (company_id, full_name);

-- Índices para performance
CREATE INDEX IF NOT EXISTS decision_makers_company_id_idx 
  ON public.decision_makers (company_id);

CREATE INDEX IF NOT EXISTS decision_makers_data_source_idx 
  ON public.decision_makers (data_source);

CREATE INDEX IF NOT EXISTS decision_makers_email_idx 
  ON public.decision_makers (email) WHERE email IS NOT NULL;

-- RLS (opcional - descomente se necessário)
-- ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;

-- Política de leitura (descomente se usar RLS)
-- CREATE POLICY "Users can read decision_makers from their tenant" 
-- ON public.decision_makers FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.companies c
--     WHERE c.id = decision_makers.company_id
--       AND c.tenant_id = auth.jwt()->>'tenant_id'::uuid
--   )
-- );

-- Verificar criação
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'decision_makers'
ORDER BY ordinal_position;

-- Contar decisores existentes
SELECT COUNT(*) as total_decisores 
FROM public.decision_makers;

