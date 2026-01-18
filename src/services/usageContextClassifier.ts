/**
 * USAGE CONTEXT CLASSIFIER
 * 
 * Valida INTENÇÃO DE USO FINAL do produto.
 * Esta é a CAMADA CRÍTICA que define:
 * - PARA QUE o produto é usado
 * - EM QUE cadeia produtiva ele entra
 * - QUEM compra (tipo de empresa)
 * - O QUE deve ser EXCLUÍDO mesmo sendo B2B
 * 
 * 🚨 SEM USO FINAL VALIDADO, A BUSCA NÃO É EXECUTADA
 */

import { normalizeText, type UsageContext } from './languageNormalizer';

/**
 * Verifica se o texto contém pelo menos 1 termo de uso final obrigatório
 */
export function hasRequiredUsageContext(text: string, includeTerms: string[]): boolean {
  if (!includeTerms || includeTerms.length === 0) {
    // Se não houver termos de uso final, não pode validar
    return false;
  }
  
  const normalizedText = normalizeText(text);
  
  // Verificar se contém pelo menos 1 termo de uso final
  return includeTerms.some(term => {
    const normalizedTerm = normalizeText(term);
    
    // Busca exata ou parcial (palavra completa dentro do texto)
    return normalizedText.includes(normalizedTerm) ||
           normalizedText.includes(` ${normalizedTerm} `) ||
           normalizedText.startsWith(`${normalizedTerm} `) ||
           normalizedText.endsWith(` ${normalizedTerm}`);
  });
}

/**
 * Verifica se o texto contém qualquer termo de uso final excluído
 */
export function hasExcludedUsageContext(text: string, excludeTerms: string[]): boolean {
  if (!excludeTerms || excludeTerms.length === 0) {
    // Se não houver termos excluídos, não há bloqueio
    return false;
  }
  
  const normalizedText = normalizeText(text);
  
  // Verificar se contém QUALQUER termo excluído (bloqueio)
  return excludeTerms.some(term => {
    const normalizedTerm = normalizeText(term);
    
    // Busca exata ou parcial (palavra completa dentro do texto)
    return normalizedText.includes(normalizedTerm) ||
           normalizedText.includes(` ${normalizedTerm} `) ||
           normalizedText.startsWith(`${normalizedTerm} `) ||
           normalizedText.endsWith(` ${normalizedTerm}`);
  });
}

/**
 * Valida contexto de uso final completo
 * Retorna true apenas se:
 * - Contém pelo menos 1 termo de include
 * - NÃO contém nenhum termo de exclude
 */
export function validateUsageContext(
  text: string,
  usageContext: UsageContext
): { valid: boolean; reason?: string } {
  // Verificar se tem termos de uso final obrigatórios
  if (!usageContext.include || usageContext.include.length === 0) {
    return {
      valid: false,
      reason: 'Uso final não especificado (include terms vazio)'
    };
  }
  
  // Verificar se contém termo obrigatório
  if (!hasRequiredUsageContext(text, usageContext.include)) {
    return {
      valid: false,
      reason: `Não contém uso final obrigatório: ${usageContext.include.join(', ')}`
    };
  }
  
  // Verificar se contém termo excluído
  if (hasExcludedUsageContext(text, usageContext.exclude || [])) {
    return {
      valid: false,
      reason: `Contém uso final excluído: ${usageContext.exclude?.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Calcula score de uso final (0-100)
 * +30 se uso final validado
 * -40 se uso final excluído encontrado
 */
export function calculateUsageContextScore(
  text: string,
  usageContext: UsageContext
): number {
  let score = 0;
  
  // Bônus se contém uso final obrigatório
  if (hasRequiredUsageContext(text, usageContext.include)) {
    score += 30;
  }
  
  // Penalidade se contém uso excluído
  if (hasExcludedUsageContext(text, usageContext.exclude || [])) {
    score -= 40;
  }
  
  return score;
}
