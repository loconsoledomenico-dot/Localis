// Controllo attivazione partner: incrocia i partner attivi (src/content/partners
// con status: active) + lo stato deploy reale (private/partner-deployment.json)
// con le scansioni qr_scan da GA4. Segnala SOLO i veri da ricontattare:
// canale fisico + QR consegnato da >= GRACE giorni + zero scansioni.
//
// Uso:  node private/ga4-partner-scan-check.mjs [giorni-finestra]   (default 7)

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runReport } from './ga4-shared.mjs';

const DAYS = Number(process.argv[2] || 7);
const GRACE = 12; // giorni di tolleranza dopo la posa del QR prima di allarmare
const HERE = dirname(fileURLToPath(import.meta.url));
const PARTNERS_DIR = join(HERE, '..', 'src', 'content', 'partners');

const PHYSICAL = new Set(['hotel', 'bb', 'bar', 'restaurant', 'ristorante', 'shop', 'infopoint', 'cafe']);

function field(src, name) {
  const m = src.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?\\s*$`, 'm'));
  return m ? m[1].trim() : null;
}

// Stato deploy reale (canale + data posa QR), separato dai .mdx live
let deployment = {};
try {
  deployment = JSON.parse(readFileSync(join(HERE, 'partner-deployment.json'), 'utf8'));
} catch { /* assente: si usano i fallback */ }

// 1. Partner attivi dal repo
const active = [];
for (const file of readdirSync(PARTNERS_DIR).filter((f) => f.endsWith('.mdx'))) {
  const src = readFileSync(join(PARTNERS_DIR, file), 'utf8');
  if (field(src, 'status') !== 'active') continue;
  active.push({
    slug: field(src, 'slug') || file.replace(/\.mdx$/, ''),
    name: field(src, 'display_name') || file.replace(/\.mdx$/, ''),
    city: field(src, 'city') || '',
    type: field(src, 'type') || '',
    created: field(src, 'created_at') || '',
  });
}

// 2. Scansioni qr_scan per partner_id da GA4
const data = await runReport({
  dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }],
  dimensions: [{ name: 'customEvent:partner_id' }],
  metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
  dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'qr_scan' } } },
  limit: 200,
});
const scans = new Map();
for (const r of data.rows || []) {
  const pid = r.dimensionValues?.[0]?.value;
  if (pid) scans.set(pid, { scans: Number(r.metricValues?.[0]?.value || 0), users: Number(r.metricValues?.[1]?.value || 0) });
}

// 3. Classificazione
const today = new Date();
const ageDays = (d) => Math.floor((today - new Date(d)) / 86400000);

const buckets = { recontact: [], grace: [], ok: [], notDelivered: [], unknownDate: [], online: [], verify: [] };

for (const p of active) {
  const s = scans.get(p.slug) || { scans: 0, users: 0 };
  const dep = deployment[p.slug] || {};
  const channel = dep.channel || (PHYSICAL.has(p.type) ? 'physical' : 'other');

  let qrDate = null, notDelivered = false;
  if (Object.prototype.hasOwnProperty.call(dep, 'qr_activated_at')) {
    if (dep.qr_activated_at === null) notDelivered = true;
    else qrDate = dep.qr_activated_at;
  } else {
    qrDate = p.created || null; // fallback su created_at della scheda
  }
  const age = qrDate ? ageDays(qrDate) : null;
  const row = { ...p, ...s, channel, qrDate, age };

  if (channel === 'online') buckets.online.push(row);
  else if (channel !== 'physical') buckets.verify.push(row);
  else if (notDelivered) buckets.notDelivered.push(row);
  else if (qrDate == null) buckets.unknownDate.push(row);
  else if (age < GRACE) buckets.grace.push(row);
  else if (s.scans === 0) buckets.recontact.push(row);
  else buckets.ok.push(row);
}

// 4. Report
const tag = (r) => r.scans ? `✓ ${r.scans} scan/${r.users} ut` : '0 scan';
const loc = (r) => `[${r.type}·${r.city}${r.qrDate ? ` · QR ${r.qrDate} (${r.age}gg)` : ''}]`;
const dump = (title, arr) => {
  if (!arr.length) return;
  console.log(`\n# ${title}`);
  for (const r of arr.sort((a, b) => (b.age ?? -1) - (a.age ?? -1)))
    console.log(`  ${(r.name || r.slug).padEnd(26)} ${tag(r).padEnd(16)} ${loc(r)}`);
};

console.log(`\n=== Attivazione partner QR — scansioni ultimi ${DAYS}gg · grace ${GRACE}gg ===`);
dump(`🔴 DA RICONTATTARE — QR fisico da ≥${GRACE}gg, zero scan (${buckets.recontact.length})`, buckets.recontact);
dump(`🟢 OK — hanno scansioni`, buckets.ok);
dump(`⏳ In grace — appena attivati, ancora presto`, buckets.grace);
dump(`📦 QR non ancora consegnato`, buckets.notDelivered);
dump(`❔ Data attivazione ignota — aggiungi in partner-deployment.json`, buckets.unknownDate);
dump(`🌐 Canale online (referral, non scan)`, buckets.online);
dump(`🟡 Canale da verificare`, buckets.verify);

if (buckets.recontact.length)
  console.log(`\n>> RICONTATTA: ${buckets.recontact.map((r) => r.name).join(', ')}`);
else
  console.log(`\n>> Nessun partner da ricontattare ora. ✓`);

const orphan = [...scans.keys()].filter((k) => !active.some((p) => p.slug === k));
if (orphan.length) console.log(`\n(scan con partner_id non tra gli attivi: ${orphan.join(', ')})`);
