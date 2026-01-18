-- ========================================
-- MIGRATION: USAGE CONTEXT PRESETS (IDEMPOTENTE COMPLETA)
-- OBJETIVO: Armazenar presets personalizados de uso final criados pelos usuários
-- ========================================

-- Extensão necessária para gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Tabela
CREATE TABLE IF NOT EXISTS public.usage_context_presets (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    
    -- Informações básicas
    name TEXT NOT NULL, -- Nome do preset (ex: "Pilates Profissional")
    sector TEXT, -- Setor/segmento/nicho (ex: "Aviação", "Aerospace", "Agronegócio")
    description TEXT, -- Descrição do preset
    
    -- Contexto de uso final
    usage_context_include JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de termos INCLUIR
    usage_context_exclude JSONB DEFAULT '[]'::jsonb, -- Array de termos EXCLUIR
    
    -- HS Codes selecionados (com descrições da API)
    hs_codes JSONB DEFAULT '[]'::jsonb, -- Array de objetos: [{code: "950691", description: "..."}, ...]
    
    -- Keywords sugeridas
    keywords JSONB DEFAULT '[]'::jsonb, -- Array de keywords
    
    -- Metadados
    is_system_preset BOOLEAN DEFAULT false, -- true = preset do sistema (não pode deletar), false = criado pelo usuário
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT usage_context_presets_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
    CONSTRAINT usage_context_presets_usage_context_include_check CHECK (jsonb_typeof(usage_context_include) = 'array')
);

-- 2) Índices
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_tenant ON public.usage_context_presets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_workspace ON public.usage_context_presets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_active ON public.usage_context_presets(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_sector ON public.usage_context_presets(tenant_id, sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_created_by ON public.usage_context_presets(created_by);
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_usage_context_include ON public.usage_context_presets USING GIN (usage_context_include);
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_hs_codes ON public.usage_context_presets USING GIN (hs_codes);
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_keywords ON public.usage_context_presets USING GIN (keywords);

-- Constraint UNIQUE (tenant_id, name) para permitir upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usage_context_presets_unique_tenant_name'
      AND conrelid = 'public.usage_context_presets'::regclass
  ) THEN
    ALTER TABLE public.usage_context_presets
      ADD CONSTRAINT usage_context_presets_unique_tenant_name UNIQUE (tenant_id, name);
  END IF;
END$$;

-- 3) Habilitar RLS
ALTER TABLE public.usage_context_presets ENABLE ROW LEVEL SECURITY;

-- 4) Políticas RLS: remover antigas se existirem e recriar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_context_presets' AND policyname = 'Users can view presets from their tenant') THEN
    EXECUTE 'DROP POLICY "Users can view presets from their tenant" ON public.usage_context_presets';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_context_presets' AND policyname = 'Users can create presets in their tenant') THEN
    EXECUTE 'DROP POLICY "Users can create presets in their tenant" ON public.usage_context_presets';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_context_presets' AND policyname = 'Users can update their presets') THEN
    EXECUTE 'DROP POLICY "Users can update their presets" ON public.usage_context_presets';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_context_presets' AND policyname = 'Users can delete their presets') THEN
    EXECUTE 'DROP POLICY "Users can delete their presets" ON public.usage_context_presets';
  END IF;
END$$;

CREATE POLICY "Users can view presets from their tenant"
  ON public.usage_context_presets
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY "Users can create presets in their tenant"
  ON public.usage_context_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their presets"
  ON public.usage_context_presets
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
    AND (
      created_by = auth.uid()
      OR (is_system_preset = false AND created_by IS NULL)
    )
  )
  WITH CHECK (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY "Users can delete their presets"
  ON public.usage_context_presets
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
    AND created_by = auth.uid()
    AND is_system_preset = false
  );

-- 5) Função/Trigger updated_at: drop-if-exists e recriar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_update_usage_context_presets_updated_at'
      AND c.relname = 'usage_context_presets'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP TRIGGER trigger_update_usage_context_presets_updated_at ON public.usage_context_presets';
  END IF;
END$$;

DROP FUNCTION IF EXISTS public.update_usage_context_presets_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_usage_context_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_usage_context_presets_updated_at
  BEFORE UPDATE ON public.usage_context_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_usage_context_presets_updated_at();

-- 6) Seed idempotente: REPLICAR presets do sistema para TODOS os tenants existentes (upsert por tenant_id, name)
-- Usando DO block para iterar sobre todos os tenants e inserir/atualizar presets
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  -- Iterar sobre todos os tenants
  FOR tenant_record IN SELECT id FROM public.tenants LOOP
    -- Inserir/atualizar cada preset para este tenant
    INSERT INTO public.usage_context_presets (
      tenant_id, workspace_id, name, sector, description,
      usage_context_include, usage_context_exclude, hs_codes, keywords,
      is_system_preset, is_active, created_by
    ) VALUES
      (
        tenant_record.id, NULL, 'Pilates Profissional', 'Fitness & Wellness',
        'Equipamentos de Pilates para estúdios profissionais e academias',
        '["pilates studio", "estudio pilates profissional", "equipamento pilates", "aparelho pilates", "máquina pilates", "pilates reformer", "pilates cadillac", "pilates tower", "pilates chair", "academia pilates"]'::jsonb,
        '["home gym", "dumbbell", "uso doméstico", "hobby", "personal trainer", "uso pessoal", "equipamento casa"]'::jsonb,
        '[{"code": "950691", "description": "Articles and equipment for general physical exercise, gymnastics or athletics"}]'::jsonb,
        '["pilates reformer", "pilates equipment", "pilates cadillac", "pilates tower", "pilates chair"]'::jsonb,
        TRUE, TRUE, NULL
      ),
      (
        tenant_record.id, NULL, 'Aviação / Aerospace', 'Aerospace & Defense',
        'Componentes aeronáuticos e aeroespaciais para fabricação e manutenção',
        '["aerospace manufacturing", "aviation industry", "aircraft production", "aircraft maintenance", "aeronautical component", "aviation equipment", "aircraft parts", "aerospace component"]'::jsonb,
        '["hobby drone", "drone hobby", "model aircraft", "retail aviation", "toy aircraft", "uso recreativo"]'::jsonb,
        '[{"code": "880330", "description": "Parts of helicopters"}, {"code": "880390", "description": "Other parts of aircraft or spacecraft"}]'::jsonb,
        '["aerospace component", "aviation equipment", "aircraft parts", "aerospace manufacturing"]'::jsonb,
        TRUE, TRUE, NULL
      ),
      (
        tenant_record.id, NULL, 'Construção Civil / Infraestrutura', 'Construction & Infrastructure',
        'Equipamentos e máquinas de construção para projetos estruturais e infraestrutura',
        '["structural construction", "infrastructure", "construction project", "civil engineering", "construction machinery", "construction equipment", "building construction", "infrastructure project"]'::jsonb,
        '["DIY", "home improvement", "home depot", "do it yourself", "uso doméstico", "reforma casa", "construção casa"]'::jsonb,
        '[{"code": "842951", "description": "Self-propelled bulldozers and angledozers"}, {"code": "842952", "description": "Self-propelled graders and levellers"}]'::jsonb,
        '["construction equipment", "construction machinery", "excavator", "crane", "construction project"]'::jsonb,
        TRUE, TRUE, NULL
      ),
      (
        tenant_record.id, NULL, 'Agronegócio / Produção Animal', 'Agriculture & Livestock',
        'Rações, aditivos e equipamentos para produção animal e aquicultura',
        '["feed mill", "aquaculture", "livestock production", "animal feed production", "livestock nutrition", "poultry production", "swine production", "cattle production"]'::jsonb,
        '["garden center", "pet shop", "retail pet food", "home garden", "pet food", "comida animal doméstico"]'::jsonb,
        '[{"code": "230990", "description": "Preparations of a kind used in animal feeding"}, {"code": "310100", "description": "Animal or vegetable fertilizers"}]'::jsonb,
        '["feed additive", "feed mill", "aquaculture feed", "livestock nutrition", "animal feed"]'::jsonb,
        TRUE, TRUE, NULL
      ),
      (
        tenant_record.id, NULL, 'Dispositivos Médicos Hospitalares', 'Healthcare & Medical',
        'Equipamentos e dispositivos para uso hospitalar e clínicas',
        '["hospital equipment", "medical device", "clinical use", "surgical instrument", "diagnostic equipment", "sterilization"]'::jsonb,
        '["home care", "over the counter", "consumer health", "uso domiciliar", "beleza"]'::jsonb,
        '[{"code": "901890", "description": "Instruments and appliances used in medical, surgical, dental or veterinary sciences"}]'::jsonb,
        '["medical device", "surgical instrument", "diagnostic equipment", "hospital equipment"]'::jsonb,
        TRUE, TRUE, NULL
      ),
      (
        tenant_record.id, NULL, 'Geração Solar Industrial', 'Energy & Utilities',
        'Soluções fotovoltaicas para plantas industriais e usinas solares',
        '["solar power plant", "industrial solar", "pv system", "solar inverter", "string inverter", "central inverter", "solar tracker", "utility scale solar"]'::jsonb,
        '["residential solar", "off-grid home", "camping solar", "hobby solar"]'::jsonb,
        '[{"code": "850440", "description": "Static converters (e.g., inverters)"}]'::jsonb,
        '["solar inverter", "pv module", "solar tracker", "utility solar"]'::jsonb,
        TRUE, TRUE, NULL
      ),
      (
        tenant_record.id, NULL, 'Processamento Industrial de Alimentos', 'Food & Beverage',
        'Linhas e máquinas para processamento industrial de alimentos e bebidas',
        '["food processing line", "industrial mixer", "pasteurization", "bottling line", "filling machine", "food safety"]'::jsonb,
        '["home kitchen", "restaurant small", "domestic blender", "homebrew"]'::jsonb,
        '[{"code": "843880", "description": "Machinery for the industrial preparation or manufacture of food or drink"}]'::jsonb,
        '["food processing", "bottling line", "filling machine", "pasteurization"]'::jsonb,
        TRUE, TRUE, NULL
      )
    ON CONFLICT (tenant_id, name) DO UPDATE
    SET
      sector = EXCLUDED.sector,
      description = EXCLUDED.description,
      usage_context_include = EXCLUDED.usage_context_include,
      usage_context_exclude = EXCLUDED.usage_context_exclude,
      hs_codes = EXCLUDED.hs_codes,
      keywords = EXCLUDED.keywords,
      is_system_preset = TRUE,
      is_active = TRUE,
      updated_at = NOW(),
      updated_by = NULL;
  END LOOP;
END$$;

-- 7) Views para consumo facilitado no app
-- View de presets ATIVOS (filtra apenas is_active = TRUE)
CREATE OR REPLACE VIEW public.v_usage_context_presets_active AS
SELECT
  id,
  tenant_id,
  workspace_id,
  name,
  sector,
  description,
  usage_context_include,
  usage_context_exclude,
  hs_codes,
  keywords,
  is_system_preset,
  created_by,
  created_at,
  updated_at,
  updated_by
FROM public.usage_context_presets
WHERE is_active = TRUE;

-- View de presets ATIVOS filtrados por tenant do usuário autenticado (para consumo direto no app)
CREATE OR REPLACE VIEW public.v_usage_context_presets_active_by_tenant AS
SELECT
  id,
  tenant_id,
  workspace_id,
  name,
  sector,
  description,
  usage_context_include,
  usage_context_exclude,
  hs_codes,
  keywords,
  is_system_preset,
  created_by,
  created_at,
  updated_at,
  updated_by
FROM public.usage_context_presets
WHERE is_active = TRUE
  AND tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid());

-- 8) Permissões nas views
GRANT SELECT ON public.v_usage_context_presets_active TO authenticated;
GRANT SELECT ON public.v_usage_context_presets_active_by_tenant TO authenticated;

-- Habilitar RLS nas views (herdam das tabelas base, mas garantimos explícito)
ALTER VIEW public.v_usage_context_presets_active SET (security_invoker = true);
ALTER VIEW public.v_usage_context_presets_active_by_tenant SET (security_invoker = true);

-- 9) Índice parcial adicional para buscas por sector+ativo (performance)
CREATE INDEX IF NOT EXISTS idx_usage_context_presets_sector_active 
ON public.usage_context_presets(tenant_id, sector) 
WHERE is_active = TRUE AND sector IS NOT NULL;

-- 10) Comentários
COMMENT ON TABLE public.usage_context_presets IS 'Presets personalizados de uso final para busca B2B. Permite que usuários criem e reutilizem configurações de busca.';
COMMENT ON COLUMN public.usage_context_presets.tenant_id IS 'ID do tenant (OBRIGATÓRIO para RLS - isolamento multi-tenant)';
COMMENT ON COLUMN public.usage_context_presets.usage_context_include IS 'Array JSONB com termos que DEFINEM o uso final (obrigatório)';
COMMENT ON COLUMN public.usage_context_presets.usage_context_exclude IS 'Array JSONB com termos que INVALIDAM o uso';
COMMENT ON COLUMN public.usage_context_presets.hs_codes IS 'Array JSONB de objetos {code: string, description: string} com HS Codes e suas descrições da API';
COMMENT ON COLUMN public.usage_context_presets.is_system_preset IS 'true = preset criado pelo sistema (não pode deletar), false = criado pelo usuário';
COMMENT ON COLUMN public.usage_context_presets.sector IS 'Setor/segmento/nicho (ex: "Aviação", "Aerospace", "Agronegócio", "Construção Civil")';

COMMENT ON VIEW public.v_usage_context_presets_active IS 'View de presets ativos para consumo no app (filtra is_active = TRUE)';
COMMENT ON VIEW public.v_usage_context_presets_active_by_tenant IS 'View de presets ativos filtrados por tenant do usuário autenticado (uso direto no app sem WHERE)';

-- ============================================================================
-- RESULTADO:
-- ✅ Tabela usage_context_presets criada com suporte multi-tenant
-- ✅ Presets do sistema REPLICADOS para TODOS os tenants (7 presets: Pilates, Aviação, Construção, Agronegócio, Saúde, Energia, Alimentos)
-- ✅ RLS configurado (usuários veem apenas presets do seu tenant)
-- ✅ Índices GIN para busca rápida em arrays JSONB
-- ✅ Índice parcial para buscas por sector+ativo
-- ✅ Trigger para atualizar updated_at automaticamente
-- ✅ View v_usage_context_presets_active para consumo facilitado
-- ✅ View v_usage_context_presets_active_by_tenant com filtro automático por tenant
-- ✅ GRANTs configurados para authenticated users
-- ============================================================================
