export type CheckoutProduct =
  | 'single'
  | 'custom'
  | 'tris'
  | 'sestina'
  | 'puglia-completa'
  | 'bari-completa'
  | 'valle-completa'
  | 'gargano-completa'
  | 'crociera';

export type CheckoutRedirectPayload = {
  product: CheckoutProduct;
  lang: string;
  guideSlug?: string;
  selectedSlugs?: string[];
};

/**
 * Partner di provenienza, robusto contro i browser che bloccano i cookie
 * (Safari restrittivo, webview degli scanner QR): prova la memoria di
 * pagina, poi localStorage, poi il cookie stesso.
 */
export function resolveClientPartnerId(): string | null {
  try {
    const w = window as typeof window & { localisPartnerId?: string };
    if (w.localisPartnerId && w.localisPartnerId !== '(direct)') return w.localisPartnerId;
    const ls = localStorage.getItem('lg_partner');
    if (ls) return ls;
    const ck = document.cookie.split('; ').find((c) => c.startsWith('lg_partner='));
    if (ck) return decodeURIComponent(ck.split('=')[1] || '') || null;
  } catch {
    /* storage inaccessibile: pazienza, resta il cookie lato server */
  }
  return null;
}

/**
 * GA4 client_id dal cookie `_ga` ("GA1.1.1234567890.1700000000" → client_id
 * "1234567890.1700000000"). Lo passiamo al server così il webhook può sparare
 * il `purchase` server-side AGGANCIATO alla stessa sessione GA del compratore,
 * anche se questo non torna mai su /thanks. Lettura sincrona: niente gtag('get').
 */
export function resolveGaClientId(): string | null {
  try {
    const ck = document.cookie.split('; ').find((c) => c.startsWith('_ga='));
    if (!ck) return null;
    const raw = decodeURIComponent(ck.split('=')[1] || '');
    const parts = raw.split('.');
    if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;
  } catch {
    /* storage inaccessibile: il purchase server-side userà un client_id sintetico */
  }
  return null;
}

function resolveInternalFlag(): boolean {
  try {
    return localStorage.getItem('localis_internal_traffic') === '1';
  } catch {
    return false;
  }
}

export function submitCheckoutRedirect(payload: CheckoutRedirectPayload): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/checkout?redirect=1';
  form.hidden = true;

  appendField(form, 'product', payload.product);
  appendField(form, 'lang', payload.lang);

  const partnerId = resolveClientPartnerId();
  if (partnerId) {
    appendField(form, 'partnerId', partnerId);
  }

  const gaClientId = resolveGaClientId();
  if (gaClientId) {
    appendField(form, 'gaClientId', gaClientId);
  }

  if (resolveInternalFlag()) {
    appendField(form, 'internal', '1');
  }

  if (payload.guideSlug) {
    appendField(form, 'guideSlug', payload.guideSlug);
  }

  for (const slug of payload.selectedSlugs ?? []) {
    appendField(form, 'selectedSlugs', slug);
  }

  document.body.appendChild(form);
  form.submit();
}

function appendField(form: HTMLFormElement, name: string, value: string): void {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
}
