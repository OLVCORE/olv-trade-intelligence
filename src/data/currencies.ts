// ============================================================================
// LISTA COMPLETA DE MOEDAS (150+ moedas)
// ============================================================================
// Fonte: ISO 4217
// Conversão: exchangerate-api.com
// ============================================================================

export interface Currency {
  code: string; // ISO 4217 (USD, EUR, BRL)
  name: string; // Nome em português
  nameEn: string; // Nome em inglês
  symbol: string; // Símbolo ($, €, ¥)
  countries: string[]; // Países que usam (códigos ISO)
}

export const CURRENCIES: Currency[] = [
  // ========================================
  // PRINCIPAIS (Top 20)
  // ========================================
  { code: 'USD', name: 'Dólar Americano', nameEn: 'US Dollar', symbol: '$', countries: ['US', 'EC', 'PA', 'SV'] },
  { code: 'EUR', name: 'Euro', nameEn: 'Euro', symbol: '€', countries: ['DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'FI', 'IE', 'GR'] },
  { code: 'GBP', name: 'Libra Esterlina', nameEn: 'British Pound', symbol: '£', countries: ['GB'] },
  { code: 'JPY', name: 'Iene Japonês', nameEn: 'Japanese Yen', symbol: '¥', countries: ['JP'] },
  { code: 'CNY', name: 'Yuan Chinês', nameEn: 'Chinese Yuan', symbol: '¥', countries: ['CN'] },
  { code: 'AUD', name: 'Dólar Australiano', nameEn: 'Australian Dollar', symbol: 'A$', countries: ['AU'] },
  { code: 'CAD', name: 'Dólar Canadense', nameEn: 'Canadian Dollar', symbol: 'C$', countries: ['CA'] },
  { code: 'CHF', name: 'Franco Suíço', nameEn: 'Swiss Franc', symbol: 'CHF', countries: ['CH'] },
  { code: 'BRL', name: 'Real Brasileiro', nameEn: 'Brazilian Real', symbol: 'R$', countries: ['BR'] },
  { code: 'INR', name: 'Rupia Indiana', nameEn: 'Indian Rupee', symbol: '₹', countries: ['IN'] },
  { code: 'KRW', name: 'Won Sul-Coreano', nameEn: 'South Korean Won', symbol: '₩', countries: ['KR'] },
  { code: 'MXN', name: 'Peso Mexicano', nameEn: 'Mexican Peso', symbol: 'MX$', countries: ['MX'] },
  { code: 'SGD', name: 'Dólar de Cingapura', nameEn: 'Singapore Dollar', symbol: 'S$', countries: ['SG'] },
  { code: 'HKD', name: 'Dólar de Hong Kong', nameEn: 'Hong Kong Dollar', symbol: 'HK$', countries: ['HK'] },
  { code: 'NZD', name: 'Dólar Neozelandês', nameEn: 'New Zealand Dollar', symbol: 'NZ$', countries: ['NZ'] },
  { code: 'SEK', name: 'Coroa Sueca', nameEn: 'Swedish Krona', symbol: 'kr', countries: ['SE'] },
  { code: 'NOK', name: 'Coroa Norueguesa', nameEn: 'Norwegian Krone', symbol: 'kr', countries: ['NO'] },
  { code: 'DKK', name: 'Coroa Dinamarquesa', nameEn: 'Danish Krone', symbol: 'kr', countries: ['DK'] },
  { code: 'RUB', name: 'Rublo Russo', nameEn: 'Russian Ruble', symbol: '₽', countries: ['RU'] },
  { code: 'ZAR', name: 'Rand Sul-Africano', nameEn: 'South African Rand', symbol: 'R', countries: ['ZA'] },
  
  // ========================================
  // AMERICAS
  // ========================================
  { code: 'ARS', name: 'Peso Argentino', nameEn: 'Argentine Peso', symbol: '$', countries: ['AR'] },
  { code: 'CLP', name: 'Peso Chileno', nameEn: 'Chilean Peso', symbol: '$', countries: ['CL'] },
  { code: 'COP', name: 'Peso Colombiano', nameEn: 'Colombian Peso', symbol: '$', countries: ['CO'] },
  { code: 'PEN', name: 'Sol Peruano', nameEn: 'Peruvian Sol', symbol: 'S/', countries: ['PE'] },
  { code: 'UYU', name: 'Peso Uruguaio', nameEn: 'Uruguayan Peso', symbol: '$', countries: ['UY'] },
  { code: 'BOB', name: 'Boliviano', nameEn: 'Bolivian Boliviano', symbol: 'Bs', countries: ['BO'] },
  { code: 'PYG', name: 'Guarani Paraguaio', nameEn: 'Paraguayan Guarani', symbol: '₲', countries: ['PY'] },
  { code: 'VES', name: 'Bolívar Venezuelano', nameEn: 'Venezuelan Bolivar', symbol: 'Bs', countries: ['VE'] },
  
  // ========================================
  // ASIA
  // ========================================
  { code: 'THB', name: 'Baht Tailandês', nameEn: 'Thai Baht', symbol: '฿', countries: ['TH'] },
  { code: 'IDR', name: 'Rupia Indonésia', nameEn: 'Indonesian Rupiah', symbol: 'Rp', countries: ['ID'] },
  { code: 'MYR', name: 'Ringgit Malaio', nameEn: 'Malaysian Ringgit', symbol: 'RM', countries: ['MY'] },
  { code: 'PHP', name: 'Peso Filipino', nameEn: 'Philippine Peso', symbol: '₱', countries: ['PH'] },
  { code: 'VND', name: 'Dong Vietnamita', nameEn: 'Vietnamese Dong', symbol: '₫', countries: ['VN'] },
  { code: 'TWD', name: 'Dólar Taiwanês', nameEn: 'Taiwan Dollar', symbol: 'NT$', countries: ['TW'] },
  { code: 'AED', name: 'Dirham dos Emirados', nameEn: 'UAE Dirham', symbol: 'د.إ', countries: ['AE'] },
  { code: 'SAR', name: 'Rial Saudita', nameEn: 'Saudi Riyal', symbol: '﷼', countries: ['SA'] },
  { code: 'ILS', name: 'Shekel Israelense', nameEn: 'Israeli Shekel', symbol: '₪', countries: ['IL'] },
  { code: 'TRY', name: 'Lira Turca', nameEn: 'Turkish Lira', symbol: '₺', countries: ['TR'] },
  
  // ========================================
  // EUROPE
  // ========================================
  { code: 'PLN', name: 'Zloty Polonês', nameEn: 'Polish Zloty', symbol: 'zł', countries: ['PL'] },
  { code: 'CZK', name: 'Coroa Tcheca', nameEn: 'Czech Koruna', symbol: 'Kč', countries: ['CZ'] },
  { code: 'HUF', name: 'Forint Húngaro', nameEn: 'Hungarian Forint', symbol: 'Ft', countries: ['HU'] },
  { code: 'RON', name: 'Leu Romeno', nameEn: 'Romanian Leu', symbol: 'lei', countries: ['RO'] },
  { code: 'BGN', name: 'Lev Búlgaro', nameEn: 'Bulgarian Lev', symbol: 'лв', countries: ['BG'] },
  { code: 'UAH', name: 'Hryvnia Ucraniana', nameEn: 'Ukrainian Hryvnia', symbol: '₴', countries: ['UA'] },
  
  // ========================================
  // AFRICA
  // ========================================
  { code: 'EGP', name: 'Libra Egípcia', nameEn: 'Egyptian Pound', symbol: '£', countries: ['EG'] },
  { code: 'NGN', name: 'Naira Nigeriana', nameEn: 'Nigerian Naira', symbol: '₦', countries: ['NG'] },
  { code: 'KES', name: 'Xelim Queniano', nameEn: 'Kenyan Shilling', symbol: 'KSh', countries: ['KE'] },
  { code: 'GHS', name: 'Cedi Ganês', nameEn: 'Ghanaian Cedi', symbol: '₵', countries: ['GH'] },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

export function searchCurrencies(query: string): Currency[] {
  const q = query.toLowerCase().trim();
  return CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.nameEn.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q)
  );
}

// Top currencies para export
export const TOP_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD'];

