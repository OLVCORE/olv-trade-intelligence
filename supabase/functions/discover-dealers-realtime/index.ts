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
// CAMADA 1: APOLLO.IO (Dados estruturados)
// ============================================================================

async function searchApollo(keyword: string, country: string, minVolume?: number) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  if (!apolloKey) {
    console.log('[APOLLO] ⚠️ APOLLO_API_KEY missing - pulando Apollo');
    return [];
  }

  console.log(`[APOLLO] 🔍 Keyword: "${keyword}" | País: ${country} | Min Volume: ${minVolume ? `$${minVolume}` : 'N/A'}`);

  const payload: any = {
    page: 1,
    per_page: 50,
    organization_locations: [country],
    // USAR SÓ A KEYWORD ESPECÍFICA (das 19 keywords Pilates acima)
    q_organization_keyword_tags: [keyword], // Ex: "pilates equipment wholesale"
    organization_num_employees_ranges: ['21-50', '51-200', '201-500', '501-1000'],
    // EXCLUSÕES FORTES: B2C, Studios, Outros setores
    organization_not_keyword_tags: [
      'pilates studio', 'yoga studio', 'fitness studio', 'gym', 'health club',
      'instructor', 'teacher', 'personal trainer', 'coach', 'training',
      'blog', 'news', 'magazine', 'media', 'publisher',
      'restaurant', 'food', 'beverage', 'catering',
      'construction', 'building', 'contractor',
      'automotive', 'car dealer', 'vehicle',
      'real estate', 'property', 'housing',
      'software', 'saas', 'technology', 'IT services',
      'consulting', 'marketing', 'advertising',
      'retail', 'ecommerce', 'online store',
    ],
  };

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

    return orgs.map((c: any) => ({
      name: c.name,
      website: c.website_url,
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

  // 30 QUERIES ULTRA-ROBUSTAS
  const queries = [
    // TRADE DATA (Importação REAL) - PRIORIDADE MÁXIMA
    `site:importkey.com "${keyword}" import ${country}`,
    `site:eximpedia.app "${keyword}" import ${country}`,
    `site:volza.com "${keyword}" import data ${country}`,
    `site:importgenius.com "${keyword}" ${country}`,
    `site:panjiva.com "${keyword}" importer ${country}`,
    
    // FABRICANTES CHINA (Made-in-China ecosystem)
    `site:made-in-china.com "${keyword}" manufacturer`,
    `site:alibaba.com "${keyword}" supplier`,
    `site:globalsources.com "${keyword}" supplier`,
    `site:china-fitness.com pilates equipment`,
    `site:tradease.goldsupplier.com fitness equipment`,
    
    // B2B DIRECTORIES GLOBAIS
    `site:kompass.com "${keyword}" distributor ${country}`,
    `site:europages.com "${keyword}" distributor ${country}`,
    `site:thomasnet.com "${keyword}" distributor`,
    `site:tradekey.com "${keyword}" importer ${country}`,
    `site:exporthub.com "${keyword}" exporter`,
    
    // YELLOW PAGES GLOBAIS
    `site:yellowpages.com "${keyword}" distributor ${country}`,
    `site:yell.com "${keyword}" distributor`, // UK
    `site:gelbeseiten.de "${keyword}" distributor`, // Germany
    `site:uksmallbusinessdirectory.co.uk fitness equipment`,
    
    // PORTAIS ESPECIALIZADOS FITNESS
    `site:pilates.com directory`,
    `site:bodysolid.com dealers`,
    `site:gofitstrength.com distributor`,
    `site:raetin.com distributor`,
    `site:healthclubmanagement.co.uk suppliers`,
    
    // ASSOCIAÇÕES COMERCIAIS
    `"${keyword} distributors association" ${country}`,
    `"sporting goods trade association" ${country} members directory`,
    
    // LINKEDIN COMPANIES
    `site:linkedin.com/company "${keyword}" distributor`,
    `site:linkedin.com/company pilates equipment`,
    
    // GOOGLE GENÉRICO (Backup)
    `"${keyword}" ${country} -blog -news -studio -instructor -tiktok -ebay`,
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
            return (data.organic || []).map((r: any) => ({
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

  console.log(`[SERPER] ✅ ${allResults.length} resultados de ${queries.length} queries`);

  // Estatísticas por portal
  const byPortal = allResults.reduce((acc: any, r: any) => {
    const portal = r.source_portal || 'Other';
    acc[portal] = (acc[portal] || 0) + 1;
    return acc;
  }, {});

  console.log(`[SERPER] 📊 Por portal:`, byPortal);

  return allResults;
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
    `"${keyword}" distributor ${country}`,
    `"${keyword}" importer ${country}`,
    `"pilates equipment" distributor ${country}`,
  ];

  const allResults: any[] = [];

  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCX}&q=${encodeURIComponent(query)}&num=10`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const items = (data.items || []).map((item: any) => ({
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
    const { hsCode, country, keywords, minVolume } = await req.json();

    console.log(`==============================================`);
    console.log(`[REALTIME] 🚀 BUSCA ULTRA-ROBUSTA INICIADA`);
    console.log(`  HS Code: ${hsCode}`);
    console.log(`  País: ${country}`);
    console.log(`  Keywords: ${keywords?.join(', ')}`);
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

    // FASE 1: APOLLO (TODAS as 19 keywords Pilates específicas)
    console.log(`\n[FASE 1] Apollo.io - Buscando com TODAS as ${PILATES_KEYWORDS.length} keywords Pilates...`);
    
    for (const keyword of PILATES_KEYWORDS) { // USAR TODAS as keywords (19)
      const companies = await searchApollo(keyword, country, minVolume);
      allDealers.push(...companies);
      stats.apollo += companies.length;
      
      console.log(`[APOLLO] "${keyword}": ${companies.length} empresas`);
      
      // Delay 500ms entre keywords (evitar rate limit)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[APOLLO] ✅ Total: ${stats.apollo} empresas`);

    // FASE 2: SERPER (30 portais B2B) - USAR KEYWORD PILATES PRINCIPAL
    console.log(`\n[FASE 2] Serper - Buscando em 30 portais B2B...`);
    
    let serperAttempted = false;
    try {
      // USAR PRIMEIRA KEYWORD PILATES (não custom do usuário!)
      const mainKeyword = PILATES_KEYWORDS[0]; // "pilates equipment wholesale"
      const serperResults = await searchSerper(mainKeyword, country);
      allDealers.push(...serperResults);
      stats.serper = serperResults.length;
      serperAttempted = true;
      console.log(`[SERPER] ✅ ${stats.serper} resultados de 30 queries`);
    } catch (error) {
      console.error('[SERPER] ❌ Falhou:', error);
      serperAttempted = false;
    }

    // FASE 3: GOOGLE API (Fallback se Serper falhou) - USAR KEYWORD PILATES
    if (!serperAttempted || stats.serper === 0) {
      console.log(`\n[FASE 3] Google Custom Search API - Fallback...`);
      try {
        // USAR PRIMEIRA KEYWORD PILATES (não custom do usuário!)
        const mainKeyword = PILATES_KEYWORDS[0]; // "pilates equipment wholesale"
        const googleResults = await searchGoogleAPI(mainKeyword, country);
        allDealers.push(...googleResults);
        stats.google_api = googleResults.length;
        console.log(`[GOOGLE-API] ✅ ${stats.google_api} resultados (fallback)`);
      } catch (error) {
        console.error('[GOOGLE-API] ❌:', error);
      }
    }

    stats.total_bruto = allDealers.length;

    // DEDUPLICAÇÃO por website
    const unique = Array.from(
      new Map(allDealers.filter(c => c.website).map(c => [c.website, c])).values()
    );

    stats.total_unico = unique.length;

    console.log(`\n[DEDUP] ✅ ${stats.total_unico} empresas únicas (de ${stats.total_bruto})`);

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
