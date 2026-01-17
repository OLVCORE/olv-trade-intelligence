/**
 * TESTES: Marketplace Blocklist e Validações
 * 
 * Testes básicos para validar que URLs e textos são bloqueados corretamente.
 * Rodar com: npm test ou vitest
 */

import { describe, it, expect } from 'vitest';
import { isBlockedDomain, isBlockedUrl, hasEcommerceSignals } from '../marketplaceBlocklist';
import { isB2BMatch, isB2CMatch } from '../b2bClassifier';
import { normalizeCountry, normalizeCountries, getAllSearchVariations, denormalizeCountryName } from '../countryNormalizer';

describe('Marketplace Blocklist', () => {
  describe('isBlockedDomain', () => {
    it('deve bloquear marketplaces globais', () => {
      expect(isBlockedDomain('https://www.alibaba.com')).toBe(true);
      expect(isBlockedDomain('https://www.made-in-china.com')).toBe(true);
      expect(isBlockedDomain('https://www.kompass.com')).toBe(true);
      expect(isBlockedDomain('https://www.europages.com')).toBe(true);
      expect(isBlockedDomain('https://www.tradekey.com')).toBe(true);
    });

    it('deve bloquear e-commerce latino-americano', () => {
      expect(isBlockedDomain('https://www.falabella.com/falabella-cl')).toBe(true);
      expect(isBlockedDomain('https://www.compumarket.com.py')).toBe(true);
      expect(isBlockedDomain('https://www.mercado-livre.com')).toBe(true);
      expect(isBlockedDomain('https://www.mercadolibre.com')).toBe(true);
      expect(isBlockedDomain('https://www.ripley.com')).toBe(true);
    });

    it('não deve bloquear domínios válidos de empresas B2B', () => {
      expect(isBlockedDomain('https://www.example-distributor.com')).toBe(false);
      expect(isBlockedDomain('https://www.wholesale-company.com')).toBe(false);
      expect(isBlockedDomain('https://www.import-export-trade.com')).toBe(false);
    });
  });

  describe('isBlockedUrl', () => {
    it('deve bloquear URLs com padrões de e-commerce', () => {
      expect(isBlockedUrl('https://example.com/product/123')).toBe(true);
      expect(isBlockedUrl('https://example.com/products/category')).toBe(true);
      expect(isBlockedUrl('https://example.com/tienda/item')).toBe(true);
      expect(isBlockedUrl('https://example.com/shop/product')).toBe(true);
      expect(isBlockedUrl('https://example.com/cart/checkout')).toBe(true);
    });

    it('não deve bloquear URLs de empresas B2B válidas', () => {
      expect(isBlockedUrl('https://example-distributor.com/about')).toBe(false);
      expect(isBlockedDomain('https://wholesale-company.com/contact')).toBe(false);
    });
  });

  describe('hasEcommerceSignals', () => {
    it('deve detectar sinais de e-commerce no texto', () => {
      expect(hasEcommerceSignals('Add to cart now!')).toBe(true);
      expect(hasEcommerceSignals('Buy now with free shipping')).toBe(true);
      expect(hasEcommerceSignals('Adicionar ao carrinho')).toBe(true);
      expect(hasEcommerceSignals('Preço especial com desconto')).toBe(true);
      expect(hasEcommerceSignals('Frete grátis para todo Brasil')).toBe(true);
    });

    it('não deve detectar sinais em textos B2B válidos', () => {
      expect(hasEcommerceSignals('We are a wholesale distributor')).toBe(false);
      expect(hasEcommerceSignals('B2B import and export services')).toBe(false);
      expect(hasEcommerceSignals('Somos distribuidores atacadistas')).toBe(false);
    });
  });
});

describe('B2B Classifier', () => {
  describe('isB2BMatch', () => {
    it('deve identificar empresas B2B', () => {
      expect(isB2BMatch('Wholesale Distributor Company')).toBe(true);
      expect(isB2BMatch('Import Export Trading Co')).toBe(true);
      expect(isB2BMatch('Distribuidora Mayorista')).toBe(true);
      expect(isB2BMatch('Atacadista Importadora')).toBe(true);
      expect(isB2BMatch('B2B Commercial Supplier')).toBe(true);
    });

    it('não deve identificar empresas B2C como B2B', () => {
      expect(isB2BMatch('Pilates Studio')).toBe(false);
      expect(isB2BMatch('Fitness Center')).toBe(false);
      expect(isB2BMatch('Yoga Studio')).toBe(false);
    });
  });

  describe('isB2CMatch', () => {
    it('deve bloquear empresas B2C', () => {
      expect(isB2CMatch('Pilates Studio Downtown')).toBe(true);
      expect(isB2CMatch('Fitness Center & Gym')).toBe(true);
      expect(isB2CMatch('Wellness Center Spa')).toBe(true);
      expect(isB2CMatch('Personal Training Studio')).toBe(true);
      expect(isB2CMatch('Estúdio de Pilates')).toBe(true);
      expect(isB2CMatch('Gimnasio de Fitness')).toBe(true);
    });

    it('não deve bloquear empresas B2B', () => {
      expect(isB2CMatch('Wholesale Distributor')).toBe(false);
      expect(isB2CMatch('Import Export Company')).toBe(false);
      expect(isB2CMatch('B2B Trading')).toBe(false);
    });
  });
});

describe('Country Normalizer', () => {
  describe('normalizeCountry', () => {
    it('deve normalizar Brasil corretamente', () => {
      const normalized = normalizeCountry('Brasil');
      expect(normalized.english).toBe('Brazil');
      expect(normalized.native).toBe('Brasil');
      expect(normalized.code).toBe('BR');
      expect(normalized.searchVariations).toContain('Brazil');
      expect(normalized.searchVariations).toContain('Brasil');
      expect(normalized.canonicalPt).toBe('Brasil');
    });

    it('deve normalizar México corretamente', () => {
      const normalized = normalizeCountry('México');
      expect(normalized.english).toBe('Mexico');
      expect(normalized.native).toBe('México');
      expect(normalized.code).toBe('MX');
      expect(normalized.searchVariations).toContain('Mexico');
      expect(normalized.searchVariations).toContain('México');
      expect(normalized.canonicalPt).toBe('México');
    });

    it('deve gerar variações sem duplicatas e sem vazios', () => {
      const normalized = normalizeCountry('Argentina');
      expect(normalized.searchVariations.length).toBeGreaterThan(0);
      expect(new Set(normalized.searchVariations).size).toBe(normalized.searchVariations.length); // Sem duplicatas
      expect(normalized.searchVariations.every(v => v && v.trim().length > 0)).toBe(true); // Sem vazios
    });
  });

  describe('getAllSearchVariations', () => {
    it('deve retornar todas as variações sem duplicatas', () => {
      const countries = normalizeCountries(['Brasil', 'Argentina', 'Chile']);
      const variations = getAllSearchVariations(countries);
      
      expect(variations.length).toBeGreaterThan(0);
      expect(new Set(variations).size).toBe(variations.length); // Sem duplicatas
      expect(variations.every(v => v && v.trim().length > 0)).toBe(true); // Sem vazios
    });
  });

  describe('denormalizeCountryName', () => {
    it('deve converter de volta para português', () => {
      expect(denormalizeCountryName('Brazil')).toBe('Brasil');
      expect(denormalizeCountryName('Mexico')).toBe('México');
      expect(denormalizeCountryName('Argentina')).toBe('Argentina');
    });
  });
});

describe('Validação de Keywords', () => {
  it('deve validar keywords obrigatórias', () => {
    const requiredKeywords = ['reformer', 'cadillac', '950691'];
    const text = 'Pilates Reformer Distributor';
    const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const hasKeyword = requiredKeywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalizedText.includes(normalizedKeyword);
    });
    
    expect(hasKeyword).toBe(true);
  });

  it('deve rejeitar texto sem keywords obrigatórias', () => {
    const requiredKeywords = ['reformer', 'cadillac', '950691'];
    const text = 'Generic Fitness Equipment';
    const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const hasKeyword = requiredKeywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalizedText.includes(normalizedKeyword);
    });
    
    expect(hasKeyword).toBe(false);
  });
});
