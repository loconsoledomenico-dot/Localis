import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStore } = vi.hoisted(() => ({ getStore: vi.fn() }));
vi.mock('@netlify/blobs', () => ({ getStore }));

import scanCounter from '../../netlify/edge-functions/scan-counter';

/** Store finto con ETag, che puo' simulare scritture perse per concorrenza. */
function fakeStore({ conflictsBeforeSuccess = 0 } = {}) {
  let data: Record<string, number> | null = null;
  let etag = 0;
  let pending = conflictsBeforeSuccess;
  const calls = { reads: 0, writes: 0, rejected: 0 };

  return {
    calls,
    snapshot: () => data,
    store: {
      async getWithMetadata() {
        calls.reads++;
        return data === null ? null : { data: { ...data }, etag: `e${etag}`, metadata: {} };
      },
      async setJSON(_key: string, value: Record<string, number>, opts?: Record<string, unknown>) {
        calls.writes++;
        if (pending > 0) {
          // Un'altra richiesta ha scritto per prima: l'ETag non combacia piu'.
          pending--;
          calls.rejected++;
          if (data === null) data = {};
          etag++;
          return { modified: false };
        }
        if (opts?.onlyIfNew && data !== null) return { modified: false };
        if (opts?.onlyIfMatch && opts.onlyIfMatch !== `e${etag}`) return { modified: false };
        data = { ...value };
        etag++;
        return { modified: true };
      },
    },
  };
}

function htmlRequest(path: string) {
  const request = new Request(`https://localis.guide${path}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (iPhone)' },
  });
  const context = {
    next: async () => new Response('<html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }),
  };
  return { request, context };
}

describe('contatore server-side', () => {
  beforeEach(() => getStore.mockReset());

  it('conta una pagina vista e il totale', async () => {
    const f = fakeStore();
    getStore.mockReturnValue(f.store);
    const { request, context } = htmlRequest('/bari/');

    await scanCounter(request, context as never);

    expect(f.snapshot()).toEqual({ 'v:/bari/': 1, 'v:__all': 1 });
  });

  it('conta la scansione quando la pagina e\u2019 una landing partner', async () => {
    const f = fakeStore();
    getStore.mockReturnValue(f.store);
    const { request, context } = htmlRequest('/p/london-bar/');

    await scanCounter(request, context as never);

    expect(f.snapshot()).toMatchObject({ 'london-bar': 1, 'v:__all': 1 });
  });

  // Il motivo di tutta la modifica: prima la seconda scrittura sovrascriveva
  // la prima e un conteggio spariva senza che nessuno se ne accorgesse.
  it('riprova quando un\u2019altra richiesta scrive per prima', async () => {
    const f = fakeStore({ conflictsBeforeSuccess: 2 });
    getStore.mockReturnValue(f.store);
    const { request, context } = htmlRequest('/bari/');

    await scanCounter(request, context as never);

    expect(f.calls.rejected).toBe(2);
    expect(f.calls.reads).toBe(3);
    expect(f.snapshot()).toEqual({ 'v:/bari/': 1, 'v:__all': 1 });
  });

  it('si arrende dopo un numero limitato di tentativi', async () => {
    const f = fakeStore({ conflictsBeforeSuccess: 99 });
    getStore.mockReturnValue(f.store);
    const { request, context } = htmlRequest('/bari/');

    const res = await scanCounter(request, context as never);

    expect(f.calls.writes).toBeLessThanOrEqual(4);
    expect(res.status).toBe(200); // la pagina esce comunque
  });

  it('non conta i bot', async () => {
    const f = fakeStore();
    getStore.mockReturnValue(f.store);
    const request = new Request('https://localis.guide/bari/', {
      headers: { 'user-agent': 'Googlebot/2.1' },
    });
    const context = {
      next: async () => new Response('<html></html>', {
        status: 200, headers: { 'content-type': 'text/html' },
      }),
    };

    await scanCounter(request, context as never);

    expect(f.calls.writes).toBe(0);
  });

  // Vitest segnala i throw sincroni dentro un mock anche quando il codice li
  // cattura: qui l'errore arriva dal metodo dello store, che e' anche il modo
  // in cui fallirebbe davvero (rete, quota, permessi).
  it('un errore dello store non rompe la pagina', async () => {
    getStore.mockReturnValue({
      getWithMetadata: async () => { throw new Error('Blobs irraggiungibile'); },
      setJSON: async () => ({ modified: true }),
    });
    const { request, context } = htmlRequest('/bari/');

    const res = await scanCounter(request, context as never);

    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe('<html></html>');
  });
});
