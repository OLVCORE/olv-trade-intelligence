import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { DealerDiscoveryForm, type DealerSearchParams } from '@/components/export/DealerDiscoveryForm';
import { DealerCard, DealersEmptyState, type Dealer } from '@/components/export/DealerCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Building2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ExportDealersPage() {
  const { currentWorkspace } = useTenant();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [searchParams, setSearchParams] = useState<DealerSearchParams | null>(null);

  // ============================================================================
  // SEARCH DEALERS (via Edge Function)
  // ============================================================================

  const searchMutation = useMutation({
    mutationFn: async (params: DealerSearchParams) => {
      console.log('[EXPORT] 🔍 Buscando dealers B2B...', params);

      // Buscar dealers para CADA país selecionado
      const allDealers: Dealer[] = [];
      
      for (const country of params.countries) {
        const { data, error } = await supabase.functions.invoke('discover-dealers-b2b', {
          body: {
            hs_code: params.hsCode,
            country: country,
            min_volume_usd: params.minVolume || null,
            keywords: params.keywords || [],
          },
        });

        if (error) {
          console.error('[EXPORT] ❌ Erro ao buscar dealers em', country, error);
          continue; // Continua com próximo país
        }

        if (data?.dealers) {
          allDealers.push(...data.dealers);
        }
      }

      console.log('[EXPORT] ✅ Total de dealers encontrados:', allDealers.length);
      return allDealers;
    },
    onSuccess: (data) => {
      setDealers(data || []);
      
      if (!data || data.length === 0) {
        toast.info('Nenhum dealer encontrado', {
          description: 'Tente ajustar os filtros de busca',
        });
      } else {
        toast.success(`✅ ${data.dealers.length} dealer(s) B2B encontrado(s)!`, {
          description: `Apenas distribuidores/wholesalers (B2C excluídos)`,
          duration: 5000,
        });
      }
    },
    onError: (error: any) => {
      console.error('[EXPORT] ❌ Erro na busca:', error);
      toast.error('Erro ao buscar dealers', {
        description: error.message || 'Verifique o console',
      });
    },
  });

  const handleSearch = (params: DealerSearchParams) => {
    setSearchParams(params);
    searchMutation.mutate(params);
  };

  // ============================================================================
  // WORKSPACE CHECK
  // ============================================================================

  if (currentWorkspace?.type !== 'export') {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Workspace incorreto:</strong> Esta página só funciona no workspace <strong>Export Intelligence</strong>.
            Por favor, troque o workspace no header.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Export Intelligence - Dealers B2B
          </h1>
          <p className="text-muted-foreground mt-2">
            Descubra distribuidores, wholesalers e importadores internacionais de equipamentos
          </p>
        </div>

        {/* WORKSPACE BADGE */}
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          <Globe className="h-3 w-3 mr-1" />
          Export Workspace
        </Badge>
      </div>

      {/* SEARCH FORM */}
      <DealerDiscoveryForm
        onSearch={handleSearch}
        isSearching={searchMutation.isPending}
      />

      {/* RESULTS STATS */}
      {dealers.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-lg">{dealers.length}</span>
                  <span className="text-sm text-muted-foreground">dealer(s) B2B</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">
                    {dealers.reduce((sum, d) => sum + (d.decision_makers?.length || 0), 0)}
                  </span>
                  <span className="text-sm text-muted-foreground">decisor(es)</span>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-lg">
                    {dealers.filter((d) => (d.export_fit_score || 0) >= 60).length}
                  </span>
                  <span className="text-sm text-muted-foreground">fit alto (60+)</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Busca: HS {searchParams?.hsCode} em {searchParams?.country}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULTS GRID */}
      {dealers.length === 0 && !searchMutation.isPending ? (
        <DealersEmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dealers.map((dealer) => (
            <DealerCard
              key={dealer.id}
              dealer={dealer}
              onViewDetails={(d) => {
                toast.info('Detalhes do dealer', {
                  description: `Abrindo detalhes de ${d.name}`,
                });
                // TODO: Abrir modal ou navegar para página de detalhes
              }}
              onGenerateProposal={(d) => {
                toast.info('Gerar proposta comercial', {
                  description: `Criando proposta para ${d.name}`,
                });
                // TODO: Abrir modal de geração de proposta (FASE 6)
              }}
            />
          ))}
        </div>
      )}

      {/* INFO FOOTER */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Como funciona:</strong> Buscamos apenas empresas B2B (distribuidores, wholesalers, importadores)
              que têm estrutura para comprar em lotes grandes (MOQ 50-100+ units).
            </p>
            <p>
              <strong>Exclusões automáticas:</strong> Studios individuais, gyms pequenos e personal trainers
              são automaticamente excluídos da busca (foco B2B).
            </p>
            <p>
              <strong>Decisores:</strong> Para cada dealer, identificamos Procurement Managers, Purchasing Directors
              e Buyers responsáveis por importações.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

