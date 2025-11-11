import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { website_url, tenant_id } = await req.json();

    console.log('[IMPORT-CATALOG] Importando de:', website_url);

    if (!website_url || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'website_url e tenant_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch website HTML
    const response = await fetch(website_url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Tentar detectar produtos (MetaLife Pilates como exemplo)
    const products: any[] = [];

    // Estratégia 1: Procurar por produtos no HTML
    $('.product, .produto, [data-product]').each((_, el) => {
      const $el = $(el);
      const name = $el.find('h2, h3, .product-title').text().trim() || $el.find('a').text().trim();
      const price = $el.find('.price, .preco').text().trim();
      const image = $el.find('img').attr('src');
      
      if (name) {
        products.push({
          tenant_id,
          name,
          category: 'Equipamento de Pilates',
          price_usd: extractPrice(price),
          image_url: image ? new URL(image, website_url).href : null,
          is_active: true,
        });
      }
    });

    // Se não encontrou produtos estruturados, tentar buscar H2/H3
    if (products.length === 0) {
      $('h2, h3').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 5 && text.length < 100) {
          products.push({
            tenant_id,
            name: text,
            category: 'Equipamento de Pilates',
            is_active: true,
          });
        }
      });
    }

    // Limitar a 50 produtos
    const productsToInsert = products.slice(0, 50);

    console.log(`[IMPORT-CATALOG] ${productsToInsert.length} produtos encontrados`);

    // Salvar no Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('tenant_products')
      .insert(productsToInsert)
      .select();

    if (error) {
      console.error('[IMPORT-CATALOG] Erro ao salvar:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        products_imported: data?.length || 0,
        products: data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[IMPORT-CATALOG] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function extractPrice(priceText: string): number | null {
  if (!priceText) return null;
  const match = priceText.match(/[\d.,]+/);
  if (!match) return null;
  return parseFloat(match[0].replace(',', '.'));
}

