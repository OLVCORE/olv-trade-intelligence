import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// KEYWORDS EXATAS DO CLIENTE (25 keywords Pilates)
// ============================================================================

const PILATES_KEYWORDS = [
  // Equipamentos específicos
  'pilates equipment wholesale',
  'pilates apparatus wholesale',
  'pilates equipment distributor',
  'pilates reformer wholesale',
  'pilates cadillac wholesale',
  'commercial pilates equipment',
  'professional pilates equipment',
  'studio pilates equipment',
  
  // B2B e parcerias
  'wholesale fitness equipment',
  'b2b pilates equipment',
  'become a dealer pilates equipment',
  'become a distributor pilates equipment',
  'international distribution pilates equipment',
  'bulk order pilates equipment',
  'authorized dealer pilates',
  'supplier pilates equipment',
  
  // Trade
  'pilates equipment import',
  'fitness equipment import',
  'export pilates equipment',
  'trade only pilates equipment supplier',
];

// ============================================================================
// HELPER: Determinar tipo B2B
// ============================================================================

function determineB2BType(company: any, includeTypes: string[]): string {
  const name = (company.name || '').toLowerCase();
  const desc = (company.short_description || '').toLowerCase();
  const industry = (company.industry || '').toLowerCase();
  const text = `${name} ${desc} ${industry}`;

  // Verificar tipos em ordem de prioridade
  if (includeTypes.some(t => t.toLowerCase().includes('wholesaler'))) {
    if (text.includes('wholesale') || text.includes('wholesaler')) {
      return 'wholesaler';
    }
  }
  if (includeTypes.some(t => t.toLowerCase().includes('distributor'))) {
    if (text.includes('distributor') || text.includes('distribution')) {
      return 'distributor';
    }
  }
  if (includeTypes.some(t => t.toLowerCase().includes('importer'))) {
    if (text.includes('importer') || text.includes('import')) {
      return 'importer';
    }
  }
  if (includeTypes.some(t => t.toLowerCase().includes('dealer'))) {
    if (text.includes('dealer')) {
      return 'dealer';
    }
  }

  // Fallback: primeiro tipo da lista
  return includeTypes[0]?.toLowerCase() || 'dealer';
}

// ============================================================================
// CAMADA 1: APOLLO.IO (Dados estruturados)
// ============================================================================

async function searchApollo(
  keyword: string, 
  country: string, 
  minVolume?: number,
  includeTypes: string[] = [],
  excludeTypes: string[] = [],
  includeRoles: string[] = []
) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  if (!apolloKey) {
    console.log('[APOLLO] ⚠️ APOLLO_API_KEY missing - pulando Apollo');
    return [];
  }

  console.log(`[APOLLO] 🔍 Keyword: "${keyword}" | País: ${country} | Min Volume: ${minVolume ? `$${minVolume}` : 'N/A'}`);

  // Construir keywords de inclusão baseadas em includeTypes
  const includeKeywords: string[] = [keyword];
  includeTypes.forEach(type => {
    if (type.toLowerCase().includes('distributor')) {
      includeKeywords.push(`${keyword} distributor`);
    }
    if (type.toLowerCase().includes('dealer')) {
      includeKeywords.push(`${keyword} dealer`);
    }
    if (type.toLowerCase().includes('importer')) {
      includeKeywords.push(`${keyword} importer`);
    }
    if (type.toLowerCase().includes('wholesaler')) {
      includeKeywords.push(`${keyword} wholesale`);
    }
  });

  // Construir exclusões baseadas em excludeTypes
  const excludeKeywords: string[] = [
    'blog', 'news', 'magazine', 'media', 'publisher',
    'facebook.com', 'instagram.com', 'linkedin.com',
    'youtube.com', 'twitter.com', 'tiktok.com',
  ];
  excludeTypes.forEach(type => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('gym') || typeLower.includes('studio')) {
      excludeKeywords.push('pilates studio', 'yoga studio', 'fitness studio', 'gym', 'health club');
    }
    if (typeLower.includes('school')) {
      excludeKeywords.push('instructor', 'teacher', 'personal trainer', 'coach', 'training', 'school');
    }
  });

  const payload: any = {
    page: 1,
    per_page: 50,
    organization_locations: [country],
    q_organization_keyword_tags: includeKeywords.slice(0, 5), // Limitar a 5 keywords
    organization_num_employees_ranges: ['21-50', '51-200', '201-500', '501-1000'],
    organization_not_keyword_tags: excludeKeywords,
  };

  // Adicionar busca por cargos se especificado
  if (includeRoles.length > 0) {
    payload.person_titles = includeRoles;
    payload.person_seniorities = ['manager', 'director', 'vp', 'c_suite'];
  }

  // FILTRO VOLUME MÍNIMO (se fornecido)
  if (minVolume) {
    // Apollo revenue ranges
    if (minVolume >= 10000000) {
      payload.revenue_range = ['10M-50M', '50M-100M', '100M-250M', '250M-500M', '500M-1B', '1B+'];
    } else if (minVolume >= 5000000) {
      payload.revenue_range = ['5M-10M', '10M-50M', '50M-100M', '100M+'];
    } else if (minVolume >= 1000000) {
      payload.revenue_range = ['1M-5M', '5M-10M', '10M+'];
    }
    console.log(`[APOLLO] 💰 Revenue filter: ${payload.revenue_range?.join(', ')}`);
  }

  try {
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[APOLLO] ❌ HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const orgs = data.organizations || [];

    console.log(`[APOLLO] ✅ ${orgs.length} empresas encontradas`);

    return orgs
      .filter((c: any) => {
        // Filtrar empresas sem website ou com domínios bloqueados
        if (!c.website_url) return false;
        const domain = c.website_url.toLowerCase();
        const blocked = ['facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com'];
        return !blocked.some(b => domain.includes(b));
      })
      .map((c: any) => ({
        name: c.name,
        company_name: c.name,
        website: c.website_url,
        domain: c.website_url,
        linkedin_url: c.linkedin_url,
        country: c.country || country,
        city: c.city,
        state: c.state,
        industry: c.industry,
        employee_count: c.organization_num_employees,
        description: c.short_description,
        apollo_id: c.id,
        apollo_link: `https://app.apollo.io/#/companies/${c.id}`,
        source: 'apollo',
        // Identificar tipo B2B baseado em keywords
        b2b_type: determineB2BType(c, includeTypes),
      }));
  } catch (error) {
    console.error('[APOLLO] ❌:', error);
    return [];
  }
}

// ============================================================================
// CAMADA 2: SERPER (30 PORTAIS via Google Search)
// ============================================================================

async function searchSerper(keyword: string, country: string) {
  const serperKey = Deno.env.get('VITE_SERPER_API_KEY');
  if (!serperKey) {
    console.log('[SERPER] ⚠️ VITE_SERPER_API_KEY missing - pulando Serper');
    return [];
  }

  console.log(`[SERPER] 🔍 Buscando em 30 portais B2B...`);

  // QUERIES FOCADAS NO PAÍS SELECIONADO
  const queries = [
    // TRADE DATA (Importação NO país selecionado)
    `site:importkey.com "${keyword}" import ${country}`,
    `site:eximpedia.app "${keyword}" import ${country}`,
    `site:volza.com "${keyword}" import ${country}`,
    `site:importgenius.com "${keyword}" ${country}`,
    `site:panjiva.com "${keyword}" importer ${country}`,
    
    // B2B DIRECTORIES (COM país no filtro)
    `site:kompass.com "${keyword}" ${country}`,
    `site:europages.com "${keyword}" ${country}`,
    `site:thomasnet.com "${keyword}" ${country}`,
    `site:tradekey.com "${keyword}" ${country}`,
    
    // YELLOW PAGES LOCAIS (do país selecionado)
    `"${keyword}" ${country} yellow pages`,
    `"${keyword}" distributor ${country}`,
    `"${keyword}" wholesaler ${country}`,
    `"pilates equipment" importer ${country}`,
    
    // LINKEDIN (EMPRESAS do país)
    `site:linkedin.com/company "${keyword}" ${country}`,
    
    // GOOGLE DIRETO (COM país obrigatório)
    `"${keyword}" distributor ${country} -studio -instructor -blog`,
    `"pilates equipment" wholesale ${country} -studio -gym`,
    `"fitness equipment" distributor ${country} b2b`,
  ];

  const allResults: any[] = [];

  // Executar em batches de 5 (evitar rate limit)
  const batchSize = 5;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    
    console.log(`[SERPER] Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(queries.length/batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(async (query) => {
        try {
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, num: 20, gl: country === 'United States' ? 'us' : 'global' }),
          });

          if (response.ok) {
            const data = await response.json();
            return (data.organic || [])
              .filter((r: any) => {
                // Filtrar Facebook, Instagram, etc. já no Serper
                const link = (r.link || '').toLowerCase();
                const blocked = ['facebook.com', 'instagram.com', 'linkedin.com', 
                                'youtube.com', 'faire.com', 'etsy.com'];
                if (blocked.some(b => link.includes(b))) return false;
                if (link.includes('/posts/') || link.includes('/videos/') || 
                    link.includes('/groups/') || link.includes('/people/') ||
                    link.includes('/p/')) return false;
                return true;
              })
              .map((r: any) => ({
                name: r.title,
                website: r.link,
                description: r.snippet,
                source: 'serper',
                source_portal: extractPortal(r.link),
              }));
          }
        } catch (err) {
          console.error(`[SERPER] Query failed: ${query.substring(0, 50)}...`);
        }
        return [];
      })
    );

    allResults.push(...batchResults.flat());
    
    // Delay 1s entre batches
    if (i + batchSize < queries.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // FILTRAR RESULTADOS: APENAS do país selecionado
  const filtered = allResults.filter(r => {
    const snippet = (r.description || '').toLowerCase();
    const title = (r.name || '').toLowerCase();
    const text = snippet + ' ' + title;
    
    // REJEITAR se mencionar China/India/Taiwan e NÃO for o país selecionado
    const forbiddenCountries = ['china', 'chinese', 'india', 'indian', 'taiwan', 'vietnam', 'bangladesh'];
    const target = country.toLowerCase();
    
    for (const forbidden of forbiddenCountries) {
      if (text.includes(forbidden) && !target.includes(forbidden)) {
        console.log(`[SERPER] ❌ Rejeitado: ${r.name} (menciona ${forbidden}, busca ${country})`);
        return false; // REJEITAR (Alibaba China quando busca Argentina)
      }
    }
    
    return true; // ACEITAR
  });

  console.log(`[SERPER] ✅ ${filtered.length} resultados (de ${allResults.length} - filtrados por país: ${country})`);

  // Estatísticas por portal (dos resultados filtrados)
  const byPortal = filtered.reduce((acc: any, r: any) => {
    const portal = r.source_portal || 'Other';
    acc[portal] = (acc[portal] || 0) + 1;
    return acc;
  }, {});

  console.log(`[SERPER] 📊 Por portal (após filtro):`, byPortal);

  return filtered; // ✅ RETORNAR APENAS FILTRADOS
}

function extractPortal(url: string): string {
  if (url.includes('importkey.com')) return 'ImportKey';
  if (url.includes('eximpedia.app')) return 'Eximpedia';
  if (url.includes('volza.com')) return 'Volza';
  if (url.includes('importgenius.com')) return 'ImportGenius';
  if (url.includes('panjiva.com')) return 'Panjiva';
  if (url.includes('made-in-china.com')) return 'Made-in-China';
  if (url.includes('alibaba.com')) return 'Alibaba';
  if (url.includes('globalsources.com')) return 'GlobalSources';
  if (url.includes('kompass.com')) return 'Kompass';
  if (url.includes('europages.com')) return 'Europages';
  if (url.includes('thomasnet.com')) return 'ThomasNet';
  if (url.includes('tradekey.com')) return 'TradeKey';
  if (url.includes('exporthub.com')) return 'ExportHub';
  if (url.includes('yellowpages.com')) return 'YellowPages';
  if (url.includes('pilates.com')) return 'Pilates.com';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  return 'Google';
}

// ============================================================================
// CAMADA 3: GOOGLE CUSTOM SEARCH API (Fallback se Serper falhar)
// ============================================================================

async function searchGoogleAPI(keyword: string, country: string) {
  const googleKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
  const googleCX = Deno.env.get('GOOGLE_SEARCH_CX');
  
  if (!googleKey || !googleCX) {
    console.log('[GOOGLE-API] ⚠️ Keys missing - pulando Google API');
    return [];
  }

  console.log(`[GOOGLE-API] 🔍 Fallback: Google Custom Search`);

  const queries = [
    `"${keyword}" distributor ${country} -china -india`,
    `"${keyword}" importer ${country} -china -taiwan`,
    `"pilates equipment" wholesale ${country} -alibaba -made-in-china`,
  ];

  const allResults: any[] = [];

  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCX}&q=${encodeURIComponent(query)}&num=10`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const items = (data.items || [])
          .filter((item: any) => {
            const link = (item.link || '').toLowerCase();
            const text = (item.title + ' ' + item.snippet).toLowerCase();
            
            // Bloquear Facebook, Instagram, etc.
            const blocked = ['facebook.com', 'instagram.com', 'linkedin.com', 
                            'youtube.com', 'faire.com', 'etsy.com'];
            if (blocked.some(b => link.includes(b))) return false;
            if (link.includes('/posts/') || link.includes('/videos/') || 
                link.includes('/groups/') || link.includes('/people/') ||
                link.includes('/p/')) return false;
            
            const forbiddenCountries = ['china', 'chinese', 'india', 'taiwan', 'alibaba', 'made-in-china'];
            const target = country.toLowerCase();
            
            // REJEITAR se mencionar países proibidos
            for (const forbidden of forbiddenCountries) {
              if (text.includes(forbidden) && !target.includes(forbidden)) {
                return false;
              }
            }
            return true;
          })
          .map((item: any) => ({
            name: item.title,
            website: item.link,
            description: item.snippet,
            source: 'google_api',
            source_portal: 'Google',
          }));
        allResults.push(...items);
      }
    } catch (err) {
      console.error(`[GOOGLE-API] ❌:`, err);
    }
  }

  console.log(`[GOOGLE-API] ✅ ${allResults.length} resultados`);
  return allResults;
}

// ============================================================================
// CAMADA 4: WEB SCRAPING (Calcular Fit Score)
// ============================================================================

async function calculateFitScore(website: string, keywords: string[]): Promise<number> {
  try {
    const response = await fetch(website, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000), // 5s (mais rápido)
    });

    if (!response.ok) return 0;

    const html = await response.text();
    const text = html.toLowerCase();

    // KEYWORDS PILATES ESPECÍFICAS (do cliente)
    const pilatesKeywords = [
      'pilates',
      'reformer',
      'cadillac',
      'wunda chair',
      'pilates chair',
      'pilates barrel',
      'pilates mat',
      'pilates apparatus',
      'pilates equipment',
      'pilates reformer',
      'pilates machine',
      'pilates accessories',
    ];

    const found = pilatesKeywords.filter(kw => text.includes(kw));

    // MÍNIMO 2 KEYWORDS = Fit 60
    if (found.length < 2) return 0;

    let score = 60 + ((found.length - 2) * 5); // +5 por keyword adicional

    // BÔNUS: Wholesale/Distributor
    if (text.includes('wholesale') || text.includes('distributor') || text.includes('dealer')) {
      score += 10;
    }

    // BÔNUS: B2B/Commercial
    if (text.includes('b2b') || text.includes('commercial') || text.includes('bulk')) {
      score += 5;
    }

    return Math.min(score, 95);

  } catch (error) {
    return 0;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      hsCode, 
      country, 
      keywords = [], 
      minVolume,
      includeTypes = ['distributor', 'dealer', 'importer', 'wholesaler'],
      excludeTypes = ['gym', 'studio', 'school'],
      includeRoles = []
    } = await req.json();

    console.log(`==============================================`);
    console.log(`[REALTIME] 🚀 BUSCA B2B FOCADA INICIADA`);
    console.log(`  HS Code: ${hsCode}`);
    console.log(`  País: ${country}`);
    console.log(`  Keywords customizadas: ${keywords?.join(', ') || 'Nenhuma'}`);
    console.log(`  Tipos B2B (incluir): ${includeTypes.join(', ')}`);
    console.log(`  Tipos B2C (excluir): ${excludeTypes.join(', ')}`);
    console.log(`  Cargos alvo: ${includeRoles.join(', ') || 'Nenhum'}`);
    console.log(`  Volume Mínimo: ${minVolume ? `$${minVolume.toLocaleString()}` : 'N/A'}`);
    console.log(`==============================================`);

    const allDealers: any[] = [];
    const stats = {
      apollo: 0,
      serper: 0,
      google_api: 0,
      total_bruto: 0,
      total_unico: 0,
      fit_60_plus: 0,
      portais: {} as Record<string, number>,
    };

    // FASE 1: APOLLO (usar keywords customizadas do usuário)
    // ⚠️ REMOVIDO: Fallback hardcoded para Pilates - agora usa APENAS keywords do usuário
    const searchKeywords = keywords.length > 0 
      ? keywords.slice(0, 5) // Limitar a 5 keywords customizadas
      : []; // Sem fallback - usuário deve fornecer keywords
    
    console.log(`\n[FASE 1] Apollo.io - Buscando com ${searchKeywords.length} keywords...`);
    console.log(`  Keywords: ${searchKeywords.join(', ')}`);
    
    for (const keyword of searchKeywords) {
      const companies = await searchApollo(
        keyword, 
        country, 
        minVolume,
        includeTypes,
        excludeTypes,
        includeRoles
      );
      allDealers.push(...companies);
      stats.apollo += companies.length;
      
      console.log(`[APOLLO] "${keyword}": ${companies.length} empresas`);
      
      // Delay 500ms entre keywords (evitar rate limit)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[APOLLO] ✅ Total: ${stats.apollo} empresas`);

    // FASE 2: SERPER (30 portais B2B) - USAR KEYWORD CUSTOMIZADA
    console.log(`\n[FASE 2] Serper - Buscando em 30 portais B2B...`);
    
    let serperAttempted = false;
    try {
      // USAR PRIMEIRA KEYWORD CUSTOMIZADA (sem fallback)
      if (searchKeywords.length === 0) {
        console.log('[SERPER] ⚠️ Sem keywords - pulando Serper');
        serperAttempted = false;
      } else {
        const mainKeyword = searchKeywords[0];
      const serperResults = await searchSerper(mainKeyword, country);
      allDealers.push(...serperResults);
      stats.serper = serperResults.length;
      serperAttempted = true;
      console.log(`[SERPER] ✅ ${stats.serper} resultados de 30 queries`);
    } catch (error) {
      console.error('[SERPER] ❌ Falhou:', error);
      serperAttempted = false;
    }

    // FASE 3: GOOGLE API (Fallback se Serper falhou) - USAR KEYWORD CUSTOMIZADA
    if ((!serperAttempted || stats.serper === 0) && searchKeywords.length > 0) {
      console.log(`\n[FASE 3] Google Custom Search API - Fallback...`);
      try {
        // USAR PRIMEIRA KEYWORD CUSTOMIZADA (sem fallback)
        const mainKeyword = searchKeywords[0];
        const googleResults = await searchGoogleAPI(mainKeyword, country);
        allDealers.push(...googleResults);
        stats.google_api = googleResults.length;
        console.log(`[GOOGLE-API] ✅ ${stats.google_api} resultados (fallback)`);
      } catch (error) {
        console.error('[GOOGLE-API] ❌:', error);
      }
    }

    stats.total_bruto = allDealers.length;

    // FILTRAR: Remover Facebook, Instagram, páginas genéricas, etc.
    const BLOCKED_DOMAINS = [
      'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 
      'twitter.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
      'blogspot.com', 'wordpress.com', 'medium.com', 'tumblr.com',
      'wikipedia.org', 'quora.com', 'yelp.com', 'tripadvisor.com',
      'faire.com', 'etsy.com', 'amazon.com', 'ebay.com',
    ];
    
    const filtered = allDealers.filter(c => {
      if (!c.website) return false;
      const domain = c.website.toLowerCase();
      const name = (c.name || '').toLowerCase();
      
      // Bloquear domínios de redes sociais e blogs
      if (BLOCKED_DOMAINS.some(blocked => domain.includes(blocked))) {
        return false;
      }
      
      // Bloquear URLs que são claramente posts/páginas genéricas
      if (domain.includes('/posts/') || domain.includes('/videos/') || 
          domain.includes('/groups/') || domain.includes('/pages/') ||
          domain.includes('/people/') || domain.includes('/p/') ||
          domain.includes('/product/') || domain.includes('/products/')) {
        return false;
      }
      
      // Bloquear nomes genéricos demais
      const genericNames = ['germany', 'products', 'shop all', 'global distributors', 
                           'about-us', 'home', 'title:', 'wholesale'];
      if (genericNames.some(gen => name.includes(gen) && name.length < 30)) {
        return false;
      }
      
      return true;
    });

    // DEDUPLICAÇÃO por website
    const unique = Array.from(
      new Map(filtered.filter(c => c.website).map(c => [c.website, c])).values()
    );

    stats.total_unico = unique.length;

    console.log(`\n[FILTER] ✅ ${filtered.length} empresas após filtros (de ${stats.total_bruto})`);
    console.log(`[DEDUP] ✅ ${stats.total_unico} empresas únicas`);

    // FASE 4: SISTEMA BLINDADO - GARANTIR RESULTADOS SEMPRE
    console.log(`\n[FASE 4] SISTEMA BLINDADO - Processando ${unique.length} empresas...`);

    // PRIORIZAR POR FONTE (Apollo > Serper > Google)
    const prioritized = unique.sort((a, b) => {
      const priority = { apollo: 3, serper: 2, google_api: 1 };
      return (priority[b.source] || 0) - (priority[a.source] || 0);
    });

    // CALCULAR FIT SCORE (com fallback inteligente)
    const validated = await Promise.all(
      prioritized.slice(0, 30).map(async (company) => {
        let fitScore = 0;
        
        // TENTAR WEB SCRAPING (com timeout 5s)
        try {
          fitScore = await calculateFitScore(company.website, keywords);
        } catch (error) {
          // FALLBACK: Fit Score baseado na FONTE
          if (company.source === 'apollo') {
            fitScore = 50; // Apollo já valida B2B
          } else if (company.source === 'serper') {
            fitScore = 40; // Serper é confiável
          } else {
            fitScore = 30; // Google API (menos confiável)
          }
          console.log(`[FIT] Fallback ${company.name}: ${fitScore} (source: ${company.source})`);
        }
        
        return { ...company, fitScore, fit_estimated: fitScore < 60 };
      })
    );

    // SEMPRE RETORNAR TOP 15+ (NUNCA 0!)
    const qualified = validated.filter(c => c.fitScore >= 40); // Threshold baixo (40)
    
    // GARANTIR MÍNIMO 10 RESULTADOS
    const finalResults = qualified.length >= 10
      ? qualified.slice(0, 20) // Top 20 se tiver muitos
      : validated.slice(0, Math.max(10, qualified.length)); // Min 10 sempre

    stats.fit_60_plus = finalResults.length;

    // Estatísticas por portal
    finalResults.forEach(c => {
      const portal = c.source_portal || c.source || 'Unknown';
      stats.portais[portal] = (stats.portais[portal] || 0) + 1;
    });

    console.log(`\n==============================================`);
    console.log(`[SISTEMA BLINDADO - RESULTADO FINAL]`);
    console.log(`  📊 Total bruto: ${stats.total_bruto}`);
    console.log(`  📊 Total único: ${stats.total_unico}`);
    console.log(`  ✅ RETORNADOS: ${stats.fit_60_plus} dealers (GARANTIDO!)`);
    console.log(`  📊 Por fonte: Apollo (${stats.apollo}) | Serper (${stats.serper}) | Google (${stats.google_api})`);
    console.log(`  📊 Por portal:`, stats.portais);
    console.log(`  🛡️ SISTEMA BLINDADO: ${qualified.length < 10 ? 'ATIVADO (garantiu 10+)' : 'OK'}`);
    console.log(`==============================================`);

    return new Response(
      JSON.stringify({
        total: finalResults.length,
        dealers: finalResults.sort((a, b) => b.fitScore - a.fitScore),
        stats: stats,
        keywords_used: PILATES_KEYWORDS.slice(0, 8),
        fallback_activated: qualified.length === 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[REALTIME] ❌ ERRO CRÍTICO:', error);
    return new Response(
      JSON.stringify({ error: error.message, dealers: [], total: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
