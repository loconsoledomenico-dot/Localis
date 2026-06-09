import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock factories are hoisted above top-level declarations, so the fns they
// reference must be created via vi.hoisted (otherwise: "Cannot access ...
// before initialization").
const { createSession, getActivePartner } = vi.hoisted(() => ({
  createSession: vi.fn(),
  getActivePartner: vi.fn(),
}));

vi.mock('../../src/lib/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: createSession,
      },
    },
  }),
}));

vi.mock('../../src/lib/partners', () => ({
  getActivePartner,
}));

import { POST } from '../../src/pages/api/checkout';

describe('POST /api/checkout', () => {
  beforeEach(() => {
    createSession.mockReset();
    getActivePartner.mockReset();
    getActivePartner.mockResolvedValue(null);
  });

  it('returns a 303 redirect when redirect=1 and form data is posted', async () => {
    createSession.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/test_session' });

    const params = new URLSearchParams();
    params.set('product', 'bari-completa');
    params.set('lang', 'it');
    params.append('selectedSlugs', 'bari-vecchia');
    params.append('selectedSlugs', 'san-nicola');

    const request = new Request('https://localis.guide/api/checkout?redirect=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://localis.guide',
      },
      body: params,
    });

    const response = await POST({
      request,
      cookies: { get: () => undefined },
      url: new URL(request.url),
    } as never);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://checkout.stripe.com/c/pay/test_session');
    expect(createSession).toHaveBeenCalledOnce();
  });

  it('keeps the JSON response mode for fetch-based callers', async () => {
    createSession.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/json_mode' });

    const request = new Request('https://localis.guide/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://localis.guide',
      },
      body: JSON.stringify({
        product: 'bari-completa',
        selectedSlugs: ['bari-vecchia'],
        lang: 'it',
      }),
    });

    const response = await POST({
      request,
      cookies: { get: () => undefined },
      url: new URL(request.url),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: 'https://checkout.stripe.com/c/pay/json_mode',
    });
  });
});
