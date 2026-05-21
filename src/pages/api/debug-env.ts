import type { APIRoute } from 'astro';

/**
 * TEMPORARY diagnostic endpoint. Returns ONLY classifications/lengths
 * for the env vars — never any portion of the secret value itself.
 *
 * DELETE THIS FILE once the checkout flow is verified.
 */
export const GET: APIRoute = async () => {
  const classify = (name: string, expectedPrefixes: readonly string[] = []) => {
    const v = process.env[name];
    if (!v) return { present: false };
    const matchedPrefix = expectedPrefixes.find((p) => v.startsWith(p));
    return {
      present: true,
      length: v.length,
      has_leading_space: v !== v.trimStart(),
      has_trailing_space: v !== v.trimEnd(),
      prefix_match: matchedPrefix ?? null,
      prefix_match_any: matchedPrefix !== undefined,
    };
  };

  const report = {
    STRIPE_SECRET_KEY: classify('STRIPE_SECRET_KEY', ['sk_live_', 'sk_test_']),
    STRIPE_PUBLISHABLE_KEY: classify('STRIPE_PUBLISHABLE_KEY', ['pk_live_', 'pk_test_']),
    STRIPE_WEBHOOK_SECRET: classify('STRIPE_WEBHOOK_SECRET', ['whsec_']),
    Stripe_id_singola: classify('Stripe_id_singola', ['price_']),
    Stripe_id_bundle: classify('Stripe_id_bundle', ['price_']),
    PUBLIC_SITE_URL: classify('PUBLIC_SITE_URL', ['https://', 'http://']),
    RESEND_API_KEY: classify('RESEND_API_KEY', ['re_']),
    RESEND_FROM_EMAIL: classify('RESEND_FROM_EMAIL'),
    JWT_SECRET: classify('JWT_SECRET'),
  };

  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
