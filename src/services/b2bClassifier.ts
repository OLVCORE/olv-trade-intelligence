/**
 * B2B CLASSIFIER
 * 
 * Classifica empresas como B2B (distribuidores, importadores) ou B2C
 * (estúdios, academias) para filtragem rigorosa no módulo Export Dealers.
 */

// Termos B2B obrigatórios (deve conter pelo menos 1)
export const includeTermsB2B = [
  // Inglês
  'distributor',
  'wholesaler',
  'dealer',
  'importer',
  'trading company',
  'trading co',
  'supplier',
  'reseller',
  'agent',
  'broker',
  'export',
  'import',
  'b2b',
  'wholesale',
  'bulk',
  'commercial',
  'trade',
  'industrial',
  // Espanhol
  'distribuidor',
  'distribuidora',
  'mayorista',
  'mayoreo',
  'importador',
  'importadora',
  'comerciante',
  'proveedor',
  'proveedora',
  'agente',
  'exportador',
  'comercial',
  'industrial',
  // Português
  'distribuidor',
  'distribuidora',
  'atacadista',
  'atacado',
  'importador',
  'importadora',
  'comerciante',
  'fornecedor',
  'fornecedora',
  'agente',
  'exportador',
  'comercial',
  'industrial',
  // Variações comuns
  'dist',
  'wholesale',
  'supply',
  'trading',
  'import export',
  'impex',
];

// Termos B2C para bloquear (se contém qualquer um, bloquear)
export const excludeTermsB2C = [
  // Inglês
  'fitness studio',
  'pilates studio',
  'yoga studio',
  'gym',
  'fitness center',
  'health club',
  'wellness center',
  'personal training',
  'personal trainer',
  'spa',
  'rehabilitation center',
  'physiotherapy',
  'physical therapy',
  'health club',
  'sports club',
  // Espanhol
  'estudio de pilates',
  'estudio pilates',
  'estudio de yoga',
  'estudio yoga',
  'gimnasio',
  'centro de fitness',
  'centro fitness',
  'centro de bienestar',
  'bienestar',
  'entrenamiento personal',
  'entrenador personal',
  'spa',
  'centro de rehabilitación',
  'fisioterapia',
  'clínica',
  // Português
  'estúdio de pilates',
  'estudio de pilates',
  'estúdio pilates',
  'estudio pilates',
  'estúdio de yoga',
  'estudio de yoga',
  'academia',
  'academia de ginástica',
  'centro de fitness',
  'centro fitness',
  'centro de bem estar',
  'bem estar',
  'personal trainer',
  'treinamento personalizado',
  'spa',
  'centro de reabilitação',
  'fisioterapia',
  'clínica',
  // Termos genéricos B2C
  'studio',
  'club',
  'center',
  'centro',
  'clinic',
  'clínica',
];

/**
 * Normaliza texto para comparação (lowercase + remove acentos)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Verifica se o texto indica uma empresa B2B (contém pelo menos 1 termo B2B)
 */
export function isB2BMatch(text: string): boolean {
  const normalized = normalizeText(text);
  
  // Verificar termos B2B (deve conter pelo menos 1)
  return includeTermsB2B.some(term => {
    const normalizedTerm = normalizeText(term);
    // Busca exata ou parcial (palavra completa dentro do texto)
    return normalized.includes(normalizedTerm) || 
           normalized.includes(` ${normalizedTerm} `) ||
           normalized.startsWith(`${normalizedTerm} `) ||
           normalized.endsWith(` ${normalizedTerm}`);
  });
}

/**
 * Verifica se o texto indica uma empresa B2C (contém qualquer termo B2C)
 */
export function isB2CMatch(text: string): boolean {
  const normalized = normalizeText(text);
  
  // Verificar termos B2C (se contém qualquer um, bloquear)
  return excludeTermsB2C.some(term => {
    const normalizedTerm = normalizeText(term);
    // Busca exata ou parcial (palavra completa dentro do texto)
    return normalized.includes(normalizedTerm) || 
           normalized.includes(` ${normalizedTerm} `) ||
           normalized.startsWith(`${normalizedTerm} `) ||
           normalized.endsWith(` ${normalizedTerm}`);
  });
}

/**
 * Verifica se o texto é claramente B2C (alta confiança)
 */
export function isClearlyB2C(text: string): boolean {
  const normalized = normalizeText(text);
  
  // Termos de alta confiança para B2C (mais específicos)
  const highConfidenceB2C = [
    'pilates studio',
    'yoga studio',
    'fitness studio',
    'personal training',
    'personal trainer',
    'gym / fitness center',
    'wellness center',
  ];
  
  return highConfidenceB2C.some(term => {
    const normalizedTerm = normalizeText(term);
    return normalized.includes(normalizedTerm);
  });
}
