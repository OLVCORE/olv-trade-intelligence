import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface EnrichmentData {
  company_name?: string;
  country?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  domain?: string;
  international_enrichment?: any;
  extracted_info?: any;
  [key: string]: any;
}

/**
 * SINCRONIZA enriquecimento em TODAS as tabelas relacionadas
 * 
 * Atualiza:
 * 1. companies.raw_data
 * 2. icp_analysis_results.raw_data (se company_id existe)
 * 3. leads_pool.raw_data (se company_id existe)
 * 
 * Garante que os dados estejam consistentes em todas as tabelas.
 */
export async function syncEnrichmentToAllTables(
  companyId: string | null | undefined,
  enrichmentData: EnrichmentData,
  options: {
    updateCompanies?: boolean;
    updateICP?: boolean;
    updateLeadsPool?: boolean;
  } = {}
): Promise<{
  companiesUpdated: boolean;
  icpUpdated: boolean;
  leadsPoolUpdated: boolean;
  errors: string[];
}> {
  const result = {
    companiesUpdated: false,
    icpUpdated: false,
    leadsPoolUpdated: false,
    errors: [] as string[]
  };

  const {
    updateCompanies = true,
    updateICP = true,
    updateLeadsPool = true
  } = options;

  // Preparar dados atualizados para raw_data
  const updatedRawData = {
    ...enrichmentData,
    re_enriched_at: new Date().toISOString(),
    extracted_at: enrichmentData.extracted_at || new Date().toISOString(),
    source: enrichmentData.source || 'sync-enrichment',
  };

  // 1. ATUALIZAR companies.raw_data
  if (updateCompanies && companyId) {
    try {
      // Buscar raw_data atual da company
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('raw_data')
        .eq('id', companyId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        result.errors.push(`Erro ao buscar company: ${fetchError.message}`);
      } else {
        const currentRawData = company?.raw_data || {};
        const mergedRawData = {
          ...currentRawData,
          ...updatedRawData,
          // Preservar campos específicos que não devem ser sobrescritos
          company_name: enrichmentData.company_name || currentRawData.company_name,
          domain: enrichmentData.domain || currentRawData.domain || enrichmentData.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
          website: enrichmentData.website || currentRawData.website,
          country: enrichmentData.country || currentRawData.country,
          city: enrichmentData.city || currentRawData.city,
          state: enrichmentData.state || currentRawData.state,
        };

        const { error: updateError } = await supabase
          .from('companies')
          .update({
            raw_data: mergedRawData,
            // Atualizar campos diretos se fornecidos
            ...(enrichmentData.company_name && { company_name: enrichmentData.company_name }),
            ...(enrichmentData.country && { country: enrichmentData.country }),
            ...(enrichmentData.city && { city: enrichmentData.city }),
            ...(enrichmentData.state && { state: enrichmentData.state }),
            ...(enrichmentData.website && { website: enrichmentData.website }),
            ...(mergedRawData.domain && { domain: mergedRawData.domain }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId);

        if (updateError) {
          result.errors.push(`Erro ao atualizar companies: ${updateError.message}`);
        } else {
          result.companiesUpdated = true;
        }
      }
    } catch (error: any) {
      result.errors.push(`Exceção ao atualizar companies: ${error.message}`);
    }
  }

  // 2. ATUALIZAR icp_analysis_results.raw_data (usar raw_data ou raw_analysis dependendo do schema)
  if (updateICP && companyId) {
    try {
      // Buscar registros do ICP para este company_id
      const { data: icpRecords, error: fetchError } = await supabase
        .from('icp_analysis_results')
        .select('id, raw_data, raw_analysis')
        .eq('company_id', companyId);

      if (fetchError) {
        result.errors.push(`Erro ao buscar icp_analysis_results: ${fetchError.message}`);
      } else if (icpRecords && icpRecords.length > 0) {
        for (const icpRecord of icpRecords) {
          const currentRawData = icpRecord.raw_data || icpRecord.raw_analysis || {};
          const mergedRawData = {
            ...currentRawData,
            ...updatedRawData,
            company_name: enrichmentData.company_name || currentRawData.company_name,
            domain: enrichmentData.domain || currentRawData.domain || enrichmentData.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
            website: enrichmentData.website || currentRawData.website,
            country: enrichmentData.country || currentRawData.country,
            city: enrichmentData.city || currentRawData.city,
            state: enrichmentData.state || currentRawData.state,
          };

          // Tentar atualizar raw_data primeiro, se não existir, tentar raw_analysis
          const updateData: any = {
            ...(enrichmentData.company_name && { razao_social: enrichmentData.company_name }),
            ...(enrichmentData.country && { country: enrichmentData.country }),
            ...(enrichmentData.city && { city: enrichmentData.city }),
            ...(enrichmentData.state && { state: enrichmentData.state }),
            updated_at: new Date().toISOString(),
          };

          // Verificar se raw_data existe no schema (sem usar .single() para evitar erro 400)
          const { data: columnCheck, error: columnCheckError } = await supabase
            .from('icp_analysis_results')
            .select('raw_data')
            .limit(1)
            .maybeSingle();

          // Se raw_data existe no schema ou no registro atual, usar raw_data
          if ((columnCheck !== null && !columnCheckError) || 'raw_data' in (icpRecord as any)) {
            updateData.raw_data = mergedRawData;
          } else {
            // Fallback para raw_analysis se raw_data não existir
            updateData.raw_analysis = mergedRawData;
          }

          const { error: updateError } = await supabase
            .from('icp_analysis_results')
            .update(updateData)
            .eq('id', icpRecord.id);

          if (updateError) {
            result.errors.push(`Erro ao atualizar icp_analysis_results ${icpRecord.id}: ${updateError.message}`);
          } else {
            result.icpUpdated = true;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Exceção ao atualizar icp_analysis_results: ${error.message}`);
    }
  }

  // 3. ATUALIZAR leads_pool.raw_data
  if (updateLeadsPool && companyId) {
    try {
      // Buscar registros do leads_pool para este company_id
      const { data: leadsRecords, error: fetchError } = await supabase
        .from('leads_pool')
        .select('id, raw_data')
        .eq('company_id', companyId);

      if (fetchError) {
        result.errors.push(`Erro ao buscar leads_pool: ${fetchError.message}`);
      } else if (leadsRecords && leadsRecords.length > 0) {
        for (const leadRecord of leadsRecords) {
          const currentRawData = leadRecord.raw_data || {};
          const mergedRawData = {
            ...currentRawData,
            ...updatedRawData,
            company_name: enrichmentData.company_name || currentRawData.company_name,
            domain: enrichmentData.domain || currentRawData.domain || enrichmentData.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
            website: enrichmentData.website || currentRawData.website,
            country: enrichmentData.country || currentRawData.country,
            city: enrichmentData.city || currentRawData.city,
            state: enrichmentData.state || currentRawData.state,
          };

          const { error: updateError } = await supabase
            .from('leads_pool')
            .update({
              raw_data: mergedRawData,
              ...(enrichmentData.company_name && { razao_social: enrichmentData.company_name }),
              ...(enrichmentData.website && { website: enrichmentData.website }),
              updated_at: new Date().toISOString(),
            })
            .eq('id', leadRecord.id);

          if (updateError) {
            result.errors.push(`Erro ao atualizar leads_pool ${leadRecord.id}: ${updateError.message}`);
          } else {
            result.leadsPoolUpdated = true;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Exceção ao atualizar leads_pool: ${error.message}`);
    }
  }

  return result;
}
