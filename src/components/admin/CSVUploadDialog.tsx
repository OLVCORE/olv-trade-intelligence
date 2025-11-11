import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVUploadDialog({ open, onOpenChange }: CSVUploadDialogProps) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse CSV/Excel
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      
      // Parse CSV (simples)
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        toast.error('Arquivo vazio');
        return;
      }

      // Headers (primeira linha)
      const headerLine = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(headerLine);

      // Data (demais linhas)
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headerLine.forEach((header, idx) => {
          row[header] = values[idx] || null;
        });
        return row;
      });

      setParsedData(data);
      toast.success(`${data.length} produto(s) encontrado(s) no arquivo`);

    } catch (err: any) {
      toast.error('Erro ao ler arquivo', { description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Import to database
  const importMutation = useMutation({
    mutationFn: async (products: any[]) => {
      if (!currentTenant?.id) throw new Error('Tenant não identificado');

      // Mapear colunas CSV para campos do banco
      const productsToInsert = products.map(row => ({
        tenant_id: currentTenant.id,
        name: row.name || row.produto || row.product || row.Nome,
        description: row.description || row.descricao || row.Descrição,
        category: row.category || row.categoria || row.Categoria,
        hs_code: row.hs_code || row.hs || row['HS Code'] || row.ncm,
        price_usd: parseFloat(row.price_usd || row.preco_usd || row['Preço USD'] || 0) || null,
        price_brl: parseFloat(row.price_brl || row.preco_brl || row['Preço BRL'] || 0) || null,
        moq: parseInt(row.moq || row.MOQ || row.minimo || 1) || 1,
        weight_kg: parseFloat(row.weight_kg || row.peso || row.Peso || 0) || null,
        dimensions_cm: row.dimensions_cm || row.dimensoes || row.Dimensões,
        volume_m3: parseFloat(row.volume_m3 || row.volume || row.Volume || 0) || null,
        sku: row.sku || row.SKU || row.codigo,
        brand: row.brand || row.marca || row.Marca || 'MetaLife',
        materials: row.materials || row.materiais || row.Materiais,
        warranty_months: parseInt(row.warranty_months || row.garantia || 12) || 12,
        min_order_quantity: parseInt(row.min_order_quantity || row.moq || 1) || 1,
        origin_country: row.origin_country || row.origem || 'BR',
        is_active: row.is_active !== 'false' && row.ativo !== 'false',
      }));

      const { data, error } = await supabase
        .from('tenant_products')
        .insert(productsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-products'] });
      toast.success(`✅ ${data?.length || 0} produto(s) importado(s)!`);
      onOpenChange(false);
      setFile(null);
      setParsedData([]);
    },
    onError: (err: any) => {
      toast.error('Erro ao importar', { description: err.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload CSV/Excel
          </DialogTitle>
          <DialogDescription>
            Importe produtos em massa via arquivo CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* FILE INPUT */}
          <div>
            <Label>Selecione o arquivo</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processando...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Escolher Arquivo CSV/Excel</>
                )}
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                Arquivo selecionado: {file.name}
              </p>
            )}
          </div>

          {/* INSTRUCOES */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Formato esperado (CSV):</strong><br />
              <code className="text-xs">name,category,hs_code,price_usd,moq,weight_kg,dimensions_cm</code><br />
              <strong>Exemplo:</strong><br />
              <code className="text-xs">Reformer Advanced,Linha Advanced,9506.91.00,3500,1,85,240x60x35</code>
            </AlertDescription>
          </Alert>

          {/* PREVIEW */}
          {parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Preview ({parsedData.length} produtos)</Label>
                <Badge variant="outline">{headers.length} colunas detectadas</Badge>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.slice(0, 6).map((header) => (
                        <TableHead key={header} className="text-xs">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {headers.slice(0, 6).map((header) => (
                          <TableCell key={header} className="text-xs">
                            {row[header] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  ... e mais {parsedData.length - 5} produto(s)
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => importMutation.mutate(parsedData)}
            disabled={parsedData.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importando...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" />Importar {parsedData.length} Produto(s)</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

