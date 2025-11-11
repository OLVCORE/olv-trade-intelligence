# 🤝 FASE 7: DEALER RELATIONSHIP MANAGEMENT (DRM)

---

## 🎯 OBJETIVO

Gerenciar todo o ciclo pós-venda com dealers/distribuidores:
- ✅ Contratos assinados (1-5 anos)
- ✅ Metas de vendas (tracking mensal/trimestral)
- ✅ Pedidos recorrentes (orders)
- ✅ Performance monitoring (dashboards)
- ✅ Materiais de marketing (sales enablement)
- ✅ Gamificação (rankings, incentivos)
- ✅ Dealer Portal (self-service)

---

## 🗂️ DATABASE SCHEMA

### 1. Tabela `dealer_contracts`:

```sql
CREATE TABLE dealer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  workspace_id UUID REFERENCES workspaces(id),
  dealer_id UUID REFERENCES companies(id), -- Dealer/Distribuidor
  
  -- Dados do Contrato
  contract_number TEXT UNIQUE, -- 'CONT-2025-001'
  signed_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER, -- 12, 24, 36, 60
  auto_renewal BOOLEAN DEFAULT false,
  
  -- Produtos Contratados
  products JSONB NOT NULL, -- [{ product_id, name, min_order_qty, price_usd }]
  
  -- Metas
  sales_target_usd DECIMAL, -- Meta total USD
  sales_target_units INTEGER, -- Meta total unidades
  frequency TEXT, -- 'monthly', 'quarterly', 'yearly'
  
  -- Territórios
  exclusive_territories TEXT[], -- ['California', 'Nevada', 'Arizona']
  countries TEXT[], -- ['US']
  
  -- Termos Comerciais
  payment_terms TEXT, -- '30% advance, 70% at BL'
  default_incoterm TEXT, -- 'CIF'
  minimum_order_value_usd DECIMAL,
  discount_volume JSONB, -- [{ min_units: 100, discount: 0.05 }, ...]
  
  -- Status
  status TEXT DEFAULT 'active', -- 'draft', 'active', 'suspended', 'expired', 'terminated'
  
  -- Arquivos
  contract_pdf_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_contracts_dealer ON dealer_contracts(dealer_id);
CREATE INDEX idx_contracts_status ON dealer_contracts(status);
CREATE INDEX idx_contracts_end_date ON dealer_contracts(end_date);
```

### 2. Tabela `dealer_orders`:

```sql
CREATE TABLE dealer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  dealer_id UUID REFERENCES companies(id),
  contract_id UUID REFERENCES dealer_contracts(id),
  
  -- Dados do Pedido
  order_number TEXT UNIQUE, -- 'ORD-2025-001'
  order_date DATE NOT NULL,
  requested_delivery_date DATE,
  confirmed_delivery_date DATE,
  
  -- Produtos
  products JSONB NOT NULL, -- [{ product_id, name, quantity, unit_price, total }]
  
  -- Valores
  subtotal_usd DECIMAL,
  discount_usd DECIMAL,
  shipping_usd DECIMAL,
  total_usd DECIMAL,
  
  -- Logística
  incoterm TEXT,
  shipping_mode TEXT, -- 'ocean', 'air', 'road'
  origin_port TEXT,
  destination_port TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled'
  production_status TEXT, -- 'queued', 'manufacturing', 'quality_check', 'ready'
  shipping_tracking TEXT, -- Código de rastreio
  
  -- Documentos
  invoice_pdf_url TEXT,
  packing_list_pdf_url TEXT,
  bl_pdf_url TEXT, -- Bill of Lading
  
  -- Notas
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_dealer ON dealer_orders(dealer_id);
CREATE INDEX idx_orders_contract ON dealer_orders(contract_id);
CREATE INDEX idx_orders_status ON dealer_orders(status);
CREATE INDEX idx_orders_date ON dealer_orders(order_date DESC);
```

### 3. Tabela `dealer_performance`:

```sql
CREATE TABLE dealer_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES companies(id),
  contract_id UUID REFERENCES dealer_contracts(id),
  
  -- Período
  year INTEGER NOT NULL,
  quarter INTEGER, -- 1, 2, 3, 4 (NULL para anual)
  month INTEGER, -- 1-12 (NULL para trimestral/anual)
  
  -- Metas vs Realizado
  target_usd DECIMAL,
  achieved_usd DECIMAL,
  achievement_percentage DECIMAL, -- (achieved / target) * 100
  
  target_units INTEGER,
  achieved_units INTEGER,
  
  -- Métricas
  orders_count INTEGER DEFAULT 0,
  avg_order_value_usd DECIMAL,
  repeat_order_rate DECIMAL, -- % de recompra
  
  -- Rankings
  rank_region INTEGER, -- Ranking na região
  rank_global INTEGER, -- Ranking global
  
  -- Notas
  score DECIMAL, -- 0-100 (performance score)
  tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(dealer_id, year, quarter, month)
);

CREATE INDEX idx_performance_dealer ON dealer_performance(dealer_id);
CREATE INDEX idx_performance_period ON dealer_performance(year, quarter, month);
CREATE INDEX idx_performance_score ON dealer_performance(score DESC);
```

### 4. Tabela `marketing_materials`:

```sql
CREATE TABLE marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Material
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'brochure', 'catalog', 'video', 'presentation', 'banner', 'social_media'
  category TEXT, -- 'product', 'brand', 'campaign'
  language TEXT, -- 'en', 'es', 'de', 'pt'
  
  -- Arquivo
  file_url TEXT,
  file_type TEXT, -- 'pdf', 'jpg', 'mp4', 'pptx'
  file_size_mb DECIMAL,
  thumbnail_url TEXT,
  
  -- Produtos Relacionados
  products TEXT[], -- IDs dos produtos
  
  -- Acesso
  is_public BOOLEAN DEFAULT false,
  allowed_dealers UUID[], -- IDs dos dealers (NULL = todos)
  
  -- Métricas
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_materials_tenant ON marketing_materials(tenant_id);
CREATE INDEX idx_materials_type ON marketing_materials(type);
CREATE INDEX idx_materials_language ON marketing_materials(language);
```

### 5. Tabela `dealer_incentives`:

```sql
CREATE TABLE dealer_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Incentivo
  name TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'volume_discount', 'early_payment', 'quarterly_bonus', 'market_development_fund'
  
  -- Condições
  min_purchase_usd DECIMAL,
  min_purchase_units INTEGER,
  period TEXT, -- 'monthly', 'quarterly', 'yearly'
  
  -- Recompensa
  discount_percentage DECIMAL,
  bonus_usd DECIMAL,
  free_products JSONB, -- [{ product_id, quantity }]
  
  -- Marketing Fund (MDF)
  mdf_percentage DECIMAL, -- % das vendas para marketing
  mdf_max_usd DECIMAL,
  
  -- Validade
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Dealers Elegíveis
  applies_to TEXT, -- 'all', 'tier', 'specific'
  tiers TEXT[], -- ['gold', 'platinum']
  dealers UUID[], -- IDs específicos
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incentives_tenant ON dealer_incentives(tenant_id);
CREATE INDEX idx_incentives_active ON dealer_incentives(is_active);
```

---

## 🎨 UI COMPONENTS

### 1. DealerContractManager.tsx

```typescript
/**
 * GESTÃO DE CONTRATOS
 * 
 * Features:
 * - Criar contrato a partir de proposta aceita
 * - Definir metas (USD, units, frequência)
 * - Territórios exclusivos
 * - Termos comerciais (payment, Incoterm padrão)
 * - Descontos por volume
 * - Gerar PDF do contrato
 * - E-signature (DocuSign ou manual)
 */

<Card>
  <CardHeader>
    <CardTitle>
      <FileSignature className="h-5 w-5 inline mr-2" />
      Novo Contrato - {dealerName}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Step 1: Dados básicos */}
    <div>
      <Label>Duração do Contrato</Label>
      <Select value={duration} onValueChange={setDuration}>
        <SelectItem value="12">1 ano (12 meses)</SelectItem>
        <SelectItem value="24">2 anos (24 meses)</SelectItem>
        <SelectItem value="36">3 anos (36 meses)</SelectItem>
        <SelectItem value="60">5 anos (60 meses)</SelectItem>
      </Select>
    </div>
    
    {/* Step 2: Produtos e Metas */}
    <div>
      <Label>Meta de Vendas Anual (USD)</Label>
      <Input 
        type="number"
        placeholder="Ex: 500000 (USD 500K)"
        value={targetUSD || ''}
      />
    </div>
    
    {/* Step 3: Territórios exclusivos */}
    <div>
      <Label>Territórios Exclusivos</Label>
      <MultiSelect 
        options={states}
        placeholder="Selecione estados/regiões..."
      />
    </div>
    
    {/* Step 4: Descontos por volume */}
    <VolumeDiscountBuilder />
    
    {/* Step 5: Gerar contrato */}
    <Button onClick={generateContract}>
      <FileText className="h-4 w-4 mr-2" />
      Gerar Contrato
    </Button>
  </CardContent>
</Card>
```

---

### 2. DealerPerformanceDashboard.tsx

```typescript
/**
 * DASHBOARD DE PERFORMANCE DO DEALER
 * 
 * Features:
 * - Gráficos: Meta vs Realizado (mensal, trimestral, anual)
 * - Score de performance (0-100)
 * - Tier atual (Bronze, Silver, Gold, Platinum)
 * - Ranking (regional e global)
 * - Histórico de pedidos
 * - Próximas metas
 * - Incentivos disponíveis
 */

<div className="grid grid-cols-3 gap-4">
  {/* Card 1: Meta Anual */}
  <Card>
    <CardHeader>
      <CardTitle>
        <Target className="h-4 w-4 inline mr-2" />
        Meta Anual 2025
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        USD {achieved.toLocaleString()} 
        <span className="text-sm text-muted-foreground">
          / {target.toLocaleString()}
        </span>
      </div>
      <Progress value={achievementPercentage} className="mt-2" />
      <p className="text-sm mt-1">
        {achievementPercentage}% alcançado
      </p>
    </CardContent>
  </Card>
  
  {/* Card 2: Tier Atual */}
  <Card>
    <CardHeader>
      <CardTitle>
        <Award className="h-4 w-4 inline mr-2" />
        Tier Atual
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Badge className="text-xl px-4 py-2" variant={tierColor}>
        <Star className="h-5 w-5 inline mr-2" />
        {tier.toUpperCase()}
      </Badge>
      <p className="text-xs mt-2">
        Próximo tier: {nextTier} (faltam USD {gapToNextTier}K)
      </p>
    </CardContent>
  </Card>
  
  {/* Card 3: Ranking */}
  <Card>
    <CardHeader>
      <CardTitle>
        <TrendingUp className="h-4 w-4 inline mr-2" />
        Ranking
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        #{rankRegional} <span className="text-sm">USA</span>
      </div>
      <div className="text-sm text-muted-foreground">
        #{rankGlobal} Global
      </div>
    </CardContent>
  </Card>
</div>

{/* Gráfico Performance Mensal */}
<Card className="mt-4">
  <CardHeader>
    <CardTitle>Performance Mensal (2025)</CardTitle>
  </CardHeader>
  <CardContent>
    <LineChart data={monthlyData}>
      <Line dataKey="target" stroke="#gray" name="Meta" />
      <Line dataKey="achieved" stroke="#green" name="Realizado" />
    </LineChart>
  </CardContent>
</Card>
```

---

### 3. DealerOrderManager.tsx

```typescript
/**
 * GESTÃO DE PEDIDOS RECORRENTES
 * 
 * Features:
 * - Dealer faz pedido pelo portal
 * - Auto-approval se dentro do contrato
 * - Tracking de produção (queued → manufacturing → shipped → delivered)
 * - Notificações automáticas (email, WhatsApp)
 * - Upload de documentos (invoice, BL, packing list)
 * - Rastreamento de envio (integração com transportadoras)
 */

<Card>
  <CardHeader>
    <CardTitle>
      <ShoppingCart className="h-5 w-5 inline mr-2" />
      Novo Pedido - {dealerName}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Seleção de Produtos (do contrato) */}
    <ProductSelector 
      availableProducts={contract.products}
      onSelect={handleProductSelect}
    />
    
    {/* Resumo do Pedido */}
    <div className="mt-4 p-4 bg-muted rounded">
      <h4 className="font-semibold mb-2">Resumo do Pedido</h4>
      {selectedProducts.map(p => (
        <div key={p.id} className="flex justify-between">
          <span>{p.name} × {p.quantity}</span>
          <span>USD {p.total.toLocaleString()}</span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 flex justify-between font-bold">
        <span>TOTAL ({contract.default_incoterm}):</span>
        <span>USD {orderTotal.toLocaleString()}</span>
      </div>
      
      {/* Desconto por Volume (se aplicável) */}
      {volumeDiscount > 0 && (
        <div className="flex justify-between text-green-600 mt-1">
          <span>
            <Percent className="h-3 w-3 inline mr-1" />
            Desconto Volume ({volumeDiscountPercentage}%)
          </span>
          <span>-USD {volumeDiscount.toLocaleString()}</span>
        </div>
      )}
    </div>
    
    {/* Data de Entrega Desejada */}
    <div className="mt-4">
      <Label>Data de Entrega Desejada</Label>
      <DatePicker 
        value={deliveryDate}
        onChange={setDeliveryDate}
        minDate={new Date(Date.now() + 45*24*60*60*1000)} // +45 dias (lead time)
      />
    </div>
    
    {/* Botão Confirmar */}
    <Button onClick={handleSubmitOrder} className="w-full mt-4">
      <Check className="h-4 w-4 mr-2" />
      Confirmar Pedido
    </Button>
  </CardContent>
</Card>
```

---

### 4. DealerPortal.tsx (Self-Service)

```typescript
/**
 * PORTAL DO DEALER (Auto-serviço)
 * 
 * Dealer acessa com login próprio e vê:
 * - Dashboard de performance (metas, pedidos, ranking)
 * - Fazer novo pedido
 * - Rastrear pedidos em andamento
 * - Download de materiais de marketing
 * - Catálogo de produtos atualizado
 * - Relatórios de vendas
 * - Suporte (chat, tickets)
 */

export function DealerPortal() {
  const { currentDealer } = useDealer(); // Hook específico para dealer logado
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header com logo do tenant (white-label) */}
      <header className="border-b p-4">
        <img src={tenant.logo_url} alt={tenant.name} className="h-10" />
        <h2 className="text-sm text-muted-foreground">Dealer Portal</h2>
      </header>
      
      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard">
          <TabsList>
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
          
          <TabsContent value="dashboard">
            <DealerPerformanceDashboard dealerId={currentDealer.id} />
          </TabsContent>
          
          <TabsContent value="orders">
            <DealerOrderManager dealerId={currentDealer.id} />
          </TabsContent>
          
          <TabsContent value="marketing">
            <MarketingMaterialsLibrary dealerId={currentDealer.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

### 5. MarketingMaterialsLibrary.tsx

```typescript
/**
 * BIBLIOTECA DE MATERIAIS DE MARKETING
 * 
 * Features:
 * - Upload de brochures, catálogos, vídeos
 * - Organização por categoria e idioma
 * - Download tracking (quem baixou, quando)
 * - Dealer pode baixar e usar em campanhas locais
 * - Materiais customizados por produto
 */

<div className="grid md:grid-cols-3 gap-4">
  {materials.map(material => (
    <Card key={material.id}>
      <CardHeader>
        <Badge>{material.type}</Badge>
        <CardTitle className="text-sm">{material.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Thumbnail */}
        {material.thumbnail_url && (
          <img src={material.thumbnail_url} alt={material.title} className="w-full rounded mb-2" />
        )}
        
        <p className="text-xs text-muted-foreground mb-2">{material.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs">
            <Download className="h-3 w-3 inline mr-1" />
            {material.downloads_count} downloads
          </span>
          
          <Button size="sm" onClick={() => handleDownload(material)}>
            <Download className="h-3 w-3 mr-1" />
            Baixar
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

---

### 6. GamificationSystem.tsx

```typescript
/**
 * SISTEMA DE GAMIFICAÇÃO
 * 
 * Features:
 * - Tiers: Bronze → Silver → Gold → Platinum
 * - Pontos por ações (pedido, meta batida, recompra)
 * - Rankings (regional, global)
 * - Badges/Conquistas (primeiro pedido, meta 100%, etc)
 * - Leaderboard público (competição saudável)
 * - Recompensas (descontos, bônus, produtos grátis, MDF)
 */

// Cálculo de Tier
export function calculateDealerTier(performance: DealerPerformance): string {
  const { achievement_percentage, orders_count, repeat_order_rate } = performance;
  
  let score = 0;
  
  // Meta batida (50 pts)
  score += Math.min(achievement_percentage, 100) * 0.5;
  
  // Frequência de pedidos (25 pts)
  score += Math.min(orders_count, 12) * 2.08; // 12 pedidos/ano = 25 pts
  
  // Taxa de recompra (25 pts)
  score += repeat_order_rate * 25;
  
  if (score >= 90) return 'platinum';
  if (score >= 75) return 'gold';
  if (score >= 50) return 'silver';
  return 'bronze';
}

// Rankings
export function calculateRankings(dealers: Dealer[]): Dealer[] {
  return dealers
    .sort((a, b) => b.performance.score - a.performance.score)
    .map((dealer, index) => ({
      ...dealer,
      rank: index + 1
    }));
}

// Badges
export const ACHIEVEMENT_BADGES = [
  { id: 'first_order', name: 'Primeiro Pedido', icon: ShoppingCart },
  { id: 'target_100', name: 'Meta 100%', icon: Target },
  { id: 'repeat_customer', name: '5 Pedidos', icon: RotateCw },
  { id: 'volume_king', name: 'Maior Volume', icon: TrendingUp },
  { id: 'fast_payment', name: 'Pagamento Rápido', icon: Zap },
  { id: 'loyalty_1year', name: '1 Ano de Parceria', icon: Calendar },
];
```

---

### 7. SalesEnablementHub.tsx

```typescript
/**
 * HUB DE MATERIAIS DE VENDAS
 * 
 * MetaLife fornece para dealers:
 * - Catálogos em PDF (multi-idioma)
 * - Vídeos de produtos
 * - Apresentações PowerPoint
 * - Banners para redes sociais
 * - Cases de sucesso
 * - Argumentos de venda (por objeção)
 * - Calculadora ROI (para cliente final)
 * - Comparativos com concorrentes
 */

const MATERIAL_CATEGORIES = [
  {
    id: 'product',
    name: 'Materiais de Produto',
    icon: Package,
    items: [
      'Catálogo Completo (PT, EN, ES, DE, JP)',
      'Fichas Técnicas',
      'Vídeos Demonstrativos',
      'Manuais de Uso',
      'Certificações (ISO, CE, etc)'
    ]
  },
  {
    id: 'sales',
    name: 'Materiais de Vendas',
    icon: TrendingUp,
    items: [
      'Argumentos de Venda',
      'Respostas a Objeções',
      'Comparativo vs Concorrentes',
      'ROI Calculator',
      'Cases de Sucesso'
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing Digital',
    icon: Megaphone,
    items: [
      'Banners Redes Sociais',
      'Posts Instagram/Facebook',
      'Email Templates',
      'Landing Pages',
      'Google Ads Criativos'
    ]
  },
  {
    id: 'training',
    name: 'Treinamento',
    icon: GraduationCap,
    items: [
      'Vídeos de Treinamento',
      'Webinars Gravados',
      'Certificação de Revendedor',
      'FAQ Técnico'
    ]
  }
];
```

---

## 📊 DASHBOARD EXECUTIVO (MetaLife)

### DealerNetworkOverview.tsx

```typescript
/**
 * VISÃO GERAL DA REDE DE DEALERS
 * 
 * MetaLife vê:
 * - Mapa mundial com dealers (tamanho = volume)
 * - Top 10 dealers (ranking)
 * - Performance agregada (por país, região)
 * - Alertas (dealer abaixo da meta, contrato expirando)
 * - Oportunidades de upsell/cross-sell
 * - Recomendações de IA (quem prospectar, onde expandir)
 */

<div className="space-y-6">
  {/* Métricas Globais */}
  <div className="grid grid-cols-4 gap-4">
    <MetricCard 
      title="Total Dealers"
      value={dealers.length}
      icon={Building2}
      trend="+12%"
    />
    <MetricCard 
      title="Contratos Ativos"
      value={activeContracts}
      icon={FileSignature}
    />
    <MetricCard 
      title="Volume Anual"
      value={`USD ${totalVolume}M`}
      icon={DollarSign}
      trend="+23%"
    />
    <MetricCard 
      title="Média Performance"
      value={`${avgPerformance}%`}
      icon={Award}
      color={avgPerformance >= 80 ? 'green' : 'yellow'}
    />
  </div>
  
  {/* Mapa Mundial */}
  <Card>
    <CardHeader>
      <CardTitle>Rede Global de Dealers</CardTitle>
    </CardHeader>
    <CardContent>
      <WorldMap 
        dealers={dealers}
        sizeBy="volume"
        colorBy="performance"
      />
    </CardContent>
  </Card>
  
  {/* Top Performers */}
  <Card>
    <CardHeader>
      <CardTitle>
        <Trophy className="h-5 w-5 inline mr-2" />
        Top 10 Dealers (2025)
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Dealer</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Meta</TableHead>
            <TableHead>Tier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topDealers.map((dealer, idx) => (
            <TableRow key={dealer.id}>
              <TableCell>
                {idx === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                {idx === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                {idx === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                {idx > 2 && `#${idx + 1}`}
              </TableCell>
              <TableCell>{dealer.name}</TableCell>
              <TableCell>{dealer.country}</TableCell>
              <TableCell>USD {dealer.volume.toLocaleString()}</TableCell>
              <TableCell>{dealer.achievement}%</TableCell>
              <TableCell>
                <Badge variant={getTierColor(dealer.tier)}>
                  {dealer.tier}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
  
  {/* Alertas */}
  <Card>
    <CardHeader>
      <CardTitle>
        <AlertCircle className="h-5 w-5 inline mr-2" />
        Alertas e Oportunidades
      </CardTitle>
    </CardHeader>
    <CardContent>
      {alerts.map(alert => (
        <Alert key={alert.id} variant={alert.severity}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{alert.dealer_name}:</strong> {alert.message}
            <Button size="sm" variant="link">Ver Detalhes</Button>
          </AlertDescription>
        </Alert>
      ))}
    </CardContent>
  </Card>
</div>
```

---

## 🤖 IA & AUTOMAÇÃO

### 1. Recomendações Automáticas

```typescript
/**
 * IA RECOMENDA:
 * - Upsell: Dealer compra Reformer Infinity, sugerir Acessórios Kit
 * - Cross-sell: Dealer compra equipamentos, sugerir móveis
 * - Reativação: Dealer sem pedido há 90 dias → Email automático
 * - Expansão: Dealer bateu meta 120% → Sugerir novos territórios
 * - Risco: Dealer < 50% da meta → Alerta e ação comercial
 */

// Edge Function: ai-dealer-recommendations
export async function generateDealerRecommendations(dealerId: string) {
  const dealer = await getDealer(dealerId);
  const performance = await getPerformance(dealerId);
  const orders = await getOrders(dealerId, { last_months: 6 });
  
  const prompt = `
Analise este dealer e recomende ações:

Dealer: ${dealer.name}
País: ${dealer.country}
Tier: ${performance.tier}
Performance: ${performance.achievement_percentage}%
Último pedido: ${orders[0]?.date} (há ${daysSinceLastOrder} dias)
Produtos comprados: ${orders.map(o => o.products).flat().map(p => p.name).join(', ')}

Recomende:
1. Upsell (produtos complementares)
2. Cross-sell (novas linhas)
3. Ações (se performance baixa)
4. Expansão (se performance alta)
  `;
  
  const aiResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return aiResponse.choices[0].message.content;
}
```

### 2. Follow-ups Automáticos

```typescript
/**
 * AUTOMAÇÕES:
 * - Dealer sem pedido há 60 dias → Email automático
 * - Meta trimestral < 70% → Ligação comercial
 * - Contrato expira em 90 dias → Renovação automática
 * - Novo produto lançado → Notificar todos dealers
 * - Dealer atingiu meta → Parabenizar + oferecer bônus
 */
```

---

## 🎯 GAMIFICAÇÃO & INCENTIVOS

### Programa de Pontos:

```typescript
export const POINTS_SYSTEM = {
  // Ações
  first_order: 500,
  repeat_order: 100,
  target_achieved_100: 1000,
  target_achieved_120: 2000,
  early_payment: 200,
  referral: 500,
  
  // Conversão de pontos
  points_to_usd: 100, // 100 pontos = USD 1 de desconto
  
  // Níveis
  bronze: { min: 0, discount: 0 },
  silver: { min: 5000, discount: 0.05 },
  gold: { min: 15000, discount: 0.10 },
  platinum: { min: 30000, discount: 0.15 }
};
```

---

## 📋 CHECKLIST FASE 7

- [ ] Criar migrations (dealer_contracts, dealer_orders, dealer_performance, marketing_materials, dealer_incentives)
- [ ] Criar DealerContractManager.tsx
- [ ] Criar DealerPerformanceDashboard.tsx
- [ ] Criar DealerOrderManager.tsx
- [ ] Criar DealerPortal.tsx (self-service)
- [ ] Criar MarketingMaterialsLibrary.tsx
- [ ] Criar GamificationSystem.tsx
- [ ] Criar DealerNetworkOverview.tsx (visão MetaLife)
- [ ] Criar Edge Function ai-dealer-recommendations
- [ ] Criar sistema de notificações (email, WhatsApp)
- [ ] Integrar rastreamento de envio (API transportadoras)
- [ ] Criar relatórios automáticos (mensal, trimestral)

---

## 🚀 RESULTADO FINAL (FASE 7)

**Jornada Completa:**

```
1. Descobrir Dealer (FASE 4) ✅
2. Gerar Proposta (FASE 6) ✅
3. Dealer Aceita Proposta
4. Criar Contrato (FASE 7) ← NOVO
5. Definir Metas (FASE 7) ← NOVO
6. Dealer Faz Pedidos Recorrentes (FASE 7) ← NOVO
7. Monitorar Performance (FASE 7) ← NOVO
8. Fornecer Materiais Marketing (FASE 7) ← NOVO
9. Gamificação & Incentivos (FASE 7) ← NOVO
10. Renovação Automática (FASE 7) ← NOVO
```

**Sistema end-to-end completo!** 🎊

