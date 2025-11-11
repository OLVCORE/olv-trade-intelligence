// ============================================================================
// INCENTIVOS FISCAIS BRASIL - EXPORTAÇÃO
// ============================================================================
// Fonte: Receita Federal do Brasil, MDIC (Ministério do Desenvolvimento)
// Atualização: 2025 (vigente)
// ============================================================================

export interface ExportIncentive {
  code: string;
  name: string; // Nome oficial
  namePt: string; // Nome em português
  description: string;
  benefit: string; // "ICMS 0%", "IPI suspenso", etc
  reductionRate: number; // Taxa de redução (0.18 = 18%)
  eligibility: string[]; // Quem pode usar
  legalBasis: string; // Base legal
  applicationProcess: string; // Como solicitar
}

export const BRAZIL_EXPORT_INCENTIVES: ExportIncentive[] = [
  {
    code: 'ICMS_EXEMPT',
    name: 'ICMS Exemption',
    namePt: 'Isenção de ICMS',
    description: 'Exportações são imunes ao ICMS (Art. 155, § 2º, X, "a" da Constituição Federal)',
    benefit: 'ICMS 0%',
    reductionRate: 0.18, // 18% (alíquota média SP)
    eligibility: ['Todas as operações de exportação direta'],
    legalBasis: 'CF/88 Art. 155, § 2º, X, "a" + LC 87/1996',
    applicationProcess: 'Automático (imunidade constitucional)'
  },
  {
    code: 'IPI_SUSPENSION',
    name: 'IPI Suspension',
    namePt: 'Suspensão de IPI',
    description: 'IPI suspenso na compra de insumos destinados à industrialização de produtos para exportação',
    benefit: 'IPI Suspenso',
    reductionRate: 0.10, // 10% (alíquota média IPI)
    eligibility: ['Produtos industrializados destinados à exportação'],
    legalBasis: 'Decreto 7.212/2010 (RIPI) Art. 43',
    applicationProcess: 'Registro de operação no sistema DCIP'
  },
  {
    code: 'PIS_COFINS_ZERO',
    name: 'PIS/COFINS Zero Rate',
    namePt: 'PIS/COFINS Alíquota Zero',
    description: 'Receitas de exportação têm alíquota zero de PIS e COFINS',
    benefit: 'PIS/COFINS 0%',
    reductionRate: 0.0965, // 9.65% (PIS 1.65% + COFINS 7.6%)
    eligibility: ['Todas as receitas de exportação de bens e serviços'],
    legalBasis: 'Lei 10.637/2002 e Lei 10.833/2003',
    applicationProcess: 'Automático na emissão da nota fiscal de exportação'
  },
  {
    code: 'DRAWBACK',
    name: 'Drawback',
    namePt: 'Drawback Integrado',
    description: 'Suspensão ou isenção de tributos (II, IPI, PIS, COFINS, AFRMM) na importação de insumos para exportação',
    benefit: 'Tributos Suspensos',
    reductionRate: 0.25, // 25% (economia média em insumos importados)
    eligibility: ['Empresas que importam insumos/matéria-prima para fabricar produtos destinados à exportação'],
    legalBasis: 'Decreto-Lei 37/1966 + Portaria SECEX 23/2011',
    applicationProcess: 'Solicitar regime via Siscomex (drawback integrado suspensão)'
  },
  {
    code: 'REINTEGRA',
    name: 'REINTEGRA',
    namePt: 'Regime Especial de Reintegração de Valores Tributários',
    description: 'Devolução de resíduos tributários de PIS/COFINS/ICMS não recuperáveis (0.1% a 3% do valor exportado)',
    benefit: 'Crédito de 0.1% a 3%',
    reductionRate: 0.02, // 2% (alíquota média para manufaturados)
    eligibility: ['Produtos manufaturados exportados (NCM específicos)'],
    legalBasis: 'Lei 12.546/2011 + Decreto 11.322/2022',
    applicationProcess: 'Crédito automático ao declarar exportação (apurado mensalmente na DCTF)'
  },
];

// ============================================================================
// CALCULATE TOTAL EXPORT INCENTIVES
// ============================================================================

interface IncentivesCalculationParams {
  productValue: number; // Valor FOB base (USD)
  hasDrawback: boolean; // Empresa usa drawback?
  hasReintegra: boolean; // Produto elegível para REINTEGRA?
  icmsRate?: number; // Alíquota ICMS do estado (padrão: 18%)
  ipiRate?: number; // Alíquota IPI do produto (padrão: 10%)
}

interface IncentivesResult {
  originalCost: number;
  totalIncentivesValue: number;
  netCost: number; // Custo líquido após incentivos
  breakdown: Array<{
    code: string;
    name: string;
    value: number;
    rate: number;
  }>;
  effectiveSavings: number; // % de economia total
}

export function calculateExportIncentives(params: IncentivesCalculationParams): IncentivesResult {
  const {
    productValue,
    hasDrawback,
    hasReintegra,
    icmsRate = 0.18,
    ipiRate = 0.10,
  } = params;

  const breakdown: IncentivesResult['breakdown'] = [];
  let totalReduction = 0;

  // 1. ICMS 0% (SEMPRE aplicável - imunidade constitucional)
  const icmsValue = productValue * icmsRate;
  totalReduction += icmsValue;
  breakdown.push({
    code: 'ICMS_EXEMPT',
    name: 'ICMS 0% (Imunidade)',
    value: icmsValue,
    rate: icmsRate,
  });

  // 2. PIS/COFINS 0% (SEMPRE aplicável - alíquota zero)
  const pisCofinsValue = productValue * 0.0965;
  totalReduction += pisCofinsValue;
  breakdown.push({
    code: 'PIS_COFINS_ZERO',
    name: 'PIS/COFINS 0%',
    value: pisCofinsValue,
    rate: 0.0965,
  });

  // 3. IPI Suspenso (SEMPRE aplicável - produtos industrializados)
  const ipiValue = productValue * ipiRate;
  totalReduction += ipiValue;
  breakdown.push({
    code: 'IPI_SUSPENSION',
    name: 'IPI Suspenso',
    value: ipiValue,
    rate: ipiRate,
  });

  // 4. Drawback (OPCIONAL - empresa deve solicitar regime)
  if (hasDrawback) {
    const drawbackValue = productValue * 0.25; // 25% economia em insumos importados
    totalReduction += drawbackValue;
    breakdown.push({
      code: 'DRAWBACK',
      name: 'Drawback Integrado',
      value: drawbackValue,
      rate: 0.25,
    });
  }

  // 5. REINTEGRA (OPCIONAL - produto deve ser elegível)
  if (hasReintegra) {
    const reintegraValue = productValue * 0.02; // 2% crédito
    totalReduction += reintegraValue;
    breakdown.push({
      code: 'REINTEGRA',
      name: 'REINTEGRA Crédito',
      value: reintegraValue,
      rate: 0.02,
    });
  }

  const netCost = productValue - totalReduction;
  const effectiveSavings = (totalReduction / productValue) * 100; // % de economia

  console.log('[INCENTIVES] 💰 Incentivos Calculados:', {
    productValue,
    totalIncentivesValue: totalReduction,
    netCost,
    effectiveSavings: `${effectiveSavings.toFixed(1)}%`,
  });

  return {
    originalCost: productValue,
    totalIncentivesValue: totalReduction,
    netCost,
    breakdown,
    effectiveSavings,
  };
}

// ============================================================================
// HELPER: Check Drawback Eligibility
// ============================================================================

export function isDrawbackEligible(hsCode: string): boolean {
  // Drawback é elegível para praticamente todos os produtos industrializados
  // Exceções: alguns produtos agrícolas in natura
  
  const ineligiblePrefixes = [
    '01', // Animais vivos
    '02', // Carnes frescas
    '03', // Peixes frescos
  ];
  
  const prefix = hsCode.substring(0, 2);
  return !ineligiblePrefixes.includes(prefix);
}

// ============================================================================
// HELPER: Check REINTEGRA Eligibility
// ============================================================================

export function isReintegraEligible(hsCode: string): boolean {
  // REINTEGRA é elegível para produtos manufaturados
  // NCM 9506 (sporting equipment) é elegível
  
  const eligiblePrefixes = [
    '94', // Móveis
    '95', // Brinquedos, jogos, artigos esportivos
  ];
  
  const prefix = hsCode.substring(0, 2);
  return eligiblePrefixes.includes(prefix);
}

// ============================================================================
// HELPER: Estimate Total Savings
// ============================================================================

export function estimateTotalExportSavings(
  productValueUSD: number,
  hsCode: string
): {
  minSavings: number; // USD (sem Drawback/REINTEGRA)
  maxSavings: number; // USD (com Drawback+REINTEGRA)
  minPercentage: number; // %
  maxPercentage: number; // %
} {
  // Mínimo (ICMS + PIS/COFINS + IPI - sempre aplicáveis)
  const minResult = calculateExportIncentives({
    productValue: productValueUSD,
    hasDrawback: false,
    hasReintegra: false,
  });

  // Máximo (com Drawback + REINTEGRA)
  const maxResult = calculateExportIncentives({
    productValue: productValueUSD,
    hasDrawback: isDrawbackEligible(hsCode),
    hasReintegra: isReintegraEligible(hsCode),
  });

  return {
    minSavings: minResult.totalIncentivesValue,
    maxSavings: maxResult.totalIncentivesValue,
    minPercentage: minResult.effectiveSavings,
    maxPercentage: maxResult.effectiveSavings,
  };
}

