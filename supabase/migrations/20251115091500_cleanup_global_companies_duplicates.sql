-- ============================================================================
-- Limpa duplicidades em global_companies após introduzir domain_key
-- ============================================================================
WITH ranked AS (
  SELECT
    id,
    tenant_id,
    domain_key,
    created_at,
    row_number() OVER (
      PARTITION BY tenant_id, domain_key
      ORDER BY created_at DESC
    ) AS rn
  FROM public.global_companies
)
DELETE FROM public.global_companies
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);



