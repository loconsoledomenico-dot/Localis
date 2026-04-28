import { describe, it, expect } from 'vitest';
import { localizedHref, stripLocalePrefix, alternateLangUrl } from '../../src/lib/i18n';
import { t } from '../../src/lib/i18n-strings';

describe('i18n helpers', () => {
  describe('localizedHref', () => {
    it('returns path unchanged for Italian', () => {
      expect(localizedHref('/guide/bari-vecchia', 'it')).toBe('/guide/bari-vecchia');
    });

    it('prefixes path with /en for English', () => {
      expect(localizedHref('/guide/bari-vecchia', 'en')).toBe('/en/guide/bari-vecchia');
    });

    it('handles paths without leading slash', () => {
      expect(localizedHref('guide/porto-bari', 'en')).toBe('/en/guide/porto-bari');
    });

    it('handles root path', () => {
      expect(localizedHref('/', 'it')).toBe('/');
      expect(localizedHref('/', 'en')).toBe('/en/');
    });
  });

  describe('stripLocalePrefix', () => {
    it('strips /en prefix', () => {
      expect(stripLocalePrefix('/en/guide/bari-vecchia')).toBe('/guide/bari-vecchia');
    });

    it('leaves Italian paths unchanged', () => {
      expect(stripLocalePrefix('/guide/porto-bari')).toBe('/guide/porto-bari');
    });

    it('handles bare /en correctly', () => {
      expect(stripLocalePrefix('/en')).toBe('/');
    });
  });

  describe('alternateLangUrl', () => {
    it('flips IT path to EN equivalent', () => {
      expect(alternateLangUrl('/guide/bari-vecchia', 'it')).toBe('/en/guide/bari-vecchia');
    });

    it('flips EN path to IT equivalent', () => {
      expect(alternateLangUrl('/en/guide/bari-vecchia', 'en')).toBe('/guide/bari-vecchia');
    });
  });
});

describe('translation lookup t()', () => {
  it('returns Italian string for IT lang', () => {
    expect(t('site.tagline', 'it')).toBe('Audioguide narrative · Puglia');
  });

  it('returns English string for EN lang', () => {
    expect(t('site.tagline', 'en')).toBe('Narrative audio guides · Puglia');
  });
});
