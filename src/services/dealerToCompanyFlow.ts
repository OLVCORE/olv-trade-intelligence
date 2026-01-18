/**
 * DEALER TO COMPANY FLOW
 * 
 * Fluxo completo: Dealers → Companies → Quarentena
 * 
 * Garante que dados de busca Apollo/LinkedIn sejam salvos corretamente
 * no banco de dados e sigam o fluxo de qualificação ICP.
 */

import { supabase } from '@/integrations/supabase/client';
import { normalizeCountries, getAllSearchVariations, denormalizeCountryName, normalizeCountry } from '@/services/countryNormalizer';
import { normalizeText } from '@/services/b2bClassifier';

export interface Dealer {
  // Identificação
  name: string;
  website?: string;
  country: string;
  city?: string;
  state?: string;
  
  // Dados da empresa
  employeeCount?: number;
  revenue?: string;
  industry?: string;
  description?: string;
  
  // Links externos
  linkedinUrl?: string;
  apolloId?: string;
  apollo_link?: string;
  
  // Classificação
  b2bType?: 'distributor' | 'wholesaler' | 'importer' | 'manufacturer' | 'retailer' | 'trader';
  
  // Contatos
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  contactTitle?: string;
  
  // Decisores
  decision_makers?: Array<{
    name: string;
    title: string;
    email?: string;
    linkedin_url?: string;
    apollo_link?: string;
  }>;
  
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
export async function saveDealersToCompanies(dealers: Dealer[], currentWorkspace?: any, savedSearchId?: string | null): Promise<SaveResult> {
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
    // ETAPA 1: Enriquecer informações via scraping (se website disponível)
    // ⚠️ CRÍTICO: NÃO sobrescrever país se já estiver correto ou se scraping retornar país inválido
    
    // ✅ NOVO: Normalizar países originais para validação cruzada (usando inglês + nativo)
    const originalCountryNames = dealers.map(d => d.country).filter(Boolean);
    const normalizedOriginalCountries = normalizeCountries(originalCountryNames);
    const originalCountryVariations = new Set(getAllSearchVariations(normalizedOriginalCountries));
    
    const enrichedDealers = await Promise.all(
      dealers.map(async (dealer) => {
        const originalCountry = dealer.country; // Guardar país original
        
        // Se tem website, tentar extrair informações reais
        if (dealer.website && (dealer.website.startsWith('http') || dealer.website.includes('.'))) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
            const response = await fetch(`${supabaseUrl}/functions/v1/extract-company-info-from-url`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ url: dealer.website }),
            });

            if (response.ok) {
              const scrapedInfo = await response.json();
              
              // ✅ Usar nome da empresa extraído do website (não título da página)
              if (scrapedInfo.company_name && scrapedInfo.company_name.length > 3) {
                dealer.name = scrapedInfo.company_name;
                console.log(`[FLOW] ✅ Nome corrigido via scraping: "${dealer.name}"`);
              }
              
              // ✅ CRÍTICO: Só aceitar país do scraping se:
              // 1. Não tiver país original OU
              // 2. País do scraping estiver na lista de países originais (validação cruzada com universalização)
              if (scrapedInfo.country && scrapedInfo.country !== 'N/A') {
                const scrapedCountry = scrapedInfo.country.trim();
                const scrapedNormalized = normalizeText(scrapedCountry); // Normalizar para comparação
                
                // Verificar se país do scraping está na lista de países originais (usando variações normalizadas)
                const isValidCountry = originalCountryVariations.has(scrapedNormalized) || 
                  Array.from(originalCountryVariations).some(origVar => 
                    scrapedNormalized.includes(origVar) || origVar.includes(scrapedNormalized)
                  ) || !originalCountry; // Se não tiver país original, ainda validar
                
                if (isValidCountry && originalCountryVariations.size > 0) {
                  // Se país do scraping passou validação, denormalizar para português
                  const finalCountry = denormalizeCountryName(scrapedCountry) || scrapedCountry;
                  dealer.country = finalCountry;
                  console.log(`[FLOW] ✅ País aceito via scraping: "${scrapedCountry}" → "${finalCountry}" (válido - está na lista original)`);
                } else if (!originalCountry && originalCountryVariations.size > 0) {
                  // Se não tinha país original, ainda validar contra lista
                  const isValid = originalCountryVariations.has(scrapedNormalized);
                  if (isValid) {
                    const finalCountry = denormalizeCountryName(scrapedCountry) || scrapedCountry;
                    dealer.country = finalCountry;
                    console.log(`[FLOW] ✅ País aceito via scraping (sem original): "${scrapedCountry}" → "${finalCountry}" (válido)`);
                  } else {
                    console.warn(`[FLOW] ⚠️ País do scraping "${scrapedCountry}" não está na lista original - deixando vazio (não inventar)`);
                    // Deixar vazio (não inventar país)
                  }
                } else {
                  console.warn(`[FLOW] ⚠️ País do scraping "${scrapedCountry}" não está na lista original - mantendo "${originalCountry || 'vazio'}"`);
                  // Manter país original ou vazio
                }
              }
              
              // ✅ Atualizar cidade e estado se disponíveis
              if (scrapedInfo.city) dealer.city = scrapedInfo.city;
              if (scrapedInfo.state) dealer.state = scrapedInfo.state;
            }
          } catch (error) {
            console.error(`[FLOW] ⚠️ Erro ao enriquecer via scraping para ${dealer.name}:`, error);
            // Continuar mesmo se scraping falhar
          }
        }
        
        return dealer;
      })
    );

    // ETAPA 2: Preparar dados para companies (NORMALIZADOR UNIVERSAL!)
    const companiesToInsert = enrichedDealers.map(dealer => ({
      // ✅ Campos base (tabela companies) - USANDO DADOS ENRIQUECIDOS
      company_name: dealer.name, // ✅ Já corrigido via scraping se disponível
      website: dealer.website || null,
      city: dealer.city || null,
      state: dealer.state || null,
      country: dealer.country,
      industry: dealer.industry || null,
      employee_count: dealer.employeeCount || null,
      employees_count: dealer.employeeCount || null,
      linkedin_url: dealer.linkedinUrl || null,
      apollo_id: dealer.apolloId || null,
      b2b_type: dealer.b2bType || 'distributor',
      description: dealer.description || null,
      data_source: 'dealer_discovery',
      // ⚠️ REMOVIDO: lead_source (campo não existe - usar lead_source_id se necessário)
      tenant_id: currentWorkspace?.tenant_id || null,
      workspace_id: currentWorkspace?.id || null,
      
      // ✅ NORMALIZADOR UNIVERSAL: raw_data (JSONB) - TODOS OS DADOS!
      raw_data: {
        // ✅ CRÍTICO: Salvar país em raw_data.country para que getCountryWithFallback encontre
        country: dealer.country, // PRIORIDADE MÁXIMA - usado por getCountryWithFallback
        apollo_id: dealer.apolloId,
        apollo_link: dealer.apollo_link || (dealer.apolloId ? `https://app.apollo.io/#/companies/${dealer.apolloId}` : null),
        linkedin_url: dealer.linkedinUrl,
        b2b_type: dealer.b2bType || 'distributor',
        fit_score: dealer.fitScore || 50,
        description: dealer.description,
        source: 'dealer_discovery_realtime',
        lead_source: 'Export Dealers (B2B)', // ✅ NOVO: Registro de Lead Source
        search_date: new Date().toISOString(),
        saved_search_id: savedSearchId || null, // ✅ NOVO: Associar à busca salva
        validated: true,
        type: dealer.b2bType ? `${dealer.b2bType[0].toUpperCase()}${dealer.b2bType.slice(1)}` : 'Distributor',
        notes: `Importado via busca B2B - Fit Score ${dealer.fitScore || 50}`,
        decision_makers: dealer.decision_makers || [],
        contact_email: dealer.contactEmail,
        contact_phone: dealer.contactPhone,
        contact_name: dealer.contactName,
        contact_title: dealer.contactTitle,
        revenue: dealer.revenue,
        apollo_data: dealer.apolloData,
        hunter_data: dealer.hunterData,
        // ✅ Adicionar dados de localização para extração inteligente
        city: dealer.city,
        state: dealer.state,
      },
    }));
    
    // ETAPA 2: Inserir em companies - tratar duplicatas (erro 409)
    // ✅ Verificar quais empresas já existem antes de inserir (por website ou nome)
    console.log('[FLOW] 🔍 Verificando empresas existentes antes de inserir...');
    
    // Buscar empresas existentes (por website e nome) em lotes
    const websitesToCheck = companiesToInsert
      .filter(c => c.website)
      .map(c => c.website?.toLowerCase().trim())
      .filter(Boolean);
    
    const existingCompanies = new Set<string>();
    
    if (websitesToCheck.length > 0) {
      // Buscar empresas existentes por website (em lotes de 100)
      const batchSize = 100;
      for (let i = 0; i < websitesToCheck.length; i += batchSize) {
        const batch = websitesToCheck.slice(i, i + batchSize);
        const { data: existing, error: checkError } = await supabase
          .from('companies')
          .select('website, company_name')
          .in('website', batch.map(w => `http://${w}`).concat(batch.map(w => `https://${w}`)).concat(batch));
        
        if (!checkError && existing) {
          existing.forEach(c => {
            if (c.website) {
              const websiteLower = c.website.toLowerCase().trim().replace(/^https?:\/\//, '');
              existingCompanies.add(websiteLower);
            }
          });
        }
      }
    }
    
    // Filtrar apenas empresas novas (não existem)
    const newCompanies = companiesToInsert.filter(c => {
      if (!c.website) return true; // Sem website, tentar inserir
      const websiteLower = c.website.toLowerCase().trim().replace(/^https?:\/\//, '');
      return !existingCompanies.has(websiteLower);
    });
    
    console.log(`[FLOW] 📊 Empresas novas: ${newCompanies.length} / Total: ${companiesToInsert.length}`);
    result.companiesSkipped = companiesToInsert.length - newCompanies.length;
    
    // Inserir apenas empresas novas
    let companies: any[] = [];
    if (newCompanies.length > 0) {
      const { data: insertedCompanies, error: companyError } = await supabase
        .from('companies')
        .insert(newCompanies)
        .select('id, company_name, country');
      
      if (companyError) {
        console.error('❌ [FLOW] Erro ao salvar companies:', companyError);
        
        // ✅ Se for erro 409 (conflict) ou 23505 (unique violation), tentar inserir uma por uma
        if (companyError.code === '23505' || companyError.code === 'PGRST204' || companyError.message?.includes('duplicate') || companyError.message?.includes('conflict')) {
          console.log('[FLOW] ⚠️ Duplicata detectada em lote, tentando inserir uma por uma...');
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const company of newCompanies) {
            try {
              const { data: singleCompany, error: singleError } = await supabase
                .from('companies')
                .insert(company)
                .select('id, company_name, country')
                .single();
              
              if (!singleError && singleCompany) {
                companies.push(singleCompany);
                successCount++;
              } else if (singleError && (singleError.code === '23505' || singleError.code === 'PGRST204')) {
                // Duplicata - pular
                errorCount++;
                console.log(`[FLOW] ⚠️ Empresa duplicada pulada: ${company.company_name}`);
              } else {
                errorCount++;
                console.error(`[FLOW] ❌ Erro ao inserir empresa individual: ${singleError?.message}`);
              }
            } catch (err) {
              errorCount++;
              console.error(`[FLOW] ❌ Erro ao inserir empresa individual: ${err}`);
            }
          }
          
          result.companiesCreated = successCount;
          result.companiesSkipped = companiesToInsert.length - successCount;
          
          if (errorCount > 0 && successCount === 0) {
            throw new Error(`Nenhuma empresa foi inserida. ${errorCount} erro(s) encontrado(s).`);
          }
          
          console.log(`✅ [FLOW] ${successCount} empresas inseridas (${errorCount} duplicatas puladas)`);
        } else {
          result.errors.push(`Companies: ${companyError.message}`);
          throw companyError;
        }
      } else {
        companies = insertedCompanies || [];
        result.companiesCreated = companies.length;
        console.log(`✅ [FLOW] ${result.companiesCreated} empresas novas salvas`);
      }
    } else {
      result.companiesCreated = 0;
      console.log('[FLOW] ⚠️ Todas as empresas já existem no banco de dados');
    }
    
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

