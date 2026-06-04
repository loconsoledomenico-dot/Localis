import { runReport } from './ga4-shared.mjs';

const partner = process.env.PARTNER_ID || 'giardino-lido-sole';
const dateRanges = [{ startDate: process.env.GA4_START_DATE || '60daysAgo', endDate: process.env.GA4_END_DATE || 'today' }];

const queries = [
  {
    name: `events for partner_id=${partner}`,
    body: {
      dateRanges,
      dimensions: [
        { name: 'customEvent:partner_id' },
        { name: 'eventName' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'customEvent:partner_id',
          stringFilter: { matchType: 'EXACT', value: partner },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 100,
    },
  },
  {
    name: `pages containing ${partner}`,
    body: {
      dateRanges,
      dimensions: [
        { name: 'pagePath' },
        { name: 'eventName' },
        { name: 'customEvent:partner_id' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'CONTAINS', value: partner },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 100,
    },
  },
  {
    name: 'all partner event rows',
    body: {
      dateRanges,
      dimensions: [
        { name: 'customEvent:partner_id' },
        { name: 'eventName' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: 'customEvent:partner_id',
            inListFilter: { values: ['(not set)', '', '(direct)'] },
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'customEvent:partner_id' } }],
      limit: 200,
    },
  },
];

for (const query of queries) {
  try {
    const data = await runReport(query.body);
    const rows = (data.rows || []).map((row) => ({
      dimensions: row.dimensionValues?.map((d) => d.value),
      eventCount: Number(row.metricValues?.[0]?.value || 0),
      activeUsers: Number(row.metricValues?.[1]?.value || 0),
    }));
    console.log(JSON.stringify({ query: query.name, rowCount: rows.length, rows }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({ query: query.name, error: error.message, details: error.response?.data || null }, null, 2));
  }
}
