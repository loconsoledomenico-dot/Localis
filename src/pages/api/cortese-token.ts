import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { generateAccessToken } from '../../lib/jwt';
import { canonicalGuideSlug } from '../../lib/legacy-slugs';
import { rateLimit } from '../../lib/rate-limit';

/**
 * Ponte Cortése → Localis.
 *
 * Conia il token di accesso (lo stesso JWT usato da /access e /api/audio-url)
 * così l'app concierge Cortése può far partire il player Localis in-app SENZA
 * richiedere email all'ospite. Restituisce anche l'access_url del player pronto.
 *
 * DUE modalità:
 *
 *  • GRATIS (GET, senza segreto):
 *      GET /api/cortese-token?hotel=<slug>&lang=<it|en|de>
 *    Localis decide QUALE guida è l'omaggio di quell'hotel (mappa qui sotto):
 *    il client non può chiedere guide arbitrarie → nessun abuso del prodotto a
 *    pagamento. Serve solo per la guida-regalo della struttura.
 *
 *  • PAGATO (POST, con segreto condiviso server-to-server):
 *      POST /api/cortese-token  { secret, guide_slugs[], partner_id?, marker?, lang? }
 *    Il chiamante fidato è il backend Cortése (Supabase), che ha già registrato
 *    l'addebito sul conto camera. MAI chiamato dal browser dell'ospite.
 */

// Mappa hotel → guida omaggio. Per ora inline (pochi hotel demo); a regime
// diventerà una config/DB condivisa. La città esatta dell'hotel può non essere
// nel catalogo: si sceglie la guida di zona più rappresentativa.
const FREE_GUIDE_BY_HOTEL: Record<string, string> = {
  'masseria-del-crocifisso': 'alberobello', // Polignano → Valle d'Itria (trulli, UNESCO)
};

function siteBase(): string {
  return (process.env.PUBLIC_SITE_URL || 'https://localis.guide').replace(/\/$/, '');
}
function normLang(v: string | null | undefined): 'it' | 'en' | 'de' {
  return v === 'en' || v === 'de' ? v : 'it';
}
function tokenResponse(token: string, lang: 'it' | 'en' | 'de', guideSlug: string): Response {
  const accessUrl = `${siteBase()}/access/${token}?lang=${lang}`;
  return new Response(JSON.stringify({ token, access_url: accessUrl, guide_slug: guideSlug }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}
function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}

// ── GRATIS ──────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ url, clientAddress }) => {
  const hotel = (url.searchParams.get('hotel') || '').trim().toLowerCase();
  const lang = normLang(url.searchParams.get('lang'));
  if (!hotel) return err(400, 'hotel mancante');

  const ip = clientAddress || 'unknown';
  if (!(await rateLimit('cortese-free', ip, 60, 60 * 60 * 1000))) {
    return err(429, 'Troppe richieste, riprova tra poco');
  }

  const slug = FREE_GUIDE_BY_HOTEL[hotel];
  if (!slug) return err(404, 'Nessuna guida omaggio configurata per questa struttura');

  const guideSlug = canonicalGuideSlug(slug);
  const token = generateAccessToken({
    email: `cortese:free:${hotel}`,
    guide_slugs: [guideSlug],
    stripe_session_id: `cortese:free:${hotel}`,
    partner_id: null, // un omaggio non inquina l'attribuzione rev-share
  });
  return tokenResponse(token, lang, guideSlug);
};

// ── PAGATO (server-to-server) ───────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  const expected = process.env.CORTESE_BRIDGE_SECRET;
  if (!expected || expected.length < 24) return err(500, 'Bridge non configurato');

  let body: {
    secret?: string;
    guide_slugs?: unknown;
    partner_id?: string;
    marker?: string;
    lang?: string;
  };
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON');
  }

  if (!secretMatches(body.secret, expected)) return err(401, 'Unauthorized');

  const slugs = Array.isArray(body.guide_slugs)
    ? [...new Set(body.guide_slugs.map((s) => canonicalGuideSlug(String(s))).filter(Boolean))]
    : [];
  if (slugs.length === 0) return err(400, 'guide_slugs mancante');
  if (slugs.length > 30) return err(400, 'Troppe guide in un solo token');

  const lang = normLang(body.lang);
  const marker = String(body.marker || 'guest').slice(0, 80);
  const partnerId = body.partner_id ? String(body.partner_id).slice(0, 80) : null;

  const token = generateAccessToken({
    email: `cortese:${marker}`,
    guide_slugs: slugs,
    stripe_session_id: `cortese:${marker}`,
    partner_id: partnerId, // attribuzione rev-share alla struttura
  });
  return tokenResponse(token, lang, slugs[0]);
};

function secretMatches(given: unknown, expected: string): boolean {
  if (typeof given !== 'string' || given.length === 0) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
