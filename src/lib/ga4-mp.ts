// GA4 Measurement Protocol — evento `purchase` lato server.
//
// Perché esiste: l'evento `purchase` client-side scatta solo se il compratore
// TORNA su /thanks dopo il pagamento. Chi compra col telefono in camera o con
// Stripe Link chiude la scheda appena pagato → GA4 non vedeva nulla e il
// cruscotto mostrava "0 vendite" anche con incassi reali su Stripe.
//
// Questo invia il `purchase` dal webhook (server), che parte SEMPRE alla
// conferma del pagamento. Deduplicato contro il purchase client-side dallo
// stesso `transaction_id` (= id sessione Stripe): GA4 scarta i duplicati.

export type Ga4PurchaseInput = {
  /** GA client_id catturato nel browser (cookie _ga) e passato nei metadata Stripe. */
  clientId: string | null;
  /** Id sessione Stripe: chiave di deduplica con il purchase client-side. */
  transactionId: string;
  valueCents: number | null;
  currency: string;
  guideSlugs: string[];
  product: string;
  partnerId: string | null;
  lang: string;
  /** 'internal' per gli acquisti di test del founder (esclusi dai report). */
  trafficType?: string;
};

function measurementId(): string | undefined {
  return process.env.GA4_MEASUREMENT_ID || process.env.PUBLIC_GA4_ID;
}

/**
 * GA4 richiede un client_id. Se il browser non l'ha passato (path JSON o cookie
 * GA assente), ne sintetizziamo uno deterministico dal transaction_id: la
 * conversione viene comunque contata, semplicemente non si aggancia alla
 * sessione-browser originale nel funnel.
 */
function fallbackClientId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const n = Math.abs(h);
  return `${n}.${n}`;
}

/**
 * Parametri comuni a purchase e begin_checkout: la coppia va letta insieme in
 * GA4, quindi devono portare le stesse dimensioni o l'imbuto non si scompone.
 */
function commonParams(input: Ga4PurchaseInput, ctaSource: string): Record<string, unknown> {
  const params: Record<string, unknown> = {
    transaction_id: input.transactionId,
    value: input.valueCents != null ? input.valueCents / 100 : 0,
    currency: (input.currency || 'eur').toUpperCase(),
    partner_id: input.partnerId || '(direct)',
    product: input.product,
    guide_count: input.guideSlugs.length,
    guide_slugs: input.guideSlugs.join(','),
    lang: input.lang,
    cta_source: ctaSource,
    items: input.guideSlugs.map((slug) => ({ item_id: slug, item_name: slug, quantity: 1 })),
  };
  if (input.trafficType) params.traffic_type = input.trafficType;
  return params;
}

async function postToMeasurementProtocol(
  eventName: string,
  clientId: string,
  params: Record<string, unknown>,
  timeoutMs: number,
): Promise<void> {
  const mid = measurementId();
  const apiSecret = process.env.GA4_API_SECRET;
  if (!mid || !apiSecret) {
    console.warn(`[ga4-mp] GA4_MEASUREMENT_ID/PUBLIC_GA4_ID o GA4_API_SECRET non impostati — ${eventName} server-side saltato`);
    return;
  }

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(mid)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, events: [{ name: eventName, params }] }),
        // Il checkout aspetta questa chiamata: meglio perdere un evento che
        // far attendere chi sta comprando.
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[ga4-mp] invio ${eventName} fallito`, res.status, detail);
    }
  } catch (err) {
    // Mai propagare: la vendita conta piu' della sua misura.
    console.error(`[ga4-mp] errore invio ${eventName}`, err instanceof Error ? err.message : 'unknown');
  }
}

export async function sendGa4Purchase(input: Ga4PurchaseInput): Promise<void> {
  const clientId = input.clientId || fallbackClientId(input.transactionId);
  await postToMeasurementProtocol('purchase', clientId, commonParams(input, 'server_webhook'), 4000);
}

/**
 * `begin_checkout` lato server, dalla creazione della sessione Stripe.
 *
 * Perche' esiste: la versione client parte solo dopo il consenso cookie, quindi
 * conta una frazione degli avvii — mentre `purchase` parte dal webhook e li
 * conta tutti. Ne risultava un imbuto con piu' acquisti che avvii (misurato il
 * 23/08: 2 begin_checkout in GA4 contro 9 sessioni reali su Stripe).
 *
 * Deduplica: stesso `transaction_id` = id sessione Stripe della versione client.
 */
export async function sendGa4BeginCheckout(input: Ga4PurchaseInput): Promise<void> {
  const clientId = input.clientId || fallbackClientId(input.transactionId);
  await postToMeasurementProtocol('begin_checkout', clientId, commonParams(input, 'server_checkout'), 1500);
}
