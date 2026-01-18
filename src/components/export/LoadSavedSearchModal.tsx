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
import { Search, Clock, MapPin, Package, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getSavedDealerSearches, type SavedDealerSearch } from '@/services/savedDealerSearchesService';
import type { DealerSearchParams } from './DealerDiscoveryForm';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface LoadSavedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  workspaceId: string | null;
  onLoad: (searchParams: DealerSearchParams) => void;
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

  useEffect(() => {
    if (open) {
      loadSearches();
    }
  }, [open, tenantId, workspaceId]);

  const loadSearches = async () => {
    setLoading(true);
    try {
      const searches = await getSavedDealerSearches(tenantId, workspaceId);
      setSavedSearches(searches);
    } catch (error: any) {
      console.error('[LOAD-SEARCH] Erro ao carregar buscas:', error);
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

  const handleLoadSearch = (search: SavedDealerSearch) => {
    try {
      onLoad(search.search_params);
      onOpenChange(false);
      toast.success(`Busca "${search.name}" carregada!`);
    } catch (error: any) {
      toast.error('Erro ao carregar busca', {
        description: error.message,
      });
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
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleLoadSearch(search)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-sm">{search.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadSearch(search);
                        }}
                      >
                        Carregar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
