import { runReport } from './ga4-shared.mjs';

const dateRanges = [{ startDate: '2daysAgo', endDate: 'today' }];

function rows(d) {
  return (d.rows || []).map((r) => ({
    dim: r.dimensionValues?.map((x) => x.value),
    met: r.metricValues?.map((x) => Number(x.value || 0)),
  }));
}

// 1. qr_scan per giorno
const byDay = await runReport({
  dateRanges,
  dimensions: [{ name: 'date' }, { name: 'eventName' }],
  metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
  dimensionFilter: {
    filter: { fieldName: 'eventName', stringFilter: { value: 'qr_scan' } },
  },
  orderBys: [{ dimension: { dimensionName: 'date' } }],
});
console.log('=== qr_scan per giorno (ultimi 2gg) ===');
for (const r of rows(byDay)) console.log(`${r.dim[0]}  scans=${r.met[0]}  utenti=${r.met[1]}`);
if (!rows(byDay).length) console.log('(nessuna scansione)');

// 2. qr_scan per partner_id (event-scoped)
const byPartner = await runReport({
  dateRanges,
  dimensions: [{ name: 'customEvent:partner_id' }],
  metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
  dimensionFilter: {
    filter: { fieldName: 'eventName', stringFilter: { value: 'qr_scan' } },
  },
  orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  limit: 100,
});
console.log('\n=== qr_scan per partner_id (ultimi 2gg) ===');
for (const r of rows(byPartner)) console.log(`${(r.dim[0] || '(non impostato)').padEnd(24)} scans=${r.met[0]}  utenti=${r.met[1]}`);
if (!rows(byPartner).length) console.log('(nessuna scansione)');

// 3. tutti gli eventi partner-related per contesto (scan -> guida -> checkout)
const funnel = await runReport({
  dateRanges,
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
  dimensionFilter: {
    filter: { fieldName: 'eventName', inListFilter: { values: ['qr_scan', 'guide_audio_started', 'checkout_started', 'begin_checkout', 'purchase'] } },
  },
  orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
});
console.log('\n=== funnel eventi chiave (ultimi 2gg) ===');
for (const r of rows(funnel)) console.log(`${r.dim[0].padEnd(22)} ${r.met[0]}  utenti=${r.met[1]}`);
