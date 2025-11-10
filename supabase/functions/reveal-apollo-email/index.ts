import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevealEmailRequest {
  decisor_id: string; // ID do decisor no Supabase
  company_domain?: string;
  linkedin_url?: string;
  full_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { decisor_id, company_domain, linkedin_url, full_name } = await req.json();

    console.log('[REVEAL-EMAIL] 🔓 Revelando email para decisor:', decisor_id);

    // Buscar decisor no banco
    const { data: decisor, error: decisorError } = await supabaseClient
      .from('decision_makers')
      .select('*')
      .eq('id', decisor_id)
      .single();

    if (decisorError || !decisor) {
      throw new Error('Decisor não encontrado');
    }

    console.log('[REVEAL-EMAIL] 👤 Decisor:', decisor.full_name);

    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    const hunterKey = Deno.env.get('HUNTER_API_KEY');

    let revealedEmail: string | null = null;
    let revealedPhone: string | null = null;
    let source = '';

    // TENTATIVA 1: APOLLO REVEAL API
    if (apolloKey && decisor.raw_data?.apollo_id) {
      console.log('[REVEAL-EMAIL] 🚀 Tentativa 1: Apollo Reveal API');
      
      try {
        const apolloResponse = await fetch('https://api.apollo.io/v1/people/match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apolloKey
          },
          body: JSON.stringify({
            id: decisor.raw_data.apollo_id,
            reveal_personal_emails: true,
            reveal_phone_number: true
          })
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          
          // 🔍 VALIDAR se dados existem e são reais
          const hasValidEmail = apolloData.person?.email && 
                               !apolloData.person.email.includes('email_not_unlocked') &&
                               !apolloData.person.email.includes('@domain.com') &&
                               apolloData.person.email.includes('@');
          
          const hasValidPhone = apolloData.person?.phone_numbers?.[0]?.sanitized_number;
          
          if (hasValidEmail || hasValidPhone) {
            revealedEmail = hasValidEmail ? apolloData.person.email : null;
            revealedPhone = hasValidPhone ? apolloData.person.phone_numbers[0].sanitized_number : decisor.phone;
            source = 'apollo_reveal';
            console.log('[REVEAL-EMAIL] ✅ Apollo revelou:', { email: revealedEmail, phone: revealedPhone });
          } else {
            console.warn('[REVEAL-EMAIL] ⚠️ Apollo não tem dados válidos (email_not_unlocked ou vazio)');
          }
        } else {
          console.warn('[REVEAL-EMAIL] ⚠️ Apollo Reveal falhou:', apolloResponse.status);
        }
      } catch (e) {
        console.warn('[REVEAL-EMAIL] ⚠️ Erro Apollo Reveal:', e);
      }
    }

    // TENTATIVA 2: HUNTER.IO (Se Apollo falhou)
    const nameToUse = full_name || decisor.full_name;
    const domainToUse = company_domain || decisor.company_domain;
    
    if (!revealedEmail && hunterKey && domainToUse && nameToUse) {
      console.log('[REVEAL-EMAIL] 🚀 Tentativa 2: Hunter.io');
      
      try {
        const firstName = nameToUse.split(' ')[0];
        const lastName = nameToUse.split(' ').slice(1).join(' ');

        const hunterResponse = await fetch(
          `https://api.hunter.io/v2/email-finder?domain=${domainToUse}&first_name=${firstName}&last_name=${lastName}&api_key=${hunterKey}`
        );

        if (hunterResponse.ok) {
          const hunterData = await hunterResponse.json();
          if (hunterData.data?.email) {
            revealedEmail = hunterData.data.email;
            source = 'hunter_io';
            console.log('[REVEAL-EMAIL] ✅ Hunter.io encontrou email:', revealedEmail);
          }
        }
      } catch (e) {
        console.warn('[REVEAL-EMAIL] ⚠️ Erro Hunter.io:', e);
      }
    }

    // TENTATIVA 3: PHANTOMBUSTER (Se Hunter falhou)
    if (!revealedEmail && decisor.linkedin_url) {
      console.log('[REVEAL-EMAIL] 🚀 Tentativa 3: PhantomBuster (LinkedIn scraping)');
      
      // TODO: Implementar PhantomBuster
      // Requer container_id e agent_id configurados
      console.warn('[REVEAL-EMAIL] ⚠️ PhantomBuster não implementado ainda');
      source = 'phantom_fallback_pending';
    }

    // Se não encontrou em nenhuma fonte
    if (!revealedEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email não disponível em nenhuma fonte',
          attempts: {
            apollo: apolloKey ? 'failed' : 'no_key',
            hunter: hunterKey ? 'failed' : 'no_key',
            phantom: 'not_implemented'
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Atualizar decisor no banco com email revelado
    const { error: updateError } = await supabaseClient
      .from('decision_makers')
      .update({
        email: revealedEmail,
        phone: revealedPhone || decisor.phone,
        email_status: 'verified',
        raw_data: {
          ...decisor.raw_data,
          email_revealed_at: new Date().toISOString(),
          email_source: source
        }
      })
      .eq('id', decisor_id);

    if (updateError) {
      console.error('[REVEAL-EMAIL] ❌ Erro ao atualizar decisor:', updateError);
      throw updateError;
    }

    console.log('[REVEAL-EMAIL] ✅ Email revelado e salvo:', revealedEmail);

    // 🛡️ LOG DE AUDITORIA: Registrar consumo de crédito
    try {
      await supabaseClient.from('apollo_credit_log').insert({
        decisor_id: decisor_id,
        decisor_name: decisor.full_name,
        decisor_email_before: decisor.email,
        decisor_email_after: revealedEmail,
        company_id: decisor.company_id,
        action: 'reveal_email',
        source: source,
        credits_consumed: source === 'apollo_reveal' ? 1 : 0, // Apollo consome, Hunter/Phantom não
        success: true,
        created_at: new Date().toISOString()
      });
      console.log('[REVEAL-EMAIL] 📊 Log de auditoria registrado');
    } catch (logError) {
      console.error('[REVEAL-EMAIL] ⚠️ Erro ao registrar log (não-crítico):', logError);
      // Não falha a operação se o log falhar
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: revealedEmail,
        phone: revealedPhone,
        source: source,
        message: `Email revelado via ${source}`,
        credits_consumed: source === 'apollo_reveal' ? 1 : 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[REVEAL-EMAIL] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

