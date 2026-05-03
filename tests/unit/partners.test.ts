import { describe, it, expect } from 'vitest';
import { isValidPartnerSlug } from '../../src/lib/partners';

describe('partner helpers', () => {
  describe('isValidPartnerSlug', () => {
    it('accepts kebab-case slugs', () => {
      expect(isValidPartnerSlug('hotel-excelsior-bari')).toBe(true);
      expect(isValidPartnerSlug('bb-fronte-cattedrale')).toBe(true);
      expect(isValidPartnerSlug('a1b2c3')).toBe(true);
    });

    it('rejects invalid characters', () => {
      expect(isValidPartnerSlug('Hotel/Excelsior')).toBe(false);
      expect(isValidPartnerSlug('hotel excelsior')).toBe(false);
      expect(isValidPartnerSlug('<script>')).toBe(false);
    });

    it('rejects too short or too long slugs', () => {
      expect(isValidPartnerSlug('ab')).toBe(false);
      expect(isValidPartnerSlug('a'.repeat(50))).toBe(false);
    });

    it('rejects slugs starting with hyphen', () => {
      expect(isValidPartnerSlug('-leading-hyphen')).toBe(false);
    });
  });
});
