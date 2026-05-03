import { describe, it, expect, beforeEach } from 'vitest';
import { checkAndIncrement, _resetUsageCache } from '../../src/lib/usage-tracker';

describe('usage tracker', () => {
  beforeEach(() => {
    _resetUsageCache();
  });

  it('allows up to monthly limit', () => {
    const tokenHash = 'token-abc';
    const slug = 'bari-vecchia';
    for (let i = 0; i < 50; i++) {
      expect(checkAndIncrement(tokenHash, slug)).toBe(true);
    }
  });

  it('rejects on the 51st request', () => {
    const tokenHash = 'token-abc';
    const slug = 'bari-vecchia';
    for (let i = 0; i < 50; i++) {
      checkAndIncrement(tokenHash, slug);
    }
    expect(checkAndIncrement(tokenHash, slug)).toBe(false);
  });

  it('tracks separately per (token, slug)', () => {
    const t = 'token-x';
    for (let i = 0; i < 50; i++) {
      checkAndIncrement(t, 'bari-vecchia');
    }
    expect(checkAndIncrement(t, 'porto-bari')).toBe(true);
    expect(checkAndIncrement(t, 'bari-vecchia')).toBe(false);
  });

  it('tracks separately per token', () => {
    for (let i = 0; i < 50; i++) {
      checkAndIncrement('token-a', 'bari-vecchia');
    }
    expect(checkAndIncrement('token-b', 'bari-vecchia')).toBe(true);
  });
});
