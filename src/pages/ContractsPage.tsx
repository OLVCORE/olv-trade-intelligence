import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import {
  FileSignature,
  Calendar,
  DollarSign,
  Globe,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Plus,
} from 'lucide-react';

export default function ContractsPage() {
  const { currentTenant, currentWorkspace } = useTenant();

  // Buscar contratos do workspace atual
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['dealer-contracts', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace) return [];

      const { data, error } = await supabase
        .from('dealer_contracts')
        .select(`
          *,
          companies:dealer_id (
            company_name,
            city,
            country
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspace,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      draft: { variant: 'secondary', icon: Clock, label: 'Rascunho' },
      active: { variant: 'default', icon: CheckCircle, label: 'Ativo' },
      suspended: { variant: 'secondary', icon: Clock, label: 'Suspenso' },
      expired: { variant: 'destructive', icon: XCircle, label: 'Expirado' },
      terminated: { variant: 'destructive', icon: XCircle, label: 'Terminado' },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileSignature className="h-8 w-8 text-primary" />
            Contratos com Dealers
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie contratos de longo prazo (1-5 anos) com distribuidores
          </p>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Lista de Contratos */}
      {contracts && contracts.length > 0 ? (
        <div className="grid gap-4">
          {contracts.map((contract: any) => (
            <Card key={contract.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {contract.companies?.company_name || 'Dealer'}
                      </h3>
                      {getStatusBadge(contract.status)}
                    </div>

                    {/* Detalhes */}
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <FileSignature className="h-3 w-3" />
                          Número
                        </p>
                        <p className="font-medium">{contract.contract_number}</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vigência
                        </p>
                        <p className="font-medium">
                          {new Date(contract.start_date).toLocaleDateString('pt-BR')} -{' '}
                          {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Meta Anual
                        </p>
                        <p className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(contract.sales_target_usd || 0)}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Incoterm
                        </p>
                        <p className="font-medium">{contract.default_incoterm}</p>
                      </div>
                    </div>

                    {/* Termos de Pagamento */}
                    {contract.payment_terms && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Pagamento:</strong> {contract.payment_terms}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum contrato registrado ainda</p>
            <p className="text-xs mt-2">
              Crie contratos para gerenciar relacionamentos de longo prazo com dealers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

