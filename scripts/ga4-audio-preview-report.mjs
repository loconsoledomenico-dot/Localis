import fs from 'node:fs/promises';
import { google } from 'googleapis';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const credentialsPath = new URL('../private/ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('../private/google-oauth-token.json', import.meta.url);
const startDate = process.env.GA4_START_DATE || '30daysAgo';
const endDate = process.env.GA4_END_DATE || 'today';
const partnerId = process.env.PARTNER_ID || '';

async function getAuth() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  const oauth2Client = new google.auth.OAuth2(client.client_id, client.client_secret, 'http://127.0.0.1:3000/oauth2callback');
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

const expressions = [
  {
    filter: {
      fieldName: 'eventName',
      inListFilter: { values: ['audio_preview_session', 'preview_complete', 'preview_start'] },
    },
  },
];

if (partnerId) {
  expressions.push({
    filter: {
      fieldName: 'customEvent:partner_id',
      stringFilter: { matchType: 'EXACT', value: partnerId },
    },
  });
}

try {
  const data = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'eventName' },
      { name: 'customEvent:partner_id' },
      { name: 'customEvent:guide_slug' },
      { name: 'customEvent:audio_asset_id' },
      { name: 'customEvent:audio_context' },
      { name: 'customEvent:listen_bucket' },
      { name: 'pagePath' },
    ],
    metrics: [
      { name: 'eventCount' },
      { name: 'customEvent:listen_seconds' },
      { name: 'customEvent:max_position_seconds' },
      { name: 'customEvent:audio_duration_seconds' },
      { name: 'customEvent:listen_percent' },
    ],
    dimensionFilter: expressions.length === 1 ? expressions[0] : { andGroup: { expressions } },
    orderBys: [
      { dimension: { dimensionName: 'date' } },
      { metric: { metricName: 'customEvent:listen_seconds' }, desc: true },
    ],
    limit: 1000,
  });

  const rows = (data.rows || []).map((row) => ({
    date: row.dimensionValues?.[0]?.value || '',
    eventName: row.dimensionValues?.[1]?.value || '',
    partnerId: row.dimensionValues?.[2]?.value || '',
    guideSlug: row.dimensionValues?.[3]?.value || '',
    audioAssetId: row.dimensionValues?.[4]?.value || '',
    audioContext: row.dimensionValues?.[5]?.value || '',
    listenBucket: row.dimensionValues?.[6]?.value || '',
    pagePath: row.dimensionValues?.[7]?.value || '',
    eventCount: Number(row.metricValues?.[0]?.value || 0),
    listenSeconds: Number(row.metricValues?.[1]?.value || 0),
    maxPositionSeconds: Number(row.metricValues?.[2]?.value || 0),
    audioDurationSeconds: Number(row.metricValues?.[3]?.value || 0),
    listenPercent: Number(row.metricValues?.[4]?.value || 0),
  }));

  console.log(JSON.stringify({
    propertyId,
    startDate,
    endDate,
    partnerId: partnerId || null,
    rowCount: rows.length,
    rows,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    message: error.message,
    details: error.response?.data || null,
    hint: 'Se mancano custom definitions in GA4, registra prima guide_slug, audio_asset_id, audio_context, listen_bucket e le metriche listen_seconds, max_position_seconds, audio_duration_seconds, listen_percent.',
  }, null, 2));
  process.exit(1);
}
