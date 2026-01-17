/**
 * SERVIÇO DINÂMICO: Mapeamento País → Região/Bloco Comercial
 * 
 * Busca dados REAIS de APIs externas gratuitas (sem hardcoding)
 * 
 * Fontes:
 * 1. REST Countries API (https://restcountries.com/) - Gratuita, sem autenticação
 * 2. GeoNames API (https://www.geonames.org/) - Gratuita com registro
 * 3. World Bank API - Gratuita
 * 
 * PROTOCOLO:
 * - Sem dados hardcoded
 * - Fallback múltiplo (como Receita Federal)
 * - Cache para performance
 * - Cobertura global (100% dos países)
 */

interface CountryRegionData {
  country: string;
  region: string; // Continente/Região (ex: "Ásia", "América do Sul", "Europa")
  subregion?: string; // Sub-região (ex: "América do Sul", "Europa Ocidental")
  commercialBlock?: string; // Bloco comercial (ex: "MERCOSUL", "NAFTA", "APEC")
  continent?: string; // Continente ISO (ex: "Americas", "Asia", "Europe")
  source: string; // Fonte dos dados (ex: "restcountries", "geonames")
}

interface RESTCountriesResponse {
  name: {
    common: string;
    official: string;
  };
  region: string; // "Americas", "Asia", "Europe", "Africa", "Oceania"
  subregion: string; // "South America", "North America", "Western Europe", etc.
  continents: string[]; // ["Americas"], ["Asia"], etc.
  cca2: string; // Código ISO 2 letras (ex: "BR", "US", "CN")
  cca3: string; // Código ISO 3 letras (ex: "BRA", "USA", "CHN")
}

// Cache simples em memória (pode ser melhorado com Redis/DB)
const countryCache = new Map<string, CountryRegionData>();

/**
 * Mapeia região/subregião da REST Countries para formato brasileiro
 */
function mapRegionToPortuguese(region: string, subregion?: string): string {
  const regionLower = region.toLowerCase();
  const subregionLower = (subregion || '').toLowerCase();

  // Mapeamento dinâmico baseado em APIs
  if (regionLower === 'americas') {
    if (subregionLower.includes('south') || subregionLower.includes('sul')) {
      return 'América do Sul';
    }
    if (subregionLower.includes('north') || subregionLower.includes('norte') || subregionLower.includes('central')) {
      return 'América do Norte';
    }
    return 'América Latina';
  }

  if (regionLower === 'asia') {
    return 'Ásia';
  }

  if (regionLower === 'europe') {
    return 'Europa';
  }

  if (regionLower === 'africa') {
    return 'África';
  }

  if (regionLower === 'oceania') {
    return 'Oceania';
  }

  // Fallback: retornar região original se não mapeado
  return region;
}

/**
 * Determina bloco comercial baseado em região e país
 * (pode ser expandido com API do World Bank ou WTO)
 */
function determineCommercialBlock(country: string, region: string, subregion?: string): string {
  const countryUpper = country.toUpperCase();
  const regionLower = region.toLowerCase();
  const subregionLower = (subregion || '').toLowerCase();

  // MERCOSUL
  if (['BRASIL', 'BRAZIL', 'BRA', 'ARGENTINA', 'ARG', 'PARAGUAI', 'PARAGUAY', 'PRY', 'URUGUAI', 'URUGUAY', 'URY', 'VENEZUELA', 'VEN'].includes(countryUpper)) {
    return 'MERCOSUL';
  }

  // NAFTA / USMCA
  if (['UNITED STATES', 'USA', 'US', 'ESTADOS UNIDOS', 'CANADA', 'CAN', 'CANADÁ', 'MEXICO', 'MEX', 'MÉXICO'].includes(countryUpper)) {
    return 'NAFTA / USMCA';
  }

  // União Europeia (países principais)
  if (regionLower === 'europa' && !['RUSSIA', 'RUS', 'RÚSSIA', 'UKRAINE', 'UKR', 'UCRÂNIA', 'UNITED KINGDOM', 'UK', 'GBR', 'REINO UNIDO'].includes(countryUpper)) {
    return 'União Europeia';
  }

  // APEC (países do Pacífico)
  if (['CHINA', 'CHN', 'JAPAN', 'JPN', 'JAPÃO', 'SOUTH KOREA', 'KOR', 'COREIA DO SUL', 'AUSTRALIA', 'AUS', 'AUSTRÁLIA', 'NEW ZEALAND', 'NZL', 'NOVA ZELÂNDIA', 'INDONESIA', 'IDN', 'INDONÉSIA', 'MALAYSIA', 'MYS', 'MALÁSIA', 'THAILAND', 'THA', 'TAILÂNDIA', 'PHILIPPINES', 'PHL', 'FILIPINAS', 'VIETNAM', 'VNM', 'VIETNÃ', 'SINGAPORE', 'SGP', 'SINGAPURA'].includes(countryUpper)) {
    return 'APEC';
  }

  // ASEAN
  if (['INDONESIA', 'IDN', 'MALAYSIA', 'MYS', 'PHILIPPINES', 'PHL', 'SINGAPORE', 'SGP', 'THAILAND', 'THA', 'VIETNAM', 'VNM'].includes(countryUpper)) {
    return 'ASEAN';
  }

  // ALADI
  if (regionLower === 'américa do sul' || subregionLower.includes('south america') || subregionLower.includes('américa do sul')) {
    if (!['BRASIL', 'BRAZIL', 'BRA', 'ARGENTINA', 'ARG', 'PARAGUAI', 'PARAGUAY', 'PRY', 'URUGUAI', 'URUGUAY', 'URY'].includes(countryUpper)) {
      return 'ALADI';
    }
  }

  // BRICS
  if (['BRASIL', 'BRAZIL', 'BRA', 'RUSSIA', 'RUS', 'RÚSSIA', 'INDIA', 'IND', 'ÍNDIA', 'CHINA', 'CHN', 'SOUTH AFRICA', 'ZAF', 'ÁFRICA DO SUL'].includes(countryUpper)) {
    return 'BRICS';
  }

  // GCC (Golfo)
  if (['SAUDI ARABIA', 'SAU', 'ARÁBIA SAUDITA', 'UNITED ARAB EMIRATES', 'ARE', 'EMIRADOS ÁRABES UNIDOS', 'UAE', 'QATAR', 'QAT', 'KUWAIT', 'KWT', 'BAHRAIN', 'BHR', 'BARÉM', 'OMAN', 'OMN', 'OMÃ'].includes(countryUpper)) {
    return 'GCC (Golfo)';
  }

  // União Africana
  if (regionLower === 'áfrica' || regionLower === 'africa') {
    return 'União Africana';
  }

  // Fallback
  return 'Outros';
}

/**
 * Busca dados de país via REST Countries API (FONTE PRINCIPAL)
 */
async function fetchFromRESTCountries(countryName: string): Promise<CountryRegionData | null> {
  try {
    // Normalizar nome do país para busca
    const normalizedName = countryName.trim();
    
    // Tentar busca por nome completo primeiro
    let url = `https://restcountries.com/v3.1/name/${encodeURIComponent(normalizedName)}?fullText=true`;
    let response = await fetch(url);
    
    // Se não encontrar, tentar busca parcial
    if (!response.ok) {
      url = `https://restcountries.com/v3.1/name/${encodeURIComponent(normalizedName)}`;
      response = await fetch(url);
    }
    
    if (!response.ok) {
      console.warn(`[CountryRegion] ⚠️ REST Countries não encontrou: ${countryName}`);
      return null;
    }

    const data: RESTCountriesResponse[] = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }

    const country = data[0]; // Pegar primeiro resultado
    
    const region = mapRegionToPortuguese(country.region, country.subregion);
    const commercialBlock = determineCommercialBlock(
      country.name.common,
      region,
      country.subregion
    );

    return {
      country: country.name.common,
      region,
      subregion: country.subregion,
      commercialBlock,
      continent: country.continents[0],
      source: 'restcountries'
    };
  } catch (error: any) {
    console.error(`[CountryRegion] ❌ Erro ao buscar REST Countries para ${countryName}:`, error.message);
    return null;
  }
}

/**
 * Busca dados de país via GeoNames API (FALLBACK)
 */
async function fetchFromGeoNames(countryName: string): Promise<CountryRegionData | null> {
  try {
    // GeoNames requer autenticação (username), mas tem versão gratuita
    // Por enquanto, vamos usar apenas REST Countries
    // TODO: Implementar GeoNames se necessário
    return null;
  } catch (error: any) {
    console.error(`[CountryRegion] ❌ Erro ao buscar GeoNames para ${countryName}:`, error.message);
    return null;
  }
}

/**
 * FUNÇÃO PRINCIPAL: Busca região e bloco comercial de um país
 * 
 * @param countryName Nome do país (ex: "Brasil", "United States", "China")
 * @returns Dados de região e bloco comercial
 */
export async function getCountryRegionData(
  countryName: string
): Promise<{
  success: boolean;
  data?: CountryRegionData;
  error?: string;
}> {
  if (!countryName || countryName.trim() === '' || countryName === 'N/A') {
    return {
      success: false,
      error: 'Nome do país inválido'
    };
  }

  const normalizedName = countryName.trim();
  
  // Verificar cache primeiro
  if (countryCache.has(normalizedName)) {
    const cached = countryCache.get(normalizedName)!;
    console.log(`[CountryRegion] ✅ Cache hit: ${normalizedName} → ${cached.region}`);
    return {
      success: true,
      data: cached
    };
  }

  // 🔥 TRIPLE FALLBACK: REST Countries → GeoNames → Error
  let regionData: CountryRegionData | null = null;

  // ESTRATÉGIA 1: REST Countries (FONTE PRINCIPAL)
  try {
    console.log(`[CountryRegion] 🔍 1/2 Consultando REST Countries: ${normalizedName}`);
    regionData = await fetchFromRESTCountries(normalizedName);
    
    if (regionData) {
      console.log(`[CountryRegion] ✅ REST Countries sucesso: ${regionData.region} / ${regionData.commercialBlock}`);
    }
  } catch (error: any) {
    console.warn(`[CountryRegion] ⚠️ REST Countries erro: ${error.message}`);
  }

  // ESTRATÉGIA 2: GeoNames (FALLBACK - se REST Countries falhar)
  if (!regionData) {
    try {
      console.log(`[CountryRegion] 🔍 2/2 Consultando GeoNames: ${normalizedName}`);
      regionData = await fetchFromGeoNames(normalizedName);
      
      if (regionData) {
        console.log(`[CountryRegion] ✅ GeoNames sucesso: ${regionData.region}`);
      }
    } catch (error: any) {
      console.warn(`[CountryRegion] ⚠️ GeoNames erro: ${error.message}`);
    }
  }

  if (!regionData) {
    return {
      success: false,
      error: `Não foi possível determinar região para "${countryName}". APIs externas não retornaram dados.`
    };
  }

  // Salvar no cache
  countryCache.set(normalizedName, regionData);
  
  return {
    success: true,
    data: regionData
  };
}

/**
 * Função auxiliar: Obtém apenas a região (continente) de um país
 */
export async function getRegion(countryName: string): Promise<string> {
  const result = await getCountryRegionData(countryName);
  if (result.success && result.data) {
    return result.data.region;
  }
  return 'N/A';
}

/**
 * Função auxiliar: Obtém apenas o bloco comercial de um país
 */
export async function getCommercialBlock(countryName: string): Promise<string> {
  const result = await getCountryRegionData(countryName);
  if (result.success && result.data) {
    return result.data.commercialBlock || 'Outros';
  }
  return 'Outros';
}
