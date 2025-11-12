import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    let allCodes: any[] = [];

    // TENTAR UN COMTRADE API PRIMEIRO
    try {
      console.log('[HS-CODES] Buscando UN Comtrade...');
      const response = await fetch(
        'https://comtrade.un.org/Data/cache/classificationHS.json',
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        allCodes = data.results || [];
        console.log(`[HS-CODES] ✅ UN Comtrade: ${allCodes.length} códigos`);
      } else {
        console.log(`[HS-CODES] ⚠️ UN Comtrade HTTP ${response.status}`);
      }
    } catch (apiError) {
      console.error('[HS-CODES] ⚠️ UN Comtrade falhou, usando fallback:', apiError);
    }

    // FALLBACK: Se UN Comtrade falhar, retornar vazio mas com mensagem clara
    if (allCodes.length === 0) {
      return new Response(
        JSON.stringify({
          total: 0,
          showing: 0,
          codes: [],
          error: 'UN Comtrade API temporariamente indisponível. Digite o código HS manualmente.',
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

