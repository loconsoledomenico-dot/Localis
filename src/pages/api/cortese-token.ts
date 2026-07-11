import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
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
  'masseria-del-crocifisso': 'alberobello',  // Polignano → Valle d'Itria (trulli, UNESCO)
  'maison-levante': 'gargano-nord',          // Rodi Garganico → Gargano nord (la sua zona)
};

function siteBase(): string {
  return (process.env.PUBLIC_SITE_URL || 'https://localis.guide').replace(/\/$/, '');
}
function normLang(v: string | null | undefined): 'it' | 'en' | 'de' {
  return v === 'en' || v === 'de' ? v : 'it';
}
function accessUrlFor(token: string, lang: 'it' | 'en' | 'de'): string {
  return `${siteBase()}/access/${token}?lang=${lang}`;
}
function tokenResponse(
  token: string,
  lang: 'it' | 'en' | 'de',
  guideSlug: string,
  redirect: boolean,
): Response {
  const accessUrl = accessUrlFor(token, lang);
  // Modalità redirect: l'app Cortése punta un iframe/link direttamente qui
  // (?go=1) e viene portata al player, senza fetch cross-origin (niente CORS).
  if (redirect) {
    return new Response(null, {
      status: 302,
      headers: { Location: accessUrl, 'Cache-Control': 'private, no-store' },
    });
  }
  return new Response(JSON.stringify({ token, access_url: accessUrl, guide_slug: guideSlug }), {
    // CORS aperto: il token gratis è hotel-scoped (nessun rischio), così l'app
    // Cortése può anche leggerlo via fetch se preferisce.
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'Access-Control-Allow-Origin': '*',
    },
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
  return tokenResponse(token, lang, guideSlug, url.searchParams.has('go'));
};

// Preflight CORS per la POST (il frontend Cortése invia JSON → preflight).
export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });

// ── PAGATO ──────────────────────────────────────────────────────────
// Due modi di autorizzare (l'acquisto è già sul conto camera lato Cortése):
//  A) secret grezzo (server-to-server, se mai servisse da un backend fidato)
//  B) firma HMAC (consigliato): il backend Cortése (Supabase, con pgcrypto)
//     firma (guide_slug\nmarker\nexp) col segreto condiviso; il browser la
//     inoltra qui. Nessun segreto nel browser, nessuna chiamata HTTP dal DB.
export const POST: APIRoute = async ({ request }) => {
  const expected = process.env.CORTESE_BRIDGE_SECRET;
  if (!expected || expected.length < 24) return err(500, 'Bridge non configurato');

  let body: {
    secret?: string;
    proof?: string;
    exp?: number | string;
    guide_slug?: string;
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

  const marker = String(body.marker || 'guest').slice(0, 80);
  let slugs: string[] = [];

  if (typeof body.secret === 'string' && body.secret.length > 0) {
    // Modo A — secret grezzo
    if (!secretMatches(body.secret, expected)) return err(401, 'Unauthorized');
    slugs = Array.isArray(body.guide_slugs)
      ? [...new Set(body.guide_slugs.map((s) => canonicalGuideSlug(String(s))).filter(Boolean))]
      : [];
  } else if (typeof body.proof === 'string' && body.guide_slug && body.exp != null) {
    // Modo B — firma HMAC su (guide_slug\nmarker\nexp)
    const exp = Number(body.exp);
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return err(401, 'Firma scaduta');
    const base = `${body.guide_slug}\n${marker}\n${exp}`;
    const good = createHmac('sha256', expected).update(base).digest('hex');
    if (!hexEq(good, body.proof)) return err(401, 'Firma non valida');
    slugs = [canonicalGuideSlug(String(body.guide_slug))].filter(Boolean);
  } else {
    return err(401, 'Unauthorized');
  }

  if (slugs.length === 0) return err(400, 'guide_slug mancante');
  if (slugs.length > 30) return err(400, 'Troppe guide in un solo token');

  const lang = normLang(body.lang);
  const partnerId = body.partner_id ? String(body.partner_id).slice(0, 80) : null;

  const token = generateAccessToken({
    email: `cortese:${marker}`,
    guide_slugs: slugs,
    stripe_session_id: `cortese:${marker}`,
    partner_id: partnerId, // attribuzione rev-share alla struttura
  });
  return tokenResponse(token, lang, slugs[0], false);
};

function secretMatches(given: unknown, expected: string): boolean {
  if (typeof given !== 'string' || given.length === 0) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function hexEq(a: string, b: string): boolean {
  if (typeof b !== 'string' || a.length !== b.length) return false;
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && ba.length > 0 && timingSafeEqual(ba, bb);
}
