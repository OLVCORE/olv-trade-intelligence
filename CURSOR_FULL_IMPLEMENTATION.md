# 🚀 IMPLEMENTAÇÃO COMPLETA - V1.0 + FASE 7

---

## 🎯 OBJETIVO

Implementar **PLATAFORMA COMPLETA END-TO-END** antes de apresentar para MetaLife:

1. ✅ Finalizar itens 6.10-6.12 (emojis, Freightos, summary)
2. ✅ Implementar FASE 7 COMPLETA (Dealer Relationship Management)
3. ✅ Commit v1.1.0
4. ✅ PRONTO PARA APRESENTAÇÃO!

---

## 📋 PARTE 1: FINALIZAR V1.0 (1-2h)

### **Já em andamento pelo Cursor:**

1. ✅ Remover todos os emojis (substituir por ícones Lucide)
2. ✅ Integrar Freightos API em `src/lib/shippingCalculator.ts`
3. ✅ Criar `src/data/ports.ts` (115 portos)
4. ✅ Atualizar `FINAL_PROJECT_SUMMARY.md`
5. ✅ Commit + push + tag v1.0.0

**Aguardar Cursor finalizar antes de continuar!**

---

## 📋 PARTE 2: IMPLEMENTAR FASE 7 (8-10h)

### **Referência completa:** `PHASE_7_DEALER_RELATIONSHIP_MANAGEMENT.md`

---

### **PASSO 1: Database Migrations**

Criar arquivo `supabase/migrations/20251111000003_dealer_relationship_management.sql`:

```sql
-- =====================================================
-- FASE 7: DEALER RELATIONSHIP MANAGEMENT (DRM)
-- =====================================================

-- 1. TABELA: dealer_contracts (Contratos 1-5 anos)
CREATE TABLE dealer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados do Contrato
  contract_number TEXT UNIQUE NOT NULL,
  signed_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  auto_renewal BOOLEAN DEFAULT false,
  
  -- Produtos Contratados
  products JSONB NOT NULL DEFAULT '[]',
  
  -- Metas
  sales_target_usd DECIMAL(15,2),
  sales_target_units INTEGER,
  frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
  
  -- Territórios
  exclusive_territories TEXT[] DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  
  -- Termos Comerciais
  payment_terms TEXT,
  default_incoterm TEXT DEFAULT 'CIF',
  minimum_order_value_usd DECIMAL(15,2),
  discount_volume JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'active', -- 'draft', 'active', 'suspended', 'expired', 'terminated'
  
  -- Arquivos
  contract_pdf_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_dealer_contracts_dealer ON dealer_contracts(dealer_id);
CREATE INDEX idx_dealer_contracts_status ON dealer_contracts(status);
CREATE INDEX idx_dealer_contracts_end_date ON dealer_contracts(end_date);
CREATE INDEX idx_dealer_contracts_tenant ON dealer_contracts(tenant_id);

-- RLS
ALTER TABLE dealer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON dealer_contracts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- =====================================================

-- 2. TABELA: dealer_orders (Pedidos Recorrentes)
CREATE TABLE dealer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES dealer_contracts(id) ON DELETE CASCADE,
  
  -- Dados do Pedido
  order_number TEXT UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  requested_delivery_date DATE,
  confirmed_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Produtos
  products JSONB NOT NULL DEFAULT '[]',
  
  -- Valores
  subtotal_usd DECIMAL(15,2) NOT NULL,
  discount_usd DECIMAL(15,2) DEFAULT 0,
  shipping_usd DECIMAL(15,2) DEFAULT 0,
  total_usd DECIMAL(15,2) NOT NULL,
  
  -- Logística
  incoterm TEXT DEFAULT 'CIF',
  shipping_mode TEXT, -- 'ocean', 'air', 'road', 'rail'
  origin_port TEXT,
  destination_port TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled'
  production_status TEXT, -- 'queued', 'manufacturing', 'quality_check', 'ready'
  shipping_tracking TEXT,
  
  -- Documentos
  invoice_pdf_url TEXT,
  packing_list_pdf_url TEXT,
  bl_pdf_url TEXT,
  
  -- Notas
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dealer_orders_dealer ON dealer_orders(dealer_id);
CREATE INDEX idx_dealer_orders_contract ON dealer_orders(contract_id);
CREATE INDEX idx_dealer_orders_status ON dealer_orders(status);
CREATE INDEX idx_dealer_orders_date ON dealer_orders(order_date DESC);
CREATE INDEX idx_dealer_orders_tenant ON dealer_orders(tenant_id);

-- RLS
ALTER TABLE dealer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON dealer_orders
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- =====================================================

-- 3. TABELA: dealer_performance (Metas & Performance)
CREATE TABLE dealer_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES dealer_contracts(id) ON DELETE CASCADE,
  
  -- Período
  year INTEGER NOT NULL,
  quarter INTEGER, -- 1, 2, 3, 4 (NULL para anual)
  month INTEGER, -- 1-12 (NULL para trimestral/anual)
  
  -- Metas vs Realizado
  target_usd DECIMAL(15,2),
  achieved_usd DECIMAL(15,2) DEFAULT 0,
  achievement_percentage DECIMAL(5,2) DEFAULT 0,
  
  target_units INTEGER,
  achieved_units INTEGER DEFAULT 0,
  
  -- Métricas
  orders_count INTEGER DEFAULT 0,
  avg_order_value_usd DECIMAL(15,2),
  repeat_order_rate DECIMAL(5,2), -- % de recompra
  
  -- Rankings
  rank_region INTEGER,
  rank_global INTEGER,
  
  -- Scoring
  score DECIMAL(5,2) DEFAULT 0, -- 0-100
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(dealer_id, year, quarter, month)
);

CREATE INDEX idx_dealer_performance_dealer ON dealer_performance(dealer_id);
CREATE INDEX idx_dealer_performance_period ON dealer_performance(year, quarter, month);
CREATE INDEX idx_dealer_performance_score ON dealer_performance(score DESC);
CREATE INDEX idx_dealer_performance_tier ON dealer_performance(tier);

-- =====================================================

-- 4. TABELA: marketing_materials (Biblioteca de Materiais)
CREATE TABLE marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Material
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'brochure', 'catalog', 'video', 'presentation', 'banner', 'social_media'
  category TEXT, -- 'product', 'brand', 'campaign'
  language TEXT DEFAULT 'en', -- 'en', 'es', 'de', 'pt', 'zh', 'ja'
  
  -- Arquivo
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'jpg', 'mp4', 'pptx', 'png'
  file_size_mb DECIMAL(8,2),
  thumbnail_url TEXT,
  
  -- Produtos Relacionados
  products TEXT[] DEFAULT '{}',
  
  -- Acesso
  is_public BOOLEAN DEFAULT false,
  allowed_dealers UUID[], -- IDs dos dealers (NULL = todos)
  
  -- Métricas
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketing_materials_tenant ON marketing_materials(tenant_id);
CREATE INDEX idx_marketing_materials_type ON marketing_materials(type);
CREATE INDEX idx_marketing_materials_language ON marketing_materials(language);
CREATE INDEX idx_marketing_materials_downloads ON marketing_materials(downloads_count DESC);

-- RLS
ALTER TABLE marketing_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON marketing_materials
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- =====================================================

-- 5. TABELA: dealer_incentives (Gamificação & Bônus)
CREATE TABLE dealer_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Incentivo
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'volume_discount', 'early_payment', 'quarterly_bonus', 'market_development_fund', 'referral'
  
  -- Condições
  min_purchase_usd DECIMAL(15,2),
  min_purchase_units INTEGER,
  period TEXT, -- 'monthly', 'quarterly', 'yearly'
  
  -- Recompensa
  discount_percentage DECIMAL(5,2),
  bonus_usd DECIMAL(15,2),
  free_products JSONB DEFAULT '[]',
  
  -- Marketing Fund (MDF)
  mdf_percentage DECIMAL(5,2),
  mdf_max_usd DECIMAL(15,2),
  
  -- Validade
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Dealers Elegíveis
  applies_to TEXT DEFAULT 'all', -- 'all', 'tier', 'specific'
  tiers TEXT[] DEFAULT '{}', -- ['gold', 'platinum']
  dealers UUID[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dealer_incentives_tenant ON dealer_incentives(tenant_id);
CREATE INDEX idx_dealer_incentives_active ON dealer_incentives(is_active);
CREATE INDEX idx_dealer_incentives_valid ON dealer_incentives(valid_from, valid_until);

-- RLS
ALTER TABLE dealer_incentives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON dealer_incentives
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- =====================================================

-- 6. FUNÇÃO: Atualizar performance automaticamente
CREATE OR REPLACE FUNCTION update_dealer_performance()
RETURNS TRIGGER AS $$
DECLARE
  perf_record RECORD;
  total_achieved DECIMAL;
  total_units INTEGER;
  orders_count INTEGER;
BEGIN
  -- Buscar ou criar registro de performance
  SELECT * INTO perf_record
  FROM dealer_performance
  WHERE dealer_id = NEW.dealer_id
    AND contract_id = NEW.contract_id
    AND year = EXTRACT(YEAR FROM NEW.order_date)
    AND month = EXTRACT(MONTH FROM NEW.order_date);
  
  -- Calcular totais
  SELECT 
    COALESCE(SUM(total_usd), 0),
    COALESCE(SUM((p->>'quantity')::INTEGER), 0),
    COUNT(*)
  INTO total_achieved, total_units, orders_count
  FROM dealer_orders, jsonb_array_elements(products) AS p
  WHERE dealer_id = NEW.dealer_id
    AND contract_id = NEW.contract_id
    AND EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NEW.order_date)
    AND EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM NEW.order_date)
    AND status NOT IN ('cancelled');
  
  IF perf_record IS NULL THEN
    -- Criar novo registro
    INSERT INTO dealer_performance (
      dealer_id,
      contract_id,
      year,
      month,
      achieved_usd,
      achieved_units,
      orders_count
    ) VALUES (
      NEW.dealer_id,
      NEW.contract_id,
      EXTRACT(YEAR FROM NEW.order_date),
      EXTRACT(MONTH FROM NEW.order_date),
      total_achieved,
      total_units,
      orders_count
    );
  ELSE
    -- Atualizar registro existente
    UPDATE dealer_performance
    SET 
      achieved_usd = total_achieved,
      achieved_units = total_units,
      orders_count = orders_count,
      achievement_percentage = CASE 
        WHEN target_usd > 0 THEN (total_achieved / target_usd) * 100
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = perf_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar performance
CREATE TRIGGER trigger_update_performance
AFTER INSERT OR UPDATE ON dealer_orders
FOR EACH ROW
EXECUTE FUNCTION update_dealer_performance();

-- =====================================================

-- 7. VIEW: Dashboard de Performance
CREATE OR REPLACE VIEW dealer_performance_dashboard AS
SELECT 
  dp.*,
  c.company_name AS dealer_name,
  c.city,
  c.state,
  c.country,
  dc.contract_number,
  dc.sales_target_usd AS contract_target_usd,
  dc.sales_target_units AS contract_target_units,
  CASE 
    WHEN dp.achievement_percentage >= 120 THEN '🔥 Excepcional'
    WHEN dp.achievement_percentage >= 100 THEN '✅ Meta Batida'
    WHEN dp.achievement_percentage >= 80 THEN '⚠️ Atenção'
    ELSE '🚨 Crítico'
  END AS status_label
FROM dealer_performance dp
JOIN companies c ON c.id = dp.dealer_id
JOIN dealer_contracts dc ON dc.id = dp.contract_id
ORDER BY dp.score DESC, dp.achievement_percentage DESC;

-- =====================================================

COMMENT ON TABLE dealer_contracts IS 'Contratos com dealers (1-5 anos)';
COMMENT ON TABLE dealer_orders IS 'Pedidos recorrentes de dealers';
COMMENT ON TABLE dealer_performance IS 'Performance vs metas (mensal/trimestral/anual)';
COMMENT ON TABLE marketing_materials IS 'Biblioteca de materiais de vendas';
COMMENT ON TABLE dealer_incentives IS 'Incentivos e gamificação';
```

---

### **PASSO 2: Criar Componentes UI**

#### **2.1. `src/components/dealer/DealerContractManager.tsx`**

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSignature, Calendar, Target, Globe, DollarSign, Percent } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Product {
  id: string;
  name: string;
  price_usd: number;
  min_order_qty: number;
}

interface VolumeDiscount {
  min_units: number;
  discount_percentage: number;
}

export function DealerContractManager({ dealerId, dealerName, onSuccess }: {
  dealerId: string;
  dealerName: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    duration_months: 12,
    start_date: new Date().toISOString().split('T')[0],
    sales_target_usd: 0,
    sales_target_units: 0,
    frequency: 'monthly',
    payment_terms: '30% advance, 70% at BL',
    default_incoterm: 'CIF',
    exclusive_territories: [] as string[],
    countries: [] as string[],
    products: [] as Product[],
    discount_volume: [] as VolumeDiscount[],
    auto_renewal: false
  });
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Calcular end_date
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + formData.duration_months);
      
      // Gerar contract_number
      const contractNumber = `CONT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      
      const payload = {
        ...formData,
        dealer_id: dealerId,
        contract_number: contractNumber,
        end_date: endDate.toISOString().split('T')[0],
        signed_date: formData.start_date,
        status: 'active',
        tenant_id: import.meta.env.VITE_TENANT_ID || 'default'
      };
      
      const response = await fetch('/api/dealer-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to create contract');
      
      toast({
        title: 'Contrato criado com sucesso!',
        description: `Número: ${contractNumber}`
      });
      
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Erro ao criar contrato',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Novo Contrato - {dealerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duração */}
        <div>
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Duração do Contrato
          </Label>
          <Select 
            value={formData.duration_months.toString()} 
            onValueChange={(v) => setFormData({...formData, duration_months: parseInt(v)})}
          >
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">1 ano (12 meses)</SelectItem>
              <SelectItem value="24">2 anos (24 meses)</SelectItem>
              <SelectItem value="36">3 anos (36 meses)</SelectItem>
              <SelectItem value="60">5 anos (60 meses)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Meta de Vendas */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="target_usd" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Meta Anual (USD)
            </Label>
            <Input
              id="target_usd"
              type="number"
              placeholder="Ex: 500000"
              value={formData.sales_target_usd || ''}
              onChange={(e) => setFormData({...formData, sales_target_usd: parseFloat(e.target.value)})}
            />
          </div>
          
          <div>
            <Label htmlFor="target_units" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Meta Unidades
            </Label>
            <Input
              id="target_units"
              type="number"
              placeholder="Ex: 500"
              value={formData.sales_target_units || ''}
              onChange={(e) => setFormData({...formData, sales_target_units: parseInt(e.target.value)})}
            />
          </div>
        </div>
        
        {/* Incoterm Padrão */}
        <div>
          <Label htmlFor="incoterm">Incoterm Padrão</Label>
          <Select 
            value={formData.default_incoterm} 
            onValueChange={(v) => setFormData({...formData, default_incoterm: v})}
          >
            <SelectTrigger id="incoterm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXW">EXW - Ex Works</SelectItem>
              <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
              <SelectItem value="FOB">FOB - Free On Board</SelectItem>
              <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
              <SelectItem value="CIF">CIF - Cost, Insurance and Freight</SelectItem>
              <SelectItem value="DAP">DAP - Delivered At Place</SelectItem>
              <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Botões */}
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            <FileSignature className="h-4 w-4 mr-2" />
            {loading ? 'Criando...' : 'Criar Contrato'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

#### **2.2. `src/pages/DealerPortalPage.tsx` (Self-Service)**

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, ShoppingCart, Package, Image, BarChart } from 'lucide-react';
import { DealerPerformanceDashboard } from '@/components/dealer/DealerPerformanceDashboard';
import { DealerOrderManager } from '@/components/dealer/DealerOrderManager';

export function DealerPortalPage() {
  // Simular dealer logado (na prática, pegar do auth)
  const currentDealer = {
    id: 'dealer-123',
    name: 'ABC Pilates Studio',
    logo: '/logos/abc-studio.png'
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logos/metalife.png" alt="MetaLife" className="h-10" />
          <div className="border-l pl-4">
            <h2 className="font-semibold">{currentDealer.name}</h2>
            <p className="text-xs text-muted-foreground">Dealer Portal</p>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Package className="h-4 w-4 mr-2" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="marketing">
              <Image className="h-4 w-4 mr-2" />
              Marketing
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <DealerPerformanceDashboard dealerId={currentDealer.id} />
          </TabsContent>
          
          <TabsContent value="orders">
            <DealerOrderManager dealerId={currentDealer.id} />
          </TabsContent>
          
          {/* Outras tabs... */}
        </Tabs>
      </div>
    </div>
  );
}
```

---

### **PASSO 3: Integrar no Sidebar**

Atualizar `src/components/layout/AppSidebar.tsx`:

```typescript
// Adicionar novo menu item
{
  id: 'dealer-portal',
  label: 'Dealer Portal',
  icon: Users,
  path: '/dealer-portal',
  workspaces: ['export', 'import']
},
{
  id: 'contracts',
  label: 'Contratos',
  icon: FileSignature,
  path: '/contracts',
  workspaces: ['export', 'import']
}
```

---

### **PASSO 4: Criar Rotas**

Atualizar `src/App.tsx`:

```typescript
// Adicionar rotas
<Route path="/dealer-portal" element={<DealerPortalPage />} />
<Route path="/contracts" element={<ContractsPage />} />
```

---

### **PASSO 5: Edge Function - AI Recommendations**

Criar `supabase/functions/ai-dealer-recommendations/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!
});

serve(async (req) => {
  try {
    const { dealer_id } = await req.json();
    
    // Buscar dados do dealer
    const { data: dealer } = await supabase
      .from('companies')
      .select('*')
      .eq('id', dealer_id)
      .single();
    
    // Buscar performance
    const { data: performance } = await supabase
      .from('dealer_performance')
      .select('*')
      .eq('dealer_id', dealer_id)
      .order('year', { ascending: false })
      .limit(1)
      .single();
    
    // Buscar últimos pedidos
    const { data: orders } = await supabase
      .from('dealer_orders')
      .select('*')
      .eq('dealer_id', dealer_id)
      .order('order_date', { ascending: false })
      .limit(5);
    
    // IA analisa e recomenda
    const prompt = `
Analise este dealer e recomende ações:

**Dealer:** ${dealer.company_name}
**País:** ${dealer.country}
**Tier:** ${performance?.tier || 'N/A'}
**Performance:** ${performance?.achievement_percentage || 0}%
**Último pedido:** ${orders?.[0]?.order_date || 'Nunca'}
**Produtos comprados:** ${orders?.map(o => JSON.parse(o.products)).flat().map(p => p.name).join(', ')}

Recomende:
1. **Upsell** (produtos complementares)
2. **Cross-sell** (novas linhas)
3. **Ações** (se performance baixa)
4. **Expansão** (se performance alta)

Seja específico e prático.
    `;
    
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        recommendations: aiResponse.choices[0].message.content
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## ✅ CHECKLIST IMPLEMENTAÇÃO FASE 7

- [ ] Executar migration `20251111000003_dealer_relationship_management.sql` no Supabase
- [ ] Criar `src/components/dealer/DealerContractManager.tsx`
- [ ] Criar `src/components/dealer/DealerPerformanceDashboard.tsx`
- [ ] Criar `src/components/dealer/DealerOrderManager.tsx`
- [ ] Criar `src/components/dealer/MarketingMaterialsLibrary.tsx`
- [ ] Criar `src/pages/DealerPortalPage.tsx`
- [ ] Criar `src/pages/ContractsPage.tsx`
- [ ] Atualizar `AppSidebar.tsx` (novos menu items)
- [ ] Atualizar `App.tsx` (novas rotas)
- [ ] Criar Edge Function `ai-dealer-recommendations`
- [ ] Deploy Edge Function
- [ ] Testar fluxo completo

---

## 🎯 APÓS COMPLETAR

```bash
git add .
git commit -m "feat: FASE 7 COMPLETA - Dealer Relationship Management

IMPLEMENTADO:
- 5 novas tabelas (contracts, orders, performance, materials, incentives)
- 7 componentes UI profissionais
- Dealer Portal (self-service)
- Sistema de gamificação (Bronze → Platinum)
- AI recommendations
- Performance monitoring
- Gestão de metas

ESTATISTICAS:
- 15+ arquivos novos
- 3,000+ linhas código
- Sistema end-to-end COMPLETO

PRONTO PARA APRESENTACAO METALIFE!"

git push
git tag -a v1.1.0 -m "v1.1.0 - Dealer Relationship Management Complete"
git push --tags
```

---

## 🚀 RESULTADO FINAL

**Plataforma COMPLETA end-to-end:**

```
Descobrir → Analisar → Propor → Contratar → Executar → Monitorar → Renovar
```

**Diferencial competitivo CRÍTICO:** Nenhum concorrente tem isso!

**MetaLife pode:**
- ✅ Descobrir dealers globalmente
- ✅ Gerar propostas automaticamente
- ✅ GERENCIAR CONTRATOS (1-5 anos)
- ✅ MONITORAR PERFORMANCE
- ✅ PORTAL SELF-SERVICE
- ✅ GAMIFICAÇÃO
- ✅ MATERIAIS DE MARKETING

= **FECHAMENTO GARANTIDO!** 🎯

---

**OBS:** FASE 8 (Premium APIs) fica apenas documentada em `PHASE_8_PREMIUM_APIS.md`, NÃO implementar agora!

