/**
 * LANGUAGE NORMALIZER
 * 
 * Normaliza texto, keywords e contexto de uso para múltiplos idiomas
 * (PT / EN / idioma nativo do país) ANTES das buscas.
 * Resultados são sempre exibidos em português (denormalização).
 * 
 * 🔒 BLINDADO: Normalização multilíngue do Export Dealers (não alterar sem autorização)
 */

/**
 * Normaliza texto para comparação (lowercase + remove acentos + colapsa espaços)
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais (mantém letras, números, hífens, espaços)
    .replace(/\s+/g, ' ') // Colapsa espaços múltiplos
    .trim();
}

/**
 * Remove vazios, trim e remove duplicados
 */
export function uniqueNonEmpty(list: string[]): string[] {
  return Array.from(new Set(
    list
      .map(item => typeof item === 'string' ? item.trim() : String(item).trim())
      .filter(item => item.length > 0)
  ));
}

/**
 * Tradução básica de termos comuns (PT → EN → idioma nativo quando aplicável)
 * Para termos técnicos específicos, manter em inglês/idioma original
 */
const TRANSLATION_MAP: Record<string, { en: string; es?: string }> = {
  // Uso final - Pilates
  'equipamento pilates': { en: 'pilates equipment', es: 'equipamiento pilates' },
  'equipamento de pilates': { en: 'pilates equipment', es: 'equipamiento de pilates' },
  'aparelho pilates': { en: 'pilates apparatus', es: 'aparato pilates' },
  'máquina pilates': { en: 'pilates machine', es: 'máquina pilates' },
  'estúdio pilates': { en: 'pilates studio', es: 'estudio pilates' },
  'estudio pilates': { en: 'pilates studio', es: 'estudio pilates' },
  
  // Uso final - Construção
  'equipamento construção': { en: 'construction equipment', es: 'equipamiento construcción' },
  'máquina construção': { en: 'construction machinery', es: 'maquinaria construcción' },
  'ferramenta industrial': { en: 'industrial tool', es: 'herramienta industrial' },
  
  // Uso final - Aviação
  'equipamento aviação': { en: 'aviation equipment', es: 'equipamiento aviación' },
  'componente aeronáutico': { en: 'aerospace component', es: 'componente aeronáutico' },
  
  // Uso final - Agronegócio
  'equipamento agrícola': { en: 'agricultural equipment', es: 'equipamiento agrícola' },
  'máquina agrícola': { en: 'farm machinery', es: 'maquinaria agrícola' },
  
  // Exclusões comuns
  'uso doméstico': { en: 'home use', es: 'uso doméstico' },
  'uso pessoal': { en: 'personal use', es: 'uso personal' },
  'hobby': { en: 'hobby', es: 'hobby' },
  'varejo': { en: 'retail', es: 'retail' },
  'consumidor final': { en: 'end consumer', es: 'consumidor final' },
};

/**
 * Normaliza keywords para múltiplos idiomas (PT / EN / idioma nativo)
 */
export function normalizeKeywords(
  keywords: string[], 
  targetLanguages: ('pt' | 'en' | 'native')[] = ['pt', 'en']
): string[] {
  const normalized = new Set<string>();
  
  keywords.forEach(keyword => {
    const trimmed = keyword.trim();
    if (!trimmed || trimmed.length === 0) return;
    
    // Normalizar keyword original
    const normalizedOriginal = normalizeText(trimmed);
    normalized.add(normalizedOriginal);
    
    // Tentar tradução se disponível
    const translation = TRANSLATION_MAP[trimmed.toLowerCase()];
    if (translation) {
      if (targetLanguages.includes('en')) {
        normalized.add(normalizeText(translation.en));
      }
      if (targetLanguages.includes('native') && translation.es) {
        normalized.add(normalizeText(translation.es));
      }
    }
    
    // Se não houver tradução, manter original normalizado
    // (termos técnicos geralmente são em inglês mesmo)
  });
  
  return Array.from(normalized).filter(k => k && k.length > 0);
}

/**
 * Interface para contexto de uso final
 */
export interface UsageContext {
  include: string[]; // Termos que DEFINEM o uso final (obrigatório - pelo menos 1)
  exclude: string[]; // Termos que INVALIDAM o uso (bloqueio - qualquer um)
}

/**
 * Normaliza contexto de uso final para múltiplos idiomas
 */
export function normalizeUsageContext(
  usageContext: UsageContext,
  targetLanguages: ('pt' | 'en' | 'native')[] = ['pt', 'en']
): UsageContext {
  return {
    include: normalizeKeywords(usageContext.include, targetLanguages),
    exclude: normalizeKeywords(usageContext.exclude, targetLanguages),
  };
}

/**
 * Denormaliza texto de volta para português (para exibição)
 * Se não houver correspondência, retorna original
 */
export function denormalizeText(text: string): string {
  // Buscar na tradução reversa (EN → PT)
  for (const [pt, translations] of Object.entries(TRANSLATION_MAP)) {
    if (normalizeText(text) === normalizeText(translations.en)) {
      return pt;
    }
    if (translations.es && normalizeText(text) === normalizeText(translations.es)) {
      return pt;
    }
  }
  
  // Se não encontrou tradução, retornar original (pode ser termo técnico)
  return text;
}
