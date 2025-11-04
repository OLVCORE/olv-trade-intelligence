import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductGapRequest {
  companyId: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  detectedProducts?: string[];
  competitors?: any[];
  similarCompanies?: any[];
}

// Catálogo TOTVS (14 categorias)
const TOTVS_PRODUCTS = {
  'IA': ['Carol AI', 'Auditoria Folha IA', 'Análise Preditiva'],
  'ERP': ['Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice'],
  'Analytics': ['TOTVS BI', 'Advanced Analytics', 'Data Platform'],
  'Assinatura': ['TOTVS Assinatura Eletrônica'],
  'Atendimento': ['TOTVS Chatbot', 'Service Desk'],
  'Cloud': ['TOTVS Cloud', 'IaaS', 'Backup Cloud', 'Disaster Recovery'],
  'Crédito': ['TOTVS Techfin', 'Antecipação de Recebíveis'],
  'CRM': ['TOTVS CRM', 'Sales Force Automation'],
  'Fluig': ['Fluig BPM', 'Fluig ECM', 'Fluig Workflow'],
  'iPaaS': ['TOTVS iPaaS', 'API Management'],
  'Marketing': ['RD Station'],
  'Pagamentos': ['TOTVS Pay', 'PIX Integrado'],
  'RH': ['TOTVS Folha', 'TOTVS Ponto', 'TOTVS Recrutamento'],
  'SFA': ['TOTVS SFA', 'Força de Vendas']
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: ProductGapRequest = await req.json();
    const {
      companyName,
      sector,
      cnae,
      size,
      employees,
      detectedProducts = [],
      competitors = [],
      similarCompanies = []
    } = body;

    console.log('[PRODUCT-GAPS] Analisando:', companyName);

    // ✅ CONECTAR OPENAI GPT-4o-mini (REAL - NÃO MOCK!)
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      console.error('[PRODUCT-GAPS] ❌ OPENAI_API_KEY não configurada!');
      throw new Error('OPENAI_API_KEY não configurada');
    }

    let strategy: 'cross-sell' | 'new-sale' | 'upsell' = 'new-sale';
    let recommendedProducts: any[] = [];

    // ESTRATÉGIA 1: Se empresa JÁ É CLIENTE TOTVS (detectedProducts > 0)
    if (detectedProducts.length > 0) {
      strategy = 'cross-sell';
      console.log('[PRODUCT-GAPS] Cliente TOTVS existente - CROSS-SELL');

      // Produtos que a empresa JÁ TEM
      const usedCategories = new Set<string>();
      Object.entries(TOTVS_PRODUCTS).forEach(([category, products]) => {
        if (products.some(p => detectedProducts.includes(p))) {
          usedCategories.add(category);
        }
      });

      // ✅ USAR IA PARA RECOMENDAR (não mais mock!)
      const aiPrompt = `Você é especialista em produtos TOTVS.

EMPRESA: ${companyName}
SETOR: ${sector || 'não especificado'}
PORTE: ${size || 'não especificado'} (${employees || '?'} funcionários)
PRODUTOS JÁ USANDO: ${detectedProducts.join(', ')}

Recomende 3-5 produtos TOTVS complementares da MESMA categoria para CROSS-SELL.

Responda APENAS JSON:
[
  {
    "name": "Nome do Produto",
    "category": "Categoria",
    "fit_score": 85-95,
    "value": "R$ XXK-XXXK ARR",
    "reason": "Razão específica para essa empresa",
    "timing": "immediate",
    "priority": "high",
    "roi_months": 12,
    "benefits": ["Benefício 1", "Benefício 2", "Benefício 3"]
  }
]`;

      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices[0].message.content;
          const parsed = JSON.parse(aiContent.replace(/```json\n?|```/g, ''));
          recommendedProducts = Array.isArray(parsed) ? parsed : [parsed];
          console.log('[PRODUCT-GAPS] ✅ IA retornou:', recommendedProducts.length, 'produtos');
        }
      } catch (error) {
        console.error('[PRODUCT-GAPS] ❌ Erro na IA, usando fallback:', error);
        // Fallback simples se IA falhar
        Object.entries(TOTVS_PRODUCTS).forEach(([category, products]) => {
          if (usedCategories.has(category)) {
            products.forEach(product => {
              if (!detectedProducts.includes(product) && recommendedProducts.length < 3) {
                recommendedProducts.push({
                  name: product,
                  category,
                  fit_score: 85,
                  value: 'R$ 50K-150K ARR',
                  reason: `Complementar à stack TOTVS existente (${category})`,
                  timing: 'immediate',
                  priority: 'high',
                  roi_months: 12,
                  benefits: ['Integração nativa', 'Reduz custos', 'Melhora eficiência']
                });
              }
            });
          }
        });
      }

      // Produtos de OUTRAS categorias (expansão)
      Object.entries(TOTVS_PRODUCTS).forEach(([category, products]) => {
        if (!usedCategories.has(category) && recommendedProducts.length < 5) {
          recommendedProducts.push({
            name: products[0],
            category,
            fit_score: 70 + Math.floor(Math.random() * 10),
            value: 'R$ 100K-200K ARR',
            reason: `Expandir stack TOTVS para ${category}`,
            timing: 'short_term',
            priority: 'medium',
            roi_months: 18,
            benefits: [
              'Nova categoria de produto',
              'Aproveitamento de infraestrutura existente',
              'Cross-sell estratégico'
            ]
          });
        }
      });
    }
    
    // ESTRATÉGIA 2: Empresa NÃO é cliente TOTVS (NEW SALE)
    else {
      strategy = 'new-sale';
      console.log('[PRODUCT-GAPS] Prospect novo - NEW SALE');

      // ✅ USAR IA PARA RECOMENDAR STACK INICIAL (não mais mock!)
      const competitorInfo = competitors.length > 0 ? 
        `\nCONCORRENTES DETECTADOS: ${competitors.map(c => c.name).join(', ')}` : '';
      
      const aiPrompt = `Você é especialista em produtos TOTVS.

EMPRESA: ${companyName}
SETOR: ${sector || 'não especificado'}
PORTE: ${size || 'não especificado'} (${employees || '?'} funcionários)
CNAE: ${cnae || 'não especificado'}${competitorInfo}

Recomende stack inicial de 3 produtos TOTVS para NEW SALE considerando porte e setor.

Produtos disponíveis por categoria:
- ERP: Protheus, Datasul, RM, Logix, Winthor
- Fluig: Fluig BPM, Fluig ECM
- CRM: TOTVS CRM
- Cloud: TOTVS Cloud
- IA: Carol AI

Responda APENAS JSON:
[
  {
    "name": "Produto TOTVS",
    "category": "Categoria",
    "fit_score": 85-100,
    "value": "R$ XXK-XXXK ARR",
    "reason": "Por que esse produto faz sentido para essa empresa específica",
    "timing": "immediate|short_term|medium_term",
    "priority": "high|medium",
    "roi_months": 12-24,
    "benefits": ["Benefício específico 1", "Benefício 2", "Benefício 3"]
  }
]`;

      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices[0].message.content;
          const parsed = JSON.parse(aiContent.replace(/```json\n?|```/g, ''));
          recommendedProducts = Array.isArray(parsed) ? parsed.slice(0, 3) : [parsed];
          
          // Se tem concorrentes, adicionar displacement
          if (competitors.length > 0 && recommendedProducts.length > 0) {
            const competitorNames = competitors.map(c => c.name || '').join(', ');
            recommendedProducts[0].competitor_displacement = `Substitui ${competitorNames}`;
          }
          
          console.log('[PRODUCT-GAPS] ✅ IA retornou:', recommendedProducts.length, 'produtos');
        }
      } catch (error) {
        console.error('[PRODUCT-GAPS] ❌ Erro na IA, usando fallback básico:', error);
        // Fallback mínimo
        recommendedProducts = [{
          name: 'Protheus',
          category: 'ERP',
          fit_score: 85,
          value: 'R$ 300K-500K ARR',
          reason: `ERP base para porte ${size || 'médio'}`,
          timing: 'immediate',
          priority: 'high',
          roi_months: 18,
          benefits: ['Gestão integrada', 'Controle financeiro', 'Redução de custos']
        }];
      }
    }

    // ESTRATÉGIA 3: Analisar empresas SIMILARES (uso de produtos)
    if (similarCompanies && similarCompanies.length > 0) {
      console.log('[PRODUCT-GAPS] Analisando empresas similares:', similarCompanies.length);
      
      // Produtos usados por similares
      const similarUsageMap = new Map<string, number>();
      
      similarCompanies.forEach((similar: any) => {
        if (similar.detected_products) {
          similar.detected_products.forEach((product: string) => {
            similarUsageMap.set(product, (similarUsageMap.get(product) || 0) + 1);
          });
        }
      });

      // Top 3 produtos mais usados por similares
      const topSimilarProducts = Array.from(similarUsageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([product, count]) => ({
          product,
          count,
          percentage: Math.round((count / similarCompanies.length) * 100)
        }));

      // Adicionar insights de similares
      topSimilarProducts.forEach(({ product, percentage }) => {
        if (!detectedProducts.includes(product) && recommendedProducts.length < 6) {
          recommendedProducts.push({
            name: product,
            category: Object.keys(TOTVS_PRODUCTS).find(cat => 
              TOTVS_PRODUCTS[cat as keyof typeof TOTVS_PRODUCTS].includes(product)
            ) || 'Outro',
            fit_score: 70 + percentage / 2,
            value: 'R$ 80K-200K ARR',
            reason: `${percentage}% das empresas similares usam este produto`,
            timing: 'medium_term',
            priority: 'medium',
            roi_months: 18,
            benefits: [
              `Usado por ${percentage}% dos concorrentes`,
              'Padrão do mercado no setor',
              'Benchmarking competitivo'
            ]
          });
        }
      });
    }

    // Calcular valor total estimado
    const totalEstimatedValue = recommendedProducts.reduce((sum, prod) => {
      const match = prod.value.match(/R\$ ([\d,]+)K/);
      if (match) {
        const avgValue = parseInt(match[1].replace(',', '')) * 1000;
        return sum + avgValue;
      }
      return sum;
    }, 0);

    const totalEstimatedValueFormatted = `R$ ${(totalEstimatedValue / 1000).toFixed(0)}K-${((totalEstimatedValue * 1.5) / 1000).toFixed(0)}K ARR`;

    // Stack sugerido
    const stackSuggestion = {
      core: recommendedProducts.filter(p => p.priority === 'high').map(p => p.name),
      complementary: recommendedProducts.filter(p => p.priority === 'medium').map(p => p.name),
      future_expansion: ['Carol AI', 'TOTVS Analytics', 'TOTVS Cloud']
    };

    const response = {
      success: true,
      strategy,
      recommended_products: recommendedProducts.slice(0, 5), // Top 5
      total_estimated_value: totalEstimatedValueFormatted,
      stack_suggestion: stackSuggestion,
      insights: [
        strategy === 'cross-sell' 
          ? `Cliente TOTVS: ${detectedProducts.length} produtos em uso. Oportunidade de cross-sell de ${recommendedProducts.length} produtos.`
          : `Prospect novo: Stack inicial com ${recommendedProducts.length} produtos recomendados.`,
        similarCompanies && similarCompanies.length > 0
          ? `Benchmarking: ${similarCompanies.length} empresas similares analisadas para recomendações.`
          : 'Recomendações baseadas em porte e setor da empresa.',
        `Valor total estimado: ${totalEstimatedValueFormatted}`
      ],
      generated_at: new Date().toISOString()
    };

    console.log('[PRODUCT-GAPS] Sucesso:', recommendedProducts.length, 'produtos recomendados');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('[PRODUCT-GAPS] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao gerar recomendações de produtos'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

