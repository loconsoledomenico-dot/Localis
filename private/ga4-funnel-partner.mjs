import { runReport } from './ga4-shared.mjs';

// Finestra affidabile: qr_scan attivo dal 2026-06-12
const dateRanges = [{ startDate: '2026-06-12', endDate: 'today' }];

function rows(data) {
  return (data.rows || []).map((r) => ({
    dim: r.dimensionValues?.map((d) => d.value),
    met: r.metricValues?.map((m) => Number(m.value || 0)),
  }));
}

// Eventi del funnel (count + utenti)
const FUNNEL = [
  'qr_scan',
  'audio_preview_played',
  'preview_start',
  'preview_complete',
  'begin_checkout',
  'checkout_started',
  'purchase',
  'form_start',
  'form_submit',
];

const events = await runReport({
  dateRanges,
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
  limit: 100,
});
const map = Object.fromEntries(rows(events).map((r) => [r.dim[0], r.met]));
console.log('=== FUNNEL EVENTI (dal 12/06) — evento | count | utenti ===');
for (const e of FUNNEL) {
  const v = map[e] || [0, 0];
  console.log(`${e}\t${v[0]}\t${v[1]}`);
}

// Path /q/ (scan QR) e /p/ (schede partner)
const byPath = await runReport({
  dateRanges,
  dimensions: [{ name: 'pagePath' }],
  metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
  orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  limit: 200,
});
console.log('\n=== PATH QR /q/* e PARTNER /p/* (views, users) ===');
for (const r of rows(byPath)) {
  if (r.dim[0].startsWith('/q/') || r.dim[0].startsWith('/p/')) {
    console.log(`${r.met[0]}\t${r.met[1]}\t${r.dim[0]}`);
  }
}
