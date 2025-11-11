import { useQuery } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

export interface Country {
  code: string; // ISO 3166-1 alpha-2 (US, BR, DE)
  name: string; // Nome em português
  nameEn: string; // Nome em inglês (oficial)
  flag: string; // Emoji da bandeira
  region: 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania' | 'Antarctic' | 'Unknown';
  subregion: string; // South America, Western Europe, etc
  currency: string; // Código ISO (USD, EUR, BRL)
  currencies: string[]; // Array de moedas (alguns países têm múltiplas)
  dialCode: string; // +1, +55, +49
  capital: string; // Capital city
  population: number; // População
  area: number; // Área em km²
  coordinates: [number, number]; // [lat, lng]
}

// ============================================================================
// HOOK: useCountries (REST Countries API)
// ============================================================================

export function useCountries() {
  return useQuery({
    queryKey: ['countries-all-restapi'],
    queryFn: async () => {
      console.log('[COUNTRIES] 🌍 Buscando 195+ países via REST Countries API...');

      const response = await fetch('https://restcountries.com/v3.1/all');

      if (!response.ok) {
        throw new Error(`REST Countries API error: ${response.status}`);
      }

      const data = await response.json();

      console.log('[COUNTRIES] ✅ REST Countries retornou:', data.length, 'países');

      // Mapear para nosso formato
      const countries: Country[] = data.map((c: any) => {
        // Determinar região (padronizar)
        let region: Country['region'] = 'Unknown';
        switch (c.region) {
          case 'Americas':
            region = 'Americas';
            break;
          case 'Europe':
            region = 'Europe';
            break;
          case 'Asia':
            region = 'Asia';
            break;
          case 'Africa':
            region = 'Africa';
            break;
          case 'Oceania':
            region = 'Oceania';
            break;
          case 'Antarctic':
            region = 'Antarctic';
            break;
        }

        // Extrair moedas (alguns países têm múltiplas)
        const currencies = c.currencies ? Object.keys(c.currencies) : [];
        const mainCurrency = currencies[0] || 'USD';

        // Construir dial code
        const idd = c.idd || {};
        const dialCode = idd.root 
          ? `${idd.root}${idd.suffixes?.[0] || ''}`
          : '+1';

        return {
          code: c.cca2, // ISO alpha-2
          name: c.translations?.por?.common || c.name.common, // Nome em português
          nameEn: c.name.common, // Nome oficial em inglês
          flag: c.flag, // Emoji
          region,
          subregion: c.subregion || 'Unknown',
          currency: mainCurrency,
          currencies,
          dialCode,
          capital: c.capital?.[0] || 'N/A',
          population: c.population || 0,
          area: c.area || 0,
          coordinates: c.capitalInfo?.latlng || c.latlng || [0, 0]
        };
      });

      // Ordenar alfabeticamente por nome em português
      countries.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      console.log('[COUNTRIES] ✅ Processados:', countries.length, 'países');
      console.log('[COUNTRIES] 📊 Por região:', {
        Americas: countries.filter(c => c.region === 'Americas').length,
        Europe: countries.filter(c => c.region === 'Europe').length,
        Asia: countries.filter(c => c.region === 'Asia').length,
        Africa: countries.filter(c => c.region === 'Africa').length,
        Oceania: countries.filter(c => c.region === 'Oceania').length,
      });

      return countries;
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 dias (países não mudam rápido)
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 dias em cache
    retry: 3,
    retryDelay: 1000,
  });
}

// ============================================================================
// HELPERS
// ============================================================================

export function getCountryByCode(countries: Country[], code: string): Country | undefined {
  return countries.find(c => c.code === code);
}

export function getCountriesByRegion(countries: Country[], region: Country['region']): Country[] {
  return countries.filter(c => c.region === region);
}

export function searchCountries(countries: Country[], query: string): Country[] {
  const q = query.toLowerCase().trim();
  return countries.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
  );
}

// Top export markets para MetaLife (pré-selecionados)
export const TOP_EXPORT_MARKETS = ['US', 'DE', 'JP', 'AU', 'CA', 'GB', 'ES', 'IT', 'FR', 'NL'];

