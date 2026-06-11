import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth.mjs';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const startDate = process.env.GA4_START_DATE || '30daysAgo';
const endDate = process.env.GA4_END_DATE || 'today';
const partnerId = process.env.PARTNER_ID || '';

async function getAuth() {
  const { auth } = await getGoogleAuth({
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return auth;
}

async function getAnalyticsData() {
  const auth = await getAuth();
  return google.analyticsdata({ version: 'v1beta', auth });
}

async function getMetadata() {
  const analyticsData = await getAnalyticsData();
  const response = await analyticsData.properties.getMetadata({
    name: `properties/${propertyId}/metadata`,
  });
  return response.data;
}

function pickMetric(metadata, preferredNames) {
  const available = new Set((metadata.metrics || []).map((metric) => metric.apiName));
  return preferredNames.find((name) => available.has(name)) || null;
}

async function runReport(requestBody) {
  const analyticsData = await getAnalyticsData();
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
      inListFilter: {
        values: ['audio_preview_session', 'preview_complete', 'preview_start', 'audio_preview_played', 'preview_10s'],
      },
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
  const metadata = await getMetadata();
  const listenSecondsMetric = pickMetric(metadata, ['customEvent:listen_seconds']);
  const maxPositionMetric = pickMetric(metadata, ['customEvent:max_position_seconds']);
  const audioDurationMetric = pickMetric(metadata, [
    'customEvent:audio_duration_seconds',
    'customEvent:udio_duration_seconds',
  ]);
  const listenPercentMetric = pickMetric(metadata, ['customEvent:listen_percent']);

  const metricNames = [
    { name: 'eventCount', label: 'eventCount' },
    listenSecondsMetric ? { name: listenSecondsMetric, label: 'listenSeconds' } : null,
    maxPositionMetric ? { name: maxPositionMetric, label: 'maxPositionSeconds' } : null,
    audioDurationMetric ? { name: audioDurationMetric, label: 'audioDurationSeconds' } : null,
    listenPercentMetric ? { name: listenPercentMetric, label: 'listenPercent' } : null,
  ].filter(Boolean);

  const metricIndex = new Map(metricNames.map((metric, index) => [metric.label, index]));

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
    metrics: metricNames.map(({ name }) => ({ name })),
    dimensionFilter: expressions.length === 1 ? expressions[0] : { andGroup: { expressions } },
    orderBys: [
      { dimension: { dimensionName: 'date' } },
      { metric: { metricName: 'eventCount' }, desc: true },
    ],
    limit: 1000,
  });

  const rows = (data.rows || []).map((row) => {
    const metricValue = (label) => Number(row.metricValues?.[metricIndex.get(label)]?.value || 0);
    return {
      date: row.dimensionValues?.[0]?.value || '',
      eventName: row.dimensionValues?.[1]?.value || '',
      partnerId: row.dimensionValues?.[2]?.value || '',
      guideSlug: row.dimensionValues?.[3]?.value || '',
      audioAssetId: row.dimensionValues?.[4]?.value || '',
      audioContext: row.dimensionValues?.[5]?.value || '',
      listenBucket: row.dimensionValues?.[6]?.value || '',
      pagePath: row.dimensionValues?.[7]?.value || '',
      eventCount: metricValue('eventCount'),
      listenSeconds: metricValue('listenSeconds'),
      maxPositionSeconds: metricValue('maxPositionSeconds'),
      audioDurationSeconds: metricValue('audioDurationSeconds'),
      listenPercent: metricValue('listenPercent'),
    };
  });

  const warnings = [];
  if (audioDurationMetric === 'customEvent:udio_duration_seconds') {
    warnings.push(
      'GA4 metadata exposes audio duration as customEvent:udio_duration_seconds. ' +
      'The custom metric appears registered with a missing leading "a". ' +
      'Frontend now sends both audio_duration_seconds and udio_duration_seconds for compatibility.',
    );
  }

  console.log(JSON.stringify({
    propertyId,
    startDate,
    endDate,
    partnerId: partnerId || null,
    metricNames: Object.fromEntries(metricNames.map((metric) => [metric.label, metric.name])),
    warnings,
    rowCount: rows.length,
    rows,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    message: error.message,
    details: error.response?.data || null,
    hint: 'Verifica le custom definitions GA4 e i file private/ga4-oauth-client.json e private/google-oauth-token.json.',
  }, null, 2));
  process.exit(1);
}
