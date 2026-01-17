/**
 * LEAD SOURCES & COMMERCIAL BLOCKS
 * 
 * Estrutura de dados para identificar:
 * 1. Fonte do Lead (Lead Source) - de onde veio cada lead
 * 2. Bloco Comercial - bloco geopolítico/comercial baseado no país
 */

// ============================================================================
// LEAD SOURCES - Fontes de Leads
// ============================================================================

export const LEAD_SOURCES = {
  // MOTORES DE BUSCA
  EXPORT_DEALERS: {
    code: 'export_dealers',
    name: 'Export Dealers (B2B)',
    description: 'Busca via Export Dealers (Apollo + Serper)',
    category: 'Motor de Busca'
  },
  
  PANJIVA: {
    code: 'panjiva',
    name: 'Panjiva',
    description: 'Busca via API Panjiva (Trade Data)',
    category: 'API Externa'
  },
  
  MOTOR_TRADE: {
    code: 'motor_trade',
    name: 'Motor Trade',
    description: 'Busca via Motor Trade (Sala Global)',
    category: 'Motor de Busca'
  },
  
  SALA_GLOBAL_B2B: {
    code: 'sala_global_b2b',
    name: 'Sala Global B2B',
    description: 'Busca via Sala Global - Inteligência B2B',
    category: 'Motor de Busca'
  },
  
  // IMPORTAÇÃO
  CSV_UPLOAD: {
    code: 'csv_upload',
    name: 'Importação CSV/XLS',
    description: 'Importado via planilha CSV/XLS',
    category: 'Importação'
  },
  
  // MANUAL
  MANUAL: {
    code: 'manual',
    name: 'Cadastro Manual',
    description: 'Cadastrado manualmente pelo usuário',
    category: 'Manual'
  },
  
  // OUTROS (Futuros)
  IMPORTGENIUS: {
    code: 'importgenius',
    name: 'ImportGenius',
    description: 'Busca via ImportGenius API',
    category: 'API Externa'
  },
  
  VOLZA: {
    code: 'volza',
    name: 'Volza',
    description: 'Busca via Volza API',
    category: 'API Externa'
  },
  
  APOLLO_DIRECT: {
    code: 'apollo_direct',
    name: 'Apollo.io Direto',
    description: 'Busca direta via Apollo.io (sem Export Dealers)',
    category: 'API Externa'
  }
} as const;

// ============================================================================
// COMMERCIAL BLOCKS - Blocos Comerciais
// ============================================================================

export const COMMERCIAL_BLOCKS = {
  // AMÉRICA DO SUL
  MERCOSUL: {
    name: 'MERCOSUL',
    countries: ['Brasil', 'Argentina', 'Paraguai', 'Uruguai', 'Venezuela'],
    continent: 'América do Sul'
  },
  
  // AMÉRICA DO NORTE
  NAFTA: {
    name: 'NAFTA / USMCA',
    countries: ['United States', 'USA', 'US', 'Estados Unidos', 'Canada', 'Canadá', 'México', 'Mexico'],
    continent: 'América do Norte'
  },
  
  // EUROPA
  EU: {
    name: 'União Europeia',
    countries: [
      'Germany', 'Alemanha', 'France', 'França', 'Italy', 'Itália', 
      'Spain', 'Espanha', 'Netherlands', 'Holanda', 'Belgium', 'Bélgica',
      'Austria', 'Áustria', 'Sweden', 'Suécia', 'Poland', 'Polônia', 
      'Denmark', 'Dinamarca', 'Finland', 'Finlândia', 'Portugal',
      'Greece', 'Grécia', 'Ireland', 'Irlanda', 'Czech Republic', 'República Tcheca', 
      'Romania', 'Romênia', 'Hungary', 'Hungria',
      'Slovakia', 'Eslováquia', 'Bulgaria', 'Bulgária', 'Croatia', 'Croácia', 
      'Lithuania', 'Lituânia', 'Slovenia', 'Eslovênia',
      'Latvia', 'Letônia', 'Estonia', 'Estônia', 'Cyprus', 'Chipre', 
      'Malta', 'Luxembourg', 'Luxemburgo'
    ],
    continent: 'Europa'
  },
  
  // ÁSIA
  ASEAN: {
    name: 'ASEAN',
    countries: [
      'Indonesia', 'Indonésia', 'Malaysia', 'Malásia', 
      'Philippines', 'Filipinas', 'Singapore', 'Singapura', 
      'Thailand', 'Tailândia', 'Vietnam', 'Vietnã',
      'Myanmar', 'Cambodia', 'Camboja', 'Laos', 'Brunei'
    ],
    continent: 'Ásia'
  },
  
  APEC: {
    name: 'APEC',
    countries: [
      'Australia', 'Austrália', 'New Zealand', 'Nova Zelândia', 
      'Japan', 'Japão', 'South Korea', 'Coreia do Sul', 'Korea', 
      'China', 'Hong Kong', 'Taiwan',
      'Singapore', 'Singapura', 'Malaysia', 'Malásia', 
      'Thailand', 'Tailândia', 'Indonesia', 'Indonésia', 
      'Philippines', 'Filipinas', 'Vietnam', 'Vietnã',
      'Brunei', 'Papua New Guinea',
      'Chile', 'Mexico', 'México', 'Peru', 'Peru',
      'Russia', 'Rússia', 'United States', 'USA', 'Canada', 'Canadá',
      // Países adicionais fornecidos
      'India', 'Índia', 'Kazakhstan', 'Cazaquistão',
      'Pakistan', 'Paquistão', 'Sri Lanka', 'Turquia', 'Turkey',
      'Ukraine', 'Ucrânia', 'Uzbekistan', 'Uzbequistão'
    ],
    continent: 'Ásia-Pacífico'
  },
  
  // ORIENTE MÉDIO
  GCC: {
    name: 'GCC (Golfo)',
    countries: [
      'Saudi Arabia', 'Arábia Saudita', 'United Arab Emirates', 'Emirados Árabes Unidos',
      'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Barém', 'Oman', 'Omã'
    ],
    continent: 'Oriente Médio'
  },
  
  // AMÉRICA LATINA
  ALADI: {
    name: 'ALADI',
    countries: [
      'Brasil', 'Argentina', 'Chile', 'Colombia', 'Colômbia',
      'Ecuador', 'Equador', 'México', 'Mexico',
      'Paraguai', 'Peru', 'Peru', 'Uruguai', 'Venezuela',
      'Bolivia', 'Bolívia', 'Cuba',
      // Países adicionais fornecidos
      'Costa Rica', 'Panama', 'Panamá'
    ],
    continent: 'América Latina'
  },
  
  // BRICS
  BRICS: {
    name: 'BRICS',
    countries: [
      'Brasil', 'Russia', 'Rússia', 'India', 'Índia', 
      'China', 'South Africa', 'África do Sul'
    ],
    continent: 'Multi-continental'
  },
  
  // ÁFRICA
  AU: {
    name: 'União Africana',
    countries: [
      'South Africa', 'África do Sul', 'Nigeria', 'Nigéria', 
      'Egypt', 'Egito', 'Kenya', 'Quênia', 'Ghana', 'Gana', 
      'Morocco', 'Marrocos', 'Ethiopia', 'Etiópia', 
      'Tanzania', 'Tanzânia', 'Algeria', 'Argélia', 'Tunisia', 'Tunísia',
      // País adicional fornecido
      'Cameroon', 'Camarões'
    ],
    continent: 'África'
  },
  
  // SEM BLOCO ESPECÍFICO (Outros)
  OTHER: {
    name: 'Outros',
    countries: [], // Todos os não listados
    continent: 'Vários'
  }
} as const;

// ============================================================================
// HELPER FUNCTIONS - Funções Auxiliares
// ============================================================================

/**
 * Função: getCommercialBlock(country: string): string
 * 
 * Retorna o bloco comercial baseado no país
 * 
 * ⚠️ IMPORTANTE: Os blocos comerciais são mapeamentos FIXOS baseados em definições geopolíticas reais
 * (MERCOSUL, NAFTA, ALADI, UE, etc.). NÃO são obtidos de API externa, mas sim de conhecimento
 * geopolítico padrão. O país DEVE vir das fontes reais (Apollo, Export Dealers, etc.).
 * 
 * Se o país for 'N/A' ou inválido, significa que o país não foi extraído corretamente das fontes
 * e o problema deve ser corrigido na origem (Edge Functions que buscam os dados).
 */
export function getCommercialBlock(country: string): string {
  if (!country || country.trim() === '' || country === 'N/A') {
    // ⚠️ Se país é 'N/A', significa que não foi extraído das fontes reais
    // O bloco será "Outros" mas isso indica um problema na extração de dados
    console.warn(`[BLOCK] ⚠️ País é 'N/A' - verifique extração nas fontes (Apollo, Export Dealers, etc.)`);
    return COMMERCIAL_BLOCKS.OTHER.name;
  }
  
  const countryNormalized = country.trim();
  
  // Buscar em todos os blocos (exceto OTHER)
  for (const [blockKey, blockData] of Object.entries(COMMERCIAL_BLOCKS)) {
    if (blockKey === 'OTHER') continue; // Pular "OTHER"
    
    // Buscar match exato ou parcial (case-insensitive)
    if (blockData.countries.some(c => {
      const cLower = c.toLowerCase();
      const countryLower = countryNormalized.toLowerCase();
      return cLower === countryLower || 
             countryLower.includes(cLower) || 
             cLower.includes(countryLower);
    })) {
      return blockData.name;
    }
  }
  
  // Se não encontrou em nenhum bloco específico, retornar "Outros"
  // Isso pode indicar que o país não está no mapeamento ou que precisa ser adicionado
  console.warn(`[BLOCK] ⚠️ País "${countryNormalized}" não encontrado em nenhum bloco comercial. Considere adicionar ao mapeamento se for um bloco válido.`);
  return COMMERCIAL_BLOCKS.OTHER.name;
}

/**
 * Função: getContinent(country: string): string
 * 
 * Retorna o continente baseado no país
 */
export function getContinent(country: string): string {
  if (!country || country.trim() === '' || country === 'N/A') {
    return 'N/A';
  }
  
  const countryNormalized = country.trim();
  
  // Buscar em todos os blocos (exceto OTHER)
  for (const [blockKey, blockData] of Object.entries(COMMERCIAL_BLOCKS)) {
    if (blockKey === 'OTHER') continue;
    
    if (blockData.countries.some(c => {
      const cLower = c.toLowerCase();
      const countryLower = countryNormalized.toLowerCase();
      return cLower === countryLower || 
             countryLower.includes(cLower) || 
             cLower.includes(countryLower);
    })) {
      return blockData.continent;
    }
  }
  
  return 'N/A';
}

/**
 * Função: normalizeLeadSource(source: string): string
 * 
 * Normaliza códigos de fonte para nomes comerciais
 */
export function normalizeLeadSource(source: string): string {
  if (!source || source.trim() === '') {
    return LEAD_SOURCES.MANUAL.name;
  }
  
  const sourceLower = source.toLowerCase().trim();
  
  const mapping: Record<string, string> = {
    'dealer_discovery': LEAD_SOURCES.EXPORT_DEALERS.name,
    'dealer_discovery_realtime': LEAD_SOURCES.EXPORT_DEALERS.name,
    'export_dealers': LEAD_SOURCES.EXPORT_DEALERS.name,
    'panjiva': LEAD_SOURCES.PANJIVA.name,
    'motor_trade': LEAD_SOURCES.MOTOR_TRADE.name,
    'sala_global_b2b': LEAD_SOURCES.SALA_GLOBAL_B2B.name,
    'sala_global': LEAD_SOURCES.SALA_GLOBAL_B2B.name,
    'csv_upload': LEAD_SOURCES.CSV_UPLOAD.name,
    'csv': LEAD_SOURCES.CSV_UPLOAD.name,
    'xls': LEAD_SOURCES.CSV_UPLOAD.name,
    'manual': LEAD_SOURCES.MANUAL.name,
    'importgenius': LEAD_SOURCES.IMPORTGENIUS.name,
    'volza': LEAD_SOURCES.VOLZA.name,
    'apollo_direct': LEAD_SOURCES.APOLLO_DIRECT.name,
    'apollo': LEAD_SOURCES.APOLLO_DIRECT.name
  };
  
  // Verificar mapeamento direto
  if (mapping[sourceLower]) {
    return mapping[sourceLower];
  }
  
  // Verificar em LEAD_SOURCES por code
  for (const [, sourceData] of Object.entries(LEAD_SOURCES)) {
    if (sourceData.code.toLowerCase() === sourceLower) {
      return sourceData.name;
    }
  }
  
  // Se não encontrou, retornar original (capitalizado)
  return source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
}
