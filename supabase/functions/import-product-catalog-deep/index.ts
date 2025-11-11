import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// DEEP SCRAPER - BUSCA EQUIPAMENTOS PRINCIPAIS
// ============================================================================
// Para MetaLife: Reformers, Cadillacs, Chairs, Barrels
// Entra nas páginas de categoria e nas páginas individuais de produtos
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { website_url, tenant_id } = await req.json();

    console.log('[DEEP-SCRAPER] 🚀 Iniciando scraping profundo:', website_url);

    if (!website_url || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'website_url e tenant_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const products: any[] = [];

    // ========================================================================
    // STEP 1: BUSCAR CATEGORIAS DE EQUIPAMENTOS
    // ========================================================================
    const categoryUrls = [
      `${website_url}/equipamentos/linha-infinity/`,
      `${website_url}/equipamentos/linha-original/`,
      `${website_url}/equipamentos/linha-w23/`,
      `${website_url}/equipamentos/reformer-advanced/`,
      `${website_url}/loja/acessorios/`,
    ];

    for (const categoryUrl of categoryUrls) {
      try {
        console.log('[DEEP-SCRAPER] 📂 Buscando categoria:', categoryUrl);
        
        const response = await fetch(categoryUrl);
        if (!response.ok) {
          console.log('[DEEP-SCRAPER] ⚠️ Categoria não encontrada:', categoryUrl);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Buscar links de produtos individuais
        const productLinks: string[] = [];
        
        $('a[href*="/produto/"], a[href*="/product/"], .product a').each((_, el) => {
          const href = $(el).attr('href');
          if (href && !productLinks.includes(href)) {
            try {
              const fullUrl = new URL(href, categoryUrl).href;
              if (fullUrl.includes('/produto/') || fullUrl.includes('/product/')) {
                productLinks.push(fullUrl);
              }
            } catch (e) {
              // Ignorar URLs inválidas
            }
          }
        });

        console.log(`[DEEP-SCRAPER] 🔗 ${productLinks.length} produtos encontrados na categoria`);

        // ========================================================================
        // STEP 2: ENTRAR EM CADA PÁGINA DE PRODUTO (DEEP SCRAPING)
        // ========================================================================
        for (const productUrl of productLinks.slice(0, 10)) { // Limitar a 10 por categoria
          try {
            console.log('[DEEP-SCRAPER] 🔍 Scraping produto:', productUrl);
            
            const productResponse = await fetch(productUrl);
            const productHtml = await productResponse.text();
            const $product = cheerio.load(productHtml);

            // Nome do produto
            const name = 
              $product('h1.product_title, h1.product-title, h1').first().text().trim() ||
              $product('title').text().split('|')[0].trim();

            if (!name || name.length < 3) continue;

            // Múltiplas imagens
            const images: string[] = [];
            $product('.woocommerce-product-gallery img, .product-images img, .gallery img').each((_, img) => {
              const src = $product(img).attr('src') || $product(img).attr('data-src') || $product(img).attr('data-large-image');
              if (src && !src.includes('placeholder')) {
                try {
                  images.push(new URL(src, productUrl).href);
                } catch (e) {}
              }
            });

            // Preço
            const priceText = $product('.price .woocommerce-Price-amount, .price .amount, .price').first().text().trim();
            const price = extractPrice(priceText);

            // SKU
            const sku = $product('.sku, .product_meta .sku').text().trim();

            // Categoria
            const category = 
              $product('.posted_in a, .product_meta .category a').first().text().trim() ||
              extractCategoryFromUrl(categoryUrl);

            // Descrição
            const description = 
              $product('.woocommerce-product-details__short-description, .product-description, .entry-content p').first().text().trim();

            // Especificações Técnicas (buscar em tabelas)
            const technicalSpecs: any = {};
            $product('.woocommerce-product-attributes tr, .product-specs tr, table.specs tr').each((_, row) => {
              const $row = $product(row);
              const label = $row.find('th, td').first().text().trim();
              const value = $row.find('td').last().text().trim();
              
              if (label && value) {
                const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                technicalSpecs[key] = value;
              }
            });

            // Extrair peso, dimensões, volume das specs
            const weight = extractWeight(technicalSpecs, description);
            const dimensions = extractDimensions(technicalSpecs, description);
            const volume = extractVolume(technicalSpecs, description);

            products.push({
              tenant_id,
              name,
              description: description.substring(0, 500), // Limitar descrição
              category,
              hs_code: '9506.91.00', // Pilates equipment
              price_usd: price,
              price_brl: price ? price * 5.5 : null,
              images: images.slice(0, 10), // Max 10 imagens
              main_image: images[0] || null,
              image_url: images[0] || null,
              sku,
              product_url: productUrl,
              technical_specs: technicalSpecs,
              weight_kg: weight,
              dimensions_cm: dimensions,
              volume_m3: volume,
              origin_country: 'BR',
              brand: 'MetaLife',
              warranty_months: 24, // MetaLife oferece 2 anos
              min_order_quantity: 1,
              is_active: true,
            });

          } catch (error) {
            console.error('[DEEP-SCRAPER] ❌ Erro ao scraping produto:', productUrl, error);
          }

          // Delay para não sobrecarregar servidor
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error('[DEEP-SCRAPER] ❌ Erro na categoria:', categoryUrl, error);
      }
    }

    // Remover duplicatas
    const uniqueProducts = Array.from(
      new Map(products.map(p => [p.name.toLowerCase(), p])).values()
    );

    console.log(`[DEEP-SCRAPER] ✅ ${uniqueProducts.length} produtos únicos encontrados`);

    // Salvar no banco
    const { data, error } = await supabase
      .from('tenant_products')
      .insert(uniqueProducts)
      .select();

    if (error) {
      console.error('[DEEP-SCRAPER] ❌ Erro ao salvar:', error);
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
    console.error('[DEEP-SCRAPER] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractPrice(priceText: string): number | null {
  if (!priceText) return null;
  const match = priceText.match(/[\d.,]+/);
  if (!match) return null;
  return parseFloat(match[0].replace('.', '').replace(',', '.'));
}

function extractCategoryFromUrl(url: string): string {
  if (url.includes('infinity')) return 'Linha Infinity';
  if (url.includes('original')) return 'Linha Original';
  if (url.includes('w23')) return 'Linha W23';
  if (url.includes('advanced')) return 'Reformer Advanced';
  if (url.includes('acessorios')) return 'Acessórios';
  return 'Equipamento de Pilates';
}

function extractWeight(specs: any, description: string): number | null {
  // Procurar em specs técnicas
  for (const [key, value] of Object.entries(specs)) {
    if (key.includes('peso') || key.includes('weight')) {
      const match = (value as string).match(/(\d+(?:,\d+)?)\s*kg/);
      if (match) return parseFloat(match[1].replace(',', '.'));
    }
  }
  
  // Procurar na descrição
  const match = description.match(/(\d+(?:,\d+)?)\s*kg/);
  if (match) return parseFloat(match[1].replace(',', '.'));
  
  return null;
}

function extractDimensions(specs: any, description: string): string | null {
  // Procurar em specs técnicas
  for (const [key, value] of Object.entries(specs)) {
    if (key.includes('dimenso') || key.includes('dimension') || key.includes('tamanho') || key.includes('medida')) {
      return value as string;
    }
  }
  
  // Procurar padrão: 200 x 60 x 80
  const match = description.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/);
  if (match) return `${match[1]} x ${match[2]} x ${match[3]} cm`;
  
  return null;
}

function extractVolume(specs: any, description: string): number | null {
  // Procurar em specs
  for (const [key, value] of Object.entries(specs)) {
    if (key.includes('volume') || key.includes('cbm')) {
      const match = (value as string).match(/(\d+(?:,\d+)?)/);
      if (match) return parseFloat(match[1].replace(',', '.'));
    }
  }
  
  return null;
}

