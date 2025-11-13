-- MIGRAR DADOS DE raw_data PARA CAMPOS DIRETOS
-- Isso garante que Apollo, LinkedIn, City aparecerÃ£o no card

UPDATE public.companies
SET 
  linkedin_url = COALESCE(linkedin_url, raw_data->>'linkedin_url'),
  apollo_id = COALESCE(apollo_id, raw_data->>'apollo_id'),
  data_source = COALESCE(data_source, raw_data->>'source', 'dealer_discovery')
WHERE 
  company_name IN ('Balanced Body', 'Merrithew STOTT Pilates', 'Elina Pilates', 
                   'Gratz Industries', 'Peak Pilates', 'Align-Pilates',
                   'P.E.Pilates', 'Jaalee Fit', 'WellReformer', 'Aero Pilates')
  AND (
    linkedin_url IS NULL 
    OR apollo_id IS NULL 
    OR data_source IS NULL
  );

-- VERIFICAR RESULTADO
SELECT 
  company_name,
  city,
  state,
  country,
  linkedin_url,
  apollo_id,
  data_source,
  raw_data->>'linkedin_url' as raw_linkedin,
  raw_data->>'apollo_id' as raw_apollo
FROM public.companies
WHERE company_name IN ('Balanced Body', 'Merrithew STOTT Pilates', 'Elina Pilates')
ORDER BY company_name;
