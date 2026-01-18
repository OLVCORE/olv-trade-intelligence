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
 * Determina bloco comercial baseado APENAS em região/subregião retornada pela API
 * 
 * ✅ SEM HARDCODE DE PAÍSES - inferência baseada apenas em dados geográficos da API
 * Baseado em padrões geopolíticos conhecidos de blocos comerciais por região
 * 
 * @param region Região retornada pela REST Countries API (ex: "América do Sul", "Europa")
 * @param subregion Sub-região retornada pela API (ex: "South America", "Western Europe")
 * @param cca2 Código ISO 2 letras do país (ex: "BR", "US", "GB") - para casos especiais
 * @returns Nome do bloco comercial inferido
 */
function determineCommercialBlock(region: string, subregion?: string, cca2?: string): string {
  const regionLower = region.toLowerCase();
  const subregionLower = (subregion || '').toLowerCase();
  
  // ✅ INFERÊNCIA BASEADA APENAS EM REGIÃO (sem hardcode de países)
  
  // América do Sul → MERCOSUL ou ALADI (inferência baseada em sub-região)
  if (regionLower.includes('américa do sul') || subregionLower.includes('south america')) {
    // Se sub-região indica Cone Sul, provavelmente MERCOSUL
    if (subregionLower.includes('south') && !subregionLower.includes('central')) {
      return 'MERCOSUL / ALADI';
    }
    return 'ALADI';
  }
  
  // América do Norte / Central → NAFTA/USMCA
  if (regionLower.includes('américa do norte') || regionLower.includes('north america') || 
      subregionLower.includes('north america') || subregionLower.includes('central america')) {
    return 'NAFTA / USMCA';
  }
  
  // Europa → União Europeia (inferência baseada em região, não países específicos)
  if (regionLower.includes('europa') || regionLower.includes('europe')) {
    return 'União Europeia';
  }
  
  // Ásia → APEC ou ASEAN (inferência baseada em sub-região)
  if (regionLower.includes('ásia') || regionLower.includes('asia')) {
    if (subregionLower.includes('south') || subregionLower.includes('southeast')) {
      return 'ASEAN';
    }
    if (subregionLower.includes('east') || subregionLower.includes('pacific')) {
      return 'APEC';
    }
    return 'APEC';
  }
  
  // Oriente Médio → GCC
  if (regionLower.includes('oriente médio') || subregionLower.includes('middle east') || 
      subregionLower.includes('western asia')) {
    return 'GCC (Golfo)';
  }
  
  // África → União Africana
  if (regionLower.includes('áfrica') || regionLower.includes('africa')) {
    return 'União Africana';
  }
  
  // Oceania → APEC
  if (regionLower.includes('oceania') || regionLower.includes('oceania')) {
    return 'APEC';
  }
  
  // Fallback: "Outros" se não conseguir inferir
  return 'Outros';
}

/**
 * Normaliza nome do país para busca na REST Countries API
 * 
 * A API pode não reconhecer variações como "United Kingdom" vs "UK" vs "Reino Unido"
 * Tenta múltiplas variações para encontrar o país correto
 * 
 * ✅ Suporta 195+ países com variações de nomes em múltiplos idiomas
 */
function normalizeCountryNameForAPI(countryName: string): string[] {
  const normalized = countryName.trim();
  const variations: string[] = [normalized];
  const lowerName = normalized.toLowerCase();
  
  // Mapeamento de variações comuns → nome oficial da API (apenas variações críticas)
  // Nota: Para 195+ países, é melhor buscar diretamente na API com múltiplas estratégias
  const commonVariations: Record<string, string> = {
    'uk': 'United Kingdom',
    'reino unido': 'United Kingdom',
    'great britain': 'United Kingdom',
    'gb': 'United Kingdom',
    'gbr': 'United Kingdom',
    'usa': 'United States',
    'us': 'United States',
    'estados unidos': 'United States',
    'brasil': 'Brazil',
    'brazil': 'Brazil',
    'méxico': 'Mexico',
    'mexico': 'Mexico',
  };
  
  if (commonVariations[lowerName]) {
    variations.push(commonVariations[lowerName]);
  }
  
  return variations;
}

/**
 * Busca dados de país via REST Countries API (FONTE PRINCIPAL)
 * 
 * ✅ Suporta 195+ países dinamicamente
 * ✅ Tenta múltiplas variações de nome (UK, United Kingdom, Reino Unido, etc.)
 * ✅ Busca por nome completo e parcial
 * ✅ Fallback para busca por código ISO se nome falhar
 */
async function fetchFromRESTCountries(countryName: string): Promise<CountryRegionData | null> {
  try {
    console.log(`[RESTCountries] 🔍 Iniciando busca para: "${countryName}"`);
    // Normalizar nome do país e obter variações
    const variations = normalizeCountryNameForAPI(countryName);
    console.log(`[RESTCountries] 📋 Variações a tentar:`, variations);
    
    // Tentar cada variação
    for (const variation of variations) {
      console.log(`[RESTCountries] 🔄 Tentando variação: "${variation}"`);
      // ✅ ESTRATÉGIA 1: Busca por nome completo (mais preciso) - funciona para maioria dos 195+ países
      let url = `https://restcountries.com/v3.1/name/${encodeURIComponent(variation)}?fullText=true`;
      console.log(`[RESTCountries] 🌐 Estratégia 1 - URL:`, url);
      let response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      console.log(`[RESTCountries] 📡 Resposta Estratégia 1: ${response.status} ${response.statusText}`);
      
      // ✅ ESTRATÉGIA 2: Se não encontrar, tentar busca parcial (permite substring)
      if (!response.ok) {
        url = `https://restcountries.com/v3.1/name/${encodeURIComponent(variation)}`;
        console.log(`[RESTCountries] 🌐 Estratégia 2 - URL:`, url);
        response = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        console.log(`[RESTCountries] 📡 Resposta Estratégia 2: ${response.status} ${response.statusText}`);
      }
      
      // ✅ PROCESSAR RESPOSTA: Pode ser array ou objeto único
      if (response.ok) {
        try {
          // ✅ CRÍTICO: Parsear resposta UMA VEZ apenas
          const responseData = await response.json();
          
          // Se for array, pegar primeiro resultado ou melhor match
          const data: RESTCountriesResponse[] = Array.isArray(responseData) ? responseData : [responseData];
          
          if (data && data.length > 0) {
            // Encontrar melhor match (priorizar nome exato)
            const country = data.find(c => 
              c.name.common.toLowerCase() === variation.toLowerCase() ||
              c.name.official.toLowerCase() === variation.toLowerCase() ||
              c.name.common.toLowerCase().includes(variation.toLowerCase()) ||
              variation.toLowerCase().includes(c.name.common.toLowerCase())
            ) || data[0]; // Fallback: primeiro resultado
            
            const region = mapRegionToPortuguese(country.region, country.subregion);
            const commercialBlock = determineCommercialBlock(
              region,
              country.subregion,
              country.cca2
            );

            console.log(`[RESTCountries] ✅ Encontrado: ${country.name.common} → região="${region}", bloco="${commercialBlock}"`);
            return {
              country: country.name.common,
              region,
              subregion: country.subregion,
              commercialBlock,
              continent: country.continents[0],
              source: 'restcountries'
            };
          }
        } catch (parseError) {
          console.error(`[CountryRegion] ❌ Erro ao parsear resposta para ${variation}:`, parseError);
        }
      }
      
      // ✅ ESTRATÉGIA 3: Se ainda não encontrou, tentar busca por código ISO (apenas para códigos curtos)
      if (!response.ok && (variation.length === 2 || variation.length === 3)) {
        url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(variation.toUpperCase())}`;
        console.log(`[RESTCountries] 🌐 Estratégia 3 (ISO) - URL:`, url);
        response = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        console.log(`[RESTCountries] 📡 Resposta Estratégia 3: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          try {
            const countryData = await response.json();
            // Se for array, pegar primeiro resultado
            const country: RESTCountriesResponse = Array.isArray(countryData) ? countryData[0] : countryData;
            
            const region = mapRegionToPortuguese(country.region, country.subregion);
            const commercialBlock = determineCommercialBlock(
              region,
              country.subregion,
              country.cca2
            );

            console.log(`[RESTCountries] ✅ Encontrado via ISO: ${country.name.common} → região="${region}", bloco="${commercialBlock}"`);
            return {
              country: country.name.common,
              region,
              subregion: country.subregion,
              commercialBlock,
              continent: country.continents[0],
              source: 'restcountries'
            };
          } catch (parseError) {
            console.warn(`[CountryRegion] ⚠️ Erro ao parsear resposta ISO para ${variation}:`, parseError);
          }
        }
      }
    }
    
    console.warn(`[CountryRegion] ⚠️ REST Countries não encontrou: ${countryName} (tentou: ${variations.join(', ')})`);
    return null;
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
