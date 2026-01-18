/**
 * CORE TERMS DICTIONARY
 * 
 * Dicionários mínimos multilíngues (PT/EN/ES) para termos críticos.
 * 
 * ⚠️ NÃO inventar conteúdo — apenas termos fixos e verificáveis.
 * ⚠️ NÃO criar placeholders — se não souber tradução, deixar em inglês.
 * 
 * Uso: Expansão multilíngue de keywords/uso final ANTES da busca.
 */

// ============================================================================
// TERMOS B2B (INCLUIR)
// ============================================================================

export const B2B_TERMS: Record<string, { en: string; es: string; pt: string }> = {
  // Core B2B types
  'distributor': { en: 'distributor', es: 'distribuidor', pt: 'distribuidor' },
  'distribuidor': { en: 'distributor', es: 'distribuidor', pt: 'distribuidor' },
  'wholesaler': { en: 'wholesaler', es: 'mayorista', pt: 'atacadista' },
  'mayorista': { en: 'wholesaler', es: 'mayorista', pt: 'atacadista' },
  'atacadista': { en: 'wholesaler', es: 'mayorista', pt: 'atacadista' },
  'dealer': { en: 'dealer', es: 'concesionario', pt: 'revendedor' },
  'revendedor': { en: 'dealer', es: 'concesionario', pt: 'revendedor' },
  'importer': { en: 'importer', es: 'importador', pt: 'importador' },
  'importador': { en: 'importer', es: 'importador', pt: 'importador' },
  'trading company': { en: 'trading company', es: 'empresa comercial', pt: 'empresa comercial' },
  'empresa comercial': { en: 'trading company', es: 'empresa comercial', pt: 'empresa comercial' },
  'supplier': { en: 'supplier', es: 'proveedor', pt: 'fornecedor' },
  'proveedor': { en: 'supplier', es: 'proveedor', pt: 'fornecedor' },
  'fornecedor': { en: 'supplier', es: 'proveedor', pt: 'fornecedor' },
  'reseller': { en: 'reseller', es: 'revendedor', pt: 'revendedor' },
  'agent': { en: 'agent', es: 'agente', pt: 'agente' },
  'agente': { en: 'agent', es: 'agente', pt: 'agente' },
  'broker': { en: 'broker', es: 'corredor', pt: 'corretor' },
  'corretor': { en: 'broker', es: 'corredor', pt: 'corretor' },
  
  // Commercial terms
  'export': { en: 'export', es: 'exportacion', pt: 'exportacao' },
  'exportacao': { en: 'export', es: 'exportacion', pt: 'exportacao' },
  'exportacion': { en: 'export', es: 'exportacion', pt: 'exportacao' },
  'import': { en: 'import', es: 'importacion', pt: 'importacao' },
  'importacao': { en: 'import', es: 'importacion', pt: 'importacao' },
  'importacion': { en: 'import', es: 'importacion', pt: 'importacao' },
  'b2b': { en: 'b2b', es: 'b2b', pt: 'b2b' },
  'wholesale': { en: 'wholesale', es: 'mayoreo', pt: 'atacado' },
  'atacado': { en: 'wholesale', es: 'mayoreo', pt: 'atacado' },
  'mayoreo': { en: 'wholesale', es: 'mayoreo', pt: 'atacado' },
  'bulk': { en: 'bulk', es: 'mayoreo', pt: 'granel' },
  'commercial': { en: 'commercial', es: 'comercial', pt: 'comercial' },
  'comercial': { en: 'commercial', es: 'comercial', pt: 'comercial' },
  'trade': { en: 'trade', es: 'comercio', pt: 'comercio' },
  'comercio': { en: 'trade', es: 'comercio', pt: 'comercio' },
  'industrial': { en: 'industrial', es: 'industrial', pt: 'industrial' },
};

// ============================================================================
// TERMOS B2C (EXCLUIR)
// ============================================================================

export const B2C_TERMS: Record<string, { en: string; es: string; pt: string }> = {
  // Fitness/Wellness B2C
  'fitness studio': { en: 'fitness studio', es: 'estudio fitness', pt: 'estudio fitness' },
  'estudio fitness': { en: 'fitness studio', es: 'estudio fitness', pt: 'estudio fitness' },
  'gym': { en: 'gym', es: 'gimnasio', pt: 'academia' },
  'academia': { en: 'gym', es: 'gimnasio', pt: 'academia' },
  'gimnasio': { en: 'gym', es: 'gimnasio', pt: 'academia' },
  'wellness center': { en: 'wellness center', es: 'centro bienestar', pt: 'centro bem-estar' },
  'centro bienestar': { en: 'wellness center', es: 'centro bienestar', pt: 'centro bem-estar' },
  'personal training': { en: 'personal training', es: 'entrenamiento personal', pt: 'treinamento pessoal' },
  'treinamento pessoal': { en: 'personal training', es: 'entrenamiento personal', pt: 'treinamento pessoal' },
  'yoga studio': { en: 'yoga studio', es: 'estudio yoga', pt: 'estudio yoga' },
  'estudio yoga': { en: 'yoga studio', es: 'estudio yoga', pt: 'estudio yoga' },
  'spa': { en: 'spa', es: 'spa', pt: 'spa' },
  'rehabilitation center': { en: 'rehabilitation center', es: 'centro rehabilitacion', pt: 'centro reabilitacao' },
  'centro rehabilitacion': { en: 'rehabilitation center', es: 'centro rehabilitacion', pt: 'centro reabilitacao' },
  'physiotherapy': { en: 'physiotherapy', es: 'fisioterapia', pt: 'fisioterapia' },
  'fisioterapia': { en: 'physiotherapy', es: 'fisioterapia', pt: 'fisioterapia' },
  
  // Retail terms
  'retail': { en: 'retail', es: 'venta al por menor', pt: 'varejo' },
  'varejo': { en: 'retail', es: 'venta al por menor', pt: 'varejo' },
  'venta al por menor': { en: 'retail', es: 'venta al por menor', pt: 'varejo' },
  'store': { en: 'store', es: 'tienda', pt: 'loja' },
  'loja': { en: 'store', es: 'tienda', pt: 'loja' },
  'tienda': { en: 'store', es: 'tienda', pt: 'loja' },
  'end consumer': { en: 'end consumer', es: 'consumidor final', pt: 'consumidor final' },
  'consumidor final': { en: 'end consumer', es: 'consumidor final', pt: 'consumidor final' },
};

// ============================================================================
// TERMOS E-COMMERCE (BLOQUEAR)
// ============================================================================

export const ECOMMERCE_TERMS: Record<string, { en: string; es: string; pt: string }> = {
  // Shopping actions
  'buy now': { en: 'buy now', es: 'comprar ahora', pt: 'comprar agora' },
  'comprar agora': { en: 'buy now', es: 'comprar ahora', pt: 'comprar agora' },
  'add to cart': { en: 'add to cart', es: 'agregar carrito', pt: 'adicionar carrinho' },
  'agregar carrito': { en: 'add to cart', es: 'agregar carrito', pt: 'adicionar carrinho' },
  'adicionar carrinho': { en: 'add to cart', es: 'agregar carrito', pt: 'adicionar carrinho' },
  'checkout': { en: 'checkout', es: 'pagar', pt: 'finalizar compra' },
  'pagar': { en: 'checkout', es: 'pagar', pt: 'finalizar compra' },
  'finalizar compra': { en: 'checkout', es: 'pagar', pt: 'finalizar compra' },
  'cart': { en: 'cart', es: 'carrito', pt: 'carrinho' },
  'carrito': { en: 'cart', es: 'carrito', pt: 'carrinho' },
  'carrinho': { en: 'cart', es: 'carrito', pt: 'carrinho' },
  'price': { en: 'price', es: 'precio', pt: 'preco' },
  'preco': { en: 'price', es: 'precio', pt: 'preco' },
  'precio': { en: 'price', es: 'precio', pt: 'preco' },
  'shipping': { en: 'shipping', es: 'envio', pt: 'frete' },
  'frete': { en: 'shipping', es: 'envio', pt: 'frete' },
  'envio': { en: 'shipping', es: 'envio', pt: 'frete' },
  'parcelamento': { en: 'installments', es: 'cuotas', pt: 'parcelamento' },
  'cuotas': { en: 'installments', es: 'cuotas', pt: 'parcelamento' },
  'promo': { en: 'promo', es: 'promocion', pt: 'promocao' },
  'promocao': { en: 'promo', es: 'promocion', pt: 'promocao' },
  'promocion': { en: 'promo', es: 'promocion', pt: 'promocao' },
  'oferta': { en: 'offer', es: 'oferta', pt: 'oferta' },
};

// ============================================================================
// TERMOS DATA SOURCE / DIRECTORY (BLOQUEAR)
// ============================================================================

export const DATASOURCE_TERMS: Record<string, { en: string; es: string; pt: string }> = {
  // Data source signals
  'shipment data': { en: 'shipment data', es: 'datos embarque', pt: 'dados embarque' },
  'datos embarque': { en: 'shipment data', es: 'datos embarque', pt: 'dados embarque' },
  'dados embarque': { en: 'shipment data', es: 'datos embarque', pt: 'dados embarque' },
  'customs records': { en: 'customs records', es: 'registros aduaneros', pt: 'registros alfandegarios' },
  'registros aduaneros': { en: 'customs records', es: 'registros aduaneros', pt: 'registros alfandegarios' },
  'registros alfandegarios': { en: 'customs records', es: 'registros aduaneros', pt: 'registros alfandegarios' },
  'see full importer history': { en: 'see full importer history', es: 'ver historial importador', pt: 'ver historico importador' },
  'ver historial importador': { en: 'see full importer history', es: 'ver historial importador', pt: 'ver historico importador' },
  'ver historico importador': { en: 'see full importer history', es: 'ver historial importador', pt: 'ver historico importador' },
  'sitemap': { en: 'sitemap', es: 'sitemap', pt: 'sitemap' },
  'directory': { en: 'directory', es: 'directorio', pt: 'diretorio' },
  'directorio': { en: 'directory', es: 'directorio', pt: 'diretorio' },
  'diretorio': { en: 'directory', es: 'directorio', pt: 'diretorio' },
  'importer database': { en: 'importer database', es: 'base datos importadores', pt: 'base dados importadores' },
  'base datos importadores': { en: 'importer database', es: 'base datos importadores', pt: 'base dados importadores' },
  'base dados importadores': { en: 'importer database', es: 'base datos importadores', pt: 'base dados importadores' },
  'trade data': { en: 'trade data', es: 'datos comercio', pt: 'dados comercio' },
  'datos comercio': { en: 'trade data', es: 'datos comercio', pt: 'dados comercio' },
  'dados comercio': { en: 'trade data', es: 'datos comercio', pt: 'dados comercio' },
  'import statistics': { en: 'import statistics', es: 'estadisticas importacion', pt: 'estatisticas importacao' },
  'estadisticas importacion': { en: 'import statistics', es: 'estadisticas importacion', pt: 'estatisticas importacao' },
  'estatisticas importacao': { en: 'import statistics', es: 'estadisticas importacion', pt: 'estatisticas importacao' },
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Expande um termo para múltiplos idiomas
 */
export function expandTerm(term: string, languages: ('pt' | 'en' | 'es')[] = ['pt', 'en', 'es']): string[] {
  const normalized = term.toLowerCase().trim();
  const expanded = new Set<string>();
  
  // Tentar encontrar em cada dicionário
  for (const dict of [B2B_TERMS, B2C_TERMS, ECOMMERCE_TERMS, DATASOURCE_TERMS]) {
    if (dict[normalized]) {
      const entry = dict[normalized];
      if (languages.includes('pt')) expanded.add(entry.pt);
      if (languages.includes('en')) expanded.add(entry.en);
      if (languages.includes('es')) expanded.add(entry.es);
      break;
    }
  }
  
  // Se não encontrou tradução, manter original
  if (expanded.size === 0) {
    expanded.add(normalized);
  }
  
  return Array.from(expanded);
}

/**
 * Verifica se um termo está em algum dicionário
 */
export function isKnownTerm(term: string): boolean {
  const normalized = term.toLowerCase().trim();
  return !!(
    B2B_TERMS[normalized] ||
    B2C_TERMS[normalized] ||
    ECOMMERCE_TERMS[normalized] ||
    DATASOURCE_TERMS[normalized]
  );
}
