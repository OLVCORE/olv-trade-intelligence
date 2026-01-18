-- ✅ Migration: Popular search_results para buscas antigas (antes da migração 20260118000007)
-- Tenta recuperar os dealers salvos no banco associados a buscas antigas

-- Função para buscar dealers salvos associados a uma busca salva
-- Baseado em raw_data->>'saved_search_id' = saved_dealer_searches.id
DO $$
DECLARE
  saved_search RECORD;
  dealers_found JSONB;
  dealer_record RECORD;
BEGIN
  -- Iterar sobre todas as buscas salvas que não têm search_results (ou está vazio)
  FOR saved_search IN 
    SELECT id, tenant_id, workspace_id, search_params
    FROM public.saved_dealer_searches
    WHERE search_results IS NULL 
       OR search_results = '[]'::jsonb
       OR jsonb_array_length(COALESCE(search_results, '[]'::jsonb)) = 0
  LOOP
    -- Buscar dealers salvos no banco que têm saved_search_id no raw_data
    dealers_found := '[]'::jsonb;
    
    -- Buscar em companies onde raw_data->>'saved_search_id' = saved_search.id
    FOR dealer_record IN
      SELECT 
        id,
        company_name,
        website,
        country,
        city,
        state,
        industry,
        employee_count,
        employees_count,
        linkedin_url,
        apollo_id,
        b2b_type,
        description,
        raw_data
      FROM public.companies
      WHERE tenant_id = saved_search.tenant_id
        AND data_source = 'dealer_discovery'
        AND raw_data->>'saved_search_id' = saved_search.id::text
      ORDER BY created_at DESC
      LIMIT 500 -- Limitar a 500 dealers por busca
    LOOP
      -- Construir objeto dealer no formato esperado
      dealers_found := dealers_found || jsonb_build_array(
        jsonb_build_object(
          'id', dealer_record.id,
          'name', dealer_record.company_name,
          'website', dealer_record.website,
          'country', dealer_record.country,
          'city', COALESCE(dealer_record.city, ''),
          'state', dealer_record.state,
          'industry', COALESCE(dealer_record.industry, ''),
          'employee_count', COALESCE(dealer_record.employee_count, dealer_record.employees_count),
          'linkedin_url', dealer_record.linkedin_url,
          'apollo_id', dealer_record.apollo_id,
          'b2b_type', dealer_record.b2b_type,
          'description', dealer_record.description,
          'raw_data', dealer_record.raw_data,
          -- Campos derivados do raw_data
          'fitScore', COALESCE((dealer_record.raw_data->>'fit_score')::integer, 50),
          'decision_makers', COALESCE(dealer_record.raw_data->'decision_makers', '[]'::jsonb),
          'apollo_link', dealer_record.raw_data->>'apollo_link'
        )
      );
    END LOOP;
    
    -- Se encontrou dealers, atualizar search_results
    IF jsonb_array_length(dealers_found) > 0 THEN
      UPDATE public.saved_dealer_searches
      SET search_results = dealers_found,
          updated_at = NOW()
      WHERE id = saved_search.id;
      
      RAISE NOTICE '✅ Busca salva %: % dealers recuperados', saved_search.id, jsonb_array_length(dealers_found);
    ELSE
      -- Se não encontrou por saved_search_id, tentar buscar por países (fallback)
      -- Usar países do search_params
      IF saved_search.search_params->'countries' IS NOT NULL THEN
        DECLARE
          countries_array TEXT[];
          fallback_dealers JSONB := '[]'::jsonb;
        BEGIN
          -- Extrair países do search_params
          SELECT ARRAY(SELECT jsonb_array_elements_text(saved_search.search_params->'countries'))
          INTO countries_array;
          
          -- Buscar dealers por países e tenant_id
          FOR dealer_record IN
            SELECT 
              id,
              company_name,
              website,
              country,
              city,
              state,
              industry,
              employee_count,
              employees_count,
              linkedin_url,
              apollo_id,
              b2b_type,
              description,
              raw_data
            FROM public.companies
            WHERE tenant_id = saved_search.tenant_id
              AND data_source = 'dealer_discovery'
              AND country = ANY(countries_array)
              AND created_at >= (SELECT created_at FROM public.saved_dealer_searches WHERE id = saved_search.id) - INTERVAL '1 day'
              AND created_at <= (SELECT created_at FROM public.saved_dealer_searches WHERE id = saved_search.id) + INTERVAL '1 day'
            ORDER BY created_at DESC
            LIMIT 200
          LOOP
            fallback_dealers := fallback_dealers || jsonb_build_array(
              jsonb_build_object(
                'id', dealer_record.id,
                'name', dealer_record.company_name,
                'website', dealer_record.website,
                'country', dealer_record.country,
                'city', COALESCE(dealer_record.city, ''),
                'state', dealer_record.state,
                'industry', COALESCE(dealer_record.industry, ''),
                'employee_count', COALESCE(dealer_record.employee_count, dealer_record.employees_count),
                'linkedin_url', dealer_record.linkedin_url,
                'apollo_id', dealer_record.apollo_id,
                'b2b_type', dealer_record.b2b_type,
                'description', dealer_record.description,
                'raw_data', dealer_record.raw_data,
                'fitScore', COALESCE((dealer_record.raw_data->>'fit_score')::integer, 50),
                'decision_makers', COALESCE(dealer_record.raw_data->'decision_makers', '[]'::jsonb),
                'apollo_link', dealer_record.raw_data->>'apollo_link'
              )
            );
          END LOOP;
          
          -- Se encontrou dealers por fallback, atualizar
          IF jsonb_array_length(fallback_dealers) > 0 THEN
            UPDATE public.saved_dealer_searches
            SET search_results = fallback_dealers,
                updated_at = NOW()
            WHERE id = saved_search.id;
            
            RAISE NOTICE '⚠️ Busca salva %: % dealers recuperados via fallback (por países)', saved_search.id, jsonb_array_length(fallback_dealers);
          ELSE
            RAISE NOTICE 'ℹ️ Busca salva %: Nenhum dealer encontrado (nem por saved_search_id nem por países)', saved_search.id;
          END IF;
        END;
      ELSE
        RAISE NOTICE 'ℹ️ Busca salva %: Nenhum dealer encontrado e não há países para fallback', saved_search.id;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Migração de backfill concluída!';
END $$;

-- Comentário para documentação
COMMENT ON COLUMN public.saved_dealer_searches.search_results IS 
  'Array JSONB com os dealers encontrados na busca (resultados completos, não apenas parâmetros). Buscas antigas podem estar vazias se os dealers não foram salvos com saved_search_id.';
