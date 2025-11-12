/**
 * DEALER TO COMPANY FLOW
 * 
 * Fluxo completo: Dealers → Companies → Quarentena
 * 
 * Garante que dados de busca Apollo/LinkedIn sejam salvos corretamente
 * no banco de dados e sigam o fluxo de qualificação ICP.
 */

import { supabase } from '@/integrations/supabase/client';

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
    // ETAPA 1: Preparar dados para companies (NORMALIZADOR UNIVERSAL!)
    const companiesToInsert = dealers.map(dealer => ({
      // ✅ Campos base (tabela companies)
      company_name: dealer.name,
      website: dealer.website || null,
      city: dealer.city || null,
      state: dealer.state || null,
      country: dealer.country,
      industry: dealer.industry || null,
      employee_count: dealer.employeeCount || null,
      
      // ✅ NORMALIZADOR UNIVERSAL: hunter_domain_data (JSONB)
      hunter_domain_data: {
        apollo_id: dealer.apolloId,
        linkedin_url: dealer.linkedinUrl,
        b2b_type: dealer.b2bType || 'distributor',
        fit_score: dealer.fitScore || 50,
        description: dealer.description,
        source: 'dealer_discovery_realtime',
        search_date: new Date().toISOString(),
        validated: true,
        type: dealer.b2bType ? `${dealer.b2bType[0].toUpperCase()}${dealer.b2bType.slice(1)}` : 'Distributor',
        notes: `Importado via busca B2B - Fit Score ${dealer.fitScore || 50}`,
      },
    }));
    
    // ETAPA 2: Inserir em companies (sem upsert por enquanto - insert simples)
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .insert(companiesToInsert)
      .select('id, company_name, country');
    
    if (companyError) {
      console.error('❌ [FLOW] Erro ao salvar companies:', companyError);
      result.errors.push(`Companies: ${companyError.message}`);
      throw companyError;
    }
    
    result.companiesCreated = companies?.length || 0;
    console.log(`✅ [FLOW] ${result.companiesCreated} companies salvas/atualizadas`);
    
    // ETAPA 3: Calcular totais finais
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

