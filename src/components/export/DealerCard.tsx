import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CommercialProposalGenerator } from '@/components/proposals/CommercialProposalGenerator';
import {
  Building2,
  MapPin,
  DollarSign,
  Users,
  Target,
  FileText,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  TrendingUp,
  Package,
  Flame,
  Search,
  Check,
  Loader2
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Dealer {
  id: string;
  name: string;
  country: string;
  city: string;
  state?: string;
  industry: string;
  employee_count?: number;
  revenue_range?: string;
  annual_revenue_usd?: number;
  website?: string;
  linkedin_url?: string;
  description?: string;
  
  // B2B Indicators
  is_distributor: boolean;
  is_wholesaler: boolean;
  is_importer: boolean;
  
  // Decision Makers
  decision_makers?: Array<{
    name: string;
    title: string;
    email?: string;
    linkedin_url?: string;
  }>;
  
  // Scores
  export_fit_score?: number; // 0-100
  
  // Apollo data
  apollo_organization_id?: string;
}

interface DealerCardProps {
  dealer: Dealer;
  onGenerateProposal?: (dealer: Dealer) => void;
  onViewDetails?: (dealer: Dealer) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DealerCard({ dealer, onGenerateProposal, onViewDetails }: DealerCardProps) {
  // Determinar badge de tipo B2B
  const getB2BType = () => {
    if (dealer.is_distributor) return { label: 'Distributor', color: 'bg-blue-100 text-blue-800' };
    if (dealer.is_wholesaler) return { label: 'Wholesaler', color: 'bg-green-100 text-green-800' };
    if (dealer.is_importer) return { label: 'Importer', color: 'bg-purple-100 text-purple-800' };
    return { label: 'B2B', color: 'bg-gray-100 text-gray-800' };
  };

  const b2bType = getB2BType();

  // Export Fit Score Color
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-2">
      <CardContent className="p-6">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">{dealer.name}</h3>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={b2bType.color}>
                {b2bType.label}
              </Badge>
              
              {dealer.employee_count && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {dealer.employee_count}+ employees
                </Badge>
              )}
            </div>
          </div>

          {/* EXPORT FIT SCORE */}
          {dealer.export_fit_score !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex flex-col items-center">
                    <div className={`text-3xl font-bold ${getScoreColor(dealer.export_fit_score)}`}>
                      {dealer.export_fit_score}
                    </div>
                    <div className="text-xs text-muted-foreground">Fit Score</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Export Fit Score calculado com base em:<br />
                    • Histórico de importações<br />
                    • HS Code matching<br />
                    • Capacidade financeira<br />
                    • Estrutura (funcionários)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* LOCALIZAÇÃO */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {dealer.city}
              {dealer.state && `, ${dealer.state}`}, {dealer.country}
            </span>
          </div>

          {dealer.industry && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{dealer.industry}</span>
            </div>
          )}

          {dealer.annual_revenue_usd && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">
                ~USD {(dealer.annual_revenue_usd / 1000000).toFixed(1)}M annual revenue
              </span>
            </div>
          )}

          {dealer.revenue_range && !dealer.annual_revenue_usd && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{dealer.revenue_range}</span>
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
        {dealer.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {dealer.description}
          </p>
        )}

        {/* DECISION MAKERS */}
        {dealer.decision_makers && dealer.decision_makers.length > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                Decisores ({dealer.decision_makers.length})
              </span>
            </div>
            <div className="space-y-2">
              {dealer.decision_makers.slice(0, 3).map((dm, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <div className="flex-1">
                    <p className="font-medium">{dm.name}</p>
                    <p className="text-muted-foreground">{dm.title}</p>
                  </div>
                  {dm.email && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Mail className="h-3 w-3 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{dm.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
              {dealer.decision_makers.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{dealer.decision_makers.length - 3} mais
                </p>
              )}
            </div>
          </div>
        )}

        {/* LINKS */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {dealer.website && (
            <Button variant="outline" size="sm" asChild>
              <a href={dealer.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-3 w-3 mr-1" />
                Website
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}

          {dealer.linkedin_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={dealer.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Building2 className="h-3 w-3 mr-1" />
                LinkedIn
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(dealer)}
          >
            <Target className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
          
          <CommercialProposalGenerator
            dealer={dealer}
            onProposalGenerated={(proposalId) => {
              console.log('[DEALER] Proposta gerada:', proposalId);
              onGenerateProposal?.(dealer);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SAVE DEALER BUTTON (Salvar na Base de Empresas)
// ============================================================================

function SaveDealerButton({ dealer }: { dealer: Dealer }) {
  const { currentTenant, currentWorkspace } = useTenant();
  const [isSaved, setIsSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant || !currentWorkspace) throw new Error('Tenant/Workspace não identificado');

      const { data, error } = await supabase.from('companies').insert({
        tenant_id: currentTenant.id,
        workspace_id: currentWorkspace.id,
        company_name: dealer.name,
        cnpj: null,
        website: dealer.website,
        city: dealer.city,
        state: null,
        country: dealer.country,
        industry: dealer.industry,
        employee_count: dealer.employees,
        revenue_usd: dealer.revenue,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsSaved(true);
      toast.success('Dealer salvo na base!', {
        description: `${dealer.name} adicionado à base de empresas`,
      });
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar dealer', {
        description: error.message,
      });
    },
  });

  return (
    <Button
      variant={isSaved ? 'default' : 'secondary'}
      size="sm"
      onClick={() => saveMutation.mutate()}
      disabled={saveMutation.isPending || isSaved}
    >
      {saveMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
          Salvando...
        </>
      ) : isSaved ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Salvo na Base
        </>
      ) : (
        <>
          <Building2 className="h-4 w-4 mr-1" />
          Salvar na Base
        </>
      )}
    </Button>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export function DealersEmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
        <Search className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhuma busca realizada</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Preencha o formulário acima com <strong>HS Code</strong> e <strong>País-alvo</strong> para
        descobrir dealers e distribuidores B2B internacionais.
      </p>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          <span>Apenas B2B</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>Com decisores</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          <span>Export Fit Score</span>
        </div>
      </div>
    </Card>
  );
}

