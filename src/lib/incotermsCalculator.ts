// ============================================================================
// INCOTERMS CALCULATOR - ROBUSTO E COMPLETO
// ============================================================================
// Calcula TODOS os 11 Incoterms oficiais ICC 2020
// Integra: Shipping Calculator + Export Incentives Brasil
// ============================================================================

import { calculateShippingCost, type ShippingParams } from './shippingCalculator';
import { calculateExportIncentives } from './exportIncentives';

// ============================================================================
// TYPES
// ============================================================================

export interface IncotermCalculationParams {
  // DADOS DO PRODUTO (usuário insere TUDO - SEM hard-coded!)
  productValue: number; // FOB base (USD) - USUÁRIO INSERE
  weight: number; // kg EXATO - USUÁRIO INSERE
  volume: number; // m³ EXATO - USUÁRIO INSERE

  // LOGÍSTICA (usuário seleciona)
  originPort: string; // 'BRSSZ' (Santos)
  destinationPort: string; // 'USLAX' (Los Angeles)
  transportMode: 'ocean' | 'air' | 'road' | 'rail';

  // INCENTIVOS FISCAIS BRASIL (usuário marca checkboxes)
  hasDrawback?: boolean; // Empresa usa drawback?
  hasReintegra?: boolean; // Produto elegível REINTEGRA?
  icmsRate?: number; // Alíquota ICMS do estado (padrão: 18%)
  ipiRate?: number; // Alíquota IPI do produto (padrão: 10%)

  // OUTROS
  insuranceRate?: number; // % (padrão: 1% do valor CIF)
  customDutyRate?: number; // % tarifa importação país destino (padrão: 5%)
  destinationHandling?: number; // USD (manuseio no destino - padrão: 200)
}

export interface IncotermResult {
  incoterm: string; // 'EXW', 'FOB', 'CIF', etc
  value: number; // USD (valor total)
  breakdown: Array<{
    label: string;
    value: number;
    percentage?: number; // % do total (opcional)
    isNegative?: boolean; // Para incentivos (redução)
  }>;
  savings: {
    exportIncentives: number; // USD economizado com incentivos Brasil
    netCost: number; // Custo líquido após incentivos
  };
  metadata: {
    calculatedAt: string; // ISO timestamp
    shippingSource: 'freightos_api' | 'shipengine_api' | 'estimate';
    estimatedDays: number;
  };
}

// ============================================================================
// MAIN FUNCTION: Calculate ALL 11 Incoterms
// ============================================================================

export async function calculateAllIncoterms(
  params: IncotermCalculationParams
): Promise<Record<string, IncotermResult>> {
  const {
    productValue,
    weight,
    volume,
    originPort,
    destinationPort,
    transportMode,
    hasDrawback = false,
    hasReintegra = true,
    icmsRate = 0.18,
    ipiRate = 0.10,
    insuranceRate = 0.01,
    customDutyRate = 0.05,
    destinationHandling = 200,
  } = params;

  console.log('[INCOTERMS] 🧮 Calculando TODOS os 11 Incoterms...');

  // 1️⃣ Calcular incentivos fiscais Brasil
  const incentives = calculateExportIncentives({
    productValue,
    hasDrawback,
    hasReintegra,
    icmsRate,
    ipiRate,
  });

  console.log('[INCOTERMS] 💰 Incentivos Brasil:', {
    original: `USD ${productValue.toFixed(2)}`,
    incentives: `USD ${incentives.totalIncentivesValue.toFixed(2)}`,
    net: `USD ${incentives.netCost.toFixed(2)}`,
    savings: `${incentives.effectiveSavings.toFixed(1)}%`,
  });

  // 2️⃣ Calcular frete (API real ou estimativa)
  const shipping = await calculateShippingCost({
    weight,
    volume,
    originPort,
    destinationPort,
    transportMode,
  } as ShippingParams);

  console.log('[INCOTERMS] 🚢 Frete calculado:', {
    base: `USD ${shipping.baseFreight.toFixed(2)}`,
    total: `USD ${shipping.total.toFixed(2)}`,
    days: shipping.estimatedDays,
    source: shipping.source,
  });

  const timestamp = new Date().toISOString();

  // 3️⃣ Calcular cada Incoterm (11 oficiais ICC 2020)

  // GRUPO E: EXW (Ex Works)
  const localHandling = productValue * 0.05; // 5% movimentação local
  const exw: IncotermResult = {
    incoterm: 'EXW',
    value: incentives.netCost - localHandling,
    breakdown: [
      { label: 'Custo do Produto (base)', value: productValue },
      { label: 'Incentivos Fiscais Brasil', value: -incentives.totalIncentivesValue, isNegative: true },
      { label: 'Movimentação Local (não incluída)', value: -localHandling, isNegative: true },
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: incentives.netCost - localHandling,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: 0, // Cliente retira
    },
  };

  // GRUPO F: FCA (Free Carrier)
  const localTransport = 50; // USD (transporte até transportador)
  const fca: IncotermResult = {
    incoterm: 'FCA',
    value: incentives.netCost + localTransport,
    breakdown: [
      { label: 'Custo do Produto (base)', value: productValue },
      { label: 'Incentivos Fiscais Brasil', value: -incentives.totalIncentivesValue, isNegative: true },
      { label: 'Transporte até Transportador', value: localTransport },
      { label: 'Desembaraço Exportação', value: 0 }, // Incluso
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: incentives.netCost + localTransport,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: 1,
    },
  };

  // GRUPO F: FAS (Free Alongside Ship)
  const portTransport = productValue * 0.03; // 3% transporte até porto
  const fas: IncotermResult = {
    incoterm: 'FAS',
    value: incentives.netCost + portTransport,
    breakdown: [
      { label: 'Custo do Produto (base)', value: productValue },
      { label: 'Incentivos Fiscais Brasil', value: -incentives.totalIncentivesValue, isNegative: true },
      { label: 'Transporte até Porto', value: portTransport },
      { label: 'Desembaraço Exportação', value: 0 }, // Incluso
      { label: 'Carregamento (não incluso)', value: 0 },
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: incentives.netCost + portTransport,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: 2,
    },
  };

  // GRUPO F: FOB (Free on Board) ⭐ MAIS USADO
  const loadingCost = 50; // USD (carregamento no navio)
  const fob: IncotermResult = {
    incoterm: 'FOB',
    value: incentives.netCost + portTransport + loadingCost,
    breakdown: [
      { label: 'Custo do Produto (base)', value: productValue },
      { label: 'Incentivos Fiscais Brasil', value: -incentives.totalIncentivesValue, isNegative: true },
      { label: 'Transporte até Porto', value: portTransport },
      { label: 'Carregamento no Navio', value: loadingCost },
      { label: 'Desembaraço Exportação', value: 0 }, // Incluso
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: incentives.netCost + portTransport + loadingCost,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: 3,
    },
  };

  // GRUPO C: CFR (Cost and Freight)
  const cfr: IncotermResult = {
    incoterm: 'CFR',
    value: fob.value + shipping.total,
    breakdown: [
      { label: 'FOB', value: fob.value },
      { label: 'Frete Base', value: shipping.baseFreight },
      { label: 'BAF (Combustível)', value: shipping.fuelSurcharge },
      { label: 'THC (Manuseio)', value: shipping.handling },
      { label: 'Documentação (BL/AWB)', value: shipping.documentation },
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: fob.value + shipping.total,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: shipping.estimatedDays,
    },
  };

  // GRUPO C: CIF (Cost, Insurance, Freight) ⭐ 2º MAIS USADO
  const insuranceValue = (fob.value + shipping.total) * insuranceRate;
  const cif: IncotermResult = {
    incoterm: 'CIF',
    value: cfr.value + insuranceValue,
    breakdown: [
      { label: 'CFR', value: cfr.value },
      { label: `Seguro Marítimo (${(insuranceRate * 100).toFixed(1)}%)`, value: insuranceValue },
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: cfr.value + insuranceValue,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: shipping.estimatedDays,
    },
  };

  // GRUPO C: CPT (Carriage Paid To) - Multimodal
  const cpt: IncotermResult = {
    ...cfr,
    incoterm: 'CPT',
  };

  // GRUPO C: CIP (Carriage and Insurance Paid To) - Multimodal
  const cip: IncotermResult = {
    ...cif,
    incoterm: 'CIP',
  };

  // GRUPO D: DAP (Delivered at Place)
  const dap: IncotermResult = {
    incoterm: 'DAP',
    value: cif.value + destinationHandling,
    breakdown: [
      { label: 'CIF', value: cif.value },
      { label: 'Transporte até Destino', value: destinationHandling },
      { label: 'Desembaraço Importação (não incluso)', value: 0 },
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: cif.value + destinationHandling,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: shipping.estimatedDays + 2,
    },
  };

  // GRUPO D: DPU (Delivered at Place Unloaded)
  const unloadingCost = 100; // USD (descarga)
  const dpu: IncotermResult = {
    incoterm: 'DPU',
    value: dap.value + unloadingCost,
    breakdown: [
      { label: 'DAP', value: dap.value },
      { label: 'Descarga no Destino', value: unloadingCost },
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: dap.value + unloadingCost,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: shipping.estimatedDays + 2,
    },
  };

  // GRUPO D: DDP (Delivered Duty Paid) - MÁXIMO
  const customDuty = incentives.netCost * customDutyRate;
  const customsClearance = 150; // USD (desembaraço importação)
  const ddp: IncotermResult = {
    incoterm: 'DDP',
    value: dpu.value + customDuty + customsClearance,
    breakdown: [
      { label: 'DPU', value: dpu.value },
      { label: `Tarifa de Importação (${(customDutyRate * 100).toFixed(1)}%)`, value: customDuty },
      { label: 'Desembaraço Importação', value: customsClearance },
    ],
    savings: {
      exportIncentives: incentives.totalIncentivesValue,
      netCost: dpu.value + customDuty + customsClearance,
    },
    metadata: {
      calculatedAt: timestamp,
      shippingSource: shipping.source,
      estimatedDays: shipping.estimatedDays + 3,
    },
  };

  console.log('[INCOTERMS] ✅ Todos os 11 Incoterms calculados!');
  console.log('[INCOTERMS] 💰 Range de preços:', {
    min: `USD ${exw.value.toFixed(2)} (EXW)`,
    max: `USD ${ddp.value.toFixed(2)} (DDP)`,
    diff: `USD ${(ddp.value - exw.value).toFixed(2)}`,
  });

  // Retornar TODOS os 11 Incoterms
  return {
    EXW: exw,
    FCA: fca,
    FAS: fas,
    FOB: fob,
    CFR: cfr,
    CIF: cif,
    CPT: cpt,
    CIP: cip,
    DAP: dap,
    DPU: dpu,
    DDP: ddp,
  };
}

// ============================================================================
// HELPER: Quick Calculate Single Incoterm
// ============================================================================

export async function calculateSingleIncoterm(
  incotermCode: string,
  params: IncotermCalculationParams
): Promise<IncotermResult> {
  const allResults = await calculateAllIncoterms(params);
  const result = allResults[incotermCode];

  if (!result) {
    throw new Error(`Incoterm inválido: ${incotermCode}`);
  }

  return result;
}

// ============================================================================
// HELPER: Compare Incoterms
// ============================================================================

export async function compareIncoterms(
  params: IncotermCalculationParams,
  incoterms: string[] = ['FOB', 'CIF', 'DDP'] // Padrão: 3 principais
): Promise<{
  comparison: IncotermResult[];
  cheapest: IncotermResult;
  mostExpensive: IncotermResult;
  difference: number;
}> {
  const allResults = await calculateAllIncoterms(params);

  const comparison = incoterms.map(code => allResults[code]).filter(Boolean);

  const sorted = [...comparison].sort((a, b) => a.value - b.value);

  return {
    comparison,
    cheapest: sorted[0],
    mostExpensive: sorted[sorted.length - 1],
    difference: sorted[sorted.length - 1].value - sorted[0].value,
  };
}

// ============================================================================
// HELPER: Estimate Total Landed Cost
// ============================================================================

export async function estimateLandedCost(
  params: IncotermCalculationParams
): Promise<{
  fobCost: number; // Custo FOB
  landedCost: number; // Custo total porta-a-porta (DDP)
  totalLogistics: number; // Custos logísticos totais
  percentageLogistics: number; // % que logística representa
}> {
  const results = await calculateAllIncoterms(params);

  const fobCost = results.FOB.value;
  const landedCost = results.DDP.value;
  const totalLogistics = landedCost - fobCost;
  const percentageLogistics = (totalLogistics / landedCost) * 100;

  return {
    fobCost,
    landedCost,
    totalLogistics,
    percentageLogistics,
  };
}

