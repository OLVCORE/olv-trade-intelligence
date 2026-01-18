import { useState } from 'react';
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
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { DealerSearchParams } from './DealerDiscoveryForm';

interface SaveSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchParams: DealerSearchParams | null;
  resultsCount: number;
  onSave: (name: string) => Promise<void>;
}

export function SaveSearchModal({
  open,
  onOpenChange,
  searchParams,
  resultsCount,
  onSave,
}: SaveSearchModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Digite um nome para a busca');
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
      onOpenChange(false);
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
            <Input
              id="search-name"
              placeholder="Ex: Pilates - Colômbia e Argentina - Janeiro 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              disabled={saving}
            />
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
