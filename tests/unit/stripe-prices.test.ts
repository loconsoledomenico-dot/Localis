import { describe, it, expect } from 'vitest';
import {
  ALL_GUIDES,
  BARI_GUIDES,
  VALLE_GUIDES,
  GARGANO_GUIDES,
  CROCIERA_GUIDES,
  PRODUCT_PRICE_CENTS,
  getTierForCount,
  getNextTier,
  getSelectionZoneState,
  getPublicBundleLabel,
  validateSelectedSlugs,
  savingsCents,
} from '../../src/lib/stripe-prices';

describe('guide catalog', () => {
  it('ALL_GUIDES has 18 entries', () => {
    expect(ALL_GUIDES.length).toBe(18);
  });

  it('BARI_GUIDES has 6 entries', () => {
    expect(BARI_GUIDES.length).toBe(6);
  });

  it('VALLE_GUIDES has 6 entries', () => {
    expect(VALLE_GUIDES.length).toBe(6);
  });

  it('GARGANO_GUIDES has 6 entries', () => {
    expect(GARGANO_GUIDES.length).toBe(6);
  });

  it('no duplicate slugs across ALL_GUIDES', () => {
    const unique = new Set(ALL_GUIDES);
    expect(unique.size).toBe(ALL_GUIDES.length);
  });
});

describe('PRODUCT_PRICE_CENTS', () => {
  it('single is 499', () => expect(PRODUCT_PRICE_CENTS.single).toBe(499));
  it('tris is 1199', () => expect(PRODUCT_PRICE_CENTS.tris).toBe(1199));
  it('sestina is 1999', () => expect(PRODUCT_PRICE_CENTS.sestina).toBe(1999));
  it('puglia-completa is 3999', () => expect(PRODUCT_PRICE_CENTS['puglia-completa']).toBe(3999));
  it('bari-completa is 1999', () => expect(PRODUCT_PRICE_CENTS['bari-completa']).toBe(1999));
  it('crociera is 799', () => expect(PRODUCT_PRICE_CENTS.crociera).toBe(799));
});

describe('getTierForCount', () => {
  it('3 → tris', () => expect(getTierForCount(3)?.product).toBe('tris'));
  it('6 → sestina', () => expect(getTierForCount(6)?.product).toBe('sestina'));
  it('18 → puglia-completa', () => expect(getTierForCount(18)?.product).toBe('puglia-completa'));
  it('4 → null (not a tier boundary)', () => expect(getTierForCount(4)).toBeNull());
  it('0 → null', () => expect(getTierForCount(0)).toBeNull());
});

describe('getNextTier', () => {
  it('0 guides → next is tris (3)', () => expect(getNextTier(0)?.product).toBe('tris'));
  it('1 guide → next is tris', () => expect(getNextTier(1)?.product).toBe('tris'));
  it('3 guides → next is sestina (6)', () => expect(getNextTier(3)?.product).toBe('sestina'));
  it('4 guides → next is sestina', () => expect(getNextTier(4)?.product).toBe('sestina'));
  it('6 guides → next is puglia-completa', () => expect(getNextTier(6)?.product).toBe('puglia-completa'));
  it('18 guides → null (no tier above)', () => expect(getNextTier(18)).toBeNull());
});

describe('getSelectionZoneState', () => {
  it('marks all 6 Bari guides as same-zone complete', () => {
    expect(getSelectionZoneState([...BARI_GUIDES])).toEqual({
      count: 6,
      isSameZoneComplete: true,
      zone: 'bari',
    });
  });

  it('marks mixed 6-guide selections as not same-zone complete', () => {
    expect(getSelectionZoneState([
      ...BARI_GUIDES.slice(0, 3),
      ...VALLE_GUIDES.slice(0, 3),
    ])).toEqual({
      count: 6,
      isSameZoneComplete: false,
      zone: null,
    });
  });
});

describe('getPublicBundleLabel', () => {
  it('maps tris to Pack 3 Guide in Italian', () => {
    expect(getPublicBundleLabel('tris', 'it')).toBe('Pack 3 Guide');
  });

  it('maps sestina to Pack 6 Guides in English', () => {
    expect(getPublicBundleLabel('sestina', 'en')).toBe('Pack 6 Guides');
  });

  it('maps valle-completa to Pack 6 Guide (Intera Zona) in Italian', () => {
    expect(getPublicBundleLabel('valle-completa', 'it')).toBe('Pack 6 Guide (Intera Zona)');
  });
});

describe('validateSelectedSlugs', () => {
  const bariSlugs = [...BARI_GUIDES];
  const threeSlugs = ['bari-vecchia', 'san-nicola', 'alberobello'];
  const sixSlugs = ['bari-vecchia', 'san-nicola', 'tre-teatri', 'il-meglio-di-bari', 'porto-bari', 'bari-sotterranea'];
  const allSlugs = [...ALL_GUIDES];

  it('single + 1 valid slug passes', () => {
    expect(() => validateSelectedSlugs('single', ['bari-vecchia'])).not.toThrow();
  });

  it('single + 2 slugs throws', () => {
    expect(() => validateSelectedSlugs('single', ['bari-vecchia', 'san-nicola'])).toThrow();
  });

  it('single + unknown slug throws', () => {
    expect(() => validateSelectedSlugs('single', ['not-a-guide'])).toThrow();
  });

  it('tris + 3 valid slugs passes', () => {
    expect(() => validateSelectedSlugs('tris', threeSlugs)).not.toThrow();
  });

  it('tris + 2 slugs throws', () => {
    expect(() => validateSelectedSlugs('tris', ['bari-vecchia', 'san-nicola'])).toThrow('tris requires exactly 3');
  });

  it('tris + 4 slugs throws', () => {
    expect(() => validateSelectedSlugs('tris', [...threeSlugs, 'porto-bari'])).toThrow('tris requires exactly 3');
  });

  it('sestina + 6 valid slugs passes', () => {
    expect(() => validateSelectedSlugs('sestina', sixSlugs)).not.toThrow();
  });

  it('puglia-completa + all 18 passes', () => {
    expect(() => validateSelectedSlugs('puglia-completa', allSlugs)).not.toThrow();
  });

  it('puglia-completa + 17 slugs throws', () => {
    expect(() => validateSelectedSlugs('puglia-completa', allSlugs.slice(0, 17))).toThrow();
  });

  it('bari-completa + all 6 Bari slugs passes', () => {
    expect(() => validateSelectedSlugs('bari-completa', bariSlugs)).not.toThrow();
  });

  it('bari-completa + non-Bari slug throws', () => {
    const mixed = [...bariSlugs.slice(0, 5), 'alberobello'];
    expect(() => validateSelectedSlugs('bari-completa', mixed)).toThrow();
  });

  it('crociera + cruise guide pair passes', () => {
    expect(() => validateSelectedSlugs('crociera', [...CROCIERA_GUIDES])).not.toThrow();
  });

  it('crociera + one slug throws', () => {
    expect(() => validateSelectedSlugs('crociera', ['bari-vecchia'])).toThrow('crociera requires exactly 2');
  });
});

describe('savingsCents', () => {
  it('tris saves 298 cents', () => expect(savingsCents('tris')).toBe(298));
  it('sestina saves 995 cents', () => expect(savingsCents('sestina')).toBe(995));
  it('puglia-completa saves 4983 cents', () => expect(savingsCents('puglia-completa')).toBe(4983));
  it('bari-completa saves 995 cents', () => expect(savingsCents('bari-completa')).toBe(995));
  it('single saves 0', () => expect(savingsCents('single')).toBe(0));
});
