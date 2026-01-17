/**
 * EDGE FUNCTION: Extrair Informações da Empresa de URL (Website/Facebook/LinkedIn)
 * 
 * Extrai informações REAIS da empresa:
 * 1. Nome CORRETO da empresa (não título da página)
 * 2. País REAL (baseado em endereço, código postal, etc.)
 * 3. Cidade e estado
 * 
 * SEM DADOS HARDCODED - apenas fontes reais via scraping
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractCompanyInfoRequest {
  url: string;
  apollo_key?: string;
  company_name?: string; // ✅ Nome completo da empresa (se já existe no sistema)
}

interface CompanyInfo {
  company_name: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  source: string;
}

serve(async (req) => {
  // ✅ CORRIGIR CORS: Responder OPTIONS com 200 OK + body null (padrão CORS)
  if (req.method === 'OPTIONS') {
    console.log('[EXTRACT-COMPANY-INFO] 🔵 OPTIONS preflight request recebido');
    const response = new Response(null, { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      }, 
      status: 200 
    });
    console.log('[EXTRACT-COMPANY-INFO] ✅ OPTIONS response enviado com status 200');
    return response;
  }

  try {
    // ✅ TRATAR ERRO DE PARSING DO JSON
    let requestBody: ExtractCompanyInfoRequest;
    try {
      requestBody = await req.json();
    } catch (jsonError: any) {
      console.error('[EXTRACT-COMPANY-INFO] ❌ Erro ao fazer parse do JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, apollo_key, company_name } = requestBody;
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[EXTRACT-COMPANY-INFO] 🔍 Extraindo informações de: ${url}`);
    console.log(`[EXTRACT-COMPANY-INFO] 📝 Nome da empresa recebido: "${company_name || 'NÃO FORNECIDO'}"`);

    // ========================================================================
    // 🛡️ VALIDAÇÃO DE SEGURANÇA: BLOQUEAR MARKETPLACES, PORTALS E E-COMMERCE
    // ========================================================================
    // ⚠️ CRÍTICO: Rejeitar IMEDIATAMENTE antes de qualquer processamento
    const urlLower = url.toLowerCase();
    const domain = urlLower.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const nameLower = (company_name || '').toLowerCase();
    
    // 🚫 BLOQUEAR DOMÍNIOS DE MARKETPLACES E PORTALS
    const BLOCKED_DOMAINS = [
      // Redes sociais
      'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 
      'twitter.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
      // Blogs e conteúdo genérico
      'blogspot.com', 'wordpress.com', 'medium.com', 'tumblr.com',
      'wikipedia.org', 'quora.com', 'yelp.com', 'tripadvisor.com',
      // MARKETPLACES (BLOQUEADOS TOTALMENTE!)
      'faire.com', 'etsy.com', 'amazon.com', 'ebay.com',
      'alibaba.com', 'made-in-china.com', 'aliexpress.com', 'globalsources.com',
      'dhgate.com', 'tradekey.com', 'ec21.com', 'ecplaza.net',
      'indiamart.com', 'thomasnet.com', // Diretórios B2B genéricos
      // URLs específicas de marketplace
      'm.alibaba.com', 'mm.made-in-china.com', 'inbusiness.aliexpress.com',
      // PORTALS DE E-COMMERCE (BLOQUEADOS!)
      'kompass.com', 'europages.com', // Diretórios B2B que retornam portais
    ];
    
    // ✅ BLOQUEAR MARKETPLACES ESPECÍFICOS (verificação adicional)
    // ⚠️ CRÍTICO: Facebook e eBay devem ser bloqueados IMEDIATAMENTE
    // 🚫 BLOQUEAR TODAS AS VARIAÇÕES DO EBAY (ebay.com, ebay.co.uk, ebay.de, ebay.es, etc.)
    const isEbay = domain.includes('ebay.');
    if (domain.includes('facebook.com') || domain.includes('fb.com') ||
        domain.includes('alibaba.com') || domain.includes('made-in-china.com') ||
        domain.includes('aliexpress.com') || isEbay ||
        domain.includes('globalsources.com') || domain.includes('dhgate.com') ||
        domain.includes('kompass.com') || domain.includes('europages.com')) {
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: Marketplace/Portal bloqueado - ${domain}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Marketplace/Portal não permitido',
          blocked_reason: 'marketplace_or_portal',
          domain: domain
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 🚫 BLOQUEAR URLs ESPECÍFICAS DO FACEBOOK (páginas, posts, grupos)
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
      // Permitir apenas se for uma página de empresa real (facebook.com/nome-empresa)
      // Bloquear: /posts/, /videos/, /groups/, /pages/, /people/, /p/
      if (urlLower.includes('/posts/') || urlLower.includes('/videos/') || 
          urlLower.includes('/groups/') || urlLower.includes('/pages/') ||
          urlLower.includes('/people/') || urlLower.includes('/p/') ||
          urlLower.includes('/watch/') || urlLower.includes('/events/')) {
        console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: URL do Facebook bloqueada - ${url}`);
        return new Response(
          JSON.stringify({ 
            error: 'URL bloqueada: Página do Facebook não permitida (posts, vídeos, grupos)',
            blocked_reason: 'facebook_content',
            url: url
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Bloquear TODAS as URLs do Facebook (incluindo páginas de empresa)
      // Facebook não é uma fonte confiável para dados de empresa
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: Facebook bloqueado completamente - ${url}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Facebook não é permitido como fonte de dados de empresa',
          blocked_reason: 'facebook_blocked',
          url: url
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Bloquear domínios da lista de bloqueio
    if (BLOCKED_DOMAINS.some(blocked => domain.includes(blocked))) {
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: Domínio bloqueado - ${domain}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Domínio não permitido',
          blocked_reason: 'blocked_domain',
          domain: domain
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 🚫 BLOQUEAR URLs DE POSTS/VIDEOS/PRODUTOS (marketplaces/e-commerce)
    // ⚠️ AJUSTADO: Bloquear apenas se for marketplace conhecido (ebay, alibaba, etc.)
    // Não bloquear URLs de websites reais que podem ter /product/ ou /factory/ no path
    const isBlockedMarketplace = domain.includes('ebay.') || 
                                  domain.includes('alibaba.com') || 
                                  domain.includes('made-in-china.com') ||
                                  domain.includes('amazon.com') ||
                                  domain.includes('etsy.com');
    
    if (isBlockedMarketplace && (
        urlLower.includes('/itm/') || 
        urlLower.includes('/item/') || 
        urlLower.includes('/listing/') ||
        urlLower.includes('/product/') ||
        urlLower.includes('/p/') ||
        urlLower.includes('/hot-china-products/')
    )) {
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: URL de produto/post/marketplace - ${url}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Página de produto/post/marketplace não permitida',
          blocked_reason: 'product_or_post_page',
          url: url
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Bloquear posts/videos/groups de redes sociais (já bloqueadas acima, mas garantir)
    if ((urlLower.includes('facebook.com') || urlLower.includes('linkedin.com')) && (
        urlLower.includes('/posts/') || urlLower.includes('/videos/') || 
        urlLower.includes('/groups/') || urlLower.includes('/pages/') ||
        urlLower.includes('/people/') || urlLower.includes('/p/')
    )) {
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: URL de post/vídeo/grupo - ${url}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Post/vídeo/grupo não permitido',
          blocked_reason: 'social_content',
          url: url
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 🚫 BLOQUEAR "MADE IN CHINA" APENAS SE FOR MARKETPLACE (não bloquear websites reais)
    // ⚠️ REMOVIDO: Bloqueio de "Made in China" está bloqueando URLs legítimas de empresas chinesas
    // Apenas bloquear se for claramente um marketplace (made-in-china.com, alibaba.com, etc.)
    // Esses já estão bloqueados na lista BLOCKED_DOMAINS acima
    
    // 🚫 BLOQUEAR PORTALS ACADÊMICOS/PUBLICAÇÕES (IEEE, etc.)
    const blockedAcademic = [
      'ieee', 'transactions', 'publications', 'journal', 'academic',
      'book', 'ebook', 'publication', 'publishing', 'publisher'
    ];
    if (blockedAcademic.some(keyword => nameLower.includes(keyword) && nameLower.length < 80)) {
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: Portal acadêmico/publicação - ${company_name}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Portal acadêmico/publicação não permitido',
          blocked_reason: 'academic_publication',
          company_name: company_name
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 🚫 BLOQUEAR LIVROS/PRODUTOS (não empresas)
    const blockedProductPatterns = [
      /^Part [IVX]+:/i, // "Part II:", "Part III:", etc.
      /^(The|A)\s+[A-Z][^:]*:\s*[A-Z]/i, // "The Pilates Reformer: Modern..."
      /Exercises? & /i, // "Exercises & Training"
      /Jumpboard|Exercises|Training|Manual/i, // Produtos de treinamento
      /^[^|]+\|[^|]+$/i, // Títulos com pipe (geralmente são produtos/livros)
    ];
    if (company_name && blockedProductPatterns.some(pattern => pattern.test(company_name))) {
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: Nome parece ser livro/produto, não empresa - ${company_name}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Nome parece ser livro/produto, não empresa',
          blocked_reason: 'book_or_product_name',
          company_name: company_name
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 🚫 BLOQUEAR NOMES GENÉRICOS (produtos, não empresas)
    // ⚠️ Apenas bloquear se for CLARAMENTE um produto genérico, não uma empresa real
    const genericProductPatterns = [
      /^shop\s+all$/i,           // "Shop All" (página de produtos)
      /^products?$/i,             // "Products" ou "Product" (página genérica)
      /^buy\s+now$/i,             // "Buy Now" (botão de compra)
      /^sell\s+online$/i,         // "Sell Online" (genérico)
      /^wholesale\s+products?$/i, // "Wholesale Products" (catálogo genérico)
      /^title:\s*/i,              // "Title: ..." (metadados)
    ];
    
    // ✅ NÃO bloquear se contém indicadores de empresa real
    const companyIndicators = ['company', 'inc', 'ltd', 'llc', 'corp', 'group', 'enterprises', 'industries', 'systems', 'solutions', 'services'];
    const hasCompanyIndicator = companyIndicators.some(ind => nameLower.includes(ind));
    
    // ✅ NÃO bloquear se o nome tem mais de 2 palavras (provavelmente é uma empresa)
    const wordCount = (company_name || '').trim().split(/\s+/).length;
    
    // ✅ Apenas bloquear se for um padrão genérico E não tiver indicadores de empresa E tiver menos de 3 palavras
    if (genericProductPatterns.some(pattern => pattern.test(company_name || '')) && 
        !hasCompanyIndicator && 
        wordCount < 3) {
      console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: Nome genérico (produto) - ${company_name}`);
      return new Response(
        JSON.stringify({ 
          error: 'URL bloqueada: Nome genérico (produto, não empresa)',
          blocked_reason: 'generic_product_name',
          company_name: company_name
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[EXTRACT-COMPANY-INFO] ✅ Validação de segurança passada para: ${url}`);
    
    if (company_name) {
      console.log(`[EXTRACT-COMPANY-INFO] 📝 Tamanho do nome: ${company_name.length} caracteres`);
      console.log(`[EXTRACT-COMPANY-INFO] 📝 Nome completo para validação: "${company_name}"`);
    }

    const result: CompanyInfo = {
      company_name: null,
      country: null,
      city: null,
      state: null,
      address: null,
      phone: null,
      email: null,
      source: 'none',
    };

    // ========================================================================
    // 0️⃣ VALIDAR PAÍS POR CIDADE NO NOME (Guangzhou → China, etc.) - PRIORIDADE MÁXIMA
    // ========================================================================
    // ⚠️ ESTA VALIDAÇÃO TEM PRIORIDADE ABSOLUTA - NUNCA SOBRESCREVER DEPOIS
    const cityToCountryMap: Record<string, string> = {
      'guangzhou': 'China',
      'guangdong': 'China',
      'beijing': 'China',
      'shanghai': 'China',
      'shenzhen': 'China',
      'hong kong': 'China',
      'bogotá': 'Colombia',
      'bogota': 'Colombia',
      'são paulo': 'Brasil',
      'buenos aires': 'Argentina',
      'mexico city': 'Mexico',
    };

    let countryFromCity: string | null = null;
    
    if (company_name) {
      const nameLower = company_name.toLowerCase();
      console.log(`[EXTRACT-COMPANY-INFO] 🔍 Validando cidade no nome: "${company_name}"`);
      
      for (const [city, country] of Object.entries(cityToCountryMap)) {
        if (nameLower.includes(city)) {
          countryFromCity = country;
          result.country = country;
          console.log(`[EXTRACT-COMPANY-INFO] ✅✅✅ PRIORIDADE MÁXIMA: País determinado pelo nome (cidade "${city}" → "${country}"): ${company_name}`);
          break;
        }
      }
      
      if (!countryFromCity) {
        console.log(`[EXTRACT-COMPANY-INFO] ⚠️ Nenhuma cidade conhecida encontrada no nome: "${company_name}"`);
      }
    } else {
      console.log(`[EXTRACT-COMPANY-INFO] ⚠️ Nome da empresa não fornecido para validação por cidade`);
    }

    // ========================================================================
    // 1️⃣ EXTRAIR DOMÍNIO PARA NOME BASE
    // ========================================================================
    let companyNameKeyword = '';
    try {
      const urlObj = new URL(url);
      // ✅ Reutilizar variável domain já declarada (linha 83), apenas atualizar valor se necessário
      const extractedDomain = urlObj.hostname.replace('www.', '');
      
      // ✅ USAR NOME FORNECIDO (prioridade) OU extrair do domínio
      if (company_name && company_name.trim().length > 3) {
        companyNameKeyword = company_name.trim();
        result.company_name = company_name.trim();
        console.log(`[EXTRACT-COMPANY-INFO] ✅ Usando nome fornecido: "${companyNameKeyword}"`);
      } else {
        // Ex: pilatesmatters.com → "Pilates Matters"
        const domainParts = extractedDomain.split('.');
        const mainDomain = domainParts[0];
        result.company_name = mainDomain
          .split(/[-_]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        companyNameKeyword = result.company_name || extractedDomain;
        console.log(`[EXTRACT-COMPANY-INFO] ✅ Nome base do domínio: ${result.company_name}`);
      }
    } catch (e) {
      console.error(`[EXTRACT-COMPANY-INFO] ❌ Erro ao extrair domínio:`, e);
    }

    // ========================================================================
    // 1.3️⃣ EXTRAIR DDI DO TELEFONE (ANTES DO SERPER - FONTE CONFIÁVEL)
    // ========================================================================
    // ✅ DDI É FONTE DE ALTA CONFIABILIDADE - Extrair ANTES de buscar no Serper
    // ⚠️ NÃO sobrescrever se país foi determinado por cidade (prioridade máxima)
    // Buscar telefone no HTML para extrair DDI
    try {
      const phoneDDIPattern = /\+\s*(\d{1,4})[\s\-\(\)]?[\d\s\-\(\)]{6,15}/g;
      const phoneMatches = url.match(phoneDDIPattern); // Primeiro tentar na URL
      
      const ddiToCountry: Record<string, string> = {
        '1': 'United States', '44': 'United Kingdom', '55': 'Brasil',
        '54': 'Argentina', '57': 'Colombia', '52': 'Mexico', '56': 'Chile',
        '51': 'Peru', '86': 'China', '49': 'Germany', '33': 'France',
        '39': 'Italy', '34': 'Spain', '81': 'Japan', '82': 'South Korea',
        '91': 'India', '61': 'Australia', '31': 'Netherlands', '32': 'Belgium',
        '41': 'Switzerland', '43': 'Austria', '351': 'Portugal', '90': 'Turkey',
        '506': 'Costa Rica', '507': 'Panama', '593': 'Ecuador', '595': 'Paraguay',
        '598': 'Uruguay', '27': 'South Africa', '64': 'New Zealand',
      };
      
      // ⚠️ NÃO sobrescrever se país foi determinado por cidade (prioridade máxima)
      if (phoneMatches && phoneMatches.length > 0 && !result.country && !countryFromCity) {
        for (const phone of phoneMatches) {
          const ddiMatch = phone.match(/\+?\s*(\d{1,4})/);
          if (ddiMatch && ddiMatch[1]) {
            const ddi = ddiMatch[1].trim();
            const country = ddiToCountry[ddi];
            if (country) {
              result.country = country;
              result.phone = phone.trim();
              console.log(`[EXTRACT-COMPANY-INFO] ✅ País determinado via DDI na URL (+${ddi}): ${country}`);
              break;
            }
          }
        }
      } else if (countryFromCity) {
        console.log(`[EXTRACT-COMPANY-INFO] ⚠️ DDI ignorado - país já determinado por cidade: ${countryFromCity}`);
      }
    } catch (e) {
      console.error(`[EXTRACT-COMPANY-INFO] Erro ao extrair DDI da URL:`, e);
    }

    // ========================================================================
    // 1.5️⃣ BUSCAR VIA SERPER (igual Export Dealers) - DEPOIS DO DDI
    // ========================================================================
    // ✅ USAR SERPER para buscar informações REAIS em múltiplas fontes confiáveis
    // ⚠️ APENAS SE AINDA NÃO TEMOS PAÍS (NUNCA sobrescrever validação por cidade - prioridade máxima)
    const serperKey = Deno.env.get('VITE_SERPER_API_KEY');
    if (serperKey && companyNameKeyword && !result.country && !countryFromCity) {
      try {
        console.log(`[EXTRACT-COMPANY-INFO] 🔍 Buscando via Serper: "${companyNameKeyword}"`);
        
        // ✅ QUERIES MELHORADAS (igual Export Dealers) - focadas em portais B2B confiáveis
        // ⚠️ REMOVIDO: kompass.com e europages.com (são portais que retornam resultados genéricos)
        const serperQueries = [
          `"${companyNameKeyword}" company location country -alibaba -made-in-china -ebay -aliexpress -kompass -europages`,
          `"${companyNameKeyword}" headquarters address -alibaba -made-in-china -ebay -aliexpress`,
          `site:linkedin.com/company "${companyNameKeyword}" location -publication -transactions -journal`,
        ];
        
        // Lista completa de países (expansão do Export Dealers)
        const allCountries = [
          'United Kingdom', 'United States', 'Brasil', 'Argentina', 'Colombia',
          'Mexico', 'Chile', 'Peru', 'Germany', 'France', 'Italy', 'Spain',
          'China', 'Japan', 'South Korea', 'India', 'Australia', 'Canada',
          'Portugal', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
          'Poland', 'Czech Republic', 'Turkey', 'South Africa', 'New Zealand',
        ];
        
        for (const query of serperQueries.slice(0, 3)) { // Limitar a 3 queries para economizar créditos
          try {
            const serperResponse = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: query, num: 10 }), // Aumentar para 10 resultados
            });
            
            if (serperResponse.ok) {
              const serperData = await serperResponse.json();
              const organic = serperData.organic || [];
              
              // Extrair país dos resultados do Serper (validação mais rigorosa)
              for (const item of organic) {
                const snippet = (item.snippet || '').toLowerCase();
                const title = (item.title || '').toLowerCase();
                const link = (item.link || '').toLowerCase();
                const text = snippet + ' ' + title + ' ' + link;
                
                // ✅ VALIDAÇÃO RIGOROSA: buscar país apenas em contexto relevante
                const locationContexts = [
                  /(?:located|headquartered|based|office|address|from|in)\s+([^,\\.]{0,50})/gi,
                  /(?:country|location|city|address)[:\s]+([^,\\.]{0,50})/gi,
                ];
                
                for (const country of allCountries) {
                  const countryLower = country.toLowerCase();
                  if (text.includes(countryLower) && !result.country) {
                    // Validar contexto (não apenas menção aleatória)
                    const contextWords = ['location', 'address', 'headquarter', 'office', 'city', 'country', 'based', 'located', 'from', 'in'];
                    const hasContext = contextWords.some(word => {
                      const wordIndex = text.indexOf(word);
                      const countryIndex = text.indexOf(countryLower);
                      // País deve estar próximo (dentro de 100 caracteres) de uma palavra de contexto
                      return wordIndex !== -1 && Math.abs(countryIndex - wordIndex) < 100;
                    });
                    
                    // ✅ VALIDAÇÃO RIGOROSA: Filtrar marketplaces, portais e e-commerce
                    const blockedPatterns = [
                      // MARKETPLACES (BLOQUEADOS TOTALMENTE!)
                      'alibaba.com', 'made-in-china.com', 'ebay.', 'etsy.com', 'amazon.com',
                      'aliexpress.com', 'globalsources.com', 'dhgate.com', 'tradekey.com',
                      'ec21.com', 'ecplaza.net', 'indiamart.com', 'faire.com',
                      // PORTALS DE E-COMMERCE (BLOQUEADOS!)
                      'kompass.com', 'europages.com', 'thomasnet.com',
                      // REDES SOCIAIS E BLOGS (BLOQUEADOS!)
                      'facebook.com', 'fb.com', 'facebook.com/pages', 'facebook.com/posts', 'facebook.com/groups',
                      'linkedin.com/company', 'linkedin.com/posts', 'linkedin.com/pulse',
                      'blog', 'news', 'article', 'magazine', 'journal', 'publication',
                      // E-COMMERCE GENÉRICO (BLOQUEADOS!)
                      'shop', 'store', 'wholesale', 'retail', 'online store',
                      // MADE IN CHINA (BLOQUEADOS!)
                      'made in china', 'made-in-china', 'chinese manufacturer',
                      // PORTALS ACADÊMICOS (BLOQUEADOS!)
                      'ieee', 'transactions', 'publications', 'publisher',
                      // EBAY/AMAZON (BLOQUEADOS!)
                      'ebay.com/itm', 'amazon.com/product', 'amazon.com/dp',
                      // ARTIGOS/LISTAS (BLOQUEADOS!)
                      'top 100', 'top 50', 'top 10', 'best manufacturers', 'best suppliers',
                      'manufacturers in', 'suppliers in', 'distributors in',
                      '(2025)', '(2024)', '(2023)', // Anos em parênteses (geralmente artigos)
                    ];
                    const isBlocked = blockedPatterns.some(pattern => 
                      link.includes(pattern) || 
                      snippet.includes(pattern) || 
                      title.includes(pattern)
                    );
                    
                    // 🚫 VALIDAR TÍTULO DO RESULTADO SERPER (bloquear artigos/listas)
                    const titleLower = (item.title || '').toLowerCase();
                    const isArticleTitle = /^top\s+\d+/i.test(item.title || '') ||
                                          /\(20\d{2}\)$/i.test(item.title || '') ||
                                          /manufacturers\s+in\s+\w+\s*\(20\d{2}\)/i.test(item.title || '') ||
                                          /^(the|a)\s+(best|top|complete|ultimate)/i.test(item.title || '') ||
                                          /^buy|sell|shop|store|wholesale/i.test(item.title || '');
                    
                    if (hasContext && !isBlocked && !isArticleTitle) {
                      result.country = country;
                      console.log(`[EXTRACT-COMPANY-INFO] ✅ País encontrado via Serper: ${country} (fonte: ${item.link})`);
                      
                      // Atualizar nome se encontrado melhor no Serper (remover sufixos)
                      // ⚠️ VALIDAÇÃO RIGOROSA: bloquear nomes que parecem artigos/produtos
                      if (item.title && item.title.length > 3 && item.title.length < 100) {
                        let cleanTitle = item.title
                          .replace(/\s*[-|]\s*.*$/, '') // Remover "| Company Name" ou "- Description"
                          .replace(/^(Wholesale|Buy|Shop|Online|Store|Sale)\s+/i, '')
                          .replace(/\s+(Wholesale|Sale|Store|Online|Shop)$/i, '')
                          .trim();
                        
                        // 🚫 VALIDAÇÃO ADICIONAL: bloquear nomes que parecem artigos
                        const isArticleName = /^top\s+\d+/i.test(cleanTitle) ||
                                             /\(20\d{2}\)$/i.test(cleanTitle) ||
                                             /manufacturers\s+in/i.test(cleanTitle) ||
                                             /^(the|a)\s+(best|top|complete)/i.test(cleanTitle) ||
                                             /direct\s+sales|factory\s+direct|your\s+best/i.test(cleanTitle);
                        
                        if (cleanTitle.length > 3 && cleanTitle.length < 80 && !isArticleName) {
                          result.company_name = cleanTitle;
                          console.log(`[EXTRACT-COMPANY-INFO] ✅ Nome atualizado via Serper: "${result.company_name}"`);
                        } else {
                          console.log(`[EXTRACT-COMPANY-INFO] ⚠️ Nome do Serper rejeitado (parece artigo/produto): "${cleanTitle}"`);
                        }
                      }
                      break;
                    } else if (isArticleTitle || isBlocked) {
                      console.log(`[EXTRACT-COMPANY-INFO] ⚠️ Resultado Serper bloqueado: ${item.link} (artigo/marketplace)`);
                    }
                  }
                }
                
                if (result.country) break;
              }
            }
            
            // Delay 500ms entre queries
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error(`[EXTRACT-COMPANY-INFO] Erro na query Serper:`, err);
          }
          
          if (result.country) break; // Se encontrou país, parar
        }
        
        if (result.country) {
          result.source = 'serper_search';
          console.log(`[EXTRACT-COMPANY-INFO] ✅ País determinado via Serper: ${result.country}`);
        } else {
          console.log(`[EXTRACT-COMPANY-INFO] ⚠️ País não encontrado via Serper para "${companyNameKeyword}"`);
        }
      } catch (error) {
        console.error(`[EXTRACT-COMPANY-INFO] Erro na busca Serper:`, error);
        // Continuar com scraping se Serper falhar
      }
    }

    // ========================================================================
    // 2️⃣ SCRAPING DA PÁGINA
    // ========================================================================
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (response.ok) {
        const html = await response.text();
        const htmlLower = html.toLowerCase();

        // ====================================================================
        // 2.1 NOME DA EMPRESA (Meta tags, title, footer)
        // ====================================================================
        
        // Meta tags (prioridade alta)
        const ogSiteName = html.match(/property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
        if (ogSiteName && ogSiteName[1]) {
          result.company_name = ogSiteName[1].trim();
          console.log(`[EXTRACT-COMPANY-INFO] ✅ Nome do og:site_name: ${result.company_name}`);
        }

        // Schema.org Organization name
        const schemaOrg = html.match(/"@type"\s*:\s*"Organization"[^}]*"name"\s*:\s*"([^"]+)"/i);
        if (schemaOrg && schemaOrg[1] && !result.company_name) {
          result.company_name = schemaOrg[1].trim();
          console.log(`[EXTRACT-COMPANY-INFO] ✅ Nome do Schema.org: ${result.company_name}`);
        }

        // Title tag (mas apenas se parecer nome de empresa, não título de página)
        if (!result.company_name) {
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1].trim();
            // Se título contém "|", pegar a parte antes do |
            if (title.includes('|')) {
              result.company_name = title.split('|')[0].trim();
            } else if (title.length < 60) {
              // Títulos muito longos geralmente são de páginas, não nomes de empresa
              result.company_name = title;
            }
            console.log(`[EXTRACT-COMPANY-INFO] ✅ Nome do title: ${result.company_name}`);
          }
        }

        // Footer (geralmente tem nome legal da empresa)
        const footerMatch = html.match(/<footer[^>]*>([\s\S]{0,2000})<\/footer>/i);
        if (footerMatch && !result.company_name) {
          const footerText = footerMatch[1];
          // Buscar padrões como "© 2024, [Nome da Empresa]" ou "[Nome da Empresa] | All rights reserved"
          const copyrightMatch = footerText.match(/©\s*\d{4}[,\s]*([^|<>]+?)(?:\s*[|<]|$)/i);
          if (copyrightMatch && copyrightMatch[1]) {
            const footerName = copyrightMatch[1].trim().replace(/['"]/g, '');
            if (footerName.length > 3 && footerName.length < 100) {
              result.company_name = footerName;
              console.log(`[EXTRACT-COMPANY-INFO] ✅ Nome do footer: ${result.company_name}`);
            }
          }
        }

        // ====================================================================
        // 2.1.1 VALIDAÇÃO RIGOROSA DO NOME DA EMPRESA EXTRAÍDO
        // ====================================================================
        // ⚠️ BLOQUEAR nomes que parecem ser artigos, produtos, livros, listas
        if (result.company_name) {
          const extractedName = result.company_name.toLowerCase();
          const extractedNameOriginal = result.company_name;
          
          // 🚫 BLOQUEAR PADRÕES DE ARTIGOS/PUBLICAÇÕES
          const articlePatterns = [
            /^top\s+\d+/i, // "Top 100", "Top 50", etc.
            /\(20\d{2}\)$/i, // "(2025)", "(2024)", etc. no final
            /^the\s+(?:best|top|complete|ultimate|guide\s+to)/i, // "The Best", "The Top", etc.
            /^[A-Z][^:]*:\s*[A-Z]/i, // Títulos de livro: "Title: Subtitle"
            /part\s+[ivx]+:/i, // "Part II:", "Part III:", etc.
            /^(exercises|training|manual|guide|tutorial|how to)/i, // Guias, manuais
            /(?:manufacturers|suppliers|distributors)\s+in\s+\w+\s*\(20\d{2}\)/i, // "Manufacturers in Canada (2025)"
            /^(buy|sell|shop|store|wholesale|retail)\s+/i, // Produtos, não empresas
            /direct\s+sales|factory\s+direct|your\s+best\s+choice/i, // Slogans/produtos
            /^factory\s+direct\s+sales/i, // "Factory direct sales..."
            /good\s+quality\s+and\s+low/i, // Frases de produto
          ];
          
          const isArticleOrProduct = articlePatterns.some(pattern => pattern.test(extractedNameOriginal));
          
          // 🚫 BLOQUEAR NOMES MUITO LONGOS (geralmente são títulos de artigos/páginas)
          const isTooLong = extractedNameOriginal.length > 80;
          
          // 🚫 BLOQUEAR NOMES COM EMOJIS (geralmente são posts/páginas, não empresas)
          const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(extractedNameOriginal);
          
          // 🚫 BLOQUEAR NOMES QUE SÃO TÍTULOS DE LISTAS
          const isListTitle = /^(top|best|complete|ultimate)\s+\d+\s+/i.test(extractedNameOriginal);
          
          if (isArticleOrProduct || isTooLong || hasEmojis || isListTitle) {
            console.error(`[EXTRACT-COMPANY-INFO] 🚫 REJEITADO: Nome extraído parece ser artigo/produto/livro - "${extractedNameOriginal}"`);
            result.company_name = null; // Limpar nome inválido
          } else {
            console.log(`[EXTRACT-COMPANY-INFO] ✅ Nome validado: "${extractedNameOriginal}"`);
          }
        }

        // ====================================================================
        // 2.2 PAÍS E LOCALIZAÇÃO (Endereço, código postal, telefone)
        // ====================================================================

        // Mapeamento de códigos postais e padrões → país
        const postalCodePatterns: Record<string, string> = {
          // UK
          '\\b[A-Z]{1,2}\\d{1,2}[A-Z]?\\s?\\d[A-Z]{2}\\b': 'United Kingdom',
          '\\bWR\\d{1,2}\\s?\\d[A-Z]{2}\\b': 'United Kingdom', // Ex: WR11 1AD
          '\\b[SWNWES][0-9]{1,2}\\s?\\d[A-Z]{2}\\b': 'United Kingdom',
          // USA
          '\\b\\d{5}(-\\d{4})?\\b': 'United States', // ZIP code
          // Canada
          '\\b[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d\\b': 'Canada',
          // Brasil
          '\\b\\d{5}-?\\d{3}\\b': 'Brasil', // CEP
        };

        // Buscar código postal no HTML
        // ⚠️ NÃO sobrescrever se país já foi determinado por cidade no nome (prioridade máxima)
        for (const [pattern, country] of Object.entries(postalCodePatterns)) {
          const regex = new RegExp(pattern, 'gi');
          const matches = html.match(regex);
          if (matches && matches.length > 0 && !result.country) {
            result.country = country;
            console.log(`[EXTRACT-COMPANY-INFO] ✅ País extraído via código postal: ${country} (${matches[0]})`);
            
            // Extrair cidade próxima ao código postal
            const matchIndex = html.indexOf(matches[0]);
            const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
            // Buscar padrões como "City, State" ou "City, Country" antes do código postal
            const cityMatch = context.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)?/);
            if (cityMatch) {
              result.city = cityMatch[1].trim();
              if (cityMatch[2]) {
                result.state = cityMatch[2].trim();
              }
            }
            break;
          }
        }

        // Buscar endereços completos (footer, contact section)
        const addressPatterns = [
          // UK: "Street, City, County, Postcode"
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+(?:Street|Road|Avenue|Way|Lane|Drive))?),?\s*([A-Z][a-z]+),?\s*([A-Z][a-z]+)?,?\s*([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/gi,
          // USA: "Street, City, State ZIP"
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+(?:Street|Road|Avenue|Way|Boulevard))?),?\s*([A-Z][a-z]+),?\s*([A-Z]{2})\s+(\d{5}(-\d{4})?)/gi,
        ];

        for (const pattern of addressPatterns) {
          const matches = html.matchAll(pattern);
          for (const match of matches) {
            if (match[1] && match[2]) {
              result.address = match[0].trim();
              result.city = match[2].trim();
              if (match[3]) {
                result.state = match[3].trim();
              }
              
              // Determinar país baseado no padrão
              if (!result.country) {
                if (match[4] && /[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i.test(match[4])) {
                  result.country = 'United Kingdom';
                } else if (match[4] && /^\d{5}(-\d{4})?$/.test(match[4])) {
                  result.country = 'United States';
                }
              }
              
              console.log(`[EXTRACT-COMPANY-INFO] ✅ Endereço extraído: ${result.address}`);
              break;
            }
          }
        }

        // ====================================================================
        // ✅ EXTRATOR DE DDI (CÓDIGO TELEFÔNICO INTERNACIONAL) - FONTE CONFIÁVEL
        // ====================================================================
        // Buscar telefone com código do país (DDI) - ALTA PRECISÃO
        // Padrão genérico: +[DDI] ... ou (DDI) ... ou DDI ...
        const phonePatterns = [
          /\+\s*(\d{1,4})[\s\-\(\)]?[\d\s\-\(\)]{6,15}/g, // Padrão genérico: +DDI número
          /\(?\s*\+?\s*(\d{1,4})\s*\)?[\s\-]?[\d\s\-\(\)]{6,15}/g, // Com ou sem parênteses
        ];

        // ✅ MAPEAMENTO COMPLETO DE DDI → PAÍS (fonte confiável)
        const ddiToCountry: Record<string, string> = {
          '1': 'United States',      // +1 (USA/Canada - assumir USA)
          '44': 'United Kingdom',     // +44
          '55': 'Brasil',             // +55
          '54': 'Argentina',          // +54
          '57': 'Colombia',           // +57
          '52': 'Mexico',             // +52
          '56': 'Chile',              // +56
          '51': 'Peru',               // +51
          '86': 'China',              // +86
          '49': 'Germany',            // +49
          '33': 'France',             // +33
          '39': 'Italy',              // +39
          '34': 'Spain',              // +34
          '81': 'Japan',              // +81
          '82': 'South Korea',        // +82
          '91': 'India',              // +91
          '61': 'Australia',          // +61
          '31': 'Netherlands',        // +31
          '32': 'Belgium',            // +32
          '41': 'Switzerland',        // +41
          '43': 'Austria',            // +43
          '351': 'Portugal',          // +351
          '90': 'Turkey',             // +90
          '506': 'Costa Rica',        // +506
          '507': 'Panama',            // +507
          '593': 'Ecuador',           // +593
          '595': 'Paraguay',          // +595
          '598': 'Uruguay',           // +598
          '27': 'South Africa',       // +27
          '64': 'New Zealand',        // +64
        };

        // Buscar todos os telefones no HTML
        for (const pattern of phonePatterns) {
          const matches = html.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              const ddi = match[1].trim();
              const country = ddiToCountry[ddi];
              
              if (country && !result.country) {
                result.country = country;
                result.phone = match[0].trim();
                console.log(`[EXTRACT-COMPANY-INFO] ✅ País determinado via DDI (+${ddi}): ${country} (${result.phone})`);
                break; // Usar o primeiro DDI encontrado
              }
            }
          }
          if (result.country) break; // Se encontrou país via DDI, parar
        }

        // Buscar menções diretas de países no contexto de contato/localização
        const locationContexts = [
          /(?:located|headquartered|based|office|address)[^.]{0,200}(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
          /(?:contact|reach|find)\s+us[^.]{0,200}(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        ];

        const countriesList = [
          'United Kingdom', 'United States', 'Brasil', 'Argentina', 'Colombia',
          'Mexico', 'Chile', 'Peru', 'Germany', 'France', 'Italy', 'Spain',
          'China', 'Japan', 'South Korea', 'India', 'Australia', 'Canada',
        ];

        if (!result.country) {
          for (const pattern of locationContexts) {
            const matches = html.matchAll(pattern);
            for (const match of matches) {
              const foundCountry = countriesList.find(c => 
                match[0].toLowerCase().includes(c.toLowerCase())
              );
              if (foundCountry) {
                result.country = foundCountry;
                console.log(`[EXTRACT-COMPANY-INFO] ✅ País extraído via contexto: ${result.country}`);
                break;
              }
            }
            if (result.country) break;
          }
        }

        // ====================================================================
        // 2.3 EMAIL (geralmente tem domínio que confirma país/localização)
        // ====================================================================
        const emailMatch = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          result.email = emailMatch[1].trim();
        }

        // ✅ Preservar source do Serper se país já foi encontrado via Serper
        if (!result.source || result.source === 'none') {
          result.source = 'website_scraping';
        }
      }
    } catch (error) {
      console.error(`[EXTRACT-COMPANY-INFO] ❌ Erro no scraping:`, error);
    }

    // ========================================================================
    // 3️⃣ VALIDAÇÃO E LIMPEZA
    // ========================================================================

    // Validar nome da empresa (remover sufixos comuns de título de página)
    if (result.company_name) {
      const removePatterns = [
        /^(Wholesale|Buy|Shop|Online|Store|Sale)\s+/i,
        /\s+(Wholesale|Sale|Store|Online|Shop)$/i,
        /\s*[-|]\s*.*$/i, // Remover tudo depois de "-" ou "|"
      ];
      
      for (const pattern of removePatterns) {
        result.company_name = result.company_name.replace(pattern, '').trim();
      }

      // Se nome ficou muito curto ou vazio, usar domínio
      if (result.company_name.length < 3) {
        result.company_name = domain
          .split('.')[0]
          .split(/[-_]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
    }

    console.log(`[EXTRACT-COMPANY-INFO] ✅ Resultado final:`, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[EXTRACT-COMPANY-INFO] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao extrair informações' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
