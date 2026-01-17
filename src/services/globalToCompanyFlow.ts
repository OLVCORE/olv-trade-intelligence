/**
 * GLOBAL TO COMPANY FLOW
 * 
 * Fluxo automatizado: global_companies → companies → icp_analysis_results → Enriquecimento
 * 
 * Conecta a Sala Global de Alvos com o fluxo completo de qualificação ICP
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Função: getLeadSourceFromGlobal(globalCompany: GlobalCompany): string
 * 
 * Identifica Lead Source baseado nos dados do global_company
 */
function getLeadSourceFromGlobal(globalCompany: GlobalCompany): string {
  const engine = globalCompany.sources?.discovery?.engine || '';
  const engineLower = engine.toLowerCase();
  
  if (engineLower.includes('panjiva')) {
    return 'Panjiva';
  }
  
  if (engineLower.includes('trade') || engineLower === 'motor_trade') {
    return 'Motor Trade';
  }
  
  if (engineLower.includes('b2b') || engineLower === 'sala_global_b2b') {
    return 'Sala Global B2B';
  }
  
  // Fallback padrão
  return 'Motor Trade';
}

export interface GlobalCompany {
  id: string;
  tenant_id: string;
  company_name: string;
  domain?: string | null;
  country?: string | null;
  city?: string | null;
  industry?: string | null;
  company_type?: string | null;
  fit_score?: number | null;
  sources?: any;
  enrichment_stage?: string;
  status?: string;
}

export interface TransferResult {
  success: boolean;
  companiesCreated: number;
  companiesSkipped: number;
  quarantineCreated: number;
  enrichmentStarted: number;
  errors: string[];
  error?: string;
}

/**
 * Transferir empresas da Sala Global para base de empresas e ICP Quarentena
 * 
 * FLUXO AUTOMATIZADO:
 * 1. Verificar se empresa já existe em companies (por domain ou nome+país)
 * 2. Criar em companies (se não existir)
 * 3. Criar em icp_analysis_results (quarentena) com status 'pendente'
 * 4. Iniciar enriquecimento automático (Receita Federal, Apollo, etc.)
 * 
 * @param globalCompanies - Array de empresas da Sala Global
 * @param autoEnrich - Se true, inicia enriquecimento automático
 * @returns Resultado da transferência
 */
export async function transferGlobalToCompanies(
  globalCompanies: GlobalCompany[],
  autoEnrich: boolean = true
): Promise<TransferResult> {
  const result: TransferResult = {
    success: false,
    companiesCreated: 0,
    companiesSkipped: 0,
    quarantineCreated: 0,
    enrichmentStarted: 0,
    errors: []
  };

  if (!globalCompanies || globalCompanies.length === 0) {
    throw new Error('Nenhuma empresa selecionada para transferir');
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  // ✅ OBTER TENANT_ID E WORKSPACE_ID DO USUÁRIO
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('tenant_id, default_workspace_id')
    .eq('id', user.id)
    .single();

  if (userDataError || !userData?.tenant_id) {
    throw new Error('Usuário sem tenant configurado');
  }

  console.log(`🚀 [GLOBAL-FLOW] Transferindo ${globalCompanies.length} empresas...`);

  try {
    const companiesToInsert: any[] = [];
    const quarantineEntries: any[] = [];
    const companyIdMap = new Map<string, string>(); // global_id -> company_id

    // ETAPA 1: Processar cada empresa global
    for (const globalCompany of globalCompanies) {
      try {
        // Verificar se já existe em companies
        let existingCompanyId: string | null = null;
        
        if (globalCompany.domain) {
          const { data: existingByDomain } = await supabase
            .from('companies')
            .select('id')
            .eq('tenant_id', globalCompany.tenant_id)
            .eq('website', globalCompany.domain)
            .maybeSingle();
          
          existingCompanyId = existingByDomain?.id || null;
        }

        // Se não encontrou por domain, buscar por nome+país
        if (!existingCompanyId) {
          const { data: existingByName } = await supabase
            .from('companies')
            .select('id')
            .eq('tenant_id', globalCompany.tenant_id)
            .eq('name', globalCompany.company_name)
            .eq('country', globalCompany.country || '')
            .maybeSingle();
          
          existingCompanyId = existingByName?.id || null;
        }

        if (existingCompanyId) {
          // Empresa já existe - usar ID existente
          companyIdMap.set(globalCompany.id, existingCompanyId);
          result.companiesSkipped++;
          console.log(`✓ Empresa ${globalCompany.company_name} já existe (ID: ${existingCompanyId})`);
        } else {
          // ✅ Função helper para identificar Lead Source
          const getLeadSourceFromGlobal = (gc: GlobalCompany): string => {
            const engine = gc.sources?.discovery?.engine || '';
            const engineLower = engine.toLowerCase();
            
            if (engineLower.includes('panjiva')) {
              return 'Panjiva';
            }
            
            if (engineLower.includes('trade') || engineLower === 'motor_trade') {
              return 'Motor Trade';
            }
            
            if (engineLower.includes('b2b') || engineLower === 'sala_global_b2b') {
              return 'Sala Global B2B';
            }
            
            // Fallback padrão
            return 'Motor Trade';
          };
          
          // Criar nova empresa
          const newCompany = {
            tenant_id: globalCompany.tenant_id,
            name: globalCompany.company_name,
            company_name: globalCompany.company_name,
            website: globalCompany.domain || null,
            domain: globalCompany.domain || null,
            country: globalCompany.country || null,
            city: globalCompany.city || null,
            industry: globalCompany.industry || null,
            b2b_type: globalCompany.company_type || 'dealer',
            data_source: 'global_discovery',
            lead_source: getLeadSourceFromGlobal(globalCompany), // ✅ NOVO: Registro de Lead Source (campo direto)
            source_type: 'global_targets',
            source_name: globalCompany.sources?.discovery?.engine || 'sala-global',
            raw_data: {
              global_company_id: globalCompany.id,
              fit_score: globalCompany.fit_score,
              sources: globalCompany.sources,
              enrichment_stage: globalCompany.enrichment_stage,
              discovery_date: new Date().toISOString(),
              engine: globalCompany.sources?.discovery?.engine || 'unknown',
              lead_source: getLeadSourceFromGlobal(globalCompany), // ✅ NOVO: Registro de Lead Source
            },
          };

          companiesToInsert.push({
            ...newCompany,
            _global_id: globalCompany.id, // Temporário para mapear depois
          });
        }
      } catch (err: any) {
        console.error(`❌ Erro ao processar ${globalCompany.company_name}:`, err);
        result.errors.push(`${globalCompany.company_name}: ${err.message}`);
      }
    }

    // ETAPA 2: Inserir novas empresas em companies
    if (companiesToInsert.length > 0) {
      const companiesData = companiesToInsert.map(({ _global_id, ...company }) => company);
      
      const { data: insertedCompanies, error: insertError } = await supabase
        .from('companies')
        .insert(companiesData)
        .select('id, name');

      if (insertError) {
        console.error('❌ [GLOBAL-FLOW] Erro ao inserir companies:', insertError);
        result.errors.push(`Companies: ${insertError.message}`);
        throw insertError;
      }

      // Mapear IDs criados
      insertedCompanies?.forEach((company, index) => {
        const globalId = companiesToInsert[index]._global_id;
        companyIdMap.set(globalId, company.id);
      });

      result.companiesCreated = insertedCompanies?.length || 0;
      console.log(`✅ [GLOBAL-FLOW] ${result.companiesCreated} empresas criadas em companies`);
    }

    // ETAPA 3: Criar entradas na Quarentena ICP
    for (const globalCompany of globalCompanies) {
      try {
        const companyId = companyIdMap.get(globalCompany.id);
        if (!companyId) {
          console.warn(`⚠️ Company ID não encontrado para ${globalCompany.company_name}`);
          continue;
        }

        // ✅ Verificar se já existe na quarentena (FILTRANDO POR USER_ID para evitar falsos positivos)
        const { data: existingQuarantine } = await supabase
          .from('icp_analysis_results')
          .select('id')
          .eq('company_id', companyId)
          .eq('user_id', user.id) // ✅ FILTRO CRÍTICO: Só verifica registros do usuário atual
          .maybeSingle();

        if (existingQuarantine) {
          console.log(`✓ ${globalCompany.company_name} já está na quarentena`);
          continue;
        }

        // Buscar dados completos da empresa
        const { data: fullCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        // ⚠️ EMPRESAS INTERNACIONAIS: Não usar Receita Federal (CNPJ é só Brasil)
        // Para empresas internacionais, usar apenas dados do discovery global
        const isInternational = !fullCompany?.cnpj || fullCompany?.country !== 'Brazil';

        // Criar entrada na quarentena
        const quarantineEntry = {
          company_id: companyId,
          cnpj: isInternational ? null : (fullCompany?.cnpj || null), // Só CNPJ se for Brasil
          razao_social: globalCompany.company_name,
          nome_fantasia: isInternational ? null : (fullCompany?.fantasy_name || null), // Só se Brasil
          uf: isInternational ? null : (fullCompany?.state || null), // Só se Brasil
          municipio: globalCompany.city || null,
          website: globalCompany.domain || fullCompany?.website || null,
          setor: globalCompany.industry || null, // ✅ CORRIGIDO: usar 'setor' em vez de 'segmento'
          status: 'pendente',
          temperatura: 'warm', // Empresas globais são pré-qualificadas
          icp_score: Math.round(globalCompany.fit_score || 50), // Usar fit_score como base
          origem: 'global_discovery', // ✅ CORRIGIDO: usar 'origem' em vez de 'source_type'
          
          // ✅ CAMPOS MULTI-TENANT (OBRIGATÓRIOS PARA RLS)
          user_id: user.id,
          tenant_id: userData.tenant_id,
          workspace_id: userData.default_workspace_id,
          
          raw_data: {
            global_company_id: globalCompany.id,
            fit_score: globalCompany.fit_score,
            sources: globalCompany.sources,
            engine: globalCompany.sources?.discovery?.engine || 'unknown',
            lead_source: (() => { // ✅ NOVO: Identificar Lead Source para quarentena
              const engine = globalCompany.sources?.discovery?.engine || '';
              const engineLower = engine.toLowerCase();
              if (engineLower.includes('panjiva')) return 'Panjiva';
              if (engineLower.includes('trade') || engineLower === 'motor_trade') return 'Motor Trade';
              if (engineLower.includes('b2b') || engineLower === 'sala_global_b2b') return 'Sala Global B2B';
              return 'Motor Trade';
            })(),
            needs_enrichment: true,
            auto_validated: false,
            is_international: isInternational, // Flag para identificar empresas internacionais
            country: globalCompany.country,
          },
        };

        quarantineEntries.push(quarantineEntry);
      } catch (err: any) {
        console.error(`❌ Erro ao preparar quarentena para ${globalCompany.company_name}:`, err);
        result.errors.push(`Quarentena ${globalCompany.company_name}: ${err.message}`);
      }
    }

    // Inserir todas as entradas na quarentena
    if (quarantineEntries.length > 0) {
      const { error: quarantineError } = await supabase
        .from('icp_analysis_results')
        .insert(quarantineEntries);

      if (quarantineError) {
        console.error('❌ [GLOBAL-FLOW] Erro ao inserir quarentena:', quarantineError);
        result.errors.push(`Quarentena: ${quarantineError.message}`);
      } else {
        result.quarantineCreated = quarantineEntries.length;
        console.log(`✅ [GLOBAL-FLOW] ${result.quarantineCreated} empresas enviadas para Quarentena ICP`);
      }
    }

    // ETAPA 4: Iniciar enriquecimento automático (se solicitado)
    if (autoEnrich && result.quarantineCreated > 0) {
      console.log(`🔍 [GLOBAL-FLOW] Iniciando enriquecimento automático...`);
      
      // Buscar IDs das empresas na quarentena recém-criadas
      const { data: newQuarantineEntries } = await supabase
        .from('icp_analysis_results')
        .select('id, company_id, cnpj, razao_social')
        .in('company_id', Array.from(companyIdMap.values()))
        .eq('status', 'pendente');

      if (newQuarantineEntries && newQuarantineEntries.length > 0) {
        // Iniciar enriquecimento em lote (Receita Federal primeiro, depois Apollo)
        for (const entry of newQuarantineEntries.slice(0, 10)) { // Limitar a 10 por vez
          try {
            // ⚠️ ENRIQUECIMENTO: Receita Federal APENAS para empresas BRASILEIRAS
        // Empresas internacionais (sem CNPJ) vão direto para Apollo
        const isInternational = !entry.cnpj || entry.cnpj.length !== 14;
        
        if (!isInternational && entry.cnpj && entry.cnpj.length === 14) {
          // Só Brasil: Enriquecimento Receita Federal
          try {
            await supabase.functions.invoke('enrich-receita-federal', { 
              body: { company_id: entry.company_id } 
            });
            console.log(`✅ Enriquecimento Receita Federal iniciado para ${entry.razao_social}`);
          } catch (err: any) {
            console.warn(`⚠️ Erro ao iniciar Receita Federal para ${entry.razao_social}:`, err.message);
          }
        } else {
          // Empresas internacionais: Enriquecimento Apollo
          try {
            const { data: companyData } = await supabase
              .from('companies')
              .select('name, website, domain, country, city, state')
              .eq('id', entry.company_id)
              .single();
            
            if (companyData) {
              await supabase.functions.invoke('enrich-apollo-decisores', { 
                body: { 
                  company_id: entry.company_id,
                  company_name: companyData.name || entry.razao_social,
                  domain: companyData.website || companyData.domain,
                  country: companyData.country,
                  city: companyData.city,
                  state: companyData.state,
                  modes: ['people', 'company']
                } 
              });
              console.log(`✅ Enriquecimento Apollo iniciado para ${entry.razao_social}`);
            }
          } catch (err: any) {
            console.warn(`⚠️ Erro ao iniciar Apollo para ${entry.razao_social}:`, err.message);
          }
        }

            result.enrichmentStarted++;
          } catch (err: any) {
            console.error(`❌ Erro ao iniciar enriquecimento para ${entry.razao_social}:`, err);
            result.errors.push(`Enriquecimento ${entry.razao_social}: ${err.message}`);
          }
        }
      }
    }

    // Resultado final
    result.success = result.errors.length === 0;
    if (result.errors.length > 0) {
      result.error = result.errors[0];
    }

    console.log('✅ [GLOBAL-FLOW] Transferência concluída:', result);
    return result;

  } catch (error: any) {
    console.error('❌ [GLOBAL-FLOW] Erro crítico:', error);
    result.error = error.message;
    throw error;
  }
}


