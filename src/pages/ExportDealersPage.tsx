import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { DealerDiscoveryForm, type DealerSearchParams } from '@/components/export/DealerDiscoveryForm';
import { DealerCard, DealersEmptyState, type Dealer } from '@/components/export/DealerCard';
import { DealersTable } from '@/components/export/DealersTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Building2,
  Sparkles,
  Save,
  Loader2,
  ArrowRight,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { saveDealersToCompanies } from '@/services/dealerToCompanyFlow';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ExportDealersPage() {
  const navigate = useNavigate();
  const { currentWorkspace } = useTenant();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [searchParams, setSearchParams] = useState<DealerSearchParams | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Controle de cancelamento
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // PROTEÇÃO CONTRA PERDA DE DADOS
  useUnsavedChanges(hasUnsavedChanges, 
    '⚠️ ATENÇÃO!\n\n' +
    `Você tem ${dealers.length} DEALERS NÃO SALVOS.\n\n` +
    'Se sair agora vai PERDER:\n' +
    '• Resultados da busca Apollo\n' +
    '• Créditos Apollo gastos\n' +
    '• Tempo de pesquisa\n\n' +
    'Deseja realmente sair SEM SALVAR?'
  );

  // ============================================================================
  // SEARCH DEALERS (via Edge Function)
  // ============================================================================

  const searchMutation = useMutation({
    mutationFn: async (params: DealerSearchParams) => {
      console.log('[EXPORT] 🔍 Busca INTELIGENTE multi-source...', params);

      // Criar AbortController para cancelamento
      const controller = new AbortController();
      setAbortController(controller);
      setIsCancelling(false);

      // 1. IDENTIFICAR PRODUTO(S) pelos HS Codes (MÚLTIPLOS!)
      const { identifyProduct } = await import('@/services/hsCodeIntelligence');
      const hsCodes = Array.isArray(params.hsCodes) ? params.hsCodes : [params.hsCode].filter(Boolean);
      
      if (hsCodes.length === 0) {
        throw new Error('Adicione pelo menos 1 HS Code para buscar');
      }

      // Coletar keywords de TODOS os HS Codes
      const allHSKeywords: string[] = [];
      for (const code of hsCodes) {
        // ✅ VERIFICAR CANCELAMENTO
        if (controller.signal.aborted || isCancelling) {
          throw new Error("Busca cancelada pelo usuário");
        }
        const intelligence = identifyProduct(code);
        if (intelligence) {
          allHSKeywords.push(...intelligence.keywords);
          console.log(`[EXPORT] 🎯 HS ${code}: ${intelligence.description}`);
        }
      }

      // 2. COMBINAR KEYWORDS (HS Intelligence + Custom do usuário)
      const allKeywords = [
        ...new Set([...allHSKeywords, ...(params.keywords || [])]), // Remove duplicatas
      ];

      console.log(`[EXPORT] 🔑 Keywords finais (${allKeywords.length}):`, allKeywords.join(', '));

      // 3. BUSCAR EM TEMPO REAL (Apollo + Serper + LinkedIn)
      const allDealers: Dealer[] = [];
      
      for (const country of params.countries) {
        // ✅ VERIFICAR CANCELAMENTO
        if (controller.signal.aborted || isCancelling) {
          console.log('[EXPORT] ⛔ Busca cancelada pelo usuário');
          throw new Error("Busca cancelada pelo usuário");
        }

        const { data, error } = await supabase.functions.invoke('discover-dealers-realtime', {
          body: {
            hsCode: hsCodes[0], // Usar primeiro HS Code (depois iterar todos)
            country: country,
            keywords: allKeywords, // Combinado: HS + Custom
            minVolume: params.minVolume || null, // Volume mínimo (se fornecido)
          },
          signal: controller.signal, // ✅ Passar signal para cancelar requisição
        });

        // ✅ VERIFICAR CANCELAMENTO APÓS REQUISIÇÃO
        if (controller.signal.aborted || isCancelling) {
          console.log('[EXPORT] ⛔ Busca cancelada após requisição');
          throw new Error("Busca cancelada pelo usuário");
        }

        if (error) {
          // Se foi cancelado, não tratar como erro normal
          if (error.message?.includes('aborted') || controller.signal.aborted) {
            throw new Error("Busca cancelada pelo usuário");
          }
          console.error('[EXPORT] ❌ Erro em', country, error);
          continue;
        }

        if (data?.dealers) {
          console.log(`[EXPORT] ✅ ${country}: ${data.dealers.length} dealers (Fit > 0)`);
          
          // ✅ CONVERTER snake_case para camelCase (Edge Function → Frontend)
          const convertedDealers = data.dealers.map((d: any) => ({
            ...d,
            linkedinUrl: d.linkedin_url || d.linkedinUrl, // ← FIX: converter snake_case
            apolloId: d.apollo_id || d.apolloId,
            apollo_link: d.apollo_link,
            employeeCount: d.employee_count || d.employeeCount,
            fitScore: d.fitScore || 50,
            b2bType: d.b2bType || 'distributor',
            decision_makers: d.decision_makers || [],
          }));
          
          allDealers.push(...convertedDealers);
        }
      }

      console.log(`[EXPORT] ✅ Total: ${allDealers.length} dealers qualificados`);
      // ✅ LIMPAR CONTROLLER AO FINALIZAR
      setAbortController(null);
      setIsCancelling(false);
      return allDealers;
    },
    onSuccess: (data) => {
      setAbortController(null);
      setIsCancelling(false);
      setDealers(data || []);
      
      if (!data || data.length === 0) {
        toast.info('Nenhum dealer encontrado', {
          description: 'Tente ajustar os filtros de busca',
        });
        setHasUnsavedChanges(false);
      } else {
        // MARCAR COMO NÃO SALVO
        setHasUnsavedChanges(true);
        
        toast.success(`✅ ${data.length} dealer(s) B2B encontrado(s)!`, {
          description: '⚠️ IMPORTANTE: Clique em "SALVAR DEALERS" para não perder os resultados!',
          duration: 10000,
        });
      }
    },
    onError: (error: any) => {
      setAbortController(null);
      setIsCancelling(false);
      if (error?.message?.includes('cancelada')) {
        toast.warning("Busca cancelada", {
          description: "O processo foi interrompido. Nenhum crédito adicional será consumido.",
        });
      } else {
        console.error('[EXPORT] ❌ Erro na busca:', error);
        toast.error('Erro ao buscar dealers', {
          description: error.message || 'Verifique o console',
        });
      }
    },
  });

  // Função para cancelar busca
  const handleCancelSearch = () => {
    if (abortController) {
      abortController.abort();
      setIsCancelling(true);
      toast.warning("Cancelando busca...", {
        description: "Aguarde alguns segundos para a interrupção completa.",
      });
    }
  };

  const handleSearch = (params: DealerSearchParams) => {
    setSearchParams(params);
    searchMutation.mutate(params);
  };

  // ============================================================================
  // SALVAR DEALERS → COMPANIES → QUARENTENA
  // ============================================================================

  const handleSaveDealers = async () => {
    if (dealers.length === 0) {
      toast.error('Nenhum dealer para salvar');
      return;
    }

    setIsSaving(true);
    console.log('[EXPORT] 💾 Salvando dealers...', dealers);

    try {
      const result = await saveDealersToCompanies(dealers, currentWorkspace!);
      
      if (result.success) {
        toast.success(`✅ ${result.saved} dealer(s) salvos com sucesso!`, {
          description: `Redirecionando para Base de Empresas...`,
          duration: 3000,
        });
        
        // LIMPAR DEALERS E DESMARCAR UNSAVED
        setDealers([]);
        setHasUnsavedChanges(false);
        
        console.log('[EXPORT] ✅ Salvamento completo:', result);
        
        // ✅ REDIRECIONAR AUTOMATICAMENTE PARA BASE DE EMPRESAS
        setTimeout(() => {
          navigate('/companies', { 
            state: { 
              message: `${result.saved} dealer(s) importados com sucesso!`,
              highlight: 'dealer_discovery' 
            } 
          });
        }, 1500);
      } else {
        throw new Error(result.error || 'Erro desconhecido ao salvar');
      }
    } catch (error: any) {
      console.error('[EXPORT] ❌ Erro ao salvar dealers:', error);
      toast.error('Erro ao salvar dealers', {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
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
        onCancel={handleCancelSearch}
        isCancelling={isCancelling}
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
                Busca: {searchParams?.hsCodes?.length || 0} HS Code(s) em {searchParams?.countries?.length || 0} {searchParams?.countries?.length === 1 ? 'país' : 'países'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULTS TABLE */}
      {dealers.length === 0 && !searchMutation.isPending ? (
        <DealersEmptyState />
      ) : (
        <DealersTable dealers={dealers} />
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

      {/* FLOATING SAVE BUTTON */}
      {hasUnsavedChanges && dealers.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
          <Button
            size="lg"
            onClick={handleSaveDealers}
            disabled={isSaving}
            className="shadow-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                Salvando {dealers.length} dealer(s)...
              </>
            ) : (
              <>
                <Save className="h-6 w-6 mr-3" />
                💾 SALVAR {dealers.length} DEALER(S)
              </>
            )}
          </Button>
          <p className="text-xs text-center mt-2 text-muted-foreground bg-background/90 px-3 py-1 rounded">
            ⚠️ Não saia sem salvar!
          </p>
        </div>
      )}
    </div>
  );
}

