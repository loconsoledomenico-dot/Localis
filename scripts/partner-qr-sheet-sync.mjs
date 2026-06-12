import fs from 'node:fs/promises';
import { google } from 'googleapis';
import { buildGoogleAccessHelp, getGoogleAuth } from './google-auth.mjs';

const propertyId = process.env.GA4_PROPERTY_ID || '538539129';
const statePath = new URL('../private/partner-qr-sheet-state.json', import.meta.url);
const partnerDir = new URL('../src/content/partners/', import.meta.url);
const spreadsheetTitle = process.env.PARTNER_QR_SHEET_TITLE || 'Localis - Partner QR Daily Report';

const dailySheet = 'Daily';
const generalSheet = 'Generale';
const productsSheet = 'Prodotti';
const totalsSheet = 'Totals';
const todaySummarySheet = 'Oggi - chiaro';
const landingOnlySheet = 'Landing - campagne';
const stripeSheet = 'Stripe - Provvigioni';
const legendSheet = 'Legenda';
const startDate = process.env.GA4_START_DATE || '30daysAgo';
const endDate = process.env.GA4_END_DATE || 'today';

// Tassonomia eventi dal 2026-06-12 (qr_scan e checkout_error esistono da
// quella data; i nomi legacy duplicati sono usciti dal report — v. Legenda).
const eventColumns = [
  ['qr_scan', 'Scansioni QR'],
  ['preview_start', 'Anteprime avviate'],
  ['preview_10s', 'Anteprime oltre 10s'],
  ['preview_complete', 'Anteprime completate'],
  ['audio_preview_played', 'Ascolti anteprima'],
  ['begin_checkout', 'Checkout iniziati'],
  ['checkout_error', 'Errori checkout'],
  ['purchase', 'Acquisti (GA4)'],
];

let authContext = null;

async function readKnownSpreadsheetId() {
  try {
    const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
    return state.spreadsheetId || '';
  } catch {
    return '';
  }
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
        reportingMode: data.reporting_mode || 'physical_qr',
      });
    }
  }
  return partners;
}

function partitionPartners(partners) {
  const qrPartners = new Map();
  const landingOnlyPartners = new Map();
  for (const [slug, partner] of partners.entries()) {
    if (partner.reportingMode === 'landing_only') landingOnlyPartners.set(slug, partner);
    else qrPartners.set(slug, partner);
  }
  return { qrPartners, landingOnlyPartners };
}

function partitionRecords(records, partners) {
  const qrRecords = [];
  const landingOnlyRecords = [];
  for (const record of records) {
    const reportingMode = partners.get(record.partnerId)?.reportingMode || 'physical_qr';
    if (reportingMode === 'landing_only') landingOnlyRecords.push(record);
    else qrRecords.push(record);
  }
  return { qrRecords, landingOnlyRecords };
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
    'Sessioni attribuite del giorno',
    'Pagine viste del giorno',
    ...eventColumns.map(([, label]) => label),
    'Azioni totali del giorno',
    'Persone vs giorno prima',
    'Sessioni vs giorno prima',
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
    'Sessioni attribuite del giorno',
    'Pagine viste del giorno',
    ...eventColumns.map(([, label]) => label),
    'Azioni totali del giorno',
    'Persone vs giorno prima',
    'Sessioni vs giorno prima',
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
    'Sessioni attribuite totali',
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

function buildTodaySummaryValues(records) {
  if (!records.length) {
    return [[
      'Oggi e successo questo',
    ], [
      'Nessun dato disponibile nel range selezionato.',
    ]];
  }

  const latestDate = records.reduce((max, record) => (record.date > max ? record.date : max), records[0].date);
  const activeRecords = records
    .filter((record) => record.date === latestDate)
    .filter((record) => {
      const eventTotal = eventColumns.reduce((sum, [eventName]) => sum + (record.events[eventName] || 0), 0);
      return record.activeUsers > 0 || record.sessions > 0 || record.pageViews > 0 || eventTotal > 0 || record.totalEvents > 0;
    })
    .sort((a, b) => b.totalEvents - a.totalEvents || b.sessions - a.sessions || a.partnerId.localeCompare(b.partnerId));

  const values = [[
    `Oggi e successo questo (${latestDate})`,
  ]];

  if (!activeRecords.length) {
    values.push([
      'Nessun partner ha avuto attivita nellultima giornata disponibile.',
    ]);
    return values;
  }

  values.push([
    'Data',
    'Codice partner',
    'Partner',
    'Citta',
    'Tipo',
    'Persone',
    'Sessioni attribuite',
    'Pagine viste',
    'Azioni totali',
    'Eventi di oggi',
  ]);

  for (const record of activeRecords) {
    const eventSummary = eventColumns
      .map(([eventName, label]) => [label, record.events[eventName] || 0])
      .filter(([, count]) => count > 0)
      .map(([label, count]) => `${label}: ${count}`)
      .join(', ');

    values.push([
      record.date,
      record.partnerId,
      record.partnerName,
      record.city,
      record.type,
      record.activeUsers,
      record.sessions,
      record.pageViews,
      record.totalEvents,
      eventSummary || 'Nessun evento tracciato, ma il partner risulta attivo.',
    ]);
  }

  return values;
}

function buildLandingOnlyValues(records) {
  const values = [[
    'Data',
    'Codice attributo',
    'Partner/Campagna',
    'Citta',
    'Tipo',
    'Persone del giorno',
    'Sessioni attribuite del giorno',
    'Pagine viste del giorno',
    ...eventColumns.map(([, label]) => label),
    'Azioni totali del giorno',
  ]];

  for (const record of records) {
    values.push([
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
    ]);
  }

  if (records.length === 0) {
    values.push([
      'Nessun record landing/campagna nel range selezionato.',
    ]);
  }

  return values;
}

function eur(cents) {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

async function loadStripeKey() {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  try {
    const envText = await fs.readFile(new URL('../.env', import.meta.url), 'utf8');
    const m = envText.match(/^STRIPE_SECRET_KEY\s*=\s*"?([^"\r\n]+)"?/m);
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

/**
 * Verità di terra: vendite pagate da Stripe, attribuite via metadata.partner_id,
 * con provvigione calcolata dal commission_rate fotografato al checkout.
 * Questo tab è il registro da mostrare ai partner.
 */
async function buildStripeValues(partners) {
  const stripeKey = await loadStripeKey();
  if (!stripeKey) {
    return [['Nota'], ['STRIPE_SECRET_KEY non disponibile in questo ambiente: sezione provvigioni saltata.']];
  }

  const sessions = [];
  let startingAfter = '';
  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({ limit: '100' });
    if (startingAfter) params.set('starting_after', startingAfter);
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const json = await res.json();
    if (json.error) return [['Errore Stripe'], [json.error.message]];
    sessions.push(...(json.data ?? []));
    if (!json.has_more || !json.data?.length) break;
    startingAfter = json.data[json.data.length - 1].id;
  }

  const paid = sessions.filter((s) => s.payment_status === 'paid');
  const byPartner = new Map();
  const detail = [];
  let unattributed = 0;
  let unattributedGross = 0;

  for (const s of paid) {
    const pid = s.metadata?.partner_id || '';
    const gross = s.amount_total || 0;
    const date = new Date(s.created * 1000).toISOString().slice(0, 10);
    if (!pid) {
      unattributed += 1;
      unattributedGross += gross;
      continue;
    }
    const rate = Number(s.metadata?.partner_commission_rate) || 0.25;
    const commission = Math.floor(gross * rate);
    const agg = byPartner.get(pid) ?? { count: 0, gross: 0, commission: 0, last: '' };
    agg.count += 1;
    agg.gross += gross;
    agg.commission += commission;
    agg.last = date > agg.last ? date : agg.last;
    byPartner.set(pid, agg);
    detail.push([
      date,
      pid,
      partners.get(pid)?.name || pid,
      s.metadata?.product || '',
      s.metadata?.guide_slugs || '',
      eur(gross),
      `${Math.round(rate * 100)}%`,
      eur(commission),
    ]);
  }

  const values = [[
    'Partner', 'Vendite pagate', 'Incasso lordo', 'Provvigione maturata', 'Ultima vendita',
  ]];
  for (const [pid, agg] of [...byPartner.entries()].sort((a, b) => b[1].gross - a[1].gross)) {
    values.push([partners.get(pid)?.name || pid, agg.count, eur(agg.gross), eur(agg.commission), agg.last]);
  }
  if (!byPartner.size) {
    values.push(['(nessuna vendita attribuita a partner finora)', 0, eur(0), eur(0), '']);
  }
  values.push([`Vendite dirette (senza partner): ${unattributed}`, '', eur(unattributedGross), '', '']);
  values.push([]);
  values.push(['Data', 'Codice partner', 'Partner', 'Prodotto', 'Guide', 'Importo', '% provv.', 'Provvigione']);
  for (const row of detail.sort((a, b) => b[0].localeCompare(a[0]))) values.push(row);

  return values;
}

function buildLegendValues() {
  return [
    ['Voce', 'Spiegazione'],
    ['Scansioni QR (qr_scan)', 'Prima apertura da QR nella sessione: con ?p= nell\'URL o atterrando sulla landing /p/{slug}. Esiste dal 2026-06-12.'],
    ['Sessioni attribuite', 'Includono anche ritorni e visite successive entro 30 giorni se il partner resta nel cookie.'],
    ['Errori checkout (checkout_error)', 'Apertura pagamento fallita (redirect con errore o fetch fallita). Esiste dal 2026-06-12.'],
    ['Acquisti (GA4)', 'Evento purchase dalla pagina di ringraziamento. Per gli euro fa fede il tab Stripe - Provvigioni.'],
    ['Stripe - Provvigioni', 'Vendite con payment_status=paid da Stripe. La provvigione usa il commission_rate fotografato nei metadata al momento del checkout (default 25%).'],
    ['Landing - campagne', 'Record con reporting_mode: landing_only — attribuzioni di landing/campagna, esclusi dai tab QR-only.'],
    ['⚠ Dati prima del 2026-06-12', 'Scansioni e pagine viste risultano 0 e le vendite partner non sono attribuite: il tracciamento è stato riparato quel giorno. Confronti solo da quella data in poi.'],
    ['Eventi legacy rimossi dal report', 'qr_landing_viewed, preview_played, checkout_started, purchase_completed: duplicati storici, gli eventi continuano a esistere in GA4.'],
  ];
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
        { properties: { title: todaySummarySheet } },
        { properties: { title: landingOnlySheet } },
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
  for (const title of [todaySummarySheet, stripeSheet, dailySheet, generalSheet, totalsSheet, productsSheet, landingOnlySheet, legendSheet]) {
    if (!existing.has(title)) requests.push({ addSheet: { properties: { title } } });
  }
  // Consolidamento 2026-06-12: le copie " - esteso" duplicavano i tab base.
  for (const [title, sheetId] of existing.entries()) {
    if (/ - esteso$/i.test(title)) requests.push({ deleteSheet: { sheetId } });
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

async function formatSheets(sheets, spreadsheetId, sheetIds, dailyColumnCount, generalColumnCount, productsColumnCount, totalsColumnCount, todaySummaryColumnCount, landingOnlyColumnCount) {
  const dailyId = sheetIds.get(dailySheet);
  const generalId = sheetIds.get(generalSheet);
  const productsId = sheetIds.get(productsSheet);
  const totalsId = sheetIds.get(totalsSheet);
  const todaySummaryId = sheetIds.get(todaySummarySheet);
  const landingOnlyId = sheetIds.get(landingOnlySheet);
  const stripeId = sheetIds.get(stripeSheet);
  const legendId = sheetIds.get(legendSheet);
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const requests = [
    { repeatCell: { range: { sheetId: dailyId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: generalId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: productsId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: landingOnlyId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: totalsId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: todaySummaryId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 12 }, backgroundColor: { red: 0.99, green: 0.95, blue: 0.8 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: todaySummaryId, startRowIndex: 1, endRowIndex: 2 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: stripeId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.94, blue: 0.86 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { repeatCell: { range: { sheetId: legendId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.93, blue: 0.96 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    { updateSheetProperties: { properties: { sheetId: dailyId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: generalId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: productsId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: landingOnlyId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: totalsId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: todaySummaryId, gridProperties: { frozenRowCount: 2 } }, fields: 'gridProperties.frozenRowCount' } },
    { updateSheetProperties: { properties: { sheetId: stripeId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    { autoResizeDimensions: { dimensions: { sheetId: stripeId, dimension: 'COLUMNS', startIndex: 0, endIndex: 8 } } },
    { autoResizeDimensions: { dimensions: { sheetId: legendId, dimension: 'COLUMNS', startIndex: 0, endIndex: 2 } } },
    { autoResizeDimensions: { dimensions: { sheetId: dailyId, dimension: 'COLUMNS', startIndex: 0, endIndex: dailyColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: generalId, dimension: 'COLUMNS', startIndex: 0, endIndex: generalColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: productsId, dimension: 'COLUMNS', startIndex: 0, endIndex: productsColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: landingOnlyId, dimension: 'COLUMNS', startIndex: 0, endIndex: landingOnlyColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: totalsId, dimension: 'COLUMNS', startIndex: 0, endIndex: totalsColumnCount } } },
    { autoResizeDimensions: { dimensions: { sheetId: todaySummaryId, dimension: 'COLUMNS', startIndex: 0, endIndex: todaySummaryColumnCount } } },
  ];

  for (const sheet of spreadsheet.data.sheets || []) {
    if (![dailyId, generalId, landingOnlyId].includes(sheet.properties?.sheetId)) continue;
    const ruleCount = sheet.conditionalFormats?.length || 0;
    for (let index = ruleCount - 1; index >= 0; index -= 1) {
      requests.push({ deleteConditionalFormatRule: { sheetId: sheet.properties.sheetId, index } });
    }
  }

  const deltaColumnsBySheet = [
    { sheetId: dailyId, columns: [dailyColumnCount - 3, dailyColumnCount - 2, dailyColumnCount - 1] },
    { sheetId: generalId, columns: [generalColumnCount - 3, generalColumnCount - 2, generalColumnCount - 1] },
    { sheetId: landingOnlyId, columns: [landingOnlyColumnCount - 3, landingOnlyColumnCount - 2, landingOnlyColumnCount - 1] },
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
  authContext = await getGoogleAuth();
  const auth = authContext.auth;
  const sheets = google.sheets({ version: 'v4', auth });
  const partners = await loadPartners();
  const { qrPartners } = partitionPartners(partners);
  const records = await collectRows(auth, partners);
  const { qrRecords, landingOnlyRecords } = partitionRecords(records, partners);
  const dailyValues = buildDailyValues(qrRecords);
  const generalValues = buildGeneralValues(qrRecords);
  const productValues = await collectProductRows(auth, qrPartners);
  const totalsValues = buildTotalsValues(qrRecords, qrPartners);
  const todaySummaryValues = buildTodaySummaryValues(qrRecords);
  const landingOnlyValues = buildLandingOnlyValues(landingOnlyRecords);
  const stripeValues = await buildStripeValues(partners);
  const legendValues = buildLegendValues();
  const spreadsheetId = await loadSpreadsheetId(sheets);
  const sheetIds = await ensureSheets(sheets, spreadsheetId);

  await writeSheet(sheets, spreadsheetId, dailySheet, dailyValues);
  await writeSheet(sheets, spreadsheetId, generalSheet, generalValues);
  await writeSheet(sheets, spreadsheetId, productsSheet, productValues);
  await writeSheet(sheets, spreadsheetId, totalsSheet, totalsValues);
  await writeSheet(sheets, spreadsheetId, todaySummarySheet, todaySummaryValues);
  await writeSheet(sheets, spreadsheetId, landingOnlySheet, landingOnlyValues);
  await writeSheet(sheets, spreadsheetId, stripeSheet, stripeValues);
  await writeSheet(sheets, spreadsheetId, legendSheet, legendValues);
  await formatSheets(
    sheets,
    spreadsheetId,
    sheetIds,
    dailyValues[0].length,
    generalValues[0].length,
    productValues[0].length,
    totalsValues[0].length,
    Math.max(...todaySummaryValues.map((row) => row.length)),
    Math.max(...landingOnlyValues.map((row) => row.length))
  );

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  await fs.writeFile(statePath, JSON.stringify({
    spreadsheetId,
    spreadsheetUrl: url,
    updatedAt: new Date().toISOString(),
    dateRange: { startDate, endDate },
    records: qrRecords.length,
    landingOnlyRecords: landingOnlyRecords.length,
  }, null, 2));
  console.log(JSON.stringify({
    spreadsheetId,
    spreadsheetUrl: url,
    records: qrRecords.length,
    landingOnlyRecords: landingOnlyRecords.length,
    authMode: authContext.authMode,
  }, null, 2));
}

main().catch(async (error) => {
  const accessHelp = buildGoogleAccessHelp({
    propertyId,
    spreadsheetId: await readKnownSpreadsheetId(),
    serviceAccountEmail: authContext?.serviceAccountEmail || '',
  });

  if (
    error.code === 'ENOENT' &&
    (String(error.path || '').includes('google-oauth-token.json') || String(error.path || '').includes('ga4-oauth-client.json'))
  ) {
    console.error(`Missing Google OAuth credentials. ${accessHelp}`);
  } else if (error.response?.data?.error === 'invalid_grant' || error.error === 'invalid_grant') {
    console.error(`Google OAuth refresh token expired or was revoked. ${accessHelp}`);
  } else if (
    ['EACCES', 'ECONNREFUSED', 'ENETUNREACH', 'ETIMEDOUT'].includes(error.code) &&
    String(error.config?.url || '').includes('oauth2.googleapis.com/token')
  ) {
    console.error(
      'Google OAuth token refresh failed because this environment cannot reach oauth2.googleapis.com. ' +
      'The script is healthy, but it needs outbound HTTPS access to Google APIs.'
    );
  } else if (error.response?.status === 403 && authContext?.authMode === 'service_account') {
    console.error(`Google service account lacks access. ${accessHelp}`);
  } else {
    console.error(error.response?.data || error);
  }
  process.exit(1);
});
