import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  FileSignature, 
  Calendar, 
  Target, 
  Globe, 
  DollarSign, 
  Percent,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface DealerContractManagerProps {
  dealerId: string;
  dealerName: string;
  onSuccess?: () => void;
}

interface VolumeDiscount {
  min_units: number;
  discount_percentage: number;
}

export function DealerContractManager({ dealerId, dealerName, onSuccess }: DealerContractManagerProps) {
  const { currentTenant, currentWorkspace } = useTenant();
  
  const [formData, setFormData] = useState({
    duration_months: 12,
    start_date: new Date().toISOString().split('T')[0],
    sales_target_usd: 0,
    sales_target_units: 0,
    frequency: 'monthly',
    payment_terms: '30% advance, 70% at BL',
    default_incoterm: 'CIF',
    minimum_order_value_usd: 0,
    exclusive_territories: [] as string[],
    countries: [] as string[],
    discount_volume: [] as VolumeDiscount[],
    auto_renewal: false,
  });

  const createContractMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant || !currentWorkspace) throw new Error('Tenant/Workspace não identificado');

      // Calcular end_date
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + formData.duration_months);

      // Gerar contract_number
      const contractNumber = `CONT-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 10000)
      ).padStart(4, '0')}`;

      const payload = {
        ...formData,
        dealer_id: dealerId,
        tenant_id: currentTenant.id,
        workspace_id: currentWorkspace.id,
        contract_number: contractNumber,
        end_date: endDate.toISOString().split('T')[0],
        signed_date: formData.start_date,
        status: 'active',
        products: [],
      };

      const { data, error } = await supabase.from('dealer_contracts').insert(payload).select().single();

      if (error) throw error;

      return { data, contractNumber };
    },
    onSuccess: ({ contractNumber }) => {
      toast.success('Contrato criado com sucesso!', {
        description: `Número: ${contractNumber}`,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar contrato', {
        description: error.message,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Novo Contrato - {dealerName}
        </CardTitle>
        <CardDescription>
          Configure metas, territórios exclusivos e termos comerciais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duração */}
        <div>
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Duração do Contrato
          </Label>
          <Select
            value={formData.duration_months.toString()}
            onValueChange={(v) => setFormData({ ...formData, duration_months: parseInt(v) })}
          >
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">1 ano (12 meses)</SelectItem>
              <SelectItem value="24">2 anos (24 meses)</SelectItem>
              <SelectItem value="36">3 anos (36 meses)</SelectItem>
              <SelectItem value="48">4 anos (48 meses)</SelectItem>
              <SelectItem value="60">5 anos (60 meses)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data de Início */}
        <div>
          <Label htmlFor="start_date">Data de Início</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>

        {/* Meta de Vendas */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="target_usd" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Meta Anual (USD)
            </Label>
            <Input
              id="target_usd"
              type="number"
              placeholder="Ex: 500000"
              value={formData.sales_target_usd || ''}
              onChange={(e) =>
                setFormData({ ...formData, sales_target_usd: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div>
            <Label htmlFor="target_units" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Meta Unidades
            </Label>
            <Input
              id="target_units"
              type="number"
              placeholder="Ex: 500"
              value={formData.sales_target_units || ''}
              onChange={(e) =>
                setFormData({ ...formData, sales_target_units: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        {/* Incoterm Padrão */}
        <div>
          <Label htmlFor="incoterm">Incoterm Padrão</Label>
          <Select
            value={formData.default_incoterm}
            onValueChange={(v) => setFormData({ ...formData, default_incoterm: v })}
          >
            <SelectTrigger id="incoterm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXW">EXW - Ex Works</SelectItem>
              <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
              <SelectItem value="FOB">FOB - Free On Board</SelectItem>
              <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
              <SelectItem value="CIF">CIF - Cost, Insurance and Freight</SelectItem>
              <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
              <SelectItem value="CIP">CIP - Carriage and Insurance Paid</SelectItem>
              <SelectItem value="DAP">DAP - Delivered At Place</SelectItem>
              <SelectItem value="DPU">DPU - Delivered at Place Unloaded</SelectItem>
              <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Termos de Pagamento */}
        <div>
          <Label htmlFor="payment_terms">Termos de Pagamento</Label>
          <Input
            id="payment_terms"
            placeholder="Ex: 30% advance, 70% at BL"
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
          />
        </div>

        {/* Pedido Mínimo */}
        <div>
          <Label htmlFor="min_order" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Valor Mínimo de Pedido (USD)
          </Label>
          <Input
            id="min_order"
            type="number"
            placeholder="Ex: 10000"
            value={formData.minimum_order_value_usd || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimum_order_value_usd: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        {/* Auto-renewal */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="auto_renewal"
            checked={formData.auto_renewal}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, auto_renewal: !!checked })
            }
          />
          <Label
            htmlFor="auto_renewal"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Renovação automática ao fim do contrato
          </Label>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => createContractMutation.mutate()}
            disabled={createContractMutation.isPending}
            className="flex-1"
          >
            {createContractMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Criando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Criar Contrato
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

