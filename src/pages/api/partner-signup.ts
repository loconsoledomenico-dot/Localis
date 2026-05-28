import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/resend';
import { hasAllowedOrigin } from '../../lib/request-security';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isAllowed(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  if (!hasAllowedOrigin(request, url.origin)) {
    return jsonResponse({ error: 'Forbidden origin' }, 403);
  }

  if (!isAllowed(clientAddress || 'unknown')) {
    return jsonResponse({ error: 'Too many requests' }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const website = String(body.website || '').trim();
  if (website) {
    return jsonResponse({ ok: true });
  }

  const businessName = String(body.business_name || '').trim().slice(0, 200);
  const type = String(body.type || '').trim().slice(0, 50);
  const city = String(body.city || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 50);
  const message = String(body.message || '').trim().slice(0, 2000);

  if (!businessName || !email || !email.includes('@')) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const html = `<!DOCTYPE html>
<html><body style="font-family: monospace; padding: 24px;">
<h1>Nuova richiesta partner</h1>
<dl>
  <dt><b>Attivit&agrave;:</b></dt><dd>${esc(businessName)}</dd>
  <dt><b>Tipo:</b></dt><dd>${esc(type)}</dd>
  <dt><b>Citt&agrave;:</b></dt><dd>${esc(city)}</dd>
  <dt><b>Email:</b></dt><dd><a href="mailto:${esc(email)}">${esc(email)}</a></dd>
  <dt><b>Telefono:</b></dt><dd>${esc(phone)}</dd>
  <dt><b>Messaggio:</b></dt><dd>${esc(message).replace(/\n/g, '<br>')}</dd>
</dl>
</body></html>`;

  const text = `Nuova richiesta partner

Attivita: ${businessName}
Tipo: ${type}
Citta: ${city}
Email: ${email}
Telefono: ${phone}
Messaggio: ${message}
`;

  try {
    await sendEmail({
      to: 'hello@localis.guide',
      replyTo: email,
      subject: `Partner: ${businessName} (${city})`,
      html,
      text,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[partner-signup]', msg);
    return jsonResponse({ error: 'Send failed' }, 500);
  }

  return jsonResponse({ ok: true });
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
