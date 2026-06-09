import { describe, it, expect, beforeEach } from 'vitest';
import { checkAndIncrement, _resetUsageCache } from '../../src/lib/usage-tracker';

describe('usage tracker', () => {
  beforeEach(() => {
    _resetUsageCache();
  });

  it('allows up to monthly limit', async () => {
    const tokenHash = 'token-abc';
    const slug = 'bari-vecchia';
    for (let i = 0; i < 50; i++) {
      expect(await checkAndIncrement(tokenHash, slug)).toBe(true);
    }
  });

  it('rejects on the 51st request', async () => {
    const tokenHash = 'token-abc';
    const slug = 'bari-vecchia';
    for (let i = 0; i < 50; i++) {
      await checkAndIncrement(tokenHash, slug);
    }
    expect(await checkAndIncrement(tokenHash, slug)).toBe(false);
  });

  it('tracks separately per (token, slug)', async () => {
    const t = 'token-x';
    for (let i = 0; i < 50; i++) {
      await checkAndIncrement(t, 'bari-vecchia');
    }
    expect(await checkAndIncrement(t, 'porto-bari')).toBe(true);
    expect(await checkAndIncrement(t, 'bari-vecchia')).toBe(false);
  });

  it('tracks separately per token', async () => {
    for (let i = 0; i < 50; i++) {
      await checkAndIncrement('token-a', 'bari-vecchia');
    }
    expect(await checkAndIncrement('token-b', 'bari-vecchia')).toBe(true);
  });
});
