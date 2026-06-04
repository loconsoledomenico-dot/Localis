import fs from 'node:fs/promises';
import { google } from 'googleapis';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const credentialsPath = new URL('./ga4-oauth-client.json', import.meta.url);
const tokenPath = new URL('./google-oauth-token.json', import.meta.url);
const statePath = new URL('./partner-qr-sheet-state.json', import.meta.url);
const partnerDir = new URL('../src/content/partners/', import.meta.url);
const spreadsheetTitle = process.env.PARTNER_QR_SHEET_TITLE || 'Localis - Partner QR Daily Report';

const dailySheet = 'Daily';
const generalSheet = 'Generale';
const productsSheet = 'Prodotti';
const totalsSheet = 'Totals';
const startDate = process.env.GA4_START_DATE || '30daysAgo';
const endDate = process.env.GA4_END_DATE || 'yesterday';

const eventColumns = [
  ['qr_landing_viewed', 'Aperture da QR'],
  ['preview_start', 'Anteprime avviate'],
  ['preview_10s', 'Anteprime oltre 10s'],
  ['preview_complete', 'Anteprime completate'],
  ['audio_preview_played', 'Ascolti anteprima'],
  ['preview_played', 'Altre anteprime'],
  ['begin_checkout', 'Checkout iniziati'],
  ['checkout_started', 'Checkout legacy'],
  ['purchase', 'Acquisti'],
  ['purchase_completed', 'Acquisti legacy'],
];

async function getAuth() {
  const raw = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
  const client = raw.installed || raw.web;
  const redirectUri = 'http://127.0.0.1:3000/oauth2callback';
  const oauth2Client = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
  const token = JSON.parse(await fs.readFile(tokenPath, 'utf8'));
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function loadPartners() {
  const files = await fs.readdir(partnerDir);
  const partners = new Map();
  for (const file of files.filter((f) => f.endsWith('.mdx'))) {
    const full = new URL(file, partnerDir);
    const text = await fs.readFile(full, 'utf8');
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) continue;
    const data = Object.fromEntries(
      frontmatter[1].split('\n').map((line) => {
        const idx = line.indexOf(':');
        if (idx === -1) return null;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
        return [key, value];
      }).filter(Boolean)
    );
    if (data.slug && data.status === 'active') {
      partners.set(data.slug, {
        slug: data.slug,
        name: data.display_name || data.slug,
        type: data.type || '',
        city: data.city || '',
      });
    }
  }
  return partners;
}

async function runReport(auth, requestBody) {
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody,
  });
  return response.data.rows || [];
}

function parseMetric(row, index) {
  return Number(row.metricValues?.[index]?.value || 0);
}

function dateKey(gaDate) {
  return `${gaDate.slice(0, 4)}-${gaDate.slice(4, 6)}-${gaDate.slice(6, 8)}`;
}

function key(date, partner) {
  return `${date}::${partner}`;
}

async function collectRows(auth, partners) {
  const aggregateRows = await runReport(auth, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }, { name: 'customEvent:partner_id' }],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'eventCount' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }, { dimension: { dimensionName: 'customEvent:partner_id' } }],
    limit: 10000,
  });

  const eventRows = await runReport(auth, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }, { name: 'customEvent:partner_id' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }, { dimension: { dimensionName: 'customEvent:partner_id' } }],
    limit: 10000,
  });

  const rowsByKey = new Map();

  for (const row of aggregateRows) {
    const date = dateKey(row.dimensionValues?.[0]?.value || '');
    const partnerId = row.dimensionValues?.[1]?.value || '';
    if (!partners.has(partnerId)) continue;
    const partner = partners.get(partnerId);
    rowsByKey.set(key(date, partnerId), {
      date,
      partnerId,
      partnerName: partner.name,
      city: partner.city,
      type: partner.type,
      activeUsers: parseMetric(row, 0),
      sessions: parseMetric(row, 1),
      pageViews: parseMetric(row, 2),
      totalEvents: parseMetric(row, 3),
      events: Object.fromEntries(eventColumns.map(([eventName]) => [eventName, 0])),
    });
  }

  for (const row of eventRows) {
    const date = dateKey(row.dimensionValues?.[0]?.value || '');
    const partnerId = row.dimensionValues?.[1]?.value || '';
    const eventName = row.dimensionValues?.[2]?.value || '';
    if (!partners.has(partnerId)) continue;
    const recordKey = key(date, partnerId);
    if (!rowsByKey.has(recordKey)) {
      const partner = partners.get(partnerId);
      rowsByKey.set(recordKey, {
        date,
        partnerId,
        partnerName: partner.name,
        city: partner.city,
        type: partner.type,
        activeUsers: 0,
        sessions: 0,
        pageViews: 0,
        totalEvents: 0,
        events: Object.fromEntries(eventColumns.map(([name]) => [name, 0])),
      });
    }
    const record = rowsByKey.get(recordKey);
    if (eventName in record.events) {
      record.events[eventName] += parseMetric(row, 0);
    }
  }

  return [...rowsByKey.values()].sort((a, b) => a.date.localeCompare(b.date) || a.partnerId.localeCompare(b.partnerId));
}

async function collectProductRows(auth, partners) {
  try {
    const rows = await runReport(auth, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'date' },
        { name: 'customEvent:partner_id' },
        { name: 'eventName' },
        { name: 'customEvent:product' },
        { name: 'customEvent:qr_path' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: ['begin_checkout', 'purchase', 'checkout_started', 'purchase_completed'] },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' } }, { metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10000,
    });

    return [[
      'Data',
      'Codice partner',
      'Partner',
      'Evento',
      'Prodotto scelto',
      'Origine QR precisa',
      'Quante volte',
      'Nota valore acquisto',
    ], ...rows
      .filter((row) => partners.has(row.dimensionValues?.[1]?.value || ''))
      .map((row) => {
        const partnerId = row.dimensionValues?.[1]?.value || '';
        const eventName = row.dimensionValues?.[2]?.value || '';
        return [
          dateKey(row.dimensionValues?.[0]?.value || ''),
          partnerId,
          partners.get(partnerId)?.name || partnerId,
          eventName === 'begin_checkout' || eventName === 'checkout_started' ? 'Checkout iniziato' : 'Acquisto',
          row.dimensionValues?.[3]?.value || '',
          row.dimensionValues?.[4]?.value || '',
          parseMetric(row, 0),
          'Il valore economico richiede la metrica GA4 custom value o export PostHog/Stripe.',
        ];
      })];
  } catch {
    return [[
      'Nota',
    ], [
      'Per mostrare prodotto scelto, valore acquisto e origine QR precisa in GA4 bisogna registrare come custom definition i parametri event-scoped: product, qr_path, qr_source, qr_url e la metrica value. Gli eventi vengono gia inviati; PostHog li vede subito.',
    ]];
  }
}

function buildDailyValues(records) {
  const headers = [
    'Data',
    'Codice partner',
    'Partner',
    'Citta',
    'Tipo',
    'Persone del giorno',
    'Visite del giorno',
    'Pagine viste del giorno',
    ...eventColumns.map(([, label]) => label),
    'Azioni totali del giorno',
    'Persone vs giorno prima',
    'Visite vs giorno prima',
    'Azioni vs giorno prima',
  ];

  const previousByPartner = new Map();
  const values = [headers];
  for (const record of records) {
    const previous = previousByPartner.get(record.partnerId);
    const row = [
      record.date,
      record.partnerId,
      record.partnerName,
      record.city,
      record.type,
      record.activeUsers,
      record.sessions,
      record.pageViews,
      ...eventColumns.map(([eventName]) => record.events[eventName] || 0),
      record.totalEvents,
      previous ? record.activeUsers - previous.activeUsers : '',
      previous ? record.sessions - previous.sessions : '',
      previous ? record.totalEvents - previous.totalEvents : '',
    ];
    values.push(row);
    previousByPartner.set(record.partnerId, record);
  }
  return values;
}

function buildGeneralValues(records) {
  const totalsByDate = new Map();
  for (const record of records) {
    if (!totalsByDate.has(record.date)) {
      totalsByDate.set(record.date, {
        date: record.date,
        partnersWithData: new Set(),
        activeUsers: 0,
        sessions: 0,
        pageViews: 0,
        totalEvents: 0,
        events: Object.fromEntries(eventColumns.map(([eventName]) => [eventName, 0])),
      });
    }
    const total = totalsByDate.get(record.date);
    total.partnersWithData.add(record.partnerId);
    total.activeUsers += record.activeUsers;
    total.sessions += record.sessions;
    total.pageViews += record.pageViews;
    total.totalEvents += record.totalEvents;
    for (const [eventName] of eventColumns) {
      total.events[eventName] += record.events[eventName] || 0;
    }
  }

  const headers = [
    'Data',
    'Partner con dati',
    'Persone del giorno',
    'Visite del giorno',
    'Pagine viste del giorno',
    ...eventColumns.map(([, label]) => label),
    'Azioni totali del giorno',
    'Persone vs giorno prima',
    'Visite vs giorno prima',
    'Azioni vs giorno prima',
  ];

  const values = [headers];
  let previous = null;
  for (const total of [...totalsByDate.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    values.push([
      total.date,
      total.partnersWithData.size,
      total.activeUsers,
      total.sessions,
      total.pageViews,
      ...eventColumns.map(([eventName]) => total.events[eventName] || 0),
      total.totalEvents,
      previous ? total.activeUsers - previous.activeUsers : '',
      previous ? total.sessions - previous.sessions : '',
      previous ? total.totalEvents - previous.totalEvents : '',
    ]);
    previous = total;
  }
  return values;
}

function buildTotalsValues(records, partners) {
  const totals = new Map();
  for (const partner of partners.values()) {
    totals.set(partner.slug, {
      partnerId: partner.slug,
      partnerName: partner.name,
      city: partner.city,
      type: partner.type,
      days: 0,
      activeUsers: 0,
      sessions: 0,
      pageViews: 0,
      totalEvents: 0,
      events: Object.fromEntries(eventColumns.map(([eventName]) => [eventName, 0])),
      lastDate: '',
    });
  }
  for (const record of records) {
    const total = totals.get(record.partnerId);
    if (!total) continue;
    total.days += 1;
    total.activeUsers += record.activeUsers;
    total.sessions += record.sessions;
    total.pageViews += record.pageViews;
    total.totalEvents += record.totalEvents;
    total.lastDate = record.date > total.lastDate ? record.date : total.lastDate;
    for (const [eventName] of eventColumns) {
      total.events[eventName] += record.events[eventName] || 0;
    }
  }

  return [[
    'Codice partner',
    'Partner',
    'Citta',
    'Tipo',
    'Giorni con dati',
    'Persone totali',
    'Visite totali',
    'Pagine viste totali',
    ...eventColumns.map(([, label]) => `${label} totali`),
    'Azioni totali',
    'Ultima data con dati',
  ], ...[...totals.values()]
    .sort((a, b) => b.totalEvents - a.totalEvents || a.partnerId.localeCompare(b.partnerId))
    .map((total) => [
      total.partnerId,
      total.partnerName,
      total.city,
      total.type,
      total.days,
      total.activeUsers,
      total.sessions,
      total.pageViews,
      ...eventColumns.map(([eventName]) => total.events[eventName] || 0),
      total.totalEvents,
      total.lastDate,
    ])];
}

async function loadSpreadsheetId(sheets) {
  if (process.env.PARTNER_QR_SPREADSHEET_ID) return process.env.PARTNER_QR_SPREADSHEET_ID;
  try {
    const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
    if (state.spreadsheetId) return state.spreadsheetId;
  } catch {}

  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: spreadsheetTitle },
      sheets: [
        { properties: { title: dailySheet } },
        { properties: { title: generalSheet } },
        { properties: { title: productsSheet } },
        { properties: { title: totalsSheet } },
      ],
    },
  });
  const spreadsheetId = response.data.spreadsheetId;
  await fs.writeFile(statePath, JSON.stringify({
    spreadsheetId,
    spreadsheetUrl: response.data.spreadsheetUrl,
    createdAt: new Date().toISOString(),
  }, null, 2));
  return spreadsheetId;
}

async function ensureSheets(sheets, spreadsheetId) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Map(spreadsheet.data.sheets.map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
  const requests = [];
  for (const title of [dailySheet, generalSheet, productsSheet, totalsSheet]) {
    if (!existing.has(title)) requests.push({ addSheet: { properties: { title } } });
  }
  if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  const updated = await sheets.spreadsheets.get({ spreadsheetId });
  return new Map(updated.data.sheets.map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
}

async function writeSheet(sheets, spreadsheetId, sheetName, values) {
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

async function formatSheets(sheets, spreadsheetId, sheetIds, dailyColumnCount, generalColumnCount, productsColumnCount, totalsColumnCount) {
  const dailyId = sheetIds.get(dailySheet);
  const generalId = sheetIds.get(generalSheet);
  const productsId = sheetIds.get(productsSheet);
  const totalsId = sheetIds.get(totalsSheet);
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const requests = [
    { repeatCell: { range: { sheetId: dailyId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: generalId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: productsId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: totalsId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { updateSheetProperties: { properties: { sheetId: dailyId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: generalId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: productsId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: totalsId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { autoResizeDimensions: { dimensions: { sheetId: dailyId, dimension: 'COLUMNS', startIndex: 0, endIndex: dailyColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: generalId, dimension: 'COLUMNS', startIndex: 0, endIndex: generalColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: productsId, dimension: 'COLUMNS', startIndex: 0, endIndex: productsColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: totalsId, dimension: 'COLUMNS', startIndex: 0, endIndex: totalsColumnCount } } },
  ];

  for (const sheet of spreadsheet.data.sheets || []) {
    if (![dailyId, generalId].includes(sheet.properties?.sheetId)) continue;
    const ruleCount = sheet.conditionalFormats?.length || 0;
    for (let index = ruleCount - 1; index >= 0; index -= 1) {
      requests.push({ deleteConditionalFormatRule: { sheetId: sheet.properties.sheetId, index } });
    }
  }

  const deltaColumnsBySheet = [
    { sheetId: dailyId, columns: [dailyColumnCount - 3, dailyColumnCount - 2, dailyColumnCount - 1] },
    { sheetId: generalId, columns: [generalColumnCount - 3, generalColumnCount - 2, generalColumnCount - 1] },
  ];

  for (const { sheetId, columns } of deltaColumnsBySheet) {
    for (const column of columns) {
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, startColumnIndex: column, endColumnIndex: column + 1 }],
          booleanRule: {
            condition: { type: 'NUMBER_GREATER', values: [{ userEnteredValue: '0' }] },
            format: { backgroundColor: { red: 0.82, green: 0.94, blue: 0.83 } },
          },
        },
        index: 0,
      },
    });
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, startColumnIndex: column, endColumnIndex: column + 1 }],
          booleanRule: {
            condition: { type: 'NUMBER_LESS', values: [{ userEnteredValue: '0' }] },
            format: { backgroundColor: { red: 0.98, green: 0.82, blue: 0.82 } },
          },
        },
        index: 0,
      },
    });
  }
  }

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const partners = await loadPartners();
  const records = await collectRows(auth, partners);
  const dailyValues = buildDailyValues(records);
  const generalValues = buildGeneralValues(records);
  const productValues = await collectProductRows(auth, partners);
  const totalsValues = buildTotalsValues(records, partners);
  const spreadsheetId = await loadSpreadsheetId(sheets);
  const sheetIds = await ensureSheets(sheets, spreadsheetId);

  await writeSheet(sheets, spreadsheetId, dailySheet, dailyValues);
  await writeSheet(sheets, spreadsheetId, generalSheet, generalValues);
  await writeSheet(sheets, spreadsheetId, productsSheet, productValues);
  await writeSheet(sheets, spreadsheetId, totalsSheet, totalsValues);
  await formatSheets(sheets, spreadsheetId, sheetIds, dailyValues[0].length, generalValues[0].length, productValues[0].length, totalsValues[0].length);

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  await fs.writeFile(statePath, JSON.stringify({
    spreadsheetId,
    spreadsheetUrl: url,
    updatedAt: new Date().toISOString(),
    dateRange: { startDate, endDate },
    records: records.length,
  }, null, 2));
  console.log(JSON.stringify({ spreadsheetId, spreadsheetUrl: url, records: records.length }, null, 2));
}

main().catch((error) => {
  if (error.code === 'ENOENT' && String(error.path || '').includes('google-oauth-token.json')) {
    console.error('Missing Google OAuth token. Run: node private/google-oauth.mjs');
  } else {
    console.error(error.response?.data || error);
  }
  process.exit(1);
});
