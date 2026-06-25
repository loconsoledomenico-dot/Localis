import { runReport } from './ga4-shared.mjs';

const dateRanges = [{ startDate: '7daysAgo', endDate: 'today' }];

function rows(data) {
  return (data.rows || []).map((r) => ({
    dim: r.dimensionValues?.map((d) => d.value),
    met: r.metricValues?.map((m) => Number(m.value || 0)),
  }));
}

// Trend per giorno
const byDay = await runReport({
  dateRanges,
  dimensions: [{ name: 'date' }],
  metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
  orderBys: [{ dimension: { dimensionName: 'date' } }],
});
console.log('=== PER GIORNO (data | sessioni | utenti | views) ===');
for (const r of rows(byDay)) console.log(`${r.dim[0]}\t${r.met[0]}\t${r.met[1]}\t${r.met[2]}`);

// Totali
const totals = await runReport({
  dateRanges,
  metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
});
console.log('\n=== TOTALI 7gg ===');
console.log(JSON.stringify(rows(totals), null, 2));

// Top path
const byPath = await runReport({
  dateRanges,
  dimensions: [{ name: 'pagePath' }],
  metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
  orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  limit: 20,
});
console.log('\n=== TOP 20 PATH (views, users) ===');
for (const r of rows(byPath)) console.log(`${r.met[0]}\t${r.met[1]}\t${r.dim[0]}`);

// Eventi
const events = await runReport({
  dateRanges,
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
  orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  limit: 30,
});
console.log('\n=== EVENTI 7gg (eventCount, users) ===');
for (const r of rows(events)) console.log(`${r.met[0]}\t${r.met[1]}\t${r.dim[0]}`);
