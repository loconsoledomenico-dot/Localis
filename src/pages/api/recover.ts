import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { generateAccessToken } from '../../lib/jwt';
import { sendEmail } from '../../lib/resend';
import { renderAccessEmailIt } from '../../lib/emails/access-email-it';
import { renderAccessEmailEn } from '../../lib/emails/access-email-en';
import { getCollection } from 'astro:content';

// Simple in-memory rate limit (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || 'unknown';
  if (!rateLimit(ip)) {
    return jsonError(429, 'Too many requests. Try again in 1 hour.');
  }

  let body: { email?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON');
  }

  const email = (body.email || '').trim().toLowerCase();
  const lang = (body.lang === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (!email || !email.includes('@')) {
    return jsonError(400, 'Invalid email');
  }

  // Look up purchases by listing recent paid sessions, filtering client-side by email
  const allGuideSlugs: string[] = [];
  let lastSessionId: string | null = null;
  let lastPartnerId: string | null = null;

  try {
    const stripe = getStripe();
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });

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
  } catch (err: unknown) {
    console.error('[recover] Stripe lookup error', err);
  }

  if (allGuideSlugs.length === 0) {
    // Don't leak whether email exists; respond with generic success
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
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
  const accessUrl = `${siteUrl}/access/${token}`;

  // Look up guide titles in language
  const guides = await getCollection('guides');
  const guideTitles = allGuideSlugs.map((slug) => {
    const g = guides.find((g) => g.data.slug === slug);
    if (!g) return slug;
    return lang === 'en' ? g.data.title_en : g.data.title_it;
  });

  const { subject, html, text } = lang === 'en'
    ? renderAccessEmailEn({ accessUrl, guideTitles })
    : renderAccessEmailIt({ accessUrl, guideTitles });

  await sendEmail({ to: email, subject, html, text });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
