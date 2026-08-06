// Conta LATO SERVER, indipendentemente dal consenso cookie:
//   1. le aperture delle landing partner /p/{slug} e /q/{code}  → chiave = slug / "q:{code}"
//   2. le pagine viste di TUTTO il sito                         → chiave = "v:{path}" + "v:__all"
//
// Motivo: GA4 e PostHog partono solo dopo l'accettazione dei cookie, quindi
// vedono una frazione del traffico reale (misurato: 5 scan su 34). Qui il
// server vede ogni richiesta HTML, consenso o no. Aggregato per giorno, senza
// identificatori: nessun IP, nessun cookie, nessuna persona (GDPR-safe).
//
// Store 'scan-counts', una chiave per giorno (YYYY-MM-DD) = { chiave: conteggio }.
import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/edge-functions';

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|monitor|curl|wget|python-requests|axios|node-fetch|okhttp|go-http/i;

export default async function scanCounter(request: Request, context: Context): Promise<Response> {
  const res = await context.next();
  try {
    if (request.method !== 'GET' || res.status !== 200) return res;
    // Solo pagine: esclude asset, API JSON, feed. Prima di toccare i Blobs.
    if (!/^text\/html/i.test(res.headers.get('content-type') || '')) return res;

    const url = new URL(request.url);
    if (url.searchParams.get('localis_internal') === '1') return res; // canary/test interni
    const ua = request.headers.get('user-agent') || '';
    if (!ua || BOT.test(ua)) return res;

    const path = url.pathname;
    const pm = path.match(/^\/(?:en\/|de\/)?p\/([a-z0-9][a-z0-9-]{2,40})\/?$/i);
    const qm = path.match(/^\/q\/([a-z0-9]{4,12})\/?$/i);
    const scanKey = pm ? pm[1].toLowerCase() : qm ? `q:${qm[1].toLowerCase()}` : null;
    // Path normalizzato e tagliato: la chiave finisce in un JSON, non deve esplodere.
    const viewKey = `v:${path.toLowerCase().slice(0, 120)}`;

    const day = new Date().toISOString().slice(0, 10);
    const store = getStore({ name: 'scan-counts', consistency: 'strong' });
    const rec = ((await store.get(day, { type: 'json' })) as Record<string, number> | null) || {};
    if (scanKey) rec[scanKey] = (rec[scanKey] || 0) + 1;
    rec[viewKey] = (rec[viewKey] || 0) + 1;
    rec['v:__all'] = (rec['v:__all'] || 0) + 1;
    await store.setJSON(day, rec);
  } catch {
    /* non bloccare mai la pagina per un errore di conteggio */
  }
  return res;
}

export const config = {
  path: '/*',
  // Tutto ciò che non è una pagina: risparmia l'invocazione. Il controllo sul
  // content-type resta comunque la rete di sicurezza per il resto.
  excludedPath: [
    '/_astro/*', '/api/*', '/audio/*', '/images/*', '/video/*', '/og/*', '/admin/*',
    '/favicon.*', '/sw.js', '/og-default.jpg', '/*.xml', '/*.txt', '/*.json',
  ],
};
