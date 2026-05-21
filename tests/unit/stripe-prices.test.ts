import { describe, it, expect } from 'vitest';
import {
  STRIPE_PRICE_IDS,
  BARI_GUIDES,
  getGuideSlugsForProduct,
  getProductPriceCents,
} from '../../src/lib/stripe-prices';

describe('Stripe price catalog', () => {
  it('contains exactly 2 products: single + bundle', () => {
    const keys = Object.keys(STRIPE_PRICE_IDS).sort();
    expect(keys).toEqual(['bundle', 'single']);
  });

  it('all price IDs follow Stripe format prefix', () => {
    for (const [, id] of Object.entries(STRIPE_PRICE_IDS)) {
      expect(id).toMatch(/^price_/);
    }
  });

  it('BARI_GUIDES enumerates the 6 live Bari guides', () => {
    expect([...BARI_GUIDES].sort()).toEqual([
      'bari-sotterranea',
      'bari-vecchia',
      'il-meglio-di-bari',
      'porto-bari',
      'san-nicola',
      'tre-teatri',
    ]);
  });

  describe('getGuideSlugsForProduct', () => {
    it('single + valid guideSlug resolves to that one guide', () => {
      expect(getGuideSlugsForProduct('single', 'bari-vecchia')).toEqual(['bari-vecchia']);
    });

    it('single without guideSlug throws', () => {
      expect(() => getGuideSlugsForProduct('single')).toThrow();
    });

    it('single with unknown guideSlug throws', () => {
      expect(() => getGuideSlugsForProduct('single', 'not-a-guide')).toThrow();
    });

    it('bundle resolves to all 6 Bari guides', () => {
      const slugs = getGuideSlugsForProduct('bundle');
      expect(slugs.sort()).toEqual([
        'bari-sotterranea',
        'bari-vecchia',
        'il-meglio-di-bari',
        'porto-bari',
        'san-nicola',
        'tre-teatri',
      ]);
    });
  });

  describe('getProductPriceCents', () => {
    it('single guide is 499 cents', () => {
      expect(getProductPriceCents('single')).toBe(499);
    });

    it('bundle is 1990 cents', () => {
      expect(getProductPriceCents('bundle')).toBe(1990);
    });
  });
});
