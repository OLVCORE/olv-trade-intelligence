// ✅ Serviço de Enriquecimento 360° SIMPLIFICADO (sem Edge Function)
// Calcula scores baseados nos dados já coletados

export interface Enrichment360Result {
  success: boolean;
  scores?: {
    digital_presence: number;
    digital_maturity: number;
    tech_sophistication: number;
    overall_health: number;
  };
  analysis?: {
    hasWebsite: boolean;
    hasLinkedIn: boolean;
    hasSocialMedia: boolean;
    estimatedEmployees: number;
    estimatedYearsActive: number;
  };
  error?: string;
}

export async function enrichment360Simplificado(data: {
  razao_social: string;
  website?: string;
  domain?: string;
  uf?: string;
  porte?: string;
  cnae?: string;
  raw_data?: any;
}): Promise<Enrichment360Result> {
  try {
    console.log('[360°] 🔍 Iniciando análise simplificada:', data.razao_social);

    const rawData = data.raw_data || {};
    
    // Análise básica
    const hasWebsite = Boolean(data.website || data.domain);
    const hasLinkedIn = Boolean(rawData.linkedin || rawData.apollo_organizations?.length > 0);
    const hasSocialMedia = Boolean(
      rawData.instagram || 
      rawData.facebook || 
      rawData.youtube
    );

    // Estimar funcionários baseado no porte
    let estimatedEmployees = 50; // Padrão
    if (data.porte) {
      const porte = data.porte.toLowerCase();
      if (porte.includes('micro')) estimatedEmployees = 10;
      else if (porte.includes('pequena') || porte.includes('pequeno')) estimatedEmployees = 50;
      else if (porte.includes('media') || porte.includes('médio')) estimatedEmployees = 200;
      else if (porte.includes('grande')) estimatedEmployees = 500;
    }

    // Estimar anos de atividade (assumir média de 10 anos)
    const estimatedYearsActive = 10;

    // Calcular scores
    const digitalPresence = calculateDigitalPresence({
      hasWebsite,
      hasLinkedIn,
      hasSocialMedia,
    });

    const digitalMaturity = calculateDigitalMaturity({
      hasWebsite,
      hasLinkedIn,
      hasTechStack: false, // Não temos tech stack sem scraping
      employees: estimatedEmployees,
    });

    const techSophistication = calculateTechSophistication({
      hasWebsite,
      hasSocialMedia,
      hasModernStack: false,
    });

    const overallHealth = Math.round(
      (digitalPresence + digitalMaturity + techSophistication) / 3
    );

    console.log('[360°] ✅ Scores calculados:', {
      digitalPresence,
      digitalMaturity,
      techSophistication,
      overallHealth
    });

    return {
      success: true,
      scores: {
        digital_presence: digitalPresence,
        digital_maturity: digitalMaturity,
        tech_sophistication: techSophistication,
        overall_health: overallHealth,
      },
      analysis: {
        hasWebsite,
        hasLinkedIn,
        hasSocialMedia,
        estimatedEmployees,
        estimatedYearsActive,
      }
    };

  } catch (error: any) {
    console.error('[360°] ❌ Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao calcular scores 360°'
    };
  }
}

// ========================================
// FUNÇÕES DE CÁLCULO
// ========================================

function calculateDigitalPresence(data: {
  hasWebsite: boolean;
  hasLinkedIn: boolean;
  hasSocialMedia: boolean;
}): number {
  let score = 40; // Base

  if (data.hasWebsite) score += 25;
  if (data.hasLinkedIn) score += 20;
  if (data.hasSocialMedia) score += 15;

  return Math.min(100, score);
}

function calculateDigitalMaturity(data: {
  hasWebsite: boolean;
  hasLinkedIn: boolean;
  hasTechStack: boolean;
  employees: number;
}): number {
  let score = 30; // Base

  if (data.hasWebsite) score += 20;
  if (data.hasLinkedIn) score += 15;
  if (data.hasTechStack) score += 15;
  
  // Empresas maiores tendem a ter maior maturidade
  if (data.employees > 100) score += 10;
  if (data.employees > 500) score += 10;

  return Math.min(100, score);
}

function calculateTechSophistication(data: {
  hasWebsite: boolean;
  hasSocialMedia: boolean;
  hasModernStack: boolean;
}): number {
  let score = 35; // Base conservador

  if (data.hasWebsite) score += 20;
  if (data.hasSocialMedia) score += 15;
  if (data.hasModernStack) score += 30;

  return Math.min(100, score);
}

