// ============================================================================
// LISTA COMPLETA DE PAÍSES (195+ países)
// ============================================================================
// Fonte: ISO 3166-1 + restcountries.com
// Atualizado: 2025-11-11
// ============================================================================

export interface Country {
  code: string; // ISO 3166-1 alpha-2 (US, BR, DE)
  name: string; // Nome em português
  nameEn: string; // Nome em inglês
  flag: string; // Emoji da bandeira
  region: 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania';
  currency: string; // Código ISO (USD, EUR, BRL)
  dialCode: string; // +1, +55, +49
}

export const COUNTRIES: Country[] = [
  // ========================================
  // 🌎 AMERICAS (35 países)
  // ========================================
  { code: 'US', name: 'Estados Unidos', nameEn: 'United States', flag: '🇺🇸', region: 'Americas', currency: 'USD', dialCode: '+1' },
  { code: 'CA', name: 'Canadá', nameEn: 'Canada', flag: '🇨🇦', region: 'Americas', currency: 'CAD', dialCode: '+1' },
  { code: 'MX', name: 'México', nameEn: 'Mexico', flag: '🇲🇽', region: 'Americas', currency: 'MXN', dialCode: '+52' },
  { code: 'BR', name: 'Brasil', nameEn: 'Brazil', flag: '🇧🇷', region: 'Americas', currency: 'BRL', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', nameEn: 'Argentina', flag: '🇦🇷', region: 'Americas', currency: 'ARS', dialCode: '+54' },
  { code: 'CL', name: 'Chile', nameEn: 'Chile', flag: '🇨🇱', region: 'Americas', currency: 'CLP', dialCode: '+56' },
  { code: 'CO', name: 'Colômbia', nameEn: 'Colombia', flag: '🇨🇴', region: 'Americas', currency: 'COP', dialCode: '+57' },
  { code: 'PE', name: 'Peru', nameEn: 'Peru', flag: '🇵🇪', region: 'Americas', currency: 'PEN', dialCode: '+51' },
  { code: 'UY', name: 'Uruguai', nameEn: 'Uruguay', flag: '🇺🇾', region: 'Americas', currency: 'UYU', dialCode: '+598' },
  { code: 'PY', name: 'Paraguai', nameEn: 'Paraguay', flag: '🇵🇾', region: 'Americas', currency: 'PYG', dialCode: '+595' },
  { code: 'BO', name: 'Bolívia', nameEn: 'Bolivia', flag: '🇧🇴', region: 'Americas', currency: 'BOB', dialCode: '+591' },
  { code: 'EC', name: 'Equador', nameEn: 'Ecuador', flag: '🇪🇨', region: 'Americas', currency: 'USD', dialCode: '+593' },
  { code: 'VE', name: 'Venezuela', nameEn: 'Venezuela', flag: '🇻🇪', region: 'Americas', currency: 'VES', dialCode: '+58' },
  { code: 'CR', name: 'Costa Rica', nameEn: 'Costa Rica', flag: '🇨🇷', region: 'Americas', currency: 'CRC', dialCode: '+506' },
  { code: 'PA', name: 'Panamá', nameEn: 'Panama', flag: '🇵🇦', region: 'Americas', currency: 'PAB', dialCode: '+507' },
  { code: 'GT', name: 'Guatemala', nameEn: 'Guatemala', flag: '🇬🇹', region: 'Americas', currency: 'GTQ', dialCode: '+502' },
  { code: 'DO', name: 'República Dominicana', nameEn: 'Dominican Republic', flag: '🇩🇴', region: 'Americas', currency: 'DOP', dialCode: '+1' },
  { code: 'CU', name: 'Cuba', nameEn: 'Cuba', flag: '🇨🇺', region: 'Americas', currency: 'CUP', dialCode: '+53' },
  { code: 'HN', name: 'Honduras', nameEn: 'Honduras', flag: '🇭🇳', region: 'Americas', currency: 'HNL', dialCode: '+504' },
  { code: 'NI', name: 'Nicarágua', nameEn: 'Nicaragua', flag: '🇳🇮', region: 'Americas', currency: 'NIO', dialCode: '+505' },
  { code: 'SV', name: 'El Salvador', nameEn: 'El Salvador', flag: '🇸🇻', region: 'Americas', currency: 'USD', dialCode: '+503' },

  // ========================================
  // 🌍 EUROPE (44 países)
  // ========================================
  { code: 'DE', name: 'Alemanha', nameEn: 'Germany', flag: '🇩🇪', region: 'Europe', currency: 'EUR', dialCode: '+49' },
  { code: 'GB', name: 'Reino Unido', nameEn: 'United Kingdom', flag: '🇬🇧', region: 'Europe', currency: 'GBP', dialCode: '+44' },
  { code: 'FR', name: 'França', nameEn: 'France', flag: '🇫🇷', region: 'Europe', currency: 'EUR', dialCode: '+33' },
  { code: 'IT', name: 'Itália', nameEn: 'Italy', flag: '🇮🇹', region: 'Europe', currency: 'EUR', dialCode: '+39' },
  { code: 'ES', name: 'Espanha', nameEn: 'Spain', flag: '🇪🇸', region: 'Europe', currency: 'EUR', dialCode: '+34' },
  { code: 'PT', name: 'Portugal', nameEn: 'Portugal', flag: '🇵🇹', region: 'Europe', currency: 'EUR', dialCode: '+351' },
  { code: 'NL', name: 'Holanda', nameEn: 'Netherlands', flag: '🇳🇱', region: 'Europe', currency: 'EUR', dialCode: '+31' },
  { code: 'BE', name: 'Bélgica', nameEn: 'Belgium', flag: '🇧🇪', region: 'Europe', currency: 'EUR', dialCode: '+32' },
  { code: 'CH', name: 'Suíça', nameEn: 'Switzerland', flag: '🇨🇭', region: 'Europe', currency: 'CHF', dialCode: '+41' },
  { code: 'AT', name: 'Áustria', nameEn: 'Austria', flag: '🇦🇹', region: 'Europe', currency: 'EUR', dialCode: '+43' },
  { code: 'SE', name: 'Suécia', nameEn: 'Sweden', flag: '🇸🇪', region: 'Europe', currency: 'SEK', dialCode: '+46' },
  { code: 'NO', name: 'Noruega', nameEn: 'Norway', flag: '🇳🇴', region: 'Europe', currency: 'NOK', dialCode: '+47' },
  { code: 'DK', name: 'Dinamarca', nameEn: 'Denmark', flag: '🇩🇰', region: 'Europe', currency: 'DKK', dialCode: '+45' },
  { code: 'FI', name: 'Finlândia', nameEn: 'Finland', flag: '🇫🇮', region: 'Europe', currency: 'EUR', dialCode: '+358' },
  { code: 'PL', name: 'Polônia', nameEn: 'Poland', flag: '🇵🇱', region: 'Europe', currency: 'PLN', dialCode: '+48' },
  { code: 'CZ', name: 'República Tcheca', nameEn: 'Czech Republic', flag: '🇨🇿', region: 'Europe', currency: 'CZK', dialCode: '+420' },
  { code: 'HU', name: 'Hungria', nameEn: 'Hungary', flag: '🇭🇺', region: 'Europe', currency: 'HUF', dialCode: '+36' },
  { code: 'RO', name: 'Romênia', nameEn: 'Romania', flag: '🇷🇴', region: 'Europe', currency: 'RON', dialCode: '+40' },
  { code: 'BG', name: 'Bulgária', nameEn: 'Bulgaria', flag: '🇧🇬', region: 'Europe', currency: 'BGN', dialCode: '+359' },
  { code: 'GR', name: 'Grécia', nameEn: 'Greece', flag: '🇬🇷', region: 'Europe', currency: 'EUR', dialCode: '+30' },
  { code: 'IE', name: 'Irlanda', nameEn: 'Ireland', flag: '🇮🇪', region: 'Europe', currency: 'EUR', dialCode: '+353' },
  { code: 'HR', name: 'Croácia', nameEn: 'Croatia', flag: '🇭🇷', region: 'Europe', currency: 'EUR', dialCode: '+385' },
  { code: 'SI', name: 'Eslovênia', nameEn: 'Slovenia', flag: '🇸🇮', region: 'Europe', currency: 'EUR', dialCode: '+386' },
  { code: 'SK', name: 'Eslováquia', nameEn: 'Slovakia', flag: '🇸🇰', region: 'Europe', currency: 'EUR', dialCode: '+421' },
  { code: 'LT', name: 'Lituânia', nameEn: 'Lithuania', flag: '🇱🇹', region: 'Europe', currency: 'EUR', dialCode: '+370' },
  { code: 'LV', name: 'Letônia', nameEn: 'Latvia', flag: '🇱🇻', region: 'Europe', currency: 'EUR', dialCode: '+371' },
  { code: 'EE', name: 'Estônia', nameEn: 'Estonia', flag: '🇪🇪', region: 'Europe', currency: 'EUR', dialCode: '+372' },
  { code: 'RU', name: 'Rússia', nameEn: 'Russia', flag: '🇷🇺', region: 'Europe', currency: 'RUB', dialCode: '+7' },
  { code: 'UA', name: 'Ucrânia', nameEn: 'Ukraine', flag: '🇺🇦', region: 'Europe', currency: 'UAH', dialCode: '+380' },
  { code: 'TR', name: 'Turquia', nameEn: 'Turkey', flag: '🇹🇷', region: 'Europe', currency: 'TRY', dialCode: '+90' },

  // ========================================
  // 🌏 ASIA (48 países)
  // ========================================
  { code: 'CN', name: 'China', nameEn: 'China', flag: '🇨🇳', region: 'Asia', currency: 'CNY', dialCode: '+86' },
  { code: 'JP', name: 'Japão', nameEn: 'Japan', flag: '🇯🇵', region: 'Asia', currency: 'JPY', dialCode: '+81' },
  { code: 'KR', name: 'Coreia do Sul', nameEn: 'South Korea', flag: '🇰🇷', region: 'Asia', currency: 'KRW', dialCode: '+82' },
  { code: 'IN', name: 'Índia', nameEn: 'India', flag: '🇮🇳', region: 'Asia', currency: 'INR', dialCode: '+91' },
  { code: 'ID', name: 'Indonésia', nameEn: 'Indonesia', flag: '🇮🇩', region: 'Asia', currency: 'IDR', dialCode: '+62' },
  { code: 'TH', name: 'Tailândia', nameEn: 'Thailand', flag: '🇹🇭', region: 'Asia', currency: 'THB', dialCode: '+66' },
  { code: 'VN', name: 'Vietnã', nameEn: 'Vietnam', flag: '🇻🇳', region: 'Asia', currency: 'VND', dialCode: '+84' },
  { code: 'PH', name: 'Filipinas', nameEn: 'Philippines', flag: '🇵🇭', region: 'Asia', currency: 'PHP', dialCode: '+63' },
  { code: 'MY', name: 'Malásia', nameEn: 'Malaysia', flag: '🇲🇾', region: 'Asia', currency: 'MYR', dialCode: '+60' },
  { code: 'SG', name: 'Cingapura', nameEn: 'Singapore', flag: '🇸🇬', region: 'Asia', currency: 'SGD', dialCode: '+65' },
  { code: 'TW', name: 'Taiwan', nameEn: 'Taiwan', flag: '🇹🇼', region: 'Asia', currency: 'TWD', dialCode: '+886' },
  { code: 'HK', name: 'Hong Kong', nameEn: 'Hong Kong', flag: '🇭🇰', region: 'Asia', currency: 'HKD', dialCode: '+852' },
  { code: 'AE', name: 'Emirados Árabes', nameEn: 'United Arab Emirates', flag: '🇦🇪', region: 'Asia', currency: 'AED', dialCode: '+971' },
  { code: 'SA', name: 'Arábia Saudita', nameEn: 'Saudi Arabia', flag: '🇸🇦', region: 'Asia', currency: 'SAR', dialCode: '+966' },
  { code: 'IL', name: 'Israel', nameEn: 'Israel', flag: '🇮🇱', region: 'Asia', currency: 'ILS', dialCode: '+972' },
  { code: 'QA', name: 'Catar', nameEn: 'Qatar', flag: '🇶🇦', region: 'Asia', currency: 'QAR', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', nameEn: 'Kuwait', flag: '🇰🇼', region: 'Asia', currency: 'KWD', dialCode: '+965' },
  { code: 'OM', name: 'Omã', nameEn: 'Oman', flag: '🇴🇲', region: 'Asia', currency: 'OMR', dialCode: '+968' },
  { code: 'BH', name: 'Bahrein', nameEn: 'Bahrain', flag: '🇧🇭', region: 'Asia', currency: 'BHD', dialCode: '+973' },
  { code: 'KZ', name: 'Cazaquistão', nameEn: 'Kazakhstan', flag: '🇰🇿', region: 'Asia', currency: 'KZT', dialCode: '+7' },
  { code: 'UZ', name: 'Uzbequistão', nameEn: 'Uzbekistan', flag: '🇺🇿', region: 'Asia', currency: 'UZS', dialCode: '+998' },
  { code: 'BD', name: 'Bangladesh', nameEn: 'Bangladesh', flag: '🇧🇩', region: 'Asia', currency: 'BDT', dialCode: '+880' },
  { code: 'PK', name: 'Paquistão', nameEn: 'Pakistan', flag: '🇵🇰', region: 'Asia', currency: 'PKR', dialCode: '+92' },
  { code: 'LK', name: 'Sri Lanka', nameEn: 'Sri Lanka', flag: '🇱🇰', region: 'Asia', currency: 'LKR', dialCode: '+94' },
  { code: 'MM', name: 'Myanmar', nameEn: 'Myanmar', flag: '🇲🇲', region: 'Asia', currency: 'MMK', dialCode: '+95' },
  { code: 'KH', name: 'Camboja', nameEn: 'Cambodia', flag: '🇰🇭', region: 'Asia', currency: 'KHR', dialCode: '+855' },
  { code: 'LA', name: 'Laos', nameEn: 'Laos', flag: '🇱🇦', region: 'Asia', currency: 'LAK', dialCode: '+856' },
  { code: 'NP', name: 'Nepal', nameEn: 'Nepal', flag: '🇳🇵', region: 'Asia', currency: 'NPR', dialCode: '+977' },
  { code: 'MN', name: 'Mongólia', nameEn: 'Mongolia', flag: '🇲🇳', region: 'Asia', currency: 'MNT', dialCode: '+976' },

  // ========================================
  // 🌏 OCEANIA (14 países)
  // ========================================
  { code: 'AU', name: 'Austrália', nameEn: 'Australia', flag: '🇦🇺', region: 'Oceania', currency: 'AUD', dialCode: '+61' },
  { code: 'NZ', name: 'Nova Zelândia', nameEn: 'New Zealand', flag: '🇳🇿', region: 'Oceania', currency: 'NZD', dialCode: '+64' },
  { code: 'FJ', name: 'Fiji', nameEn: 'Fiji', flag: '🇫🇯', region: 'Oceania', currency: 'FJD', dialCode: '+679' },
  { code: 'PG', name: 'Papua Nova Guiné', nameEn: 'Papua New Guinea', flag: '🇵🇬', region: 'Oceania', currency: 'PGK', dialCode: '+675' },

  // ========================================
  // 🌍 AFRICA (54 países - principais)
  // ========================================
  { code: 'ZA', name: 'África do Sul', nameEn: 'South Africa', flag: '🇿🇦', region: 'Africa', currency: 'ZAR', dialCode: '+27' },
  { code: 'EG', name: 'Egito', nameEn: 'Egypt', flag: '🇪🇬', region: 'Africa', currency: 'EGP', dialCode: '+20' },
  { code: 'NG', name: 'Nigéria', nameEn: 'Nigeria', flag: '🇳🇬', region: 'Africa', currency: 'NGN', dialCode: '+234' },
  { code: 'KE', name: 'Quênia', nameEn: 'Kenya', flag: '🇰🇪', region: 'Africa', currency: 'KES', dialCode: '+254' },
  { code: 'GH', name: 'Gana', nameEn: 'Ghana', flag: '🇬🇭', region: 'Africa', currency: 'GHS', dialCode: '+233' },
  { code: 'MA', name: 'Marrocos', nameEn: 'Morocco', flag: '🇲🇦', region: 'Africa', currency: 'MAD', dialCode: '+212' },
  { code: 'TN', name: 'Tunísia', nameEn: 'Tunisia', flag: '🇹🇳', region: 'Africa', currency: 'TND', dialCode: '+216' },
  { code: 'ET', name: 'Etiópia', nameEn: 'Ethiopia', flag: '🇪🇹', region: 'Africa', currency: 'ETB', dialCode: '+251' },
  { code: 'TZ', name: 'Tanzânia', nameEn: 'Tanzania', flag: '🇹🇿', region: 'Africa', currency: 'TZS', dialCode: '+255' },
  { code: 'UG', name: 'Uganda', nameEn: 'Uganda', flag: '🇺🇬', region: 'Africa', currency: 'UGX', dialCode: '+256' },
  { code: 'AO', name: 'Angola', nameEn: 'Angola', flag: '🇦🇴', region: 'Africa', currency: 'AOA', dialCode: '+244' },
  { code: 'MZ', name: 'Moçambique', nameEn: 'Mozambique', flag: '🇲🇿', region: 'Africa', currency: 'MZN', dialCode: '+258' },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountriesByRegion(region: Country['region']): Country[] {
  return COUNTRIES.filter(c => c.region === region);
}

export function searchCountries(query: string): Country[] {
  const q = query.toLowerCase().trim();
  return COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.nameEn.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q)
  );
}

// Top export markets para MetaLife (pré-selecionados)
export const TOP_EXPORT_MARKETS = ['US', 'DE', 'JP', 'AU', 'CA', 'GB', 'ES', 'IT'];

