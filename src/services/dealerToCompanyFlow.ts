/**
 * DEALER TO COMPANY FLOW
 * 
 * Fluxo completo: Dealers → Companies → Quarentena
 * 
 * Garante que dados de busca Apollo/LinkedIn sejam salvos corretamente
 * no banco de dados e sigam o fluxo de qualificação ICP.
 */

import { supabase } from '@/lib/supabase';

export interface Dealer {
  // Identificação
  name: string;
  website?: string;
  country: string;
  
  // Dados da empresa
  employeeCount?: number;
  revenue?: string;
  industry?: string;
  description?: string;
  
  // Links externos
  linkedinUrl?: string;
  apolloId?: string;
  
  // Classificação
  b2bType?: 'distributor' | 'wholesaler' | 'importer' | 'manufacturer' | 'retailer' | 'trader';
  
  // Contatos
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  contactTitle?: string;
  
  // Scores e metadata
  fitScore?: number;
  apolloData?: any;
  hunterData?: any;
}

export interface SaveResult {
  success: boolean;
  saved: number;
  newCompanies: number;
  updated: number;
  skipped: number;
  companiesCreated: number;
  companiesSkipped: number;
  quarantineCreated: number;
  contactsCreated: number;
  errors: string[];
  error?: string;
}

/**
 * Salvar dealers no banco de dados
 * 
 * FLUXO:
 * 1. Inserir em companies (com upsert por apollo_id ou website)
 * 2. Enviar para icp_analysis_results (quarentena)
 * 3. Criar contatos (se tiver email/phone)
 * 
 * @param dealers - Array de dealers para salvar
 * @param currentWorkspace - Workspace atual (opcional)
 * @returns Resultado do save
 */
export async function saveDealersToCompanies(dealers: Dealer[], currentWorkspace?: any): Promise<SaveResult> {
  const result: SaveResult = {
    success: false,
    saved: 0,
    newCompanies: 0,
    updated: 0,
    skipped: 0,
    companiesCreated: 0,
    companiesSkipped: 0,
    quarantineCreated: 0,
    contactsCreated: 0,
    errors: []
  };
  
  // Validar input
  if (!dealers || dealers.length === 0) {
    throw new Error('Nenhum dealer para salvar');
  }
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }
  
  console.log(`💾 [FLOW] Salvando ${dealers.length} dealers...`);
  
  try {
    // ETAPA 1: Preparar dados para companies
    const companiesToInsert = dealers.map(dealer => ({
      // Identificação
      razao_social: dealer.name,
      nome_fantasia: dealer.name,
      
      // CNPJ null para internacionais
      cnpj: null,
      
      // Localização
      country: dealer.country,
      
      // Contato
      website: dealer.website || null,
      
      // Tamanho
      employees_count: dealer.employeeCount || null,
      revenue_range: dealer.revenue || null,
      
      // Classificação
      industry: dealer.industry || null,
      b2b_type: dealer.b2bType || 'distributor',
      description: dealer.description || null,
      
      // Links externos
      linkedin_url: dealer.linkedinUrl || null,
      apollo_id: dealer.apolloId || null,
      
      // Source tracking
      source: 'dealer_discovery',
      origem: 'international_b2b',
      
      // Raw data (preservar tudo)
      raw_data: {
        apollo_id: dealer.apolloId,
        apollo_data: dealer.apolloData,
        hunter_data: dealer.hunterData,
        linkedin_url: dealer.linkedinUrl,
        b2b_type: dealer.b2bType,
        fit_score: dealer.fitScore,
        search_date: new Date().toISOString(),
        search_source: 'apollo_b2b_search',
      },
      
      // Hunter data specific
      hunter_domain_data: dealer.hunterData || null,
      
      // Metadata
      created_by: user.id,
    }));
    
    // ETAPA 2: Inserir em companies (upsert para evitar duplicatas)
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .upsert(companiesToInsert, {
        onConflict: 'apollo_id', // Se apollo_id existe, atualiza ao invés de inserir
        ignoreDuplicates: false
      })
      .select('id, razao_social, country, apollo_id');
    
    if (companyError) {
      console.error('❌ [FLOW] Erro ao salvar companies:', companyError);
      result.errors.push(`Companies: ${companyError.message}`);
      throw companyError;
    }
    
    result.companiesCreated = companies?.length || 0;
    console.log(`✅ [FLOW] ${result.companiesCreated} companies salvas/atualizadas`);
    
    // ETAPA 3: Enviar para Quarentena (ICP Analysis)
    if (companies && companies.length > 0) {
      const quarantineEntries = companies.map(company => ({
        company_id: company.id,
        cnpj: null,
        razao_social: company.razao_social,
        status: 'pendente',
        temperatura: 'warm', // Dealers B2B já são pré-qualificados
        icp_score: 65, // Score inicial para dealers internacionais
        source: 'dealer_discovery',
        raw_analysis: {
          auto_validated: true,
          b2b_confirmed: true,
          origin: 'international_dealer',
          country: company.country,
          needs_enrichment: false, // Já vem enriquecido do Apollo
          apollo_id: company.apollo_id,
        }
      }));
      
      const { data: quarantine, error: quarentenaError } = await supabase
        .from('icp_analysis_results')
        .upsert(quarantineEntries, {
          onConflict: 'company_id',
          ignoreDuplicates: false
        })
        .select('id');
      
      if (quarentenaError) {
        console.error('⚠️ [FLOW] Erro ao enviar para quarentena:', quarentenaError);
        result.errors.push(`Quarentena: ${quarentenaError.message}`);
        // Não throw - companies já foram salvos
      } else {
        result.quarantineCreated = quarantine?.length || 0;
        console.log(`✅ [FLOW] ${result.quarantineCreated} enviadas para Quarentena`);
      }
    }
    
    // ETAPA 4: Criar contatos (se disponível)
    const contactsToInsert = dealers
      .map((dealer, index) => {
        const company = companies?.[index];
        if (!company) return null;
        if (!dealer.contactEmail && !dealer.contactPhone) return null;
        
        return {
          company_id: company.id,
          company_name: dealer.name,
          email: dealer.contactEmail || null,
          phone: dealer.contactPhone || null,
          name: dealer.contactName || null,
          title: dealer.contactTitle || 'Decision Maker',
          source: 'dealer_discovery',
          created_by: user.id,
        };
      })
      .filter(Boolean);
    
    if (contactsToInsert.length > 0) {
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .insert(contactsToInsert)
        .select('id');
      
      if (contactError) {
        console.error('⚠️ [FLOW] Erro ao criar contatos:', contactError);
        result.errors.push(`Contatos: ${contactError.message}`);
      } else {
        result.contactsCreated = contacts?.length || 0;
        console.log(`✅ [FLOW] ${result.contactsCreated} contatos criados`);
      }
    }
    
    // ETAPA 5: Calcular totais finais
    result.success = result.errors.length === 0;
    result.saved = result.companiesCreated;
    result.newCompanies = result.companiesCreated;
    result.updated = 0; // TODO: implementar update tracking
    result.skipped = result.companiesSkipped;
    
    if (result.errors.length > 0) {
      result.error = result.errors[0]; // Primeiro erro
    }
    
    console.log('✅ [FLOW] Fluxo completo executado:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ [FLOW] Erro crítico:', error);
    throw error;
  }
}

/**
 * Validar dealer antes de salvar
 */
export function validateDealer(dealer: Dealer): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!dealer.name || dealer.name.trim() === '') {
    errors.push('Nome da empresa obrigatório');
  }
  
  if (!dealer.country || dealer.country.trim() === '') {
    errors.push('País obrigatório');
  }
  
  if (!dealer.website && !dealer.apolloId) {
    errors.push('Pelo menos website OU apollo_id é obrigatório');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Batch save com validação
 */
export async function saveDealersBatch(
  dealers: Dealer[],
  onProgress?: (current: number, total: number) => void
): Promise<SaveResult> {
  const batchSize = 10;
  const totalResult: SaveResult = {
    success: true,
    saved: 0,
    newCompanies: 0,
    updated: 0,
    skipped: 0,
    companiesCreated: 0,
    companiesSkipped: 0,
    quarantineCreated: 0,
    contactsCreated: 0,
    errors: []
  };
  
  for (let i = 0; i < dealers.length; i += batchSize) {
    const batch = dealers.slice(i, i + batchSize);
    
    try {
      const batchResult = await saveDealersToCompanies(batch);
      
      totalResult.companiesCreated += batchResult.companiesCreated;
      totalResult.companiesSkipped += batchResult.companiesSkipped;
      totalResult.quarantineCreated += batchResult.quarantineCreated;
      totalResult.contactsCreated += batchResult.contactsCreated;
      totalResult.errors.push(...batchResult.errors);
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, dealers.length), dealers.length);
      }
      
      // Pequeno delay entre batches
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Erro no batch ${i}-${i + batchSize}:`, error);
      totalResult.errors.push(`Batch ${i}: ${error}`);
    }
  }
  
  return totalResult;
}

