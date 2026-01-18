/**
 * COMPONENTE: RegionBadge
 * 
 * Renderiza região BUSCANDO DINAMICAMENTE de APIs externas
 * 
 * ✅ SEM HARDCODE - busca real de REST Countries API
 * ✅ Suporta 195+ países dinamicamente
 * ✅ Usa cache do React Query para performance
 */

import { Badge } from '@/components/ui/badge';
import { useCountryRegion } from '@/hooks/useCountryRegion';
import { Loader2 } from 'lucide-react';

interface RegionBadgeProps {
  company: any;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function RegionBadge({ 
  company, 
  variant = 'outline',
  className = '' 
}: RegionBadgeProps) {
  const { region, isLoading } = useCountryRegion(company);

  if (isLoading) {
    return (
      <Badge variant={variant} className={`${className} flex items-center gap-1`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Carregando...</span>
      </Badge>
    );
  }

  return (
    <Badge variant={variant} className={className}>
      {region || 'N/A'}
    </Badge>
  );
}
