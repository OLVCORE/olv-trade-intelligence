/**
 * ============================================================================
 * REVEAL LUSHA CONTACT (VIP)
 * ============================================================================
 * 
 * Revela contato pessoal (mobile + email pessoal) usando Lusha API
 * APENAS para C-Level e decisores VIP
 * 
 * Custo estimado: ~3 créditos Lusha
 * 
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[REVEAL-LUSHA] 💎 Iniciando reveal VIP...');
    
    const { decisor_id, linkedin_url, full_name, company_name } = await req.json();
    
    if (!decisor_id) {
      throw new Error('decisor_id é obrigatório');
    }
    
    // 🔑 LUSHA API KEY
    const lushaApiKey = Deno.env.get('LUSHA_API_KEY');
    
    if (!lushaApiKey) {
      console.error('[REVEAL-LUSHA] ❌ LUSHA_API_KEY não configurada!');
      return new Response(
        JSON.stringify({ 
          error: 'Lusha API não configurada',
          details: 'LUSHA_API_KEY missing'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[REVEAL-LUSHA] 🔍 Buscando contato VIP para:', full_name);
    
    // 💎 CHAMADA LUSHA API
    // Endpoint: https://api.lusha.com/person
    // Doc: https://www.lusha.com/docs/api/
    
    let lushaResponse;
    
    if (linkedin_url) {
      // 1️⃣ MÉTODO PREFERIDO: Busca por LinkedIn URL
      console.log('[REVEAL-LUSHA] 🔗 Buscando por LinkedIn URL:', linkedin_url);
      
      lushaResponse = await fetch('https://api.lusha.com/person', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': lushaApiKey
        },
        body: JSON.stringify({
          linkedinUrl: linkedin_url
        })
      });
    } else if (full_name && company_name) {
      // 2️⃣ FALLBACK: Busca por nome + empresa
      console.log('[REVEAL-LUSHA] 👤 Buscando por nome + empresa:', full_name, company_name);
      
      lushaResponse = await fetch('https://api.lusha.com/person', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': lushaApiKey
        },
        body: JSON.stringify({
          name: full_name,
          company: company_name
        })
      });
    } else {
      throw new Error('LinkedIn URL ou (nome + empresa) são obrigatórios');
    }
    
    if (!lushaResponse.ok) {
      const errorText = await lushaResponse.text();
      console.error('[REVEAL-LUSHA] ❌ Erro Lusha API:', errorText);
      throw new Error(`Lusha API error: ${lushaResponse.status} - ${errorText}`);
    }
    
    const lushaData = await lushaResponse.json();
    console.log('[REVEAL-LUSHA] ✅ Resposta Lusha:', JSON.stringify(lushaData, null, 2));
    
    // Extrair dados relevantes
    const mobilePhone = lushaData.phoneNumbers?.find((p: any) => p.type === 'mobile')?.number;
    const personalEmail = lushaData.emailAddresses?.find((e: any) => !e.type?.includes('work'))?.address;
    
    if (!mobilePhone && !personalEmail) {
      console.warn('[REVEAL-LUSHA] ⚠️ Nenhum contato pessoal encontrado');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Nenhum contato pessoal disponível'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[REVEAL-LUSHA] ✅ Mobile:', mobilePhone || 'N/A');
    console.log('[REVEAL-LUSHA] ✅ Email pessoal:', personalEmail || 'N/A');
    
    // 💾 SALVAR NO BANCO (opcional - pode ser feito no frontend)
    // Aqui retornamos apenas os dados, o frontend decide se salva ou não
    
    return new Response(
      JSON.stringify({
        success: true,
        mobile: mobilePhone || null,
        personal_email: personalEmail || null,
        all_phones: lushaData.phoneNumbers || [],
        all_emails: lushaData.emailAddresses || [],
        cost: 3 // Custo estimado em créditos
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('[REVEAL-LUSHA] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

