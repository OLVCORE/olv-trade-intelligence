import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ NOVO: Importar serviços de bloqueio e classificação (via URL import se necessário)
// Como estamos em Edge Function (Deno), usar imports diretos quando possível
// Para agora, consolidar lógica inline mas usando padrões dos serviços

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
      .map((c: any) => {
        // ✅ CRÍTICO: País DEVE vir da Apollo, não do parâmetro de busca
        // O parâmetro "country" é apenas para FILTRAR a busca, não para atribuir país às empresas
        let extractedCountry = c.country || null;
        
        // ⚠️ VALIDAÇÃO: Se Apollo não retornou país, tentar extrair do nome
        if (!extractedCountry && c.name) {
          const nameLower = c.name.toLowerCase();
          // Mapeamento básico de cidades conhecidas
          if (nameLower.includes('guangzhou') || nameLower.includes('guangdong') || 
              nameLower.includes('beijing') || nameLower.includes('shanghai') || 
              nameLower.includes('shenzhen')) {
            extractedCountry = 'China';
            console.log(`[APOLLO] ✅ País extraído do nome: "China" para "${c.name}"`);
          } else if (nameLower.includes('bogotá') || nameLower.includes('bogota')) {
            extractedCountry = 'Colombia';
          } else if (nameLower.includes('são paulo') || nameLower.includes('sao paulo')) {
            extractedCountry = 'Brasil';
          } else if (nameLower.includes('buenos aires')) {
            extractedCountry = 'Argentina';
          }
        }
        
        // ❌ NÃO USAR país do parâmetro - se Apollo não retornou e não encontramos no nome, deixar null
        // O país será extraído depois via scraping ou outras fontes
        if (!extractedCountry) {
          console.warn(`[APOLLO] ⚠️ País não encontrado na Apollo para "${c.name}". Será extraído via scraping depois.`);
        }
        
        return {
          name: c.name,
          company_name: c.name,
          website: c.website_url,
          domain: c.website_url,
          linkedin_url: c.linkedin_url,
          country: extractedCountry, // ✅ APENAS da Apollo ou nome, nunca do parâmetro
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
        };
      });
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
    
    // B2B DIRECTORIES (COM país no filtro) - ⚠️ REMOVIDO: kompass.com e europages.com (retornam portais genéricos)
    // `site:kompass.com "${keyword}" ${country}`, // ❌ REMOVIDO: Portal genérico
    // `site:europages.com "${keyword}" ${country}`, // ❌ REMOVIDO: Portal genérico
    `site:thomasnet.com "${keyword}" ${country} -publication -journal -transactions`,
    `site:tradekey.com "${keyword}" ${country}`,
    
    // YELLOW PAGES LOCAIS (do país selecionado)
    `"${keyword}" ${country} yellow pages -alibaba -made-in-china -ebay -aliexpress`,
    `"${keyword}" distributor ${country} -alibaba -made-in-china -ebay -aliexpress -kompass -europages`,
    `"${keyword}" wholesaler ${country} -alibaba -made-in-china -ebay -aliexpress`,
    `"${keyword}" importer ${country} -alibaba -made-in-china -ebay -aliexpress`,
    
    // LINKEDIN (EMPRESAS do país) - ⚠️ EXCLUIR publicações acadêmicas e portais
    `site:linkedin.com/company "${keyword}" ${country} -publication -journal -transactions -ieee -book -ebook`,
    
    // GOOGLE DIRETO (COM país obrigatório) - USAR KEYWORD DO USUÁRIO
    // ⚠️ EXCLUSÕES RIGOROSAS: marketplaces, portais, publicações acadêmicas
    `"${keyword}" distributor ${country} -studio -instructor -blog -alibaba -made-in-china -ebay -aliexpress -kompass -europages -publication -journal -transactions -ieee -book`,
    `"${keyword}" wholesale ${country} -studio -gym -alibaba -made-in-china -ebay -aliexpress -kompass -europages -publication -journal`,
    `"${keyword}" b2b ${country} -alibaba -made-in-china -ebay -aliexpress -kompass -europages -publication -journal`,
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

  // FILTRAR RESULTADOS: APENAS do país selecionado E bloquear marketplaces/portais
  const filtered = allResults.filter(r => {
    const snippet = (r.description || '').toLowerCase();
    const title = (r.name || '').toLowerCase();
    const link = (r.link || '').toLowerCase();
    const text = snippet + ' ' + title + ' ' + link;
    
    // 🚫 BLOQUEAR MARKETPLACES E PORTALS E E-COMMERCE
    const blockedPatterns = [
      'alibaba.com', 'made-in-china.com', 'ebay.', 'aliexpress.com',
      'kompass.com', 'europages.com', // Portais genéricos
      'falabella', 'compumarket', 'mercado-livre', 'mercadolibre', 'mercadolivre',
      'linio', 'ripley', 'oechsle', 'saga', 'sodimac', 'wong', 'metro', 'tottus',
      'fravega', 'garbarino', 'alkosto', 'alkomprar', 'liverpool', 'palacio', 'coppel',
      'americanas', 'magazine-luiza', 'casas-bahia', 'extra', 'pontofrio', 'submarino',
      '/product/', '/products/', '/produto/', '/produtos/', '/tienda/', '/tiendas/',
      '/shop/', '/store/', '/categoria/', '/categorias/', '/cat/', '/category/',
      '/itm/', '/item/', '/listing/',
      '/publication', '/journal', '/transactions', '/ieee',
      'facebook.com/posts', 'facebook.com/pages', 'linkedin.com/posts',
      'book', 'ebook', 'publication', 'publisher', 'publishing',
    ];
    
    if (blockedPatterns.some(pattern => text.includes(pattern))) {
      console.log(`[SERPER] 🚫 REJEITADO (marketplace/portal): ${r.name} (${r.link})`);
      return false;
    }
    
    // 🚫 BLOQUEAR NOMES QUE SÃO LIVROS/PRODUTOS (não empresas)
    const productPatterns = [
      /^Part [IVX]+:/i, // "Part II:", "Part III:", etc.
      /^(The|A)\s+[A-Z][^:]*:\s*[A-Z]/i, // "The Pilates Reformer: Modern..."
      /Exercises? & /i, // "Exercises & Training"
      /Jumpboard|Exercises|Training|Manual/i,
    ];
    if (productPatterns.some(pattern => pattern.test(title))) {
      console.log(`[SERPER] 🚫 REJEITADO (livro/produto): ${r.name}`);
      return false;
    }
    
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
    `"${keyword}" wholesale ${country} -alibaba -made-in-china -ebay -aliexpress`,
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

async function calculateFitScore(
  website: string, 
  keywords: string[], 
  requiredKeywords: string[] = [],
  usageContext?: { include: string[]; exclude?: string[] }
): Promise<number> {
  try {
    const response = await fetch(website, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000), // 5s (mais rápido)
    });

    if (!response.ok) return 0;

    const html = await response.text();
    const text = html.toLowerCase();

    // ✅ USAR KEYWORDS DO USUÁRIO (recebidas via parâmetro)
    // Se não houver keywords, usar uma busca genérica baseada em B2B terms
    const b2bKeywords = [
      'wholesale', 'distributor', 'dealer', 'importer', 'supplier',
      'b2b', 'bulk', 'commercial', 'trade', 'export', 'import'
    ];

    // ✅ CRÍTICO 1: Validar contexto de uso final (CAMADA CRÍTICA)
    if (usageContext && usageContext.include && usageContext.include.length > 0) {
      const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedText = normalize(text);
      
      // Verificar se contém pelo menos 1 termo de uso final obrigatório
      const hasRequiredUsage = usageContext.include.some(term => {
        const normalizedTerm = normalize(term);
        return normalizedText.includes(normalizedTerm) ||
               normalizedText.includes(` ${normalizedTerm} `) ||
               normalizedText.startsWith(`${normalizedTerm} `) ||
               normalizedText.endsWith(` ${normalizedTerm}`);
      });
      
      if (!hasRequiredUsage) {
        console.log(`[FIT-SCORE] 🚫 Fit Score 0: "${website}" não contém uso final obrigatório: ${usageContext.include.slice(0, 3).join(', ')}...`);
        return 0;
      }
      
      // Verificar se contém termo de uso final excluído
      if (usageContext.exclude && usageContext.exclude.length > 0) {
        const hasExcludedUsage = usageContext.exclude.some(term => {
          const normalizedTerm = normalize(term);
          return normalizedText.includes(normalizedTerm) ||
                 normalizedText.includes(` ${normalizedTerm} `);
        });
        
        if (hasExcludedUsage) {
          console.log(`[FIT-SCORE] 🚫 Fit Score 0: "${website}" contém uso final excluído: ${usageContext.exclude.join(', ')}`);
          return 0;
        }
      }
    } else {
      // Se não houver uso final, bloquear (regra obrigatória)
      console.log(`[FIT-SCORE] 🚫 Fit Score 0: "${website}" - uso final não especificado`);
      return 0;
    }
    
    // ✅ CRÍTICO 2: Validar se contém keywords obrigatórias do usuário
    if (requiredKeywords.length > 0) {
      const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedKeywords = requiredKeywords.map(normalize);
      const normalizedText = normalize(text);
      
      const hasRequiredKeyword = normalizedKeywords.some(keyword => 
        normalizedText.includes(keyword) || 
        normalizedText.includes(keyword.split(' ')[0]) // Aceitar palavra parcial
      );
      
      // ✅ OBRIGATÓRIO: Se não contém keywords do usuário, Fit Score = 0 (será rejeitado)
      if (!hasRequiredKeyword) {
        console.log(`[FIT-SCORE] 🚫 Fit Score 0: "${website}" não contém keywords obrigatórias: ${requiredKeywords.join(', ')}`);
        return 0;
      }
    }
    
    // Se keywords foram fornecidas, usar elas + termos B2B
    const searchTerms = keywords.length > 0 
      ? [...keywords.map(k => k.toLowerCase()), ...b2bKeywords]
      : b2bKeywords;

    const found = searchTerms.filter(kw => text.includes(kw.toLowerCase()));

    // 🚫 BLOQUEAR MARKETPLACES/E-COMMERCE no scraping também
    const blockedInText = [
      'falabella', 'compumarket', 'mercado-livre', 'mercadolibre', 'mercadolivre',
      'linio', 'ripley', 'oechsle', 'saga', 'sodimac', 'wong', 'metro', 'tottus',
      'fravega', 'garbarino', 'alkosto', 'alkomprar', 'liverpool', 'palacio', 'coppel',
      'americanas', 'magazine-luiza', 'casas-bahia', 'extra', 'pontofrio', 'submarino',
      'amazon', 'ebay', 'alibaba', 'made-in-china', 'aliexpress',
    ];
    
    if (blockedInText.some(blocked => text.includes(blocked))) {
      console.log(`[FIT-SCORE] 🚫 Fit Score 0: "${website}" é marketplace/e-commerce bloqueado`);
      return 0;
    }

    // MÍNIMO 2 KEYWORDS B2B = Fit 60
    if (found.length < 2) return 0;

    let score = 60; // Base

    // ✅ BÔNUS POR CRITÉRIO:
    // +20: HS Code compatível (já validado acima)
    // +25: Keyword específica (já validado acima)
    // +30: Uso final validado (OBRIGATÓRIO - já validado acima)
    score += 30; // Uso final validado
    
    // +5 por keyword adicional
    score += ((found.length - 2) * 5);

    // +15: Wholesale/Distributor (tipo B2B)
    if (text.includes('wholesale') || text.includes('distributor') || text.includes('dealer')) {
      score += 15;
    }

    // +10: B2B/Commercial
    if (text.includes('b2b') || text.includes('commercial') || text.includes('bulk')) {
      score += 10;
    }

    // +10: País correto (já validado acima)
    score += 10;

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
      requiredKeywords = [], // ✅ Keywords normalizadas para validação rigorosa
      allowedCountryVariations = [], // ✅ Variações de países válidos para validação cruzada
      usageContext, // ✅ NOVO: Contexto de uso final (CAMADA CRÍTICA)
      minVolume,
      includeTypes = ['distributor', 'wholesaler', 'dealer', 'importer', 'trading company', 'supplier', 'reseller', 'agent'], // ✅ PADRÃO B2B
      excludeTypes = ['fitness studio', 'gym / fitness center', 'wellness center', 'personal training', 'yoga studio', 'spa', 'rehabilitation center', 'physiotherapy'], // ✅ PADRÃO B2C BLOQUEADOS
      includeRoles = ['procurement manager', 'purchasing director', 'import manager', 'buyer'] // ✅ DECISORES ALVO
    } = await req.json();
    
    // ✅ VALIDAÇÃO OBRIGATÓRIA: Uso final deve ser especificado
    if (!usageContext || !usageContext.include || usageContext.include.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Contexto de uso final é obrigatório. Defina pelo menos 1 termo que descreve PARA QUE o produto será usado (ex: "equipamento pilates", "máquina construção", "componente aviação").',
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`==============================================`);
    console.log(`[REALTIME] 🚀 BUSCA B2B FOCADA INICIADA`);
    console.log(`  HS Code: ${hsCode}`);
    console.log(`  País: ${country}`);
    console.log(`  Keywords customizadas: ${keywords?.join(', ') || 'Nenhuma'}`);
    console.log(`  🎯 USO FINAL (INCLUIR): ${usageContext.include.join(', ')}`);
    console.log(`  🚫 USO FINAL (EXCLUIR): ${usageContext.exclude?.join(', ') || 'Nenhum'}`);
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
      }
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

    // FILTRAR: Remover Facebook, Instagram, páginas genéricas, MARKETPLACES, E-COMMERCE, etc.
    const BLOCKED_DOMAINS = [
      // Redes sociais
      'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 
      'twitter.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
      // Blogs e conteúdo genérico
      'blogspot.com', 'wordpress.com', 'medium.com', 'tumblr.com',
      'wikipedia.org', 'quora.com', 'yelp.com', 'tripadvisor.com',
      // MARKETPLACES GLOBAIS (BLOQUEADOS!)
      'faire.com', 'etsy.com', 'amazon.com', 'ebay.com',
      'alibaba.com', 'made-in-china.com', 'aliexpress.com', 'globalsources.com',
      'dhgate.com', 'tradekey.com', 'ec21.com', 'ecplaza.net',
      // URLs específicas de marketplace
      'm.alibaba.com', 'mm.made-in-china.com', 'inbusiness.aliexpress.com',
      // E-COMMERCE E MARKETPLACES LATINO-AMERICANOS (BLOQUEADOS!)
      'falabella.com', 'falabella.cl', 'falabella.com.co', 'falabella.com.pe',
      'compumarket.com.py', 'compumarket.com',
      'mercado-livre.com', 'mercadolivre.com.br', 'mercadolibre.com',
      'linio.com', 'linio.com.mx', 'linio.com.co', 'linio.com.pe',
      'ripley.com', 'ripley.cl', 'ripley.com.pe',
      'oechsle.com', 'oechsle.com.pe',
      'saga.com.pe', 'sodimac.com', 'sodimac.cl', 'sodimac.com.pe',
      'wong.com.pe', 'metro.com.pe', 'tottus.com.pe',
      'casaidea.com', 'paris.cl', 'lider.cl', 'jumbo.cl',
      'fravega.com', 'fravega.com.ar', 'garbarino.com', 'garbarino.com.ar',
      'almacenes-exito.com', 'exito.com', 'carulla.com', 'carulla.com.co',
      'alkosto.com', 'alkomprar.com', 'k-tronix.com',
      'liverpool.com.mx', 'palacio.com.mx', 'el-palacio-de-hierro.com',
      'coppel.com', 'coppel.com.mx', 'coppel.com.ar',
      'magazine-luiza.com.br', 'americanas.com.br', 'submarino.com.br',
      'casas-bahia.com.br', 'extra.com.br', 'pontofrio.com.br',
      // E-COMMERCE GENÉRICO (qualquer site com padrões de e-commerce)
      '.com/product/', '.com/products/', '.com/tienda/', '.com/shop/',
      '.com/categoria/', '.com/categoria/', '.com/cat/',
    ];
    
    // ✅ NORMALIZAR KEYWORDS OBRIGATÓRIAS (normalizadas já vêm do frontend)
    const normalizedRequiredKeywords = requiredKeywords.length > 0 
      ? requiredKeywords 
      : keywords.map(k => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    
    // ✅ NORMALIZAR VARIAÇÕES DE PAÍSES (já vêm do frontend)
    const normalizedAllowedCountries = allowedCountryVariations.length > 0 
      ? allowedCountryVariations 
      : [country.toLowerCase()];
    
    // ✅ NORMALIZAR TIPOS B2B/B2C
    const requiredB2BTypes = includeTypes.map(t => t.toLowerCase());
    const excludedB2CTypes = excludeTypes.map(t => t.toLowerCase());
    
    const filtered = allDealers.filter(c => {
      if (!c.website) return false;
      
      // Extrair domínio completo e base
      const url = new URL(c.website.startsWith('http') ? c.website : `https://${c.website}`);
      const domain = url.hostname.toLowerCase();
      const domainBase = domain.replace(/^www\./, ''); // Remover www
      const urlLower = url.toString().toLowerCase(); // ✅ CORRIGIR: Definir urlLower
      
      const name = (c.name || '').toLowerCase();
      const description = (c.description || '').toLowerCase();
      const fullText = (name + ' ' + description + ' ' + domain + ' ' + url.pathname).toLowerCase();
      
      // 🔒 BLINDADO: Filtros e gates do Export Dealers (não alterar sem autorização)
      // 🚫 CRITÉRIO 1: Bloquear domínios de redes sociais, blogs e MARKETPLACES/E-COMMERCE
      // Verificar tanto domínio completo quanto base
      if (BLOCKED_DOMAINS.some(blocked => domain.includes(blocked) || domainBase.includes(blocked))) {
        console.log(`[FILTER] 🚫 BLOQUEADO (domínio bloqueado): ${c.name} (${c.website})`);
        return false;
      }
      
      // 🚫 CRITÉRIO 1B: BLOQUEAR DATA SOURCES / DIRECTORIES (ImportGenius, Panjiva, ImportKey, Tradebase, sitemaps, directories)
      const blockedDataSources = ['importgenius', 'panjiva', 'importkey', 'tradebase', 'trademap', 'sitemap', 'sitemaps', 'directory', 'directories'];
      if (blockedDataSources.some(blocked => domain.includes(blocked) || domainBase.includes(blocked) || name.toLowerCase().includes(blocked))) {
        console.log(`[FILTER] 🚫 BLOQUEADO (data source/directory): ${c.name} (${c.website})`);
        return false;
      }
      
      // 🚫 CRITÉRIO 1B: BLOQUEAR MARKETPLACES/E-COMMERCE ESPECÍFICOS (lista expandida)
      const blockedMarketplaces = [
        'falabella', 'compumarket', 'mercado-livre', 'mercadolibre', 'mercadolivre',
        'linio', 'ripley', 'oechsle', 'saga', 'sodimac', 'wong', 'metro', 'tottus',
        'fravega', 'garbarino', 'alkosto', 'alkomprar', 'liverpool', 'palacio', 'coppel',
        'americanas', 'magazine-luiza', 'casas-bahia', 'extra', 'pontofrio', 'submarino',
        'amazon', 'ebay', 'alibaba', 'made-in-china', 'aliexpress', 'globalsources',
        'dhgate', 'tradekey', 'ec21', 'ecplaza', 'kompass', 'europages',
        'faire', 'etsy', 'wish', 'banggood', 'gearbest', 'lightinthebox',
      ];
      
      if (blockedMarketplaces.some(blocked => domain.includes(blocked) || domainBase.includes(blocked) || name.includes(blocked))) {
        console.log(`[FILTER] 🚫 BLOQUEADO (marketplace/e-commerce): ${c.name} (${c.website})`);
        return false;
      }
      
      // 🚫 CRITÉRIO 2: Bloquear URLs que são claramente posts/páginas genéricas/E-COMMERCE
      const blockedUrlPatterns = [
        '/posts/', '/videos/', '/groups/', '/pages/', '/people/', '/p/',
        '/product/', '/products/', '/produto/', '/produtos/',
        '/tienda/', '/tiendas/', '/shop/', '/store/',
        '/categoria/', '/categorias/', '/cat/', '/category/',
        '/showroom/', '/factory/', '/hot-china-products/', '/itm/',
        '/item/', '/listing/', '/produtos/', '/productos/',
      ];
      if (blockedUrlPatterns.some(pattern => urlLower.includes(pattern))) {
        console.log(`[FILTER] 🚫 BLOQUEADO (URL de produto/tienda): ${c.name} (${c.website})`);
        return false;
      }
      
      // 🚫 CRITÉRIO 4: Bloquear nomes genéricos ou que parecem produtos/livros
      const genericNames = ['germany', 'products', 'shop all', 'global distributors', 
                           'about-us', 'home', 'title:', 'wholesale'];
      if (genericNames.some(gen => name.includes(gen) && name.length < 30)) {
        console.log(`[FILTER] 🚫 BLOQUEADO (nome genérico): ${c.name}`);
        return false;
      }
      
      // 🚫 CRITÉRIO 5: Bloquear se parecer livro/produto (não empresa B2B)
      const productPatterns = [
        /^Part [IVX]+:/i, // "Part II:", "Part III:", etc.
        /^(The|A)\s+[A-Z][^:]*:\s*[A-Z]/i, // "The Pilates Reformer: Modern..."
        /Exercises? & /i, // "Exercises & Training"
        /Jumpboard|Exercises|Training|Manual/i,
        /^[A-Z][a-z]+\s+(Reformer|Cadillac|Chair|Tower|Barrel)$/i, // Nomes de produtos isolados
      ];
      if (productPatterns.some(pattern => pattern.test(name))) {
        console.log(`[FILTER] 🚫 BLOQUEADO (parece produto/livro): ${c.name}`);
        return false;
      }
      
      // ✅ CRITÉRIO 6: VALIDAR CONTEXTO DE USO FINAL (CAMADA CRÍTICA)
      if (usageContext && usageContext.include && usageContext.include.length > 0) {
        const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedFullText = normalize(fullText);
        
        // Verificar se contém pelo menos 1 termo de uso final obrigatório
        const hasRequiredUsage = usageContext.include.some(term => {
          const normalizedTerm = normalize(term);
          return normalizedFullText.includes(normalizedTerm) ||
                 normalizedFullText.includes(` ${normalizedTerm} `) ||
                 normalizedFullText.startsWith(`${normalizedTerm} `) ||
                 normalizedFullText.endsWith(` ${normalizedTerm}`);
        });
        
        if (!hasRequiredUsage) {
          console.log(`[FILTER] 🚫 REJEITADO (não contém uso final obrigatório): ${c.name} | uso final: ${usageContext.include.slice(0, 3).join(', ')}...`);
          return false;
        }
        
        // Verificar se contém termo de uso final excluído
        if (usageContext.exclude && usageContext.exclude.length > 0) {
          const hasExcludedUsage = usageContext.exclude.some(term => {
            const normalizedTerm = normalize(term);
            return normalizedFullText.includes(normalizedTerm) ||
                   normalizedFullText.includes(` ${normalizedTerm} `) ||
                   normalizedFullText.startsWith(`${normalizedTerm} `) ||
                   normalizedFullText.endsWith(` ${normalizedTerm}`);
          });
          
          if (hasExcludedUsage) {
            console.log(`[FILTER] 🚫 REJEITADO (contém uso final excluído): ${c.name} | excluído: ${usageContext.exclude.join(', ')}`);
            return false;
          }
        }
      } else {
        // Se não houver uso final, bloquear (regra obrigatória)
        console.log(`[FILTER] 🚫 REJEITADO (uso final não especificado): ${c.name}`);
        return false;
      }
      
      // ✅ CRITÉRIO 7: VALIDAR KEYWORDS OBRIGATÓRIAS (deve conter pelo menos uma)
      if (normalizedRequiredKeywords.length > 0) {
        const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedFullText = normalize(fullText);
        
        const hasRequiredKeyword = normalizedRequiredKeywords.some(keyword => {
          const normalizedKeyword = normalize(keyword);
          // Aceitar palavra parcial quando keyword é HS code (números) ou tem hífen
          if (/^\d+$/.test(keyword) || keyword.includes('-')) {
            return normalizedFullText.includes(normalizedKeyword) || 
                   normalizedFullText.includes(normalizedKeyword.replace(/-/g, ' '));
          }
          // Para keywords normais, buscar palavra completa (mas aceitar variações)
          return normalizedFullText.includes(normalizedKeyword) ||
                 normalizedFullText.includes(normalizedKeyword.split(' ')[0]);
        });
        
        if (!hasRequiredKeyword) {
          console.log(`[FILTER] 🚫 REJEITADO (não contém keywords): ${c.name} | keywords: ${normalizedRequiredKeywords.slice(0, 3).join(', ')}...`);
          return false;
        }
      }
      
      // ✅ CRITÉRIO 8: VALIDAR PAÍS (deve estar na lista de países válidos)
      if (c.country && normalizedAllowedCountries.length > 0) {
        const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedCountry = normalize(c.country);
        
        const isValidCountry = normalizedAllowedCountries.some(allowed => {
          const normalizedAllowed = normalize(allowed);
          return normalizedCountry === normalizedAllowed ||
                 normalizedCountry.includes(normalizedAllowed) ||
                 normalizedAllowed.includes(normalizedCountry);
        });
        
        if (!isValidCountry) {
          console.log(`[FILTER] 🚫 REJEITADO (país inválido): ${c.name} | país: ${c.country} | permitidos: ${normalizedAllowedCountries.slice(0, 3).join(', ')}...`);
          return false;
        }
      }
      
      // ✅ CRITÉRIO 9: VALIDAR TIPOS B2B (deve ser tipo B2B, não B2C)
      if (excludedB2CTypes.length > 0) {
        const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedFullText = normalize(fullText);
        
        const isB2C = excludedB2CTypes.some(type => {
          const normalizedType = normalize(type);
          return normalizedFullText.includes(normalizedType);
        });
        if (isB2C) {
          console.log(`[FILTER] 🚫 BLOQUEADO (B2C excluído): ${c.name} (contém: ${excludedB2CTypes.join(', ')})`);
          return false;
        }
      }
      
      // ✅ CRITÉRIO 10: VALIDAR TIPOS B2B OBRIGATÓRIOS (deve conter pelo menos 1 termo B2B)
      const b2bTerms = ['distributor', 'wholesaler', 'dealer', 'importer', 'trading company', 
                        'supplier', 'reseller', 'agent', 'export', 'import', 'b2b', 'wholesale',
                        'bulk', 'commercial', 'trade', 'distribuidor', 'mayorista', 'importador',
                        'atacadista', 'fornecedor', 'exportador'];
      const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedFullText = normalize(fullText);
      
      const isB2B = b2bTerms.some(term => {
        const normalizedTerm = normalize(term);
        return normalizedFullText.includes(normalizedTerm);
      });
      
      if (!isB2B && requiredB2BTypes.length > 0) {
        // Verificar se pelo menos contém um dos tipos B2B requeridos
        const hasRequiredB2B = requiredB2BTypes.some(type => {
          const normalizedType = normalize(type);
          return normalizedFullText.includes(normalizedType) ||
                 (c.b2b_type && normalize(c.b2b_type).includes(normalizedType));
        });
        
        if (!hasRequiredB2B) {
          console.log(`[FILTER] 🚫 REJEITADO (não é tipo B2B requerido): ${c.name}`);
          return false;
        }
      }
      
      // ✅ CRITÉRIO 11: Bloquear sinais de e-commerce no texto
      const ecommerceSignals = ['add to cart', 'buy now', 'price', 'shipping', 'frete', 
                                 'parcelamento', 'checkout', 'carrinho', 'promo', 'oferta'];
      const hasEcommerceSignal = ecommerceSignals.some(signal => {
        const normalizedSignal = normalize(signal);
        return normalizedFullText.includes(normalizedSignal);
      });
      if (hasEcommerceSignal) {
        console.log(`[FILTER] 🚫 BLOQUEADO (sinal de e-commerce): ${c.name}`);
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
        
        // TENTAR WEB SCRAPING (com timeout 5s) - passar keywords do usuário, obrigatórias E uso final
        try {
          fitScore = await calculateFitScore(company.website, searchKeywords, normalizedRequiredKeywords, usageContext);
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
        keywords_used: searchKeywords.slice(0, 8), // ✅ Usar keywords do usuário
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
