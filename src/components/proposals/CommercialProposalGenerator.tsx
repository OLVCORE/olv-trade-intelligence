import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  FileText,
  Package,
  Loader2,
  Send,
  Eye,
  DollarSign,
  Target,
  ShoppingCart,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PricingCalculator } from './PricingCalculator';
import type { Dealer } from '@/components/export/DealerCard';
import type { IncotermResult } from '@/lib/incotermsCalculator';

// ============================================================================
// TYPES
// ============================================================================

interface SelectedProduct {
  product_id: string;
  name: string;
  hs_code: string | null;
  quantity: number;
  unit_price_usd: number;
  total_usd: number;
}

interface CommercialProposalGeneratorProps {
  dealer: Dealer;
  onProposalGenerated?: (proposalId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CommercialProposalGenerator({
  dealer,
  onProposalGenerated,
}: CommercialProposalGeneratorProps) {
  const { currentTenant, currentWorkspace } = useTenant();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'products' | 'pricing' | 'review'>('products');

  // Produtos selecionados
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Pricing
  const [selectedIncoterm, setSelectedIncoterm] = useState<string>('CIF');
  const [incotermResult, setIncotermResult] = useState<IncotermResult | null>(null);

  // Notas
  const [notes, setNotes] = useState('');

  // ============================================================================
  // FETCH TENANT PRODUCTS
  // ============================================================================

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['tenant-products', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];

      const { data, error } = await supabase
        .from('tenant_products')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentTenant?.id && open,
  });

  // ============================================================================
  // TOGGLE PRODUCT
  // ============================================================================

  const toggleProduct = (product: any, quantity: number) => {
    const existing = selectedProducts.find(p => p.product_id === product.id);

    if (existing) {
      setSelectedProducts(prev =>
        prev.map(p =>
          p.product_id === product.id
            ? { ...p, quantity, total_usd: quantity * p.unit_price_usd }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          hs_code: product.hs_code,
          quantity,
          unit_price_usd: product.price_usd || 0,
          total_usd: quantity * (product.price_usd || 0),
        },
      ]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  // ============================================================================
  // GENERATE PROPOSAL (Edge Function)
  // ============================================================================

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant?.id || !currentWorkspace?.id) {
        throw new Error('Tenant ou workspace não identificado');
      }

      if (selectedProducts.length === 0) {
        throw new Error('Selecione ao menos 1 produto');
      }

      if (!incotermResult) {
        throw new Error('Configure o pricing primeiro');
      }

      console.log('[PROPOSAL] 📄 Gerando proposta comercial...');

      const { data, error } = await supabase.functions.invoke('generate-commercial-proposal', {
        body: {
          tenant_id: currentTenant.id,
          workspace_id: currentWorkspace.id,
          dealer: {
            id: dealer.id,
            name: dealer.name,
            country: dealer.country,
            city: dealer.city,
            decision_makers: dealer.decision_makers || [],
          },
          products: selectedProducts,
          incoterm: selectedIncoterm,
          pricing: incotermResult,
          notes,
        },
      });

      if (error) throw error;

      console.log('[PROPOSAL] Proposta gerada:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Proposta gerada e enviada!', {
        description: `PDF enviado para ${dealer.name}. Proposta #${data.proposal_number}`,
        duration: 5000,
      });

      // Abrir PDF em nova aba
      if (data.pdf_url) {
        window.open(data.pdf_url, '_blank');
      }

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['commercial-proposals'] });

      // Callback
      onProposalGenerated?.(data.proposal_id);

      // Fechar modal
      setOpen(false);

      // Reset
      setSelectedProducts([]);
      setIncotermResult(null);
      setStep('products');
      setNotes('');
    },
    onError: (error: any) => {
      console.error('[PROPOSAL] Erro:', error);
      toast.error('Erro ao gerar proposta', {
        description: error.message || 'Verifique o console',
      });
    },
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const subtotal = selectedProducts.reduce((sum, p) => sum + p.total_usd, 0);
  const totalWeight = selectedProducts.reduce(
    (sum, p) => sum + (p.quantity * 85), // Peso estimado (precisa vir do produto!)
    0
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar Proposta
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposta Comercial - {dealer.name}
          </DialogTitle>
          <DialogDescription>
            Selecione produtos, configure preços e gere PDF profissional
          </DialogDescription>
        </DialogHeader>

        {/* STEPS */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={step === 'products' ? 'default' : 'outline'} className="gap-1">
            <ShoppingCart className="h-3 w-3" />
            1. Produtos
          </Badge>
          <Badge variant={step === 'pricing' ? 'default' : 'outline'} className="gap-1">
            <DollarSign className="h-3 w-3" />
            2. Pricing
          </Badge>
          <Badge variant={step === 'review' ? 'default' : 'outline'} className="gap-1">
            <Eye className="h-3 w-3" />
            3. Revisão
          </Badge>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* STEP 1: SELECT PRODUCTS */}
          {step === 'products' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Selecione os Produtos</h3>

              {isLoadingProducts && (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}

              {!isLoadingProducts && (!products || products.length === 0) && (
                <Card className="p-8 text-center border-2 border-dashed">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="font-semibold mb-2">Catálogo vazio</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure produtos em /catalog antes de gerar propostas
                  </p>
                </Card>
              )}

              {products && products.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {products.map((product: any) => {
                    const isSelected = selectedProducts.some(p => p.product_id === product.id);
                    const selected = selectedProducts.find(p => p.product_id === product.id);

                    return (
                      <Card
                        key={product.id}
                        className={`p-4 ${isSelected ? 'border-2 border-primary bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                toggleProduct(product, product.moq || 1);
                              } else {
                                removeProduct(product.id);
                              }
                            }}
                          />

                          <div className="flex-1">
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                            {product.hs_code && (
                              <p className="text-xs text-muted-foreground">HS: {product.hs_code}</p>
                            )}

                            {isSelected && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">Qtd:</span>
                                  <Input
                                    type="number"
                                    className="w-24 h-8"
                                    min={product.moq || 1}
                                    value={selected?.quantity || 0}
                                    onChange={(e) =>
                                      toggleProduct(product, parseInt(e.target.value) || 1)
                                    }
                                  />
                                  <span className="text-xs">
                                    × USD {product.price_usd?.toLocaleString() || 0}
                                  </span>
                                </div>
                                <div className="text-sm font-semibold">
                                  Total: USD {selected?.total_usd.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {selectedProducts.length > 0 && (
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {selectedProducts.length} produto(s) selecionado(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} unidades totais
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">USD {subtotal.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                    </div>
                  </div>
                </Card>
              )}

              <Button
                onClick={() => setStep('pricing')}
                disabled={selectedProducts.length === 0}
                className="w-full"
              >
                Próximo: Configurar Pricing
              </Button>
            </div>
          )}

          {/* STEP 2: PRICING */}
          {step === 'pricing' && (
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setStep('products')}>
                ← Voltar para Produtos
              </Button>

              <PricingCalculator
                productValue={subtotal}
                destinationCountry={dealer.country}
                destinationPort={undefined} // Usuário informará
                onIncotermSelected={(incoterm, result) => {
                  setSelectedIncoterm(incoterm);
                  setIncotermResult(result);
                  setStep('review');
                }}
              />
            </div>
          )}

          {/* STEP 3: REVIEW & SEND */}
          {step === 'review' && incotermResult && (
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setStep('pricing')}>
                ← Voltar para Pricing
              </Button>

              <Card className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Revisão da Proposta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* DEALER INFO */}
                  <div>
                    <h4 className="font-semibold mb-2">Para:</h4>
                    <p className="text-sm">
                      <strong>{dealer.name}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dealer.city}, {dealer.country}
                    </p>
                    {dealer.decision_makers && dealer.decision_makers.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Attn: {dealer.decision_makers[0].name} ({dealer.decision_makers[0].title})
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* PRODUCTS */}
                  <div>
                    <h4 className="font-semibold mb-2">Produtos:</h4>
                    <div className="space-y-2">
                      {selectedProducts.map((p) => (
                        <div
                          key={p.product_id}
                          className="flex justify-between text-sm p-2 bg-background rounded"
                        >
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.quantity} units × USD {p.unit_price_usd.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold">USD {p.total_usd.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* PRICING */}
                  <div>
                    <h4 className="font-semibold mb-2">Incoterm: {selectedIncoterm}</h4>
                    <div className="space-y-1">
                      {incotermResult.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className={item.isNegative ? 'text-green-600' : 'text-muted-foreground'}>
                            {item.label}:
                          </span>
                          <span className={`font-mono ${item.isNegative ? 'text-green-600' : ''}`}>
                            {item.isNegative && '-'}USD {Math.abs(item.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL {selectedIncoterm}:</span>
                        <span>USD {incotermResult.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* NOTES */}
                  <div>
                    <h4 className="font-semibold mb-2">Notas (Opcional):</h4>
                    <Textarea
                      placeholder="Observações adicionais para o dealer..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* GENERATE BUTTON */}
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Gerando PDF e enviando email...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Gerar e Enviar Proposta
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

