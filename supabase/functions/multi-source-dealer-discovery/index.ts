import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// MULTI-SOURCE DEALER DISCOVERY
// Combina: Apollo + Serper + Hunter.io
// ============================================================================

const KEYWORDS_ROTATION = [
  'fitness equipment distributor',
  'sporting goods distributor',
  'gym equipment wholesaler',
  'fitness equipment importer',
  'wellness equipment distributor',
  'sporting goods wholesaler',
  'medical equipment distributor',
  'rehabilitation equipment distributor',
];

/**
 * 1. APOLLO PREVIEW (GRÁTIS - Apenas metadata)
 */
async function apolloMultiKeywordSearch(country: string) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  if (!apolloKey) throw new Error('APOLLO_API_KEY missing');

  const allCompanies = [];

  console.log(`[APOLLO] 🔄 Executando ${KEYWORDS_ROTATION.length} buscas para ${country}...`);

  for (const keyword of KEYWORDS_ROTATION) {
    try {
      const payload = {
        page: 1,
        per_page: 100,
        organization_locations: [country],
        q_organization_keyword_tags: [keyword],
        organization_num_employees_ranges: ['51-200', '201-500', '501-1000', '1001-5000'],
      };

      const response = await fetch('https://api.apollo.io/v1/organizations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        allCompanies.push(...(data.organizations || []));
        console.log(`[APOLLO] ✅ "${keyword}": ${data.organizations?.length || 0} resultados`);
      }
    } catch (err) {
      console.error(`[APOLLO] ❌ Erro em "${keyword}":`, err);
    }
  }

  // Remover duplicatas (por Apollo ID)
  const unique = Array.from(
    new Map(allCompanies.map(c => [c.id, c])).values()
  );

  console.log(`[APOLLO] 📊 Total único: ${unique.length} empresas (de ${allCompanies.length} resultados)`);
  return unique;
}

/**
 * 2. SERPER DEEP WEB (Encontrar empresas não listadas no Apollo)
 */
async function serperDeepWebSearch(country: string) {
  const serperKey = Deno.env.get('VITE_SERPER_API_KEY');
  if (!serperKey) {
    console.log('[SERPER] ⚠️ API Key não configurada, pulando');
    return [];
  }

  const queries = [
    `"fitness equipment distributor" ${country} -blog -news -article -studio`,
    `"gym equipment wholesaler" ${country} B2B -blog -retail`,
    `site:kompass.com "fitness equipment" distributor ${country}`,
    `site:europages.com fitness equipment distributor ${country}`,
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
        body: JSON.stringify({
          q: query,
          location: country,
          num: 20,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const filtered = (data.organic || []).filter((r: any) => {
          const text = `${r.title} ${r.snippet}`.toLowerCase();
          return /distributor|wholesaler|importer/i.test(text) && 
                 !/blog|news|article|magazine/i.test(text);
        });
        allResults.push(...filtered);
        console.log(`[SERPER] ✅ "${query}": ${filtered.length} resultados`);
      }
    } catch (err) {
      console.error('[SERPER] ❌ Erro:', err);
    }
  }

  return allResults;
}

/**
 * 3. QUALIFY VIA WEBSITE SCRAPING (GRÁTIS)
 */
async function qualifyByWebsiteScrape(website: string) {
  try {
    const response = await fetch(website, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return { qualified: false, reason: 'Website down' };

    const html = await response.text();
    const $ = cheerio.load(html);
    const text = $('body').text().toLowerCase();

    const isB2B = /distributor|wholesaler|importer|b2b|bulk|trade|dealer/i.test(text);
    const isB2C = /studio|class schedule|book a session|personal training/i.test(text);

    return {
      qualified: isB2B && !isB2C,
      isB2B,
      isB2C,
      reason: isB2B && !isB2C ? 'B2B validated' : 'B2C or unclear',
    };
  } catch (error) {
    return { qualified: false, reason: 'Scrape error' };
  }
}

/**
 * 4. REVELAR CONTATOS APOLLO (PAGO - apenas qualificados)
 */
async function revealContactsIfQualified(companyId: string) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  
  try {
    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey! },
      body: JSON.stringify({
        page: 1,
        per_page: 5,
        organization_ids: [companyId],
        person_titles: ['CEO', 'President', 'Owner', 'Procurement Manager', 'Import Manager'],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.people || [];
  } catch (error) {
    console.error('[CONTACTS] ❌ Erro:', error);
    return [];
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { country = 'United States', mode = 'full' } = await req.json();

    console.log(`[MULTI-SOURCE] 🚀 Descoberta ${mode} para ${country}`);

    const results = {
      apollo: [],
      serper: [],
      qualified: [],
      creditsUsed: 0,
    };

    // FASE 1: Apollo Preview (GRÁTIS)
    console.log('[MULTI-SOURCE] 📊 FASE 1: Apollo Preview...');
    const apolloCompanies = await apolloMultiKeywordSearch(country);
    results.apollo = apolloCompanies;

    // FASE 2: Serper Deep Web (GRÁTIS)
    if (mode === 'full') {
      console.log('[MULTI-SOURCE] 🌐 FASE 2: Serper Deep Web...');
      const serperResults = await serperDeepWebSearch(country);
      results.serper = serperResults;
    }

    // FASE 3: Qualificação e Reveal (PAGO apenas para qualificados)
    console.log('[MULTI-SOURCE] ✅ FASE 3: Qualificação...');
    
    for (const company of apolloCompanies.slice(0, 50)) { // Limitar a 50 para não gastar muito
      if (!company.website_url) continue;

      const qualification = await qualifyByWebsiteScrape(company.website_url);

      if (qualification.qualified) {
        // ✅ QUALIFICADO! Revelar contatos (PAGO)
        const contacts = await revealContactsIfQualified(company.id);
        results.creditsUsed += contacts.length;

        const score = calculatePriorityScore(company, qualification);

        results.qualified.push({
          id: company.id,
          name: company.name,
          website: company.website_url,
          linkedin: company.linkedin_url,
          country: company.country || country,
          city: company.city,
          industry: company.industry,
          employees: company.organization_num_employees,
          priority_score: score,
          tier: score >= 80 ? 'A' : score >= 60 ? 'B' : 'C',
          contacts: contacts.map((p: any) => ({
            name: `${p.first_name} ${p.last_name}`,
            title: p.title,
            email: p.email,
            linkedin: p.linkedin_url,
          })),
          qualification: qualification,
        });
      }
    }

    console.log(`[MULTI-SOURCE] 🎯 FINAL: ${results.qualified.length} dealers qualificados`);
    console.log(`[MULTI-SOURCE] 💰 Créditos usados: ${results.creditsUsed}`);

    return new Response(
      JSON.stringify({
        success: true,
        dealers: results.qualified,
        total: results.qualified.length,
        stats: {
          apollo_preview: results.apollo.length,
          serper_results: results.serper.length,
          qualified: results.qualified.length,
          credits_apollo: results.creditsUsed,
          qualification_rate: `${((results.qualified.length / results.apollo.length) * 100).toFixed(1)}%`,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[MULTI-SOURCE] ❌:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculatePriorityScore(company: any, qualification: any) {
  let score = 0;
  const employees = company.organization_num_employees || 0;
  if (employees >= 1000) score += 30;
  else if (employees >= 500) score += 25;
  else if (employees >= 200) score += 20;
  else if (employees >= 100) score += 15;
  else if (employees >= 50) score += 10;
  if (company.website_url) score += 10;
  if (company.linkedin_url) score += 5;
  if (qualification.isB2B) score += 25;
  if (!qualification.isB2C) score += 20;
  return Math.min(score, 100);
}

