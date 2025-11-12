import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dealers, tenant_id, workspace_id } = await req.json();

    if (!dealers || !tenant_id) {
      throw new Error('dealers e tenant_id são obrigatórios');
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[IMPORT] 📦 Importando ${dealers.length} dealers...`);

    // Preparar dados para inserção
    const companiesToInsert = dealers.map((dealer: any) => ({
      tenant_id: tenant_id,
      workspace_id: workspace_id || null,
      name: dealer.name,
      website: dealer.website,
      industry: dealer.industry,
      employees: dealer.employees || dealer.employee_count,
      location: {
        country: dealer.country,
        city: dealer.city,
        state: dealer.state,
      },
      raw_data: {
        source: 'apollo_multi_source',
        apollo_id: dealer.id,
        linkedin_url: dealer.linkedin || dealer.linkedin_url,
        priority_score: dealer.priority_score,
        tier: dealer.tier,
        contacts: dealer.contacts || [],
        qualification: dealer.qualification || {},
        imported_at: new Date().toISOString(),
      },
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('companies')
      .insert(companiesToInsert)
      .select();

    if (error) {
      console.error('[IMPORT] ❌ Erro:', error);
      throw error;
    }

    console.log(`[IMPORT] ✅ ${data.length} dealers importados!`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: data.length,
        companies: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[IMPORT] ❌:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

