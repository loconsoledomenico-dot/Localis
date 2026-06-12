import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import {
  getStripePrice,
  validateSelectedSlugs,
  PRODUCT_PRICE_CENTS,
  ALL_GUIDES,
  BARI_GUIDES,
  VALLE_GUIDES,
  GARGANO_GUIDES,
  CROCIERA_GUIDES,
  type ProductSlug,
} from '../../lib/stripe-prices';
import { getActivePartner } from '../../lib/partners';
import type { Lang } from '../../lib/i18n';
import { hasAllowedOrigin } from '../../lib/request-security';
import type Stripe from 'stripe';

const VALID_PRODUCTS = new Set<ProductSlug>([
  'single', 'custom', 'tris', 'sestina', 'puglia-completa',
  'bari-completa', 'valle-completa', 'gargano-completa', 'crociera',
]);

const PRODUCT_DISPLAY_NAME: Record<ProductSlug, string> = {
  single:              'Guida Localis',
  custom:              'Localis - Selezione personalizzata',
  tris:                'Localis - Pack 3 Guide',
  sestina:             'Localis - Pack 6 Guide',
  'puglia-completa':   'Puglia Completa — 18 guide',
  'bari-completa':     'Localis - Pack 6 Guide (Intera Zona)',
  'valle-completa':    'Localis - Pack 6 Guide (Intera Zona)',
  'gargano-completa':  'Localis - Pack 6 Guide (Intera Zona)',
  crociera:            'Pacchetto Crociera Localis',
};

const STORED_PRICE_PRODUCTS = new Set<ProductSlug>(['single', 'crociera']);

function normalizeLang(value: string | undefined): Lang {
  if (value === 'en' || value === 'de') return value;
  return 'it';
}

function isConfiguredConnectAccount(accountId: string | null | undefined): accountId is string {
  return typeof accountId === 'string' && !accountId.includes('REPLACE_WITH_REAL_CONNECT_ID');
}

function resolveFixedSlugs(product: ProductSlug): string[] | null {
  if (product === 'puglia-completa')  return [...ALL_GUIDES];
  if (product === 'bari-completa')    return [...BARI_GUIDES];
  if (product === 'valle-completa')   return [...VALLE_GUIDES];
  if (product === 'gargano-completa') return [...GARGANO_GUIDES];
  if (product === 'crociera')         return [...CROCIERA_GUIDES];
  return null;
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!hasAllowedOrigin(request, url.origin)) {
    return jsonError(403, 'Forbidden origin');
  }

  const redirectMode = url.searchParams.get('redirect') === '1';

  let body: {
    product?: string;
    selectedSlugs?: string[];
    guideSlug?: string;
    lang?: string;
    partnerId?: string;
  };
  try {
    body = await parseCheckoutRequest(request);
  } catch {
    return redirectMode
      ? redirectError(url.origin, '/guide?checkoutError=1')
      : jsonError(400, 'Invalid checkout payload');
  }

  const product = body.product as ProductSlug | undefined;
  const lang = normalizeLang(body.lang);

  if (!product || !VALID_PRODUCTS.has(product)) {
    return redirectMode
      ? redirectError(url.origin, fallbackCheckoutErrorPath(lang, product, body.guideSlug))
      : jsonError(400, 'Missing or invalid product');
  }

  let guide_slugs: string[];
  const fixedSlugs = resolveFixedSlugs(product);
  if (fixedSlugs) {
    guide_slugs = fixedSlugs;
  } else if (product === 'single') {
    const slug = body.guideSlug ?? body.selectedSlugs?.[0];
    if (!slug) {
      return redirectMode
        ? redirectError(url.origin, fallbackCheckoutErrorPath(lang, product, body.guideSlug))
        : jsonError(400, 'single requires guideSlug');
    }
    guide_slugs = [slug];
  } else {
    guide_slugs = body.selectedSlugs ?? [];
  }

  try {
    validateSelectedSlugs(product, guide_slugs);
  } catch (err) {
    return redirectMode
      ? redirectError(url.origin, fallbackCheckoutErrorPath(lang, product, guide_slugs[0]))
      : jsonError(400, err instanceof Error ? err.message : 'Invalid slugs');
  }

  // Cookie oppure payload del client: alcuni browser (Safari restrittivo,
  // webview degli scanner QR) bloccano i cookie scritti via JS — il payload
  // fa da paracadute. In entrambi i casi getActivePartner valida lo slug.
  const partner_id_raw = cookies.get('lg_partner')?.value || body.partnerId || null;
  const siteUrl = (process.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');

  let partnerStripeAccount: string | null = null;
  let resolvedPartnerId: string | null = null;
  let partnerCommissionRate = 0;
  if (partner_id_raw) {
    const partner = await getActivePartner(partner_id_raw);
    if (partner) {
      // L'attribuzione della vendita (metadata -> webhook -> registro payout)
      // NON dipende da Stripe Connect: i partner sono liquidati manualmente.
      // Connect, se configurato, aggiunge solo il transfer automatico.
      resolvedPartnerId = partner.data.slug;
      partnerCommissionRate = partner.data.commission_rate;
      if (isConfiguredConnectAccount(partner.data.stripe_account_id)) {
        partnerStripeAccount = partner.data.stripe_account_id;
      }
    } else {
      console.warn(`[checkout] partner cookie "${partner_id_raw}" non corrisponde a un partner attivo — vendita non attribuita`);
    }
  }

  const totalCents = product === 'custom'
    ? PRODUCT_PRICE_CENTS.single * guide_slugs.length
    : PRODUCT_PRICE_CENTS[product];

  const lineItem: Record<string, unknown> = {};
  if (STORED_PRICE_PRODUCTS.has(product)) {
    let priceId: string;
    try {
      priceId = getStripePrice(product as 'single' | 'crociera');
    } catch {
      return redirectMode
        ? redirectError(url.origin, fallbackCheckoutErrorPath(lang, product, guide_slugs[0]))
        : jsonError(400, `Stripe price not configured for ${product}`);
    }
    Object.assign(lineItem, { price: priceId, quantity: 1 });
  } else {
    Object.assign(lineItem, {
      price_data: {
        currency: 'eur',
        unit_amount: totalCents,
        product_data: {
          name: PRODUCT_DISPLAY_NAME[product],
          description: `Audioguide Localis · Puglia · ${guide_slugs.length} guide`,
          metadata: { product },
        },
      },
      quantity: 1,
    });
  }

  const sessionParams: Record<string, unknown> = {
    mode: 'payment',
    // Niente payment_method_types hardcoded: Stripe mostra i metodi attivi
    // in dashboard (carta + wallet; PayPal/Klarna attivabili senza deploy).
    line_items: [lineItem],
    customer_creation: 'if_required',
    locale: lang,
    automatic_tax: { enabled: true },
    consent_collection: { terms_of_service: 'required' },
    allow_promotion_codes: true,
    metadata: {
      product,
      guide_slugs: guide_slugs.join(','),
      partner_id: resolvedPartnerId ?? '',
      // Snapshot per il calcolo payout e per la diagnosi di cookie non risolti.
      partner_commission_rate: resolvedPartnerId ? String(partnerCommissionRate) : '',
      partner_cookie: partner_id_raw ?? '',
      lang,
    },
    success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${siteUrl}${cancelPathFor(lang, product, guide_slugs[0])}`,
  };

  if (partnerStripeAccount) {
    sessionParams['payment_intent_data'] = {
      transfer_data: {
        destination: partnerStripeAccount,
        amount: Math.floor(totalCents * partnerCommissionRate),
      },
    };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionParams as Stripe.Checkout.SessionCreateParams);
    if (redirectMode) {
      if (!session.url) {
        return redirectError(url.origin, fallbackCheckoutErrorPath(lang, product, guide_slugs[0]));
      }
      return Response.redirect(session.url, 303);
    }
    return new Response(JSON.stringify({ url: session.url }), {
      headers: jsonHeaders(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[checkout]', msg);
    return redirectMode
      ? redirectError(url.origin, fallbackCheckoutErrorPath(lang, product, guide_slugs[0]))
      : jsonError(500, 'Checkout creation failed');
  }
};

async function parseCheckoutRequest(request: Request): Promise<{
  product?: string;
  selectedSlugs?: string[];
  guideSlug?: string;
  lang?: string;
  partnerId?: string;
}> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData();
    return {
      product: readFormValue(form, 'product'),
      guideSlug: readFormValue(form, 'guideSlug'),
      lang: readFormValue(form, 'lang'),
      partnerId: readFormValue(form, 'partnerId'),
      selectedSlugs: form.getAll('selectedSlugs').map(String).filter(Boolean),
    };
  }

  throw new Error('Unsupported content type');
}

function readFormValue(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function cancelPathFor(lang: Lang, product: ProductSlug, firstGuideSlug: string): string {
  if (product === 'custom' || product === 'tris' || product === 'sestina' || product === 'puglia-completa') {
    if (lang === 'de') return '/de/guide#builder';
    if (lang === 'en') return '/en/guide#builder';
    return '/guide#builder';
  }

  if (lang === 'de') {
    return product === 'crociera' ? '/de/kreuzfahrt?cancelled=1' : '/de?cancelled=1';
  }

  const prefix = lang === 'en' ? '/en' : '';
  return `${prefix}/guide/${firstGuideSlug}?cancelled=1`;
}

function fallbackCheckoutErrorPath(
  lang: Lang,
  product: ProductSlug | undefined,
  firstGuideSlug?: string,
): string {
  const basePath = product
    ? cancelPathFor(lang, product, firstGuideSlug || 'bari-vecchia')
    : lang === 'de'
      ? '/de/guide'
      : lang === 'en'
        ? '/en/guide'
        : '/guide';

  return appendCheckoutError(basePath);
}

function appendCheckoutError(path: string): string {
  const divider = path.includes('?') ? '&' : '?';
  return `${path}${divider}checkoutError=1`;
}

function redirectError(origin: string, path: string): Response {
  return Response.redirect(new URL(path, origin), 303);
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders(),
  });
}

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store',
  };
}
