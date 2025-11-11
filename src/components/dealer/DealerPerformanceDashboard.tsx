import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Award,
  Calendar,
  Package,
  Loader2,
} from 'lucide-react';

interface DealerPerformanceDashboardProps {
  dealerId: string;
}

export function DealerPerformanceDashboard({ dealerId }: DealerPerformanceDashboardProps) {
  // Buscar performance do dealer
  const { data: performance, isLoading } = useQuery({
    queryKey: ['dealer-performance', dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealer_performance')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Buscar contrato ativo
  const { data: contract } = useQuery({
    queryKey: ['dealer-contract', dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealer_contracts')
        .select('*')
        .eq('dealer_id', dealerId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Nenhuma performance registrada ainda</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Performance será calculada automaticamente quando houver pedidos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const achievementPercentage = performance.achievement_percentage || 0;
  const tier = performance.tier || 'bronze';

  // Cor do tier
  const tierColors = {
    bronze: 'bg-amber-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Meta Batida */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta Batida</p>
                <p className="text-3xl font-bold">{achievementPercentage.toFixed(0)}%</p>
              </div>
              {achievementPercentage >= 100 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-orange-600" />
              )}
            </div>
            <Progress value={Math.min(achievementPercentage, 100)} className="mt-3" />
          </CardContent>
        </Card>

        {/* Vendas Realizadas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(performance.achieved_usd || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(performance.target_usd || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Unidades Vendidas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unidades</p>
                <p className="text-3xl font-bold">{performance.achieved_units || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {performance.target_units || 0} unidades
            </p>
          </CardContent>
        </Card>

        {/* Tier */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tier</p>
                <p className="text-3xl font-bold capitalize">{tier}</p>
              </div>
              <Award className={`h-8 w-8 ${tierColors[tier as keyof typeof tierColors] || 'text-gray-400'}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Score: {(performance.score || 0).toFixed(1)}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes do Contrato */}
      {contract && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Contrato Ativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Número</p>
                <p className="font-semibold">{contract.contract_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Início</p>
                <p className="font-semibold">
                  {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Término</p>
                <p className="font-semibold">
                  {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Duração</p>
                <p className="font-semibold">{contract.duration_months} meses</p>
              </div>
              <div>
                <p className="text-muted-foreground">Incoterm Padrão</p>
                <p className="font-semibold">{contract.default_incoterm}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                  {contract.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

