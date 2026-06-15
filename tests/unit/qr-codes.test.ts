import { describe, it, expect } from 'vitest';
import { isValidCode, resolveCode, type QrCode } from '../../src/lib/qr-codes';

const fixture: QrCode[] = [
  { code: 'A7X9K2', partner_slug: 'hotel-sole' },
  { code: 'M3R8TQ', partner_slug: null },
];

describe('qr-codes', () => {
  describe('isValidCode', () => {
    it('accetta 6 caratteri base32 senza ambigui', () => {
      expect(isValidCode('A7X9K2')).toBe(true);
      expect(isValidCode('M3R8TQ')).toBe(true);
    });
    it('rifiuta i caratteri ambigui I O 0 1', () => {
      expect(isValidCode('AIO012')).toBe(false);
      expect(isValidCode('ABCDE0')).toBe(false);
    });
    it('rifiuta lunghezza errata, minuscole, simboli', () => {
      expect(isValidCode('A7X9K')).toBe(false);
      expect(isValidCode('a7x9k2')).toBe(false);
      expect(isValidCode('A7X9K2X')).toBe(false);
      expect(isValidCode('A7-9K2')).toBe(false);
    });
  });

  describe('resolveCode', () => {
    it('assigned per un codice mappato', () => {
      expect(resolveCode('A7X9K2', fixture)).toEqual({ status: 'assigned', partner_slug: 'hotel-sole' });
    });
    it('unassigned per partner_slug null', () => {
      expect(resolveCode('M3R8TQ', fixture)).toEqual({ status: 'unassigned', partner_slug: null });
    });
    it('unknown per un codice fuori registro', () => {
      expect(resolveCode('ZZZ999', fixture)).toEqual({ status: 'unknown', partner_slug: null });
    });
  });
});
