import { describe, expect, it } from 'vitest';
import { hasAllowedOrigin } from '../../src/lib/request-security';

describe('request security helpers', () => {
  it('allows requests without Origin for server-to-server calls', () => {
    const request = new Request('https://localis.guide/api/checkout', { method: 'POST' });
    expect(hasAllowedOrigin(request, 'https://localis.guide')).toBe(true);
  });

  it('allows the current origin', () => {
    const request = new Request('https://localis.guide/api/checkout', {
      method: 'POST',
      headers: { Origin: 'https://localis.guide' },
    });
    expect(hasAllowedOrigin(request, 'https://localis.guide')).toBe(true);
  });

  it('rejects cross-site origins', () => {
    const request = new Request('https://localis.guide/api/checkout', {
      method: 'POST',
      headers: { Origin: 'https://example.com' },
    });
    expect(hasAllowedOrigin(request, 'https://localis.guide')).toBe(false);
  });
});
