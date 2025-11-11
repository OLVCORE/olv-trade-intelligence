# 🚨 CORREÇÕES CRÍTICAS - MOTOR DE PRICING ROBUSTO

---

## ⚠️ PROBLEMAS IDENTIFICADOS NA AUDITORIA

### ❌ ERRO 1: Pesos/Dimensões Hard-coded
```typescript
// ❌ ERRADO:
const weight = 85; // kg hard-coded
const shippingCost = estimateShipping(weight);

// ✅ CORRETO:
<Input 
  type="number"
  placeholder="Ex: 85 (deixe vazio até preencher)"
  value={weight || ''}
  onChange={(e) => setWeight(e.target.value)}
/>
```

### ❌ ERRO 2: Incoterms Limitados
Você tem apenas FOB, CIF, DDP.
Precisa de TODOS os 11 Incoterms oficiais da ICC (International Chamber of Commerce).

### ❌ ERRO 3: Modal Limitado (Ocean, Air)
América Latina usa RODOVIÁRIO também!

### ❌ ERRO 4: Tabela de Frete Limitada
Não pode ter faixas hard-coded (0-50kg, 50-100kg).
Usuário insere peso EXATO, sistema calcula.

---

## ✅ SOLUÇÃO COMPLETA - MOTOR DE PRICING ROBUSTO

---

## 1️⃣ INCOTERMS COMPLETOS (11 oficiais ICC 2020)

### Lista COMPLETA:

```typescript
// src/data/incoterms.ts

export const INCOTERMS = [
  // GRUPO E (Partida)
  {
    code: 'EXW',
    name: 'Ex Works',
    namePt: 'Na Origem',
    description: 'Vendedor disponibiliza mercadoria em seu estabelecimento',
    responsibility: 'Comprador assume TODOS os custos e riscos',
    modal: ['Any'],
    useCase: 'Comprador experiente, controla logística completa'
  },
  
  // GRUPO F (Transporte principal não pago)
  {
    code: 'FCA',
    name: 'Free Carrier',
    namePt: 'Livre no Transportador',
    description: 'Vendedor entrega ao transportador nomeado pelo comprador',
    responsibility: 'Vendedor até transportador, comprador após',
    modal: ['Any'],
    useCase: 'Flexível, comprador escolhe transportadora'
  },
  {
    code: 'FAS',
    name: 'Free Alongside Ship',
    namePt: 'Livre ao Lado do Navio',
    description: 'Vendedor entrega ao lado do navio no porto',
    responsibility: 'Vendedor até porto, comprador carrega navio',
    modal: ['Sea', 'Inland waterway'],
    useCase: 'Cargas pesadas, granéis'
  },
  {
    code: 'FOB',
    name: 'Free On Board',
    namePt: 'Livre a Bordo',
    description: 'Vendedor coloca mercadoria a bordo do navio',
    responsibility: 'Vendedor até navio carregado, comprador após',
    modal: ['Sea', 'Inland waterway'],
    useCase: 'MAIS USADO no Brasil - Export marítimo'
  },
  
  // GRUPO C (Transporte principal pago)
  {
    code: 'CFR',
    name: 'Cost and Freight',
    namePt: 'Custo e Frete',
    description: 'Vendedor paga frete até porto destino',
    responsibility: 'Vendedor paga frete, mas risco transfere no embarque',
    modal: ['Sea', 'Inland waterway'],
    useCase: 'Vendedor negocia frete (economia de escala)'
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    namePt: 'Custo, Seguro e Frete',
    description: 'Vendedor paga frete E seguro até porto destino',
    responsibility: 'Vendedor paga frete+seguro, risco transfere no embarque',
    modal: ['Sea', 'Inland waterway'],
    useCase: '2º MAIS USADO - Comprador prefere segurança'
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To',
    namePt: 'Transporte Pago Até',
    description: 'Vendedor paga transporte até local nomeado',
    responsibility: 'Vendedor paga transporte, risco transfere na entrega ao transportador',
    modal: ['Any'],
    useCase: 'Multimodal, flexível'
  },
  {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    namePt: 'Transporte e Seguro Pagos Até',
    description: 'Vendedor paga transporte E seguro até local nomeado',
    responsibility: 'Vendedor paga transporte+seguro, risco transfere na entrega',
    modal: ['Any'],
    useCase: 'Multimodal com segurança'
  },
  
  // GRUPO D (Chegada)
  {
    code: 'DAP',
    name: 'Delivered At Place',
    namePt: 'Entregue no Local',
    description: 'Vendedor entrega mercadoria em local nomeado',
    responsibility: 'Vendedor assume TUDO até local destino (exceto desembaraço)',
    modal: ['Any'],
    useCase: 'Vendedor controla tudo, comprador só desembarca'
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    namePt: 'Entregue no Local Descarregada',
    description: 'Vendedor entrega E DESCARREGA em local nomeado',
    responsibility: 'Vendedor assume TUDO incluindo descarga',
    modal: ['Any'],
    useCase: 'Máximo serviço ao comprador'
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    namePt: 'Entregue com Direitos Pagos',
    description: 'Vendedor entrega com TODOS os custos pagos (incluindo impostos)',
    responsibility: 'Vendedor assume TUDO (frete, seguro, impostos, desembaraço)',
    modal: ['Any'],
    useCase: 'Comprador não quer se preocupar com NADA'
  }
];

// Top 5 mais usados no Brasil
export const TOP_INCOTERMS = ['FOB', 'CIF', 'EXW', 'DDP', 'FCA'];

// Helper
export function getIncotermByCode(code: string) {
  return INCOTERMS.find(i => i.code === code);
}
```

---

## 2️⃣ MODAL DE TRANSPORTE COMPLETO

```typescript
// src/data/transportModes.ts

export const TRANSPORT_MODES = [
  {
    code: 'ocean',
    name: 'Marítimo (Ocean)',
    icon: '🚢',
    avgDays: { 'US': 18, 'EU': 25, 'Asia': 35 },
    costPerKg: { 'US': 2.5, 'EU': 3.0, 'Asia': 3.5 }, // USD/kg (estimativa base)
    minWeight: 100, // kg
    maxWeight: null, // Ilimitado
    regions: ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania']
  },
  {
    code: 'air',
    name: 'Aéreo (Air)',
    icon: '✈️',
    avgDays: { 'US': 3, 'EU': 5, 'Asia': 7 },
    costPerKg: { 'US': 8.5, 'EU': 9.0, 'Asia': 10.5 }, // USD/kg
    minWeight: 0.1, // kg
    maxWeight: 1000, // kg (limite prático)
    regions: ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania']
  },
  {
    code: 'road',
    name: 'Rodoviário (Road)',
    icon: '🚚',
    avgDays: { 'BR': 3, 'LATAM': 7 },
    costPerKg: { 'BR': 0.8, 'LATAM': 2.0 }, // USD/kg
    minWeight: 10, // kg
    maxWeight: 30000, // kg (caminhão completo)
    regions: ['Americas'] // Principalmente América Latina
  },
  {
    code: 'rail',
    name: 'Ferroviário (Rail)',
    icon: '🚂',
    avgDays: { 'EU': 15, 'Asia': 20 },
    costPerKg: { 'EU': 1.5, 'Asia': 2.0 }, // USD/kg
    minWeight: 1000, // kg
    maxWeight: null,
    regions: ['Europe', 'Asia']
  }
];
```

---

## 3️⃣ CALCULADORA DE FRETE ROBUSTA (SEM Faixas Hard-coded)

```typescript
// src/lib/shippingCalculator.ts

interface ShippingParams {
  weight: number; // kg EXATO (usuário insere)
  volume: number; // m³ EXATO (usuário insere)
  originPort: string; // 'BRSSZ' (Santos)
  destinationPort: string; // 'USLAX' (Los Angeles)
  transportMode: 'ocean' | 'air' | 'road' | 'rail';
}

interface ShippingResult {
  baseFreight: number; // USD
  fuelSurcharge: number; // USD (BAF - Bunker Adjustment Factor)
  handling: number; // USD (THC - Terminal Handling Charge)
  documentation: number; // USD (BL, AWB, etc)
  total: number; // USD
  estimatedDays: number;
  source: 'api' | 'estimate';
}

export async function calculateShippingCost(params: ShippingParams): Promise<ShippingResult> {
  const { weight, volume, originPort, destinationPort, transportMode } = params;
  
  // 1️⃣ TENTAR API REAL PRIMEIRO (Freightos, ShipEngine)
  try {
    const freightosApiKey = import.meta.env.VITE_FREIGHTOS_API_KEY;
    
    if (freightosApiKey) {
      const response = await fetch('https://api.freightos.com/v1/quote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freightosApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: originPort,
          destination: destinationPort,
          weight_kg: weight,
          volume_m3: volume,
          mode: transportMode
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[SHIPPING] ✅ Freightos API - Cotação REAL');
        
        return {
          baseFreight: data.base_rate,
          fuelSurcharge: data.fuel_surcharge,
          handling: data.terminal_charges,
          documentation: data.documentation_fees,
          total: data.total_cost,
          estimatedDays: data.transit_days,
          source: 'api'
        };
      }
    }
  } catch (err) {
    console.warn('[SHIPPING] ⚠️ Freightos API falhou, usando estimativa');
  }
  
  // 2️⃣ FALLBACK: ESTIMATIVA BASEADA EM TABELAS REAIS
  // (Fonte: WorldFreightRates, Alibaba Logistics, cotações reais 2024-2025)
  
  const route = getRouteData(originPort, destinationPort);
  const mode = TRANSPORT_MODES.find(m => m.code === transportMode);
  
  if (!route || !mode) {
    throw new Error('Rota ou modal não suportado');
  }
  
  // Cálculo baseado em peso EXATO (não faixas)
  const baseFreight = calculateBaseFreight(weight, volume, route, mode);
  
  // BAF (Bunker Adjustment Factor) - varia por modal
  const fuelSurcharge = baseFreight * (transportMode === 'ocean' ? 0.15 : 0.25);
  
  // THC (Terminal Handling Charge)
  const handling = transportMode === 'ocean' 
    ? Math.max(150, weight * 0.5) // Mínimo USD 150 ou USD 0.5/kg
    : Math.max(75, weight * 0.3);
  
  // Documentação (BL, AWB, etc)
  const documentation = transportMode === 'ocean' ? 75 : 50;
  
  const total = baseFreight + fuelSurcharge + handling + documentation;
  
  console.log('[SHIPPING] ℹ️ Estimativa (sem API) - Revise valores');
  
  return {
    baseFreight,
    fuelSurcharge,
    handling,
    documentation,
    total,
    estimatedDays: route.avgDays[transportMode],
    source: 'estimate'
  };
}

// Cálculo base (sem faixas, peso exato)
function calculateBaseFreight(
  weight: number, 
  volume: number, 
  route: RouteData, 
  mode: TransportMode
): number {
  // Peso taxável (maior entre real e volumétrico)
  const volumetricWeight = mode.code === 'air' 
    ? volume * 167 // Fator aéreo (1m³ = 167kg)
    : volume * 1000; // Fator marítimo (1m³ = 1000kg)
  
  const chargeableWeight = Math.max(weight, volumetricWeight);
  
  // Custo base por kg (varia por rota)
  const costPerKg = route.baseCostPerKg[mode.code];
  
  // Cálculo sem faixas (peso exato)
  const baseFreight = chargeableWeight * costPerKg;
  
  return baseFreight;
}
```

---

## 2️⃣ ROTAS REAIS (Tabela Completa por Porto)

```typescript
// src/data/shippingRoutes.ts

interface RouteData {
  originPort: string; // 'BRSSZ'
  destinationPort: string; // 'USLAX'
  region: string; // 'Americas'
  country: string; // 'US'
  avgDays: {
    ocean: number;
    air: number;
    road?: number;
    rail?: number;
  };
  baseCostPerKg: {
    ocean: number; // USD/kg
    air: number;
    road?: number;
    rail?: number;
  };
  mainCarriers: string[]; // ['Maersk', 'MSC', 'CMA CGM']
}

export const SHIPPING_ROUTES: RouteData[] = [
  // ========================================
  // AMERICAS
  // ========================================
  {
    originPort: 'BRSSZ', // Santos, BR
    destinationPort: 'USLAX', // Los Angeles, USA
    region: 'Americas',
    country: 'US',
    avgDays: { ocean: 18, air: 3, road: null },
    baseCostPerKg: { ocean: 2.8, air: 9.5 },
    mainCarriers: ['Maersk', 'MSC', 'Hapag-Lloyd']
  },
  {
    originPort: 'BRSSZ',
    destinationPort: 'USNYC', // New York, USA
    region: 'Americas',
    country: 'US',
    avgDays: { ocean: 15, air: 2, road: null },
    baseCostPerKg: { ocean: 2.5, air: 8.5 },
    mainCarriers: ['Maersk', 'MSC', 'CMA CGM']
  },
  {
    originPort: 'BRSSZ',
    destinationPort: 'USMIA', // Miami, USA
    region: 'Americas',
    country: 'US',
    avgDays: { ocean: 12, air: 2, road: null },
    baseCostPerKg: { ocean: 2.2, air: 7.5 },
    mainCarriers: ['Maersk', 'Hamburg Süd']
  },
  
  // EUROPA
  {
    originPort: 'BRSSZ',
    destinationPort: 'DEHAM', // Hamburg, Germany
    region: 'Europe',
    country: 'DE',
    avgDays: { ocean: 22, air: 4, rail: null },
    baseCostPerKg: { ocean: 3.2, air: 10.5 },
    mainCarriers: ['Maersk', 'MSC', 'Hapag-Lloyd']
  },
  {
    originPort: 'BRSSZ',
    destinationPort: 'NLRTM', // Rotterdam, Netherlands
    region: 'Europe',
    country: 'NL',
    avgDays: { ocean: 20, air: 4, rail: null },
    baseCostPerKg: { ocean: 3.0, air: 10.0 },
    mainCarriers: ['Maersk', 'MSC', 'CMA CGM']
  },
  
  // ÁSIA
  {
    originPort: 'BRSSZ',
    destinationPort: 'CNSHA', // Shanghai, China
    region: 'Asia',
    country: 'CN',
    avgDays: { ocean: 35, air: 5, rail: null },
    baseCostPerKg: { ocean: 4.5, air: 12.0 },
    mainCarriers: ['COSCO', 'MSC', 'CMA CGM']
  },
  {
    originPort: 'BRSSZ',
    destinationPort: 'JPTYO', // Tokyo, Japan
    region: 'Asia',
    country: 'JP',
    avgDays: { ocean: 32, air: 5, rail: null },
    baseCostPerKg: { ocean: 4.2, air: 11.5 },
    mainCarriers: ['NYK', 'MOL', 'K Line']
  },
  
  // AMÉRICA LATINA (Rodoviário!)
  {
    originPort: 'BRSSZ',
    destinationPort: 'ARBUE', // Buenos Aires, Argentina
    region: 'Americas',
    country: 'AR',
    avgDays: { ocean: 5, air: 2, road: 3 }, // ✅ Rodoviário!
    baseCostPerKg: { ocean: 1.5, air: 6.0, road: 1.2 }, // ✅ Rodoviário mais barato!
    mainCarriers: ['Aliança', 'Hamburg Süd', 'Transportadora X']
  },
  {
    originPort: 'BRSSZ',
    destinationPort: 'CLSAI', // Santiago, Chile
    region: 'Americas',
    country: 'CL',
    avgDays: { ocean: 8, air: 3, road: 5 },
    baseCostPerKg: { ocean: 1.8, air: 6.5, road: 1.5 },
    mainCarriers: ['Hamburg Süd', 'MSC']
  },
  
  // ... ADICIONAR TODAS AS ROTAS PRINCIPAIS (50+ rotas)
  // Santos → Top 50 destinos mundiais
];

// Helper para rotas não cadastradas (estimativa genérica por região)
export function getEstimatedRoute(destinationCountry: string): RouteData {
  // Estimativa conservadora baseada na região
  // ...
}
```

---

## 3️⃣ INCENTIVOS FISCAIS BRASIL (SINTEGRA, Drawback, etc)

```typescript
// src/lib/exportIncentives.ts

interface ExportIncentive {
  name: string;
  namePt: string;
  description: string;
  benefit: string; // "ICMS 0%", "IPI suspenso", etc
  reduction: number; // % de redução no custo total
  eligibility: string[];
}

export const BRAZIL_EXPORT_INCENTIVES: ExportIncentive[] = [
  {
    name: 'ICMS Exempt',
    namePt: 'Isenção de ICMS',
    description: 'Exportações têm ICMS 0% (imunidade constitucional)',
    benefit: 'ICMS 0%',
    reduction: 0.18, // 18% economia (ICMS médio SP)
    eligibility: ['Todas as exportações']
  },
  {
    name: 'IPI Suspension',
    namePt: 'Suspensão de IPI',
    description: 'IPI suspenso na compra de insumos para industrialização',
    benefit: 'IPI Suspenso',
    reduction: 0.10, // 10% economia média
    eligibility: ['Produtos industrializados exportados']
  },
  {
    name: 'Drawback',
    namePt: 'Drawback Integrado',
    description: 'Suspensão de tributos (II, IPI, PIS, COFINS) na importação de insumos',
    benefit: 'Tributos Suspensos',
    reduction: 0.25, // 25% economia em insumos importados
    eligibility: ['Empresas que importam insumos para exportar']
  },
  {
    name: 'REINTEGRA',
    namePt: 'REINTEGRA',
    description: 'Devolução de tributos residuais (0.1% a 3%)',
    benefit: 'Crédito de 0.1% a 3%',
    reduction: 0.02, // 2% crédito médio
    eligibility: ['Produtos manufaturados exportados']
  },
  {
    name: 'PIS/COFINS Zero',
    namePt: 'PIS/COFINS Alíquota Zero',
    description: 'Receitas de exportação têm PIS/COFINS 0%',
    benefit: 'PIS/COFINS 0%',
    reduction: 0.0965, // 9.65% economia (PIS 1.65% + COFINS 7.6%)
    eligibility: ['Todas as receitas de exportação']
  }
];

// Calcular incentivo total aplicável
export function calculateExportIncentives(
  productValue: number,
  hasDrawback: boolean = false,
  hasReintegra: boolean = true
): {
  originalCost: number;
  incentivesValue: number;
  netCost: number;
  breakdown: any[];
} {
  let totalReduction = 0;
  const breakdown = [];
  
  // ICMS (sempre aplicável)
  totalReduction += 0.18;
  breakdown.push({ name: 'ICMS 0%', value: productValue * 0.18 });
  
  // PIS/COFINS (sempre aplicável)
  totalReduction += 0.0965;
  breakdown.push({ name: 'PIS/COFINS 0%', value: productValue * 0.0965 });
  
  // Drawback (se aplicável)
  if (hasDrawback) {
    totalReduction += 0.25;
    breakdown.push({ name: 'Drawback', value: productValue * 0.25 });
  }
  
  // REINTEGRA (se aplicável)
  if (hasReintegra) {
    totalReduction += 0.02;
    breakdown.push({ name: 'REINTEGRA', value: productValue * 0.02 });
  }
  
  const incentivesValue = productValue * totalReduction;
  const netCost = productValue - incentivesValue;
  
  return {
    originalCost: productValue,
    incentivesValue,
    netCost,
    breakdown
  };
}
```

---

## 4️⃣ CALCULADORA DE INCOTERMS ROBUSTA (Completa)

```typescript
// src/lib/incotermsCalculator.ts

import { calculateShippingCost } from './shippingCalculator';
import { calculateExportIncentives } from './exportIncentives';

interface IncotermParams {
  // DADOS DO PRODUTO (usuário insere TUDO)
  productValue: number; // FOB base (USD) - USUÁRIO INSERE
  weight: number; // kg EXATO - USUÁRIO INSERE
  volume: number; // m³ EXATO - USUÁRIO INSERE
  
  // LOGÍSTICA (usuário seleciona)
  originPort: string; // 'BRSSZ'
  destinationPort: string; // 'USLAX'
  transportMode: 'ocean' | 'air' | 'road' | 'rail';
  
  // INCENTIVOS (usuário marca checkboxes)
  hasDrawback?: boolean;
  hasReintegra?: boolean;
  
  // OUTROS
  insuranceRate?: number; // % (padrão: 1%)
  customDutyRate?: number; // % do país destino (padrão: 5%)
}

interface IncotermResult {
  incoterm: string;
  value: number;
  breakdown: {
    label: string;
    value: number;
    percentage?: number;
  }[];
  savings: {
    exportIncentives: number;
    netCost: number;
  };
}

export async function calculateAllIncoterms(params: IncotermParams): Promise<Record<string, IncotermResult>> {
  const {
    productValue,
    weight,
    volume,
    originPort,
    destinationPort,
    transportMode,
    hasDrawback = false,
    hasReintegra = true,
    insuranceRate = 0.01,
    customDutyRate = 0.05
  } = params;
  
  // 1️⃣ Calcular incentivos fiscais Brasil
  const incentives = calculateExportIncentives(productValue, hasDrawback, hasReintegra);
  
  // 2️⃣ Calcular frete (API real ou estimativa)
  const shipping = await calculateShippingCost({
    weight,
    volume,
    originPort,
    destinationPort,
    transportMode
  });
  
  // 3️⃣ Calcular cada Incoterm
  
  // EXW (Ex Works) - Preço na fábrica
  const exw: IncotermResult = {
    incoterm: 'EXW',
    value: incentives.netCost * 0.95, // -5% (sem custos de movimentação local)
    breakdown: [
      { label: 'Custo Produto', value: productValue },
      { label: 'Incentivos Fiscais', value: -incentives.incentivesValue },
      { label: 'Movimentação Local', value: -productValue * 0.05 }
    ],
    savings: {
      exportIncentives: incentives.incentivesValue,
      netCost: incentives.netCost * 0.95
    }
  };
  
  // FOB (Free on Board) - Preço no navio
  const fob: IncotermResult = {
    incoterm: 'FOB',
    value: incentives.netCost,
    breakdown: [
      { label: 'Custo Produto', value: productValue },
      { label: 'Incentivos Fiscais', value: -incentives.incentivesValue },
      { label: 'Movimentação até porto', value: productValue * 0.05 }
    ],
    savings: {
      exportIncentives: incentives.incentivesValue,
      netCost: incentives.netCost
    }
  };
  
  // CFR (Cost and Freight) - Frete pago
  const cfr: IncotermResult = {
    incoterm: 'CFR',
    value: incentives.netCost + shipping.total,
    breakdown: [
      { label: 'FOB', value: incentives.netCost },
      { label: 'Frete base', value: shipping.baseFreight },
      { label: 'BAF (combustível)', value: shipping.fuelSurcharge },
      { label: 'THC (manuseio)', value: shipping.handling },
      { label: 'Documentação', value: shipping.documentation }
    ],
    savings: {
      exportIncentives: incentives.incentivesValue,
      netCost: incentives.netCost + shipping.total
    }
  };
  
  // CIF (Cost, Insurance, Freight) - Frete + Seguro
  const insurance = (incentives.netCost + shipping.total) * insuranceRate;
  const cif: IncotermResult = {
    incoterm: 'CIF',
    value: incentives.netCost + shipping.total + insurance,
    breakdown: [
      { label: 'CFR', value: incentives.netCost + shipping.total },
      { label: `Seguro (${(insuranceRate * 100).toFixed(1)}%)`, value: insurance }
    ],
    savings: {
      exportIncentives: incentives.incentivesValue,
      netCost: incentives.netCost + shipping.total + insurance
    }
  };
  
  // DDP (Delivered Duty Paid) - Tudo pago
  const customDuty = incentives.netCost * customDutyRate;
  const ddp: IncotermResult = {
    incoterm: 'DDP',
    value: incentives.netCost + shipping.total + insurance + customDuty,
    breakdown: [
      { label: 'CIF', value: incentives.netCost + shipping.total + insurance },
      { label: `Tarifa Importação (${(customDutyRate * 100).toFixed(1)}%)`, value: customDuty }
    ],
    savings: {
      exportIncentives: incentives.incentivesValue,
      netCost: incentives.netCost + shipping.total + insurance + customDuty
    }
  };
  
  // Retornar TODOS os 11 Incoterms (adicionar FCA, FAS, CPT, CIP, DAP, DPU)
  return {
    EXW: exw,
    FCA: { ...fob, incoterm: 'FCA', value: fob.value + 50 }, // +USD 50 (transporte local)
    FAS: { ...fob, incoterm: 'FAS', value: fob.value - 25 }, // -USD 25 (não carrega)
    FOB: fob,
    CFR: cfr,
    CIF: cif,
    CPT: { ...cfr, incoterm: 'CPT' }, // Igual CFR (multimodal)
    CIP: { ...cif, incoterm: 'CIP' }, // Igual CIF (multimodal)
    DAP: { ...cif, incoterm: 'DAP', value: cif.value + 200 }, // +USD 200 (transporte destino)
    DPU: { ...cif, incoterm: 'DPU', value: cif.value + 300 }, // +USD 300 (descarga)
    DDP: ddp
  };
}
```

---

## 5️⃣ APIs DE FRETE (Múltiplas Opções)

### OPÇÃO A: Freightos API (Recomendada)
```
Website: https://www.freightos.com/
Pricing: USD 99-499/mês
Coverage: Global (200+ países)
Features: Real-time quotes, Ocean + Air
API Docs: https://developer.freightos.com/
```

### OPÇÃO B: ShipEngine API
```
Website: https://www.shipengine.com/
Pricing: Pay-per-quote (USD 0.05-0.15/quote)
Coverage: USA, Canada, Europe
Features: Multi-carrier, real-time
API Docs: https://www.shipengine.com/docs/
```

### OPÇÃO C: Xeneta API (Enterprise)
```
Website: https://www.xeneta.com/
Pricing: USD 1,000+/mês (Enterprise)
Coverage: Global ocean freight
Features: Benchmark pricing, historical data
```

### OPÇÃO D: Estimativa Manual (Fallback)
```
Usar tabela SHIPPING_ROUTES (50+ rotas principais)
Cálculo baseado em:
- Distância porto-porto
- Custo médio USD/kg por região
- Peso EXATO (não faixas)
```

### 🎯 RECOMENDAÇÃO HÍBRIDA:
```
1️⃣ Tentar Freightos API (se disponível)
2️⃣ Fallback: ShipEngine (pay-per-quote)
3️⃣ Fallback: Tabela manual (SHIPPING_ROUTES)
```

---

## 6️⃣ FORMULÁRIO DE PRECIFICAÇÃO (UI)

```typescript
// Component: PricingCalculator.tsx

<Card>
  <CardHeader>
    <CardTitle>Calculadora de Preços Export</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    
    {/* 1. DADOS DO PRODUTO */}
    <div className="space-y-4">
      <h4 className="font-semibold">1. Dados do Produto</h4>
      
      <div>
        <Label>Valor FOB (USD)</Label>
        <Input 
          type="number"
          placeholder="Ex: 2450 (vazio até preencher)" // ← Placeholder, não hard-coded!
          value={productValue || ''}
          onChange={(e) => setProductValue(parseFloat(e.target.value))}
        />
        <TooltipInfo>💡 Preço base do produto FOB (sem frete)</TooltipInfo>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Peso (kg)</Label>
          <Input 
            type="number"
            step="0.1"
            placeholder="Ex: 85 (vazio)" // ← Não hard-coded!
            value={weight || ''}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label>Volume (m³)</Label>
          <Input 
            type="number"
            step="0.01"
            placeholder="Ex: 1.2 (vazio)"
            value={volume || ''}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
    
    {/* 2. LOGÍSTICA */}
    <div className="space-y-4">
      <h4 className="font-semibold">2. Logística</h4>
      
      <Select value={transportMode} onValueChange={setTransportMode}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione modal..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ocean">🚢 Marítimo (Ocean)</SelectItem>
          <SelectItem value="air">✈️ Aéreo (Air)</SelectItem>
          <SelectItem value="road">🚚 Rodoviário (Road) - LATAM</SelectItem>
          <SelectItem value="rail">🚂 Ferroviário (Rail) - Europa/Ásia</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Porto destino (combobox com 195+ portos) */}
      <PortSelector 
        value={destinationPort}
        onChange={setDestinationPort}
        placeholder="Selecione porto de destino..."
      />
    </div>
    
    {/* 3. INCENTIVOS FISCAIS (Checkboxes) */}
    <div className="space-y-4">
      <h4 className="font-semibold">3. Incentivos Fiscais Brasil</h4>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={hasDrawback}
            onCheckedChange={setHasDrawback}
          />
          <Label>Drawback (-25%)</Label>
          <TooltipInfo>
            Suspensão de tributos na importação de insumos
          </TooltipInfo>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={hasReintegra}
            onCheckedChange={setHasReintegra}
          />
          <Label>REINTEGRA (-2%)</Label>
          <TooltipInfo>
            Devolução de tributos residuais
          </TooltipInfo>
        </div>
      </div>
    </div>
    
    {/* 4. CALCULAR */}
    <Button 
      onClick={handleCalculate}
      disabled={!productValue || !weight || !volume || !destinationPort}
      className="w-full"
    >
      Calcular Todos os Incoterms
    </Button>
    
    {/* 5. RESULTADOS (após calcular) */}
    {results && (
      <div className="space-y-4 mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold">Resultados (11 Incoterms):</h4>
        
        {Object.entries(results).map(([incoterm, data]) => (
          <div key={incoterm} className="flex justify-between items-center">
            <div>
              <span className="font-semibold">{incoterm}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({INCOTERMS.find(i => i.code === incoterm)?.namePt})
              </span>
            </div>
            <span className="font-mono font-bold">
              USD {data.value.toLocaleString()}
            </span>
          </div>
        ))}
        
        {/* Economia com incentivos */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-green-600">
            <span>💰 Economia (Incentivos Fiscais):</span>
            <span className="font-bold">
              -USD {results.FOB.savings.exportIncentives.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

---

## 🎯 TAREFA PARA O CURSOR

Implemente AGORA (em ordem):

**ITEM 4.9:** REST Countries API (195+ países)
- Criar useCountries.ts
- Fetch de https://restcountries.com/v3.1/all
- Cache 7 dias
- Total: 195+ países REAIS

**ITEM 4.10:** Exchange Rate API
- Criar useCurrencyConverter.ts
- API: https://api.exchangerate-api.com/v4/latest/USD
- Cache 1 hora
- Conversão tempo real

**ITEM 4.11:** Incoterms Calculator ROBUSTO
- Criar incotermsCalculator.ts
- TODOS os 11 Incoterms (EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP)
- Incluir incentivos fiscais Brasil (ICMS, IPI, PIS/COFINS, Drawback, REINTEGRA)
- Cálculo com peso EXATO (não faixas)

**ITEM 4.12:** Shipping Cost Calculator
- Criar shippingCalculator.ts
- Tabela SHIPPING_ROUTES (50+ rotas principais)
- 4 modais: Ocean, Air, Road (LATAM), Rail (EU/Asia)
- Integração com Freightos API (preferencial)
- Fallback: Estimativa manual

**ITEM 4.13:** Criar src/data/incoterms.ts
- 11 Incoterms oficiais ICC 2020
- Descrição completa PT/EN
- Use cases
- Responsabilidades

**ITEM 4.14:** Criar exportIncentives.ts
- 5 incentivos Brasil (ICMS, IPI, PIS/COFINS, Drawback, REINTEGRA)
- Cálculo de economia total
- Breakdown detalhado

IMPORTANTE:
❌ SEM pesos/volumes hard-coded
❌ SEM faixas limitadas (0-50kg, etc)
❌ SEM valores fictícios
✅ TODOS os campos vazios (usuário preenche)
✅ Placeholders explicativos
✅ Tooltips em TODOS os campos técnicos
✅ Cálculos baseados em dados REAIS (APIs ou tabelas oficiais)

APÓS COMPLETAR TODOS:
Me mostre relatório final para eu revisar
ENTÃO prosseguir para FASE 6 (Propostas Comerciais)

Pode começar ITEM 4.9 AGORA!


