-- ✅ TABELA DE AUDITORIA DE CRÉDITOS APOLLO
-- Rastreia TODAS as revelações de email para garantir transparência

CREATE TABLE IF NOT EXISTS public.apollo_credit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  decisor_id UUID REFERENCES public.decision_makers(id) ON DELETE SET NULL,
  decisor_name TEXT,
  decisor_email_before TEXT,
  decisor_email_after TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('reveal_email', 'reveal_phone', 'enrich_decisores')),
  source TEXT, -- 'apollo_reveal', 'hunter_io', 'phantom'
  credits_consumed INTEGER DEFAULT 1,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_apollo_credit_log_user_id ON public.apollo_credit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_apollo_credit_log_created_at ON public.apollo_credit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apollo_credit_log_decisor_id ON public.apollo_credit_log(decisor_id);
CREATE INDEX IF NOT EXISTS idx_apollo_credit_log_company_id ON public.apollo_credit_log(company_id);

-- Desabilitar RLS (para service_role)
ALTER TABLE public.apollo_credit_log DISABLE ROW LEVEL SECURITY;

-- ✅ View para relatório de consumo
CREATE OR REPLACE VIEW apollo_credit_usage_report AS
SELECT
  DATE(created_at) as date,
  action,
  source,
  COUNT(*) as total_operations,
  SUM(credits_consumed) as total_credits,
  COUNT(CASE WHEN success = TRUE THEN 1 END) as successful,
  COUNT(CASE WHEN success = FALSE THEN 1 END) as failed
FROM apollo_credit_log
GROUP BY DATE(created_at), action, source
ORDER BY date DESC, total_credits DESC;

COMMENT ON TABLE public.apollo_credit_log IS 'Log de auditoria de consumo de créditos Apollo';
COMMENT ON VIEW apollo_credit_usage_report IS 'Relatório diário de consumo de créditos Apollo';

