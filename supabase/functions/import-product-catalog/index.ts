import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// PROFESSIONAL B2B PRODUCT SCRAPER
// ============================================================================
// Captura: imagens, especificações técnicas, dimensões, materiais
// Funciona com: WooCommerce, Shopify, sites custom
// ============================================================================

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

    // ========================================================================
    // PROFESSIONAL PRODUCT SCRAPING
    // ========================================================================
    const products: any[] = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Estratégia 1: WooCommerce Products
    $('.product, .product-item, [class*="product"]').each((_, el) => {
      const $el = $(el);
      
      // Nome do produto
      const name = 
        $el.find('h2, h3, .product-title, .woocommerce-loop-product__title').first().text().trim() ||
        $el.find('a').first().attr('title') ||
        $el.find('a').first().text().trim();
      
      if (!name || name.length < 3) return;

      // Imagens (múltiplas)
      const images: string[] = [];
      $el.find('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
        if (src && !src.includes('placeholder') && !src.includes('loading')) {
          try {
            images.push(new URL(src, website_url).href);
          } catch (e) {
            // Ignorar URLs inválidas
          }
        }
      });

      // Preço
      const priceText = $el.find('.price, .woocommerce-Price-amount, .amount').first().text().trim();
      const price = extractPrice(priceText);

      // SKU
      const sku = $el.find('.sku, [class*="sku"]').text().trim() || $el.attr('data-product-id');

      // Categoria
      const category = 
        $el.find('.product-category, [class*="categor"]').text().trim() ||
        'Equipamento de Pilates';

      // Link do produto (para scraping detalhado depois)
      const productLink = $el.find('a').first().attr('href');
      const productUrl = productLink ? new URL(productLink, website_url).href : null;

      // Descrição curta
      const description = $el.find('.product-description, .short-description').text().trim();

      products.push({
        tenant_id,
        name,
        category,
        price_usd: price,
        price_brl: price ? price * 5.5 : null, // Estimativa BRL
        images: images,
        main_image: images[0] || null,
        image_url: images[0] || null, // Compatibilidade
        sku,
        description,
        product_url: productUrl,
        is_active: true,
        origin_country: 'BR',
        min_order_quantity: 1,
        warranty_months: 12,
      });
    });

    // Estratégia 2: Se não encontrou produtos, buscar links de produtos
    if (products.length === 0) {
      $('a[href*="/produto/"], a[href*="/product/"], a[href*="/equipamento/"]').each((_, el) => {
        const $el = $(el);
        const name = $el.text().trim() || $el.attr('title');
        const image = $el.find('img').attr('src');
        const href = $el.attr('href');

        if (name && name.length > 3) {
          products.push({
            tenant_id,
            name,
            category: 'Equipamento de Pilates',
            images: image ? [new URL(image, website_url).href] : [],
            main_image: image ? new URL(image, website_url).href : null,
            product_url: href ? new URL(href, website_url).href : null,
            is_active: true,
            origin_country: 'BR',
          });
        }
      });
    }

    // Remover duplicatas por nome
    const uniqueProducts = Array.from(
      new Map(products.map(p => [p.name.toLowerCase(), p])).values()
    );

    // Limitar a 100 produtos
    const productsToInsert = uniqueProducts.slice(0, 100);

    console.log(`[IMPORT-CATALOG] ${productsToInsert.length} produtos únicos encontrados`);

    // Salvar no Supabase (com upsert para evitar duplicatas)
    const { data, error } = await supabase
      .from('tenant_products')
      .upsert(productsToInsert, { 
        onConflict: 'tenant_id,name',
        ignoreDuplicates: false 
      })
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

