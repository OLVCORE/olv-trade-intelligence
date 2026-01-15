import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🌍 GRUPO 1: JOB PORTALS GLOBAIS (8 fontes)
const GLOBAL_JOB_PORTALS = [
  'linkedin.com/jobs',
  'linkedin.com/posts',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'seek.com',
  'reed.co.uk'
];

// 🌍 GRUPO 2: FONTES OFICIAIS INTERNACIONAIS (10 fontes)
const GLOBAL_OFFICIAL_SOURCES = [
  'sec.gov',                          // SEC (US - maior mercado)
  'edgar.sec.gov',                    // SEC EDGAR (formulários oficiais)
  'companieshouse.gov.uk',            // Companies House UK
  'beta.companieshouse.gov.uk',       // Companies House Beta
  'registry.companieshouse.gov.uk',   // UK Registry
  'asic.gov.au',                      // ASIC (Austrália)
  'companies-register.govt.nz',       // NZ Register
  'www.sedar.com',                    // SEDAR (Canadá)
  'opencorporates.com',               // OpenCorporates (global database)
  'companies-register.companiesoffice.govt.nz' // NZ Oficial
];

// 🌍 GRUPO 3: NOTÍCIAS & FINANCEIRAS GLOBAIS (11 fontes)
const GLOBAL_NEWS_SOURCES = [
  'bloomberg.com',                    // Bloomberg (referência global #1)
  'reuters.com',                      // Reuters Business (referência global #2)
  'ft.com',                           // Financial Times (elite global)
  'wsj.com',                          // Wall Street Journal (elite US)
  'techcrunch.com',                   // TechCrunch (startups/scale-ups)
  'forbes.com',                       // Forbes (negócios global)
  'bbc.com/news/business',            // BBC Business (confiabilidade global)
  'economist.com',                    // The Economist (elite intelectual)
  'cnbc.com',                         // CNBC (financeiro global)
  'marketwatch.com',                  // MarketWatch (financeiro US)
  'businessinsider.com'               // Business Insider (tech/negócios)
];

// 🌍 GRUPO 4: PORTALS DE TECNOLOGIA GLOBAIS (8 fontes)
const GLOBAL_TECH_PORTALS = [
  'cio.com',                          // CIO (CIOs globais - alto impacto B2B)
  'zdnet.com',                        // ZDNet (tech enterprise global)
  'crn.com',                          // CRN (channel/IT resellers global)
  'computerworld.com',                // Computerworld (global tech)
  'techrepublic.com',                 // TechRepublic (enterprise tech)
  'infoworld.com',                    // InfoWorld (IT enterprise)
  'enterprisetech.com',               // EnterpriseTech (enterprise)
  'diginomica.com'                    // Diginomica (enterprise software)
];

// 🌍 GRUPO 5: VÍDEO & CONTEÚDO GLOBAL (3 fontes)
const GLOBAL_VIDEO_SOURCES = [
  'youtube.com',                      // YouTube (global - cases, depoimentos, eventos)
  'vimeo.com',                        // Vimeo (global - conteúdo corporativo premium)
  'slideshare.net'                    // SlideShare (global - apresentações B2B)
];

// 🌍 GRUPO 6: REDES SOCIAIS B2B (3 fontes)
const GLOBAL_SOCIAL_SOURCES = [
  'twitter.com',                      // Twitter/X (anúncios corporativos, breaking news)
  'crunchbase.com',                   // Crunchbase (funding, acquisitions - site público)
  'reddit.com/r/business'             // Reddit Business (discussões B2B)
];

// 🌍 GRUPO 7: BUSINESS INTELLIGENCE & DATA (4 fontes)
const GLOBAL_BI_SOURCES = [
  'dnb.com',                          // 🆕 Dun & Bradstreet (referência global em dados empresariais)
  'pitchbook.com',                    // PitchBook (funding/PE data - referência)
  'cbinsights.com',                   // CB Insights (market intelligence)
  'angellist.com'                     // AngelList (startups/investimentos)
];

// Total: 8 + 10 + 11 + 8 + 3 + 3 + 4 = 47 fontes globais ✅

// 🔍 QUERIES ESPECÍFICAS POR TIPO DE SINAL (FASE 2: Buscas Específicas)

// 🌟 EXPANSION SIGNALS - Queries específicas para detectar expansão
const EXPANSION_SIGNALS_QUERIES = (companyName: string) => [
  `"${companyName}" opening new office OR expanding to`,
  `"${companyName}" acquired OR acquisition OR merger`,
  `"${companyName}" funding round OR investment received`,
  `"${companyName}" new location OR new branch`,
  `"${companyName}" international expansion OR global expansion`,
  `"${companyName}" strategic partnership OR joint venture`
];

// 🛒 PROCUREMENT SIGNALS - Queries específicas para detectar procurement
const PROCUREMENT_SIGNALS_QUERIES = (companyName: string) => [
  `"${companyName}" RFP OR "request for proposal" OR tender OR bid`,
  `"${companyName}" seeking supplier OR looking for vendor`,
  `"${companyName}" "purchasing manager" OR "procurement specialist" hiring`,
  `"${companyName}" need for equipment OR seeking distributor`,
  `"${companyName}" "supply chain" expansion OR "logistics" expansion`,
  `"${companyName}" "budget approved" OR "procurement budget"`
];

// 💼 HIRING SIGNALS - Queries específicas para detectar hiring
const HIRING_SIGNALS_QUERIES = (companyName: string) => [
  `"${companyName}" hiring 10+ OR "mass hiring" OR "hiring spree"`,
  `"${companyName}" "supply chain director" OR "purchasing manager" OR "procurement" job`,
  `"${companyName}" warehouse OR logistics OR distribution hiring`,
  `"${companyName}" international sales OR export manager hiring`,
  `"${companyName}" "hiring" ("50+" OR "100+") employees`,
  `"${companyName}" "job openings" OR "career opportunities" expansion`
];

// 📈 GROWTH SIGNALS - Queries específicas para detectar crescimento
const GROWTH_SIGNALS_QUERIES = (companyName: string) => [
  `"${companyName}" revenue growth OR increased revenue`,
  `"${companyName}" "new product line" OR product expansion`,
  `"${companyName}" annual report OR financial results`,
  `"${companyName}" "increased sales" OR market expansion`,
  `"${companyName}" "quarterly results" growth`,
  `"${companyName}" "announces" expansion OR growth`
];

// 🏪 PRODUCT FIT SIGNALS - Queries específicas para detectar dealers/distribuidores
const PRODUCT_FIT_SIGNALS_QUERIES = (companyName: string, tenantProducts?: string[]) => {
  const baseQueries = [
    `"${companyName}" distributor OR dealer OR importer`,
    `"${companyName}" "looking for" OR "seeking" OR "need for" products`,
    `"${companyName}" B2B OR wholesale OR trade OR import OR export`,
    `"${companyName}" "supply chain" OR "distribution network"`
  ];
  
  // Se produtos do tenant foram fornecidos, adicionar queries específicas
  if (tenantProducts && tenantProducts.length > 0) {
    const productQueries = tenantProducts
      .slice(0, 3) // Limitar a 3 produtos para não exceder limite de queries
      .map(product => `"${companyName}" "${product}" OR "${product.toLowerCase()}"`);
    baseQueries.push(...productQueries);
  }
  
  return baseQueries;
};

// 🎯 PESOS DAS FONTES (ajustados para mercado internacional)
const SOURCE_WEIGHTS = {
  job_portals: 70,
  official_sources: 100,        // Máxima confiabilidade
  news_premium: 85,             // Bloomberg, Reuters, FT, WSJ
  tech_portals: 80,             // CIO, ZDNet, CRN
  video_content: 75,            // YouTube, Vimeo
  social_b2b: 70,               // LinkedIn, Twitter, Crunchbase
  bi_sources: 90                // D&B, PitchBook, CB Insights (alta confiabilidade)
};

// 🔍 BUSCA EM MÚLTIPLOS PORTAIS (função auxiliar modular - FASE 2: Buscas Específicas)
async function searchMultiplePortals(params: {
  portals: string[];
  companyName: string;
  serperKey: string;
  sourceType: string;
  sourceWeight: number;
  dateRestrict?: string;
  queryTemplate?: string;
}): Promise<any[]> {
  const { 
    portals, 
    companyName, 
    serperKey, 
    sourceType, 
    sourceWeight, 
    dateRestrict = 'y1', // Padrão: últimos 12 meses (mais relevante)
    queryTemplate = `site:{portal} "${companyName}"`
  } = params;
  
  const evidencias: any[] = [];
  let processedPortals = 0;
  
  // Se queryTemplate não contém {portal}, é uma query específica (não precisa de site:)
  const isSpecificQuery = !queryTemplate.includes('{portal}');
  
  console.log(`[SCI-MULTI-PORTAL] 🔍 Buscando em ${portals.length} portais (${sourceType})...`);
  console.log(`[SCI-MULTI-PORTAL] 📅 Filtro de data: últimos ${dateRestrict.replace('y', '')} anos`);
  console.log(`[SCI-MULTI-PORTAL] 🔍 Query específica: ${isSpecificQuery ? 'SIM' : 'NÃO'}`);
  
  for (const portal of portals) {
    try {
      let query: string;
      
      if (isSpecificQuery) {
        // Query específica: adicionar site: apenas se query não tiver site: já
        if (queryTemplate.includes('site:')) {
          query = queryTemplate.replace('{companyName}', companyName);
        } else {
          // Adicionar site: ao início da query específica para focar no portal
          query = `site:${portal} ${queryTemplate.replace('{companyName}', companyName)}`;
        }
      } else {
        // Query genérica: substituir template
        query = queryTemplate
          .replace('{portal}', portal)
          .replace('{companyName}', companyName);
      }
      
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 
          'X-API-KEY': serperKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          q: query,
          num: 10, // Top 10 por portal/query
          gl: 'us', // Global (não mais 'br')
          hl: 'en', // Inglês (não mais 'pt-br')
          tbs: `qdr:${dateRestrict}`, // Filtro de data (mais restritivo)
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];
        processedPortals++;
        
        console.log(`[SCI-MULTI-PORTAL] 📊 ${portal}: ${results.length} resultados (query: ${query.substring(0, 80)}...)`);
        
        for (const result of results) {
          evidencias.push({
            title: result.title || '',
            snippet: result.snippet || '',
            link: result.link || '',
            source: portal,
            source_type: sourceType,
            source_weight: sourceWeight,
            date: result.date || null,
            position: result.position || null,
            query_used: query // Adicionar query usada para debug
          });
        }
      } else {
        console.error(`[SCI-MULTI-PORTAL] ❌ Erro em ${portal}: ${response.status}`);
      }
      
      // Rate limiting: pequeno delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[SCI-MULTI-PORTAL] ❌ Erro ao buscar ${portal}:`, error);
    }
  }
  
  console.log(`[SCI-MULTI-PORTAL] ✅ Processados ${processedPortals}/${portals.length} portais`);
  return evidencias;
}

// 🔍 EXTRAÇÃO DE SINAIS DAS EVIDÊNCIAS
interface Signal {
  type: string;
  description: string;
  source: string;
  url: string;
  relevance: 'high' | 'medium' | 'low';
  date?: string;
}

interface SignalsDetected {
  expansion: Signal[];
  procurement: Signal[];
  hiring: Signal[];
  growth: Signal[];
  product_fit: Signal[];
}

function extractSignalsFromEvidences(evidencias: any[], companyName: string): SignalsDetected {
  const signals: SignalsDetected = {
    expansion: [],
    procurement: [],
    hiring: [],
    growth: [],
    product_fit: []
  };

  // Keywords para detectar sinais de expansão
  const expansionKeywords = [
    'opening new office', 'expanding to', 'new location', 'new branch',
    'acquired', 'acquisition', 'merger', 'funding round', 'investment received',
    'international expansion', 'global expansion', 'strategic partnership', 'joint venture'
  ];

  // Keywords para detectar sinais de procurement
  const procurementKeywords = [
    'rfp', 'request for proposal', 'tender', 'bid', 'seeking supplier',
    'looking for vendor', 'need for equipment', 'purchasing manager',
    'procurement specialist', 'supply chain director', 'looking for distributor'
  ];

  // Keywords para detectar sinais de hiring
  const hiringKeywords = [
    'hiring 10+', 'mass hiring', 'hiring spree', 'warehouse hiring',
    'logistics hiring', 'distribution hiring', 'international sales hiring',
    'export manager hiring', 'supply chain manager hiring', 'procurement hiring'
  ];

  // Keywords para detectar sinais de crescimento
  const growthKeywords = [
    'revenue growth', 'increased revenue', 'expansion announcement',
    'new product line', 'product expansion', 'annual report',
    'financial results', 'increased sales', 'market expansion'
  ];

  // Keywords para detectar sinais de product fit (dealers/distributors)
  const productFitKeywords = [
    'distributor', 'dealer', 'importer', 'wholesale', 'b2b',
    'looking for products', 'seeking products', 'need for products',
    'trade', 'import', 'export', 'supply chain'
  ];

  for (const evidence of evidencias) {
    const text = `${evidence.title || ''} ${evidence.snippet || ''}`.toLowerCase();
    const url = evidence.link || evidence.url || '';
    const source = evidence.source || evidence.source_type || 'unknown';

    // Expansion signals
    if (expansionKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      signals.expansion.push({
        type: 'expansion',
        description: evidence.title || evidence.snippet?.substring(0, 150) || 'Expansion signal detected',
        source,
        url,
        relevance: evidence.source_weight >= 90 ? 'high' : (evidence.source_weight >= 70 ? 'medium' : 'low'),
        date: evidence.date || null
      });
    }

    // Procurement signals
    if (procurementKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      signals.procurement.push({
        type: 'procurement',
        description: evidence.title || evidence.snippet?.substring(0, 150) || 'Procurement signal detected',
        source,
        url,
        relevance: evidence.source_weight >= 90 ? 'high' : (evidence.source_weight >= 70 ? 'medium' : 'low'),
        date: evidence.date || null
      });
    }

    // Hiring signals
    if (hiringKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      signals.hiring.push({
        type: 'hiring',
        description: evidence.title || evidence.snippet?.substring(0, 150) || 'Hiring signal detected',
        source,
        url,
        relevance: evidence.source_weight >= 90 ? 'high' : (evidence.source_weight >= 70 ? 'medium' : 'low'),
        date: evidence.date || null
      });
    }

    // Growth signals
    if (growthKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      signals.growth.push({
        type: 'growth',
        description: evidence.title || evidence.snippet?.substring(0, 150) || 'Growth signal detected',
        source,
        url,
        relevance: evidence.source_weight >= 90 ? 'high' : (evidence.source_weight >= 70 ? 'medium' : 'low'),
        date: evidence.date || null
      });
    }

    // Product fit signals (dealers/distributors)
    if (productFitKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      signals.product_fit.push({
        type: 'product_fit',
        description: evidence.title || evidence.snippet?.substring(0, 150) || 'Product fit signal detected',
        source,
        url,
        relevance: evidence.source_weight >= 90 ? 'high' : (evidence.source_weight >= 70 ? 'medium' : 'low'),
        date: evidence.date || null
      });
    }
  }

  return signals;
}

// 🎯 CÁLCULO DE SCORE BASEADO EM SINAIS
function calculateLeadScore(
  signals: SignalsDetected,
  productFitScore: number
): {
  score: number;
  status: 'hot' | 'warm' | 'cold';
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  timeline_to_close: '30_days' | '60_days' | '90_days' | '120_days' | '180_days+';
  recommendation: string;
} {
  let score = 0;
  const reasons: string[] = [];

  // 1. Expansion Signals (0-25 pontos)
  const expansionHigh = signals.expansion.filter(s => s.relevance === 'high').length;
  const expansionMedium = signals.expansion.filter(s => s.relevance === 'medium').length;
  if (expansionHigh >= 2) {
    score += 25;
    reasons.push(`${expansionHigh} sinais fortes de expansão (novos escritórios, aquisições, funding)`);
  } else if (expansionHigh >= 1 || expansionMedium >= 2) {
    score += 15;
    reasons.push(`${expansionHigh + expansionMedium} sinais de expansão`);
  } else if (signals.expansion.length > 0) {
    score += 5;
    reasons.push(`${signals.expansion.length} menção(ões) de expansão`);
  }

  // 2. Procurement Signals (0-25 pontos)
  const procurementHigh = signals.procurement.filter(s => s.relevance === 'high').length;
  const procurementMedium = signals.procurement.filter(s => s.relevance === 'medium').length;
  if (procurementHigh >= 2) {
    score += 25;
    reasons.push(`${procurementHigh} sinais fortes de procurement (RFP, busca por fornecedores)`);
  } else if (procurementHigh >= 1 || procurementMedium >= 2) {
    score += 15;
    reasons.push(`${procurementHigh + procurementMedium} sinais de procurement`);
  } else if (signals.procurement.length > 0) {
    score += 5;
    reasons.push(`${signals.procurement.length} menção(ões) de procurement`);
  }

  // 3. Hiring Signals (0-20 pontos)
  const hiringHigh = signals.hiring.filter(s => s.relevance === 'high').length;
  const hiringMedium = signals.hiring.filter(s => s.relevance === 'medium').length;
  const totalHiring = signals.hiring.length;
  if (totalHiring >= 5 || hiringHigh >= 2) {
    score += 20;
    reasons.push(`${totalHiring} vagas relevantes (contratações em massa)`);
  } else if (totalHiring >= 3 || hiringHigh >= 1) {
    score += 12;
    reasons.push(`${totalHiring} vagas relevantes`);
  } else if (totalHiring > 0) {
    score += 5;
    reasons.push(`${totalHiring} vaga(s) relevante(s)`);
  }

  // 4. Growth Signals (0-15 pontos)
  const growthHigh = signals.growth.filter(s => s.relevance === 'high').length;
  const growthMedium = signals.growth.filter(s => s.relevance === 'medium').length;
  if (growthHigh >= 2) {
    score += 15;
    reasons.push(`${growthHigh} sinais fortes de crescimento`);
  } else if (growthHigh >= 1 || growthMedium >= 2) {
    score += 10;
    reasons.push(`${growthHigh + growthMedium} sinais de crescimento`);
  } else if (signals.growth.length > 0) {
    score += 5;
    reasons.push(`${signals.growth.length} menção(ões) de crescimento`);
  }

  // 5. Product Fit Score (0-15 pontos)
  if (productFitScore >= 70) {
    score += 15;
    reasons.push(`Product Fit Score de ${productFitScore}% (alto alinhamento com catálogo)`);
  } else if (productFitScore >= 40) {
    score += 10;
    reasons.push(`Product Fit Score de ${productFitScore}% (alinhamento moderado)`);
  } else if (productFitScore > 0) {
    score += 5;
    reasons.push(`Product Fit Score de ${productFitScore}% (alinhamento baixo)`);
  }

  // Garantir score entre 0-100
  score = Math.min(100, Math.max(0, score));

  // Determinar status
  let status: 'hot' | 'warm' | 'cold';
  let confidence: 'high' | 'medium' | 'low';
  let timeline_to_close: '30_days' | '60_days' | '90_days' | '120_days' | '180_days+';
  let recommendation: string;

  if (score >= 75) {
    status = 'hot';
    confidence = (expansionHigh >= 2 || procurementHigh >= 2) ? 'high' : 'medium';
    timeline_to_close = '30_days';
    recommendation = '🔥 ABORDAR HOJE - Oportunidade de alto valor com sinais claros de compra';
  } else if (score >= 40) {
    status = 'warm';
    confidence = (signals.expansion.length + signals.procurement.length >= 3) ? 'medium' : 'low';
    timeline_to_close = '60_days';
    recommendation = '🟡 ABORDAR ESTA SEMANA - Oportunidade válida com abordagem estruturada';
  } else {
    status = 'cold';
    confidence = 'low';
    timeline_to_close = '90_days';
    recommendation = '🔵 NUTRIÇÃO/SEGUIMENTO - Manter no radar, focar em educação e relacionamento';
  }

  // Gerar explicação
  const explanation = reasons.length > 0
    ? `Empresa classificada como ${status.toUpperCase()} devido a: ${reasons.join(', ')}. ${recommendation}`
    : `Empresa classificada como ${status.toUpperCase()} devido à ausência de sinais de expansão, procurement ou hiring nos últimos 12 meses. ${recommendation}`;

  return {
    score,
    status,
    confidence,
    explanation,
    timeline_to_close,
    recommendation
  };
}

// 🎯 CÁLCULO DE SCORES (adaptado para SCI)
function calculateCompanyHealthScore(evidencias: any[]): {
  overall_score: number;
  activity_score: number;
  growth_score: number;
  stability_score: number;
  international_score: number;
} {
  // Lógica de cálculo baseada nas evidências
  // TODO: Implementar lógica completa de scoring
  
  return {
    overall_score: 0,
    activity_score: 0,
    growth_score: 0,
    stability_score: 0,
    international_score: 0
  };
}

// 📦 PRODUCT FIT ANALYSIS (integração com tenant_products)
async function calculateProductFit(
  supabase: any,
  tenantId: string,
  company: { industry?: string; size?: string; needs?: string[] }
): Promise<{
  tenant_catalog_products: any[];
  matching_products: any[];
  fit_score: number;
  recommendations: string[];
}> {
  // Buscar produtos do tenant
  const { data: tenantProducts } = await supabase
    .from('tenant_products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('category', { ascending: true });
  
  if (!tenantProducts || tenantProducts.length === 0) {
    return {
      tenant_catalog_products: [],
      matching_products: [],
      fit_score: 0,
      recommendations: ['Nenhum produto cadastrado no catálogo do tenant']
    };
  }
  
  // TODO: Implementar lógica de matching baseada em:
  // - Industry alignment
  // - Company size
  // - Expressed needs
  // - Product categories
  
  const matching_products = tenantProducts.map((product: any) => ({
    product_id: product.id,
    product_name: product.name,
    match_score: 50, // Placeholder
    fit_reasons: [],
    potential_quantity: null,
    estimated_value: null
  }));
  
  return {
    tenant_catalog_products: tenantProducts,
    matching_products,
    fit_score: 50, // Placeholder
    recommendations: []
  };
}

// 🚀 FUNÇÃO PRINCIPAL
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[SCI] 🚀 Iniciando Strategic Commercial Intelligence...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Tenta SERPER_API_KEY primeiro, depois VITE_SERPER_API_KEY como fallback
    const serperKey = Deno.env.get('SERPER_API_KEY') || Deno.env.get('VITE_SERPER_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body = await req.json();
    const { company_id, company_name, domain, tenant_id } = body;

    if (!company_name) {
      return new Response(
        JSON.stringify({ error: 'company_name é obrigatório', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!serperKey) {
      console.error('[SCI] ❌ SERPER_API_KEY não configurada!');
      return new Response(
        JSON.stringify({ 
          error: 'SERPER_API_KEY não configurada',
          status: 'error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SCI] ✅ Serper API Key OK, iniciando busca em 47 fontes globais...');
    console.log('[SCI] 🎯 Empresa:', company_name);
    console.log('[SCI] 🏢 Tenant ID:', tenant_id);

    const evidencias: any[] = [];
    let sourcesConsulted = 0;
    let totalQueries = 0;

    // 📦 Buscar produtos do tenant para Product Fit Analysis
    let tenantProducts: any[] = [];
    if (tenant_id) {
      const { data: products } = await supabase
        .from('tenant_products')
        .select('name, category')
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .limit(10);
      tenantProducts = products || [];
    }

    // 🔍 FASE 1: EXPANSION SIGNALS (Queries Específicas)
    console.log('[SCI] 🔍 FASE 1: Buscando Expansion Signals...');
    const expansionQueries = EXPANSION_SIGNALS_QUERIES(company_name);
    for (const query of expansionQueries) {
      const expansionEvidences = await searchMultiplePortals({
        portals: [...GLOBAL_NEWS_SOURCES.slice(0, 5), ...GLOBAL_BI_SOURCES], // Priorizar Bloomberg, Reuters, D&B
        companyName: company_name,
        serperKey,
        sourceType: 'news_premium',
        sourceWeight: SOURCE_WEIGHTS.news_premium,
        dateRestrict: 'y1', // Últimos 12 meses (mais relevante)
        queryTemplate: query // Query específica de expansão
      });
      evidencias.push(...expansionEvidences);
      totalQueries += expansionQueries.length * 5; // 5 fontes priorizadas por query
    }
    sourcesConsulted += 5; // Bloomberg, Reuters, FT, WSJ, D&B
    console.log(`[SCI] ✅ FASE 1: ${evidencias.filter(e => e.source_type === 'news_premium').length} evidências de Expansion Signals`);

    // 🛒 FASE 2: PROCUREMENT SIGNALS (Queries Específicas)
    console.log('[SCI] 🛒 FASE 2: Buscando Procurement Signals...');
    const procurementQueries = PROCUREMENT_SIGNALS_QUERIES(company_name);
    for (const query of procurementQueries) {
      const procurementEvidences = await searchMultiplePortals({
        portals: [...GLOBAL_JOB_PORTALS.slice(0, 3), ...GLOBAL_NEWS_SOURCES.slice(0, 2)], // LinkedIn, Indeed, Bloomberg, Reuters
        companyName: company_name,
        serperKey,
        sourceType: 'job_portals',
        sourceWeight: SOURCE_WEIGHTS.job_portals,
        dateRestrict: 'y1', // Últimos 12 meses
        queryTemplate: query // Query específica de procurement
      });
      evidencias.push(...procurementEvidences);
      totalQueries += procurementQueries.length * 5;
    }
    sourcesConsulted += 5;
    console.log(`[SCI] ✅ FASE 2: ${evidencias.filter(e => e.source_type === 'job_portals').length} evidências de Procurement Signals`);

    // 💼 FASE 3: HIRING SIGNALS (Queries Específicas)
    console.log('[SCI] 💼 FASE 3: Buscando Hiring Signals...');
    const hiringQueries = HIRING_SIGNALS_QUERIES(company_name);
    for (const query of hiringQueries) {
      const hiringEvidences = await searchMultiplePortals({
        portals: GLOBAL_JOB_PORTALS, // Todos os job portals
        companyName: company_name,
        serperKey,
        sourceType: 'job_portals',
        sourceWeight: SOURCE_WEIGHTS.job_portals,
        dateRestrict: 'y1', // Últimos 12 meses
        queryTemplate: query // Query específica de hiring
      });
      evidencias.push(...hiringEvidences);
      totalQueries += hiringQueries.length * GLOBAL_JOB_PORTALS.length;
    }
    sourcesConsulted += GLOBAL_JOB_PORTALS.length;
    console.log(`[SCI] ✅ FASE 3: ${evidencias.filter(e => e.source_type === 'job_portals').length} evidências de Hiring Signals`);

    // 📈 FASE 4: GROWTH SIGNALS (Queries Específicas)
    console.log('[SCI] 📈 FASE 4: Buscando Growth Signals...');
    const growthQueries = GROWTH_SIGNALS_QUERIES(company_name);
    for (const query of growthQueries) {
      const growthEvidences = await searchMultiplePortals({
        portals: [...GLOBAL_NEWS_SOURCES.slice(0, 5), ...GLOBAL_OFFICIAL_SOURCES.slice(0, 3)], // Bloomberg, Reuters, FT, WSJ, SEC
        companyName: company_name,
        serperKey,
        sourceType: 'news_premium',
        sourceWeight: SOURCE_WEIGHTS.news_premium,
        dateRestrict: 'y2', // Últimos 24 meses (resultados financeiros)
        queryTemplate: query // Query específica de crescimento
      });
      evidencias.push(...growthEvidences);
      totalQueries += growthQueries.length * 8;
    }
    sourcesConsulted += 8;
    console.log(`[SCI] ✅ FASE 4: ${evidencias.filter(e => e.source_type === 'news_premium').length} evidências de Growth Signals`);

    // 🏪 FASE 5: PRODUCT FIT SIGNALS (Queries Específicas)
    console.log('[SCI] 🏪 FASE 5: Buscando Product Fit Signals...');
    const productFitQueries = PRODUCT_FIT_SIGNALS_QUERIES(company_name, tenantProducts.map(p => p.name));
    for (const query of productFitQueries) {
      const productFitEvidences = await searchMultiplePortals({
        portals: [...GLOBAL_SOCIAL_SOURCES, ...GLOBAL_BI_SOURCES.slice(0, 2)], // LinkedIn, Twitter, Crunchbase, D&B
        companyName: company_name,
        serperKey,
        sourceType: 'social_b2b',
        sourceWeight: SOURCE_WEIGHTS.social_b2b,
        dateRestrict: 'y1', // Últimos 12 meses
        queryTemplate: query // Query específica de product fit
      });
      evidencias.push(...productFitEvidences);
      totalQueries += productFitQueries.length * 5;
    }
    sourcesConsulted += 5;
    console.log(`[SCI] ✅ FASE 5: ${evidencias.filter(e => e.source_type === 'social_b2b').length} evidências de Product Fit Signals`);

    // 🌍 FASE 6: BUSCA GENÉRICA COMPLEMENTAR (Fontes restantes - menor prioridade)
    console.log('[SCI] 🌍 FASE 6: Busca genérica complementar em fontes restantes...');
    const evidenciasJobPortalsGeneric = await searchMultiplePortals({
      portals: GLOBAL_JOB_PORTALS.slice(3), // Job portals não usados nas fases anteriores
      companyName: company_name,
      serperKey,
      sourceType: 'job_portals',
      sourceWeight: SOURCE_WEIGHTS.job_portals,
      dateRestrict: 'y5',
      queryTemplate: `site:{portal} "{companyName}"`
    });
    evidencias.push(...evidenciasJobPortalsGeneric);
    sourcesConsulted += GLOBAL_JOB_PORTALS.slice(3).length;
    totalQueries += GLOBAL_JOB_PORTALS.slice(3).length;


    // 📊 CÁLCULO DE SCORES
    const companyHealth = calculateCompanyHealthScore(evidencias);

    // 📦 PRODUCT FIT ANALYSIS (se tenant_id fornecido)
    let productFit = {
      tenant_catalog_products: [] as any[],
      matching_products: [] as any[],
      fit_score: 0,
      recommendations: [] as string[]
    };

    if (tenant_id) {
      console.log('[SCI] 📦 Calculando Product Fit Analysis com tenant_products...');
      productFit = await calculateProductFit(supabase, tenant_id, {
        industry: undefined, // TODO: obter da empresa
        size: undefined,
        needs: []
      });
    }

    // 🔍 EXTRAIR SINAIS DAS EVIDÊNCIAS
    console.log('[SCI] 🔍 Extraindo sinais das evidências...');
    const signals = extractSignalsFromEvidences(evidencias, company_name);
    console.log('[SCI] ✅ Sinais extraídos:', {
      expansion: signals.expansion.length,
      procurement: signals.procurement.length,
      hiring: signals.hiring.length,
      growth: signals.growth.length,
      product_fit: signals.product_fit.length
    });

    // 🎯 CALCULAR SCORE E CLASSIFICAÇÃO BASEADO EM SINAIS
    console.log('[SCI] 🎯 Calculando score e classificação...');
    const classification = calculateLeadScore(signals, productFit.fit_score);
    console.log('[SCI] ✅ Classificação:', classification.status, 'Score:', classification.score);

    // ⏳ INTERNATIONAL TRADE (estrutura pronta - desabilitada até contrato MetaLife)
    const internationalTrade = {
      enabled: false,
      note: 'Aguardando contrato MetaLife para ativar Panjiva API'
      // Estrutura pronta para Panjiva quando tiver contrato:
      // import_history: {...},
      // export_history: {...},
      // trade_patterns: {...}
    };

    // 🎯 ESTRUTURA DE RESPOSTA MELHORADA
    const resultado = {
      // 1. CLASSIFICAÇÃO PRINCIPAL (NOVO - FASE 1)
      classification: {
        status: classification.status,
        score: classification.score,
        confidence: classification.confidence,
        explanation: classification.explanation,
        signals_detected: {
          expansion: signals.expansion,
          procurement: signals.procurement,
          hiring: signals.hiring,
          growth: signals.growth,
          product_fit: signals.product_fit
        },
        timeline_to_close: classification.timeline_to_close,
        recommendation: classification.recommendation
      },

      // 2. Company Health Score
      company_health: companyHealth,
      
      // 3. Expansion Signals (EXTRAÍDO DAS EVIDÊNCIAS)
      expansion_signals: {
        detected: signals.expansion.length > 0,
        signals: signals.expansion,
        new_offices: signals.expansion.filter(s => s.description.toLowerCase().includes('office') || s.description.toLowerCase().includes('location')).map(s => ({
          description: s.description,
          source: s.source,
          url: s.url,
          date: s.date
        })),
        mass_hiring: {
          detected: signals.hiring.length >= 5,
          positions: signals.hiring.map(s => s.description),
          volume: signals.hiring.length,
          source: signals.hiring.map(s => s.source).join(', ')
        },
        partnerships: signals.expansion.filter(s => s.description.toLowerCase().includes('partnership') || s.description.toLowerCase().includes('joint venture')),
        funding_rounds: signals.expansion.filter(s => s.description.toLowerCase().includes('funding') || s.description.toLowerCase().includes('investment')),
        evidence: evidencias.filter(e => e.source_type === 'news_premium' || e.source_type === 'bi_sources')
      },
      
      // 4. Procurement Readiness (EXTRAÍDO DAS EVIDÊNCIAS)
      procurement_readiness: {
        detected: signals.procurement.length > 0,
        budget_signals: {
          detected: signals.procurement.length >= 2,
          confidence: signals.procurement.filter(s => s.relevance === 'high').length >= 2 ? 'high' as const : 
                      signals.procurement.length >= 2 ? 'medium' as const : 'low' as const,
          evidence: signals.procurement
        },
        rfp_opportunities: signals.procurement.filter(s => s.description.toLowerCase().includes('rfp') || s.description.toLowerCase().includes('tender') || s.description.toLowerCase().includes('bid')),
        expressed_needs: signals.procurement.filter(s => s.description.toLowerCase().includes('need') || s.description.toLowerCase().includes('looking for') || s.description.toLowerCase().includes('seeking')),
        evidence: signals.procurement
      },
      
      // 5. International Trade (desabilitada)
      international_trade: internationalTrade,
      
      // 6. Product Fit Analysis
      product_fit: productFit,
      
      // 7. Status Final (COMPATIBILIDADE COM FORMATO ANTIGO)
      status: classification.status === 'hot' ? 'warm_prospect' : classification.status === 'warm' ? 'warm_prospect' : 'cold_lead',
      confidence: classification.confidence,
      recommendation: classification.recommendation,
      estimated_revenue_potential: 0, // TODO
      timeline_to_close: classification.timeline_to_close,
      
      // Metadata
      analyzed_at: new Date().toISOString(),
      sources_checked: sourcesConsulted,
      total_evidences: evidencias.length,
      evidences: evidencias,
      execution_time: `${Date.now() - startTime}ms`
    };

    console.log(`[SCI] ✅ Análise concluída: ${evidencias.length} evidências de ${sourcesConsulted} fontes globais`);

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SCI] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        status: 'error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
