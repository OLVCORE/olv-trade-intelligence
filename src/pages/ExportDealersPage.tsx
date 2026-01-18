import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { COUNTRIES } from '@/data/countries';
import { normalizeCountries, getAllSearchVariations, denormalizeCountryName, type CountryNormalization } from '@/services/countryNormalizer';
import { normalizeKeywords, normalizeUsageContext, type UsageContext, expandKeywordsByLanguage, uniqueNonEmpty } from '@/services/languageNormalizer';
import { validateUsageContext, calculateUsageContextScore } from '@/services/usageContextClassifier';
import { generateSearchPlan, type SearchPlan } from '@/services/aiSearchPlanner';
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
  X,
  Bookmark,
  Search as SearchIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { saveDealersToCompanies } from '@/services/dealerToCompanyFlow';
import { SaveSearchModal } from '@/components/export/SaveSearchModal';
import { LoadSavedSearchModal } from '@/components/export/LoadSavedSearchModal';
import { saveDealerSearch } from '@/services/savedDealerSearchesService';
import { useTenant } from '@/contexts/TenantContext';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ExportDealersPage() {
  const navigate = useNavigate();
  const { currentWorkspace, currentTenant } = useTenant();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [searchParams, setSearchParams] = useState<DealerSearchParams | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingDealerId, setSavingDealerId] = useState<string | null>(null);
  // Controle de cancelamento
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  // ✅ Modais de salvamento/carregamento de buscas
  const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false);
  const [loadSearchModalOpen, setLoadSearchModalOpen] = useState(false);
  // ✅ ETAPA 7: Preview do plano IA (opcional)
  const [searchPlan, setSearchPlan] = useState<SearchPlan | null>(null);
  // ✅ ETAPA 2: Métricas visíveis
  const [searchStats, setSearchStats] = useState<{
    rawCandidatesCount?: number;
    candidatesAfterSearchPlan?: number;
    candidatesAfterStrictFilter?: number;
    noiseAvoidedScore?: number;
    searchPlanApplied?: boolean;
  } | null>(null);
  
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

      // ✅ UNIVERSALIZAR PAÍSES (TRADUÇÃO SIMULTÂNEA) - ANTES DAS BUSCAS
      // 1. Converter códigos ISO para nomes completos
      const countryNames = params.countries.map(code => {
        const countryData = COUNTRIES.find(c => c.code === code);
        return countryData?.name || countryData?.nameEn || code;
      });
      
      // 2. Normalizar cada país (inglês + nativo + variações)
      const normalizedCountries = normalizeCountries(countryNames);
      console.log(`[EXPORT] 🌍 Países normalizados:`, normalizedCountries.map(n => `${n.canonicalPt || n.displayName} → [${n.searchVariations.join(', ')}]`).join(' | '));
      
      // 3. Extrair todas as variações de busca (inglês + nativo) - SEM DUPLICATAS, SEM VAZIOS
      const allCountryVariations = getAllSearchVariations(normalizedCountries);
      console.log(`[EXPORT] 🌐 Variações de busca (${allCountryVariations.length}):`, allCountryVariations.join(', '));
      
      // ✅ NORMALIZAR KEYWORDS (remover acentos, lower, remover vazios)
      const requiredKeywords = allKeywords
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .map(k => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      
      console.log(`[EXPORT] 📋 Keywords normalizadas (${requiredKeywords.length}):`, requiredKeywords.join(', '));
      
      // ✅ NOVO: NORMALIZAR CONTEXTO DE USO FINAL (CAMADA CRÍTICA)
      let normalizedUsageContext: UsageContext | undefined;
      if (params.usageContext && params.usageContext.include.length > 0) {
        // Determinar idiomas dos países selecionados
        const targetLanguages: ('pt' | 'en' | 'native')[] = ['pt', 'en'];
        normalizedUsageContext = normalizeUsageContext(params.usageContext, targetLanguages);
        console.log(`[EXPORT] 🎯 Contexto de uso final normalizado:`);
        console.log(`  INCLUIR (${normalizedUsageContext.include.length}):`, normalizedUsageContext.include.join(', '));
        console.log(`  EXCLUIR (${normalizedUsageContext.exclude.length}):`, normalizedUsageContext.exclude.join(', '));
      } else {
        console.error(`[EXPORT] 🚫 ERRO CRÍTICO: Contexto de uso final não fornecido! A busca não será executada.`);
        throw new Error('Contexto de uso final é obrigatório. Defina pelo menos 1 termo que descreve PARA QUE o produto será usado.');
      }

      // ✅ ETAPA 2: IA SEARCH PLANNER (GPT-4o-mini) - ANTES DA BUSCA
      let currentSearchPlan: SearchPlan | null = null;
      if (requiredKeywords.length > 0 || hsCodes.length > 0) {
        try {
          currentSearchPlan = await generateSearchPlan({
            hsCodes: hsCodes,
            productKeywords: requiredKeywords,
            usageContext: normalizedUsageContext,
            countries: countryNames, // Nomes completos para IA
            language: 'pt', // Idioma da interface
          });
          console.log('[EXPORT] 🧠 Plano de Busca IA gerado:', currentSearchPlan);
          // ✅ Armazenar plano para exibir no formulário
          setSearchPlan(currentSearchPlan);
        } catch (aiError: any) {
          console.warn('[EXPORT] ⚠️ Erro ao gerar plano de busca IA:', aiError.message);
          toast.warning('Não foi possível gerar o plano de busca IA. Continuando sem ele.', {
            description: aiError.message,
          });
          setSearchPlan(null);
        }
      }

      // Combinar keywords e uso final com o plano da IA
      const finalRequiredKeywords = uniqueNonEmpty([
        ...requiredKeywords,
        ...(currentSearchPlan?.mustIncludePhrases || []),
      ]);
      const finalUsageInclude = uniqueNonEmpty([
        ...(normalizedUsageContext?.include || []),
        ...(currentSearchPlan?.mustIncludePhrases || []),
      ]);
      const finalUsageExclude = uniqueNonEmpty([
        ...(normalizedUsageContext?.exclude || []),
        ...(currentSearchPlan?.mustExcludeTerms || []),
      ]);

      // 4. BUSCAR EM TEMPO REAL (Apollo + Serper + LinkedIn) - MÚLTIPLAS VARIAÇÕES
      const allDealers: Dealer[] = [];
      
      // ✅ BUSCAR COM TODAS AS VARIAÇÕES (inglês + nativo) para cada país
      for (const normalizedCountry of normalizedCountries) {
        // Buscar com cada variação do país (inglês + nativo)
        for (const countryVariation of normalizedCountry.searchVariations) {
          // ✅ VERIFICAR CANCELAMENTO
          if (controller.signal.aborted || isCancelling) {
            console.log('[EXPORT] ⛔ Busca cancelada pelo usuário');
            throw new Error("Busca cancelada pelo usuário");
          }

          console.log(`[EXPORT] 🔍 Buscando "${normalizedCountry.displayName}" usando variação: "${countryVariation}"`);

          const { data, error } = await supabase.functions.invoke('discover-dealers-realtime', {
            body: {
              hsCode: hsCodes[0] || null, // Usar primeiro HS Code (depois iterar todos)
              country: countryVariation, // ✅ USAR VARIAÇÃO (inglês ou nativo)
              keywords: allKeywords, // Combinado: HS + Custom - ✅ OBRIGATÓRIO para validação
              requiredKeywords: finalRequiredKeywords, // ✅ Keywords normalizadas + plano IA (se disponível)
              allowedCountryVariations: allCountryVariations, // ✅ Todas as variações válidas para validação cruzada
              // ✅ NOVO: Contexto de uso final normalizado + plano IA (CAMADA CRÍTICA)
              usageContext: {
                include: finalUsageInclude,
                exclude: finalUsageExclude,
              }, // ✅ OBRIGATÓRIO - busca não será executada sem isso
              // ✅ OBRIGATÓRIO: Plano IA (para refinar queries Apollo/Serper)
              searchPlan: currentSearchPlan ? {
                mustIncludePhrases: currentSearchPlan.mustIncludePhrases,
                mustExcludeTerms: currentSearchPlan.mustExcludeTerms,
                countryLanguageStrategy: currentSearchPlan.countryLanguageStrategy,
                notes: currentSearchPlan.notes,
              } : null,
              minVolume: params.minVolume || null, // Volume mínimo (se fornecido)
              includeTypes: ['distributor', 'wholesaler', 'dealer', 'importer', 'trading company', 'supplier', 'reseller', 'agent'], // ✅ TIPOS B2B OBRIGATÓRIOS
              excludeTypes: ['fitness studio', 'gym / fitness center', 'wellness center', 'personal training', 'yoga studio', 'spa', 'rehabilitation center', 'physiotherapy'], // ✅ TIPOS B2C BLOQUEADOS
              includeRoles: ['procurement manager', 'purchasing director', 'import manager', 'buyer'], // ✅ DECISORES ALVO
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
            console.error(`[EXPORT] ❌ Erro em ${normalizedCountry.displayName} (${countryVariation}):`, error);
            continue; // Continuar com próxima variação
          }

          if (data?.dealers) {
            console.log(`[EXPORT] ✅ ${normalizedCountry.displayName} (${countryVariation}): ${data.dealers.length} dealers (Fit > 0)`);
            
            // ✅ ETAPA 2: Armazenar estatísticas visíveis
            if (data.stats) {
              setSearchStats({
                rawCandidatesCount: data.stats.rawCandidatesCount || data.stats.total_bruto,
                candidatesAfterSearchPlan: data.stats.candidatesAfterSearchPlan || data.stats.total_apos_searchplan,
                candidatesAfterStrictFilter: data.stats.candidatesAfterStrictFilter || data.stats.total_apos_strict,
                noiseAvoidedScore: data.stats.noiseAvoidedScore,
                searchPlanApplied: data.stats.searchPlanApplied || false,
              });
            }
            
              // ✅ CONVERTER snake_case para camelCase (Edge Function → Frontend)
              const convertedDealers = data.dealers.map((d: any) => {
                // ✅ NORMALIZAR país do resultado de volta para português/nome canônico
                let normalizedResultCountry = normalizedCountry.canonicalPt || normalizedCountry.displayName; // Usar nome canônico PT
                
                // Se o resultado tiver país, tentar denormalizar para PT
                if (d.country) {
                  normalizedResultCountry = denormalizeCountryName(d.country) || normalizedCountry.canonicalPt || normalizedCountry.displayName;
                }
                
                return {
                  ...d,
                  linkedinUrl: d.linkedin_url || d.linkedinUrl, // ← FIX: converter snake_case
                  apolloId: d.apollo_id || d.apolloId,
                  apollo_link: d.apollo_link,
                  employeeCount: d.employee_count || d.employeeCount,
                  fitScore: d.fitScore || 50,
                  b2bType: d.b2bType || 'distributor',
                  decision_makers: d.decision_makers || [],
                  // ✅ CRÍTICO: Usar nome canônico em português para exibição (não variação)
                  country: normalizedResultCountry,
                };
              });
            
            allDealers.push(...convertedDealers);
          }
        }
      }

      console.log(`[EXPORT] ✅ Total bruto: ${allDealers.length} dealers`);
      
      // ✅ CRÍTICO: FILTRAR APENAS PAÍSES SELECIONADOS (Apollo pode retornar países errados)
      const selectedCountryNames = params.countries.map(c => {
        // Converter código para nome (ex: AR -> Argentina)
        const countryData = COUNTRIES.find(cnt => cnt.code === c);
        return countryData?.nameEn || countryData?.name || c;
      });
      
      const filteredDealers = allDealers.filter((dealer: any) => {
        const dealerCountry = dealer.country || '';
        // Verificar se o país do dealer está na lista de países selecionados
        const isInSelected = selectedCountryNames.some(selected => 
          dealerCountry.toLowerCase().includes(selected.toLowerCase()) ||
          selected.toLowerCase().includes(dealerCountry.toLowerCase()) ||
          params.countries.some(code => {
            const countryData = COUNTRIES.find(cnt => cnt.code === code);
            return countryData?.nameEn?.toLowerCase() === dealerCountry.toLowerCase() ||
                   countryData?.name?.toLowerCase() === dealerCountry.toLowerCase();
          })
        );
        
        if (!isInSelected) {
          console.warn(`[EXPORT] ⚠️ Dealer "${dealer.name}" com país "${dealerCountry}" fora da seleção - REMOVIDO`);
        }
        
        return isInSelected;
      });
      
      console.log(`[EXPORT] ✅ Total filtrado: ${filteredDealers.length} dealers (apenas países selecionados)`);
      
      // ✅ LIMPAR CONTROLLER AO FINALIZAR
      setAbortController(null);
      setIsCancelling(false);
      return filteredDealers;
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

  // ✅ Salvar busca
  const handleSaveSearch = async (name: string) => {
    if (!searchParams || !currentTenant) {
      throw new Error('Parâmetros de busca ou tenant não disponíveis');
    }

    await saveDealerSearch(
      currentTenant.id,
      currentWorkspace?.id || null,
      {
        name,
        search_params: searchParams,
        results_count: dealers.length,
      }
    );

    toast.success(`Busca "${name}" salva com sucesso!`, {
      description: 'Você pode carregá-la depois para reexecutar',
    });
  };

  // ✅ Carregar busca salva
  const handleLoadSavedSearch = (params: DealerSearchParams) => {
    setSearchParams(params);
    // Preencher formulário e executar busca
    searchMutation.mutate(params);
  };

  // ============================================================================
  // SALVAR DEALERS → COMPANIES → QUARENTENA
  // ============================================================================

  // ✅ ETAPA 3: Salvar dealer individual
  const handleSaveIndividualDealer = async (dealer: Dealer) => {
    const dealerId = (dealer as any).id || dealer.name;
    setSavingDealerId(dealerId);
    
    try {
      console.log('[EXPORT] 💾 Salvando dealer individual:', dealer);
      const result = await saveDealersToCompanies([dealer], currentWorkspace!);
      
      if (result.success) {
        toast.success(`✅ ${dealer.name} salva com sucesso!`, {
          description: 'Empresa adicionada à Base de Empresas',
          duration: 3000,
        });
        
        // Remover dealer da lista (opcional - pode manter se preferir)
        // setDealers(dealers.filter(d => (d as any).id !== dealerId && d.name !== dealer.name));
        
      } else {
        throw new Error(result.error || 'Erro desconhecido ao salvar');
      }
    } catch (error: any) {
      console.error('[EXPORT] ❌ Erro ao salvar dealer individual:', error);
      toast.error('Erro ao salvar empresa', {
        description: error.message,
      });
    } finally {
      setSavingDealerId(null);
    }
  };

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

        <div className="flex items-center gap-2">
          {/* ✅ Botão Carregar Busca Salva */}
          <Button
            variant="outline"
            onClick={() => setLoadSearchModalOpen(true)}
            className="flex items-center gap-2"
          >
            <SearchIcon className="h-4 w-4" />
            Buscar Buscas Salvas
          </Button>

          {/* ✅ Botão Salvar Busca (aparece apenas quando há resultados) */}
          {dealers.length > 0 && searchParams && (
            <Button
              variant="outline"
              onClick={() => setSaveSearchModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Bookmark className="h-4 w-4" />
              Salvar Busca
            </Button>
          )}

          {/* WORKSPACE BADGE */}
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <Globe className="h-3 w-3 mr-1" />
            Export Workspace
          </Badge>
        </div>
      </div>

      {/* SEARCH FORM */}
      <DealerDiscoveryForm
        onSearch={handleSearch}
        isSearching={searchMutation.isPending}
        onCancel={handleCancelSearch}
        isCancelling={isCancelling}
        searchPlan={searchPlan}
      />

      {/* RESULTS STATS */}
      {dealers.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border-2">
          <CardContent className="p-4 space-y-4">
            {/* ✅ ETAPA 2: Métricas principais */}
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
                    {dealers.filter((d) => (d.fitScore || 0) >= 60).length}
                  </span>
                  <span className="text-sm text-muted-foreground">fit alto (60+)</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Busca: {searchParams?.hsCodes?.length || 0} HS Code(s) em {searchParams?.countries?.length || 0} {searchParams?.countries?.length === 1 ? 'país' : 'países'}
              </div>
            </div>

            {/* ✅ ETAPA 2: Métricas de refino IA (discretas) */}
            {searchStats && searchStats.rawCandidatesCount && searchStats.rawCandidatesCount > 0 && (
              <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Resultados brutos:</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">{searchStats.rawCandidatesCount}</span>
                  </div>
                  {searchStats.searchPlanApplied && searchStats.candidatesAfterSearchPlan && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-600" />
                      <span>Após refino IA:</span>
                      <span className="font-semibold text-purple-700 dark:text-purple-400">{searchStats.candidatesAfterSearchPlan}</span>
                    </div>
                  )}
                  {searchStats.candidatesAfterStrictFilter && (
                    <div className="flex items-center gap-1">
                      <span>Após filtro estrito:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">{searchStats.candidatesAfterStrictFilter}</span>
                    </div>
                  )}
                  {searchStats.noiseAvoidedScore !== undefined && searchStats.noiseAvoidedScore > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Badge variant="outline" className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                        <span>Ruído evitado:</span>
                        <span className="font-semibold ml-1">{searchStats.noiseAvoidedScore}%</span>
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* RESULTS TABLE */}
      {dealers.length === 0 && !searchMutation.isPending ? (
        <DealersEmptyState />
      ) : (
        <DealersTable 
          dealers={dealers}
          onSaveIndividual={handleSaveIndividualDealer}
          savingDealerId={savingDealerId}
        />
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

      {/* ✅ Modal Salvar Busca */}
      {searchParams && (
        <SaveSearchModal
          open={saveSearchModalOpen}
          onOpenChange={setSaveSearchModalOpen}
          searchParams={searchParams}
          resultsCount={dealers.length}
          onSave={handleSaveSearch}
        />
      )}

      {/* ✅ Modal Carregar Busca Salva */}
      {currentTenant && (
        <LoadSavedSearchModal
          open={loadSearchModalOpen}
          onOpenChange={setLoadSearchModalOpen}
          tenantId={currentTenant.id}
          workspaceId={currentWorkspace?.id || null}
          onLoad={handleLoadSavedSearch}
        />
      )}
    </div>
  );
}

