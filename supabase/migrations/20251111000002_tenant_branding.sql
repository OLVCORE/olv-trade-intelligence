-- ============================================================================
-- TENANT BRANDING SYSTEM
-- ============================================================================
-- Migration criada em: 2025-11-11
-- Descrição: Adiciona sistema completo de branding por tenant
-- ============================================================================

-- 1️⃣ ADICIONAR COLUNAS DE BRANDING NA TABELA TENANTS

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Garantir que primary_color e secondary_color existem (já devem existir da migration anterior)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0052CC';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#00B8D9';

-- 2️⃣ ATUALIZAR METALIFE COM DADOS REAIS

UPDATE public.tenants 
SET 
  logo_url = NULL, -- Será feito upload depois via UI
  primary_color = '#10B981', -- Verde MetaLife
  secondary_color = '#059669', -- Verde escuro MetaLife
  contact_email = 'export@metalifepilates.com.br',
  contact_phone = '+55 12 0800-056-2467',
  address = 'Estrada Municipal Taubaté-Pinda, KM 8',
  city = 'Taubaté',
  state = 'SP',
  country = 'BR',
  zip_code = '12062-000'
WHERE slug = 'metalife';

-- 3️⃣ CRIAR BUCKET PARA LOGOS (Supabase Storage)

INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 4️⃣ POLICIES PARA TENANT-LOGOS BUCKET

-- Policy: Tenants podem fazer upload do próprio logo
DROP POLICY IF EXISTS "Tenants can upload own logo" ON storage.objects;
CREATE POLICY "Tenants can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::TEXT FROM public.users WHERE id = auth.uid())
);

-- Policy: Tenants podem atualizar o próprio logo
DROP POLICY IF EXISTS "Tenants can update own logo" ON storage.objects;
CREATE POLICY "Tenants can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-logos' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::TEXT FROM public.users WHERE id = auth.uid())
);

-- Policy: Tenants podem deletar o próprio logo
DROP POLICY IF EXISTS "Tenants can delete own logo" ON storage.objects;
CREATE POLICY "Tenants can delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-logos' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::TEXT FROM public.users WHERE id = auth.uid())
);

-- Policy: Logos são públicos (qualquer um pode ler)
DROP POLICY IF EXISTS "Logos are publicly readable" ON storage.objects;
CREATE POLICY "Logos are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-logos');

-- ============================================================================
-- ✅ VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  metalife_record RECORD;
BEGIN
  -- Buscar dados do MetaLife
  SELECT * INTO metalife_record FROM public.tenants WHERE slug = 'metalife';
  
  RAISE NOTICE '======================================';
  RAISE NOTICE 'TENANT BRANDING SETUP COMPLETO!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'MetaLife atualizado:';
  RAISE NOTICE '  - Cor primária: %', metalife_record.primary_color;
  RAISE NOTICE '  - Email: %', metalife_record.contact_email;
  RAISE NOTICE '  - Telefone: %', metalife_record.contact_phone;
  RAISE NOTICE '  - Endereço: %', metalife_record.address;
  RAISE NOTICE '  - Cidade: % - %', metalife_record.city, metalife_record.state;
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Storage Bucket tenant-logos: Criado';
  RAISE NOTICE 'Policies: 4 policies configuradas';
  RAISE NOTICE '======================================';
END $$;

