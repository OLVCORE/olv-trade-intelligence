import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import {
  ShoppingCart,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DealerOrderManagerProps {
  dealerId: string;
}

export function DealerOrderManager({ dealerId }: DealerOrderManagerProps) {
  const { currentTenant } = useTenant();

  // Buscar pedidos do dealer
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['dealer-orders', dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealer_orders')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('order_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: {
        variant: 'secondary',
        icon: Clock,
        label: 'Pendente',
      },
      confirmed: {
        variant: 'default',
        icon: CheckCircle,
        label: 'Confirmado',
      },
      production: {
        variant: 'default',
        icon: Package,
        label: 'Produção',
      },
      shipped: {
        variant: 'default',
        icon: Truck,
        label: 'Enviado',
      },
      delivered: {
        variant: 'default',
        icon: CheckCircle,
        label: 'Entregue',
      },
      cancelled: {
        variant: 'destructive',
        icon: XCircle,
        label: 'Cancelado',
      },
    };

    const config = variants[status] || variants.pending;
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
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pedido registrado ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Pedidos ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{order.order_number}</h4>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Data
                        </p>
                        <p className="font-medium">
                          {new Date(order.order_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Valor Total
                        </p>
                        <p className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(order.total_usd || 0)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Incoterm</p>
                        <p className="font-medium">{order.incoterm}</p>
                      </div>
                    </div>
                    
                    {order.shipping_tracking && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Tracking: <span className="font-mono">{order.shipping_tracking}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

