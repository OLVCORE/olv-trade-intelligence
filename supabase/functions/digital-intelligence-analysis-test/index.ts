import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName, cnpj } = await req.json();
    
    console.log(`[TEST] Recebido: ${companyName} - ${cnpj}`);

    // Retornar dados mockados para teste
    const mockData = {
      temperature: 'hot',
      temperature_score: 95,
      sales_readiness_score: 8,
      closing_probability: 80,
      digital_presence: {
        website: 'https://vianaoffshore.com.br',
        linkedin: 'https://linkedin.com/company/viana-offshore',
        instagram: 'https://instagram.com/vianaoffshore',
        facebook: 'https://facebook.com/vianaoffshore',
        youtube: null,
        twitter: null,
      },
      buying_signals: [
        {
          signal: 'Vaga de TI aberta há 15 dias',
          source: 'linkedin',
          url: 'https://linkedin.com/jobs/view/123',
          relevance: 'critical',
        }
      ],
      pain_points: [
        {
          pain: 'Sistema ERP lento',
          severity: 'critical',
          source: 'review',
          url: 'https://reclameaqui.com.br/viana',
          totvs_solution: 'TOTVS Protheus Cloud',
        }
      ],
      timeline: [],
      ai_diagnosis: 'Empresa em momento de crescimento com dores identificadas no ERP atual.',
      sales_script: 'Olá! Vi que a Viana Offshore está crescendo 30%. Temos cases de empresas offshore...',
      approach_timing: 'IMEDIATO (próximos 7 dias)',
      analyzed_urls: [
        {
          url: 'https://vianaoffshore.com.br',
          title: 'Viana Offshore - Home',
          snippet: 'Soluções em EPI e MRO para offshore',
          source_type: 'website',
          ai_analysis: {
            content_type: 'institucional',
            buying_signal: false,
            temperature: 'warm',
            pain_point: null,
            event: null,
            sales_relevance: 5,
            insight: 'Website profissional, empresa estabelecida',
            script_suggestion: 'Empresa consolidada no setor offshore',
          }
        },
        {
          url: 'https://linkedin.com/company/viana-offshore',
          title: 'Viana Offshore | LinkedIn',
          snippet: 'Empresa de EPI e MRO com 1.2K seguidores',
          source_type: 'linkedin',
          ai_analysis: {
            content_type: 'rede_social',
            buying_signal: false,
            temperature: 'warm',
            pain_point: null,
            event: null,
            sales_relevance: 6,
            insight: 'Presença ativa no LinkedIn',
            script_suggestion: 'Empresa engajada em networking B2B',
          }
        }
      ],
      generated_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(mockData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[TEST] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

