import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DealerSearchParams } from './DealerDiscoveryForm';
import { checkNameExists } from '@/services/savedDealerSearchesService';

interface SaveSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchParams: DealerSearchParams | null;
  resultsCount: number;
  onSave: (name: string) => Promise<void>;
  tenantId?: string; // ✅ Para validação de nome único
}

export function SaveSearchModal({
  open,
  onOpenChange,
  searchParams,
  resultsCount,
  onSave,
  tenantId,
}: SaveSearchModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [checkingName, setCheckingName] = useState(false);

  // ✅ Validar nome em tempo real
  useEffect(() => {
    if (!tenantId || !name.trim()) {
      setNameExists(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingName(true);
      try {
        const exists = await checkNameExists(tenantId, name.trim());
        setNameExists(exists);
      } catch (error) {
        // Em caso de erro, não bloquear (pode ser problema de conexão)
        setNameExists(false);
      } finally {
        setCheckingName(false);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [name, tenantId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Digite um nome para a busca');
      return;
    }

    if (nameExists) {
      toast.error('Nome já existe', {
        description: `Já existe uma busca salva com o nome "${name}". Por favor, escolha outro nome ou edite a busca existente.`,
      });
      return;
    }

    if (!searchParams) {
      toast.error('Nenhum parâmetro de busca para salvar');
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim());
      setName('');
      setNameExists(false);
      onOpenChange(false);
      toast.success('✅ Busca salva com sucesso!', {
        description: `Busca "${name.trim()}" salva no banco de dados. Você pode carregá-la a qualquer momento.`,
        duration: 5000,
      });
    } catch (error: any) {
      toast.error('Erro ao salvar busca', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Salvar Busca
          </DialogTitle>
          <DialogDescription>
            Dê um nome para esta busca e salve para consultar depois
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-name">Nome da Busca</Label>
            <div className="relative">
              <Input
                id="search-name"
                placeholder="Ex: Pilates - Colômbia e Argentina - Janeiro 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !nameExists && !saving) {
                    handleSave();
                  }
                }}
                disabled={saving}
                className={nameExists ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {checkingName && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!checkingName && name.trim() && (
                <>
                  {nameExists ? (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </>
              )}
            </div>
            {nameExists && name.trim() && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-red-800 dark:text-red-200">
                  <strong>Nome já existe no banco de dados!</strong>
                  <p className="mt-1">Já existe uma busca salva com este nome. Por favor, escolha outro nome ou edite a busca existente.</p>
                </div>
              </div>
            )}
          </div>

          {searchParams && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resultados:</span>
                  <span className="font-semibold">{resultsCount} dealer(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Países:</span>
                  <span className="font-medium">
                    {searchParams.countries?.length || 0} selecionado(s)
                  </span>
                </div>
                {searchParams.hsCodes && searchParams.hsCodes.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">HS Codes:</span>
                    <span className="font-medium">{searchParams.hsCodes.length} código(s)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setName('');
              onOpenChange(false);
            }}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Busca
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
