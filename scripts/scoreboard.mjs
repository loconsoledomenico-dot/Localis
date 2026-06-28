// Scoreboard settimanale Localis — i 4 numeri che contano (piano-lancio.md).
// Uso: node scripts/scoreboard.mjs [giorni]   (default 7)
// Fonte: GA4 (stesso auth di ga4-partner-funnel.mjs). IG = manuale (Meta API non collegata).
import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth.mjs';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const days = Number(process.argv[2] || 7);
const { auth } = await getGoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
const ga = google.analyticsdata({ version: 'v1beta', auth });
const range = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

async function report(body) {
  const res = await ga.properties.runReport({ property: `properties/${propertyId}`, requestBody: { dateRanges: range, ...body } });
  return res.data.rows ?? [];
}
const N = (r, i) => Number(r.metricValues[i].value);
const D = (r, i) => r.dimensionValues[i].value;

// 1. Eventi chiave (totali)
const ev = await report({ dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }] });
const count = (name) => ev.filter((r) => D(r, 0) === name).reduce((s, r) => s + N(r, 0), 0);
const scans = count('qr_scan');
const checkouts = count('checkout_started');
const sales = count('purchase');
const conv = scans ? ((sales / scans) * 100).toFixed(1) + '%' : 'n/d';

// 2. Scansioni QR per struttura (partner)
const byPartner = await report({
  dimensions: [{ name: 'customEvent:partner_id' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'qr_scan' } } },
});
const partnerScans = byPartner
  .map((r) => ({ partner: D(r, 0), scans: N(r, 0) }))
  .filter((p) => p.partner && p.partner !== '(not set)')
  .sort((a, b) => b.scans - a.scans);
const attributed = partnerScans.reduce((s, p) => s + p.scans, 0);

// 3. Output
const L = [];
L.push(`\n=== Localis · Scoreboard (ultimi ${days} giorni) ===`);
L.push(`\nVENDITE`);
L.push(`  Acquisti: ${sales}`);
L.push(`  Funnel:   ${scans} scan -> ${checkouts} checkout -> ${sales} acquisti`);
L.push(`  Conversione scan -> acquisto: ${conv}`);
L.push(`\nSCANSIONI QR per struttura`);
if (!partnerScans.length) L.push('  (nessuna scansione attribuita a una struttura)');
else partnerScans.forEach((p) => L.push(`  ${p.partner.padEnd(28)} ${p.scans}`));
if (scans > attributed) L.push(`  (non attribuite a struttura: ${scans - attributed})`);
L.push(`\nINSTAGRAM (manuale — Meta API non collegata)`);
L.push(`  follower: ___   salvataggi+condivisioni ${days}gg: ___   (li mette Domenico)`);
L.push(`\nDA GUARDARE`);
L.push(`  - strutture a 0 scan = QR non visto -> ricontatta l'host sulla collocazione`);
L.push(`  - tante scan + poche vendite = problema offerta/prezzo`);
L.push(`  - euro reali: incrocia con Stripe`);
console.log(L.join('\n'));
