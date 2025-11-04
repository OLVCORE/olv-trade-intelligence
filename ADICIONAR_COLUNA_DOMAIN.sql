-- ⚡ ADICIONAR COLUNA domain NA TABELA companies
-- Execute no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new

-- Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'domain'
    ) THEN
        -- Adicionar coluna domain
        ALTER TABLE public.companies 
        ADD COLUMN domain TEXT;
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_companies_domain 
        ON public.companies(domain);
        
        RAISE NOTICE '✅ Coluna domain adicionada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Coluna domain já existe!';
    END IF;
END $$;

-- Popular coluna domain baseada em website (se aplicável)
UPDATE public.companies
SET domain = CASE
    WHEN website IS NOT NULL AND website != '' THEN
        -- Extrair domínio do website
        REGEXP_REPLACE(
            REGEXP_REPLACE(website, '^https?://(www\.)?', ''),
            '/.*$',
            ''
        )
    ELSE NULL
END
WHERE domain IS NULL AND website IS NOT NULL;

-- Verificação final
SELECT 
    '✅ Coluna domain verificada!' as status,
    COUNT(*) as total_companies,
    COUNT(domain) as companies_with_domain,
    ROUND(COUNT(domain)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as percentage
FROM public.companies;

