import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import {
  getStripePrice,
  getGuideSlugsForProduct,
  getProductPriceCents,
  type ProductSlug,
} from '../../lib/stripe-prices';
import { getActivePartner } from '../../lib/partners';
import type Stripe from 'stripe';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  let body: { product?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const product = body.product as ProductSlug | undefined;
  const lang = (body.lang === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (!product) {
    return jsonError(400, 'Missing product');
  }

  let priceId: string;
  try {
    priceId = getStripePrice(product);
  } catch (err) {
    return jsonError(400, `Unknown product: ${product}`);
  }

  const guide_slugs = getGuideSlugsForProduct(product);
  const partner_id_raw = cookies.get('lg_partner')?.value || null;

  const siteUrl = (process.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');

  // Resolve partner Stripe Connect account (only if cookie matches active partner)
  let partnerStripeAccount: string | null = null;
  let resolvedPartnerId: string | null = null;
  if (partner_id_raw) {
    const partner = await getActivePartner(partner_id_raw);
    if (partner) {
      partnerStripeAccount = partner.data.stripe_account_id;
      resolvedPartnerId = partner.data.slug;
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
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
    cancel_url: `${siteUrl}${lang === 'en' ? '/en' : ''}/guide/${guide_slugs[0]}?cancelled=1`,
  };

  if (partnerStripeAccount) {
    const totalCents = getProductPriceCents(product);
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: partnerStripeAccount,
        amount: Math.floor(totalCents * 0.25),
      },
    };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionParams);
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
