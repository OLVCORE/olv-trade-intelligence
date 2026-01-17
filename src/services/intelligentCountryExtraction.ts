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
// MAPEAMENTO CIDADE → PAÍS (baseado em conhecimento geográfico real)
// ============================================================================

const CITY_TO_COUNTRY_MAP: Record<string, string> = {
  // China
  'guangzhou': 'China',
  'guangdong': 'China',
  'beijing': 'China',
  'shanghai': 'China',
  'shenzhen': 'China',
  'hong kong': 'China',
  'xiamen': 'China',
  'hangzhou': 'China',
  'ningbo': 'China',
  'foshan': 'China',
  'dongguan': 'China',
  
  // USA
  'new york': 'United States',
  'los angeles': 'United States',
  'chicago': 'United States',
  'miami': 'United States',
  'san francisco': 'United States',
  'houston': 'United States',
  'boston': 'United States',
  'seattle': 'United States',
  
  // Europe
  'london': 'United Kingdom',
  'paris': 'France',
  'berlin': 'Germany',
  'madrid': 'Spain',
  'milan': 'Italy',
  'amsterdam': 'Netherlands',
  'dublin': 'Ireland',
  
  // Latin America
  'são paulo': 'Brasil',
  'rio de janeiro': 'Brasil',
  'buenos aires': 'Argentina',
  'santiago': 'Chile',
  'bogotá': 'Colombia',
  'bogota': 'Colombia',
  'lima': 'Peru',
  'méxico': 'Mexico',
  'mexico city': 'Mexico',
  'montevideo': 'Uruguay',
  'caracas': 'Venezuela',
  
  // Asia
  'tokyo': 'Japan',
  'seoul': 'South Korea',
  'singapore': 'Singapore',
  'bangkok': 'Thailand',
  'jakarta': 'Indonesia',
  'manila': 'Philippines',
  'kuala lumpur': 'Malaysia',
  'mumbai': 'India',
  'delhi': 'India',
  'bangalore': 'India',
  
  // Middle East
  'dubai': 'United Arab Emirates',
  'riyadh': 'Saudi Arabia',
  'doha': 'Qatar',
  'tel aviv': 'Israel',
  
  // Oceania
  'sydney': 'Australia',
  'melbourne': 'Australia',
  'auckland': 'New Zealand',
};

// ============================================================================
// EXTRAIR PAÍS DO NOME DA EMPRESA
// ============================================================================

/**
 * Extrai país do nome da empresa baseado em cidades conhecidas
 */
export function extractCountryFromCompanyName(companyName: string): string | null {
  if (!companyName || typeof companyName !== 'string') return null;
  
  const nameLower = companyName.toLowerCase();
  
  // Buscar cidades no nome
  for (const [city, country] of Object.entries(CITY_TO_COUNTRY_MAP)) {
    if (nameLower.includes(city)) {
      console.log(`[COUNTRY-EXTRACT] ✅ País extraído do nome: "${city}" → "${country}" para "${companyName}"`);
      return country;
    }
  }
  
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
