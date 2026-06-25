import { runReport } from './ga4-shared.mjs';

const dateRanges = [{ startDate: '90daysAgo', endDate: 'today' }];

function rows(data) {
  return (data.rows || []).map((r) => ({
    dim: r.dimensionValues?.map((d) => d.value),
    met: r.metricValues?.map((m) => Number(m.value || 0)),
  }));
}

// 1. Sessioni + utenti totali sito, ultimi 90gg
const totals = await runReport({
  dateRanges,
  metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
});
console.log('=== TOTALI 90gg ===');
console.log(JSON.stringify(rows(totals), null, 2));

// 2. Pageview per path (top 40)
const byPath = await runReport({
  dateRanges,
  dimensions: [{ name: 'pagePath' }],
  metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
  orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  limit: 40,
});
console.log('\n=== TOP 40 PATH (views, users) ===');
for (const r of rows(byPath)) console.log(`${r.met[0]}\t${r.met[1]}\t${r.dim[0]}`);

// 3. Tutti gli eventi tracciati + conteggio (per vedere se esistono checkout/purchase/qr)
const events = await runReport({
  dateRanges,
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
  orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  limit: 50,
});
console.log('\n=== EVENTI 90gg (eventCount, users) ===');
for (const r of rows(events)) console.log(`${r.met[0]}\t${r.met[1]}\t${r.dim[0]}`);
