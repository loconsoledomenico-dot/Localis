// Conta le aperture delle landing partner LATO SERVER, indipendentemente dal
// consenso cookie. Motivo: `qr_scan` (client, GA4) scatta solo dopo che
// l'ospite accetta i cookie → in hotel la maggior parte delle scansioni è
// invisibile. Qui il server vede OGNI richiesta a /p/{slug} e /q/{code},
// consenso o no, e la conta su Netlify Blobs (aggregato, anonimo, GDPR-safe).
//
// Store 'scan-counts', una chiave per giorno (YYYY-MM-DD) = { chiave: conteggio }.
// chiave = slug partner, oppure "q:{code}" per le card neutre.
import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/edge-functions';

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|monitor|curl|wget|python-requests|axios|node-fetch|okhttp|go-http/i;

export default async function scanCounter(request: Request, context: Context): Promise<Response> {
  const res = await context.next();
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('localis_internal') === '1') return res; // canary/test interni
    const ua = request.headers.get('user-agent') || '';
    if (!ua || BOT.test(ua)) return res;

    const path = url.pathname;
    const pm = path.match(/^\/(?:en\/|de\/)?p\/([a-z0-9][a-z0-9-]{2,40})\/?$/i);
    const qm = path.match(/^\/q\/([a-z0-9]{4,12})\/?$/i);
    const key = pm ? pm[1].toLowerCase() : qm ? `q:${qm[1].toLowerCase()}` : null;
    if (!key) return res;

    const day = new Date().toISOString().slice(0, 10);
    const store = getStore({ name: 'scan-counts', consistency: 'strong' });
    const rec = ((await store.get(day, { type: 'json' })) as Record<string, number> | null) || {};
    rec[key] = (rec[key] || 0) + 1;
    await store.setJSON(day, rec);
  } catch {
    /* non bloccare mai la pagina per un errore di conteggio */
  }
  return res;
}

export const config = { path: ['/p/*', '/q/*', '/en/p/*', '/de/p/*'] };
