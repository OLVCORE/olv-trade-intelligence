import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// BUSCAR TODOS HS CODES DA UN COMTRADE (5.000+)
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query = '' } = await req.json();

    console.log(`[HS-CODES] 🔍 Query: "${query}"`);

    // BUSCAR DO CACHE SUPABASE (SUPER RÁPIDO!)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('[HS-CODES] 📦 Buscando cache Supabase Storage...');

    const { data: cacheFile, error: downloadError } = await supabase.storage
      .from('public')
      .download('hs-codes-cache.json');

    let allCodes: any[] = [];

    if (cacheFile && !downloadError) {
      const text = await cacheFile.text();
      const cached = JSON.parse(text);
      allCodes = cached.codes || [];
      console.log(`[HS-CODES] ✅ Cache: ${allCodes.length} códigos (synced: ${cached.synced_at})`);
    } else {
      // FALLBACK: Buscar direto da UN Comtrade (lento)
      console.log('[HS-CODES] ⚠️ Cache vazio, buscando UN Comtrade...');
      try {
        const response = await fetch(
          'https://comtrade.un.org/Data/cache/classificationHS.json',
          { signal: AbortSignal.timeout(10000) }
        );

        if (response.ok) {
          const data = await response.json();
          allCodes = data.results || [];
          console.log(`[HS-CODES] ✅ UN Comtrade direto: ${allCodes.length} códigos`);
        }
      } catch (apiError) {
        console.error('[HS-CODES] ❌ UN Comtrade falhou:', apiError);
      }
    }

    // Se ainda sem dados, retornar erro
    if (allCodes.length === 0) {
      return new Response(
        JSON.stringify({
          total: 0,
          showing: 0,
          codes: [],
          error: 'Cache vazio. Execute sync-hs-codes-cache primeiro.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FILTRAR por query
    const filtered = query
      ? allCodes.filter((code: any) => {
          const text = `${code.id} ${code.text}`.toLowerCase();
          return text.includes(query.toLowerCase());
        })
      : allCodes.slice(0, 100); // Primeiros 100 se sem query

    console.log(`[HS-CODES] ✅ Filtrados: ${filtered.length}`);

    // Limitar a 50 resultados
    const limited = filtered.slice(0, 50);

    return new Response(
      JSON.stringify({
        total: filtered.length,
        showing: limited.length,
        codes: limited.map((c: any) => ({
          code: c.id,
          description: c.text,
          parent: c.parent || null,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[HS-CODES] ❌:', error);
    return new Response(
      JSON.stringify({ error: error.message, codes: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

