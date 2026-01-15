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

// 👥 D&B DECISORES/LEADERSHIP - Queries específicas para extrair dados de decisores da D&B
const DNB_LEADERSHIP_QUERIES = (companyName: string) => [
  `site:dnb.com "${companyName}" executives OR leadership OR management`,
  `site:dnb.com "${companyName}" CEO OR president OR founder OR owner`,
  `site:dnb.com "${companyName}" board of directors OR directors`,
  `site:dnb.com "${companyName}" decision makers OR key personnel`,
  `site:dnb.com "${companyName}" company profile leadership`,
  `site:dnb.com "${companyName}" officers OR principals OR partners`,
  `site:dnb.com "${companyName}" ownership structure OR shareholders`,
  `site:dnb.com "${companyName}" corporate structure OR management team`
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

// 👥 EXTRAIR DADOS D&B DE DECISORES/LEADERSHIP
function extractDNBLeadershipData(dnbEvidences: any[], companyName: string): {
  executives: Array<{ name: string; title: string; source: string; url: string }>;
  directors: Array<{ name: string; title: string; source: string; url: string }>;
  owners: Array<{ name: string; role: string; source: string; url: string }>;
  partners: Array<{ name: string; role: string; source: string; url: string }>;
  total_found: number;
  sources: string[];
} {
  const executives: Array<{ name: string; title: string; source: string; url: string }> = [];
  const directors: Array<{ name: string; title: string; source: string; url: string }> = [];
  const owners: Array<{ name: string; role: string; source: string; url: string }> = [];
  const partners: Array<{ name: string; role: string; source: string; url: string }> = [];
  const sources: string[] = [];

  // Extrair dados das evidências D&B
  for (const evidence of dnbEvidences) {
    if (!evidence.url?.includes('dnb.com')) continue;
    
    sources.push(evidence.url);
    const snippet = evidence.snippet || evidence.description || '';
    
    // Extrair nomes e títulos usando regex
    // Padrões: "John Smith, CEO" ou "President: Jane Doe" ou "John Smith - Director"
    const namePatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+),?\s*(?:is|serves as|President|CEO|CFO|COO|CTO|Founder|Owner|Director|Manager|VP|Vice President)/gi,
      /(President|CEO|CFO|COO|CTO|Founder|Owner|Director|Manager|VP|Vice President)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-\s]+\s*(President|CEO|CFO|COO|CTO|Founder|Owner|Director|Manager|VP|Vice President)/gi
    ];
    
    for (const pattern of namePatterns) {
      const matches = snippet.matchAll(pattern);
      for (const match of matches) {
        let name = '';
        let title = '';
        
        if (match[1] && match[2]) {
          // Padrão: "Title: Name" ou "Name, Title"
          if (/^(President|CEO|CFO|COO|CTO|Founder|Owner|Director|Manager|VP|Vice President)/i.test(match[1])) {
            title = match[1].trim();
            name = match[2].trim();
          } else {
            name = match[1].trim();
            title = match[2].trim();
          }
        } else if (match[1]) {
          // Apenas nome ou título
          if (/^(President|CEO|CFO|COO|CTO|Founder|Owner|Director|Manager|VP|Vice President)/i.test(match[1])) {
            title = match[1].trim();
          } else {
            name = match[1].trim();
          }
        }
        
        if (name && title && name.length > 3 && name.length < 50) {
          // Classificar por título
          const titleLower = title.toLowerCase();
          
          if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('chief executive')) {
            executives.push({ name, title, source: 'D&B', url: evidence.url });
          } else if (titleLower.includes('director') || titleLower.includes('board')) {
            directors.push({ name, title, source: 'D&B', url: evidence.url });
          } else if (titleLower.includes('founder') || titleLower.includes('owner')) {
            owners.push({ name, role: title, source: 'D&B', url: evidence.url });
          } else if (titleLower.includes('partner')) {
            partners.push({ name, role: title, source: 'D&B', url: evidence.url });
          } else {
            // Fallback: adicionar como executive
            executives.push({ name, title, source: 'D&B', url: evidence.url });
          }
        }
      }
    }
  }

  // Remover duplicatas (mesmo nome)
  const uniqueExecutives = Array.from(new Map(executives.map(e => [e.name, e])).values());
  const uniqueDirectors = Array.from(new Map(directors.map(d => [d.name, d])).values());
  const uniqueOwners = Array.from(new Map(owners.map(o => [o.name, o])).values());
  const uniquePartners = Array.from(new Map(partners.map(p => [p.name, p])).values());
  const uniqueSources = Array.from(new Set(sources));

  return {
    executives: uniqueExecutives,
    directors: uniqueDirectors,
    owners: uniqueOwners,
    partners: uniquePartners,
    total_found: uniqueExecutives.length + uniqueDirectors.length + uniqueOwners.length + uniquePartners.length,
    sources: uniqueSources
  };
}

// 🏪 DEALER ANALYSIS (FASE 4: Detectar dealers/distribuidores/importers)
function analyzeDealerType(
  companyData: any,
  companyName: string,
  evidencias: any[]
): {
  is_dealer: boolean;
  is_distributor: boolean;
  is_importer: boolean;
  business_model: string;
  distribution_reach: string;
  potential_value: number;
  explanation: string;
} {
  const description = companyData.description || companyData.raw_data?.description || '';
  const website = companyData.website || '';
  const b2bType = companyData.b2b_type || companyData.raw_data?.type || '';
  const country = companyData.country || 'unknown';
  const employees = companyData.employees || companyData.employees_count || 0;
  
  const textToAnalyze = `${description} ${website} ${b2bType} ${companyName}`.toLowerCase();

  // Keywords para detectar dealers/distribuidores
  const dealerKeywords = ['dealer', 'retailer', 'reseller', 'retail outlet', 'retail store'];
  const distributorKeywords = ['distributor', 'distribution', 'distribute', 'distributing', 'distribution network', 'distribution center'];
  const importerKeywords = ['importer', 'import', 'importing', 'imports', 'international trade', 'import export', 'import-export'];
  const wholesaleKeywords = ['wholesale', 'wholesaler', 'wholesaling', 'wholesale distributor', 'wholesale dealer'];
  const manufacturerKeywords = ['manufacturer', 'manufacturing', 'factory', 'producer', 'producing', 'make', 'makes'];

  // Detectar tipo de negócio
  const isDealer = dealerKeywords.some(k => textToAnalyze.includes(k)) || 
                   b2bType.toLowerCase().includes('dealer') ||
                   b2bType.toLowerCase().includes('retailer');
  
  const isDistributor = distributorKeywords.some(k => textToAnalyze.includes(k)) ||
                        wholesaleKeywords.some(k => textToAnalyze.includes(k)) ||
                        b2bType.toLowerCase().includes('distributor') ||
                        b2bType.toLowerCase().includes('wholesale');
  
  const isImporter = importerKeywords.some(k => textToAnalyze.includes(k)) ||
                     b2bType.toLowerCase().includes('importer') ||
                     b2bType.toLowerCase().includes('import');
  
  const isManufacturer = manufacturerKeywords.some(k => textToAnalyze.includes(k)) ||
                         b2bType.toLowerCase().includes('manufacturer') ||
                         b2bType.toLowerCase().includes('factory');

  // Determinar modelo de negócio principal
  let businessModel = 'unknown';
  if (isImporter) {
    businessModel = 'Importer';
  } else if (isDistributor) {
    businessModel = 'Distributor';
  } else if (isDealer) {
    businessModel = 'Dealer/Retailer';
  } else if (isManufacturer) {
    businessModel = 'Manufacturer';
  }

  // Determinar alcance de distribuição
  let distributionReach = 'unknown';
  const hasMultipleCountries = evidencias.some(e => 
    e.description?.toLowerCase().includes('international') ||
    e.description?.toLowerCase().includes('global') ||
    e.description?.toLowerCase().includes('worldwide')
  );

  const hasMultipleStates = evidencias.some(e => 
    e.description?.toLowerCase().includes('multiple locations') ||
    e.description?.toLowerCase().includes('nationwide') ||
    e.description?.toLowerCase().includes('across')
  );

  if (hasMultipleCountries || textToAnalyze.includes('international') || textToAnalyze.includes('global')) {
    distributionReach = 'International';
  } else if (hasMultipleStates || textToAnalyze.includes('nationwide') || textToAnalyze.includes('national')) {
    distributionReach = 'National';
  } else if (textToAnalyze.includes('regional') || country) {
    distributionReach = 'Regional';
  } else {
    distributionReach = 'Local';
  }

  // Estimar potencial de deal (baseado em tamanho, tipo e distribuição)
  let potentialValue = 0;
  
  if (isDealer || isDistributor || isImporter) {
    // Base: $10,000 para pequenos dealers
    potentialValue = 10000;
    
    // Ajustar por tamanho
    if (employees >= 500) {
      potentialValue *= 10; // $100,000 para grandes distribuidores
    } else if (employees >= 100) {
      potentialValue *= 5; // $50,000 para médios
    } else if (employees >= 50) {
      potentialValue *= 2; // $20,000 para pequenos-médios
    }
    
    // Ajustar por alcance
    if (distributionReach === 'International') {
      potentialValue *= 3; // $300,000 para distribuidores internacionais
    } else if (distributionReach === 'National') {
      potentialValue *= 2; // $200,000 para nacionais
    }
    
    // Bônus para importers (geralmente deals maiores)
    if (isImporter) {
      potentialValue *= 1.5; // 50% adicional para importers
    }
  }

  // Gerar explicação
  const explanations: string[] = [];
  
  if (isImporter) {
    explanations.push('Company is an importer (detected import/importing keywords in description/business type)');
  }
  if (isDistributor) {
    explanations.push('Company is a distributor (detected distribution/distributor keywords in description/business type)');
  }
  if (isDealer) {
    explanations.push('Company is a dealer/retailer (detected dealer/retailer keywords in description/business type)');
  }
  
  if (distributionReach !== 'unknown') {
    explanations.push(`Distribution reach: ${distributionReach}`);
  }
  
  if (potentialValue > 0) {
    explanations.push(`Estimated deal potential: $${potentialValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year`);
  }
  
  const explanation = explanations.length > 0 
    ? explanations.join('. ')
    : 'Business model analysis: Unable to determine dealer/distributor/importer status from available data';

  return {
    is_dealer: isDealer,
    is_distributor: isDistributor,
    is_importer: isImporter,
    business_model: businessModel,
    distribution_reach: distributionReach,
    potential_value: Math.round(potentialValue),
    explanation
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

// 📦 PRODUCT FIT ANALYSIS REAL (FASE 3: Implementação Completa)

// 1. Industry Alignment (0-30 pontos)
function calculateIndustryFit(
  companyIndustry: string | null | undefined,
  productIndustry: string | null | undefined,
  productCategories: string[]
): { score: number; explanation: string } {
  if (!companyIndustry || !productIndustry) {
    return {
      score: 0,
      explanation: 'Industry information not available for comparison'
    };
  }

  const companyIndustryLower = companyIndustry.toLowerCase();
  const productIndustryLower = productIndustry.toLowerCase();

  // Match exato: 30pts
  if (companyIndustryLower === productIndustryLower) {
    return {
      score: 30,
      explanation: `Perfect industry match: ${companyIndustry} = ${productIndustry}`
    };
  }

  // Keywords comuns: verificar overlap
  const companyKeywords = companyIndustryLower.split(/[\s,;|&]+/).filter(k => k.length > 3);
  const productKeywords = productIndustryLower.split(/[\s,;|&]+/).filter(k => k.length > 3);
  
  const commonKeywords = companyKeywords.filter(k => productKeywords.includes(k));
  
  if (commonKeywords.length >= 2) {
    return {
      score: 25,
      explanation: `Strong industry alignment: ${commonKeywords.length} common keywords (${commonKeywords.join(', ')})`
    };
  } else if (commonKeywords.length === 1) {
    return {
      score: 15,
      explanation: `Moderate industry alignment: 1 common keyword (${commonKeywords[0]})`
    };
  }

  // Verificar se categorias do produto mencionam indústria da empresa
  const categoriesMatch = productCategories.some(cat => 
    companyIndustryLower.includes(cat.toLowerCase()) || 
    cat.toLowerCase().includes(companyIndustryLower)
  );

  if (categoriesMatch) {
    return {
      score: 10,
      explanation: `Partial industry match: company industry matches product categories`
    };
  }

  return {
    score: 0,
    explanation: `No industry alignment: ${companyIndustry} ≠ ${productIndustry}`
  };
}

// 2. Company Size Fit (0-20 pontos)
function calculateSizeFit(
  companyEmployees: number | null | undefined,
  productTargetSize: string | null | undefined
): { score: number; explanation: string } {
  if (!companyEmployees || companyEmployees === 0) {
    return {
      score: 0,
      explanation: 'Company size information not available'
    };
  }

  if (!productTargetSize) {
    // Se produto não especifica tamanho, dar score médio
    return {
      score: 10,
      explanation: 'Product has no size restrictions (universal fit)'
    };
  }

  const sizeLower = productTargetSize.toLowerCase();
  
  // Definir ranges de tamanho
  let minEmployees = 0;
  let maxEmployees = Infinity;

  if (sizeLower.includes('enterprise') || sizeLower.includes('large')) {
    minEmployees = 250;
    maxEmployees = Infinity;
  } else if (sizeLower.includes('mid') || sizeLower.includes('medium')) {
    minEmployees = 50;
    maxEmployees = 500;
  } else if (sizeLower.includes('small') || sizeLower.includes('sme')) {
    minEmployees = 10;
    maxEmployees = 100;
  } else if (sizeLower.includes('startup') || sizeLower.includes('micro')) {
    minEmployees = 1;
    maxEmployees = 50;
  }

  if (companyEmployees >= minEmployees && companyEmployees <= maxEmployees) {
    return {
      score: 20,
      explanation: `Perfect size fit: ${companyEmployees} employees matches target (${productTargetSize})`
    };
  } else if (companyEmployees >= minEmployees * 0.5 && companyEmployees <= maxEmployees * 1.5) {
    return {
      score: 10,
      explanation: `Moderate size fit: ${companyEmployees} employees near target (${productTargetSize})`
    };
  }

  return {
    score: 0,
    explanation: `Size mismatch: ${companyEmployees} employees does not match target (${productTargetSize})`
  };
}

// 3. Product Category Match (0-30 pontos)
function calculateCategoryMatch(
  companyDescription: string | null | undefined,
  companyWebsite: string | null | undefined,
  productCategories: string[],
  productName: string
): { score: number; explanation: string } {
  if (!companyDescription && !companyWebsite) {
    return {
      score: 0,
      explanation: 'Company description and website not available for category matching'
    };
  }

  const textToSearch = `${companyDescription || ''} ${companyWebsite || ''}`.toLowerCase();
  const productNameLower = productName.toLowerCase();
  
  // Keywords relevantes para dealers/distribuidores
  const dealerKeywords = ['distributor', 'dealer', 'importer', 'wholesale', 'retailer', 'reseller', 'supplier', 'reseller'];
  const tradeKeywords = ['b2b', 'trade', 'import', 'export', 'supply chain', 'logistics', 'distribution'];
  const productKeywords = [...productCategories.map(c => c.toLowerCase()), ...productNameLower.split(' ')];
  
  let matchScore = 0;
  const matches: string[] = [];

  // Verificar se empresa é dealer/distribuidor
  const isDealer = dealerKeywords.some(keyword => textToSearch.includes(keyword));
  const hasTrade = tradeKeywords.some(keyword => textToSearch.includes(keyword));

  if (isDealer) {
    matchScore += 15;
    matches.push('dealer/distributor detected');
  }

  if (hasTrade) {
    matchScore += 10;
    matches.push('trade/B2B business detected');
  }

  // Verificar se categorias do produto aparecem na descrição
  const categoryMatches = productCategories.filter(cat => 
    textToSearch.includes(cat.toLowerCase())
  );

  if (categoryMatches.length > 0) {
    matchScore += Math.min(15, categoryMatches.length * 5);
    matches.push(`${categoryMatches.length} product category matches: ${categoryMatches.join(', ')}`);
  }

  // Verificar se nome do produto aparece
  const productNameWords = productNameLower.split(' ').filter(w => w.length > 3);
  const productNameMatch = productNameWords.some(word => textToSearch.includes(word));
  
  if (productNameMatch) {
    matchScore += 5;
    matches.push('product name keywords found');
  }

  const explanation = matches.length > 0 
    ? `Category match: ${matches.join('; ')}`
    : 'No category match found';

  return {
    score: Math.min(30, matchScore),
    explanation
  };
}

// 4. Geographic Fit (0-10 pontos)
function calculateGeographicFit(
  companyCountry: string | null | undefined,
  companyState: string | null | undefined,
  productRegions: string[] | null | undefined,
  tenantRegions: string[] | null | undefined
): { score: number; explanation: string } {
  if (!companyCountry) {
    return {
      score: 0,
      explanation: 'Company location not available'
    };
  }

  // Se produto/tenant não especifica regiões, dar score médio
  if ((!productRegions || productRegions.length === 0) && 
      (!tenantRegions || tenantRegions.length === 0)) {
    return {
      score: 5,
      explanation: 'Product available globally (no regional restrictions)'
    };
  }

  const allRegions = [...(productRegions || []), ...(tenantRegions || [])];
  const companyCountryLower = companyCountry.toLowerCase();

  // Verificar match exato
  const exactMatch = allRegions.some(region => 
    region.toLowerCase() === companyCountryLower ||
    region.toLowerCase().includes(companyCountryLower) ||
    companyCountryLower.includes(region.toLowerCase())
  );

  if (exactMatch) {
    return {
      score: 10,
      explanation: `Perfect geographic fit: ${companyCountry} in product/tenant regions`
    };
  }

  // Verificar match parcial (continente)
  const continents: Record<string, string[]> = {
    'north america': ['united states', 'canada', 'mexico'],
    'europe': ['united kingdom', 'germany', 'france', 'italy', 'spain'],
    'asia': ['china', 'japan', 'india', 'south korea'],
    'south america': ['brazil', 'argentina', 'chile'],
    'oceania': ['australia', 'new zealand']
  };

  for (const [continent, countries] of Object.entries(continents)) {
    if (countries.some(c => companyCountryLower.includes(c.toLowerCase()))) {
      const continentInRegions = allRegions.some(r => 
        r.toLowerCase().includes(continent) || continent.includes(r.toLowerCase())
      );
      if (continentInRegions) {
        return {
          score: 5,
          explanation: `Moderate geographic fit: ${companyCountry} in same region/continent`
        };
      }
    }
  }

  return {
    score: 0,
    explanation: `Geographic mismatch: ${companyCountry} not in product/tenant regions`
  };
}

// 5. Business Model Fit (0-10 pontos)
function calculateBusinessModelFit(
  companyDescription: string | null | undefined,
  companyB2bType: string | null | undefined,
  productDistributionModel: string | null | undefined
): { score: number; explanation: string } {
  const textToSearch = `${companyDescription || ''} ${companyB2bType || ''}`.toLowerCase();
  
  // Se produto não especifica modelo de distribuição, dar score médio
  if (!productDistributionModel) {
    return {
      score: 5,
      explanation: 'Product has no specific distribution model (universal fit)'
    };
  }

  const modelLower = productDistributionModel.toLowerCase();
  
  // Verificar se empresa é do tipo que produto precisa
  const dealerKeywords = ['distributor', 'dealer', 'wholesale', 'reseller'];
  const importerKeywords = ['importer', 'import', 'international trade'];
  const manufacturerKeywords = ['manufacturer', 'producer', 'factory'];

  let isDealer = dealerKeywords.some(k => textToSearch.includes(k));
  let isImporter = importerKeywords.some(k => textToSearch.includes(k));
  let isManufacturer = manufacturerKeywords.some(k => textToSearch.includes(k));

  if (modelLower.includes('distributor') || modelLower.includes('dealer')) {
    if (isDealer) {
      return {
        score: 10,
        explanation: `Perfect business model fit: company is ${companyB2bType || 'dealer/distributor'} and product targets distributors`
      };
    } else if (isImporter) {
      return {
        score: 7,
        explanation: `Good business model fit: company is importer, product can work with importers`
      };
    }
  }

  if (modelLower.includes('importer')) {
    if (isImporter) {
      return {
        score: 10,
        explanation: `Perfect business model fit: company is importer and product targets importers`
      };
    } else if (isDealer) {
      return {
        score: 7,
        explanation: `Good business model fit: company is dealer, product can work with dealers`
      };
    }
  }

  if (modelLower.includes('manufacturer') || modelLower.includes('producer')) {
    if (isManufacturer) {
      return {
        score: 10,
        explanation: `Perfect business model fit: company is manufacturer and product targets manufacturers`
      };
    }
  }

  return {
    score: 0,
    explanation: `Business model mismatch: company type (${companyB2bType || 'unknown'}) does not match product distribution model (${productDistributionModel})`
  };
}

// 📦 PRODUCT FIT ANALYSIS REAL (FASE 3)
async function calculateProductFit(
  supabase: any,
  tenantId: string,
  companyId: string | null | undefined,
  companyName: string
): Promise<{
  tenant_catalog_products: any[];
  matching_products: any[];
  fit_score: number;
  breakdown: {
    industry_fit: { score: number; explanation: string };
    size_fit: { score: number; explanation: string };
    category_match: { score: number; explanation: string };
    geographic_fit: { score: number; explanation: string };
    business_model_fit: { score: number; explanation: string };
  };
  recommendations: string[];
  explanation: string;
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
      breakdown: {
        industry_fit: { score: 0, explanation: 'No products to compare' },
        size_fit: { score: 0, explanation: 'No products to compare' },
        category_match: { score: 0, explanation: 'No products to compare' },
        geographic_fit: { score: 0, explanation: 'No products to compare' },
        business_model_fit: { score: 0, explanation: 'No products to compare' }
      },
      recommendations: ['Nenhum produto cadastrado no catálogo do tenant'],
      explanation: 'No products available for Product Fit Analysis'
    };
  }

  // Buscar dados da empresa (se companyId fornecido)
  let company: any = null;
  if (companyId) {
    const { data: companyData } = await supabase
      .from('companies')
      .select('industry, employees, employees_count, country, state, city, description, website, b2b_type, raw_data')
      .eq('id', companyId)
      .maybeSingle();
    
    company = companyData;
  }

  const companyIndustry = company?.industry || null;
  const companyEmployees = company?.employees || company?.employees_count || null;
  const companyCountry = company?.country || null;
  const companyState = company?.state || null;
  const companyDescription = company?.description || company?.raw_data?.description || null;
  const companyWebsite = company?.website || null;
  const companyB2bType = company?.b2b_type || company?.raw_data?.type || null;

  // Calcular fit para cada produto
  const matching_products = tenantProducts.map((product: any) => {
    const productCategories = product.categories || product.category ? [product.category] : [];
    const productRegions = product.regions || product.available_regions || null;
    const productTargetSize = product.target_size || product.company_size || null;
    const productDistributionModel = product.distribution_model || product.target_model || null;

    // 1. Industry Fit
    const industryFit = calculateIndustryFit(
      companyIndustry,
      product.industry || product.target_industry,
      productCategories
    );

    // 2. Size Fit
    const sizeFit = calculateSizeFit(
      companyEmployees,
      productTargetSize
    );

    // 3. Category Match
    const categoryMatch = calculateCategoryMatch(
      companyDescription,
      companyWebsite,
      productCategories,
      product.name || product.product_name || ''
    );

    // 4. Geographic Fit (TODO: buscar tenant regions)
    const geographicFit = calculateGeographicFit(
      companyCountry,
      companyState,
      productRegions,
      null // TODO: buscar tenant regions
    );

    // 5. Business Model Fit
    const businessModelFit = calculateBusinessModelFit(
      companyDescription,
      companyB2bType,
      productDistributionModel
    );

    // Calcular score total do produto
    const productFitScore = 
      industryFit.score +
      sizeFit.score +
      categoryMatch.score +
      geographicFit.score +
      businessModelFit.score;

    return {
      product_id: product.id,
      product_name: product.name || product.product_name,
      match_score: productFitScore,
      fit_reasons: [
        industryFit.score > 0 ? industryFit.explanation : null,
        sizeFit.score > 0 ? sizeFit.explanation : null,
        categoryMatch.score > 0 ? categoryMatch.explanation : null,
        geographicFit.score > 0 ? geographicFit.explanation : null,
        businessModelFit.score > 0 ? businessModelFit.explanation : null
      ].filter(Boolean),
      potential_quantity: null, // TODO: estimar baseado em tamanho da empresa
      estimated_value: null, // TODO: calcular baseado em preço do produto
      breakdown: {
        industry_fit: industryFit,
        size_fit: sizeFit,
        category_match: categoryMatch,
        geographic_fit: geographicFit,
        business_model_fit: businessModelFit
      }
    };
  });

  // Ordenar produtos por match_score (melhor fit primeiro)
  matching_products.sort((a, b) => b.match_score - a.match_score);

  // Calcular fit score geral (média ponderada dos top 3 produtos)
  const topProducts = matching_products.slice(0, 3);
  const overallFitScore = topProducts.length > 0
    ? Math.round(topProducts.reduce((sum, p) => sum + p.match_score, 0) / topProducts.length)
    : 0;

  // Calcular breakdown geral (média dos top 3 produtos)
  const overallBreakdown = topProducts.length > 0 ? {
    industry_fit: {
      score: Math.round(topProducts.reduce((sum, p) => sum + p.breakdown.industry_fit.score, 0) / topProducts.length),
      explanation: topProducts.map(p => p.breakdown.industry_fit.explanation).filter(Boolean).join('; ') || 'No industry match'
    },
    size_fit: {
      score: Math.round(topProducts.reduce((sum, p) => sum + p.breakdown.size_fit.score, 0) / topProducts.length),
      explanation: topProducts.map(p => p.breakdown.size_fit.explanation).filter(Boolean).join('; ') || 'No size match'
    },
    category_match: {
      score: Math.round(topProducts.reduce((sum, p) => sum + p.breakdown.category_match.score, 0) / topProducts.length),
      explanation: topProducts.map(p => p.breakdown.category_match.explanation).filter(Boolean).join('; ') || 'No category match'
    },
    geographic_fit: {
      score: Math.round(topProducts.reduce((sum, p) => sum + p.breakdown.geographic_fit.score, 0) / topProducts.length),
      explanation: topProducts.map(p => p.breakdown.geographic_fit.explanation).filter(Boolean).join('; ') || 'No geographic match'
    },
    business_model_fit: {
      score: Math.round(topProducts.reduce((sum, p) => sum + p.breakdown.business_model_fit.score, 0) / topProducts.length),
      explanation: topProducts.map(p => p.breakdown.business_model_fit.explanation).filter(Boolean).join('; ') || 'No business model match'
    }
  } : {
    industry_fit: { score: 0, explanation: 'No products to compare' },
    size_fit: { score: 0, explanation: 'No products to compare' },
    category_match: { score: 0, explanation: 'No products to compare' },
    geographic_fit: { score: 0, explanation: 'No products to compare' },
    business_model_fit: { score: 0, explanation: 'No products to compare' }
  };

  // Gerar recomendações
  const recommendations: string[] = [];
  if (overallFitScore >= 70) {
    recommendations.push(`Excellent product fit (${overallFitScore}%). Strong candidate for ${topProducts[0]?.product_name || 'tenant products'}.`);
  } else if (overallFitScore >= 40) {
    recommendations.push(`Moderate product fit (${overallFitScore}%). Consider ${topProducts[0]?.product_name || 'products'} with customized approach.`);
  } else {
    recommendations.push(`Low product fit (${overallFitScore}%). Review product portfolio or company profile.`);
  }

  if (topProducts.length > 0) {
    recommendations.push(`Top match: ${topProducts[0].product_name} (${topProducts[0].match_score}% fit)`);
  }

  // Gerar explicação geral
  const explanation = `Product Fit Score de ${overallFitScore}%: ` +
    `(1) Industry: ${overallBreakdown.industry_fit.score}/30, ` +
    `(2) Size: ${overallBreakdown.size_fit.score}/20, ` +
    `(3) Category: ${overallBreakdown.category_match.score}/30, ` +
    `(4) Geographic: ${overallBreakdown.geographic_fit.score}/10, ` +
    `(5) Business Model: ${overallBreakdown.business_model_fit.score}/10. ` +
    `${matching_products.length} produto(s) analisado(s).`;

  return {
    tenant_catalog_products: tenantProducts,
    matching_products,
    fit_score: overallFitScore,
    breakdown: overallBreakdown,
    recommendations,
    explanation
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

    // 👥 FASE 5: D&B LEADERSHIP/DECISORES (Queries Específicas D&B)
    console.log('[SCI] 👥 FASE 5: Buscando D&B Leadership/Decisores...');
    const dnbLeadershipQueries = DNB_LEADERSHIP_QUERIES(company_name);
    const dnbEvidences: any[] = [];
    for (const query of dnbLeadershipQueries) {
      const dnbLeadershipEvidences = await searchMultiplePortals({
        portals: ['dnb.com'], // Apenas D&B para decisores
        companyName: company_name,
        serperKey,
        sourceType: 'bi_sources',
        sourceWeight: SOURCE_WEIGHTS.bi_sources,
        dateRestrict: 'y5', // Buscar histórico mais amplo (dados corporativos mudam menos)
        queryTemplate: query // Query específica D&B
      });
      dnbEvidences.push(...dnbLeadershipEvidences);
      totalQueries += dnbLeadershipQueries.length;
      
      // Delay para respeitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    evidencias.push(...dnbEvidences);
    sourcesConsulted += 1; // D&B contabilizada
    console.log(`[SCI] ✅ FASE 5: ${dnbEvidences.length} evidências D&B de Leadership/Decisores`);

    // 🏪 FASE 6: PRODUCT FIT SIGNALS (Queries Específicas)
    console.log('[SCI] 🏪 FASE 6: Buscando Product Fit Signals...');
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
    sourcesConsulted += 4; // LinkedIn, Twitter, Crunchbase, PitchBook (sem D&B, já usada)
    console.log(`[SCI] ✅ FASE 6: ${evidencias.filter(e => e.source_type === 'social_b2b').length} evidências de Product Fit Signals`);

    // 🌍 FASE 7: BUSCA GENÉRICA COMPLEMENTAR (Fontes restantes - menor prioridade)
    console.log('[SCI] 🌍 FASE 7: Busca genérica complementar em fontes restantes...');
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

    if (tenant_id && company_id) {
      console.log('[SCI] 📦 Calculando Product Fit Analysis REAL com tenant_products...');
      productFit = await calculateProductFit(supabase, tenant_id, company_id, company_name);
      console.log('[SCI] ✅ Product Fit Analysis:', {
        fit_score: productFit.fit_score,
        products_analyzed: productFit.matching_products.length,
        top_match: productFit.matching_products[0]?.product_name || 'N/A',
        top_score: productFit.matching_products[0]?.match_score || 0
      });
    } else if (tenant_id) {
      console.warn('[SCI] ⚠️ Tenant ID fornecido mas company_id não disponível - Product Fit Analysis não pode ser calculado');
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
      
      // 7. D&B Leadership/Decisores Data (EXTRAÍDO DAS EVIDÊNCIAS D&B)
      dnb_leadership: extractDNBLeadershipData(dnbEvidences, company_name),
      
      // 8. Status Final (COMPATIBILIDADE COM FORMATO ANTIGO)
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
      execution_time: `${Date.now() - startTime}ms`,
      queries_executed: totalQueries, // 🔥 CONSUMO DE CRÉDITOS SERPER
      estimated_serper_credits: totalQueries, // 1 query = 1 crédito Serper
      phases_completed: 7, // Total de fases executadas
      methodology: {
        total_queries: totalQueries,
        searched_sources: sourcesConsulted,
        execution_time: `${Date.now() - startTime}ms`,
        phases: {
          phase_1_expansion: expansionQueries.length * 5,
          phase_2_procurement: procurementQueries.length * 5,
          phase_3_hiring: hiringQueries.length * GLOBAL_JOB_PORTALS.length,
          phase_4_growth: growthQueries.length * 8,
          phase_5_dnb_leadership: dnbLeadershipQueries.length,
          phase_6_product_fit: productFitQueries.length * 4,
          phase_7_generic: GLOBAL_JOB_PORTALS.slice(3).length
        }
      }
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
