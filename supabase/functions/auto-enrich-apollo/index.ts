import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  try {
    const { companyId, companyName, city, state, country, website } = await req.json();

    console.log('🔍 [AUTO-ENRICH] Buscando no Apollo:', { 
      companyName, 
      city, 
      country, 
      website: website ? '✅ TEM' : '❌ NÃO TEM' 
    });

    let apolloQuery: any;
    let searchMethod: string;

    // OPÇÃO 1: Se tem website, buscar por domínio (95%+ precisão)
    if (website) {
      // Extrair domínio limpo
      const domain = website
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .split('/')[0];

      apolloQuery = {
        domain: domain,
        per_page: 1,
      };

      searchMethod = 'DOMAIN';
      console.log(`✅ [AUTO-ENRICH] Método: DOMAIN (95%+ precisão)`);
      console.log(`🌐 [AUTO-ENRICH] Domain: ${domain}`);
    } 
    // OPÇÃO 2: Sem website, buscar por nome + localização (85%+ precisão)
    else {
      const location = [city, state, country]
        .filter(Boolean)
        .join(', ');

      apolloQuery = {
        q_organization_name: companyName,
        organization_locations: [location],
        per_page: 1,
      };

      searchMethod = 'NAME_LOCATION';
      console.log(`⚠️ [AUTO-ENRICH] Método: NAME+LOCATION (85%+ precisão)`);
      console.log(`📍 [AUTO-ENRICH] Location: ${location}`);
    }

    // Buscar no Apollo (Search API)
    console.log('🔎 [AUTO-ENRICH] Calling Apollo Search API...');
    const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY || '',
      },
      body: JSON.stringify(apolloQuery),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('❌ [AUTO-ENRICH] Apollo Search API error:', errorText);
      throw new Error(`Apollo Search API error: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json();
    const org = apolloData.organizations?.[0]; // Primeiro resultado

    if (!org || !org.id) {
      console.log('❌ [AUTO-ENRICH] Nenhuma empresa encontrada no Apollo');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhuma empresa encontrada no Apollo',
          searchMethod,
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log('✅ [AUTO-ENRICH] Empresa encontrada:', org.name);
    console.log('🆔 [AUTO-ENRICH] Apollo ID:', org.id);

    // Buscar decisores da empresa
    console.log('👥 [AUTO-ENRICH] Buscando decisores...');
    const peopleResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY || '',
      },
      body: JSON.stringify({
        organization_ids: [org.id],
        per_page: 10,
        person_titles: [
          'CEO', 'Chief Executive Officer', 'Founder',
          'CFO', 'Chief Financial Officer',
          'CTO', 'Chief Technology Officer',
          'COO', 'Chief Operating Officer',
          'VP', 'Vice President',
          'Director', 'Head of',
        ],
      }),
    });

    const peopleData = await peopleResponse.json();
    const people = peopleData.people || [];

    console.log(`👥 [AUTO-ENRICH] ${people.length} decisores encontrados`);

    // Classificar decisores por importância
    const classifyDecisionMaker = (title: string) => {
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('ceo') || titleLower.includes('chief executive') || titleLower.includes('founder')) {
        return { classification: 'CEO', priority: 1 };
      }
      if (titleLower.includes('cfo') || titleLower.includes('chief financial')) {
        return { classification: 'CFO', priority: 2 };
      }
      if (titleLower.includes('cto') || titleLower.includes('chief technology')) {
        return { classification: 'CTO', priority: 3 };
      }
      if (titleLower.includes('coo') || titleLower.includes('chief operating')) {
        return { classification: 'COO', priority: 4 };
      }
      if (titleLower.includes('vp') || titleLower.includes('vice president')) {
        return { classification: 'VP', priority: 5 };
      }
      if (titleLower.includes('director') || titleLower.includes('head of')) {
        return { classification: 'Director', priority: 6 };
      }
      
      return { classification: 'Other', priority: 99 };
    };

    const decisionMakers = people
      .filter((p: any) => p.title)
      .map((p: any) => ({
        name: `${p.first_name} ${p.last_name}`.trim(),
        title: p.title,
        email: p.email || null,
        linkedin_url: p.linkedin_url || null,
        apollo_link: p.id ? `https://app.apollo.io/#/people/${p.id}` : null,
        ...classifyDecisionMaker(p.title),
      }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10); // Top 10

    console.log('👥 [AUTO-ENRICH] Decisores classificados:', decisionMakers.length);

    // Conectar Supabase
    const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

    // Verificar se já foi manualmente enriquecido
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('enrichment_source')
      .eq('id', companyId)
      .single();

    if (existingCompany?.enrichment_source === 'manual') {
      console.log('⚠️ [AUTO-ENRICH] Empresa já foi enriquecida MANUALMENTE - NÃO sobrescrever!');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Empresa já foi validada manualmente. Use o lápis ✏️ para editar.',
          enrichment_source: 'manual',
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // MERGE INTELIGENTE: Ler dados existentes primeiro
    console.log('📖 [AUTO-ENRICH] Lendo dados existentes...');
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('apollo_id, linkedin_url, description, raw_data')
      .eq('id', companyId)
      .single();
    
    // Preparar dados para merge (NUNCA sobrescreve campos preenchidos!)
    const updateData: any = {
      enrichment_source: 'auto', // Marca como auto (será 'manual' se usuário editar)
      enriched_at: new Date().toISOString(),
    };
    
    // Apollo ID: Só adiciona se NÃO existe
    if (!existingCompany?.apollo_id) {
      updateData.apollo_id = org.id;
      console.log('✅ [AUTO-ENRICH] Apollo ID adicionado:', org.id);
    } else {
      console.log('⏭️ [AUTO-ENRICH] Apollo ID já existe, preservando:', existingCompany.apollo_id);
    }
    
    // LinkedIn: Só adiciona se NÃO existe
    if (!existingCompany?.linkedin_url && org.linkedin_url) {
      updateData.linkedin_url = org.linkedin_url;
      console.log('✅ [AUTO-ENRICH] LinkedIn adicionado:', org.linkedin_url);
    } else {
      console.log('⏭️ [AUTO-ENRICH] LinkedIn já existe, preservando:', existingCompany?.linkedin_url);
    }
    
    // Descrição: Só adiciona se NÃO existe OU está vazia
    if (!existingCompany?.description && (org.short_description || org.description)) {
      updateData.description = org.short_description || org.description;
      console.log('✅ [AUTO-ENRICH] Descrição adicionada');
    } else {
      console.log('⏭️ [AUTO-ENRICH] Descrição já existe, preservando');
    }
    
    // raw_data: Merge profundo (preserva campos existentes + adiciona novos)
    const existingRawData = (existingCompany?.raw_data || {}) as any;
    const newRawData = {
      ...existingRawData, // Preserva TUDO que já existe
      apollo_id: existingRawData.apollo_id || org.id, // Só adiciona se não existe
      apollo_link: existingRawData.apollo_link || `https://app.apollo.io/#/companies/${org.id}`,
      linkedin_url: existingRawData.linkedin_url || org.linkedin_url,
      decision_makers: decisionMakers.length > 0 ? decisionMakers : existingRawData.decision_makers || [], // Só sobrescreve se trouxer novos
      auto_enrich_method: searchMethod,
      auto_enriched_at: new Date().toISOString(),
      // Preserva TODOS os outros campos que já existem (fit_score, type, notes, etc.)
    };
    
    updateData.raw_data = newRawData;
    
    // Atualizar empresa no banco (com merge inteligente)
    console.log('💾 [AUTO-ENRICH] Salvando no banco (MERGE, não sobrescrever)...');
    const { error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId);

    if (updateError) {
      console.error('❌ [AUTO-ENRICH] Erro ao atualizar empresa:', updateError);
      throw updateError;
    }

    // Inserir decisores na tabela decision_makers
    if (decisionMakers.length > 0) {
      const { data: company } = await supabase
        .from('companies')
        .select('tenant_id')
        .eq('id', companyId)
        .single();

      const decisionMakersToInsert = decisionMakers.map((dm) => ({
        company_id: companyId,
        tenant_id: company?.tenant_id,
        name: dm.name,
        title: dm.title,
        email: dm.email,
        linkedin_url: dm.linkedin_url,
        classification: dm.classification,
        data_source: 'apollo_auto', // Indica que foi auto-enriquecido
        raw_data: { apollo_link: dm.apollo_link },
      }));

      const { error: insertError } = await supabase
        .from('decision_makers')
        .upsert(decisionMakersToInsert, {
          onConflict: 'company_id, email, name',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error('❌ [AUTO-ENRICH] Erro ao inserir decisores:', insertError);
      } else {
        console.log('✅ [AUTO-ENRICH] Decisores inseridos:', decisionMakersToInsert.length);
      }
    }

    console.log('✅ [AUTO-ENRICH] Concluído com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        organization: org.name,
        apollo_id: org.id,
        decisores: decisionMakers.length,
        searchMethod,
        precision: searchMethod === 'DOMAIN' ? '95%+' : '85%+',
        message: `✅ ${org.name} enriquecido com ${decisionMakers.length} decisores!`,
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ [AUTO-ENRICH] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});

