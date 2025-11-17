-- ============================================================================
-- CORREÇÃO CRÍTICA: Limpa duplicatas e garante domain_key correto
-- ============================================================================

-- 1. Remover a coluna antiga se existir (com CASCADE para remover dependências)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'global_companies'
      AND column_name = 'domain_key'
  ) THEN
    BEGIN
      ALTER TABLE public.global_companies DROP COLUMN domain_key CASCADE;
    EXCEPTION WHEN undefined_column THEN
      -- já removida por dependência
      NULL;
    END;
  END IF;
END $$;

-- 2. Recriar a coluna domain_key (gerada)
ALTER TABLE public.global_companies
  ADD COLUMN domain_key text
    GENERATED ALWAYS AS (
      COALESCE(
        NULLIF(TRIM(domain), ''),
        company_name || '|' || COALESCE(country, ''),
        company_name
      )
    ) STORED;

-- 3. Remover índices/constraints antigos (use ALTER TABLE para constraints)
DROP INDEX IF EXISTS idx_global_companies_tenant_domain;
ALTER TABLE public.global_companies
  DROP CONSTRAINT IF EXISTS global_companies_domain_key;

-- 4. Limpar duplicatas antes de criar índice único
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, domain_key
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.global_companies
)
DELETE FROM public.global_companies gc
USING ranked r
WHERE gc.id = r.id
  AND r.rn > 1;

-- 5. Criar o índice único
CREATE UNIQUE INDEX idx_global_companies_tenant_domain
  ON public.global_companies (tenant_id, domain_key);

-- 6. Verificar duplicatas restantes
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT tenant_id, domain_key
    FROM public.global_companies
    GROUP BY tenant_id, domain_key
    HAVING COUNT(*) > 1
  ) t;

  IF dup_count > 0 THEN
    RAISE WARNING 'Ainda existem % grupos de duplicatas após limpeza', dup_count;
  ELSE
    RAISE NOTICE 'Limpeza concluída: nenhuma duplicata encontrada';
  END IF;
END $$;

