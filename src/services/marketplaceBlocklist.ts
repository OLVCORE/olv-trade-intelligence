/**
 * MARKETPLACE BLOCKLIST
 * 
 * Lista curada dos maiores portais B2B/marketplaces globais para detecção,
 * bloqueio ou classificação automática de URLs ligadas a marketplaces,
 * mercados eletrônicos e hubs B2B.
 */

// Lista completa de marketplaces/portais B2B globais
export const BLOCKED_DOMAINS = [
  // Marketplaces globais principais
  'alibaba.com',
  'globalsources.com',
  'made-in-china.com',
  'dhgate.com',
  'indiamart.com',
  'tradeindia.com',
  'thomasnet.com',
  'kompass.com',
  'europages.com',
  'werliefertwas.de',
  'industrystock.com',
  'ec21.com',
  'hktdc.com',
  'tradekey.com',
  'exporthub.com',
  'tradeatlas.com',
  'go4worldbusiness.com',
  'eworldtrade.com',
  'tradewheel.com',
  'manufacturer.com',
  'supplymedirect.com',
  'wholesalecentral.com',
  'ecplaza.net',
  'b2brazil.com',
  'mercateo.com',
  'solostocks.com',
  'africatrade.com',
  'latintrade.com',
  'middleeastb2b.com',
  'china.cn',
  'tradeford.com',
  'bizvibe.com',
  'yellowpages.com',
  'hotfrog.com',
  'crunchbase.com',
  'zoominfo.com',
  // E-commerce global
  'amazon.com',
  'ebay.com',
  'aliexpress.com',
  'faire.com',
  'etsy.com',
  'wish.com',
  'banggood.com',
  'gearbest.com',
  'lightinthebox.com',
  // E-commerce latino-americano
  'falabella.com',
  'falabella.cl',
  'falabella.com.co',
  'falabella.com.pe',
  'compumarket.com.py',
  'compumarket.com',
  'mercado-livre.com',
  'mercadolivre.com.br',
  'mercadolibre.com',
  'linio.com',
  'linio.com.mx',
  'linio.com.co',
  'linio.com.pe',
  'ripley.com',
  'ripley.cl',
  'ripley.com.pe',
  'oechsle.com',
  'oechsle.com.pe',
  'saga.com.pe',
  'sodimac.com',
  'sodimac.cl',
  'sodimac.com.pe',
  'wong.com.pe',
  'metro.com.pe',
  'tottus.com.pe',
  'casaidea.com',
  'paris.cl',
  'lider.cl',
  'jumbo.cl',
  'fravega.com',
  'fravega.com.ar',
  'garbarino.com',
  'garbarino.com.ar',
  'almacenes-exito.com',
  'exito.com',
  'carulla.com',
  'carulla.com.co',
  'alkosto.com',
  'alkomprar.com',
  'k-tronix.com',
  'liverpool.com.mx',
  'palacio.com.mx',
  'el-palacio-de-hierro.com',
  'coppel.com',
  'coppel.com.mx',
  'coppel.com.ar',
  'magazine-luiza.com.br',
  'americanas.com.br',
  'submarino.com.br',
  'casas-bahia.com.br',
  'extra.com.br',
  'pontofrio.com.br',
  // Redes sociais (não são B2B)
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'twitter.com',
  'tiktok.com',
  'pinterest.com',
  'reddit.com',
  // Blogs e conteúdo genérico
  'blogspot.com',
  'wordpress.com',
  'medium.com',
  'tumblr.com',
  'wikipedia.org',
  'quora.com',
  'yelp.com',
  'tripadvisor.com',
];

// Padrões de host que indicam marketplace/e-commerce
export const BLOCKED_HOST_PATTERNS = [
  /\.marketplace\./i,
  /\.shop\./i,
  /\.store\./i,
  /marketplace-/i,
  /-marketplace/i,
  /ecommerce-/i,
  /-ecommerce/i,
];

// Padrões de URL path típicos de e-commerce
export const BLOCKED_URL_PATH_PATTERNS = [
  '/product',
  '/products',
  '/produto',
  '/produtos',
  '/producto',
  '/productos',
  '/shop',
  '/store',
  '/tienda',
  '/tiendas',
  '/loja',
  '/lojas',
  '/cart',
  '/carrinho',
  '/checkout',
  '/finalizar',
  '/category',
  '/categoria',
  '/categorias',
  '/cat',
  '/sku',
  '/item',
  '/itm',
  '/p/',
  '/dp/',
  '/listing',
  '/listings',
  '/showroom',
  '/factory',
  '/hot-china-products',
  '/posts',
  '/videos',
  '/groups',
  '/pages',
  '/people',
  '/p/',
];

// Termos no texto da página que indicam e-commerce
/**
 * Padrões de texto que indicam DATA SOURCE / DIRECTORY (BLOQUEAR TOTALMENTE)
 */
export const BLOCKED_DATASOURCE_SIGNALS = [
  'shipment data',
  'customs records',
  'see full importer history',
  'importer database',
  'trade data',
  'import statistics',
  'customs data',
  'shipment records',
  'importer directory',
  'trade directory',
  'sitemap',
  'xml sitemap',
  'html sitemap',
  'dados embarque',
  'registros alfandegarios',
  'ver historico importador',
  'base dados importadores',
  'estatisticas importacao',
];

export const BLOCKED_TEXT_PATTERNS = [
  'add to cart',
  'adicionar ao carrinho',
  'buy now',
  'comprar agora',
  'price',
  'precio',
  'preço',
  'shipping',
  'envío',
  'frete',
  'parcelamento',
  'parcelas',
  'checkout',
  'finalizar compra',
  'carrinho',
  'carrito',
  'promo',
  'promoción',
  'promoção',
  'oferta',
  'ofertas',
  'descuento',
  'desconto',
  'cupom',
  'cupón',
  'coupon',
  'discount',
];

/**
 * Normaliza texto para comparação (lowercase + remove acentos)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

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
 * Verifica se um domínio está bloqueado
 */
export function isBlockedDomain(urlOrHost: string): boolean {
  const hostname = extractHostname(urlOrHost);
  const normalized = normalizeText(hostname);
  
  // Verificar lista de domínios bloqueados
  if (BLOCKED_DOMAINS.some(blocked => normalized.includes(blocked) || hostname.includes(blocked))) {
    return true;
  }
  
  // Verificar padrões de host
  if (BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(hostname))) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se uma URL está bloqueada (domínio + path)
 */
export function isBlockedUrl(url: string): boolean {
  // Verificar domínio primeiro
  if (isBlockedDomain(url)) {
    return true;
  }
  
  // Verificar padrões de path
  const urlLower = url.toLowerCase();
  if (BLOCKED_URL_PATH_PATTERNS.some(pattern => urlLower.includes(pattern))) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se o texto contém sinais de e-commerce
 */
/**
 * Verifica se o texto contém sinais de DATA SOURCE / DIRECTORY
 */
export function hasDataSourceSignals(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return BLOCKED_DATASOURCE_SIGNALS.some(signal => {
    const normalizedSignal = signal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.includes(normalizedSignal);
  });
}

export function hasEcommerceSignals(text: string): boolean {
  const normalized = normalizeText(text);
  return BLOCKED_TEXT_PATTERNS.some(pattern => normalized.includes(pattern));
}
