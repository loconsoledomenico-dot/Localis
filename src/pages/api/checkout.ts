import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import {
  getStripePrice,
  validateSelectedSlugs,
  PRODUCT_PRICE_CENTS,
  ALL_GUIDES,
  BARI_GUIDES,
  CROCIERA_GUIDES,
  type ProductSlug,
} from '../../lib/stripe-prices';
import { getActivePartner } from '../../lib/partners';
import type Stripe from 'stripe';

const VALID_PRODUCTS = new Set<ProductSlug>([
  'single', 'tris', 'sestina', 'puglia-completa', 'bari-completa', 'crociera',
]);

const PRODUCT_DISPLAY_NAME: Record<ProductSlug, string> = {
  single:            'Guida Localis',
  tris:              'Tris Localis — 3 guide a scelta',
  sestina:           'Sestina Localis — 6 guide a scelta',
  'puglia-completa': 'Puglia Completa — 18 guide',
  'bari-completa':   'Bari Completa — 6 guide di Bari',
  crociera:          'Pacchetto Crociera Localis',
};

const STORED_PRICE_PRODUCTS = new Set<ProductSlug>(['single', 'crociera']);

function resolveFixedSlugs(product: ProductSlug): string[] | null {
  if (product === 'puglia-completa') return [...ALL_GUIDES];
  if (product === 'bari-completa')   return [...BARI_GUIDES];
  if (product === 'crociera')        return [...CROCIERA_GUIDES];
  return null;
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  let body: {
    product?: string;
    selectedSlugs?: string[];
    guideSlug?: string;
    lang?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const product = body.product as ProductSlug | undefined;
  const lang = (body.lang === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (!product || !VALID_PRODUCTS.has(product)) {
    return jsonError(400, 'Missing or invalid product');
  }

  let guide_slugs: string[];
  const fixedSlugs = resolveFixedSlugs(product);
  if (fixedSlugs) {
    guide_slugs = fixedSlugs;
  } else if (product === 'single') {
    const slug = body.guideSlug ?? body.selectedSlugs?.[0];
    if (!slug) return jsonError(400, 'single requires guideSlug');
    guide_slugs = [slug];
  } else {
    guide_slugs = body.selectedSlugs ?? [];
  }

  try {
    validateSelectedSlugs(product, guide_slugs);
  } catch (err) {
    return jsonError(400, err instanceof Error ? err.message : 'Invalid slugs');
  }

  const partner_id_raw = cookies.get('lg_partner')?.value || null;
  const siteUrl = (process.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');

  let partnerStripeAccount: string | null = null;
  let resolvedPartnerId: string | null = null;
  if (partner_id_raw) {
    const partner = await getActivePartner(partner_id_raw);
    if (partner) {
      partnerStripeAccount = partner.data.stripe_account_id;
      resolvedPartnerId = partner.data.slug;
    }
  }

  const totalCents = PRODUCT_PRICE_CENTS[product];

  const lineItem: Record<string, unknown> = {};
  if (STORED_PRICE_PRODUCTS.has(product)) {
    let priceId: string;
    try {
      priceId = getStripePrice(product as 'single' | 'crociera');
    } catch {
      return jsonError(400, `Stripe price not configured for ${product}`);
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
    payment_method_types: ['card'],
    line_items: [lineItem],
    customer_creation: 'if_required',
    locale: lang === 'en' ? 'en' : 'it',
    automatic_tax: { enabled: true },
    consent_collection: { terms_of_service: 'required' },
    allow_promotion_codes: true,
    metadata: {
      product,
      guide_slugs: guide_slugs.join(','),
      partner_id: resolvedPartnerId ?? '',
      lang,
    },
    success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${siteUrl}${lang === 'en' ? '/en' : ''}/guide/${guide_slugs[0]}?cancelled=1`,
  };

  if (partnerStripeAccount) {
    sessionParams['payment_intent_data'] = {
      transfer_data: {
        destination: partnerStripeAccount,
        amount: Math.floor(totalCents * 0.25),
      },
    };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionParams as Stripe.Checkout.SessionCreateParams);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[checkout]', msg);
    return jsonError(500, 'Checkout creation failed');
  }
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
