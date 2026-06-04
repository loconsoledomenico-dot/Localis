import fs from 'node:fs/promises';
import { google } from 'googleapis';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const credentialsPath = new URL('./ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('./ga4-oauth-token.json', import.meta.url);

async function getAuth() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  const redirectUri = client.redirect_uris?.find((uri) => uri.includes('localhost')) || client.redirect_uris?.[0];
  const oauth2Client = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
  oauth2Client.setCredentials(JSON.parse(await fs.readFile(tokenPath, 'utf8')));
  return oauth2Client;
}

async function runReport(requestBody) {
  const auth = await getAuth();
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody,
  });
  return response.data;
}

const dateRanges = [{ startDate: process.env.GA4_START_DATE || '28daysAgo', endDate: process.env.GA4_END_DATE || 'today' }];

const reports = [
  {
    name: 'event-scoped partner_id',
    body: {
      dateRanges,
      dimensions: [
        { name: 'customEvent:partner_id' },
        { name: 'eventName' },
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'activeUsers' },
      ],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 100,
    },
  },
  {
    name: 'user-scoped partner_id',
    body: {
      dateRanges,
      dimensions: [
        { name: 'customUser:partner_id' },
        { name: 'eventName' },
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'activeUsers' },
      ],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 100,
    },
  },
  {
    name: 'source fallback by page referrer source',
    body: {
      dateRanges,
      dimensions: [
        { name: 'firstUserSourceMedium' },
        { name: 'eventName' },
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'activeUsers' },
      ],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 100,
    },
  },
];

for (const report of reports) {
  try {
    const data = await runReport(report.body);
    const rows = (data.rows || []).map((row) => ({
      dimensions: row.dimensionValues?.map((d) => d.value),
      metrics: row.metricValues?.map((m) => Number(m.value || 0)),
    }));
    console.log(JSON.stringify({ report: report.name, rowCount: rows.length, rows }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      report: report.name,
      error: error.message,
      details: error.response?.data || null,
    }, null, 2));
  }
}
