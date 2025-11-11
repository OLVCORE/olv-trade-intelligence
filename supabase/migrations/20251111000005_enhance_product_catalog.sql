-- ============================================================================
-- ENHANCE PRODUCT CATALOG - PROFESSIONAL B2B
-- ============================================================================
-- Adiciona campos técnicos profissionais para catálogo B2B internacional
-- ============================================================================

-- 1. Adicionar colunas técnicas profissionais
ALTER TABLE public.tenant_products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[], -- Múltiplas imagens
ADD COLUMN IF NOT EXISTS main_image TEXT, -- Imagem principal
ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::JSONB, -- Especificações técnicas
ADD COLUMN IF NOT EXISTS materials TEXT, -- Materiais de construção
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 12, -- Garantia em meses
ADD COLUMN IF NOT EXISTS lead_time_production_days INTEGER, -- Tempo de produção
ADD COLUMN IF NOT EXISTS shipping_dimensions_cm TEXT, -- Dimensões de envio (L x W x H)
ADD COLUMN IF NOT EXISTS packaging_type TEXT, -- Tipo de embalagem (wooden crate, cardboard, etc)
ADD COLUMN IF NOT EXISTS packaging_weight_kg DECIMAL, -- Peso da embalagem
ADD COLUMN IF NOT EXISTS max_load_capacity_kg DECIMAL, -- Capacidade de carga máxima
ADD COLUMN IF NOT EXISTS assembly_required BOOLEAN DEFAULT true, -- Requer montagem?
ADD COLUMN IF NOT EXISTS assembly_time_minutes INTEGER, -- Tempo de montagem
ADD COLUMN IF NOT EXISTS origin_country TEXT DEFAULT 'BR', -- País de origem
ADD COLUMN IF NOT EXISTS brand TEXT, -- Marca
ADD COLUMN IF NOT EXISTS model TEXT, -- Modelo
ADD COLUMN IF NOT EXISTS sku TEXT, -- SKU
ADD COLUMN IF NOT EXISTS barcode TEXT, -- Código de barras
ADD COLUMN IF NOT EXISTS certifications_detailed JSONB DEFAULT '[]'::JSONB, -- Certificações detalhadas
ADD COLUMN IF NOT EXISTS user_manual_url TEXT, -- URL do manual do usuário
ADD COLUMN IF NOT EXISTS video_url TEXT, -- URL de vídeo demonstrativo
ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1, -- MOQ
ADD COLUMN IF NOT EXISTS recommended_retail_price_usd DECIMAL, -- Preço sugerido de revenda
ADD COLUMN IF NOT EXISTS wholesale_discount_percentage DECIMAL, -- Desconto para atacado
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0, -- Estoque disponível
ADD COLUMN IF NOT EXISTS restocking_alert_level INTEGER DEFAULT 5; -- Nível de alerta de estoque

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_products_sku ON public.tenant_products(sku);
CREATE INDEX IF NOT EXISTS idx_tenant_products_brand ON public.tenant_products(brand);
CREATE INDEX IF NOT EXISTS idx_tenant_products_model ON public.tenant_products(model);
CREATE INDEX IF NOT EXISTS idx_tenant_products_stock ON public.tenant_products(stock_quantity);

-- 3. Criar Storage Bucket para imagens de produtos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS para product-images bucket (idempotente)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 5. Atualizar produtos existentes com valores padrão
UPDATE public.tenant_products
SET 
  warranty_months = 12,
  origin_country = 'BR',
  min_order_quantity = 1,
  assembly_required = true
WHERE warranty_months IS NULL;

-- 6. Comentários explicativos
COMMENT ON COLUMN public.tenant_products.images IS 'Array de URLs de imagens do produto (múltiplas fotos)';
COMMENT ON COLUMN public.tenant_products.main_image IS 'URL da imagem principal do produto';
COMMENT ON COLUMN public.tenant_products.technical_specs IS 'JSON com especificações técnicas: {material, color, finish, max_load, etc}';
COMMENT ON COLUMN public.tenant_products.certifications_detailed IS 'JSON com certificações: [{name, issuer, number, expires_at, file_url}]';
COMMENT ON COLUMN public.tenant_products.shipping_dimensions_cm IS 'Dimensões de envio em cm: 200 x 60 x 80';
COMMENT ON COLUMN public.tenant_products.packaging_type IS 'Tipo de embalagem: wooden_crate, cardboard_box, pallet, etc';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PRODUCT CATALOG ENHANCED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Novos campos adicionados:';
  RAISE NOTICE '  - images (múltiplas fotos)';
  RAISE NOTICE '  - technical_specs (JSON)';
  RAISE NOTICE '  - materials, warranty, certifications';
  RAISE NOTICE '  - dimensions, packaging, assembly';
  RAISE NOTICE '  - SKU, brand, model, barcode';
  RAISE NOTICE '  - Stock management';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Storage bucket criado: product-images';
  RAISE NOTICE '========================================';
END $$;

