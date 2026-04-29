import { describe, it, expect } from 'vitest';
import {
  STRIPE_PRICE_IDS,
  getGuideSlugsForProduct,
  getProductPriceCents,
} from '../../src/lib/stripe-prices';

describe('Stripe price catalog', () => {
  it('contains exactly the 6 expected products', () => {
    const keys = Object.keys(STRIPE_PRICE_IDS).sort();
    expect(keys).toEqual([
      'bari-completa',
      'bari-vecchia',
      'il-meglio-di-bari',
      'porto-bari',
      'san-nicola',
      'tre-teatri',
    ]);
  });

  it('all price IDs follow Stripe format prefix', () => {
    for (const [, id] of Object.entries(STRIPE_PRICE_IDS)) {
      // Either real (price_<...>) or placeholder (also matches "price_REPLACE...")
      expect(id).toMatch(/^price_/);
    }
  });

  describe('getGuideSlugsForProduct', () => {
    it('single product resolves to its own slug', () => {
      expect(getGuideSlugsForProduct('bari-vecchia')).toEqual(['bari-vecchia']);
    });

    it('bundle resolves to all 3 Bari guides', () => {
      expect(getGuideSlugsForProduct('bari-completa')).toEqual([
        'bari-vecchia',
        'porto-bari',
        'san-nicola',
      ]);
    });
  });

  describe('getProductPriceCents', () => {
    it('single guide is 499 cents', () => {
      expect(getProductPriceCents('bari-vecchia')).toBe(499);
    });

    it('bundle is 999 cents', () => {
      expect(getProductPriceCents('bari-completa')).toBe(999);
    });
  });
});
