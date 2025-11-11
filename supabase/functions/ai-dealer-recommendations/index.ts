// ============================================================================
// AI DEALER RECOMMENDATIONS - Edge Function
// ============================================================================
// Analisa performance do dealer e recomenda ações (upsell, cross-sell, etc)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dealer_id } = await req.json();

    if (!dealer_id) {
      throw new Error('dealer_id é obrigatório');
    }

    console.log('[AI-RECOMMENDATIONS] Analisando dealer:', dealer_id);

    // Criar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar dados do dealer
    const { data: dealer, error: dealerError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', dealer_id)
      .single();

    if (dealerError) throw dealerError;

    console.log('[AI-RECOMMENDATIONS] Dealer encontrado:', dealer.company_name);

    // 2. Buscar performance
    const { data: performance } = await supabase
      .from('dealer_performance')
      .select('*')
      .eq('dealer_id', dealer_id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Buscar últimos pedidos
    const { data: orders } = await supabase
      .from('dealer_orders')
      .select('*')
      .eq('dealer_id', dealer_id)
      .order('order_date', { ascending: false })
      .limit(5);

    // 4. Buscar contrato
    const { data: contract } = await supabase
      .from('dealer_contracts')
      .select('*')
      .eq('dealer_id', dealer_id)
      .eq('status', 'active')
      .maybeSingle();

    console.log('[AI-RECOMMENDATIONS] Dados coletados:', {
      performance: performance ? 'sim' : 'não',
      orders: orders?.length || 0,
      contract: contract ? 'sim' : 'não',
    });

    // 5. Gerar recomendações baseadas em regras de negócio
    const recommendations = [];

    // Análise de performance
    if (performance) {
      const achievementPercentage = performance.achievement_percentage || 0;

      if (achievementPercentage >= 120) {
        recommendations.push({
          type: 'expansion',
          priority: 'high',
          title: 'Dealer Excepcional - Expandir Territórios',
          description: `Performance excepcional (${achievementPercentage.toFixed(0)}%). Considere expandir territórios exclusivos ou aumentar metas.`,
          action: 'Revisar contrato para expansão territorial',
        });
      } else if (achievementPercentage >= 100) {
        recommendations.push({
          type: 'upsell',
          priority: 'medium',
          title: 'Meta Batida - Oportunidade de Upsell',
          description: 'Dealer está batendo metas. Ofereça produtos complementares da linha premium.',
          action: 'Oferecer linha premium ou produtos complementares',
        });
      } else if (achievementPercentage < 50) {
        recommendations.push({
          type: 'at_risk',
          priority: 'high',
          title: 'Performance Baixa - Ação Urgente',
          description: `Apenas ${achievementPercentage.toFixed(0)}% da meta. Agendar reunião para entender dificuldades.`,
          action: 'Agendar call de suporte ou oferecer treinamento',
        });
      }

      // Análise de tier
      if (performance.tier === 'bronze') {
        recommendations.push({
          type: 'incentive',
          priority: 'medium',
          title: 'Incentivo para Upgrade de Tier',
          description: 'Oferecer bônus se atingir Silver (20% acima da meta por 2 meses consecutivos).',
          action: 'Criar programa de incentivo personalizado',
        });
      } else if (performance.tier === 'platinum') {
        recommendations.push({
          type: 'retention',
          priority: 'high',
          title: 'Dealer Platinum - Retenção Prioritária',
          description: 'Top performer. Garantir atendimento VIP e renovação antecipada de contrato.',
          action: 'Agendar reunião de renovação 6 meses antes do vencimento',
        });
      }
    }

    // Análise de pedidos
    if (orders && orders.length > 0) {
      const lastOrderDate = new Date(orders[0].order_date);
      const daysSinceLastOrder = Math.floor(
        (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastOrder > 90) {
        recommendations.push({
          type: 'reactivation',
          priority: 'high',
          title: 'Dealer Inativo há 90+ dias',
          description: `Último pedido: ${lastOrderDate.toLocaleDateString()}. Risco de churn alto.`,
          action: 'Campanha de reativação com desconto especial ou MDF',
        });
      } else if (daysSinceLastOrder > 60) {
        recommendations.push({
          type: 'follow_up',
          priority: 'medium',
          title: 'Follow-up Recomendado',
          description: 'Dealer não faz pedidos há 60+ dias. Verificar se há problemas de estoque.',
          action: 'Email de follow-up ou ligação',
        });
      }
    } else {
      recommendations.push({
        type: 'first_order',
        priority: 'high',
        title: 'Primeiro Pedido Pendente',
        description: 'Dealer ainda não fez nenhum pedido. Oferecer desconto de abertura.',
        action: 'Campanha Welcome Kit + 10% desconto no primeiro pedido',
      });
    }

    // Análise de contrato
    if (contract) {
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.floor((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry > 0 && daysUntilExpiry <= 180) {
        recommendations.push({
          type: 'renewal',
          priority: 'high',
          title: 'Contrato Vence em 6 Meses',
          description: `Data de vencimento: ${endDate.toLocaleDateString()}. Iniciar processo de renovação.`,
          action: 'Preparar proposta de renovação com condições especiais',
        });
      } else if (daysUntilExpiry < 0) {
        recommendations.push({
          type: 'expired',
          priority: 'critical',
          title: 'Contrato Expirado!',
          description: 'Contrato venceu. Renovar imediatamente ou perder dealer.',
          action: 'URGENTE: Contatar dealer para renovação',
        });
      }
    }

    console.log('[AI-RECOMMENDATIONS] Recomendações geradas:', recommendations.length);

    // 6. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        dealer: {
          id: dealer.id,
          name: dealer.company_name,
          country: dealer.country,
        },
        performance: performance || null,
        contract: contract || null,
        recommendations: recommendations,
        stats: {
          total_orders: orders?.length || 0,
          last_order_date: orders?.[0]?.order_date || null,
          tier: performance?.tier || 'none',
          achievement_percentage: performance?.achievement_percentage || 0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[AI-RECOMMENDATIONS] Erro:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

