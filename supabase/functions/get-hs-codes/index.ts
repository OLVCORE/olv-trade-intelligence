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

    console.log(`[HS-CODES] 🔍 Buscando HS Codes: "${query}"`);

    // UN COMTRADE API (oficial, grátis, 5.000+ códigos)
    const response = await fetch(
      'https://comtrade.un.org/Data/cache/classificationHS.json'
    );

    if (!response.ok) {
      throw new Error(`UN Comtrade error: ${response.status}`);
    }

    const data = await response.json();
    const allCodes = data.results || [];

    console.log(`[HS-CODES] ✅ Total database: ${allCodes.length} códigos`);

    // FILTRAR por query (se fornecida)
    const filtered = query
      ? allCodes.filter((code: any) => {
          const text = `${code.id} ${code.text}`.toLowerCase();
          return text.includes(query.toLowerCase());
        })
      : allCodes;

    console.log(`[HS-CODES] ✅ Filtrados: ${filtered.length} códigos`);

    // Limitar a 50 resultados (performance)
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

