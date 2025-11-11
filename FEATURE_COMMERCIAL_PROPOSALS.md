# 📄 SISTEMA DE PROPOSTAS COMERCIAIS B2B

---

## 🎯 OBJETIVO

Gerar propostas comerciais profissionais em PDF para enviar aos DEALERS/DISTRIBUIDORES descobertos.

---

## 🏗️ ARQUITETURA

### Tabela `commercial_proposals`:
```sql
CREATE TABLE commercial_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  workspace_id UUID REFERENCES workspaces(id),
  dealer_id UUID REFERENCES companies(id), -- Dealer/Distribuidor
  proposal_number TEXT UNIQUE, -- 'PROP-2025-001'
  
  -- Produtos selecionados
  products JSONB NOT NULL, -- [{ product_id, name, quantity, unit_price, total }]
  
  -- Preços
  subtotal_usd DECIMAL,
  shipping_cost_usd DECIMAL,
  total_value_usd DECIMAL,
  incoterm TEXT, -- 'FOB', 'CIF', 'DDP'
  
  -- Logística
  origin_port TEXT DEFAULT 'BRSSZ', -- Santos, Brasil
  destination_port TEXT,
  estimated_delivery_days INTEGER,
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'negotiating', 'accepted', 'rejected'
  viewed_at TIMESTAMP,
  valid_until DATE,
  
  -- Arquivos
  pdf_url TEXT,
  
  -- Notas
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_proposals_tenant ON commercial_proposals(tenant_id);
CREATE INDEX idx_proposals_dealer ON commercial_proposals(dealer_id);
CREATE INDEX idx_proposals_status ON commercial_proposals(status);
```

---

## 🎨 UI COMPONENT: `CommercialProposalGenerator`

### Fluxo do Usuário:

```
1️⃣ Usuário descobre Dealer (USA Fitness Distributor)
    ↓
2️⃣ Clica "Gerar Proposta"
    ↓
3️⃣ Abre modal com catálogo MetaLife (246 produtos)
    ↓
4️⃣ Seleciona produtos:
    ☑️ Reformer Infinity × 50 units
    ☑️ Reformer W23 × 30 units
    ☑️ Acessórios Kit × 100 units
    ↓
5️⃣ Configura Incoterm:
    ○ EXW (Ex Works)
    ○ FOB (Free on Board)
    ● CIF (Cost, Insurance, Freight) ← Selecionado
    ○ DDP (Delivered Duty Paid)
    ↓
6️⃣ Sistema calcula automaticamente:
    Subtotal: USD 142,500
    Shipping (CIF): USD 8,750
    Insurance: USD 1,425
    TOTAL: USD 152,675
    ↓
7️⃣ Preview do PDF
    ↓
8️⃣ [Gerar e Enviar]
    ↓
9️⃣ PDF gerado + Email enviado automaticamente
    ↓
🔟 Proposta salva no histórico
```

---

## 💻 CÓDIGO DO COMPONENT:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface SelectedProduct {
  product_id: string;
  name: string;
  quantity: number;
  unit_price_usd: number;
  total_usd: number;
}

export function CommercialProposalGenerator({ dealerId, dealerName }: { dealerId: string, dealerName: string }) {
  const { currentTenant } = useTenant();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [incoterm, setIncoterm] = useState<'FOB' | 'CIF' | 'DDP'>('CIF');
  const [shippingPort, setShippingPort] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar catálogo do tenant
  const { data: products } = useQuery(['tenant-products'], async () => {
    const { data } = await supabase
      .from('tenant_products')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .eq('is_active', true);
    return data || [];
  });

  // Toggle produto no carrinho
  function toggleProduct(product: any, quantity: number) {
    const existing = selectedProducts.find(p => p.product_id === product.id);
    
    if (existing) {
      setSelectedProducts(prev => 
        prev.map(p => p.product_id === product.id 
          ? { ...p, quantity, total_usd: quantity * p.unit_price_usd }
          : p
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, {
        product_id: product.id,
        name: product.name,
        quantity,
        unit_price_usd: product.price_usd,
        total_usd: quantity * product.price_usd
      }]);
    }
  }

  // Gerar e enviar proposta
  async function handleGenerateProposal() {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-commercial-proposal', {
        body: {
          dealer_id: dealerId,
          selected_products: selectedProducts,
          incoterm,
          shipping_port: shippingPort
        }
      });

      if (error) throw error;

      toast.success('✅ Proposta gerada e enviada!', {
        description: `PDF enviado para ${dealerName}`
      });
      
      // Abrir PDF em nova aba
      window.open(data.pdf_url, '_blank');
      
    } catch (err) {
      toast.error('Erro ao gerar proposta');
    } finally {
      setIsGenerating(false);
    }
  }

  const subtotal = selectedProducts.reduce((sum, p) => sum + p.total_usd, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Gerar Proposta
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Proposta Comercial - {dealerName}</DialogTitle>
        </DialogHeader>

        {/* 1. CATÁLOGO DE PRODUTOS */}
        <div className="space-y-4">
          <h3 className="font-semibold">1. Selecione os Produtos</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {products?.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={selectedProducts.some(p => p.product_id === product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        toggleProduct(product, product.moq || 1);
                      } else {
                        setSelectedProducts(prev => prev.filter(p => p.product_id !== product.id));
                      }
                    }}
                  />
                  
                  <div className="flex-1">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    <p className="text-xs text-muted-foreground">HS: {product.hs_code}</p>
                    
                    {selectedProducts.some(p => p.product_id === product.id) && (
                      <div className="mt-2 flex items-center gap-2">
                        <Label>Qtd:</Label>
                        <Input 
                          type="number"
                          className="w-24"
                          min={product.moq || 1}
                          value={selectedProducts.find(p => p.product_id === product.id)?.quantity || 0}
                          onChange={(e) => toggleProduct(product, parseInt(e.target.value))}
                        />
                        <span className="text-sm">× USD {product.price_usd}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 2. INCOTERM */}
        <div className="space-y-4">
          <h3 className="font-semibold">2. Selecione o Incoterm</h3>
          
          <Select value={incoterm} onValueChange={setIncoterm}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FOB">FOB (Free on Board) - Cliente paga frete</SelectItem>
              <SelectItem value="CIF">CIF (Cost, Insurance, Freight) - Inclui frete</SelectItem>
              <SelectItem value="DDP">DDP (Delivered Duty Paid) - Tudo incluso</SelectItem>
            </SelectContent>
          </Select>
          
          <Input 
            placeholder="Porto de destino (ex: Los Angeles, USA)"
            value={shippingPort}
            onChange={(e) => setShippingPort(e.target.value)}
          />
        </div>

        {/* 3. RESUMO */}
        <div className="space-y-2 p-4 bg-muted rounded">
          <h3 className="font-semibold">3. Resumo da Proposta</h3>
          
          <div className="space-y-1">
            {selectedProducts.map(p => (
              <div key={p.product_id} className="flex justify-between text-sm">
                <span>{p.name} × {p.quantity}</span>
                <span className="font-mono">USD {p.total_usd.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span>TOTAL ({incoterm}):</span>
              <span className="font-mono">USD {subtotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 4. AÇÕES */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateProposal}
            disabled={selectedProducts.length === 0 || !shippingPort || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando PDF...</>
            ) : (
              <><FileText className="h-4 w-4 mr-2" /> Gerar e Enviar Proposta</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📄 EXEMPLO DE PDF GERADO:

```
┌─────────────────────────────────────────────────────┐
│ [LOGO METALIFE]              COMMERCIAL PROPOSAL    │
│                                                     │
│ MetaLife Indústria e Comércio de Móveis S.A.       │
│ CNPJ: 06.334.616/0001-85                           │
│ Taubaté, São Paulo, Brazil                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ TO: USA Fitness Distributors Inc.                  │
│     Los Angeles, CA, USA                           │
│     Attn: John Smith (Procurement Manager)         │
│                                                     │
│ Proposal #: PROP-2025-001                          │
│ Date: November 10, 2025                            │
│ Valid Until: December 10, 2025 (30 days)           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ PRODUCTS:                                           │
│                                                     │
│ 1. Reformer Infinity Series                        │
│    HS Code: 9506.91.00                             │
│    Quantity: 50 units                              │
│    Unit Price: USD 2,450                           │
│    Total: USD 122,500                              │
│                                                     │
│ 2. Reformer W23 Series                             │
│    HS Code: 9506.91.00                             │
│    Quantity: 30 units                              │
│    Unit Price: USD 1,890                           │
│    Total: USD 56,700                               │
│                                                     │
│ 3. Accessories Kit                                 │
│    HS Code: 9506.99.00                             │
│    Quantity: 100 kits                              │
│    Unit Price: USD 150                             │
│    Total: USD 15,000                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ PRICING (CIF Los Angeles):                         │
│                                                     │
│ Subtotal FOB Santos:        USD 194,200            │
│ Ocean Freight:              USD   8,750            │
│ Insurance:                  USD   1,942            │
│ ───────────────────────────────────────            │
│ TOTAL CIF:                  USD 204,892            │
│                                                     │
│ Payment Terms: 30% advance, 70% at BL              │
│ Lead Time: 45-60 days from order confirmation      │
│ Origin Port: Santos, Brazil (BRSSZ)                │
│ Destination Port: Los Angeles, USA (USLAX)         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ CERTIFICATIONS:                                     │
│ ✅ ISO 9001:2015 (Quality Management)              │
│ ✅ FSC (Furniture components)                      │
│                                                     │
│ AFTER-SALES:                                        │
│ ✅ 2-year warranty on all equipment                │
│ ✅ English-speaking support                        │
│ ✅ Replacement parts available                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Contact: export@metalifepilates.com.br             │
│ Phone: +55 12 0800-056-2467                        │
│ Website: https://metalifepilates.com.br/           │
│                                                     │
│ We look forward to your partnership!               │
│                                                     │
│ Best regards,                                       │
│ MetaLife Export Team                               │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW COMPLETO:

```
DESCOBRIR DEALER
    ↓
[Gerar Proposta]
    ↓
Selecionar Produtos do Catálogo
    ↓
Configurar Incoterm
    ↓
Sistema Calcula Preços Automaticamente
    ↓
Preview PDF
    ↓
[Enviar]
    ↓
Email automático para Dealer
    ↓
Proposta salva no histórico
    ↓
Tracking de status (viewed, negotiating, accepted)
```

---

## 📧 EMAIL AUTOMÁTICO:

```
Subject: Commercial Proposal - MetaLife Pilates Equipment

Dear John Smith,

Thank you for your interest in MetaLife products.

Please find attached our commercial proposal PROP-2025-001 
for your review.

Proposal Summary:
• Products: Reformer Infinity (50), W23 (30), Accessories (100)
• Total Value: USD 204,892 CIF Los Angeles
• Lead Time: 45-60 days
• Valid Until: December 10, 2025

📎 Attachment: PROP-2025-001.pdf

Should you have any questions, please don't hesitate to contact us.

Best regards,
MetaLife Export Team
export@metalifepilates.com.br
```

---

## 🎯 FEATURES ADICIONAIS:

### 1. Histórico de Propostas (Por Dealer):
```
Dealer: USA Fitness Distributors Inc.

Propostas Enviadas:
┌─────────────────────────────────────────┐
│ PROP-2025-001 | USD 204K | CIF | Sent  │
│ Status: ⏳ Awaiting response            │
│ Sent: Nov 10, 2025                      │
│ Valid: Dec 10, 2025                     │
│ [Ver PDF] [Follow-up] [Duplicate]      │
└─────────────────────────────────────────┘
```

### 2. Tracking de Propostas:
```
📊 Pipeline de Propostas

Draft (5)
    ↓
Sent (12)
    ↓
Viewed (8) ← Dealer abriu PDF
    ↓
Negotiating (3) ← Em discussão
    ↓
Accepted (2) ← Deal fechado! 🎉
```

### 3. Template de Proposta (Customizável):
```
Admin pode configurar:
- Logo
- Cores
- Payment terms
- Warranty details
- Contact info
```

---

## 🚀 IMPLEMENTAÇÃO (FASE 6):

Cursor vai criar:

1. ✅ `CommercialProposalGenerator.tsx` component
2. ✅ Edge Function `generate-commercial-proposal`
3. ✅ PDF generator (jsPDF)
4. ✅ Email sender (SendGrid/Resend)
5. ✅ Tabela `commercial_proposals`
6. ✅ Storage bucket para PDFs
7. ✅ Tracking de status
8. ✅ Histórico por dealer

---

## ✅ RESULTADO FINAL:

**MetaLife descobre dealer USA:**
1. ✅ Clica "Gerar Proposta"
2. ✅ Seleciona produtos do catálogo
3. ✅ Sistema calcula preços (CIF LA)
4. ✅ Gera PDF profissional
5. ✅ Envia email automático
6. ✅ Salva no histórico
7. ✅ Tracking de resposta

**Tudo dentro da plataforma! Nenhum trabalho manual!** 🚀

