import { useState, useEffect } from 'react';
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
  Search as SearchIcon,
  Brain,
  ShieldX,
  Target,
  Database,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { saveDealersToCompanies } from '@/services/dealerToCompanyFlow';
import { SaveSearchModal } from '@/components/export/SaveSearchModal';
import { LoadSavedSearchModal } from '@/components/export/LoadSavedSearchModal';
import { saveDealerSearch } from '@/services/savedDealerSearchesService';

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
  const [savedCompanyIds, setSavedCompanyIds] = useState<Set<string>>(new Set()); // ✅ IDs das empresas já salvas
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
  
  // ✅ REMOVIDO: Não restaurar automaticamente do localStorage
  // Os resultados só aparecem quando o usuário executa uma busca ou carrega uma busca salva

  // ✅ Salvar automaticamente no localStorage sempre que dealers mudar (apenas como backup)
  useEffect(() => {
    if (dealers.length > 0) {
      try {
        const backupData = {
          dealers,
          searchParams,
          timestamp: new Date().toISOString(),
          totalResults: dealers.length,
        };
        localStorage.setItem('export_dealers_backup', JSON.stringify(backupData));
        console.log('[EXPORT] 💾 Backup automático salvo no localStorage.');
      } catch (error) {
        console.error('[EXPORT] ❌ Erro ao salvar backup automático:', error);
      }
    }
  }, [dealers, searchParams]);

  // ✅ Função para limpar tudo e iniciar nova busca
  const handleNewSearch = () => {
    setDealers([]);
    setSearchParams(null);
    setSearchPlan(null);
    setSearchStats(null);
    setHasUnsavedChanges(false);
    setSavedCompanyIds(new Set());
    // Limpar backup do localStorage também
    localStorage.removeItem('export_dealers_backup');
    toast.info('✅ Campos limpos. Você pode iniciar uma nova busca.', {
      duration: 3000,
    });
  };

  // PROTEÇÃO CONTRA PERDA DE DADOS
  useUnsavedChanges(hasUnsavedChanges, 
    '⚠️ ATENÇÃO!\n\n' +
    `Você tem ${dealers.length} DEALERS NÃO SALVOS.\n\n` +
    'Se sair agora vai PERDER:\n' +
    '• Resultados da busca Apollo\n' +
    '• Créditos Apollo gastos\n' +
    '• Tempo de pesquisa\n\n' +
    '⚠️ NOTA: Os dados foram salvos localmente, mas ainda não no banco.\n\n' +
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
      
      // ✅ CRÍTICO: Salvar automaticamente no localStorage para evitar perda de dados
      try {
        const backupData = {
          dealers: data,
          searchParams: searchMutation.variables || null,
          timestamp: new Date().toISOString(),
          totalResults: data.length,
        };
        localStorage.setItem('export_dealers_backup', JSON.stringify(backupData));
        console.log('[EXPORT] 💾 Backup automático salvo no localStorage:', data.length, 'dealers');
      } catch (error) {
        console.error('[EXPORT] ❌ Erro ao salvar backup:', error);
      }
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

  // ✅ Salvar busca (com fallback para localStorage se banco falhar)
  const handleSaveSearch = async (name: string) => {
    if (!searchParams || !currentTenant) {
      toast.error('Erro ao salvar busca', {
        description: 'Parâmetros de busca ou tenant não disponíveis',
      });
      throw new Error('Parâmetros de busca ou tenant não disponíveis');
    }

    // ✅ FALLBACK: Salvar no localStorage imediatamente (não depende do banco)
    try {
      const savedSearches = JSON.parse(localStorage.getItem('export_saved_searches') || '[]');
      const newSearch = {
        id: `local_${Date.now()}`,
        name: name.trim(),
        search_params: searchParams,
        results_count: dealers.length,
        saved_at: new Date().toISOString(),
        is_local: true,
      };
      savedSearches.unshift(newSearch);
      // Manter apenas as últimas 50 buscas
      const limited = savedSearches.slice(0, 50);
      localStorage.setItem('export_saved_searches', JSON.stringify(limited));
      console.log('[EXPORT] 💾 Busca salva localmente:', name);
    } catch (error) {
      console.error('[EXPORT] ❌ Erro ao salvar busca localmente:', error);
    }

    // ✅ Tentar salvar no banco (mas não bloquear se falhar)
    try {
      // ✅ Salvar busca COM OS RESULTADOS (dealers encontrados)
      const saved = await saveDealerSearch(
        currentTenant.id,
        currentWorkspace?.id || null,
        {
          name: name.trim(),
          search_params: searchParams,
          results_count: dealers.length,
          search_results: dealers, // ✅ CRÍTICO: Salvar os dealers encontrados (resultados da busca)
        }
      );

      // ✅ Salvar o ID da busca salva para associar aos dealers
      setLastSavedSearchId(saved.id);
      setCurrentSavedSearchId(saved.id);

      toast.success(`Busca "${name}" salva com sucesso!`, {
        description: `Você pode carregá-la depois para ver os resultados salvos (${dealers.length} resultados)`,
      });
    } catch (error: any) {
      console.error('[EXPORT] ⚠️ Erro ao salvar busca no banco (usando backup local):', error);
      
      // ✅ Se falhar no banco, avisar mas confirmar que salvou localmente
      toast.warning('Busca salva localmente', {
        description: `A busca foi salva no navegador. O banco de dados ainda não está disponível, mas seus dados estão seguros.`,
        duration: 8000,
      });
    }
    
    // ✅ Fechar modal após salvar (mesmo se banco falhou)
    setSaveSearchModalOpen(false);
  };

  // ✅ Carregar busca salva - Preencher formulário E carregar dealers salvos
  const [initialSearchParams, setInitialSearchParams] = useState<DealerSearchParams | null>(null);
  const [currentSavedSearchId, setCurrentSavedSearchId] = useState<string | null>(null);
  const [lastSavedSearchId, setLastSavedSearchId] = useState<string | null>(null);
  
  // ✅ Função para carregar dealers salvos do banco de dados
  const loadSavedDealersFromDatabase = async (searchId: string, searchParams: DealerSearchParams) => {
    try {
      console.log('[EXPORT] 🔍 Buscando dealers salvos no banco para busca salva:', searchId);
      
      // Buscar empresas salvas que correspondem aos parâmetros da busca
      const countries = searchParams.countries || [];
      
      // ✅ ESTRATÉGIA 1: Buscar por saved_search_id no raw_data (mais preciso)
      let query = supabase
        .from('companies')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('data_source', 'dealer_discovery')
        .eq('raw_data->>saved_search_id', searchId);
      
      // Filtrar por países se especificado
      if (countries.length > 0) {
        query = query.in('country', countries);
      }
      
      // Filtrar por workspace se especificado
      if (currentWorkspace?.id) {
        query = query.or(`workspace_id.is.null,workspace_id.eq.${currentWorkspace.id}`);
      }
      
      // Ordenar por data de criação (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });
      
      let { data: companies, error } = await query;
      
      // ✅ ESTRATÉGIA 2: Se não encontrou por saved_search_id, buscar por países e data próxima (fallback)
      if ((!companies || companies.length === 0) && countries.length > 0) {
        console.log('[EXPORT] ⚠️ Nenhum dealer encontrado por saved_search_id, tentando buscar por países e data próxima...');
        
        // Buscar a data da busca salva para filtrar por período
        const { data: savedSearchData } = await (supabase as any)
          .from('saved_dealer_searches')
          .select('created_at')
          .eq('id', searchId)
          .single();
        
        if (savedSearchData?.created_at) {
          const searchDate = new Date(savedSearchData.created_at);
          const dateFrom = new Date(searchDate);
          dateFrom.setDate(dateFrom.getDate() - 7); // 7 dias antes
          const dateTo = new Date(searchDate);
          dateTo.setDate(dateTo.getDate() + 1); // 1 dia depois
          
          query = supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('data_source', 'dealer_discovery')
            .in('country', countries)
            .gte('created_at', dateFrom.toISOString())
            .lte('created_at', dateTo.toISOString());
          
          if (currentWorkspace?.id) {
            query = query.or(`workspace_id.is.null,workspace_id.eq.${currentWorkspace.id}`);
          }
          
          query = query.order('created_at', { ascending: false }).limit(300); // Limitar a 300
          
          const result = await query;
          companies = result.data;
          error = result.error;
          
          if (companies && companies.length > 0) {
            console.log(`[EXPORT] ✅ ${companies.length} dealers encontrados via fallback (por países e data próxima)`);
          }
        }
      }
      
      // ✅ ESTRATÉGIA 3: Se ainda não encontrou, buscar apenas por países (último recurso)
      if ((!companies || companies.length === 0) && countries.length > 0) {
        console.log('[EXPORT] ⚠️ Tentando buscar apenas por países (último recurso)...');
        
        query = supabase
          .from('companies')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .eq('data_source', 'dealer_discovery')
          .in('country', countries);
        
        if (currentWorkspace?.id) {
          query = query.or(`workspace_id.is.null,workspace_id.eq.${currentWorkspace.id}`);
        }
        
        query = query.order('created_at', { ascending: false }).limit(200);
        
        const result = await query;
        companies = result.data;
        error = result.error;
        
        if (companies && companies.length > 0) {
          console.log(`[EXPORT] ✅ ${companies.length} dealers encontrados por países`);
        }
      }
      
      if (error) {
        console.error('[EXPORT] ❌ Erro ao buscar dealers salvos:', error);
        toast.error('Erro ao buscar dealers salvos', {
          description: error.message,
        });
        return;
      }
      
      if (!companies || companies.length === 0) {
        console.log('[EXPORT] ℹ️ Nenhum dealer salvo encontrado para esta busca');
        toast.info('ℹ️ Nenhum resultado salvo encontrado para esta busca. Execute uma nova busca para ver resultados.', {
          duration: 5000,
        });
        return;
      }
      
      console.log(`[EXPORT] ✅ ${companies.length} dealers salvos encontrados no banco`);
      
      // ✅ Converter companies para formato Dealer
      const dealersFromDB: Dealer[] = companies.map((company: any) => {
        const rawData = company.raw_data || {};
        const b2bType = company.b2b_type || rawData.b2b_type || 'distributor';
        return {
          id: company.id,
          name: company.company_name || '',
          country: company.country || rawData.country || '',
          city: company.city || rawData.city || '',
          state: company.state || rawData.state || undefined,
          industry: company.industry || '',
          employee_count: company.employee_count || company.employees_count || undefined,
          revenue_range: rawData.revenue || undefined,
          website: company.website || undefined,
          linkedin_url: company.linkedin_url || rawData.linkedin_url || undefined,
          description: company.description || rawData.description || undefined,
          // B2B Indicators (baseado em b2bType)
          is_distributor: b2bType.toLowerCase().includes('distributor'),
          is_wholesaler: b2bType.toLowerCase().includes('wholesaler'),
          is_importer: b2bType.toLowerCase().includes('importer'),
          // Decision Makers
          decision_makers: rawData.decision_makers || [],
          // Scores
          export_fit_score: rawData.fit_score || 50,
          // Apollo data
          apollo_organization_id: company.apollo_id || rawData.apollo_id || undefined,
        } as Dealer;
      });
      
      // ✅ Exibir dealers salvos na tabela
      setDealers(dealersFromDB);
      setHasUnsavedChanges(false);
      
      toast.success(`✅ ${dealersFromDB.length} dealer(s) salvos carregados do banco de dados!`, {
        duration: 5000,
      });
    } catch (error: any) {
      console.error('[EXPORT] ❌ Erro ao carregar dealers salvos:', error);
      toast.error('Erro ao carregar dealers salvos', {
        description: error.message,
      });
    }
  };
  
  const handleLoadSavedSearch = async (params: DealerSearchParams, searchId?: string, searchResults?: any[]) => {
    console.log('[EXPORT] 📂 handleLoadSavedSearch CHAMADO:', { 
      params, 
      searchId, 
      resultsCount: searchResults?.length,
      hasSearchResults: !!searchResults,
      isArray: Array.isArray(searchResults),
    });
    
    // ✅ Preencher o formulário
    setInitialSearchParams(params);
    setSearchParams(params);
    setCurrentSavedSearchId(searchId || null);
    
    // Fechar modal
    setLoadSearchModalOpen(false);
    
    // ✅ CRÍTICO: Se há searchResults (dealers salvos), exibir diretamente na tabela
    if (searchResults && searchResults.length > 0) {
      console.log(`[EXPORT] ✅ Carregando ${searchResults.length} dealers salvos diretamente do search_results`);
      
      // Converter para formato Dealer se necessário
      const dealersToDisplay: Dealer[] = searchResults.map((dealer: any) => {
        // Se já está no formato Dealer completo, usar diretamente
        if (dealer.name && dealer.country && dealer.city !== undefined) {
          // Garantir que tem os campos obrigatórios do Dealer
          return {
            ...dealer,
            id: dealer.id || `dealer_${Date.now()}_${Math.random()}`,
            city: dealer.city || '',
            industry: dealer.industry || '',
            is_distributor: dealer.is_distributor || dealer.b2bType?.toLowerCase().includes('distributor') || false,
            is_wholesaler: dealer.is_wholesaler || dealer.b2bType?.toLowerCase().includes('wholesaler') || false,
            is_importer: dealer.is_importer || dealer.b2bType?.toLowerCase().includes('importer') || false,
            export_fit_score: dealer.export_fit_score || dealer.fitScore || 50,
          } as Dealer;
        }
        // Se veio do banco (formato company), converter
        const rawData = dealer.raw_data || {};
        const b2bType = dealer.b2b_type || rawData.b2b_type || 'distributor';
        return {
          id: dealer.id || dealer.company_id || `dealer_${Date.now()}_${Math.random()}`,
          name: dealer.company_name || dealer.name || '',
          country: dealer.country || rawData.country || '',
          city: dealer.city || rawData.city || '',
          state: dealer.state || rawData.state || undefined,
          industry: dealer.industry || '',
          employee_count: dealer.employee_count || dealer.employees_count || undefined,
          revenue_range: rawData.revenue || undefined,
          website: dealer.website || undefined,
          linkedin_url: dealer.linkedin_url || rawData.linkedin_url || undefined,
          description: dealer.description || rawData.description || undefined,
          // B2B Indicators
          is_distributor: b2bType.toLowerCase().includes('distributor'),
          is_wholesaler: b2bType.toLowerCase().includes('wholesaler'),
          is_importer: b2bType.toLowerCase().includes('importer'),
          // Decision Makers
          decision_makers: rawData.decision_makers || dealer.decision_makers || [],
          // Scores
          export_fit_score: rawData.fit_score || dealer.fitScore || 50,
          // Apollo data
          apollo_organization_id: dealer.apollo_id || rawData.apollo_id || undefined,
        } as Dealer;
      });
      
      // ✅ Exibir dealers salvos na tabela
      setDealers(dealersToDisplay);
      setHasUnsavedChanges(false);
      
      toast.success(`✅ ${dealersToDisplay.length} dealer(s) carregados da busca salva!`, {
        description: 'Resultados da busca anterior exibidos na tabela',
        duration: 5000,
      });
    } else if (searchId) {
      // ✅ Fallback: Se não há searchResults mas há searchId, tentar buscar do banco
      await loadSavedDealersFromDatabase(searchId, params);
    } else {
      toast.success('✅ Parâmetros da busca carregados! Clique em "Buscar Dealers" para executar.', {
        duration: 4000,
      });
    }
  };

  // ============================================================================
  // SALVAR DEALERS → COMPANIES → QUARENTENA
  // ============================================================================

  // ✅ ETAPA 3: Salvar dealer individual
  // ✅ MICROCICLO 2: Atualizar status imediatamente após salvamento
  const handleSaveIndividualDealer = async (dealer: Dealer) => {
    const dealerId = (dealer as any).id || dealer.name;
    setSavingDealerId(dealerId);
    
    try {
      console.log('[EXPORT] 💾 Salvando dealer individual:', dealer);
      const result = await saveDealersToCompanies([dealer], currentWorkspace!, currentSavedSearchId);
      
      if (result.success) {
        toast.success(`✅ ${dealer.name} salva com sucesso!`, {
          description: 'Empresa adicionada à Base de Empresas',
          duration: 3000,
        });
        
        // ✅ MICROCICLO 2: Atualizar status imediatamente (sem recarregar página)
        // ✅ CRÍTICO: Aguardar checkSavedCompanies atualizar o estado ANTES de atualizar localmente
        await checkSavedCompanies([dealer]);
        
        // ✅ Aguardar um tick para garantir que checkSavedCompanies atualizou o estado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // ✅ Forçar atualização do estado local
        const finalDealerId = (dealer as any).id || dealer.name || `dealer-${dealer.website}`;
        setSavedCompanyIds(prev => {
          const newSet = new Set(prev);
          newSet.add(finalDealerId);
          console.log('[EXPORT] 🔄 Atualizando savedCompanyIds (individual):', { prevSize: prev.size, newSize: newSet.size, added: finalDealerId });
          return newSet;
        });
        
        console.log('[EXPORT] ✅ Status atualizado para dealer individual:', finalDealerId);
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

  // ✅ Salvar dealers selecionados em bulk
  const handleSaveSelectedDealers = async (selectedDealers: Dealer[]) => {
    if (selectedDealers.length === 0) {
      toast.error('Nenhum dealer selecionado');
      return;
    }

    setIsSaving(true);
    console.log('[EXPORT] 💾 Salvando dealers selecionados...', selectedDealers.length);

    try {
      // ✅ Passar savedSearchId para associar dealers à busca salva
      const savedSearchIdToUse = currentSavedSearchId || lastSavedSearchId;
      const result = await saveDealersToCompanies(selectedDealers, currentWorkspace!, savedSearchIdToUse);
      
      if (result.success) {
        toast.success(`✅ ${result.saved} dealer(s) selecionados salvos com sucesso!`, {
          description: 'Empresas adicionadas à Base de Empresas',
          duration: 3000,
        });
        
        // ✅ MICROCICLO 2: Atualizar status imediatamente após salvamento em massa
        // ✅ CRÍTICO: Aguardar checkSavedCompanies atualizar o estado ANTES de atualizar localmente
        await checkSavedCompanies(selectedDealers);
        
        // ✅ Aguardar um tick para garantir que checkSavedCompanies atualizou o estado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // ✅ Forçar atualização do estado local com dealerIds corretos
        const savedIds = new Set<string>();
        selectedDealers.forEach((dealer, idx) => {
          // ✅ Usar o MESMO formato de dealerId que é usado na tabela
          const dealerId = (dealer as any).id || dealer.name || `dealer-${idx}`;
          savedIds.add(dealerId);
        });
        
        setSavedCompanyIds(prev => {
          const newSet = new Set(prev);
          savedIds.forEach(id => newSet.add(id));
          console.log('[EXPORT] 🔄 Atualizando savedCompanyIds (massa):', { 
            prevSize: prev.size, 
            newSize: newSet.size, 
            added: Array.from(savedIds) 
          });
          return newSet;
        });
        
        setHasUnsavedChanges(false);
        console.log('[EXPORT] ✅ Salvamento de selecionados completo:', result);
        console.log('[EXPORT] ✅ Status atualizado para', savedIds.size, 'dealers selecionados');
      } else {
        throw new Error(result.error || 'Erro desconhecido ao salvar');
      }
    } catch (error: any) {
      console.error('[EXPORT] ❌ Erro ao salvar dealers selecionados:', error);
      toast.error('Erro ao salvar dealers selecionados', {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
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
      // ✅ Passar savedSearchId para associar dealers à busca salva
      const savedSearchIdToUse = currentSavedSearchId || lastSavedSearchId;
      console.log('[EXPORT] 📝 Associando dealers à busca salva:', savedSearchIdToUse);
      const result = await saveDealersToCompanies(dealers, currentWorkspace!, savedSearchIdToUse);
      
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

  // ✅ Verificar quais empresas já estão salvas no banco
  const checkSavedCompanies = async (dealersToCheck: Dealer[] = dealers) => {
    if (!currentTenant || dealersToCheck.length === 0) return;
    
    try {
      const websites = dealersToCheck.map(d => d.website).filter(Boolean) as string[];
      const names = dealersToCheck.map(d => d.name).filter(Boolean) as string[];
      const countries = dealersToCheck.map(d => d.country).filter(Boolean) as string[];
      
      const savedIds = new Set<string>();
      
      // ✅ CORRIGIDO: Mapear IDs do banco para dealerIds (usando website ou nome como chave)
      // Buscar por website
      if (websites.length > 0) {
        const { data: byWebsite } = await supabase
          .from('companies')
          .select('id, website, company_name, country')
          .eq('tenant_id', currentTenant.id)
          .in('website', websites);
        
        if (byWebsite) {
          // Mapear website → dealerId
          byWebsite.forEach(c => {
            // Encontrar o dealer correspondente pelo website
            const matchingDealer = dealersToCheck.find(d => {
              const dealerWebsite = (d.website || '').toLowerCase().trim().replace(/^https?:\/\//, '');
              const companyWebsite = (c.website || '').toLowerCase().trim().replace(/^https?:\/\//, '');
              return dealerWebsite === companyWebsite;
            });
            
            if (matchingDealer) {
              const dealerId = (matchingDealer as any).id || matchingDealer.name;
              savedIds.add(dealerId);
            }
          });
        }
      }
      
      // Buscar por nome + país
      for (let i = 0; i < names.length; i++) {
        if (!names[i] || !countries[i]) continue;
        
        const { data: byName } = await supabase
          .from('companies')
          .select('id, company_name, country')
          .eq('tenant_id', currentTenant.id)
          .eq('company_name', names[i])
          .eq('country', countries[i])
          .maybeSingle();
        
        if (byName) {
          // ✅ Mapear nome+país → dealerId
          const matchingDealer = dealersToCheck.find(d => 
            (d.name || '').trim() === names[i] && 
            (d.country || '').trim() === countries[i]
          );
          
          if (matchingDealer) {
            const dealerId = (matchingDealer as any).id || matchingDealer.name;
            savedIds.add(dealerId);
          }
        }
      }
      
      // ✅ CRÍTICO: Atualizar savedCompanyIds com os dealerIds mapeados corretamente
      setSavedCompanyIds(prev => {
        const newSet = new Set(prev);
        savedIds.forEach(dealerId => newSet.add(dealerId));
        console.log('[EXPORT] 🔄 checkSavedCompanies atualizou savedCompanyIds:', { 
          prevSize: prev.size, 
          newSize: newSet.size,
          added: Array.from(savedIds),
          dealersChecked: dealersToCheck.length 
        });
        return newSet;
      });
    } catch (error) {
      console.error('[EXPORT] ❌ Erro ao verificar empresas salvas:', error);
    }
  };

  // ✅ Verificar empresas salvas quando dealers mudam
  useEffect(() => {
    if (dealers.length > 0 && currentTenant) {
      checkSavedCompanies();
    }
  }, [dealers.length, currentTenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {/* ✅ Botão Nova Busca (visível quando há resultados) */}
          {dealers.length > 0 && (
            <Button
              variant="outline"
              onClick={handleNewSearch}
              className="flex items-center gap-2 border-2 border-primary/20 hover:border-primary/40"
            >
              <X className="h-4 w-4" />
              Nova Busca
            </Button>
          )}

          {/* ✅ Botão Buscar Pesquisas Salvas (EVIDENCIADO) */}
          <Button
            variant="default"
            onClick={() => setLoadSearchModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold px-6"
          >
            <SearchIcon className="h-4 w-4" />
            Buscar Pesquisas Salvas
          </Button>

          {/* ✅ Botão Salvar Busca (visível quando há resultados ou parâmetros de busca preenchidos) */}
          {(dealers.length > 0 || (searchParams && (searchParams.hsCodes?.length > 0 || searchParams.countries?.length > 0 || searchParams.keywords?.length > 0))) && (
            <Button
              variant={dealers.length > 0 ? "default" : "outline"}
              onClick={() => setSaveSearchModalOpen(true)}
              className={`flex items-center gap-2 ${dealers.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <Bookmark className="h-4 w-4" />
              {dealers.length > 0 ? `Salvar Busca (${dealers.length} resultados)` : 'Salvar Busca'}
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
        initialParams={initialSearchParams}
        onInitialParamsLoaded={() => setInitialSearchParams(null)}
      />

      {/* RESULTS STATS */}
      {dealers.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border-2">
          <CardContent className="p-4 space-y-4">
            {/* ✅ Botão Salvar Busca destacado nos resultados */}
            <div className="flex items-center justify-end pb-3 border-b border-blue-200 dark:border-blue-800">
              <Button
                variant="default"
                onClick={() => setSaveSearchModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                <Bookmark className="h-4 w-4" />
                Salvar Esta Busca ({dealers.length} resultados)
              </Button>
            </div>
            
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
                    {dealers.filter((d) => (d.export_fit_score || 0) >= 60).length}
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
          onSaveSelected={handleSaveSelectedDealers}
          savedCompanyIds={savedCompanyIds}
        />
      )}

      {/* INFO FOOTER - Descrição Atualizada */}
      <Card className="p-4 bg-muted/30 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-3">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p>
                <strong className="text-foreground">Sistema Inteligente de Busca B2B:</strong> Nossa plataforma utiliza IA (GPT-4o-mini) para gerar planos de busca restritivos ANTES da execução, reduzindo significativamente resultados irrelevantes. Filtros estritos garantem apenas empresas B2B com estrutura para compras em volume (MOQ 50-100+ unidades).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldX className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p>
                <strong className="text-foreground">Bloqueios Automáticos:</strong> Marketplaces (Alibaba, Falabella, Mercado Livre), e-commerce, diretórios de dados (ImportGenius, Panjiva, sitemaps), studios individuais, academias pequenas e personal trainers são automaticamente excluídos. Foco exclusivo em distribuidores, wholesalers, importadores e trading companies.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p>
                <strong className="text-foreground">Contexto de Uso Final (Obrigatório):</strong> A busca considera não apenas HS Codes e keywords, mas também o CONTEXTO DE USO FINAL do produto. Empresas que não correspondem ao uso final especificado são descartadas, garantindo máxima precisão nos resultados.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p>
                <strong className="text-foreground">Salvamento Inteligente:</strong> Você pode salvar buscas inteiras para consulta futura, selecionar empresas individualmente ou em bulk, e o sistema identifica automaticamente quais empresas já estão salvas no banco de dados.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p>
                <strong className="text-foreground">Decisores Identificados:</strong> Para cada dealer encontrado, identificamos automaticamente Procurement Managers, Purchasing Directors e Buyers responsáveis por importações, facilitando o contato direto.
              </p>
            </div>
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
                SALVAR {dealers.length} DEALER(S)
              </>
            )}
          </Button>
          <p className="text-xs text-center mt-2 text-muted-foreground bg-background/90 px-3 py-1 rounded flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Não saia sem salvar!
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
          tenantId={currentTenant?.id} // ✅ Passar tenantId para validação
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

