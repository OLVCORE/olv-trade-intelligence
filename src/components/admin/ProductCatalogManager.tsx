import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Info, 
  Loader2, 
  Globe,
  DollarSign,
  Ruler,
  Weight,
  Clock,
  Shield,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

// ============================================================================
// TYPES
// ============================================================================

interface TenantProduct {
  id: string;
  tenant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  hs_code: string | null;
  price_brl: number | null;
  price_usd: number | null;
  price_eur: number | null;
  moq: number | null; // Minimum Order Quantity
  lead_time_days: number | null;
  weight_kg: number | null;
  dimensions_cm: string | null;
  certifications: string[] | null;
  target_segments: string[] | null;
  image_url: string | null;
  product_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductCatalogManager() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<TenantProduct | null>(null);

  // ============================================================================
  // FETCH PRODUCTS
  // ============================================================================

  const { data: products, isLoading } = useQuery({
    queryKey: ['tenant-products', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];

      const { data, error } = await supabase
        .from('tenant_products')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TenantProduct[];
    },
    enabled: !!currentTenant?.id,
  });

  // ============================================================================
  // IMPORT FROM WEBSITE (Edge Function)
  // ============================================================================

  const handleImportFromWebsite = async () => {
    if (!importUrl) {
      toast.error('URL obrigatória', {
        description: 'Informe a URL do site para importar produtos',
      });
      return;
    }

    if (!currentTenant?.id) {
      toast.error('Tenant não identificado');
      return;
    }

    setIsImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-product-catalog', {
        body: {
          tenant_id: currentTenant.id,
          website_url: importUrl,
        },
      });

      if (error) throw error;

      toast.success('✅ Produtos importados com sucesso!', {
        description: `${data.products_count} produtos adicionados ao catálogo`,
        duration: 5000,
      });

      // Recarregar produtos
      queryClient.invalidateQueries({ queryKey: ['tenant-products'] });
      setImportUrl('');
    } catch (err: any) {
      console.error('[CATALOG] Erro ao importar:', err);
      toast.error('Erro ao importar catálogo', {
        description: err.message || 'Erro desconhecido. Verifique o console.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ============================================================================
  // DELETE PRODUCT
  // ============================================================================

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('tenant_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto deletado');
      queryClient.invalidateQueries({ queryKey: ['tenant-products'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao deletar produto', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER COM IMPORT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Catálogo de Produtos
          </CardTitle>
          <CardDescription>
            Gerencie os produtos do seu catálogo. Importe do seu site ou adicione manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IMPORTAR DO SITE */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                Importar do Site
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        💡 Informe a URL do seu site (ex: https://metalifepilates.com.br/)
                        e nossa IA irá extrair automaticamente todos os produtos, incluindo
                        nome, descrição, preços e sugestões de HS Code.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                placeholder="https://metalifepilates.com.br/"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                disabled={isImporting}
              />
            </div>
            <Button
              onClick={handleImportFromWebsite}
              disabled={!importUrl || isImporting}
              className="mt-7"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>

          {/* ADICIONAR MANUAL */}
          <div className="flex items-center gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto Manualmente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Produto</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do produto. Campos com * são obrigatórios.
                  </DialogDescription>
                </DialogHeader>
                <ProductForm
                  onSubmit={() => {
                    setShowAddDialog(false);
                    queryClient.invalidateQueries({ queryKey: ['tenant-products'] });
                  }}
                  onCancel={() => setShowAddDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE PRODUTOS */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>
            {products?.length || 0} produto(s) no catálogo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!products || products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">Nenhum produto cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Importe produtos do seu site ou adicione manualmente para começar.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>HS Code</TableHead>
                    <TableHead>Especificações</TableHead>
                    <TableHead>Preços</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.hs_code ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {product.hs_code}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {product.price_usd && (
                            <div>USD {product.price_usd.toLocaleString()}</div>
                          )}
                          {product.price_brl && (
                            <div className="text-muted-foreground">
                              R$ {product.price_brl.toLocaleString()}
                            </div>
                          )}
                          {!product.price_usd && !product.price_brl && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.moq ? (
                          <span className="text-sm">{product.moq} un</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Editar Produto</DialogTitle>
                              </DialogHeader>
                              <ProductForm
                                product={editingProduct}
                                onSubmit={() => {
                                  setEditingProduct(null);
                                  queryClient.invalidateQueries({
                                    queryKey: ['tenant-products'],
                                  });
                                }}
                                onCancel={() => setEditingProduct(null)}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Tem certeza que deseja deletar "${product.name}"?`
                                )
                              ) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// PRODUCT FORM (Add/Edit)
// ============================================================================

interface ProductFormProps {
  product?: TenantProduct | null;
  onSubmit: () => void;
  onCancel: () => void;
}

function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { currentTenant } = useTenant();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    hs_code: product?.hs_code || '',
    price_brl: product?.price_brl?.toString() || '',
    price_usd: product?.price_usd?.toString() || '',
    price_eur: product?.price_eur?.toString() || '',
    moq: product?.moq?.toString() || '',
    lead_time_days: product?.lead_time_days?.toString() || '',
    weight_kg: product?.weight_kg?.toString() || '',
    dimensions_cm: product?.dimensions_cm || '',
    product_url: product?.product_url || '',
    is_active: product?.is_active ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    if (!currentTenant?.id) {
      toast.error('Tenant não identificado');
      return;
    }

    setIsSaving(true);

    try {
      const productData = {
        tenant_id: currentTenant.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        hs_code: formData.hs_code || null,
        price_brl: formData.price_brl ? parseFloat(formData.price_brl) : null,
        price_usd: formData.price_usd ? parseFloat(formData.price_usd) : null,
        price_eur: formData.price_eur ? parseFloat(formData.price_eur) : null,
        moq: formData.moq ? parseInt(formData.moq) : null,
        lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        dimensions_cm: formData.dimensions_cm || null,
        product_url: formData.product_url || null,
        is_active: formData.is_active,
      };

      if (product?.id) {
        // UPDATE
        const { error } = await supabase
          .from('tenant_products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;

        toast.success('Produto atualizado com sucesso!');
      } else {
        // INSERT
        const { error } = await supabase.from('tenant_products').insert(productData);

        if (error) throw error;

        toast.success('Produto adicionado com sucesso!');
      }

      onSubmit();
    } catch (err: any) {
      console.error('[CATALOG] Erro ao salvar:', err);
      toast.error('Erro ao salvar produto', {
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* INFORMAÇÕES BÁSICAS */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Informações Básicas
        </h4>

        <div>
          <Label>
            Nome do Produto <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Reformer Infinity Series"
            required
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição detalhada do produto..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Categoria</Label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Reformer, Acessórios"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              HS Code / NCM
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    💡 Código NCM/HS internacional (ex: 9506.91.00)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              value={formData.hs_code}
              onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
              placeholder="Ex: 9506.91.00"
            />
          </div>
        </div>
      </div>

      {/* PREÇOS */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Preços
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Preço BRL (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price_brl}
              onChange={(e) => setFormData({ ...formData, price_brl: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Preço USD ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price_usd}
              onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Preço EUR (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price_eur}
              onChange={(e) => setFormData({ ...formData, price_eur: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* LOGÍSTICA */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" />
          Logística & Especificações
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              MOQ (Mínimo)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>💡 Quantidade mínima por pedido</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              value={formData.moq}
              onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
              placeholder="Ex: 50"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lead Time (dias)
            </Label>
            <Input
              type="number"
              value={formData.lead_time_days}
              onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
              placeholder="Ex: 45"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <Weight className="h-4 w-4" />
              Peso (kg)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              placeholder="Ex: 85.5"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Dimensões (cm)
            </Label>
            <Input
              value={formData.dimensions_cm}
              onChange={(e) => setFormData({ ...formData, dimensions_cm: e.target.value })}
              placeholder="Ex: 220x60x45"
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            'Salvar Produto'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

