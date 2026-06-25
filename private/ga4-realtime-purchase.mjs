import { getAuth } from './ga4-shared.mjs';
import { google } from 'googleapis';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const auth = await getAuth();
const data = google.analyticsdata({ version: 'v1beta', auth });

const res = await data.properties.runRealtimeReport({
  property: `properties/${propertyId}`,
  requestBody: {
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 50,
  },
});

console.log('=== GA4 Tempo reale (ultimi ~30 min) — eventi ===');
const rows = res.data.rows || [];
if (!rows.length) console.log('(nessun evento)');
for (const r of rows) {
  console.log(`${r.metricValues[0].value}\t${r.dimensionValues[0].value}`);
}
