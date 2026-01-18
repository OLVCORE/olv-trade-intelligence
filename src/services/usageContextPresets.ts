/**
 * USAGE CONTEXT PRESETS
 * 
 * Presets pré-configurados de uso final para facilitar busca B2B
 * Cada preset preenche automaticamente usageContextInclude e usageContextExclude
 */

export interface UsageContextPreset {
  id: string;
  name: string;
  description: string;
  usageContext: {
    include: string[];
    exclude: string[];
  };
  commonHSCodes?: string[]; // HS Codes comuns para este preset
  keywords?: string[]; // Keywords sugeridas
}

export const USAGE_CONTEXT_PRESETS: UsageContextPreset[] = [
  {
    id: 'pilates-professional',
    name: 'Pilates Profissional',
    description: 'Equipamentos de Pilates para estúdios profissionais e academias',
    usageContext: {
      include: [
        'pilates studio',
        'estudio pilates profissional',
        'equipamento pilates',
        'aparelho pilates',
        'máquina pilates',
        'pilates reformer',
        'pilates cadillac',
        'pilates tower',
        'pilates chair',
        'academia pilates',
      ],
      exclude: [
        'home gym',
        'dumbbell',
        'uso doméstico',
        'hobby',
        'personal trainer',
        'uso pessoal',
        'equipamento casa',
      ],
    },
    commonHSCodes: ['950691'], // Equipamentos de exercício físico
    keywords: ['pilates reformer', 'pilates equipment', 'pilates cadillac', 'pilates tower', 'pilates chair'],
  },
  {
    id: 'aviation-aerospace',
    name: 'Aviação / Aerospace',
    description: 'Componentes aeronáuticos e aeroespaciais para fabricação e manutenção',
    usageContext: {
      include: [
        'aerospace manufacturing',
        'aviation industry',
        'aircraft production',
        'aircraft maintenance',
        'aeronautical component',
        'aviation equipment',
        'aircraft parts',
        'aerospace component',
      ],
      exclude: [
        'hobby drone',
        'drone hobby',
        'model aircraft',
        'retail aviation',
        'toy aircraft',
        'uso recreativo',
      ],
    },
    commonHSCodes: ['880330', '880390'], // Hélices e partes de aeronaves
    keywords: ['aerospace component', 'aviation equipment', 'aircraft parts', 'aerospace manufacturing'],
  },
  {
    id: 'construction-infrastructure',
    name: 'Construção Civil / Infraestrutura',
    description: 'Equipamentos e máquinas de construção para projetos estruturais e infraestrutura',
    usageContext: {
      include: [
        'structural construction',
        'infrastructure',
        'construction project',
        'civil engineering',
        'construction machinery',
        'construction equipment',
        'building construction',
        'infrastructure project',
      ],
      exclude: [
        'DIY',
        'home improvement',
        'home depot',
        'do it yourself',
        'uso doméstico',
        'reforma casa',
        'construção casa',
      ],
    },
    commonHSCodes: ['842951', '842952'], // Máquinas de construção
    keywords: ['construction equipment', 'construction machinery', 'excavator', 'crane', 'construction project'],
  },
  {
    id: 'agribusiness-livestock',
    name: 'Agronegócio / Produção Animal',
    description: 'Rações, aditivos e equipamentos para produção animal e aquicultura',
    usageContext: {
      include: [
        'feed mill',
        'aquaculture',
        'livestock production',
        'animal feed production',
        'livestock nutrition',
        'poultry production',
        'swine production',
        'cattle production',
      ],
      exclude: [
        'garden center',
        'pet shop',
        'retail pet food',
        'home garden',
        'pet food',
        'comida animal doméstico',
      ],
    },
    commonHSCodes: ['230990', '310100'], // Rações para animais, fertilizantes
    keywords: ['feed additive', 'feed mill', 'aquaculture feed', 'livestock nutrition', 'animal feed'],
  },
];

/**
 * Buscar preset por ID
 */
export function getPresetById(id: string): UsageContextPreset | undefined {
  return USAGE_CONTEXT_PRESETS.find(p => p.id === id);
}

/**
 * Listar todos os presets
 */
export function getAllPresets(): UsageContextPreset[] {
  return USAGE_CONTEXT_PRESETS;
}
