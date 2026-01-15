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

// 🔍 QUERIES ADAPTADAS PARA MERCADO INTERNACIONAL (sem TOTVS)
const COMPANY_HEALTH_QUERIES = (companyName: string) => [
  `"${companyName}" opening new office`,
  `"${companyName}" expanding to`,
  `"${companyName}" hiring 50+ employees`,
  `"${companyName}" bankruptcy OR closing`,
  `"${companyName}" acquired OR merger`,
  `"${companyName}" financial results`,
  `"${companyName}" annual report`
];

const EXPANSION_SIGNALS_QUERIES = (companyName: string) => [
  `"${companyName}" funding round`,
  `"${companyName}" strategic partnership`,
  `"${companyName}" joint venture`,
  `"${companyName}" new location`,
  `"${companyName}" expansion announcement`,
  `"${companyName}" investment received`
];

const PROCUREMENT_READINESS_QUERIES = (companyName: string) => [
  `"${companyName}" budget approved for`,
  `"${companyName}" RFP procurement`,
  `"${companyName}" seeking supplier`,
  `"${companyName}" need for equipment`,
  `"${companyName}" looking for vendor`,
  `"${companyName}" tender OR bid`
];

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

// 🔍 BUSCA EM MÚLTIPLOS PORTAIS (função auxiliar modular)
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
    dateRestrict = 'y5',
    queryTemplate = `site:{portal} "{companyName}"`
  } = params;
  
  const evidencias: any[] = [];
  let processedPortals = 0;
  
  console.log(`[SCI-MULTI-PORTAL] 🔍 Buscando em ${portals.length} portais (${sourceType})...`);
  console.log(`[SCI-MULTI-PORTAL] 📅 Filtro de data: últimos ${dateRestrict.replace('y', '')} anos`);
  
  for (const portal of portals) {
    try {
      // Substituir template com portal e company name
      const query = queryTemplate
        .replace('{portal}', portal)
        .replace('{companyName}', companyName);
      
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 
          'X-API-KEY': serperKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          q: query,
          num: 10, // Top 10 por portal
          gl: 'us', // Global (não mais 'br')
          hl: 'en', // Inglês (não mais 'pt-br')
          tbs: `qdr:${dateRestrict}`, // Filtro de data
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];
        processedPortals++;
        
        console.log(`[SCI-MULTI-PORTAL] 📊 ${portal}: ${results.length} resultados`);
        
        for (const result of results) {
          evidencias.push({
            title: result.title || '',
            snippet: result.snippet || '',
            link: result.link || '',
            source: portal,
            source_type: sourceType,
            source_weight: sourceWeight,
            date: result.date || null,
            position: result.position || null
          });
        }
      } else {
        console.error(`[SCI-MULTI-PORTAL] ❌ Erro em ${portal}: ${response.status}`);
      }
    } catch (error) {
      console.error(`[SCI-MULTI-PORTAL] ❌ Erro ao buscar ${portal}:`, error);
    }
  }
  
  console.log(`[SCI-MULTI-PORTAL] ✅ Processados ${processedPortals}/${portals.length} portais`);
  return evidencias;
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

    // 🌍 FASE 1: JOB PORTALS GLOBAIS (8 fontes)
    console.log('[SCI] 🌍 FASE 1: Buscando em Job Portals Globais...');
    const evidenciasJobPortals = await searchMultiplePortals({
      portals: GLOBAL_JOB_PORTALS,
      companyName: company_name,
      serperKey,
      sourceType: 'job_portals',
      sourceWeight: SOURCE_WEIGHTS.job_portals,
      dateRestrict: 'y5',
      queryTemplate: `site:{portal} "{companyName}"`
    });
    evidencias.push(...evidenciasJobPortals);
    sourcesConsulted += GLOBAL_JOB_PORTALS.length;
    totalQueries += GLOBAL_JOB_PORTALS.length;
    console.log(`[SCI] ✅ FASE 1: ${evidenciasJobPortals.length} evidências de Job Portals`);

    // 🌍 FASE 2: FONTES OFICIAIS INTERNACIONAIS (10 fontes)
    console.log('[SCI] 🌍 FASE 2: Buscando em Fontes Oficiais Internacionais...');
    const evidenciasOficiais = await searchMultiplePortals({
      portals: GLOBAL_OFFICIAL_SOURCES,
      companyName: company_name,
      serperKey,
      sourceType: 'official_sources',
      sourceWeight: SOURCE_WEIGHTS.official_sources,
      dateRestrict: 'y6',
      queryTemplate: `site:{portal} "{companyName}"`
    });
    evidencias.push(...evidenciasOficiais);
    sourcesConsulted += GLOBAL_OFFICIAL_SOURCES.length;
    totalQueries += GLOBAL_OFFICIAL_SOURCES.length;
    console.log(`[SCI] ✅ FASE 2: ${evidenciasOficiais.length} evidências oficiais`);

    // 🌍 FASE 3: NOTÍCIAS & FINANCEIRAS GLOBAIS (11 fontes)
    console.log('[SCI] 🌍 FASE 3: Buscando em Notícias & Financeiras Globais...');
    const evidenciasNews = await searchMultiplePortals({
      portals: GLOBAL_NEWS_SOURCES,
      companyName: company_name,
      serperKey,
      sourceType: 'news_premium',
      sourceWeight: SOURCE_WEIGHTS.news_premium,
      dateRestrict: 'y5',
      queryTemplate: `site:{portal} "{companyName}"`
    });
    evidencias.push(...evidenciasNews);
    sourcesConsulted += GLOBAL_NEWS_SOURCES.length;
    totalQueries += GLOBAL_NEWS_SOURCES.length;
    console.log(`[SCI] ✅ FASE 3: ${evidenciasNews.length} evidências de notícias`);

    // 🌍 FASE 4: PORTALS DE TECNOLOGIA GLOBAIS (8 fontes)
    console.log('[SCI] 🌍 FASE 4: Buscando em Portais de Tecnologia Globais...');
    const evidenciasTech = await searchMultiplePortals({
      portals: GLOBAL_TECH_PORTALS,
      companyName: company_name,
      serperKey,
      sourceType: 'tech_portals',
      sourceWeight: SOURCE_WEIGHTS.tech_portals,
      dateRestrict: 'y5',
      queryTemplate: `site:{portal} "{companyName}"`
    });
    evidencias.push(...evidenciasTech);
    sourcesConsulted += GLOBAL_TECH_PORTALS.length;
    totalQueries += GLOBAL_TECH_PORTALS.length;
    console.log(`[SCI] ✅ FASE 4: ${evidenciasTech.length} evidências de portais tech`);

    // 🌍 FASE 5: VÍDEO & CONTEÚDO GLOBAL (3 fontes)
    console.log('[SCI] 🌍 FASE 5: Buscando em Vídeo & Conteúdo Global...');
    const evidenciasVideo = await searchMultiplePortals({
      portals: GLOBAL_VIDEO_SOURCES,
      companyName: company_name,
      serperKey,
      sourceType: 'video_content',
      sourceWeight: SOURCE_WEIGHTS.video_content,
      dateRestrict: 'y5',
      queryTemplate: `site:{portal} "{companyName}"`
    });
    evidencias.push(...evidenciasVideo);
    sourcesConsulted += GLOBAL_VIDEO_SOURCES.length;
    totalQueries += GLOBAL_VIDEO_SOURCES.length;
    console.log(`[SCI] ✅ FASE 5: ${evidenciasVideo.length} evidências de vídeo`);

    // 🌍 FASE 6: REDES SOCIAIS B2B (3 fontes)
    console.log('[SCI] 🌍 FASE 6: Buscando em Redes Sociais B2B...');
    const evidenciasSocial = await searchMultiplePortals({
      portals: GLOBAL_SOCIAL_SOURCES,
      companyName: company_name,
      serperKey,
      sourceType: 'social_b2b',
      sourceWeight: SOURCE_WEIGHTS.social_b2b,
      dateRestrict: 'y5',
      queryTemplate: `site:{portal} "{companyName}"`
    });
    evidencias.push(...evidenciasSocial);
    sourcesConsulted += GLOBAL_SOCIAL_SOURCES.length;
    totalQueries += GLOBAL_SOCIAL_SOURCES.length;
    console.log(`[SCI] ✅ FASE 6: ${evidenciasSocial.length} evidências de redes sociais`);

    // 🌍 FASE 7: BUSINESS INTELLIGENCE & DATA (4 fontes - inclui D&B)
    console.log('[SCI] 🌍 FASE 7: Buscando em Business Intelligence & Data (inclui D&B)...');
    const evidenciasBI = await searchMultiplePortals({
      portals: GLOBAL_BI_SOURCES,
      companyName: company_name,
      serperKey,
      sourceType: 'bi_sources',
      sourceWeight: SOURCE_WEIGHTS.bi_sources,
      dateRestrict: 'y5',
      queryTemplate: `site:{portal} "{companyName}" company profile OR business information`
    });
    evidencias.push(...evidenciasBI);
    sourcesConsulted += GLOBAL_BI_SOURCES.length;
    totalQueries += GLOBAL_BI_SOURCES.length;
    console.log(`[SCI] ✅ FASE 7: ${evidenciasBI.length} evidências de BI (inclui D&B)`);

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

    // ⏳ INTERNATIONAL TRADE (estrutura pronta - desabilitada até contrato MetaLife)
    const internationalTrade = {
      enabled: false,
      note: 'Aguardando contrato MetaLife para ativar Panjiva API'
      // Estrutura pronta para Panjiva quando tiver contrato:
      // import_history: {...},
      // export_history: {...},
      // trade_patterns: {...}
    };

    // 🎯 STATUS FINAL (TODO: implementar lógica completa)
    const status = evidencias.length > 0 ? 'warm_prospect' : 'cold_lead';
    const confidence = Math.min(100, evidencias.length * 5); // Placeholder

    const resultado = {
      // 1. Company Health Score
      company_health: companyHealth,
      
      // 2. Expansion Signals (TODO: extrair das evidências)
      expansion_signals: {
        detected: false,
        new_offices: [],
        mass_hiring: {
          detected: false,
          positions: [],
          volume: 0,
          source: ''
        },
        partnerships: [],
        funding_rounds: [],
        evidence: evidencias.filter(e => e.source_type === 'news_premium' || e.source_type === 'bi_sources')
      },
      
      // 3. Procurement Readiness (TODO: extrair das evidências)
      procurement_readiness: {
        budget_signals: {
          detected: false,
          confidence: 'low' as 'high' | 'medium' | 'low',
          evidence: []
        },
        rfp_opportunities: [],
        expressed_needs: [],
        evidence: evidencias.filter(e => e.source_type === 'job_portals')
      },
      
      // 4. International Trade (desabilitada)
      international_trade: internationalTrade,
      
      // 5. Product Fit Analysis
      product_fit: productFit,
      
      // Status Final
      status,
      confidence,
      recommendation: `Company analyzed with ${evidencias.length} evidences from ${sourcesConsulted} global sources`,
      estimated_revenue_potential: 0, // TODO
      timeline_to_close: '90_days' as '30_days' | '60_days' | '90_days' | '120_days' | '180_days+',
      
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
