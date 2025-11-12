import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// B2B KEYWORDS ULTRA-REFINADOS (Apenas Distribuidores/Importadores PUROS)
// ============================================================================

const B2B_INCLUDE_KEYWORDS = [
  // Core B2B (nuclear)
  'distributor',
  'wholesaler',
  'dealer',
  'importer',
  'exporter',
  'trading company',
  'distribution center',
  'wholesale distributor',
  'import-export',
  
  // Manufacturing
  'manufacturer',
  'sporting goods manufacturer',
  'fitness equipment manufacturer',
  'sports equipment manufacturer',
  'industrial manufacturer',
  
  // Trade internacional
  'international trade',
  'global trade',
  'import export',
  'export management',
  'procurement',
  'purchasing',
  
  // Equipamentos específicos
  'fitness equipment',
  'pilates equipment',
  'gym equipment',
  'sports equipment',
  'athletic equipment',
  'commercial fitness',
  'professional fitness',
  
  // Supply chain
  'supply chain',
  'logistics',
  'warehousing',
  'fulfillment',
  
  // B2B explícito
  'B2B fitness equipment',
  'bulk fitness equipment'
];

const B2C_EXCLUDE_KEYWORDS = [
  // Studios e academias (B2C)
  'pilates studio',
  'yoga studio',
  'fitness studio',
  'gym franchise',
  'fitness center',
  'wellness center',
  'health club',
  'athletic club',
  'recreation center',
  'sports club',
  'studio',
  'gym',
  
  // Profissionais individuais (B2C)
  'instructor',
  'teacher',
  'trainer',
  'coach',
  'therapist',
  'personal training',
  'personal trainer',
  'boutique',
  'boutique fitness',
  
  // Conteúdo/Educação (B2C)
  'blog',
  'magazine',
  'news',
  'media',
  'publication',
  'certification',
  'course',
  'training center',
  'school',
  'academy',
  
  // Healthcare (não é B2B)
  'physiotherapy',
  'physical therapy',
  'rehabilitation center',
  'clinic',
  'medical',
  
  // Retail/Consumer (B2C)
  'b2c',
  'd2c',
  'direct to consumer',
  'retail',
  'e-commerce',
  'ecommerce',
  'online store',
  'consumer internet',
  'consumers',
  
  // Varejo final (não atacado)
  'retail store',
  'shop',
  'boutique',
  
  // Apparel (not equipment)
  'clothing',
  'apparel',
  'fashion',
  'sportswear'
];

// ============================================================================
// B2B DECISION MAKER TITLES
// ============================================================================

const B2B_DECISION_MAKER_TITLES = [
  'procurement manager',
  'purchasing director',
  'buyer',
  'sourcing manager',
  'import manager',
  'category manager',
  'supply chain director',
  'ceo',
  'managing director',
  'cfo',
  'coo',
  'president',
  'owner'
];

// ============================================================================
// APOLLO SEARCH (FASE 1 - SEM TRADE DATA API)
// ============================================================================

async function searchDealersViaApollo(params: {
  hs_code: string;
  country: string;
  min_volume_usd?: number;
  keywords: string[];
  includeKeywords?: string[];
  excludeKeywords?: string[];
}) {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  
  if (!apolloKey) {
    throw new Error('APOLLO_API_KEY não configurado');
  }

  // Usar keywords personalizadas ou padrões
  const includeKw = params.includeKeywords || B2B_INCLUDE_KEYWORDS;
  const excludeKw = params.excludeKeywords || B2C_EXCLUDE_KEYWORDS;

  console.log('[DEALERS] 🔍 Buscando via Apollo.io:', {
    country: params.country,
    keywords: params.keywords,
    includeKeywords: includeKw.length,
    excludeKeywords: excludeKw.length,
    minVolume: params.min_volume_usd
  });

  // Construir query Apollo para FITNESS DISTRIBUTORS
  const apolloPayload = {
    page: 1,
    per_page: 25, // 25 dealers = ~25 créditos Apollo
    
    // Filtros geográficos
    organization_locations: [params.country],
    
    // BUSCA POR KEYWORDS (mais efetivo que industry tags)
    q_organization_name_or_keywords: 'fitness equipment OR gym equipment OR sports equipment OR pilates equipment OR wellness equipment OR medical equipment',
    
    // AND deve ter B2B keywords (ULTRA-REFINADO)
    q_organization_keyword_tags: B2B_INCLUDE_KEYWORDS.slice(0, 10), // Primeiros 10 mais importantes
    
    // NOT B2C keywords (ELIMINAR TUDO QUE É B2C)
    q_organization_not_keyword_tags: B2C_EXCLUDE_KEYWORDS.slice(0, 15), // Top 15 exclusões
    
    // TAMANHO (B2B enxuto - tecnologia permite poucos funcionários)
    organization_num_employees_ranges: [
      '21,50',     // Small B2B (enxuto)
      '51,200',    // Medium B2B
      '201,500',   // Medium-Large B2B
      '501,1000',  // Large B2B
      '1001,5000'  // Enterprise
    ],
    
    // RECEITA (mínimo $2M - mais realista para distribuidores)
    revenue_range: {
      min: 2000000,  // Mínimo $2M anual (realista)
      max: 500000000 // Máximo $500M (não mega-corporações)
    }
  };

  const response = await fetch('https://api.apollo.io/v1/organizations/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apolloKey
    },
    body: JSON.stringify(apolloPayload)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[DEALERS] ❌ Apollo error:', error);
    throw new Error(`Apollo API error: ${response.status}`);
  }

  const data = await response.json();
  const companies = data.organizations || [];

  console.log('[DEALERS] ✅ Apollo retornou:', companies.length, 'empresas');

  // ============================================================================
  // FILTRAR: APENAS B2B (Remover B2C)
  // ============================================================================

  const filteredCompanies = companies.filter((company: any) => {
    const name = (company.name || '').toLowerCase();
    const industry = (company.industry || '').toLowerCase();
    const keywords = (company.keywords || []).join(' ').toLowerCase();
    
    const allText = `${name} ${industry} ${keywords}`;

    // ✅ Incluir se tem palavras B2B
    const hasB2BKeywords = B2B_INCLUDE_KEYWORDS.some(kw => allText.includes(kw));
    
    // ❌ Excluir se tem palavras B2C
    const hasB2CKeywords = B2C_EXCLUDE_KEYWORDS.some(kw => allText.includes(kw));
    
    const isB2B = hasB2BKeywords && !hasB2CKeywords;

    if (!isB2B) {
      console.log('[DEALERS] ❌ B2C detectado (excluído):', name);
    }

    return isB2B;
  });

  console.log('[DEALERS] ✅ Após filtro B2B:', filteredCompanies.length, 'dealers');

  // ============================================================================
  // ENRIQUECER COM DECISORES (Apollo People Search)
  // ============================================================================

  const dealersWithDecisionMakers = await Promise.all(
    filteredCompanies.map(async (company: any) => {
      try {
        // Buscar decisores de Procurement/Buying
        const peoplePayload = {
          page: 1,
          per_page: 10,
          organization_ids: [company.id],
          person_titles: B2B_DECISION_MAKER_TITLES
        };

        const peopleResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apolloKey
          },
          body: JSON.stringify(peoplePayload)
        });

        let decisionMakers = [];
        if (peopleResponse.ok) {
          const peopleData = await peopleResponse.json();
          decisionMakers = (peopleData.people || []).map((person: any) => ({
            name: person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim(),
            title: person.title,
            email: person.email,
            linkedin_url: person.linkedin_url
          }));
        }

        return {
          ...company,
          decision_makers: decisionMakers
        };
      } catch (error) {
        console.error('[DEALERS] ⚠️ Erro ao buscar decisores para:', company.name);
        return { ...company, decision_makers: [] };
      }
    })
  );

  return dealersWithDecisionMakers;
}

// ============================================================================
// CALCULATE EXPORT FIT SCORE
// ============================================================================

function calculateExportFitScore(dealer: any): number {
  let score = 0;

  // ✅ Tem keywords B2B (distributor, wholesaler, etc)
  const name = (dealer.name || '').toLowerCase();
  const industry = (dealer.industry || '').toLowerCase();
  if (B2B_INCLUDE_KEYWORDS.some(kw => name.includes(kw) || industry.includes(kw))) {
    score += 30;
  }

  // ✅ Estrutura (funcionários)
  const employees = dealer.organization_num_employees || 0;
  if (employees >= 100) score += 25;
  else if (employees >= 50) score += 20;
  else if (employees >= 20) score += 15;
  else if (employees >= 10) score += 10;

  // ✅ Receita (capacidade financeira)
  const revenue = dealer.estimated_num_employees || 0; // Apollo retorna revenue estimado
  if (revenue >= 10000000) score += 25; // USD 10M+
  else if (revenue >= 5000000) score += 20; // USD 5M+
  else if (revenue >= 1000000) score += 15; // USD 1M+

  // ✅ Tem decisores identificados
  if (dealer.decision_makers?.length > 0) {
    score += 10;
    if (dealer.decision_makers.length >= 3) score += 5;
  }

  // ✅ Tem website
  if (dealer.website_url) score += 5;

  // ✅ Tem LinkedIn
  if (dealer.linkedin_url) score += 5;

  return Math.min(score, 100);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      hs_code, 
      country, 
      min_volume_usd, 
      keywords = [],
      includeKeywords = B2B_INCLUDE_KEYWORDS, // Usar keywords personalizadas do usuário
      excludeKeywords = B2C_EXCLUDE_KEYWORDS  // Ou usar padrões se não fornecidas
    } = await req.json();

    console.log('[DEALERS] 📦 Descobrindo dealers B2B:', {
      hs_code,
      country,
      min_volume_usd,
      keywords,
      includeKeywords: includeKeywords.length,
      excludeKeywords: excludeKeywords.length
    });

    // Validação
    if (!hs_code || !country) {
      return new Response(
        JSON.stringify({ error: 'hs_code e country são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1️⃣ Buscar via Apollo (FASE 1 - sem Trade Data API)
    const apolloDealers = await searchDealersViaApollo({
      hs_code,
      country,
      min_volume_usd,
      keywords,
      includeKeywords, // Keywords personalizadas!
      excludeKeywords  // Keywords personalizadas!
    });

    // 2️⃣ Calcular Export Fit Score
    const dealersWithScores = apolloDealers.map((dealer: any) => {
      const fitScore = calculateExportFitScore(dealer);

      return {
        id: dealer.id,
        name: dealer.name,
        country: dealer.country || country,
        city: dealer.city,
        state: dealer.state,
        industry: dealer.industry,
        employee_count: dealer.organization_num_employees,
        revenue_range: dealer.estimated_num_employees 
          ? `USD ${(dealer.estimated_num_employees / 1000000).toFixed(1)}M+`
          : null,
        annual_revenue_usd: dealer.estimated_num_employees,
        website: dealer.website_url,
        linkedin_url: dealer.linkedin_url,
        description: dealer.short_description,
        
        // B2B Flags
        is_distributor: (dealer.name || '').toLowerCase().includes('distributor'),
        is_wholesaler: (dealer.name || '').toLowerCase().includes('wholesaler') || 
                       (dealer.name || '').toLowerCase().includes('wholesale'),
        is_importer: (dealer.name || '').toLowerCase().includes('import'),
        
        // Decision Makers
        decision_makers: dealer.decision_makers || [],
        
        // Scores
        export_fit_score: fitScore,
        
        // Apollo ID
        apollo_organization_id: dealer.id
      };
    });

    // 3️⃣ Ordenar por Export Fit Score (maior primeiro)
    dealersWithScores.sort((a: any, b: any) => b.export_fit_score - a.export_fit_score);

    console.log('[DEALERS] ✅ Dealers processados:', dealersWithScores.length);
    console.log('[DEALERS] 📊 Top 3 scores:', dealersWithScores.slice(0, 3).map((d: any) => ({
      name: d.name,
      score: d.export_fit_score
    })));

    return new Response(
      JSON.stringify({
        dealers: dealersWithScores,
        total: dealersWithScores.length,
        search_params: { hs_code, country, min_volume_usd },
        b2b_only: true,
        filters_applied: {
          include: B2B_INCLUDE_KEYWORDS,
          exclude: B2C_EXCLUDE_KEYWORDS
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[DEALERS] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao descobrir dealers',
        dealers: [],
        total: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

