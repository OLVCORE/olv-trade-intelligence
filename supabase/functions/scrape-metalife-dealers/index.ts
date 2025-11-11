import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SCRAPE METALIFE WEBSITE - ENCONTRAR DEALERS EXISTENTES
// ============================================================================

async function scrapeMetaLifeDealers() {
  const dealers: any[] = [];
  
  try {
    // URLs possíveis onde dealers podem estar listados
    const urlsToScrape = [
      'https://metalifepilates.com.br/',
      'https://metalifepilates.com.br/distribuidores',
      'https://metalifepilates.com.br/revendedores',
      'https://metalifepilates.com.br/parceiros',
      'https://metalifepilates.com.br/contato',
      'https://metalifepilates.com.br/sobre',
      'https://metalifepilates.com.br/internacional',
    ];

    for (const url of urlsToScrape) {
      try {
        console.log(`[SCRAPE] 🔍 Buscando em: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          console.log(`[SCRAPE] ⚠️ ${url} - Status ${response.status}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Procurar por menções de distribuidores/dealers
        const text = $('body').text().toLowerCase();

        // Patterns comuns de dealers
        const dealerPatterns = [
          /distribuidor[es]?.*?([A-Z][a-z]+ [A-Z][a-z]+)/gi,
          /revendedor[es]?.*?([A-Z][a-z]+ [A-Z][a-z]+)/gi,
          /parceiro[s]?.*?([A-Z][a-z]+ [A-Z][a-z]+)/gi,
          /dealer[s]?.*?([A-Z][a-z]+ [A-Z][a-z]+)/gi,
        ];

        // Procurar links com países
        $('a').each((i, elem) => {
          const href = $(elem).attr('href') || '';
          const linkText = $(elem).text().trim();
          
          // Se link menciona país + distribuidor
          const countryKeywords = ['usa', 'canada', 'mexico', 'spain', 'france', 'germany', 'italy', 'portugal'];
          const dealerKeywords = ['distributor', 'dealer', 'partner', 'distribuidor', 'parceiro'];
          
          const hasCountry = countryKeywords.some(c => href.toLowerCase().includes(c) || linkText.toLowerCase().includes(c));
          const isDealer = dealerKeywords.some(d => href.toLowerCase().includes(d) || linkText.toLowerCase().includes(d));
          
          if (hasCountry && isDealer) {
            dealers.push({
              source: 'metalife_website',
              url: url,
              link: href,
              text: linkText,
              found_at: new Date().toISOString(),
            });
          }
        });

        // Procurar emails de contato internacional
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const emails = text.match(emailPattern) || [];
        
        if (emails.length > 0) {
          console.log(`[SCRAPE] 📧 Emails encontrados em ${url}:`, emails);
        }

      } catch (err) {
        console.error(`[SCRAPE] ❌ Erro em ${url}:`, err);
      }
    }

    console.log(`[SCRAPE] ✅ Total de menções encontradas: ${dealers.length}`);
    return dealers;

  } catch (error) {
    console.error('[SCRAPE] ❌ Erro geral:', error);
    return [];
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
    console.log('[SCRAPE] 🌐 Iniciando scrape do site MetaLife...');

    const dealers = await scrapeMetaLifeDealers();

    return new Response(
      JSON.stringify({
        success: true,
        dealers: dealers,
        total: dealers.length,
        source: 'MetaLife Website Scrape',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[SCRAPE] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        dealers: [],
        total: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

