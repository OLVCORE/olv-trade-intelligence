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
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { normalizeProductBatch, autoMapCSVColumns } from '@/lib/utils/productDataNormalizer';

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

  // Download Template CSV
  const handleDownloadTemplate = () => {
    const template = `name,category,hs_code,price_usd,price_brl,moq,weight_kg,dimensions_cm,volume_m3,sku,brand,materials,warranty_months,description,image_url
Reformer Advanced,Linha Advanced,9506.91.00,3500,19250,1,85,240x60x35,0.504,RF-ADV-001,MetaLife,"Steel frame, wood deck",24,"Professional reformer",https://example.com/image.jpg
Cadillac Infinity,Linha Infinity,9506.91.00,5200,28600,1,120,280x80x220,4.928,CAD-INF-001,MetaLife,"Steel structure",24,"Complete cadillac system",https://example.com/cadillac.jpg`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_produtos_metalife.csv';
    link.click();
    
    toast.success('Template CSV baixado!', {
      description: 'Preencha o arquivo e faça o upload',
    });
  };

  // Import to database com NORMALIZER UNIVERSAL
  const importMutation = useMutation({
    mutationFn: async (products: any[]) => {
      if (!currentTenant?.id) throw new Error('Tenant não identificado');

      // 🔥 USAR O NORMALIZADOR UNIVERSAL
      const normalizedResults = normalizeProductBatch(products);

      // Filtrar apenas os sucessos
      const successProducts = normalizedResults.filter(r => r.success);
      const failedProducts = normalizedResults.filter(r => !r.success);

      if (failedProducts.length > 0) {
        console.warn('[CSV] Produtos com erro:', failedProducts);
        toast.warning(`${failedProducts.length} produto(s) ignorado(s) por erro de validação`);
      }

      if (successProducts.length === 0) {
        throw new Error('Nenhum produto válido para importar');
      }

      // Preparar para inserção no Supabase
      const productsToInsert = successProducts.map(result => ({
        tenant_id: currentTenant.id,
        ...result.data,
        // Campos que podem estar no CSV com nomes alternativos já foram normalizados
        main_image: result.data?.main_image || result.data?.image_url,
      }));

      const { data, error } = await supabase
        .from('tenant_products')
        .insert(productsToInsert)
        .select();

      if (error) throw error;
      return { imported: data, failed: failedProducts.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-products'] });
      
      const successCount = result.imported?.length || 0;
      const failedCount = result.failed || 0;
      
      if (failedCount > 0) {
        toast.success(`✅ ${successCount} produto(s) importado(s)!`, {
          description: `⚠️ ${failedCount} produto(s) ignorado(s) por erro de validação`,
        });
      } else {
        toast.success(`✅ ${successCount} produto(s) importado(s) com sucesso!`);
      }
      
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
          {/* DOWNLOAD TEMPLATE */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  Não tem um CSV pronto?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Baixe nosso template com exemplos e preencha com seus produtos
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
            </div>
          </div>

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

          {/* INSTRUCOES COM NORMALIZADOR UNIVERSAL */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-2">
              <div>
                <strong>✨ Normalizador Universal Ativado!</strong><br />
                O sistema detecta automaticamente os campos independente da ordem ou nome das colunas.
              </div>
              <div>
                <strong>Exemplos de nomes aceitos:</strong><br />
                • <code>name, nome, produto, product</code> → Nome do produto<br />
                • <code>price_usd, preco_usd, usd, price</code> → Preço USD<br />
                • <code>peso, weight_kg, weight</code> → Peso<br />
                • <code>categoria, category, tipo</code> → Categoria
              </div>
              <div className="text-xs text-muted-foreground">
                💡 Não precisa seguir um padrão específico! O sistema entende diversos formatos.
              </div>
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

