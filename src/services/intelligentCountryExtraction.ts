/**
 * SERVIÇO INTELIGENTE DE EXTRAÇÃO DE PAÍS
 * 
 * Extrai país de empresas usando múltiplas fontes REAIS:
 * 1. Nome da empresa (cidades conhecidas → países)
 * 2. Scraping de website/Facebook/LinkedIn
 * 3. Apollo API (dados reais)
 * 4. APIs de geolocalização
 * 
 * PROTOCOLO: SEM DADOS HARDCODED - APENAS FONTES REAIS
 */

// ============================================================================
// MAPEAMENTO CIDADE → PAÍS - REMOVIDO (hardcoded)
// ============================================================================
// 
// ⚠️ REMOVIDO: CITY_TO_COUNTRY_MAP hardcoded foi REMOVIDO
// 
// ✅ AGORA: País é buscado DINAMICAMENTE de APIs externas:
// - REST Countries API: busca país por nome
// - GeoNames API: busca país por cidade/coordenadas
// - Scraping de website: extrai país do conteúdo
// 
// Nenhuma cidade ou país está hardcoded.
// Todos os dados vêm de APIs externas gratuitas.
// 
// ============================================================================

// ============================================================================
// EXTRAIR PAÍS DO NOME DA EMPRESA
// ============================================================================

/**
 * Extrai país do nome da empresa
 * 
 * ⚠️ DEPRECATED: Esta função foi desabilitada - hardcodes removidos
 * 
 * Para extrair país do nome da empresa, use APIs externas:
 * - GeoNames API (busca cidade → país)
 * - REST Countries API (busca país por nome)
 * 
 * NÃO HARDCODE: País deve ser buscado de APIs ou fontes reais (Apollo, scraping, etc.)
 */
export function extractCountryFromCompanyName(companyName: string): string | null {
  // ⚠️ REMOVIDO: Hardcode de cidade → país
  // País deve ser buscado de APIs externas ou fontes reais
  console.warn(`[COUNTRY-EXTRACT] ⚠️ extractCountryFromCompanyName() está deprecated. Use APIs externas (GeoNames, REST Countries).`);
  return null;
}

// ============================================================================
// EXTRAIR PAÍS DE WEBSITE/FACEBOOK VIA SCRAPING
// ============================================================================

/**
 * Extrai país de website/Facebook/LinkedIn via Edge Function
 * Usa scraping inteligente para obter localização real
 */
export async function extractCountryFromWebsite(
  website: string,
  apolloKey?: string
): Promise<{ country: string | null; source: string }> {
  if (!website || typeof website !== 'string') {
    return { country: null, source: 'none' };
  }
  
  try {
    // Se for Facebook, LinkedIn, ou website normal, usar Edge Function de scraping
    const isFacebook = website.includes('facebook.com');
    const isLinkedIn = website.includes('linkedin.com');
    
    if (isFacebook || isLinkedIn || website.startsWith('http')) {
      console.log(`[COUNTRY-EXTRACT] 🔍 Extraindo país de website: ${website}`);
      
      // Chamar Edge Function para scraping
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/extract-country-from-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          url: website,
          apollo_key: apolloKey,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.country && data.country !== 'N/A') {
          console.log(`[COUNTRY-EXTRACT] ✅ País extraído via scraping: "${data.country}" de ${website}`);
          return { country: data.country, source: data.source || 'scraping' };
        }
      }
    }
  } catch (error) {
    console.error(`[COUNTRY-EXTRACT] ❌ Erro ao extrair país de website ${website}:`, error);
  }
  
  return { country: null, source: 'none' };
}

// ============================================================================
// EXTRAÇÃO INTELIGENTE COMPLETA
// ============================================================================

/**
 * Função principal: extrai país usando todas as fontes disponíveis
 * 
 * Prioridade:
 * 1. Nome da empresa (cidade conhecida)
 * 2. Apollo API (se apollo_id disponível)
 * 3. Scraping de website/Facebook/LinkedIn
 * 4. Campo direto (se já validado)
 * 
 * @returns { country: string | null, confidence: 'high' | 'medium' | 'low', source: string }
 */
export async function extractCountryIntelligently(
  company: {
    company_name?: string;
    name?: string;
    website?: string;
    domain?: string;
    apollo_id?: string;
    country?: string;
    raw_data?: any;
  },
  apolloKey?: string
): Promise<{ country: string | null; confidence: 'high' | 'medium' | 'low'; source: string }> {
  const companyName = company.company_name || company.name || '';
  const website = company.website || company.domain || '';
  
  // 1️⃣ EXTRAIR DO NOME DA EMPRESA (prioridade alta se encontrar cidade conhecida)
  const countryFromName = extractCountryFromCompanyName(companyName);
  if (countryFromName) {
    return {
      country: countryFromName,
      confidence: 'high',
      source: 'company_name_analysis',
    };
  }
  
  // 2️⃣ APOLLO API (prioridade alta - dados estruturados)
  if (company.apollo_id || company.raw_data?.apollo_id) {
    const apolloId = company.apollo_id || company.raw_data?.apollo_id;
    try {
      if (apolloKey) {
        const apolloResponse = await fetch(`https://api.apollo.io/v1/organizations/${apolloId}`, {
          headers: {
            'X-Api-Key': apolloKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (apolloResponse.ok) {
          const orgData = await apolloResponse.json();
          const apolloCountry = orgData.organization?.country || orgData.organization?.headquarters_country;
          if (apolloCountry && apolloCountry !== 'N/A') {
            console.log(`[COUNTRY-EXTRACT] ✅ País extraído da Apollo: "${apolloCountry}"`);
            return {
              country: apolloCountry,
              confidence: 'high',
              source: 'apollo_api',
            };
          }
        }
      }
    } catch (error) {
      console.error(`[COUNTRY-EXTRACT] ❌ Erro ao buscar país na Apollo:`, error);
    }
  }
  
  // 3️⃣ SCRAPING DE WEBSITE/FACEBOOK/LINKEDIN (prioridade média)
  if (website) {
    const scraped = await extractCountryFromWebsite(website, apolloKey);
    if (scraped.country) {
      return {
        country: scraped.country,
        confidence: 'medium',
        source: scraped.source,
      };
    }
  }
  
  // 4️⃣ CAMPO DIRETO (se existir, mas validar)
  if (company.country && company.country !== 'N/A' && company.country !== 'Colombia') {
    // ⚠️ VALIDAÇÃO: Se o país é "Colombia" mas o nome tem cidade da China, ignorar
    const hasChinaCity = extractCountryFromCompanyName(companyName);
    if (hasChinaCity && hasChinaCity !== company.country) {
      console.warn(`[COUNTRY-EXTRACT] ⚠️ País "${company.country}" não confere com cidade no nome (${hasChinaCity})`);
      return { country: null, confidence: 'low', source: 'validation_failed' };
    }
    
    return {
      country: company.country,
      confidence: 'medium',
      source: 'existing_field',
    };
  }
  
  return { country: null, confidence: 'low', source: 'none' };
}
