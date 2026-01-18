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
// COMMERCIAL BLOCKS - REMOVIDO (hardcoded)
// ============================================================================
// 
// ⚠️ REMOVIDO: COMMERCIAL_BLOCKS hardcoded foi REMOVIDO
// 
// ✅ AGORA: Blocos comerciais são buscados DINAMICAMENTE de APIs externas
// - REST Countries API: busca região/sub-região do país
// - Inferência de bloco comercial baseada em região (sem hardcode de países)
// 
// Para obter bloco comercial, use:
// - `getCommercialBlockFromAPI(country)` de `@/services/countryRegionService`
// - `useCountryRegion(company)` hook React (recomendado)
// 
// Nenhum país ou bloco comercial está hardcoded.
// Todos os dados vêm de APIs externas gratuitas (REST Countries).
// 
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS - Funções Auxiliares
// ============================================================================

/**
 * Função: getCommercialBlock(country: string): string
 * 
 * ⚠️ DEPRECATED: Esta função retorna apenas "N/A"
 * 
 * Use `getCommercialBlockFromAPI(country)` ou `useCountryRegion(company)` hook
 * que busca blocos comerciais DINAMICAMENTE de APIs externas (REST Countries)
 * 
 * NÃO HARDCODE: Blocos comerciais são inferidos baseados em região/sub-região
 * retornada pela REST Countries API, sem hardcode de países específicos.
 */
export function getCommercialBlock(country: string): string {
  // ⚠️ DEPRECATED: Retornar placeholder - usar versão assíncrona
  console.warn(`[BLOCK] ⚠️ getCommercialBlock() está deprecated. Use getCommercialBlockFromAPI() ou useCountryRegion() hook.`);
  return 'N/A';
}

/**
 * Função: getContinent(country: string): string
 * 
 * ⚠️ DEPRECATED: Esta função retorna "N/A"
 * 
 * Para obter continente/região REAL, use:
 * - getRegion() de @/services/countryRegionService (busca de API)
 * - useCountryRegion() hook (recomendado para componentes React)
 * 
 * ✅ SEM HARDCODE - busca real de APIs externas (REST Countries)
 */
export function getContinent(country: string): string {
  // ⚠️ SEM HARDCODE - retornar placeholder
  // Continente será buscado dinamicamente via API
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
