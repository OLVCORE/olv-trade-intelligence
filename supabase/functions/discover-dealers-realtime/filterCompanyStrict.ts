/**
 * FILTER COMPANY STRICT
 * 
 * Filtro robusto e rigoroso para validar empresas B2B,
 * bloqueando marketplaces, e-commerce e empresas B2C.
 * 
 * Este módulo consolida toda a lógica de validação em uma única função
 * para garantir consistência e manutenibilidade.
 */

interface Company {
  name?: string;
  website?: string;
  description?: string;
  country?: string;
  b2b_type?: string;
  source?: string;
  [key: string]: any;
}

interface FilterContext {
  requiredKeywords?: string[]; // Keywords normalizadas obrigatórias
  allowedCountryVariations?: string[]; // Variações de países válidos (normalizadas)
  includeTermsB2B?: string[]; // Termos B2B obrigatórios
  excludeTermsB2C?: string[]; // Termos B2C para bloquear
  hsCode?: string; // HS Code (opcional, mas se fornecido, validar)
}

/**
 * Normaliza texto para comparação (lowercase + remove acentos)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Lista de marketplaces/portais B2B bloqueados
 */
const BLOCKED_DOMAINS = [
  'alibaba.com', 'globalsources.com', 'made-in-china.com', 'dhgate.com',
  'indiamart.com', 'tradeindia.com', 'thomasnet.com', 'kompass.com',
  'europages.com', 'werliefertwas.de', 'industrystock.com', 'ec21.com',
  'hktdc.com', 'tradekey.com', 'exporthub.com', 'tradeatlas.com',
  'go4worldbusiness.com', 'eworldtrade.com', 'tradewheel.com',
  'manufacturer.com', 'supplymedirect.com', 'wholesalecentral.com',
  'ecplaza.net', 'b2brazil.com', 'mercateo.com', 'solostocks.com',
  'africatrade.com', 'latintrade.com', 'middleeastb2b.com', 'china.cn',
  'tradeford.com', 'bizvibe.com', 'yellowpages.com', 'hotfrog.com',
  'crunchbase.com', 'zoominfo.com',
  'amazon.com', 'ebay.com', 'aliexpress.com', 'faire.com', 'etsy.com',
  'falabella.com', 'compumarket.com.py', 'mercado-livre.com',
  'mercadolivre.com.br', 'mercadolibre.com', 'linio.com', 'ripley.com',
  'oechsle.com', 'saga.com.pe', 'sodimac.com', 'fravega.com',
  'garbarino.com', 'alkosto.com', 'alkomprar.com', 'liverpool.com.mx',
  'coppel.com', 'americanas.com.br', 'casas-bahia.com.br',
];

const BLOCKED_URL_PATHS = [
  '/product', '/products', '/produto', '/produtos', '/shop', '/store',
  '/tienda', '/tiendas', '/cart', '/carrinho', '/checkout', '/category',
  '/categoria', '/sku', '/item', '/itm', '/p/', '/dp/', '/listing',
];

const BLOCKED_TEXT_PATTERNS = [
  'add to cart', 'buy now', 'price', 'shipping', 'frete', 'parcelamento',
  'checkout', 'carrinho', 'promo', 'oferta', 'descuento', 'cupom',
];

const B2B_TERMS = [
  'distributor', 'wholesaler', 'dealer', 'importer', 'trading company',
  'supplier', 'reseller', 'agent', 'export', 'import', 'b2b', 'wholesale',
  'bulk', 'commercial', 'trade', 'industrial',
  'distribuidor', 'mayorista', 'importador', 'comerciante', 'proveedor',
  'atacadista', 'fornecedor', 'exportador',
];

const B2C_TERMS = [
  'fitness studio', 'pilates studio', 'yoga studio', 'gym', 'fitness center',
  'wellness center', 'personal training', 'personal trainer', 'spa',
  'rehabilitation center', 'physiotherapy',
  'estudio de pilates', 'gimnasio', 'centro de fitness', 'spa',
  'estúdio de pilates', 'academia', 'centro de bem estar',
];

/**
 * Extrai hostname de uma URL
 */
function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return url.toLowerCase().replace(/^www\./, '');
  }
}

/**
 * Valida se uma empresa passa por todos os critérios rigorosos
 */
export function filterCompanyStrict(company: Company, context: FilterContext): boolean {
  // R1: Website válido
  if (!company.website || typeof company.website !== 'string') {
    console.log(`[FILTER] 🚫 REJEITADO (sem website): ${company.name}`);
    return false;
  }

  const hostname = extractHostname(company.website);
  const urlLower = company.website.toLowerCase();
  const name = (company.name || '').toLowerCase();
  const description = (company.description || '').toLowerCase();
  const fullText = normalizeText(`${name} ${description} ${company.website}`);

  // R2: Bloquear domínios bloqueados
  if (BLOCKED_DOMAINS.some(blocked => hostname.includes(blocked))) {
    console.log(`[FILTER] 🚫 BLOQUEADO (domínio): ${company.name} (${company.website})`);
    return false;
  }

  // R2B: Bloquear padrões de URL
  if (BLOCKED_URL_PATHS.some(pattern => urlLower.includes(pattern))) {
    console.log(`[FILTER] 🚫 BLOQUEADO (URL pattern): ${company.name} (${company.website})`);
    return false;
  }

  // R3: Construir fullText normalizado (se houver scrapedText, incluir depois)
  // fullText já foi criado acima

  // R4: Bloquear B2C
  const isB2C = B2C_TERMS.some(term => {
    const normalizedTerm = normalizeText(term);
    return fullText.includes(normalizedTerm);
  });
  if (isB2C) {
    console.log(`[FILTER] 🚫 BLOQUEADO (B2C): ${company.name}`);
    return false;
  }

  // R5: EXIGIR B2B (deve conter pelo menos 1 termo B2B)
  const isB2B = B2B_TERMS.some(term => {
    const normalizedTerm = normalizeText(term);
    return fullText.includes(normalizedTerm);
  });
  if (!isB2B && context.includeTermsB2B && context.includeTermsB2B.length > 0) {
    console.log(`[FILTER] 🚫 REJEITADO (não é B2B): ${company.name}`);
    return false;
  }

  // R6: EXIGIR keyword obrigatória
  if (context.requiredKeywords && context.requiredKeywords.length > 0) {
    const hasKeyword = context.requiredKeywords.some(keyword => {
      const normalizedKeyword = normalizeText(keyword);
      // Aceitar palavra parcial quando keyword é HS code (números) ou tem hífen
      if (/^\d+$/.test(keyword) || keyword.includes('-')) {
        return fullText.includes(normalizedKeyword) || 
               fullText.includes(normalizedKeyword.replace(/-/g, ' '));
      }
      // Para keywords normais, buscar palavra completa (mas aceitar variações)
      return fullText.includes(normalizedKeyword) ||
             fullText.includes(normalizedKeyword.split(' ')[0]);
    });
    if (!hasKeyword) {
      console.log(`[FILTER] 🚫 REJEITADO (sem keywords): ${company.name} | keywords: ${context.requiredKeywords.join(', ')}`);
      return false;
    }
  }

  // R7: Validar país
  if (company.country && context.allowedCountryVariations && context.allowedCountryVariations.length > 0) {
    const normalizedCountry = normalizeText(company.country);
    const isValidCountry = context.allowedCountryVariations.some(allowed => {
      const normalizedAllowed = normalizeText(allowed);
      return normalizedCountry === normalizedAllowed ||
             normalizedCountry.includes(normalizedAllowed) ||
             normalizedAllowed.includes(normalizedCountry);
    });
    if (!isValidCountry) {
      console.log(`[FILTER] 🚫 REJEITADO (país inválido): ${company.name} | país: ${company.country}`);
      return false;
    }
  }

  // R8: Bloquear sinais de e-commerce no texto
  const hasEcommerceSignal = BLOCKED_TEXT_PATTERNS.some(pattern => {
    const normalizedPattern = normalizeText(pattern);
    return fullText.includes(normalizedPattern);
  });
  if (hasEcommerceSignal) {
    console.log(`[FILTER] 🚫 BLOQUEADO (e-commerce signal): ${company.name}`);
    return false;
  }

  // R9: Aprovado
  return true;
}
