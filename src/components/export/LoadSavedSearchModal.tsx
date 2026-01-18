import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock, MapPin, Package, Loader2, X, Trash2, Edit2, Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getSavedDealerSearches, 
  deleteSavedDealerSearch, 
  updateSavedDealerSearch,
  checkNameExists,
  type SavedDealerSearch 
} from '@/services/savedDealerSearchesService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DealerSearchParams } from './DealerDiscoveryForm';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface LoadSavedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  workspaceId: string | null;
  onLoad: (searchParams: DealerSearchParams, searchId?: string, searchResults?: any[]) => void; // ✅ NOVO: searchId e searchResults opcionais
}

export function LoadSavedSearchModal({
  open,
  onOpenChange,
  tenantId,
  workspaceId,
  onLoad,
}: LoadSavedSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSearches, setSavedSearches] = useState<SavedDealerSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [nameExists, setNameExists] = useState<boolean | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    if (open) {
      loadSearches();
    } else {
      // Reset states when modal closes
      setSearchQuery('');
      setEditingId(null);
      setEditingName('');
      setDeleteConfirmId(null);
      setNameExists(null);
    }
  }, [open, tenantId, workspaceId]);

  // ✅ Validar nome em tempo real durante edição
  useEffect(() => {
    const delayCheck = setTimeout(() => {
      if (editingName.trim() && tenantId && editingId) {
        checkNameUniqueness(editingName.trim(), editingId);
      } else {
        setNameExists(null);
      }
    }, 500); // Debounce para evitar muitas chamadas
    return () => clearTimeout(delayCheck);
  }, [editingName, tenantId, editingId]);

  const checkNameUniqueness = async (currentName: string, excludeId: string) => {
    if (!tenantId) return;
    setCheckingName(true);
    try {
      const exists = await checkNameExists(tenantId, currentName, excludeId);
      setNameExists(exists);
    } catch (error) {
      console.error('Erro ao verificar nome da busca:', error);
      setNameExists(null); // Em caso de erro, não bloquear
    } finally {
      setCheckingName(false);
    }
  };

  const loadSearches = async () => {
    setLoading(true);
    try {
      // ✅ Tentar carregar do banco primeiro
      try {
        const searches = await getSavedDealerSearches(tenantId, workspaceId);
        setSavedSearches(searches);
      } catch (error: any) {
        console.warn('[LOAD-SEARCH] ⚠️ Erro ao carregar do banco, usando localStorage:', error);
        
        // ✅ FALLBACK: Carregar do localStorage se banco falhar
        const localSearches = localStorage.getItem('export_saved_searches');
        if (localSearches) {
          const parsed = JSON.parse(localSearches);
          // Converter formato localStorage para SavedDealerSearch
          const formatted = parsed.map((s: any) => ({
            id: s.id,
            tenant_id: tenantId,
            workspace_id: workspaceId,
            name: s.name,
            search_params: s.search_params,
            results_count: s.results_count,
            last_run_at: s.saved_at,
            created_at: s.saved_at,
            created_by: null,
            updated_at: s.saved_at,
            updated_by: null,
          }));
          setSavedSearches(formatted);
          toast.info('Buscas carregadas do backup local', {
            description: `O banco não está disponível, mas encontramos ${formatted.length} busca(s) salva(s) localmente.`,
          });
        } else {
          setSavedSearches([]);
        }
      }
    } catch (error: any) {
      console.error('[LOAD-SEARCH] ❌ Erro ao carregar buscas:', error);
      toast.error('Erro ao carregar buscas salvas', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSearches = searchQuery.trim()
    ? savedSearches.filter((search) =>
        search.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedSearches;

  const handleLoadSearch = async (search: SavedDealerSearch, e?: React.MouseEvent) => {
    console.log('[LOAD-SEARCH] 🚀 handleLoadSearch CHAMADO:', {
      searchId: search.id,
      searchName: search.name,
      editingId: editingId,
      event: e ? 'present' : 'none',
    });

    // ✅ Se está editando, não carregar ao clicar
    if (editingId) {
      console.log('[LOAD-SEARCH] ⚠️ Modo edição ativo, abortando carregamento');
      return;
    }
    
    // ✅ Se clicou em botão ou input (exceto se foi o botão Carregar), não carregar
    if (e) {
      const target = e.target as HTMLElement;
      const isButton = target.closest('button');
      const isInput = target.closest('input');
      const isLoadButton = target.closest('button')?.textContent?.includes('Carregar');
      
      if ((isButton || isInput) && !isLoadButton) {
        console.log('[LOAD-SEARCH] ⚠️ Clique em elemento interativo (não é botão Carregar), abortando');
        return;
      }
    }

    try {
      console.log('[LOAD-SEARCH] ✅ Iniciando carregamento da busca:', {
        id: search.id,
        name: search.name,
        hasSearchResults: !!search.search_results,
        searchResultsCount: Array.isArray(search.search_results) ? search.search_results.length : 0,
        tenantId: tenantId,
        workspaceId: workspaceId,
      });

      // ✅ CRÍTICO: Se não há search_results, buscar do banco ANTES de carregar
      let finalSearchResults = Array.isArray(search.search_results) ? search.search_results : [];
      
      console.log('[LOAD-SEARCH] 📊 Verificando resultados salvos:', {
        hasSearchResults: !!search.search_results,
        isArray: Array.isArray(search.search_results),
        length: Array.isArray(search.search_results) ? search.search_results.length : 0,
        searchId: search.id,
      });
      
      if (!finalSearchResults || finalSearchResults.length === 0) {
        console.log('[LOAD-SEARCH] ⚠️ Nenhum resultado salvo encontrado em search_results, buscando do banco de dados...');
        try {
          const { supabase: supabaseClient } = await import('@/integrations/supabase/client');
          
          // Buscar dealers salvos no banco usando o searchId
          console.log('[LOAD-SEARCH] 🔍 Buscando empresas com saved_search_id:', search.id);
          
          // ✅ CRÍTICO: Adicionar tenant_id na busca para garantir isolamento de dados
          let query = supabaseClient
            .from('companies')
            .select('*')
            .eq('raw_data->>saved_search_id', search.id)
            .eq('data_source', 'dealer_discovery');
          
          if (tenantId) {
            query = query.eq('tenant_id', tenantId);
          }
          
          if (workspaceId) {
            query = query.or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`);
          }
          
          query = query.limit(500);
          
          console.log('[LOAD-SEARCH] 🔍 Query SQL será executada com:', {
            saved_search_id: search.id,
            tenant_id: tenantId,
            workspace_id: workspaceId,
            data_source: 'dealer_discovery',
          });
          
          const { data: companies, error: fetchError } = await query;
          
          console.log('[LOAD-SEARCH] 📊 Resultado da busca no banco:', {
            companiesFound: companies?.length || 0,
            error: fetchError?.message,
            hasError: !!fetchError,
          });
          
          if (!fetchError && companies && companies.length > 0) {
            console.log(`[LOAD-SEARCH] ✅ ${companies.length} dealers encontrados no banco`);
            
            // Converter companies para formato Dealer
            finalSearchResults = companies.map((company: any) => {
              const rawData = company.raw_data || {};
              return {
                id: company.id,
                name: company.company_name || '',
                website: company.website || undefined,
                country: company.country || rawData.country || '',
                city: company.city || rawData.city || '',
                state: company.state || rawData.state || undefined,
                industry: company.industry || undefined,
                employee_count: company.employee_count || company.employees_count || undefined,
                revenue_range: rawData.revenue || undefined,
                linkedin_url: company.linkedin_url || rawData.linkedin_url || undefined,
                description: company.description || rawData.description || undefined,
                is_distributor: (company.b2b_type || rawData.b2b_type || '').toLowerCase().includes('distributor'),
                is_wholesaler: (company.b2b_type || rawData.b2b_type || '').toLowerCase().includes('wholesaler'),
                is_importer: (company.b2b_type || rawData.b2b_type || '').toLowerCase().includes('importer'),
                decision_makers: rawData.decision_makers || [],
                export_fit_score: rawData.fit_score || 50,
                fitScore: rawData.fit_score || 50,
                apollo_organization_id: company.apollo_id || rawData.apollo_id || undefined,
                raw_data: rawData,
              };
            });
          } else {
            console.warn('[LOAD-SEARCH] ⚠️ Nenhum dealer encontrado no banco para esta busca');
          }
        } catch (dbError) {
          console.error('[LOAD-SEARCH] ❌ Erro ao buscar dealers do banco:', dbError);
          // Continuar mesmo se falhar, usar resultados vazios
        }
      }

      console.log('[LOAD-SEARCH] ✅ Passando para onLoad:', {
        paramsCount: Object.keys(search.search_params).length,
        searchId: search.id,
        resultsCount: finalSearchResults.length,
      });

      // ✅ Passar parâmetros, ID da busca salva E OS RESULTADOS (dealers encontrados)
      onLoad(search.search_params, search.id, finalSearchResults);
      onOpenChange(false);
      toast.success(`Busca "${search.name}" carregada! ${finalSearchResults.length > 0 ? `(${finalSearchResults.length} resultados)` : ''}`);
    } catch (error: any) {
      console.error('[LOAD-SEARCH] ❌ Erro ao carregar busca:', error);
      toast.error('Erro ao carregar busca', {
        description: error.message,
      });
    }
  };

  const handleEditName = (search: SavedDealerSearch, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingId(search.id);
    setEditingName(search.name);
    setNameExists(null); // Resetar validação ao iniciar edição
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) {
      toast.error('Nome não pode estar vazio');
      return;
    }

    if (nameExists) {
      toast.error('Já existe uma busca salva com este nome. Por favor, escolha outro.');
      return;
    }

    setUpdating(true);
    try {
      const updated = await updateSavedDealerSearch(editingId, { name: editingName.trim() }, tenantId);
      
      // Atualizar lista local
      setSavedSearches(prev => prev.map(s => s.id === editingId ? updated : s));
      
      setEditingId(null);
      setEditingName('');
      setNameExists(null);
      toast.success('Nome da busca atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar nome', {
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setNameExists(null);
  };

  const handleDeleteClick = (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(searchId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    setDeleting(true);
    try {
      await deleteSavedDealerSearch(deleteConfirmId);
      
      // Remover da lista local
      setSavedSearches(prev => prev.filter(s => s.id !== deleteConfirmId));
      
      setDeleteConfirmId(null);
      toast.success('Busca deletada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao deletar busca', {
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Buscas Salvas
          </DialogTitle>
          <DialogDescription>
            Selecione uma busca salva para recarregar seus parâmetros
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de buscas salvas */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSearches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery.trim()
                ? `Nenhuma busca encontrada para "${searchQuery}"`
                : 'Nenhuma busca salva ainda'}
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2 pr-4">
                {filteredSearches.map((search) => (
                  <div
                    key={search.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    onClick={(e) => {
                      // ✅ Se não está editando e clicou diretamente no container (não em botões/inputs), carregar busca
                      const target = e.target as HTMLElement;
                      const isButton = target.closest('button');
                      const isInput = target.closest('input');
                      const clickedDirectlyOnContainer = target === e.currentTarget || target.closest('.border.rounded-lg.p-4') === e.currentTarget;
                      
                      if (editingId !== search.id && !isButton && !isInput && clickedDirectlyOnContainer) {
                        console.log('[LOAD-SEARCH] 🖱️ Clique no container da busca, carregando...');
                        handleLoadSearch(search, e);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {editingId === search.id ? (
                          // ✅ Modo edição
                          <div 
                            className="space-y-2"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  e.stopPropagation(); // ✅ Prevenir propagação do evento
                                  if (e.key === 'Enter' && !nameExists) {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEdit();
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                className={`h-8 text-sm ${nameExists ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                autoFocus
                                disabled={updating || checkingName}
                              />
                              {checkingName && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                              {!checkingName && editingName.trim() && (
                                nameExists ? (
                                  <X className="h-4 w-4 text-destructive" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                                disabled={updating || !editingName.trim() || nameExists}
                                className="h-8 w-8 p-0"
                              >
                                {updating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                                disabled={updating}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                            {nameExists && editingName.trim() && (
                              <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md text-xs text-red-800 dark:text-red-200">
                                <X className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>Já existe uma busca salva com este nome.</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // ✅ Modo visualização
                          <h4 className="font-semibold text-sm cursor-pointer">{search.name}</h4>
                        )}
                        <div 
                          className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                          onClick={(e) => editingId === search.id && e.stopPropagation()}
                        >
                          {search.last_run_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(search.last_run_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {search.results_count} resultado(s)
                          </Badge>
                          {search.search_params.countries && search.search_params.countries.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {search.search_params.countries.length} país(es)
                            </div>
                          )}
                          {search.search_params.hsCodes && search.search_params.hsCodes.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {search.search_params.hsCodes.length} HS Code(s)
                            </div>
                          )}
                          {search.search_results && Array.isArray(search.search_results) && search.search_results.length > 0 && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              ✅ Resultados salvos ({search.search_results.length})
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div 
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {editingId !== search.id && (
                          <>
                            {/* ✅ Botão Editar (Lápis) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditName(search);
                              }}
                              className="h-8 w-8 p-0"
                              title="Editar nome"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            
                            {/* ✅ Botão Deletar (Lixeira) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteClick(search.id, e)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Deletar busca"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {/* ✅ Botão Carregar */}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[LOAD-SEARCH] 🔵 Botão Carregar clicado:', {
                              searchId: search.id,
                              searchName: search.name,
                              hasSearchResults: !!search.search_results,
                              editingId: editingId,
                            });
                            await handleLoadSearch(search, e);
                          }}
                          disabled={editingId === search.id}
                          type="button"
                        >
                          Carregar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>

      {/* ✅ Modal de confirmação de exclusão */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta busca salva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
