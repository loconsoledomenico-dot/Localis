import { describe, it, expect } from 'vitest';
import { normalizeEmail, sourceAudioKey } from '../../src/lib/watermark';

describe('watermark module', () => {
  describe('normalizeEmail', () => {
    it('lowercases and trims', () => {
      expect(normalizeEmail('  Buyer@Example.COM  ')).toBe('buyer@example.com');
    });
  });

  describe('sourceAudioKey', () => {
    it('builds the R2 key from slug and language', () => {
      expect(sourceAudioKey('bari-vecchia', 'it')).toBe('guides/bari-vecchia/bari-vecchia-it.mp3');
    });

    it('supports English and German variants', () => {
      expect(sourceAudioKey('bari-vecchia', 'en')).toBe('guides/bari-vecchia/bari-vecchia-en.mp3');
      expect(sourceAudioKey('bari-vecchia', 'de')).toBe('guides/bari-vecchia/bari-vecchia-de.mp3');
    });
  });
});
