/**
 * SERVIÇO: Country Normalizer
 * 
 * Universaliza nomes de países para garantir máxima assertividade nas buscas:
 * - Traduz para inglês (padrão para APIs internacionais)
 * - Mantém nome original na língua do país
 * - Normaliza variações comuns
 * - Retorna múltiplas variações para busca simultânea
 */

// Mapeamento completo de países: Português → Inglês → Códigos ISO
const COUNTRY_MAP: Record<string, { en: string; native: string; code: string }> = {
  // América do Sul
  'Brasil': { en: 'Brazil', native: 'Brasil', code: 'BR' },
  'Brazil': { en: 'Brazil', native: 'Brasil', code: 'BR' },
  'Argentina': { en: 'Argentina', native: 'Argentina', code: 'AR' },
  'Chile': { en: 'Chile', native: 'Chile', code: 'CL' },
  'Colômbia': { en: 'Colombia', native: 'Colombia', code: 'CO' },
  'Colombia': { en: 'Colombia', native: 'Colombia', code: 'CO' },
  'Peru': { en: 'Peru', native: 'Perú', code: 'PE' },
  'Perú': { en: 'Peru', native: 'Perú', code: 'PE' },
  'Equador': { en: 'Ecuador', native: 'Ecuador', code: 'EC' },
  'Ecuador': { en: 'Ecuador', native: 'Ecuador', code: 'EC' },
  'Paraguai': { en: 'Paraguay', native: 'Paraguay', code: 'PY' },
  'Paraguay': { en: 'Paraguay', native: 'Paraguay', code: 'PY' },
  'Uruguai': { en: 'Uruguay', native: 'Uruguay', code: 'UY' },
  'Uruguay': { en: 'Uruguay', native: 'Uruguay', code: 'UY' },
  'Venezuela': { en: 'Venezuela', native: 'Venezuela', code: 'VE' },
  'Bolívia': { en: 'Bolivia', native: 'Bolivia', code: 'BO' },
  'Bolivia': { en: 'Bolivia', native: 'Bolivia', code: 'BO' },
  'Guiana': { en: 'Guyana', native: 'Guyana', code: 'GY' },
  'Guyana': { en: 'Guyana', native: 'Guyana', code: 'GY' },
  'Suriname': { en: 'Suriname', native: 'Suriname', code: 'SR' },
  'Guiana Francesa': { en: 'French Guiana', native: 'Guyane française', code: 'GF' },
  'French Guiana': { en: 'French Guiana', native: 'Guyane française', code: 'GF' },
  
  // América Central e Caribe
  'Costa Rica': { en: 'Costa Rica', native: 'Costa Rica', code: 'CR' },
  'Panamá': { en: 'Panama', native: 'Panamá', code: 'PA' },
  'Panama': { en: 'Panama', native: 'Panamá', code: 'PA' },
  'México': { en: 'Mexico', native: 'México', code: 'MX' },
  'Mexico': { en: 'Mexico', native: 'México', code: 'MX' },
  'Guatemala': { en: 'Guatemala', native: 'Guatemala', code: 'GT' },
  'Honduras': { en: 'Honduras', native: 'Honduras', code: 'HN' },
  'El Salvador': { en: 'El Salvador', native: 'El Salvador', code: 'SV' },
  'Nicarágua': { en: 'Nicaragua', native: 'Nicaragua', code: 'NI' },
  'Nicaragua': { en: 'Nicaragua', native: 'Nicaragua', code: 'NI' },
  'República Dominicana': { en: 'Dominican Republic', native: 'República Dominicana', code: 'DO' },
  'Dominican Republic': { en: 'Dominican Republic', native: 'República Dominicana', code: 'DO' },
  'Cuba': { en: 'Cuba', native: 'Cuba', code: 'CU' },
  'Haiti': { en: 'Haiti', native: 'Haïti', code: 'HT' },
  'Jamaica': { en: 'Jamaica', native: 'Jamaica', code: 'JM' },
  'Trinidad e Tobago': { en: 'Trinidad and Tobago', native: 'Trinidad and Tobago', code: 'TT' },
  'Trinidad and Tobago': { en: 'Trinidad and Tobago', native: 'Trinidad and Tobago', code: 'TT' },
  
  // América do Norte
  'Estados Unidos': { en: 'United States', native: 'United States', code: 'US' },
  'United States': { en: 'United States', native: 'United States', code: 'US' },
  'USA': { en: 'United States', native: 'United States', code: 'US' },
  'Canadá': { en: 'Canada', native: 'Canada', code: 'CA' },
  'Canada': { en: 'Canada', native: 'Canada', code: 'CA' },
  
  // Europa
  'Reino Unido': { en: 'United Kingdom', native: 'United Kingdom', code: 'GB' },
  'United Kingdom': { en: 'United Kingdom', native: 'United Kingdom', code: 'GB' },
  'UK': { en: 'United Kingdom', native: 'United Kingdom', code: 'GB' },
  'Alemanha': { en: 'Germany', native: 'Deutschland', code: 'DE' },
  'Germany': { en: 'Germany', native: 'Deutschland', code: 'DE' },
  'França': { en: 'France', native: 'France', code: 'FR' },
  'France': { en: 'France', native: 'France', code: 'FR' },
  'Itália': { en: 'Italy', native: 'Italia', code: 'IT' },
  'Italy': { en: 'Italy', native: 'Italia', code: 'IT' },
  'Espanha': { en: 'Spain', native: 'España', code: 'ES' },
  'Spain': { en: 'Spain', native: 'España', code: 'ES' },
  'Portugal': { en: 'Portugal', native: 'Portugal', code: 'PT' },
  'Holanda': { en: 'Netherlands', native: 'Nederland', code: 'NL' },
  'Netherlands': { en: 'Netherlands', native: 'Nederland', code: 'NL' },
  'Bélgica': { en: 'Belgium', native: 'België', code: 'BE' },
  'Belgium': { en: 'Belgium', native: 'België', code: 'BE' },
  'Suíça': { en: 'Switzerland', native: 'Schweiz', code: 'CH' },
  'Switzerland': { en: 'Switzerland', native: 'Schweiz', code: 'CH' },
  'Áustria': { en: 'Austria', native: 'Österreich', code: 'AT' },
  'Austria': { en: 'Austria', native: 'Österreich', code: 'AT' },
  'Polônia': { en: 'Poland', native: 'Polska', code: 'PL' },
  'Poland': { en: 'Poland', native: 'Polska', code: 'PL' },
  'Suécia': { en: 'Sweden', native: 'Sverige', code: 'SE' },
  'Sweden': { en: 'Sweden', native: 'Sverige', code: 'SE' },
  'Noruega': { en: 'Norway', native: 'Norge', code: 'NO' },
  'Norway': { en: 'Norway', native: 'Norge', code: 'NO' },
  'Dinamarca': { en: 'Denmark', native: 'Danmark', code: 'DK' },
  'Denmark': { en: 'Denmark', native: 'Danmark', code: 'DK' },
  'Finlândia': { en: 'Finland', native: 'Suomi', code: 'FI' },
  'Finland': { en: 'Finland', native: 'Suomi', code: 'FI' },
  'Grécia': { en: 'Greece', native: 'Ελλάδα', code: 'GR' },
  'Greece': { en: 'Greece', native: 'Ελλάδα', code: 'GR' },
  'Rússia': { en: 'Russia', native: 'Россия', code: 'RU' },
  'Russia': { en: 'Russia', native: 'Россия', code: 'RU' },
  'Irlanda': { en: 'Ireland', native: 'Éire', code: 'IE' },
  'Ireland': { en: 'Ireland', native: 'Éire', code: 'IE' },
  
  // Ásia
  'China': { en: 'China', native: '中国', code: 'CN' },
  'Índia': { en: 'India', native: 'भारत', code: 'IN' },
  'India': { en: 'India', native: 'भारत', code: 'IN' },
  'Japão': { en: 'Japan', native: '日本', code: 'JP' },
  'Japan': { en: 'Japan', native: '日本', code: 'JP' },
  'Coreia do Sul': { en: 'South Korea', native: '대한민국', code: 'KR' },
  'South Korea': { en: 'South Korea', native: '대한민국', code: 'KR' },
  'Singapura': { en: 'Singapore', native: 'Singapore', code: 'SG' },
  'Singapore': { en: 'Singapore', native: 'Singapore', code: 'SG' },
  'Tailândia': { en: 'Thailand', native: 'ประเทศไทย', code: 'TH' },
  'Thailand': { en: 'Thailand', native: 'ประเทศไทย', code: 'TH' },
  'Malásia': { en: 'Malaysia', native: 'Malaysia', code: 'MY' },
  'Malaysia': { en: 'Malaysia', native: 'Malaysia', code: 'MY' },
  'Indonésia': { en: 'Indonesia', native: 'Indonesia', code: 'ID' },
  'Indonesia': { en: 'Indonesia', native: 'Indonesia', code: 'ID' },
  'Filipinas': { en: 'Philippines', native: 'Pilipinas', code: 'PH' },
  'Philippines': { en: 'Philippines', native: 'Pilipinas', code: 'PH' },
  'Vietnã': { en: 'Vietnam', native: 'Việt Nam', code: 'VN' },
  'Vietnam': { en: 'Vietnam', native: 'Việt Nam', code: 'VN' },
  'Turquia': { en: 'Turkey', native: 'Türkiye', code: 'TR' },
  'Turkey': { en: 'Turkey', native: 'Türkiye', code: 'TR' },
  'Israel': { en: 'Israel', native: 'ישראל', code: 'IL' },
  'Emirados Árabes Unidos': { en: 'United Arab Emirates', native: 'الإمارات العربية المتحدة', code: 'AE' },
  'United Arab Emirates': { en: 'United Arab Emirates', native: 'الإمارات العربية المتحدة', code: 'AE' },
  'UAE': { en: 'United Arab Emirates', native: 'الإمارات العربية المتحدة', code: 'AE' },
  'Arábia Saudita': { en: 'Saudi Arabia', native: 'المملكة العربية السعودية', code: 'SA' },
  'Saudi Arabia': { en: 'Saudi Arabia', native: 'المملكة العربية السعودية', code: 'SA' },
  
  // Oceania
  'Austrália': { en: 'Australia', native: 'Australia', code: 'AU' },
  'Australia': { en: 'Australia', native: 'Australia', code: 'AU' },
  'Nova Zelândia': { en: 'New Zealand', native: 'New Zealand', code: 'NZ' },
  'New Zealand': { en: 'New Zealand', native: 'New Zealand', code: 'NZ' },
};

export interface CountryNormalization {
  original: string;
  english: string;
  native: string;
  code: string;
  searchVariations: string[]; // Todas as variações para busca simultânea (sem duplicatas, sem vazios)
  displayName: string; // Nome para exibição em português
  canonicalPt: string; // Nome canônico em português
  iso2?: string; // Código ISO 2 letras (se disponível)
}

/**
 * Normaliza um nome de país para múltiplas variações
 */
export function normalizeCountry(countryName: string): CountryNormalization {
  const normalized = countryName.trim();
  const normalizedKey = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  
  // Buscar no mapeamento
  const mapping = COUNTRY_MAP[normalized] || COUNTRY_MAP[normalizedKey] || COUNTRY_MAP[countryName];
  
  if (mapping) {
    // Gerar variações únicas (sem duplicatas, sem vazios)
    const variations = [mapping.en, mapping.native, normalized]
      .filter(v => v && v.trim().length > 0) // Remover vazios
      .filter((v, i, arr) => arr.indexOf(v) === i); // Remover duplicatas
    
    // Determinar nome canônico em português (priorizar versão PT se disponível)
    const canonicalPt = normalized; // Usar original como canônico
    
    return {
      original: normalized,
      english: mapping.en,
      native: mapping.native,
      code: mapping.code,
      searchVariations: variations,
      displayName: canonicalPt,
      canonicalPt: canonicalPt,
      iso2: mapping.code.length === 2 ? mapping.code : undefined,
    };
  }
  
  // Se não encontrado no mapeamento, tentar normalizar
  // Assumir que o nome já está em inglês se não estiver no mapa
  const variations = normalized && normalized.trim().length > 0 
    ? [normalized] 
    : [];
    
  return {
    original: normalized,
    english: normalized,
    native: normalized,
    code: '', // Código desconhecido
    searchVariations: variations, // Sem vazios
    displayName: normalized,
    canonicalPt: normalized,
    iso2: undefined,
  };
}

/**
 * Normaliza um array de países
 */
export function normalizeCountries(countries: string[]): CountryNormalization[] {
  return countries.map(normalizeCountry);
}

/**
 * Extrai todas as variações de busca de um array de países normalizados
 * Retorna array único, sem duplicatas, sem vazios
 */
export function getAllSearchVariations(countries: CountryNormalization[]): string[] {
  const allVariations = new Set<string>();
  
  countries.forEach(country => {
    country.searchVariations.forEach(variation => {
      // Filtrar vazios e normalizar
      const trimmed = variation?.trim();
      if (trimmed && trimmed.length > 0) {
        allVariations.add(trimmed);
      }
    });
  });
  
  return Array.from(allVariations).filter(v => v && v.length > 0); // Garantir sem vazios
}

/**
 * Converte resultado de busca de volta para nome em português (se disponível)
 */
export function denormalizeCountryName(countryName: string): string {
  // Buscar país que tenha este nome como variação
  for (const [key, value] of Object.entries(COUNTRY_MAP)) {
    if (value.en === countryName || value.native === countryName || key === countryName) {
      // Retornar versão em português se disponível
      const ptKeys = Object.keys(COUNTRY_MAP).filter(k => 
        COUNTRY_MAP[k].code === value.code && 
        (k.includes('ã') || k.includes('ç') || k.includes('ó') || k.includes('é'))
      );
      return ptKeys[0] || key;
    }
  }
  
  return countryName; // Retornar original se não encontrar
}
