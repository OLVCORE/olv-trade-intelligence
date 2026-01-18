/**
 * EDGE FUNCTION: Re-enriquecer Empresas Existentes
 * 
 * Corrige dados incorretos nas empresas:
 * 1. País incorreto (baseado em validação cruzada com nome)
 * 2. Nome incorreto (títulos de página ao invés de nome da empresa)
 * 3. Localização ausente ou incorreta
 * 
 * SEM DADOS HARDCODED - apenas fontes reais via scraping
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReEnrichRequest {
  limit?: number; // Quantidade de empresas a processar (default: 50)
  force?: boolean; // Forçar re-enriquecimento mesmo se já tiver dados
  filters?: {
    has_website?: boolean; // Apenas empresas com website
    suspicious_country?: boolean; // Apenas empresas com país suspeito
    suspicious_name?: boolean; // Apenas empresas com nome suspeito
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 204 });
  }

  try {
    const { limit = 50, force = false, filters = {} }: ReEnrichRequest = await req.json();
    
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log(`[RE-ENRICH] 🚀 Iniciando re-enriquecimento de empresas...`);
    console.log(`  Limite: ${limit}`);
    console.log(`  Forçar: ${force}`);
    console.log(`  Filtros:`, filters);

    // ========================================================================
    // 1️⃣ BUSCAR EMPRESAS PARA RE-ENRIQUECER
    // ========================================================================
    
    let query = supabase
      .from('companies')
      .select('id, company_name, website, domain, country, city, state, raw_data')
      .limit(limit);

    // Filtrar apenas empresas com website se solicitado
    if (filters.has_website !== false) {
      query = query.or('website.not.is.null,domain.not.is.null');
    }

    // Filtrar empresas com país suspeito (Colombia quando nome tem cidade da China, etc.)
    if (filters.suspicious_country) {
      // Isso será filtrado depois na lógica
    }

    // Filtrar empresas com nome suspeito (parece título de página)
    if (filters.suspicious_name) {
      // Isso será filtrado depois na lógica
    }

    const { data: companies, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar empresas: ${fetchError.message}`);
    }

    if (!companies || companies.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma empresa encontrada para re-enriquecimento', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RE-ENRICH] 📋 ${companies.length} empresas encontradas`);

    // ========================================================================
    // 2️⃣ PROCESSAR CADA EMPRESA
    // ========================================================================

    const results = {
      processed: 0,
      updated: 0,
      errors: 0,
      details: [] as Array<{
        id: string;
        company_name: string;
        changes: string[];
        status: 'updated' | 'no_changes' | 'error';
        error?: string;
      }>,
    };

    for (const company of companies) {
      try {
        const website = company.website || company.domain;
        if (!website || typeof website !== 'string') {
          console.log(`[RE-ENRICH] ⏭️ Empresa ${company.id} sem website - pulando`);
          continue;
        }

        // Verificar se precisa re-enriquecer
        if (!force) {
          // Validar se dados estão incorretos antes de re-enriquecer
          const needsEnrichment = needsReEnrichment(company);
          if (!needsEnrichment) {
            console.log(`[RE-ENRICH] ✅ Empresa ${company.id} já tem dados corretos - pulando`);
            continue;
          }
        }

        console.log(`[RE-ENRICH] 🔍 Processando: ${company.company_name} (${company.id})`);
        console.log(`  Website: ${website}`);
        console.log(`  País atual: ${company.country || 'N/A'}`);

        // Chamar Edge Function de extração
        const extractUrl = `${supabaseUrl}/functions/v1/extract-company-info-from-url`;
        const extractResponse = await fetch(extractUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ url: website }),
        });

        if (!extractResponse.ok) {
          const errorText = await extractResponse.text();
          throw new Error(`Erro na extração: ${extractResponse.status} - ${errorText}`);
        }

        const extractedInfo = await extractResponse.json();
        console.log(`[RE-ENRICH] 📊 Dados extraídos:`, extractedInfo);

        // Preparar atualização
        const updates: Record<string, any> = {};
        const changes: string[] = [];

        // Atualizar nome se diferente e mais confiável
        if (extractedInfo.company_name && 
            extractedInfo.company_name.length > 3 &&
            extractedInfo.company_name !== company.company_name &&
            !isPageTitle(extractedInfo.company_name)) {
          updates.company_name = extractedInfo.company_name;
          changes.push(`Nome: "${company.company_name}" → "${extractedInfo.company_name}"`);
        }

        // Atualizar país se extraído e diferente (validando)
        if (extractedInfo.country && 
            extractedInfo.country !== 'N/A' &&
            extractedInfo.country !== company.country) {
          // ⚠️ VALIDAÇÃO: Não atualizar se nome da empresa indica país diferente
          const countryFromName = extractCountryFromName(company.company_name || '');
          if (!countryFromName || countryFromName === extractedInfo.country) {
            updates.country = extractedInfo.country;
            changes.push(`País: "${company.country || 'N/A'}" → "${extractedInfo.country}"`);
          } else {
            console.warn(`[RE-ENRICH] ⚠️ País extraído "${extractedInfo.country}" não confere com nome "${countryFromName}" - mantendo`);
          }
        }

        // Atualizar cidade e estado se disponíveis
        if (extractedInfo.city && extractedInfo.city !== company.city) {
          updates.city = extractedInfo.city;
          changes.push(`Cidade: "${company.city || 'N/A'}" → "${extractedInfo.city}"`);
        }

        if (extractedInfo.state && extractedInfo.state !== company.state) {
          updates.state = extractedInfo.state;
          changes.push(`Estado: "${company.state || 'N/A'}" → "${extractedInfo.state}"`);
        }

        // Atualizar raw_data com informações extraídas
        const currentRawData = company.raw_data || {};
        updates.raw_data = {
          ...currentRawData,
          re_enriched_at: new Date().toISOString(),
          re_enriched_source: extractedInfo.source,
          extracted_info: {
            company_name: extractedInfo.company_name,
            country: extractedInfo.country,
            city: extractedInfo.city,
            state: extractedInfo.state,
            address: extractedInfo.address,
            phone: extractedInfo.phone,
            email: extractedInfo.email,
          },
        };

        // Aplicar atualizações se houver mudanças
        if (Object.keys(updates).length > 1 || (updates.raw_data && changes.length > 0)) {
          const { error: updateError } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', company.id);

          if (updateError) {
            throw new Error(`Erro ao atualizar: ${updateError.message}`);
          }

          results.updated++;
          results.details.push({
            id: company.id,
            company_name: company.company_name,
            changes,
            status: 'updated',
          });

          console.log(`[RE-ENRICH] ✅ ${company.id} atualizado:`, changes);
        } else {
          results.details.push({
            id: company.id,
            company_name: company.company_name,
            changes: [],
            status: 'no_changes',
          });
          console.log(`[RE-ENRICH] ℹ️ ${company.id} sem mudanças necessárias`);
        }

        results.processed++;

        // Delay para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`[RE-ENRICH] ❌ Erro ao processar ${company.id}:`, error);
        results.errors++;
        results.details.push({
          id: company.id,
          company_name: company.company_name,
          changes: [],
          status: 'error',
          error: error.message || 'Erro desconhecido',
        });
      }
    }

    console.log(`[RE-ENRICH] ✅ Processamento concluído:`);
    console.log(`  Processadas: ${results.processed}`);
    console.log(`  Atualizadas: ${results.updated}`);
    console.log(`  Erros: ${results.errors}`);

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[RE-ENRICH] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao re-enriquecer empresas' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se empresa precisa de re-enriquecimento
 */
function needsReEnrichment(company: any): boolean {
  const name = company.company_name || '';
  const country = company.country || '';

  // 1. Nome parece título de página (Wholesale, Buy, Shop, etc.)
  if (isPageTitle(name)) {
    return true;
  }

  // 2. País não confere com nome (ex: nome tem "Guangzhou" mas país é "Colombia")
  const countryFromName = extractCountryFromName(name);
  if (countryFromName && country !== countryFromName) {
    return true;
  }

  // 3. País ausente mas tem website
  if (!country && (company.website || company.domain)) {
    return true;
  }

  return false;
}

/**
 * Verifica se string parece título de página ao invés de nome de empresa
 */
function isPageTitle(text: string): boolean {
  if (!text || text.length < 3) return false;

  const textLower = text.toLowerCase();
  
  // Padrões de títulos de página
  const pageTitlePatterns = [
    /^(wholesale|buy|shop|online|store|sale|purchase)/i,
    /(wholesale|sale|store|online|shop|buy)$/i,
    /\s+(wholesale|sale|store|online|shop|buy)\s+/i,
  ];

  for (const pattern of pageTitlePatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Extrai país do nome da empresa (baseado em cidades conhecidas)
 */
function extractCountryFromName(name: string): string | null {
  if (!name || typeof name !== 'string') return null;

  const nameLower = name.toLowerCase();

  const cityToCountry: Record<string, string> = {
    // China
    'guangzhou': 'China',
    'guangdong': 'China',
    'beijing': 'China',
    'shanghai': 'China',
    'shenzhen': 'China',
    'hong kong': 'China',
    'xiamen': 'China',
    'hangzhou': 'China',
    'ningbo': 'China',
    'foshan': 'China',
    'dongguan': 'China',
    // UK
    'evesham': 'United Kingdom',
    'worcestershire': 'United Kingdom',
    'london': 'United Kingdom',
    'manchester': 'United Kingdom',
    // USA
    'new york': 'United States',
    'los angeles': 'United States',
    'chicago': 'United States',
    // Colombia
    'bogotá': 'Colombia',
    'bogota': 'Colombia',
    'medellín': 'Colombia',
    'medellin': 'Colombia',
    // Brasil
    'são paulo': 'Brasil',
    'sao paulo': 'Brasil',
    'rio de janeiro': 'Brasil',
    // Argentina
    'buenos aires': 'Argentina',
    // Mexico
    'méxico': 'Mexico',
    'mexico city': 'Mexico',
  };

  for (const [city, country] of Object.entries(cityToCountry)) {
    if (nameLower.includes(city)) {
      return country;
    }
  }

  return null;
}
