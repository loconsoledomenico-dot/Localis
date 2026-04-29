import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateAccessToken, verifyAccessToken, type AccessTokenPayload } from '../../src/lib/jwt';

describe('JWT module', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret-min-32-chars-aaaaaaaaaaaa');
  });

  describe('generateAccessToken', () => {
    it('produces a non-empty string', () => {
      const token = generateAccessToken({
        email: 'buyer@test.com',
        guide_slugs: ['bari-vecchia'],
        stripe_session_id: 'cs_test_123',
        partner_id: null,
      });
      expect(token).toBeTypeOf('string');
      expect(token.length).toBeGreaterThan(50);
    });

    it('produces different tokens for different payloads', () => {
      const a = generateAccessToken({
        email: 'buyer1@test.com',
        guide_slugs: ['bari-vecchia'],
        stripe_session_id: 'cs_1',
        partner_id: null,
      });
      const b = generateAccessToken({
        email: 'buyer2@test.com',
        guide_slugs: ['bari-vecchia'],
        stripe_session_id: 'cs_1',
        partner_id: null,
      });
      expect(a).not.toBe(b);
    });
  });

  describe('verifyAccessToken', () => {
    it('round-trips a payload', () => {
      const payload: AccessTokenPayload = {
        email: 'buyer@test.com',
        guide_slugs: ['bari-vecchia', 'porto-bari'],
        stripe_session_id: 'cs_test_456',
        partner_id: 'hotel-excelsior-bari',
      };
      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);
      expect(verified).not.toBeNull();
      expect(verified!.email).toBe('buyer@test.com');
      expect(verified!.guide_slugs).toEqual(['bari-vecchia', 'porto-bari']);
      expect(verified!.partner_id).toBe('hotel-excelsior-bari');
    });

    it('returns null for invalid token', () => {
      expect(verifyAccessToken('not-a-real-token')).toBeNull();
    });

    it('returns null for token signed with different secret', () => {
      const token = generateAccessToken({
        email: 'a@b.com',
        guide_slugs: ['x'],
        stripe_session_id: 'y',
        partner_id: null,
      });
      vi.stubEnv('JWT_SECRET', 'different-secret-min-32-chars-bbbbbbb');
      expect(verifyAccessToken(token)).toBeNull();
    });

    it('returns null for empty/null token', () => {
      expect(verifyAccessToken('')).toBeNull();
      expect(verifyAccessToken(null)).toBeNull();
    });

    it('includes iat timestamp', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = generateAccessToken({
        email: 'a@b.com',
        guide_slugs: ['x'],
        stripe_session_id: 'y',
        partner_id: null,
      });
      const verified = verifyAccessToken(token);
      const after = Math.floor(Date.now() / 1000);
      expect(verified!.iat).toBeGreaterThanOrEqual(before);
      expect(verified!.iat).toBeLessThanOrEqual(after);
    });
  });
});
