// Edge Function: enrich-receitaws
// Enriquece dados de empresa usando API ReceitaWS

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { cnpj, company_id } = await req.json()

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Remove formatação do CNPJ
    const cleanCNPJ = cnpj.replace(/\D/g, '')

    console.log('[ReceitaWS] Buscando dados para CNPJ:', cleanCNPJ)

    // Chamar API ReceitaWS
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[ReceitaWS] Erro na API:', response.status, response.statusText)
      throw new Error(`API ReceitaWS retornou erro: ${response.status}`)
    }

    const data = await response.json()

    // Verificar se retornou erro
    if (data.status === 'ERROR') {
      console.error('[ReceitaWS] CNPJ não encontrado:', data.message)
      return new Response(
        JSON.stringify({ error: data.message || 'CNPJ não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('[ReceitaWS] ✅ Dados encontrados para:', data.nome)

    // ATUALIZAR A EMPRESA NO BANCO COM NORMALIZADOR UNIVERSAL
    if (company_id) {
      const { data: currentCompany } = await supabaseClient
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .single()

      const existingRawData = currentCompany?.raw_data || {}

      // NORMALIZAÇÃO UNIVERSAL - MAPEIA TUDO AUTOMATICAMENTE
      const updateData: any = {
        company_name: data.nome || currentCompany.company_name,
        industry: data.atividade_principal?.[0]?.text || currentCompany.industry,
        employees: data.qsa?.length || currentCompany.employees,
        state: data.uf || currentCompany.state,
        city: data.municipio || currentCompany.city,
        street: data.logradouro || currentCompany.street,
        number: data.numero || currentCompany.number,
        neighborhood: data.bairro || currentCompany.neighborhood,
        zip_code: data.cep || currentCompany.zip_code,
        phone: data.telefone || currentCompany.phone,
        email: data.email || currentCompany.email,
        share_capital: data.capital_social ? parseFloat(data.capital_social) : currentCompany.share_capital,
        registration_status: data.situacao || currentCompany.registration_status,
        opening_date: data.abertura || currentCompany.opening_date,
        legal_nature: data.natureza_juridica || currentCompany.legal_nature,
        company_size: data.porte || currentCompany.company_size,
        main_activity: data.atividade_principal?.[0]?.text || currentCompany.main_activity,
        raw_data: {
          ...existingRawData,
          enriched_receita: true,
          receita: data
        }
      }

      const { data: updated, error: updateError } = await supabaseClient
        .from('companies')
        .update(updateData)
        .eq('id', company_id)
        .select()
        .single()

      if (updateError) {
        console.error('[ReceitaWS] ❌ Erro ao atualizar empresa:', updateError)
        throw updateError
      }

      console.log('[ReceitaWS] ✅ Empresa atualizada:', {
        company_id,
        enriched_receita: updated.raw_data?.enriched_receita,
        situacao: updated.raw_data?.receita?.situacao,
        nome: updated.raw_data?.receita?.nome
      })
    }

    // Retornar dados enriquecidos
    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[ReceitaWS] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao buscar dados da Receita Federal' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
