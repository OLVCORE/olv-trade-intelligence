import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SCRAPE WEBSITE E CALCULAR FIT SCORE
// ============================================================================

async function scrapeAndScorePilates(website: string): Promise<{
  fitScore: number;
  pilatesKeywordsFound: string[];
  isPilatesDealer: boolean;
}> {
  try {
    console.log(`[SCRAPE] 🔍 Analisando: ${website}`);

    // Fetch homepage
    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MetaLifeBot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.log(`[SCRAPE] ❌ HTTP ${response.status} for ${website}`);
      return { fitScore: 0, pilatesKeywordsFound: [], isPilatesDealer: false };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extrair todo texto da página
    const pageText = $('body').text().toLowerCase();
    const title = $('title').text().toLowerCase();
    const metaDescription = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
    const combined = `${title} ${metaDescription} ${pageText}`;

    // KEYWORDS PILATES (mínimo 2 para considerar dealer)
    const pilatesKeywords = [
      'pilates',
      'reformer',
      'cadillac',
      'wunda chair',
      'pilates chair',
      'pilates barrel',
      'pilates mat',
      'pilates apparatus',
      'pilates equipment',
      'pilates reformer',
      'pilates studio',
      'pilates machine',
      'pilates spring',
      'pilates accessories',
      'pilates wholesale',
      'pilates distributor',
      'pilates manufacturer',
    ];

    const found = pilatesKeywords.filter(kw => combined.includes(kw));

    // CALCULAR FIT SCORE
    let fitScore = 0;
    let isPilatesDealer = false;

    if (found.length >= 2) {
      // Tem pelo menos 2 palavras Pilates
      isPilatesDealer = true;
      
      // Score base
      fitScore = 60;
      
      // +5 por cada keyword adicional (max +30)
      fitScore += Math.min((found.length - 2) * 5, 30);
      
      // BÔNUS: Se menciona "wholesale", "distributor", "dealer"
      if (combined.includes('wholesale') || combined.includes('distributor') || combined.includes('dealer')) {
        fitScore += 10;
      }
      
      // BÔNUS: Se menciona "b2b", "commercial", "professional"
      if (combined.includes('b2b') || combined.includes('commercial') || combined.includes('professional')) {
        fitScore += 5;
      }
      
      // Cap em 95
      fitScore = Math.min(fitScore, 95);
    }

    console.log(`[SCRAPE] ✅ ${website}: Score ${fitScore}, Keywords: ${found.length}`);

    return {
      fitScore,
      pilatesKeywordsFound: found.slice(0, 5), // Top 5
      isPilatesDealer,
    };

  } catch (error) {
    console.error(`[SCRAPE] ❌ Erro em ${website}:`, error);
    return { fitScore: 0, pilatesKeywordsFound: [], isPilatesDealer: false };
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
    const { companies } = await req.json();

    if (!companies || !Array.isArray(companies)) {
      throw new Error('companies array required');
    }

    console.log(`[VALIDATE] 🚀 Validando ${companies.length} empresas...`);

    const validated = [];

    // Processar em paralelo (mas limitado a 5 simultâneos)
    const batchSize = 5;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (company: any) => {
          const validation = await scrapeAndScorePilates(company.website);
          
          return {
            ...company,
            fitScore: validation.fitScore,
            pilatesKeywords: validation.pilatesKeywordsFound,
            isPilatesDealer: validation.isPilatesDealer,
            validated: true,
          };
        })
      );

      validated.push(...batchResults);

      // Pequeno delay entre batches
      if (i + batchSize < companies.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Filtrar apenas dealers válidos (Score > 0)
    const pilatesDealers = validated.filter(c => c.fitScore > 0);

    console.log(`[VALIDATE] ✅ Resultado:`);
    console.log(`  Total: ${validated.length}`);
    console.log(`  Dealers Pilates: ${pilatesDealers.length}`);
    console.log(`  Taxa: ${((pilatesDealers.length / validated.length) * 100).toFixed(0)}%`);

    return new Response(
      JSON.stringify({
        total: validated.length,
        pilatesDealers: pilatesDealers.length,
        validated: validated,
        pilatesDealersOnly: pilatesDealers,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[VALIDATE] ❌:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

