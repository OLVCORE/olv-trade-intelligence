/**
 * EDGE FUNCTION: Extrair País de URL (Website/Facebook/LinkedIn)
 * 
 * Faz scraping inteligente para extrair localização real da empresa
 * SEM DADOS HARDCODED - apenas fontes reais
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractCountryRequest {
  url: string;
  apollo_key?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 204 });
  }

  try {
    const { url, apollo_key }: ExtractCountryRequest = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[EXTRACT-COUNTRY] 🔍 Extraindo país de: ${url}`);

    // ========================================================================
    // 1️⃣ FACEBOOK - Extrair do Graph API ou scraping
    // ========================================================================
    if (url.includes('facebook.com')) {
      try {
        // Tentar extrair da URL do Facebook (página pública)
        // Facebook não permite scraping fácil, mas podemos tentar extrair de metadados
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.ok) {
          const html = await response.text();
          
          // Buscar padrões de localização no HTML (Facebook geralmente tem isso)
          const locationPatterns = [
            /"addressCountry":"([^"]+)"/i,
            /"addressLocality":"([^"]+)"[^}]*"addressCountry":"([^"]+)"/i,
            /(?:China|United States|Brasil|Argentina|Colombia|Mexico|Chile|Peru|Germany|France|United Kingdom|Italy|Spain)/gi,
          ];
          
          // Buscar país conhecido no texto
          const countries = [
            'China', 'United States', 'Brasil', 'Argentina', 'Colombia',
            'Mexico', 'Chile', 'Peru', 'Germany', 'France', 'United Kingdom',
            'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland',
            'Japan', 'South Korea', 'India', 'Singapore', 'Thailand',
            'Indonesia', 'Philippines', 'Malaysia', 'Vietnam',
            'Australia', 'New Zealand', 'Canada',
            'Saudi Arabia', 'United Arab Emirates', 'Qatar',
            'South Africa', 'Nigeria', 'Egypt', 'Kenya',
          ];
          
          // Extrair de padrões JSON-LD ou microdata
          for (const pattern of locationPatterns) {
            const matches = html.match(pattern);
            if (matches) {
              const countryMatch = countries.find(c => 
                matches.some(m => typeof m === 'string' && m.toLowerCase().includes(c.toLowerCase()))
              );
              if (countryMatch) {
                console.log(`[EXTRACT-COUNTRY] ✅ País extraído do Facebook: ${countryMatch}`);
                return new Response(
                  JSON.stringify({ country: countryMatch, source: 'facebook_scraping' }),
                  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }
          
          // Buscar cidade conhecida → país
          const cityToCountry: Record<string, string> = {
            'guangzhou': 'China',
            'guangdong': 'China',
            'beijing': 'China',
            'shanghai': 'China',
            'shenzhen': 'China',
            'bogotá': 'Colombia',
            'bogota': 'Colombia',
            'são paulo': 'Brasil',
            'buenos aires': 'Argentina',
            'mexico city': 'Mexico',
          };
          
          const htmlLower = html.toLowerCase();
          for (const [city, country] of Object.entries(cityToCountry)) {
            if (htmlLower.includes(city)) {
              console.log(`[EXTRACT-COUNTRY] ✅ País extraído via cidade no Facebook: ${city} → ${country}`);
              return new Response(
                JSON.stringify({ country, source: 'facebook_city_extraction' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      } catch (error) {
        console.error(`[EXTRACT-COUNTRY] ❌ Erro ao extrair de Facebook:`, error);
      }
    }

    // ========================================================================
    // 2️⃣ LINKEDIN - Tentar extrair via API ou scraping
    // ========================================================================
    if (url.includes('linkedin.com')) {
      // LinkedIn requer autenticação para API, mas podemos tentar scraping básico
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const html = await response.text();
          
          // Buscar localização no LinkedIn (geralmente aparece como "Location" ou "Headquarters")
          const locationPatterns = [
            /"headquarterLocation":"([^"]+)"/i,
            /"location":"([^"]+)"/i,
            /(?:China|United States|Brasil|Argentina|Colombia|Mexico)/gi,
          ];
          
          const countries = ['China', 'United States', 'Brasil', 'Argentina', 'Colombia', 'Mexico', 'Chile', 'Peru'];
          
          for (const pattern of locationPatterns) {
            const matches = html.match(pattern);
            if (matches) {
              const countryMatch = countries.find(c => 
                matches.some(m => typeof m === 'string' && m.toLowerCase().includes(c.toLowerCase()))
              );
              if (countryMatch) {
                console.log(`[EXTRACT-COUNTRY] ✅ País extraído do LinkedIn: ${countryMatch}`);
                return new Response(
                  JSON.stringify({ country: countryMatch, source: 'linkedin_scraping' }),
                  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }
        }
      } catch (error) {
        console.error(`[EXTRACT-COUNTRY] ❌ Erro ao extrair de LinkedIn:`, error);
      }
    }

    // ========================================================================
    // 3️⃣ WEBSITE NORMAL - Tentar extrair de contato/sobre
    // ========================================================================
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const html = await response.text();
        const htmlLower = html.toLowerCase();
        
        // Buscar país no conteúdo (contato, sobre, etc.)
        const countries = [
          'China', 'United States', 'Brasil', 'Argentina', 'Colombia',
          'Mexico', 'Chile', 'Peru', 'Germany', 'France', 'United Kingdom',
        ];
        
        for (const country of countries) {
          if (htmlLower.includes(country.toLowerCase())) {
            // Validar contexto (não apenas menção aleatória)
            const context = htmlLower.substring(
              Math.max(0, htmlLower.indexOf(country.toLowerCase()) - 50),
              Math.min(htmlLower.length, htmlLower.indexOf(country.toLowerCase()) + 50)
            );
            
            // Se estiver próximo a palavras como "location", "address", "headquarters", "office"
            if (context.includes('location') || context.includes('address') || 
                context.includes('headquarter') || context.includes('office') ||
                context.includes('city') || context.includes('country')) {
              console.log(`[EXTRACT-COUNTRY] ✅ País extraído do website: ${country}`);
              return new Response(
                JSON.stringify({ country, source: 'website_scraping' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(`[EXTRACT-COUNTRY] ❌ Erro ao extrair de website:`, error);
    }

    // ========================================================================
    // 4️⃣ FALLBACK: Não encontrado
    // ========================================================================
    console.warn(`[EXTRACT-COUNTRY] ⚠️ País não encontrado para ${url}`);
    return new Response(
      JSON.stringify({ country: null, source: 'none', message: 'País não encontrado via scraping' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[EXTRACT-COUNTRY] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao extrair país' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
