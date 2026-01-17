import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // ✅ VERIFICAR AUTENTICAÇÃO
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // ✅ VERIFICAR USUÁRIO AUTENTICADO
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Authenticated user: ${user.email}`);

    const body = await req.json().catch(() => ({}));
    const { force_refresh = false, company_ids = null } = body;
    
    console.log('🔄 Starting batch enrichment 360...', force_refresh ? '(FORCE REFRESH MODE)' : '');
    console.log('📋 Company IDs forçados:', company_ids?.length || 0);

    // ✅ Se company_ids foi fornecido, buscar apenas essas empresas
    let companiesQuery = supabaseClient
      .from('companies')
      .select(`
        id,
        name,
        company_name,
        cnpj,
        website,
        linkedin_url,
        digital_maturity_score,
        digital_maturity (id)
      `);

    if (company_ids && Array.isArray(company_ids) && company_ids.length > 0) {
      // Buscar apenas as empresas especificadas
      companiesQuery = companiesQuery.in('id', company_ids);
      console.log(`🎯 Buscando ${company_ids.length} empresas específicas`);
    } else {
      // Comportamento padrão: buscar empresas com CNPJ (limitar a 10 para evitar timeout)
      companiesQuery = companiesQuery
        .not('cnpj', 'is', null)
        .limit(10);
      console.log('📊 Buscando empresas com CNPJ (máximo 10)');
    }

    const { data: companies, error: fetchError } = await companiesQuery;

    if (fetchError) {
      console.error('❌ Erro ao buscar empresas:', fetchError);
      throw fetchError;
    }

    if (!companies || companies.length === 0) {
      return new Response(
        JSON.stringify({
          total: 0,
          processed: 0,
          skipped: 0,
          failed: 0,
          errors: ['Nenhuma empresa encontrada'],
          details: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${companies.length} companies to enrich`);

    const results = {
      total: companies?.length || 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Processa cada empresa
    for (const company of companies || []) {
      try {
        // Verificar se já tem análise completa
        const hasAnalysis = company.digital_maturity_score !== null;
        
        if (hasAnalysis && !force_refresh) {
          console.log(`⏭️ Skipping ${company.name} (already has 360° analysis)`);
          results.skipped++;
          results.details.push({
            company_id: company.id,
            company_name: company.name || company.company_name,
            status: 'skipped',
            reason: 'Already has 360° analysis'
          });
          continue;
        }

        if (hasAnalysis && force_refresh) {
          console.log(`🔄 Force refreshing ${company.name} (already had analysis)`);
        }

        const companyName = company.name || company.company_name || company.id;
        console.log(`🚀 Enriching: ${companyName}`);
        
        const { data, error: enrichError } = await supabaseClient.functions.invoke('enrich-company-360', {
          body: {
            company_id: company.id
          }
        });

        if (enrichError) {
          console.error(`❌ Erro ao enriquecer ${companyName}:`, enrichError);
          throw enrichError as any;
        }

        results.processed++;
        results.details.push({
          company_id: company.id,
          company_name: companyName,
          status: 'processed'
        });
        console.log(`✅ ${companyName} enriched successfully`);

        // Sem atraso para evitar timeout de execução
      } catch (error) {
        results.failed++;
        const companyName = company.name || company.company_name || company.id;
        const errorMsg = `Failed to enrich ${companyName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        results.details.push({
          company_id: company.id,
          company_name: companyName,
          status: 'error',
          reason: errorMsg
        });
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`🎉 Batch enrichment completed: ${results.processed} success, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error in batch enrichment (public proxy):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
