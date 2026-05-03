import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/resend';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const businessName = String(body.business_name || '').trim().slice(0, 200);
  const type = String(body.type || '').trim().slice(0, 50);
  const city = String(body.city || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 50);
  const message = String(body.message || '').trim().slice(0, 2000);

  if (!businessName || !email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
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
    return new Response(JSON.stringify({ error: 'Send failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
