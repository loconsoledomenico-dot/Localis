// Funnel per partner da GA4: scansione (page_view) → ascolto (preview) →
// checkout → acquisto. Uso: node scripts/ga4-partner-funnel.mjs [giorni]
import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth.mjs';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const days = Number(process.argv[2] || 90);

const { auth } = await getGoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

const res = await analyticsData.properties.runReport({
  property: `properties/${propertyId}`,
  requestBody: {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'customEvent:partner_id' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    limit: 10000,
  },
});

const byPartner = {};
for (const row of res.data.rows ?? []) {
  const [partner, event] = row.dimensionValues.map((d) => d.value);
  const [count, users] = row.metricValues.map((m) => Number(m.value));
  byPartner[partner] ??= {};
  byPartner[partner][event] = { count, users };
}

console.log(JSON.stringify(byPartner, null, 1));
