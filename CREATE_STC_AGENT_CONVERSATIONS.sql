-- 🤖 TABELA PARA HISTÓRICO DE CONVERSAS DO STC AGENT
-- Permite RAG, memória persistente e aprendizado evolutivo

CREATE TABLE IF NOT EXISTS public.stc_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  data JSONB DEFAULT NULL, -- Dados estruturados da análise
  metadata JSONB DEFAULT NULL, -- Metadados (modelo, tokens, custo, etc)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stc_conversations_company 
ON public.stc_agent_conversations(company_id);

CREATE INDEX IF NOT EXISTS idx_stc_conversations_created 
ON public.stc_agent_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stc_conversations_role 
ON public.stc_agent_conversations(role);

-- RLS (Row Level Security)
ALTER TABLE public.stc_agent_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ler suas conversas
CREATE POLICY "Users can read their own STC conversations"
ON public.stc_agent_conversations
FOR SELECT
TO authenticated
USING (true); -- Por enquanto, todos podem ler (depois restringir por workspace)

-- Policy: Usuários autenticados podem inserir conversas
CREATE POLICY "Users can insert STC conversations"
ON public.stc_agent_conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Service role pode tudo
CREATE POLICY "Service role can do everything on STC conversations"
ON public.stc_agent_conversations
TO service_role
USING (true)
WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.stc_agent_conversations IS 'Histórico de conversas do STC Agent (Sales & TOTVS Checker) para RAG e memória evolutiva';
COMMENT ON COLUMN public.stc_agent_conversations.data IS 'Dados estruturados da análise (decisores, sinais, TOTVS check, etc)';
COMMENT ON COLUMN public.stc_agent_conversations.metadata IS 'Metadados (modelo IA usado, tokens consumidos, custo, tempo de resposta)';

