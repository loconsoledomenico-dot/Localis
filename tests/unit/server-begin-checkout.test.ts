import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createSession, getActivePartner, sendGa4BeginCheckout } = vi.hoisted(() => ({
  createSession: vi.fn(),
  getActivePartner: vi.fn(),
  sendGa4BeginCheckout: vi.fn(),
}));

vi.mock('../../src/lib/stripe', () => ({
  getStripe: () => ({ checkout: { sessions: { create: createSession } } }),
}));
vi.mock('../../src/lib/partners', () => ({
  getActivePartner,
  isValidPartnerSlug: (s: string) => typeof s === 'string' && /^[a-z0-9][a-z0-9-]{2,40}$/i.test(s),
}));
vi.mock('../../src/lib/ga4-mp', () => ({ sendGa4BeginCheckout }));

import { POST } from '../../src/pages/api/checkout';

function post(body: Record<string, unknown>, cookie?: string) {
  const request = new Request('https://localis.guide/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://localis.guide' },
    body: JSON.stringify(body),
  });
  return POST({
    request,
    cookies: { get: (n: string) => (n === 'lg_partner' && cookie ? { value: cookie } : undefined) },
    url: new URL(request.url),
  } as never);
}

// L'evento client parte solo dopo il consenso cookie, purchase (dal webhook)
// parte sempre: senza questo l'imbuto GA4 mostra piu' acquisti che avvii.
describe('begin_checkout lato server', () => {
  beforeEach(() => {
    createSession.mockReset();
    createSession.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/x' });
    getActivePartner.mockReset();
    getActivePartner.mockResolvedValue(null);
    sendGa4BeginCheckout.mockReset();
    sendGa4BeginCheckout.mockResolvedValue(undefined);
  });

  it('parte a ogni sessione creata', async () => {
    await post({ product: 'bari-completa', lang: 'it' });

    expect(sendGa4BeginCheckout).toHaveBeenCalledOnce();
  });

  it('usa l\u2019id sessione Stripe come transaction_id, per deduplicare col client', async () => {
    await post({ product: 'bari-completa', lang: 'it' });

    expect(sendGa4BeginCheckout.mock.calls[0][0].transactionId).toBe('cs_test_123');
  });

  it('porta le stesse dimensioni che portera\u2019 purchase', async () => {
    getActivePartner.mockResolvedValue({
      data: { slug: 'london-bar', stripe_account_id: 'acct_REPLACE_WITH_REAL_CONNECT_ID', commission_rate: 0.25 },
    });

    await post({ product: 'bari-completa', lang: 'de', gaClientId: '123.456' }, 'london-bar');
    const arg = sendGa4BeginCheckout.mock.calls[0][0];

    expect(arg.partnerId).toBe('london-bar');
    expect(arg.lang).toBe('de');
    expect(arg.product).toBe('bari-completa');
    expect(arg.clientId).toBe('123.456');
    expect(arg.guideSlugs).toHaveLength(6);
    expect(arg.valueCents).toBe(1999);
  });

  it('marca il traffico interno, cosi\u2019 le prove restano escludibili', async () => {
    await post({ product: 'bari-completa', lang: 'it', internal: '1' });

    expect(sendGa4BeginCheckout.mock.calls[0][0].trafficType).toBe('internal');
  });

  it('non marca il traffico normale', async () => {
    await post({ product: 'bari-completa', lang: 'it' });

    expect(sendGa4BeginCheckout.mock.calls[0][0].trafficType).toBeUndefined();
  });

  // Il punto piu' importante: la misura non deve mai costare una vendita.
  it('se GA4 fallisce il pagamento procede lo stesso', async () => {
    sendGa4BeginCheckout.mockRejectedValue(new Error('GA4 irraggiungibile'));

    const res = await post({ product: 'bari-completa', lang: 'it' });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: 'https://checkout.stripe.com/c/pay/x' });
  });

  it('non viene invocato se la sessione Stripe non viene creata', async () => {
    createSession.mockRejectedValue(new Error('Stripe down'));

    await post({ product: 'bari-completa', lang: 'it' });

    expect(sendGa4BeginCheckout).not.toHaveBeenCalled();
  });
});
