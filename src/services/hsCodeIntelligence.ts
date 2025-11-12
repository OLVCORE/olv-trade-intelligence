/**
 * HS CODE INTELLIGENCE SERVICE
 * 
 * Identifica automaticamente o produto pelo código HS
 * e gera keywords para busca multi-source
 */

// Database de HS Codes (10.000+ códigos)
// Fonte: WCO Harmonized System Database
const HS_CODE_DATABASE: Record<string, {
  description: string;
  keywords: string[];
  category: string;
}> = {
  // CAPÍTULO 95: Toys, games, sports equipment
  '9506': {
    description: 'Articles and equipment for general physical exercise, gymnastics or athletics',
    keywords: ['fitness equipment', 'sporting goods', 'athletic equipment', 'gym equipment', 'exercise equipment'],
    category: 'Sports & Fitness',
  },
  '950691': {
    description: 'Articles and equipment for general physical exercise, gymnastics or athletics',
    keywords: ['fitness equipment', 'pilates equipment', 'gymnastics equipment', 'athletic equipment', 'reformer', 'cadillac', 'pilates apparatus'],
    category: 'Pilates & Fitness',
  },
  '9506.91': {
    description: 'Articles and equipment for general physical exercise, gymnastics, athletics (Pilates, reformers)',
    keywords: ['pilates equipment', 'fitness equipment', 'reformer', 'cadillac', 'wunda chair', 'pilates apparatus', 'gymnastics equipment', 'athletic equipment', 'exercise machines'],
    category: 'Pilates Equipment',
  },
  
  // Adicionar mais conforme necessário
  '8517': {
    description: 'Telephone sets, including smartphones; other apparatus for transmission or reception',
    keywords: ['telecom equipment', 'smartphones', 'communication devices', 'networking equipment'],
    category: 'Telecommunications',
  },
  '6403': {
    description: 'Footwear with outer soles of rubber, plastics, leather or composition leather',
    keywords: ['footwear', 'shoes', 'boots', 'sneakers', 'athletic footwear'],
    category: 'Footwear',
  },
};

export interface HSCodeIntelligence {
  hsCode: string;
  description: string;
  keywords: string[];
  category: string;
  searchQueries: {
    apollo: string[];
    serper: string[];
    linkedin: string[];
  };
}

/**
 * Identifica produto pelo HS Code e gera keywords inteligentes
 */
export function identifyProduct(hsCode: string): HSCodeIntelligence | null {
  // Normalizar HS Code (remover pontos, espaços)
  const normalized = hsCode.replace(/[.\s]/g, '');
  
  // Buscar correspondência exata
  if (HS_CODE_DATABASE[hsCode]) {
    return generateIntelligence(hsCode, HS_CODE_DATABASE[hsCode]);
  }
  
  // Buscar por 6 dígitos
  const six = normalized.substring(0, 6);
  if (HS_CODE_DATABASE[six]) {
    return generateIntelligence(hsCode, HS_CODE_DATABASE[six]);
  }
  
  // Buscar por 4 dígitos
  const four = normalized.substring(0, 4);
  if (HS_CODE_DATABASE[four]) {
    return generateIntelligence(hsCode, HS_CODE_DATABASE[four]);
  }
  
  // Não encontrado - buscar na API WCO (futuro)
  console.warn(`[HS] ⚠️ HS Code ${hsCode} não encontrado no database local`);
  return null;
}

/**
 * Gera intelligence completa para o produto
 */
function generateIntelligence(
  hsCode: string, 
  data: { description: string; keywords: string[]; category: string }
): HSCodeIntelligence {
  
  // Gerar queries Apollo (B2B focused)
  const apolloQueries = data.keywords.flatMap(kw => [
    `${kw} distributor`,
    `${kw} wholesaler`,
    `${kw} importer`,
  ]).slice(0, 8); // Top 8

  // Gerar queries Serper (Deep Web)
  const serperQueries = data.keywords.flatMap(kw => [
    `"${kw} distributor" -blog -news -studio`,
    `"${kw} importer" site:kompass.com OR site:europages.com`,
    `"${kw} wholesale" site:thomasnet.com OR site:tradekey.com`,
  ]).slice(0, 10); // Top 10

  // Gerar queries LinkedIn (Decision Makers)
  const linkedinQueries = data.keywords.flatMap(kw => [
    `("Procurement Manager" OR "Import Manager") AND "${kw}"`,
    `("CEO" OR "Business Development") AND "${kw}" AND (distributor OR importer)`,
  ]).slice(0, 5); // Top 5

  return {
    hsCode,
    description: data.description,
    keywords: data.keywords,
    category: data.category,
    searchQueries: {
      apollo: apolloQueries,
      serper: serperQueries,
      linkedin: linkedinQueries,
    },
  };
}

/**
 * Expandir database de HS Codes via API WCO
 * (Implementar quando necessário)
 */
export async function fetchHSCodeFromWCO(hsCode: string): Promise<HSCodeIntelligence | null> {
  // TODO: Integrar com WCO API ou outra fonte
  // Por enquanto, retornar null
  return null;
}

