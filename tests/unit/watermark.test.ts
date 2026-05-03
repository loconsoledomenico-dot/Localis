import { describe, it, expect } from 'vitest';
import { computeWatermarkKey, normalizeEmail } from '../../src/lib/watermark';

describe('watermark module', () => {
  describe('normalizeEmail', () => {
    it('lowercases and trims', () => {
      expect(normalizeEmail('  Buyer@Example.COM  ')).toBe('buyer@example.com');
    });
  });

  describe('computeWatermarkKey', () => {
    it('produces a deterministic R2 key for (email, slug, lang) tuple', () => {
      const a = computeWatermarkKey('buyer@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('buyer@test.com', 'bari-vecchia', 'it');
      expect(a).toBe(b);
    });

    it('produces different keys for different emails', () => {
      const a = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('b@test.com', 'bari-vecchia', 'it');
      expect(a).not.toBe(b);
    });

    it('produces different keys for different slugs', () => {
      const a = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('a@test.com', 'porto-bari', 'it');
      expect(a).not.toBe(b);
    });

    it('produces different keys for different languages', () => {
      const a = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('a@test.com', 'bari-vecchia', 'en');
      expect(a).not.toBe(b);
    });

    it('returns key with wm/ prefix and .mp3 suffix', () => {
      const key = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      expect(key.startsWith('wm/')).toBe(true);
      expect(key.endsWith('.mp3')).toBe(true);
    });

    it('is case-insensitive on email', () => {
      const a = computeWatermarkKey('Buyer@Test.COM', 'x', 'it');
      const b = computeWatermarkKey('buyer@test.com', 'x', 'it');
      expect(a).toBe(b);
    });
  });
});
