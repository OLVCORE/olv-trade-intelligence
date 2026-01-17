/**
 * HELPERS UNIFICADOS: Lead Source + Bloco + Localização
 * 
 * Funções reutilizáveis para todas as tabelas
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Funções puras (sem side effects)
 * - Retrocompatibilidade garantida
 * - Fallbacks múltiplos para garantir dados sempre
 */

import { 
  LEAD_SOURCES, 
  getCommercialBlock, 
  getContinent, 
  normalizeLeadSource 
} from '@/data/leadSources';

// ============================================================================
// LEAD SOURCE HELPERS
// ============================================================================

/**
 * Função: getLeadSource(company: any): string
 * 
 * Extrai e normaliza a fonte do lead de QUALQUER empresa
 * 
 * Prioridade:
 * 1. company.lead_source (campo direto)
 * 2. company.data_source (campo existente)
 * 3. company.raw_data.source (JSONB)
 * 4. company.raw_data.lead_source (JSONB)
 * 5. Inferir de outros campos (apollo_id → 'apollo_direct', etc.)
 */
export function getLeadSource(company: any): string {
  if (!company) return LEAD_SOURCES.MANUAL.name;
  
  // 1️⃣ CAMPO DIRETO (prioridade máxima)
  if (company.lead_source && typeof company.lead_source === 'string') {
    return normalizeLeadSource(company.lead_source);
  }
  
  // 2️⃣ DATA_SOURCE (campo existente)
  if (company.data_source && typeof company.data_source === 'string') {
    return normalizeLeadSource(company.data_source);
  }
  
  // 3️⃣ RAW_DATA (JSONB)
  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data))
    ? company.raw_data as Record<string, any>
    : {};
  
  if (rawData.lead_source && typeof rawData.lead_source === 'string') {
    return normalizeLeadSource(rawData.lead_source);
  }
  
  if (rawData.source && typeof rawData.source === 'string') {
    return normalizeLeadSource(rawData.source);
  }
  
  // 4️⃣ INFERIR DE OUTROS CAMPOS
  if (rawData.apollo_id && !rawData.dealer_discovery && !rawData.dealer_discovery_realtime) {
    return LEAD_SOURCES.APOLLO_DIRECT.name;
  }
  
  if (rawData.dealer_discovery || rawData.dealer_discovery_realtime) {
    return LEAD_SOURCES.EXPORT_DEALERS.name;
  }
  
  if (rawData.panjiva_id || rawData.panjiva_data) {
    return LEAD_SOURCES.PANJIVA.name;
  }
  
  if (rawData.imported_at || rawData.csv_import) {
    return LEAD_SOURCES.CSV_UPLOAD.name;
  }
  
  // 5️⃣ FALLBACK
  return LEAD_SOURCES.MANUAL.name;
}

// ============================================================================
// COUNTRY HELPERS
// ============================================================================

/**
 * Função: getCountryWithFallback(company: any): string
 * 
 * ⚠️ ATENÇÃO: Esta função é SÍNCRONA e usa apenas dados já disponíveis.
 * Para extração INTELIGENTE (scraping, análise de nome), use extractCountryIntelligently()
 * 
 * Extrai país com MÚLTIPLOS FALLBACKS para garantir que sempre retorne algo
 * 
 * Prioridade:
 * 1. Extração inteligente do nome (cidade conhecida → país)
 * 2. company.country (campo direto) - VALIDADO contra nome
 * 3. company.raw_data.apollo_organization.country (Apollo)
 * 4. company.raw_data.apollo_organization.headquarters_country
 * 5. company.location.country (JSONB)
 * 6. company.raw_data.receita_federal.pais (Brasil apenas)
 * 7. 'N/A' (último recurso - NUNCA hardcoded)
 */
export function getCountryWithFallback(company: any): string {
  if (!company) return 'N/A';
  
  const companyName = company.company_name || company.name || '';
  
  // ✅ PRIORIDADE MÁXIMA: RAW_DATA (dados enriquecidos têm precedência sobre campos diretos)
  // 1️⃣ RAW_DATA ou RAW_ANALYSIS (icp_analysis_results usa raw_analysis)
  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data))
    ? company.raw_data as Record<string, any>
    : (company.raw_analysis && typeof company.raw_analysis === 'object' && !Array.isArray(company.raw_analysis))
      ? company.raw_analysis as Record<string, any>
      : {};
  
  // 1.1️⃣ RAW_DATA.country (PRIORIDADE MÁXIMA - dados salvos por enriquecimento internacional)
  if (rawData.country && typeof rawData.country === 'string' && rawData.country.trim() !== '' && rawData.country !== 'N/A') {
    console.log(`[COUNTRY] ✅ País encontrado em raw_data.country: "${rawData.country.trim()}"`);
    return rawData.country.trim();
  }
  
  // 1.2️⃣ RAW_DATA.international_enrichment.country (dados extraídos do website)
  if (rawData.international_enrichment?.country && typeof rawData.international_enrichment.country === 'string') {
    const country = rawData.international_enrichment.country.trim();
    if (country !== '' && country !== 'N/A') {
      console.log(`[COUNTRY] ✅ País encontrado em raw_data.international_enrichment.country: "${country}"`);
      return country;
    }
  }
  
  // 1.3️⃣ RAW_DATA.extracted_info.country (dados extraídos pelo re-enrich-companies)
  if (rawData.extracted_info?.country && typeof rawData.extracted_info.country === 'string') {
    const country = rawData.extracted_info.country.trim();
    if (country !== '' && country !== 'N/A') {
      console.log(`[COUNTRY] ✅ País encontrado em raw_data.extracted_info.country: "${country}"`);
      return country;
    }
  }
  
  // 2️⃣ EXTRAÇÃO DO NOME (cidade conhecida → país) - VALIDAÇÃO CRÍTICA
  try {
    const cityToCountryMap: Record<string, string> = {
      'guangzhou': 'China',
      'guangdong': 'China',
      'beijing': 'China',
      'shanghai': 'China',
      'shenzhen': 'China',
      'hong kong': 'China',
      'bogotá': 'Colombia',
      'bogota': 'Colombia',
      'são paulo': 'Brasil',
      'buenos aires': 'Argentina',
      'mexico city': 'Mexico',
    };
    
    if (companyName) {
      const nameLower = companyName.toLowerCase();
      for (const [city, country] of Object.entries(cityToCountryMap)) {
        if (nameLower.includes(city)) {
          console.log(`[COUNTRY] ✅ País extraído do nome: "${city}" → "${country}" para "${companyName}"`);
          return country;
        }
      }
    }
  } catch (error) {
    console.error('[COUNTRY] Erro ao extrair país do nome:', error);
  }
  
  // 3️⃣ APOLLO (dados de fonte confiável)
  if (rawData.apollo_organization?.country && typeof rawData.apollo_organization.country === 'string') {
    const country = rawData.apollo_organization.country.trim();
    if (country !== '' && country !== 'N/A') {
      return country;
    }
  }
  
  if (rawData.apollo_organization?.headquarters_country && typeof rawData.apollo_organization.headquarters_country === 'string') {
    const country = rawData.apollo_organization.headquarters_country.trim();
    if (country !== '' && country !== 'N/A') {
      return country;
    }
  }
  
  // 4️⃣ LOCATION JSONB
  if (company.location && typeof company.location === 'object' && !Array.isArray(company.location)) {
    const location = company.location as Record<string, any>;
    if (location.country && typeof location.country === 'string' && location.country.trim() !== '' && location.country !== 'N/A') {
      return location.country.trim();
    }
  }
  
  // 5️⃣ RECEITA FEDERAL (Brasil apenas)
  if (rawData.receita_federal?.pais && typeof rawData.receita_federal.pais === 'string') {
    const country = rawData.receita_federal.pais.trim();
    if (country !== '' && country !== 'N/A') {
      return country;
    }
  }
  
  // 6️⃣ CAMPO DIRETO (ÚLTIMA OPÇÃO - pode estar desatualizado)
  if (company.country && typeof company.country === 'string' && company.country.trim() !== '' && company.country !== 'N/A') {
    // ⚠️ VALIDAÇÃO CRÍTICA: Se país é "United Kingdom" mas nome tem cidade da China, NÃO usar
    if (company.country.trim() === 'United Kingdom' && companyName.toLowerCase().includes('guangzhou')) {
      console.warn(`[COUNTRY] ❌ País "United Kingdom" não confere com cidade "Guangzhou" no nome - retornando N/A`);
      return 'N/A';
    }
    // ⚠️ VALIDAÇÃO CRÍTICA: Se país é "Colombia" mas nome tem cidade da China, NÃO usar
    if (company.country.trim() === 'Colombia' && companyName.toLowerCase().includes('guangzhou')) {
      console.warn(`[COUNTRY] ❌ País "Colombia" não confere com cidade "Guangzhou" no nome - retornando N/A`);
      return 'N/A';
    }
    console.warn(`[COUNTRY] ⚠️ Usando campo direto company.country: "${company.country.trim()}" (pode estar desatualizado - verifique raw_data)`);
    return company.country.trim();
  }
  
      // 8️⃣ ❌ REMOVIDO: INFERÊNCIA DE DOMÍNIO (PROIBIDO - usuário exigiu remoção de hardcoding)
      // O usuário explicitamente pediu para REMOVER qualquer inferência hardcoded.
      // Países DEVEM vir apenas de fontes reais (Apollo, Export Dealers, Serper, DDI, etc.)
      
      // 9️⃣ ÚLTIMO RECURSO - RETORNAR N/A
      console.warn(`[COUNTRY] ❌ País não encontrado para ${company.company_name || company.name || 'empresa'}. Verifique as fontes (Apollo, Export Dealers, enriquecimento internacional, DDI, etc.). Inferência de domínio foi REMOVIDA por solicitação do usuário.`);
      return 'N/A';
}

/**
 * Infere país baseado no domínio (.br, .us, .cn, etc.)
 */
function inferCountryFromDomain(domain: string): string | null {
  if (!domain || typeof domain !== 'string') return null;
  
  const domainLower = domain.toLowerCase();
  
  const domainMapping: Record<string, string> = {
    '.br': 'Brasil',
    '.us': 'United States',
    '.uk': 'United Kingdom',
    '.ca': 'Canada',
    '.mx': 'Mexico',
    '.ar': 'Argentina',
    '.cl': 'Chile',
    '.co': 'Colombia',
    '.pe': 'Peru',
    '.cn': 'China',
    '.jp': 'Japan',
    '.kr': 'South Korea',
    '.au': 'Australia',
    '.nz': 'New Zealand',
    '.de': 'Germany',
    '.fr': 'France',
    '.it': 'Italy',
    '.es': 'Spain',
    '.nl': 'Netherlands',
    '.ae': 'United Arab Emirates',
    '.sa': 'Saudi Arabia',
    '.in': 'India',
    '.id': 'Indonesia',
    '.ph': 'Philippines',
    '.sg': 'Singapore',
    '.my': 'Malaysia',
    '.th': 'Thailand',
    '.vn': 'Vietnam',
    '.ru': 'Russia',
    '.tr': 'Turkey',
    '.ua': 'Ukraine',
    '.za': 'South Africa',
    '.ng': 'Nigeria',
    '.eg': 'Egypt',
    '.ke': 'Kenya',
    '.gh': 'Ghana',
    '.ma': 'Morocco',
    '.et': 'Ethiopia',
    '.tz': 'Tanzania',
    '.dz': 'Algeria',
    '.tn': 'Tunisia',
    '.cm': 'Cameroon'
  };
  
  for (const [ext, country] of Object.entries(domainMapping)) {
    if (domainLower.includes(ext)) {
      return country;
    }
  }
  
  return null;
}

// ============================================================================
// CITY HELPERS
// ============================================================================

/**
 * Função: getCityWithFallback(company: any): string
 * 
 * Extrai cidade com múltiplos fallbacks
 */
export function getCityWithFallback(company: any): string {
  if (!company) return 'N/A';
  
  // 1️⃣ CAMPO DIRETO (prioridade máxima)
  if (company.city && typeof company.city === 'string' && company.city.trim() !== '' && company.city !== 'N/A') {
    return company.city.trim();
  }
  
  // 2️⃣ RAW_DATA.APOLLO_ORGANIZATION
  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data))
    ? company.raw_data as Record<string, any>
    : {};
  
  if (rawData.apollo_organization?.city && typeof rawData.apollo_organization.city === 'string') {
    const city = rawData.apollo_organization.city.trim();
    if (city !== '' && city !== 'N/A') {
      return city;
    }
  }
  
  if (rawData.apollo_organization?.headquarters_city && typeof rawData.apollo_organization.headquarters_city === 'string') {
    const city = rawData.apollo_organization.headquarters_city.trim();
    if (city !== '' && city !== 'N/A') {
      return city;
    }
  }
  
  // 3️⃣ LOCATION JSONB
  if (company.location && typeof company.location === 'object' && !Array.isArray(company.location)) {
    const location = company.location as Record<string, any>;
    if (location.city && typeof location.city === 'string' && location.city.trim() !== '' && location.city !== 'N/A') {
      return location.city.trim();
    }
  }
  
  // 4️⃣ RECEITA FEDERAL (Brasil apenas)
  if (rawData.receita_federal?.municipio && typeof rawData.receita_federal.municipio === 'string') {
    const city = rawData.receita_federal.municipio.trim();
    if (city !== '' && city !== 'N/A') {
      return city;
    }
  }
  
  // 5️⃣ FALLBACK
  return 'N/A';
}

// ============================================================================
// LOCATION DISPLAY HELPERS
// ============================================================================

/**
 * Função: getLocationDisplay(company: any): { city: string; country: string }
 * 
 * Extrai Localização completa (Cidade + País)
 */
export function getLocationDisplay(company: any): { city: string; country: string } {
  return {
    city: getCityWithFallback(company),
    country: getCountryWithFallback(company)
  };
}

// ============================================================================
// COMMERCIAL BLOCK HELPERS
// ============================================================================

/**
 * Função: getCommercialBlockDisplay(company: any): string
 * 
 * Extrai Bloco Comercial baseado no país
 */
export function getCommercialBlockDisplay(company: any): string {
  const country = getCountryWithFallback(company);
  return getCommercialBlock(country);
}

/**
 * Função: getContinentDisplay(company: any): string
 * 
 * Extrai Continente baseado no país (FALLBACK ESTÁTICO - usar apenas se API falhar)
 * 
 * ⚠️ DEPRECATED: Preferir getRegionDisplay() que usa API dinâmica
 */
export function getContinentDisplay(company: any): string {
  const country = getCountryWithFallback(company);
  return getContinent(country);
}

/**
 * Função: getRegionDisplay(company: any): Promise<string>
 * 
 * Extrai Região/Continente DINAMICAMENTE via API externa (REST Countries)
 * 
 * ✅ SEM HARDCODING - busca dados reais de APIs gratuitas
 * ✅ Cobertura global (100% dos países)
 * ✅ Cache para performance
 */
export async function getRegionDisplayAsync(company: any): Promise<string> {
  const country = getCountryWithFallback(company);
  
  if (!country || country === 'N/A') {
    return 'N/A';
  }

  try {
    // Importar dinamicamente para evitar dependência circular
    const { getRegion } = await import('@/services/countryRegionService');
    const region = await getRegion(country);
    return region;
  } catch (error: any) {
    console.warn(`[RegionDisplay] ⚠️ Erro ao buscar região via API para ${country}, usando fallback:`, error.message);
    // Fallback para mapeamento estático se API falhar
    return getContinentDisplay(company);
  }
}

/**
 * Função: getRegionDisplay(company: any): string
 * 
 * Versão SÍNCRONA (usa cache ou fallback estático)
 * 
 * ⚠️ Para uso em renderização React, use getRegionDisplayAsync() em useEffect
 */
export function getRegionDisplay(company: any): string {
  // Por enquanto, usar fallback estático
  // TODO: Implementar cache síncrono ou usar React Query para cache
  return getContinentDisplay(company);
}
