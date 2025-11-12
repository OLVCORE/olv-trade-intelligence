/**
 * HS CODES DATABASE
 * Fonte: WCO Harmonized System (10.000+ códigos)
 * 
 * Aqui estão os códigos mais comuns para exportação.
 * Database completo pode ser expandido conforme necessário.
 */

export interface HSCode {
  code: string;
  description: string;
  category: string;
  keywords: string[];
}

export const HS_CODES_DATABASE: HSCode[] = [
  // CAPÍTULO 95: BRINQUEDOS, JOGOS, ARTIGOS PARA ESPORTE
  {
    code: '9506.91',
    description: 'Equipamentos de Pilates, ginástica e atletismo',
    category: 'Equipamentos Fitness',
    keywords: ['pilates', 'fitness', 'reformer', 'cadillac', 'ginástica', 'atletismo'],
  },
  {
    code: '9506.99',
    description: 'Outros artigos para esporte e atletismo',
    category: 'Equipamentos Esportivos',
    keywords: ['sports', 'athletic', 'equipment', 'acessórios esportivos'],
  },
  {
    code: '9506.11',
    description: 'Esquis',
    category: 'Esportes de Inverno',
    keywords: ['ski', 'esqui', 'winter sports'],
  },
  {
    code: '9506.12',
    description: 'Fixações para esquis',
    category: 'Acessórios Esporte',
    keywords: ['ski bindings', 'fixações esqui'],
  },
  {
    code: '9506.31',
    description: 'Tacos de golfe completos',
    category: 'Golfe',
    keywords: ['golf', 'tacos', 'golf clubs'],
  },
  {
    code: '9506.40',
    description: 'Artigos para tênis de mesa',
    category: 'Esportes Indoor',
    keywords: ['ping pong', 'table tennis', 'tênis de mesa'],
  },
  {
    code: '9506.51',
    description: 'Raquetes de tênis',
    category: 'Tênis',
    keywords: ['tennis', 'racket', 'raquete'],
  },
  {
    code: '9506.61',
    description: 'Bolas de tênis',
    category: 'Tênis',
    keywords: ['tennis ball', 'bola tênis'],
  },
  {
    code: '9506.62',
    description: 'Bolas infláveis (futebol, basquete, vôlei)',
    category: 'Bolas Esportivas',
    keywords: ['football', 'basketball', 'volleyball', 'soccer'],
  },
  {
    code: '9506.70',
    description: 'Patins de gelo e patins de rodas',
    category: 'Patinação',
    keywords: ['skates', 'rollerblades', 'patins'],
  },

  // CAPÍTULO 94: MÓVEIS E MOBILIÁRIO
  {
    code: '9403.60',
    description: 'Outros móveis de madeira',
    category: 'Móveis',
    keywords: ['furniture', 'móveis', 'madeira', 'wood'],
  },
  {
    code: '9403.70',
    description: 'Móveis de plástico',
    category: 'Móveis',
    keywords: ['plastic furniture', 'móveis plástico'],
  },
  {
    code: '9403.20',
    description: 'Outros móveis de metal',
    category: 'Móveis',
    keywords: ['metal furniture', 'móveis metálicos'],
  },

  // CAPÍTULO 64: CALÇADOS
  {
    code: '6403.99',
    description: 'Calçados esportivos e casuais',
    category: 'Calçados',
    keywords: ['footwear', 'shoes', 'sneakers', 'calçados'],
  },
  {
    code: '6402.99',
    description: 'Outros calçados com sola de borracha ou plástico',
    category: 'Calçados',
    keywords: ['shoes', 'footwear', 'rubber sole'],
  },

  // CAPÍTULO 85: MÁQUINAS E APARELHOS ELÉTRICOS
  {
    code: '8517.62',
    description: 'Aparelhos para telecomunicações',
    category: 'Eletrônicos',
    keywords: ['telecom', 'telecommunications', 'networking'],
  },
  {
    code: '8517.12',
    description: 'Telefones para redes celulares ou sem fio',
    category: 'Eletrônicos',
    keywords: ['smartphones', 'cell phones', 'mobile'],
  },
  {
    code: '8528.72',
    description: 'Outros aparelhos receptores de televisão',
    category: 'Eletrônicos',
    keywords: ['tv', 'television', 'display'],
  },

  // CAPÍTULO 84: REATORES NUCLEARES, CALDEIRAS, MÁQUINAS
  {
    code: '8471.30',
    description: 'Máquinas automáticas para processamento de dados portáteis',
    category: 'Informática',
    keywords: ['laptops', 'notebooks', 'portable computers'],
  },
  {
    code: '8471.49',
    description: 'Outros sistemas de processamento de dados',
    category: 'Informática',
    keywords: ['computers', 'desktop', 'servers'],
  },

  // CAPÍTULO 61: VESTUÁRIO E ACESSÓRIOS DE MALHA
  {
    code: '6109.10',
    description: 'Camisetas (T-shirts) de algodão',
    category: 'Vestuário',
    keywords: ['t-shirts', 'camisetas', 'apparel'],
  },
  {
    code: '6110.20',
    description: 'Suéteres de algodão ou fibras sintéticas',
    category: 'Vestuário',
    keywords: ['sweaters', 'pullovers', 'suéteres'],
  },

  // CAPÍTULO 73: OBRAS DE FERRO OU AÇO
  {
    code: '7308.90',
    description: 'Outras estruturas de ferro ou aço',
    category: 'Estruturas Metálicas',
    keywords: ['steel structures', 'iron', 'metal'],
  },

  // CAPÍTULO 90: INSTRUMENTOS E APARELHOS MÉDICOS
  {
    code: '9018.90',
    description: 'Outros instrumentos e aparelhos para medicina',
    category: 'Equipamentos Médicos',
    keywords: ['medical devices', 'healthcare', 'hospital equipment'],
  },
  {
    code: '9019.10',
    description: 'Aparelhos de massagem',
    category: 'Wellness',
    keywords: ['massage', 'massagem', 'wellness'],
  },

  // CAPÍTULO 39: PLÁSTICOS E SUAS OBRAS
  {
    code: '3926.90',
    description: 'Outras obras de plástico',
    category: 'Plásticos',
    keywords: ['plastic products', 'plástico'],
  },

  // CAPÍTULO 87: VEÍCULOS AUTOMÓVEIS
  {
    code: '8708.99',
    description: 'Outras partes de veículos automóveis',
    category: 'Auto Peças',
    keywords: ['auto parts', 'car parts', 'automotive'],
  },
];

/**
 * Buscar HS Code por termo (autocomplete)
 */
export function searchHSCodes(query: string): HSCode[] {
  const q = query.toLowerCase();
  
  return HS_CODES_DATABASE.filter(hs => {
    return (
      hs.code.includes(q) ||
      hs.description.toLowerCase().includes(q) ||
      hs.keywords.some(kw => kw.toLowerCase().includes(q))
    );
  }).slice(0, 10); // Top 10 resultados
}

/**
 * Obter HS Code exato
 */
export function getHSCode(code: string): HSCode | undefined {
  const normalized = code.replace(/[.\s]/g, '');
  return HS_CODES_DATABASE.find(hs => 
    hs.code.replace(/[.\s]/g, '') === normalized ||
    hs.code.replace(/[.\s]/g, '').startsWith(normalized)
  );
}

