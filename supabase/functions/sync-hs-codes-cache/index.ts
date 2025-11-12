import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SYNC HS CODES FROM UN COMTRADE → SUPABASE STORAGE (1x por dia)
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[SYNC] 🚀 Sincronizando HS Codes da UN Comtrade...');

    // 1. BUSCAR DA UN COMTRADE
    console.log('[SYNC] 📡 Chamando UN Comtrade API...');
    const response = await fetch(
      'https://comtrade.un.org/Data/cache/classificationHS.json',
      { signal: AbortSignal.timeout(30000) } // 30s timeout
    );

    if (!response.ok) {
      throw new Error(`UN Comtrade HTTP ${response.status}`);
    }

    const data = await response.json();
    const allCodes = data.results || [];

    console.log(`[SYNC] ✅ Baixados: ${allCodes.length} códigos HS`);

    // 2. SALVAR NO SUPABASE STORAGE
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const jsonContent = JSON.stringify({ 
      synced_at: new Date().toISOString(),
      total: allCodes.length,
      codes: allCodes 
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload('hs-codes-cache.json', new Blob([jsonContent]), {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log('[SYNC] ✅ Salvo no Storage: hs-codes-cache.json');

    return new Response(
      JSON.stringify({
        success: true,
        total: allCodes.length,
        synced_at: new Date().toISOString(),
        storage_path: 'public/hs-codes-cache.json',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SYNC] ❌:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

