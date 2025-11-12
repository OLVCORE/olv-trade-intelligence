import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// DESCOBERTA AVANÇADA DE DEALERS - ESTRATÉGIA MULTI-API
// ============================================================================

/**
 * FASE 1: APOLLO SEARCH (Preview Gratuito)
 * - Lista até 100 empresas SEM gastar créditos
 * - Retorna metadata: nome, website, indústria, funcionários
 */
async function apolloPreviewSearch(params: {
  country: string;
  keyword: string;
}) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  if (!apolloKey) throw new Error('APOLLO_API_KEY não configurado');

  console.log(`[APOLLO] 🔍 Preview Search: ${params.keyword} in ${params.country}`);

  const payload = {
    page: 1,
    per_page: 100, // 100 previews = GRÁTIS
    organization_locations: [params.country],
    q_organization_keyword_tags: [params.keyword],
    organization_num_employees_ranges: ['51-200', '201-500', '501-1000', '1001-5000', '5001-10000'],
  };

  const response = await fetch('https://api.apollo.io/v1/organizations/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apolloKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Apollo API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[APOLLO] ✅ Preview: ${data.organizations?.length || 0} empresas`);
  
  return data.organizations || [];
}

/**
 * FASE 2: WEBSITE SCRAPING & QUALIFICATION (Gratuito)
 * - Scrape do website da empresa
 * - Valida se é realmente distribuidor B2B
 * - Identifica sinais de qualificação
 */
async function qualifyCompanyByWebsite(company: any) {
  if (!company.website_url) {
    return { qualified: false, reason: 'No website' };
  }

  try {
    console.log(`[QUALIFY] 🌐 Scraping: ${company.website_url}`);
    
    const response = await fetch(company.website_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      return { qualified: false, reason: 'Website inaccessible' };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const text = $('body').text().toLowerCase();

    // SINAIS DE QUALIFICAÇÃO (Distributor/Importer/Wholesaler)
    const qualificationSignals = [
      /distributor/i,
      /wholesaler/i,
      /importer/i,
      /wholesale/i,
      /\bb2b\b/i,
      /bulk (sales|orders)/i,
      /dealer/i,
      /authorized dealer/i,
      /brands we (carry|represent|distribute)/i,
      /import.*export/i,
      /international trade/i,
    ];

    const hasQualificationSignal = qualificationSignals.some(regex => regex.test(text));

    // SINAIS DE DESQUALIFICAÇÃO (Studios/B2C/Blogs)
    const disqualificationSignals = [
      /pilates studio/i,
      /yoga studio/i,
      /our studio/i,
      /book a class/i,
      /class schedule/i,
      /personal training/i,
      /become an instructor/i,
      /blog post/i,
      /latest news/i,
    ];

    const hasDisqualificationSignal = disqualificationSignals.some(regex => regex.test(text));

    // SINAIS EXTRAS (Seção B2B)
    const hasB2BSection = /b2b|trade|wholesale|dealer|distributor/i.test(text);

    // VERIFICAR MARCAS QUE DISTRIBUEM
    const brandsMentioned = [];
    const brandPatterns = [
      /balanced body/i,
      /stott pilates/i,
      /gratz/i,
      /peak pilates/i,
      /basi/i,
      /merrithew/i,
    ];
    brandPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        brandsMentioned.push(pattern.source.replace(/\\/g, '').replace(/i$/,''));
      }
    });

    // DECISÃO FINAL
    const qualified = hasQualificationSignal && !hasDisqualificationSignal;

    return {
      qualified,
      hasB2BSection,
      brandsMentioned,
      qualificationSignals: qualificationSignals.filter(r => r.test(text)).length,
      disqualificationSignals: disqualificationSignals.filter(r => r.test(text)).length,
      reason: qualified ? 'B2B signals detected' : 'No B2B signals or has disqualifiers',
    };

  } catch (error) {
    console.error(`[QUALIFY] ❌ Erro ao scrape ${company.website_url}:`, error);
    return { qualified: false, reason: 'Scrape failed' };
  }
}

/**
 * FASE 3: REVELAR CONTATOS (Pago - apenas para qualificados)
 * - Busca decisores (CEO, Procurement, Import Manager)
 * - Apollo cobra 1 crédito por pessoa revelada
 */
async function revealContacts(companyId: string) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  
  const payload = {
    page: 1,
    per_page: 10,
    organization_ids: [companyId],
    person_titles: [
      'CEO', 'President', 'Owner', 'Managing Director',
      'Procurement Manager', 'Purchasing Director', 'Chief Procurement Officer',
      'Import Manager', 'Export Manager',
      'VP Business Development', 'Director Business Development',
      'COO', 'CFO'
    ],
  };

  const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apolloKey!,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error('[CONTACTS] ❌ Erro ao buscar decisores');
    return [];
  }

  const data = await response.json();
  console.log(`[CONTACTS] 👥 Encontrados: ${data.people?.length || 0} decisores`);
  
  return (data.people || []).map((p: any) => ({
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    title: p.title,
    email: p.email, // Apollo só revela se tiver créditos
    linkedin_url: p.linkedin_url,
  }));
}

/**
 * CÁLCULO DE PRIORITY SCORE (0-100)
 */
function calculatePriorityScore(company: any, qualification: any) {
  let score = 0;

  // Tamanho (0-30)
  const employees = company.organization_num_employees || 0;
  if (employees >= 1000) score += 30;
  else if (employees >= 500) score += 25;
  else if (employees >= 200) score += 20;
  else if (employees >= 100) score += 15;
  else if (employees >= 50) score += 10;

  // Tem website ativo (10)
  if (company.website_url && qualification.qualified) score += 10;

  // Tem LinkedIn (5)
  if (company.linkedin_url) score += 5;

  // Tem B2B section no website (15)
  if (qualification.hasB2BSection) score += 15;

  // Já distribui marcas concorrentes (20)
  if (qualification.brandsMentioned && qualification.brandsMentioned.length > 0) {
    score += 20;
  }

  // Múltiplos sinais de qualificação (10)
  if (qualification.qualificationSignals >= 3) score += 10;

  // Sem sinais de desqualificação (10)
  if (qualification.disqualificationSignals === 0) score += 10;

  return Math.min(score, 100);
}

// ============================================================================
// MAIN HANDLER - BUSCA INTELIGENTE
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { country, keywords = ['fitness equipment distributor'] } = await req.json();

    console.log('[DEALERS-ADV] 🚀 Busca avançada iniciada:', { country, keywords });

    const allDealers = [];
    let creditsUsed = 0;

    // Para cada keyword, fazer preview search
    for (const keyword of keywords) {
      const previewCompanies = await apolloPreviewSearch({ country, keyword });

      console.log(`[DEALERS-ADV] 📋 Preview para "${keyword}": ${previewCompanies.length} empresas`);

      // Qualificar cada empresa (SEM gastar créditos)
      for (const company of previewCompanies) {
        const qualification = await qualifyCompanyByWebsite(company);

        if (qualification.qualified) {
          // ✅ QUALIFICADO! Agora sim, revelar contatos (PAGO)
          const contacts = await revealContacts(company.id);
          creditsUsed += contacts.length; // Apollo cobra por pessoa revelada

          const score = calculatePriorityScore(company, qualification);

          allDealers.push({
            // Identificação
            id: company.id,
            name: company.name,
            website: company.website_url,
            linkedin_url: company.linkedin_url,
            
            // Firmographics
            country: company.country || country,
            city: company.city,
            state: company.state,
            industry: company.industry,
            employee_count: company.organization_num_employees,
            
            // Qualificação
            priority_score: score,
            tier: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
            qualification: qualification,
            
            // Contatos
            contacts: contacts,
            
            // Metadata
            source: 'apollo_advanced',
            keyword_found: keyword,
            apollo_organization_id: company.id,
          });

          console.log(`[DEALERS-ADV] ✅ ${company.name} - Score: ${score} - Tier: ${score >= 80 ? 'A' : 'B/C'}`);
        } else {
          console.log(`[DEALERS-ADV] ❌ ${company.name} - ${qualification.reason}`);
        }
      }
    }

    // Ordenar por priority score
    allDealers.sort((a, b) => b.priority_score - a.priority_score);

    console.log(`[DEALERS-ADV] 🎯 RESULTADO FINAL:`);
    console.log(`  Total qualificados: ${allDealers.length}`);
    console.log(`  Tier A (80+): ${allDealers.filter(d => d.tier === 'A').length}`);
    console.log(`  Tier B (60-79): ${allDealers.filter(d => d.tier === 'B').length}`);
    console.log(`  Créditos Apollo usados: ${creditsUsed}`);

    return new Response(
      JSON.stringify({
        success: true,
        dealers: allDealers,
        total: allDealers.length,
        stats: {
          tier_A: allDealers.filter(d => d.tier === 'A').length,
          tier_B: allDealers.filter(d => d.tier === 'B').length,
          tier_C: allDealers.filter(d => d.tier === 'C').length,
          credits_used: creditsUsed,
        },
        search_params: { country, keywords },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[DEALERS-ADV] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({ error: error.message, dealers: [], total: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

