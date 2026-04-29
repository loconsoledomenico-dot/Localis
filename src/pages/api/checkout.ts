import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import {
  getStripePrice,
  getGuideSlugsForProduct,
  type ProductSlug,
} from '../../lib/stripe-prices';

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

  // Read partner attribution from cookie (Milestone E uses it; null for now)
  const partner_id = cookies.get('lg_partner')?.value || null;

  const siteUrl = (process.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: 'if_required',
      locale: lang === 'en' ? 'en' : 'it',
      automatic_tax: { enabled: true },
      consent_collection: {
        terms_of_service: 'required',
      },
      allow_promotion_codes: true,
      metadata: {
        product,
        guide_slugs: guide_slugs.join(','),
        partner_id: partner_id ?? '',
        lang,
      },
      success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${lang === 'en' ? '/en' : ''}/guide/${guide_slugs[0]}?cancelled=1`,
    });

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
