import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// MULTI-SOURCE REAL-TIME SEARCH
// ============================================================================

interface SearchParams {
  hsCode: string;
  country: string;
  keywords: string[]; // Gerado pelo HS Code Intelligence
}

// ============================================================================
// APOLLO SEARCH (com decisores)
// ============================================================================

async function searchApollo(params: SearchParams) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  if (!apolloKey) {
    console.log('[APOLLO] ⚠️ Key missing');
    return { companies: [], decisionMakers: [] };
  }

  console.log(`[APOLLO] 🔍 Buscando: ${params.keywords[0]} in ${params.country}`);

  const payload = {
    page: 1,
    per_page: 50,
    organization_locations: [params.country],
    q_organization_keyword_tags: params.keywords,
    organization_num_employees_ranges: ['21-50', '51-200', '201-500', '501-1000'],
    organization_not_keyword_tags: [
      'studio', 'gym', 'fitness center', 'instructor', 'teacher',
      'blog', 'news', 'magazine', 'education',
    ],
  };

  try {
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Apollo HTTP ${response.status}`);
    }

    const data = await response.json();
    const companies = data.organizations || [];

    console.log(`[APOLLO] ✅ ${companies.length} empresas encontradas`);

    // BUSCAR DECISORES para cada empresa (preview grátis)
    const companiesWithDecisionMakers = companies.map((c: any) => ({
      id: c.id,
      name: c.name,
      website: c.website_url,
      linkedin_url: c.linkedin_url,
      country: c.country || params.country,
      city: c.city,
      state: c.state,
      industry: c.industry,
      employee_count: c.organization_num_employees,
      description: c.short_description,
      source: 'apollo',
      apollo_id: c.id, // Para buscar decisores depois
      apollo_link: `https://app.apollo.io/#/companies/${c.id}`,
      // Decisores virão em chamada separada (peek grátis)
      decision_makers: [],
    }));

    return { companies: companiesWithDecisionMakers };

  } catch (error) {
    console.error('[APOLLO] ❌:', error);
    return { companies: [] };
  }
}

// ============================================================================
// SERPER SEARCH (Deep Web)
// ============================================================================

async function searchSerper(params: SearchParams) {
  const serperKey = Deno.env.get('VITE_SERPER_API_KEY');
  if (!serperKey) {
    console.log('[SERPER] ⚠️ Key missing');
    return { companies: [] };
  }

  console.log(`[SERPER] 🔍 Deep web search: ${params.country}`);

  const queries = [
    `"${params.keywords[0]} distributor" ${params.country} -blog -news`,
    `site:kompass.com "${params.keywords[0]}" distributor ${params.country}`,
    `site:thomasnet.com "${params.keywords[0]}" distributor`,
  ];

  const allResults = [];

  for (const query of queries) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 20 }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = (data.organic || []).map((r: any) => ({
          name: r.title,
          website: r.link,
          description: r.snippet,
          source: 'serper',
          country: params.country,
        }));
        allResults.push(...results);
      }
    } catch (err) {
      console.error('[SERPER] ❌:', err);
    }
  }

  console.log(`[SERPER] ✅ ${allResults.length} resultados deep web`);

  return { companies: allResults };
}

// ============================================================================
// LINKEDIN SEARCH (Decision Makers)
// ============================================================================

async function searchLinkedIn(companies: any[]) {
  // Por enquanto, retornar placeholder
  // TODO: Integrar com LinkedIn Sales Navigator API ou Phantom Buster
  
  console.log(`[LINKEDIN] 💼 Buscando decisores para ${companies.length} empresas...`);
  console.log(`[LINKEDIN] ⚠️ LinkedIn API não implementada ainda (usar Phantom Buster)`);

  return { decisionMakers: [] };
}

// ============================================================================
// CALCULAR FIT SCORE (baseado em keywords no website)
// ============================================================================

async function calculateFitScore(company: any, keywords: string[]): Promise<number> {
  if (!company.website) return 0;

  try {
    const response = await fetch(company.website, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return 0;

    const html = await response.text();
    const text = html.toLowerCase();

    // Contar keywords encontradas
    const found = keywords.filter(kw => text.includes(kw.toLowerCase()));

    // Score base: 60 se encontrou pelo menos 2 keywords
    if (found.length >= 2) {
      let score = 60 + (found.length - 2) * 5; // +5 por keyword adicional
      
      // Bônus: wholesale/distributor
      if (text.includes('wholesale') || text.includes('distributor')) {
        score += 10;
      }
      
      // Bônus: b2b/commercial
      if (text.includes('b2b') || text.includes('commercial')) {
        score += 5;
      }
      
      return Math.min(score, 95);
    }

    return 0;

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
    const { hsCode, country, keywords } = await req.json();

    if (!hsCode || !country || !keywords) {
      throw new Error('hsCode, country, and keywords required');
    }

    console.log(`[REALTIME] 🚀 Busca multi-source:`);
    console.log(`  HS Code: ${hsCode}`);
    console.log(`  País: ${country}`);
    console.log(`  Keywords: ${keywords.join(', ')}`);

    // BUSCAR EM PARALELO (Apollo + Serper)
    const [apolloResult, serperResult] = await Promise.all([
      searchApollo({ hsCode, country, keywords }),
      searchSerper({ hsCode, country, keywords }),
    ]);

    // Combinar resultados
    const allCompanies = [
      ...apolloResult.companies,
      ...serperResult.companies,
    ];

    // Remover duplicatas por website
    const unique = Array.from(
      new Map(allCompanies.map(c => [c.website, c])).values()
    );

    console.log(`[REALTIME] 📊 Resultados:`);
    console.log(`  Apollo: ${apolloResult.companies.length}`);
    console.log(`  Serper: ${serperResult.companies.length}`);
    console.log(`  Únicos: ${unique.length}`);

    // CALCULAR FIT SCORE em paralelo (primeiros 20)
    console.log(`[REALTIME] 🎯 Calculando Fit Scores...`);
    
    const withScores = await Promise.all(
      unique.slice(0, 20).map(async (company) => {
        const fitScore = await calculateFitScore(company, keywords);
        return { ...company, fitScore };
      })
    );

    // Filtrar apenas com Fit > 0
    const qualified = withScores.filter(c => c.fitScore > 0);

    console.log(`[REALTIME] ✅ ${qualified.length} empresas qualificadas (Fit > 0)`);

    return new Response(
      JSON.stringify({
        total: qualified.length,
        dealers: qualified.sort((a, b) => b.fitScore - a.fitScore),
        stats: {
          apollo: apolloResult.companies.length,
          serper: serperResult.companies.length,
          qualified: qualified.length,
          keywords: keywords,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[REALTIME] ❌:', error);
    return new Response(
      JSON.stringify({ error: error.message, dealers: [], total: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

