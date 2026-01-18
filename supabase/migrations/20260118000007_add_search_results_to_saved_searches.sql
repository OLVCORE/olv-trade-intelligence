-- ✅ Migration: Adicionar coluna search_results para salvar os dealers encontrados
-- Permite salvar os RESULTADOS da busca (dealers), não apenas os parâmetros

-- Adicionar coluna search_results (JSONB) para armazenar os dealers encontrados
ALTER TABLE public.saved_dealer_searches
  ADD COLUMN IF NOT EXISTS search_results JSONB DEFAULT '[]'::jsonb;

-- Criar índice GIN para busca eficiente em search_results
CREATE INDEX IF NOT EXISTS idx_saved_dealer_searches_search_results 
  ON public.saved_dealer_searches USING GIN (search_results);

-- Comentário para documentação
COMMENT ON COLUMN public.saved_dealer_searches.search_results IS 
  'Array JSONB com os dealers encontrados na busca (resultados completos, não apenas parâmetros)';
