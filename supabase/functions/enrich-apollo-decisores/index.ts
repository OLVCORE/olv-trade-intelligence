import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichApolloRequest {
  company_id?: string; // optional: only update DB when provided
  company_name?: string;
  companyName?: string; // backward compatibility
  domain?: string;
  apollo_org_id?: string; // NOVO: Apollo Organization ID manual
  positions?: string[]; // optional: custom positions list
  modes?: string[]; // ['people', 'company']
  city?: string; // 🎯 FILTRO INTELIGENTE: cidade da empresa
  state?: string; // 🎯 FILTRO INTELIGENTE: estado da empresa
  industry?: string; // 🎯 FILTRO INTELIGENTE: setor/CNAE
  cep?: string; // 🥇 FILTRO MÁXIMA ASSERTIVIDADE: CEP (98% precisão)
  fantasia?: string; // 🥈 FILTRO ALTA ASSERTIVIDADE: Nome Fantasia (97% precisão)
}

// Classificar poder de decisão baseado no título
function classifyBuyingPower(title: string): 'decision-maker' | 'influencer' | 'user' {
  const titleLower = title.toLowerCase();
  
  // Decision makers (CEO, CFO, CIO, Diretores)
  if (
    titleLower.includes('ceo') ||
    titleLower.includes('cfo') ||
    titleLower.includes('cio') ||
    titleLower.includes('cto') ||
    titleLower.includes('presidente') ||
    titleLower.includes('diretor') ||
    titleLower.includes('sócio') ||
    titleLower.includes('owner') ||
    titleLower.includes('founder')
  ) {
    return 'decision-maker';
  }
  
  // Influencers (Gerentes, Coordenadores)
  if (
    titleLower.includes('gerente') ||
    titleLower.includes('coordenador') ||
    titleLower.includes('supervisor') ||
    titleLower.includes('manager') ||
    titleLower.includes('head')
  ) {
    return 'influencer';
  }
  
  // Users (demais)
  return 'user';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: EnrichApolloRequest = await req.json();
    
    console.log('[ENRICH-APOLLO] 📥 Request recebido:', {
      company_id: body.company_id,
      company_name: body.company_name,
      modes: body.modes
    });
    
    // 🔥 CRIAR CLIENTE SUPABASE (SEMPRE usar SERVICE_ROLE_KEY para evitar 401)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('[ENRICH-APOLLO] ❌ SERVICE_ROLE_KEY não configurada!');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration', details: 'SERVICE_ROLE_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[ENRICH-APOLLO] 🔑 Usando SERVICE_ROLE_KEY (evita 401)');
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    console.log('[ENRICH-APOLLO] ✅ Cliente Supabase inicializado');
    const companyId = body.company_id || body.companyId;
    const companyName = body.company_name || body.companyName;
    const { domain, positions, apollo_org_id, city, state, industry, cep, fantasia } = body;
    
    console.log('[ENRICH-APOLLO] 🎯 Filtros inteligentes:', { city, state, industry, cep, fantasia });

    console.log('[ENRICH-APOLLO-DECISORES] Buscando decisores para:', companyName);
    console.log('[ENRICH-APOLLO-DECISORES] Apollo Org ID fornecido:', apollo_org_id || 'N/A');

    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    // PASSO 1: Usar apollo_org_id se fornecido, senão buscar pelo nome
    let organizationId: string | null = apollo_org_id || null;
    
    if (!organizationId) {
      console.log('[ENRICH-APOLLO-DECISORES] Buscando Organization ID por nome...');
      
      // Apollo funciona melhor com "Primeira + Segunda palavra"
      const words = (companyName || '').split(/\s+/);
      const firstTwo = words.slice(0, 2).join(' ');
      const firstOne = words[0];
      
      const namesToTry = [firstTwo, firstOne, companyName];
      
      console.log('[ENRICH-APOLLO-DECISORES] Tentando nomes:', namesToTry);
      
      for (const name of namesToTry) {
        if (!name) continue;
        
        const orgSearchPayload = {
          q_organization_name: name,
          page: 1,
          per_page: 5
        };
        
        const orgResponse = await fetch(
          'https://api.apollo.io/v1/organizations/search',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apolloKey
            },
            body: JSON.stringify(orgSearchPayload)
          }
        );
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          if (orgData.organizations && orgData.organizations.length > 0) {
            console.log('[ENRICH-APOLLO-DECISORES] 🔍 Encontradas', orgData.organizations.length, 'empresas com nome', name);
            
            // 🎯 FILTRO INTELIGENTE: Priorizar CEP → Fantasia+Cidade → Cidade → Estado → Brasil
            let selectedOrg = null;
            let criterio = '';
            
            // 🥇 EXCELENTE: CEP + Brasil (98% assertividade - ÚNICO no Brasil!)
            if (!selectedOrg && cep) {
              const cleanCEP = cep.replace(/\D/g, ''); // Remove formatação
              selectedOrg = orgData.organizations.find((org: any) => {
                const orgCEP = (org.postal_code || '').replace(/\D/g, '');
                return orgCEP === cleanCEP && (org.country === 'Brazil' || org.country === 'Brasil');
              });
              if (selectedOrg) criterio = `CEP ${cep} + Brasil (EXCELENTE ✅ 98%)`;
            }
            
            // 🥈+ MUITO BOM: Nome Fantasia + Cidade + Estado + Brasil (97% assertividade)
            if (!selectedOrg && fantasia && city && state) {
              selectedOrg = orgData.organizations.find((org: any) => 
                org.name?.toLowerCase().includes(fantasia.toLowerCase()) &&
                org.city?.toLowerCase().includes(city.toLowerCase()) &&
                org.state?.toLowerCase() === state.toLowerCase() &&
                (org.country === 'Brazil' || org.country === 'Brasil')
              );
              if (selectedOrg) criterio = `Fantasia "${fantasia}" + ${city}/${state} + Brasil (MUITO BOM ✅ 97%)`;
            }
            
            // 🥈 BOM: Nome Fantasia + Cidade + Brasil (95% assertividade)
            if (!selectedOrg && fantasia && city) {
              selectedOrg = orgData.organizations.find((org: any) => 
                org.name?.toLowerCase().includes(fantasia.toLowerCase()) &&
                org.city?.toLowerCase().includes(city.toLowerCase()) &&
                (org.country === 'Brazil' || org.country === 'Brasil')
              );
              if (selectedOrg) criterio = `Fantasia "${fantasia}" + ${city} + Brasil (BOM ✅ 95%)`;
            }
            
            // 🥉 REGULAR: Cidade + Estado + Brasil (90% assertividade)
            if (!selectedOrg && city && state) {
              selectedOrg = orgData.organizations.find((org: any) => 
                (org.country === 'Brazil' || org.country === 'Brasil') &&
                org.city?.toLowerCase().includes(city.toLowerCase()) &&
                org.state?.toLowerCase() === state.toLowerCase()
              );
              if (selectedOrg) criterio = `${city}/${state} + Brasil (REGULAR ⚠️ 90%)`;
            }
            
            // 4️⃣ FRACO: Mesma cidade + Brasil (70% assertividade)
            if (!selectedOrg && city) {
              selectedOrg = orgData.organizations.find((org: any) => 
                (org.country === 'Brazil' || org.country === 'Brasil') &&
                org.city?.toLowerCase().includes(city.toLowerCase())
              );
              if (selectedOrg) criterio = `Cidade ${city} + Brasil (FRACO ⚠️ 70%)`;
            }
            
            // 5️⃣ MUITO FRACO: Mesmo estado + Brasil (50% assertividade)
            if (!selectedOrg && state) {
              selectedOrg = orgData.organizations.find((org: any) => 
                (org.country === 'Brazil' || org.country === 'Brasil') &&
                org.state?.toLowerCase().includes(state.toLowerCase())
              );
              if (selectedOrg) criterio = `Estado ${state} + Brasil (MUITO FRACO ⚠️ 50%)`;
            }
            
            // 6️⃣ PÉSSIMO: Qualquer do Brasil (30% assertividade)
            if (!selectedOrg) {
              selectedOrg = orgData.organizations.find((org: any) => 
                org.country === 'Brazil' || 
                org.country === 'Brasil' ||
                org.primary_domain?.includes('.br') ||
                org.website_url?.includes('.br')
              );
              if (selectedOrg) criterio = 'Brasil genérico (PÉSSIMO ❌ 30%)';
            }
            
            // 7️⃣ FALLBACK CRÍTICO: Primeira da lista (0% assertividade - PROVAVELMENTE ERRADO!)
            if (!selectedOrg) {
              selectedOrg = orgData.organizations[0];
              criterio = 'Primeira da lista (FALLBACK CRÍTICO ❌ 0% - PROVAVELMENTE ERRADO!)';
            }
            
            organizationId = selectedOrg.id;
            
            console.log('[ENRICH-APOLLO-DECISORES] ✅ Organização selecionada:', {
              id: organizationId,
              nome: selectedOrg.name,
              country: selectedOrg.country,
              city: selectedOrg.city,
              state: selectedOrg.state,
              employees: selectedOrg.estimated_num_employees,
              criterio
            });
            break;
          }
        }
      }
      
      if (!organizationId) {
        console.warn('[ENRICH-APOLLO-DECISORES] ⚠️ Organização não encontrada pelo nome:', companyName);
        console.warn('[ENRICH-APOLLO-DECISORES] ⚠️ Continuando com domain ou q_keywords como fallback...');
        // ✅ NÃO retornar erro aqui - tentar com domain ou q_keywords
      }
    } else if (apollo_org_id) {
      console.log('[ENRICH-APOLLO-DECISORES] ✅ Usando Apollo Org ID fornecido:', apollo_org_id);
    }
    
    // PASSO 2: Buscar dados da ORGANIZAÇÃO primeiro (NOVO!)
    let organizationData: any = null;
    
    if (organizationId) {
      console.log('[ENRICH-APOLLO] 🏢 Buscando dados da organização...');
      
      const orgResponse = await fetch(
        `https://api.apollo.io/v1/organizations/${organizationId}`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': apolloKey
          }
        }
      );

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        organizationData = orgData.organization;
        
        console.log('[ENRICH-APOLLO] ✅ Organização encontrada:', {
          name: organizationData?.name,
          industry: organizationData?.industry,
          keywords: organizationData?.keywords?.slice(0, 5),
          employees: organizationData?.estimated_num_employees
        });
      }
    }
    
    // PASSO 3: Buscar TODAS as pessoas da empresa (não filtrar por cargo)
    // ✅ VALIDAR: Precisamos de organizationId OU domain válido
    if (!organizationId && !domain && !companyName) {
      console.warn('[ENRICH-APOLLO] ⚠️ Nenhum parâmetro válido para buscar pessoas (organizationId, domain ou companyName)');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum parâmetro válido para buscar pessoas. Forneça organizationId, domain ou companyName.',
          decisores: [],
          decisores_salvos: 0
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchPayload: any = {
      page: 1,
      per_page: 100
      // NÃO filtrar por person_titles - queremos TODOS os decisores!
    };

    // ✅ EXTRAIR DOMÍNIO LIMPO (remover protocolo, paths, parâmetros)
    let cleanDomain: string | null = null;
    if (domain) {
      try {
        // Se for URL completa, extrair apenas o domínio
        if (domain.includes('://') || domain.includes('/')) {
          const urlObj = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
          cleanDomain = urlObj.hostname.replace('www.', '').toLowerCase();
        } else {
          cleanDomain = domain.replace('www.', '').toLowerCase();
        }
        console.log('[ENRICH-APOLLO] 🌐 Domínio limpo:', cleanDomain, '(original:', domain, ')');
      } catch (e) {
        console.warn('[ENRICH-APOLLO] ⚠️ Erro ao extrair domínio de:', domain);
        cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].toLowerCase();
      }
    }

    // Priorizar: organization_id > domain > q_keywords (fallback)
    if (organizationId) {
      searchPayload.organization_ids = [organizationId];
      console.log('[ENRICH-APOLLO] 🎯 Usando organization_ids:', organizationId);
    } else if (cleanDomain) {
      searchPayload.q_organization_domains = cleanDomain;
      console.log('[ENRICH-APOLLO] 🌐 Usando q_organization_domains:', cleanDomain);
    } else if (companyName) {
      // ✅ VALIDAR: q_keywords requer pelo menos 2 caracteres e não pode ser muito genérico
      const cleanName = companyName.trim();
      if (cleanName.length < 2) {
        throw new Error('Nome da empresa muito curto para busca na Apollo');
      }
      searchPayload.q_keywords = cleanName;
      console.log('[ENRICH-APOLLO] 🔍 Usando q_keywords (fallback):', cleanName);
    }

    console.log('[ENRICH-APOLLO] 📦 Payload pessoas:', JSON.stringify(searchPayload));

    const apolloResponse = await fetch(
      'https://api.apollo.io/v1/mixed_people/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify(searchPayload)
      }
    );

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      let errorMessage = `Apollo API falhou: ${apolloResponse.status}`;
      
      try {
        const errorJson = JSON.stringify(errorText);
        if (errorJson) {
          errorMessage += ` - ${errorJson}`;
        }
      } catch (e) {
        // Ignorar erro de parsing
      }
      
      console.error('[ENRICH-APOLLO] ❌ Apollo API error:', {
        status: apolloResponse.status,
        statusText: apolloResponse.statusText,
        errorText: errorText.substring(0, 500),
        payload: searchPayload
      });
      
      // ✅ 422 = Unprocessable Entity (parâmetros inválidos) - retornar erro mais útil
      if (apolloResponse.status === 422) {
        errorMessage = `Apollo rejeitou os parâmetros. Verifique: ${!organizationId ? 'organizationId não encontrado; ' : ''}${!cleanDomain ? 'domain inválido; ' : ''}${!companyName ? 'companyName ausente' : ''}`.trim();
      }
      
      throw new Error(errorMessage);
    }

    const apolloData = await apolloResponse.json();

    console.log('[ENRICH-APOLLO] ✅ Apollo retornou:', apolloData.people?.length || 0, 'pessoas');
    console.log('[ENRICH-APOLLO] Dados brutos:', JSON.stringify(apolloData.people?.slice(0, 2)));

    const decisores = (apolloData.people || []).map((person: any) => {
      const fullName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      console.log('[ENRICH-APOLLO-DECISORES] Processando:', fullName, '- Cargo:', person.title);
      
      return {
        name: fullName,
        first_name: person.first_name,
        last_name: person.last_name,
        title: person.title,
        email: null, // ✅ NUNCA SALVAR EMAIL (economizar créditos!)
        email_status: null, // ✅ Email só via Reveal manual
        linkedin_url: person.linkedin_url,
        phone: person.phone_numbers?.[0]?.sanitized_number || null,
        phone_numbers: person.phone_numbers || [], // TODOS os telefones
        photo_url: person.photo_url,
        headline: person.headline,
        buying_power: classifyBuyingPower(person.title || ''),
        seniority: person.seniority,
        departments: person.departments || [],
        city: person.city,
        state: person.state,
        country: person.country,
        organization_name: person.organization_name,
        raw_apollo_data: person // SALVAR TUDO do Apollo
      };
    });
    
    console.log('[ENRICH-APOLLO] Total mapeados:', decisores.length);

    // Separar por poder de decisão
    const decisionMakers = decisores.filter(d => d.buying_power === 'decision-maker');
    const influencers = decisores.filter(d => d.buying_power === 'influencer');
    const users = decisores.filter(d => d.buying_power === 'user');

    console.log('[ENRICH-APOLLO] Decision makers:', decisionMakers.length);
    console.log('[ENRICH-APOLLO] Influencers:', influencers.length);
    console.log('[ENRICH-APOLLO] Users:', users.length);

    // Identificar decision maker principal (CEO/CFO/CIO)
    const mainDecisionMaker = decisionMakers.find(d => 
      d.title?.toLowerCase().includes('ceo') ||
      d.title?.toLowerCase().includes('cfo') ||
      d.title?.toLowerCase().includes('cio')
    );

    // Salvar decisores na tabela decision_makers
    if (companyId && decisores.length > 0) {
      // Deletar decisores antigos do Apollo
      await supabaseClient
        .from('decision_makers')
        .delete()
        .eq('company_id', companyId)
        .eq('data_source', 'apollo');

      // Inserir novos decisores (CAMPOS CORRETOS DO SCHEMA)
      // Filtrar apenas decisores com nome válido (full_name é NOT NULL)
      const decisoresToInsert = decisores
        .filter((d: any) => d.name && d.name.trim().length > 0)
        .map((d: any) => ({
          company_id: companyId,
          full_name: d.name.trim(),
          position: d.title || null,
          email: d.email || null,
          phone: d.phone || null, // ✅ CORRETO: "phone" (não "phone_number")
          linkedin_url: d.linkedin_url || null,
          seniority_level: d.seniority || null,
          data_source: 'apollo',
          // 100% DOS CAMPOS APOLLO
          photo_url: d.photo_url || null,
          city: d.city || null,
          state: d.state || null,
          country: d.country || null,
          email_status: d.email_status || null,
          headline: d.headline || null,
          raw_data: {
            apollo_id: d.raw_apollo_data?.id,
            employment_history: d.raw_apollo_data?.employment_history || [],
            phone_numbers: d.phone_numbers || [],
            departments: d.departments || [],
            subdepartments: d.raw_apollo_data?.subdepartments || [],
            email_status: d.email_status,
            organization_name: d.organization_name,
            organization_data: d.raw_apollo_data?.organization || {},
            linkedin_uid: d.raw_apollo_data?.organization?.linkedin_uid,
            sic_codes: d.raw_apollo_data?.organization?.sic_codes || [],
            naics_codes: d.raw_apollo_data?.organization?.naics_codes || []
          }
        }));

      console.log('[ENRICH-APOLLO] Preparando para salvar:', decisoresToInsert.length, 'decisores');
      console.log('[ENRICH-APOLLO] Primeiro decisor:', JSON.stringify(decisoresToInsert[0]));
      
      if (decisoresToInsert.length > 0) {
        const { data: inserted, error: insertError } = await supabaseClient
          .from('decision_makers')
          .insert(decisoresToInsert)
          .select();

        if (insertError) {
          console.error('[ENRICH-APOLLO] ❌ Erro ao salvar decisores:', JSON.stringify(insertError));
          throw insertError;
        }
        
        console.log('[ENRICH-APOLLO] ✅ SALVOS:', inserted?.length || 0, 'decisores no banco!');
      } else {
        console.warn('[ENRICH-APOLLO] ⚠️ Nenhum decisor válido para salvar (todos sem nome)');
      }

      // Atualizar flag na empresa
      const { data: currentCompany } = await supabaseClient
        .from('companies')
        .select('raw_data')
        .eq('id', companyId)
        .single();

      const existingRawData = currentCompany?.raw_data || {};

      // ✅ SALVAR DADOS DA ORGANIZAÇÃO + DECISORES
      const updateData: any = {
        raw_data: {
          ...existingRawData,
          enriched_apollo: true,
          apollo_decisores_count: decisores.length,
          // ✅ CAMPOS DIRETOS para aparecer no card
          apollo_id: organizationId,
          apollo_link: organizationId ? `https://app.apollo.io/#/companies/${organizationId}` : null,
          linkedin_url: organizationData?.linkedin_url || existingRawData.linkedin_url,
          // ✅ NOVO: Dados completos da organização
          apollo_organization: organizationData ? {
            id: organizationData.id,
            name: organizationData.name,
            industry: organizationData.industry,
            keywords: organizationData.keywords || [],
            estimated_num_employees: organizationData.estimated_num_employees,
            website_url: organizationData.website_url,
            linkedin_url: organizationData.linkedin_url,
            twitter_url: organizationData.twitter_url,
            facebook_url: organizationData.facebook_url,
            technologies: organizationData.technologies || [],
            phone: organizationData.phone,
            sic_codes: organizationData.sic_codes || [],
            naics_codes: organizationData.naics_codes || [],
            retail_location_count: organizationData.retail_location_count,
            raw_location_count: organizationData.raw_location_count,
          } : null
        }
      };
      
      // ✅ ATUALIZAR CAMPOS DIRETOS DA EMPRESA
      if (organizationId) {
        updateData.apollo_id = organizationId;
      }
      
      if (organizationData?.linkedin_url) {
        updateData.linkedin_url = organizationData.linkedin_url;
      }
      
      if (organizationData?.industry) {
        updateData.industry = organizationData.industry;
      }
      
      if (organizationData?.short_description) {
        updateData.description = organizationData.short_description;
      }

      await supabaseClient
        .from('companies')
        .update(updateData)
        .eq('id', companyId);
      
      console.log('[ENRICH-APOLLO] ✅', decisores.length, 'decisores salvos em decision_makers');
    } else {
      console.log('[ENRICH-APOLLO] Nenhum decisor para salvar ou companyId não informado');
    }

    return new Response(
      JSON.stringify({
        success: true,
        decisores,
        statistics: {
          total: decisores.length,
          decision_makers: decisionMakers.length,
          influencers: influencers.length,
          users: users.length
        },
        main_decision_maker: mainDecisionMaker || null,
        message: `${decisores.length} decisores encontrados`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[ENRICH-APOLLO] ❌ Erro crítico:', error);
    console.error('[ENRICH-APOLLO] ❌ Stack:', error.stack);
    console.error('[ENRICH-APOLLO] ❌ Error details:', JSON.stringify(error, null, 2));
    
    // ✅ Determinar status HTTP apropriado baseado no erro
    let statusCode = 500;
    let errorMessage = error.message || 'Erro ao buscar decisores no Apollo';
    
    // ✅ Se for erro 422 da Apollo, retornar como 400 (Bad Request) com mensagem mais clara
    if (errorMessage.includes('422') || errorMessage.includes('Apollo API falhou: 422')) {
      statusCode = 400;
      errorMessage = 'Apollo rejeitou os parâmetros. Verifique se o nome da empresa ou domínio são válidos. Se o erro persistir, forneça um Apollo Organization ID manual.';
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});

