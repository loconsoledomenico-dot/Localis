// Raccoglie i dati per il digest giornaliero e li stampa in JSON su stdout.
// Usato da gallery-outreach/daily_digest.py.  Output: { date, ga4, commits, recontact }

import { readdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runReport } from './ga4-shared.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCALIS = join(HERE, '..');
const GALLERY = 'C:/Dev/gallery-outreach';
const PARTNERS_DIR = join(LOCALIS, 'src', 'content', 'partners');
const GRACE = 12;
const PHYSICAL = new Set(['hotel', 'bb', 'bar', 'restaurant', 'ristorante', 'shop', 'infopoint', 'cafe']);

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date();
const yest = new Date(today); yest.setDate(today.getDate() - 1);

function num(r, i = 0) { return Number(r?.metricValues?.[i]?.value || 0); }
function rows(d) { return d.rows || []; }

// --- GA4: totali di ieri ---
const yRange = [{ startDate: '1daysAgo', endDate: '1daysAgo' }];
const tot = await runReport({ dateRanges: yRange, metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }] });
const totRow = rows(tot)[0];

const evs = await runReport({
  dateRanges: yRange,
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['qr_scan', 'audio_preview_played', 'preview_played', 'checkout_started', 'begin_checkout', 'purchase', 'guide_audio_started', 'form_submit'] } } },
});
const events = {};
for (const r of rows(evs)) events[r.dimensionValues[0].value] = num(r);

const scanPart = await runReport({
  dateRanges: yRange,
  dimensions: [{ name: 'customEvent:partner_id' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'qr_scan' } } },
});
const scansByPartner = rows(scanPart).map((r) => ({ partner: r.dimensionValues[0].value || '(n/d)', scans: num(r) }));

// Provenienza degli utenti di IERI per canale (a basso volume ≈ per persona).
const provQ = await runReport({
  dateRanges: yRange,
  dimensions: [{ name: 'sessionDefaultChannelGroup' }, { name: 'sessionSource' }],
  metrics: [{ name: 'totalUsers' }],
  orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
  limit: 10,
});
const provenance = rows(provQ).map((r) => ({
  channel: r.dimensionValues[0].value || '(n/d)',
  source: r.dimensionValues[1].value || '',
  users: num(r),
}));

// --- Traffico sito ultimi 7 giorni (non partner): finestra mobile ---
// "Ieri" col sito a ~0-2 visite/giorno è quasi sempre vuoto: l'organico
// si vede solo su una finestra più larga. Questa sezione c'è sempre.
const wRange = [{ startDate: '7daysAgo', endDate: 'today' }];

const tot7 = await runReport({ dateRanges: wRange, metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }] });
const tot7Row = rows(tot7)[0];

const pages7 = await runReport({
  dateRanges: wRange,
  dimensions: [{ name: 'pagePath' }],
  metrics: [{ name: 'screenPageViews' }],
  orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  limit: 20,
});
// Esclude le landing partner (/p/, /en/p/, /de/p/): sono traffico da QR, hanno
// la loro sezione (funnel + scansioni). Qui contano solo le pagine "sito".
const isPartnerLanding = (path) => /^\/(?:en\/|de\/)?p\//.test(path);
const topPages = rows(pages7)
  .map((r) => ({ path: r.dimensionValues[0].value || '(n/d)', views: num(r) }))
  .filter((p) => !isPartnerLanding(p.path))
  .slice(0, 5);

const chan7 = await runReport({
  dateRanges: wRange,
  dimensions: [{ name: 'sessionDefaultChannelGroup' }],
  metrics: [{ name: 'sessions' }],
  orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  limit: 8,
});
const channels = rows(chan7).map((r) => ({ channel: r.dimensionValues[0].value || '(n/d)', sessions: num(r) }));

const site7d = {
  sessions: num(tot7Row, 0),
  users: num(tot7Row, 1),
  pageviews: num(tot7Row, 2),
  channels,
  topPages,
};

// --- Funnel 7gg: scan -> anteprima -> checkout -> acquisto ---
const funnelEv = await runReport({
  dateRanges: wRange,
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['qr_scan', 'audio_preview_played', 'begin_checkout', 'purchase'] } } },
});
const fc = {};
for (const r of rows(funnelEv)) fc[r.dimensionValues[0].value] = num(r);
const funnel7d = {
  scan: fc.qr_scan || 0,
  preview: fc.audio_preview_played || 0,
  checkout: fc.begin_checkout || 0,
  purchase: fc.purchase || 0,
};

// --- Git: commit di ieri nei due repo ---
function commitsSince(repo) {
  try {
    const out = execSync(
      `git -C "${repo}" log --since="${ymd(yest)} 00:00:00" --until="${ymd(today)} 00:00:00" --pretty=format:%s`,
      { encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
}

// --- Partner da ricontattare (finestra 14gg, stessa logica del check) ---
function field(src, name) { const m = src.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?\\s*$`, 'm')); return m ? m[1].trim() : null; }
let deployment = {};
try { deployment = JSON.parse(readFileSync(join(HERE, 'partner-deployment.json'), 'utf8')); } catch { /* ok */ }

const scan14 = await runReport({
  dateRanges: [{ startDate: '14daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'customEvent:partner_id' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'qr_scan' } } },
});
const scans14 = new Map();
for (const r of rows(scan14)) scans14.set(r.dimensionValues[0].value, num(r));

const ageDays = (d) => Math.floor((today - new Date(d)) / 86400000);
const recontact = [];
for (const file of readdirSync(PARTNERS_DIR).filter((f) => f.endsWith('.mdx'))) {
  const src = readFileSync(join(PARTNERS_DIR, file), 'utf8');
  if (field(src, 'status') !== 'active') continue;
  const slug = field(src, 'slug') || file.replace(/\.mdx$/, '');
  const dep = deployment[slug] || {};
  const channel = dep.channel || (PHYSICAL.has(field(src, 'type') || '') ? 'physical' : 'other');
  if (channel !== 'physical') continue;
  let qrDate = null, notDelivered = false;
  if (Object.prototype.hasOwnProperty.call(dep, 'qr_activated_at')) {
    if (dep.qr_activated_at === null) notDelivered = true; else qrDate = dep.qr_activated_at;
  } else qrDate = field(src, 'created_at');
  if (notDelivered || !qrDate) continue;
  if (ageDays(qrDate) < GRACE) continue;
  if ((scans14.get(slug) || 0) === 0) recontact.push({ name: field(src, 'display_name') || slug, slug, since: qrDate, age: ageDays(qrDate) });
}

console.log(JSON.stringify({
  date: ymd(yest),
  ga4: {
    sessions: num(totRow, 0), users: num(totRow, 1), pageviews: num(totRow, 2),
    events, scansByPartner, provenance, site7d, funnel7d,
  },
  commits: { localis: commitsSince(LOCALIS), gallery: commitsSince(GALLERY) },
  recontact,
}, null, 2));
