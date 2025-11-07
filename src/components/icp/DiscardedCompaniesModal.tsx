import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Undo2, Loader2, XCircle, AlertTriangle, Building2, Calendar, User, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface DiscardedCompany {
  id: string;
  company_id: string | null;
  company_name: string;
  cnpj: string | null;
  discard_reason_label: string;
  discard_category: string;
  discarded_at: string;
  notes: string | null;
  stc_status: string | null;
  stc_triple_matches: number | null;
  stc_double_matches: number | null;
  stc_total_score: number | null;
}

interface DiscardedCompaniesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscardedCompaniesModal({ open, onOpenChange }: DiscardedCompaniesModalProps) {
  const [discardedCompanies, setDiscardedCompanies] = useState<DiscardedCompany[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const queryClient = useQueryClient();

  // Carregar empresas descartadas ao abrir modal
  useEffect(() => {
    if (open) {
      loadDiscardedCompanies();
    }
  }, [open]);

  const loadDiscardedCompanies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('discarded_companies')
        .select('*')
        .order('discarded_at', { ascending: false });

      if (error) throw error;

      setDiscardedCompanies(data || []);
      console.log('[DISCARDED-MODAL] ✅ Carregadas:', data?.length || 0, 'empresas descartadas');
    } catch (error: any) {
      console.error('[DISCARDED-MODAL] ❌ Erro ao carregar:', error);
      toast.error('Erro ao carregar empresas descartadas', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === discardedCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(discardedCompanies.map(c => c.id));
    }
  };

  const handleToggleCompany = (companyId: string) => {
    if (selectedIds.includes(companyId)) {
      setSelectedIds(selectedIds.filter(id => id !== companyId));
    } else {
      setSelectedIds([...selectedIds, companyId]);
    }
  };

  const handleRestore = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Selecione ao menos uma empresa para restaurar.');
      return;
    }

    setIsRestoring(true);
    try {
      console.log('[DISCARDED-MODAL] 🔄 Restaurando', selectedIds.length, 'empresas...');

      let restored = 0;
      let errors = 0;

      for (const discardedId of selectedIds) {
        const company = discardedCompanies.find(c => c.id === discardedId);
        if (!company) continue;

        try {
          // 1. Restaurar para quarentena
          if (company.company_id) {
            // Atualizar status em icp_analysis_results
            const { error: updateError } = await supabase
              .from('icp_analysis_results')
              .update({ status: 'pendente' })
              .eq('company_id', company.company_id);

            if (updateError) throw updateError;
          } else {
            // Criar novo registro na quarentena
            const { error: insertError } = await supabase
              .from('icp_analysis_results')
              .insert({
                cnpj: company.cnpj,
                razao_social: company.company_name,
                status: 'pendente',
                icp_score: 0,
                temperatura: 'cold',
                analysis_data: {
                  restored_from_discard: true,
                  restored_at: new Date().toISOString(),
                  previous_discard_reason: company.discard_reason_label,
                },
              });

            if (insertError) throw insertError;
          }

          // 2. Remover de descartadas
          const { error: deleteError } = await supabase
            .from('discarded_companies')
            .delete()
            .eq('id', discardedId);

          if (deleteError) throw deleteError;

          restored++;
          console.log(`[DISCARDED-MODAL] ✅ ${company.company_name} restaurada`);
        } catch (error: any) {
          errors++;
          console.error(`[DISCARDED-MODAL] ❌ Erro ao restaurar ${company.company_name}:`, error);
        }
      }

      if (restored > 0) {
        toast.success(`✅ ${restored} empresa(s) restaurada(s) para quarentena!`, {
          description: errors > 0 ? `${errors} erro(s) durante a restauração` : 'Todas foram restauradas com sucesso',
          duration: 5000,
        });

        // Recarregar lista
        await loadDiscardedCompanies();
        setSelectedIds([]);

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
        queryClient.invalidateQueries({ queryKey: ['discarded-companies'] });

        // Fechar modal se restaurou todas
        if (restored === selectedIds.length && errors === 0) {
          setTimeout(() => onOpenChange(false), 1000);
        }
      }

      if (errors > 0 && restored === 0) {
        toast.error('Erro ao restaurar empresas', {
          description: 'Verifique o console para mais detalhes',
        });
      }
    } catch (error: any) {
      console.error('[DISCARDED-MODAL] ❌ Erro crítico:', error);
      toast.error('Erro crítico ao restaurar empresas', { description: error.message });
    } finally {
      setIsRestoring(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      blocker: { variant: 'destructive', label: 'Bloqueador' },
      low_priority: { variant: 'secondary', label: 'Baixa Prioridade' },
      duplicate: { variant: 'outline', label: 'Duplicado' },
      other: { variant: 'outline', label: 'Outro' },
    };
    return variants[category] || variants.other;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <XCircle className="w-6 h-6 text-red-500" />
            Empresas Descartadas
          </DialogTitle>
          <DialogDescription>
            {discardedCompanies.length} empresa(s) descartada(s). Selecione as que deseja restaurar para a quarentena.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.length === discardedCompanies.length && discardedCompanies.length > 0}
              onCheckedChange={handleSelectAll}
              disabled={isLoading || discardedCompanies.length === 0}
            />
            <span className="text-sm font-medium">
              {selectedIds.length > 0 
                ? `${selectedIds.length} selecionada(s)` 
                : 'Selecionar todas'}
            </span>
          </div>

          <Button
            onClick={handleRestore}
            disabled={selectedIds.length === 0 || isRestoring}
            className="gap-2"
            variant="default"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Restaurando...
              </>
            ) : (
              <>
                <Undo2 className="w-4 h-4" />
                Restaurar Selecionadas ({selectedIds.length})
              </>
            )}
          </Button>
        </div>

        {/* Lista de empresas */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando empresas descartadas...</span>
            </div>
          ) : discardedCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <XCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-semibold">Nenhuma empresa descartada</p>
              <p className="text-sm">Ótimo! Não há empresas no arquivo morto.</p>
            </div>
          ) : (
            discardedCompanies.map((company) => (
              <Card key={company.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedIds.includes(company.id)}
                    onCheckedChange={() => handleToggleCompany(company.id)}
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-2">
                    {/* Header da empresa */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-base flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {company.company_name}
                        </h4>
                        {company.cnpj && (
                          <p className="text-xs text-muted-foreground mt-1">
                            CNPJ: {company.cnpj}
                          </p>
                        )}
                      </div>

                      <Badge {...getCategoryBadge(company.discard_category)}>
                        {getCategoryBadge(company.discard_category).label}
                      </Badge>
                    </div>

                    {/* Motivo do descarte */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">
                        Motivo do Descarte:
                      </p>
                      <p className="text-sm">
                        {company.discard_reason_label}
                      </p>
                      {company.notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <FileText className="w-3 h-3 inline mr-1" />
                          {company.notes}
                        </p>
                      )}
                    </div>

                    {/* Métricas STC (se disponível) */}
                    {company.stc_status && (
                      <div className="flex items-center gap-3 text-xs">
                        <Badge variant={company.stc_status === 'no-go' ? 'destructive' : 'default'}>
                          STC: {company.stc_status?.toUpperCase()}
                        </Badge>
                        {company.stc_triple_matches !== null && (
                          <span className="text-muted-foreground">
                            Triple: {company.stc_triple_matches}
                          </span>
                        )}
                        {company.stc_total_score !== null && (
                          <span className="text-muted-foreground">
                            Score: {company.stc_total_score} pts
                          </span>
                        )}
                      </div>
                    )}

                    {/* Data de descarte */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Descartada em: {new Date(company.discarded_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer com resumo */}
        {discardedCompanies.length > 0 && (
          <div className="border-t pt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {discardedCompanies.length} empresa(s) descartada(s) • {selectedIds.length} selecionada(s)
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

