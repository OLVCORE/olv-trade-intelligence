import { useQuery } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

export interface ExchangeRates {
  base: string; // Moeda base (USD, EUR, etc)
  date: string; // Data da cotação
  timestamp: number; // Unix timestamp
  rates: Record<string, number>; // { EUR: 0.85, BRL: 5.03, ... }
}

// ============================================================================
// HOOK: useCurrencyConverter (Exchange Rate API)
// ============================================================================

export function useCurrencyConverter(baseCurrency: string = 'USD') {
  return useQuery({
    queryKey: ['exchange-rates', baseCurrency],
    queryFn: async () => {
      console.log('[CURRENCY] 💱 Buscando taxas de câmbio para:', baseCurrency);

      // API: exchangerate-api.com (grátis 1,500 req/mês)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error(`Exchange Rate API error: ${response.status}`);
      }

      const data = await response.json();

      console.log('[CURRENCY] ✅ Taxas recebidas:', Object.keys(data.rates).length, 'moedas');
      console.log('[CURRENCY] 📊 Principais:', {
        EUR: data.rates.EUR,
        BRL: data.rates.BRL,
        GBP: data.rates.GBP,
        JPY: data.rates.JPY,
        CNY: data.rates.CNY,
      });

      return {
        base: data.base,
        date: data.date,
        timestamp: Date.now(),
        rates: data.rates,
      } as ExchangeRates;
    },
    staleTime: 1000 * 60 * 60, // 1 hora (taxas não mudam muito)
    gcTime: 1000 * 60 * 60 * 6, // 6 horas em cache
    retry: 3,
    retryDelay: 1000,
  });
}

// ============================================================================
// HELPER: Convert Amount
// ============================================================================

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (!rates || !rates.rates) {
    console.warn('[CURRENCY] ⚠️ Taxas não disponíveis');
    return amount;
  }

  // Se moedas são iguais, retorna direto
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Se base é USD (padrão)
  if (rates.base === fromCurrency) {
    const rate = rates.rates[toCurrency];
    if (!rate) {
      console.warn('[CURRENCY] ⚠️ Taxa não encontrada para:', toCurrency);
      return amount;
    }
    return amount * rate;
  }

  // Se precisa converter de outra moeda para USD primeiro
  const fromRate = rates.rates[fromCurrency];
  const toRate = rates.rates[toCurrency];

  if (!fromRate || !toRate) {
    console.warn('[CURRENCY] ⚠️ Taxa não encontrada');
    return amount;
  }

  // Converter via USD (cross rate)
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

// ============================================================================
// HELPER: Format Currency
// ============================================================================

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

