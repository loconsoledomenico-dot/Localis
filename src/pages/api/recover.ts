import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { generateAccessToken } from '../../lib/jwt';
import { sendEmail } from '../../lib/resend';
import { renderAccessEmailIt } from '../../lib/emails/access-email-it';
import { renderAccessEmailEn } from '../../lib/emails/access-email-en';
import { renderAccessEmailDe } from '../../lib/emails/access-email-de';
import { getCollection } from 'astro:content';
import type Stripe from 'stripe';
import { hasAllowedOrigin } from '../../lib/request-security';
import { rateLimit } from '../../lib/rate-limit';
import { getEntitlement, grantEntitlement } from '../../lib/entitlements';
import type { Lang } from '../../lib/i18n';
import { guideTitle } from '../../lib/guide-localization';

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  if (!hasAllowedOrigin(request, url.origin)) {
    return jsonError(403, 'Forbidden origin');
  }

  const ip = clientAddress || 'unknown';
  if (!(await rateLimit('recover', ip, RATE_LIMIT, RATE_WINDOW_MS))) {
    return jsonError(429, 'Too many requests. Try again in 1 hour.');
  }

  let body: { email?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON');
  }

  const email = (body.email || '').trim().toLowerCase();
  const lang: Lang = body.lang === 'en' || body.lang === 'de' ? body.lang : 'it';

  if (!email || !email.includes('@')) {
    return jsonError(400, 'Invalid email');
  }

  const allGuideSlugs: string[] = [];
  let lastSessionId: string | null = null;
  let lastPartnerId: string | null = null;

  // Fast path: entitlements written by the webhook on purchase. A single
  // indexed lookup, no Stripe scan.
  const stored = await getEntitlement(email);
  if (stored && stored.guide_slugs.length > 0) {
    allGuideSlugs.push(...stored.guide_slugs);
    lastSessionId = stored.last_session_id;
    lastPartnerId = stored.partner_id;
  } else {
    // Fallback for buyers who purchased before the entitlement store existed:
    // Stripe Checkout has no customer_email list filter, so paginate instead
    // of only checking the latest 100 sessions, then backfill the store.
    try {
      const stripe = getStripe();
      let startingAfter: string | undefined;
      let hasMore = true;
      let pagesScanned = 0;

      while (hasMore && pagesScanned < 20) {
        const params: Stripe.Checkout.SessionListParams = { limit: 100 };
        if (startingAfter) params.starting_after = startingAfter;

        const sessions = await stripe.checkout.sessions.list(params);
        for (const session of sessions.data) {
          if (session.payment_status !== 'paid') continue;
          const sessionEmail = (session.customer_email || session.customer_details?.email || '').toLowerCase();
          if (sessionEmail !== email) continue;

          const meta = session.metadata || {};
          const slugs = (meta.guide_slugs || '').split(',').filter(Boolean);
          for (const s of slugs) {
            if (!allGuideSlugs.includes(s)) allGuideSlugs.push(s);
          }
          lastSessionId = session.id;
          lastPartnerId = meta.partner_id || null;
        }

        hasMore = sessions.has_more;
        startingAfter = sessions.data.at(-1)?.id;
        pagesScanned++;
        if (!startingAfter) break;
      }
    } catch (err: unknown) {
      console.error('[recover] Stripe lookup error', err);
    }

    // Migrate legacy buyer into the store so future recoveries skip the scan.
    if (allGuideSlugs.length > 0) {
      await grantEntitlement(email, allGuideSlugs, lastPartnerId, lastSessionId || 'recover');
    }
  }

  if (allGuideSlugs.length === 0) {
    // Don't leak whether email exists; respond with generic success
    return new Response(JSON.stringify({ ok: true }), {
      headers: jsonHeaders(),
    });
  }

  // Generate fresh token covering all purchased guides
  const token = generateAccessToken({
    email,
    guide_slugs: allGuideSlugs,
    stripe_session_id: lastSessionId || 'recover',
    partner_id: lastPartnerId,
  });

  const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://localis.guide').replace(/\/$/, '');
  const accessUrl = `${siteUrl}/access/${token}?lang=${lang}`;

  // Look up guide titles in language
  const guides = await getCollection('guides');
  const guideTitles = allGuideSlugs.map((slug) => {
    const g = guides.find((g) => g.data.slug === slug);
    if (!g) return slug;
    return guideTitle(g.data, lang);
  });

  const { subject, html, text } = lang === 'en'
    ? renderAccessEmailEn({ accessUrl, guideTitles })
    : lang === 'de'
      ? renderAccessEmailDe({ accessUrl, guideTitles })
    : renderAccessEmailIt({ accessUrl, guideTitles });

  await sendEmail({ to: email, subject, html, text });

  return new Response(JSON.stringify({ ok: true }), {
    headers: jsonHeaders(),
  });
};

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
