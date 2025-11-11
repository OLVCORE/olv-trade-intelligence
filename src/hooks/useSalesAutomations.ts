import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface SalesAutomation {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  trigger_type: string;
  trigger_config: any;
  conditions: any;
  actions: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  executions_count: number;
  last_executed_at?: string | null;
  created_at: string;
}

export function useSalesAutomations() {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['sales_automations', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return [];

      const { data, error } = await supabase
        .from('sales_automations')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SalesAutomation[];
    },
    enabled: !!currentTenant,
  });
}

