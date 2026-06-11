// Aggiorna (o crea) il Google Sheet con l'inventario audio: guide complete
// IT/EN/DE, trailer canonici, anomalie, orfani R2 e stato delle due copie.
// Uso: node scripts/audio-inventory-sheet.mjs [spreadsheetId]
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getGoogleAuth } from './google-auth.mjs';

const ROOT = process.cwd();
const SPREADSHEET_ID = process.argv[2] || '';
const TITLE = `Localis — Inventario Audio ${new Date().toISOString().slice(0, 10)}`;
const MIRROR = path.join(ROOT, 'private/audio/r2-mirror');
const DRIVE_BACKUP_FOLDER = 'LocalisGuide-audio-backup';
const CHUNKS = path.join(ROOT, 'chunks');

// ── env / R2 ──────────────────────────────────────────────────────────────────
const env = {};
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\r]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY, secretAccessKey: env.R2_SECRET_KEY },
});
async function listAllR2() {
  const objects = new Map();
  let token;
  do {
    const out = await s3.send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET, ContinuationToken: token }));
    for (const o of out.Contents ?? []) objects.set(o.Key, o.Size);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return objects;
}

// ── MDX frontmatter ───────────────────────────────────────────────────────────
function parseFrontmatter(file) {
  const fm = fs.readFileSync(file, 'utf8').split('---')[1] ?? '';
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\r\\n]*)"?\\s*$`, 'm'));
    return m ? m[1].trim() : null;
  };
  return {
    slug: get('slug'),
    full: { it: get('audio_full_key_it'), en: get('audio_full_key_en'), de: get('audio_full_key_de') },
    duration: { it: get('duration_seconds'), en: get('duration_seconds_en'), de: get('duration_seconds_de') },
  };
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
const r2 = await listAllR2();

const { auth, authMode } = await getGoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
  preferServiceAccount: false,
});
const sheets = google.sheets({ version: 'v4', auth });

// ── Copia 2 su Drive: mappa "percorso relativo" → size ───────────────────────
const drive = google.drive({ version: 'v3', auth });
const driveBackup = new Map();
{
  const rootRes = await drive.files.list({
    q: `name = '${DRIVE_BACKUP_FOLDER}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  });
  const rootId = rootRes.data.files[0]?.id;
  async function walkDrive(folderId, prefix) {
    let pageToken;
    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, size, mimeType)',
        pageToken,
      });
      for (const f of res.data.files) {
        if (f.mimeType === 'application/vnd.google-apps.folder') await walkDrive(f.id, `${prefix}${f.name}/`);
        else driveBackup.set(`${prefix}${f.name}`, Number(f.size ?? -1));
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  }
  if (rootId) await walkDrive(rootId, '');
}

const guidesDir = path.join(ROOT, 'src/content/guides');
const guides = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx'))
  .map((f) => parseFrontmatter(path.join(guidesDir, f)))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const anomalies = [];
const fullRows = guides.map((g) => {
  const cells = {};
  const mirrorParts = [];
  const copy2Parts = [];
  const chunkParts = [];
  for (const lang of ['it', 'en', 'de']) {
    const key = g.full[lang] ?? `guides/${g.slug}/${g.slug}-${lang}.mp3`;
    const declared = Boolean(g.full[lang]);
    const onR2 = r2.has(key);
    if (declared && !onR2) anomalies.push(['CRITICA', g.slug, lang.toUpperCase(), `${key} dichiarata nel MDX ma assente su R2`]);
    if (!declared && onR2) anomalies.push(['MEDIA', g.slug, lang.toUpperCase(), `audio su R2 ma non dichiarato nel MDX`]);
    cells[lang] = declared && onR2 ? `${path.basename(key)} (${mb(r2.get(key))})` : declared ? `${path.basename(key)} ⚠ NON SU R2` : '—';
    if (fs.existsSync(path.join(MIRROR, key))) mirrorParts.push(lang.toUpperCase());
    else if (declared) anomalies.push(['ALTA', g.slug, lang.toUpperCase(), 'manca nel mirror locale — rilanciare r2-mirror-download.py']);
    if (onR2 && driveBackup.get(key) === r2.get(key)) copy2Parts.push(lang.toUpperCase());
    else if (declared && onR2) anomalies.push(['ALTA', g.slug, lang.toUpperCase(), 'manca o differisce nella copia 2 su Drive — rilanciare drive-backup-upload.mjs']);
    if (fs.existsSync(path.join(CHUNKS, `${g.slug}-${lang}`))) chunkParts.push(lang.toUpperCase());
    const dur = g.duration[lang];
    if (declared && (dur === '0' || dur === null) && lang !== 'it') {
      anomalies.push(['BASSA', g.slug, lang.toUpperCase(), `duration_seconds_${lang} ${dur === '0' ? '= 0' : 'assente'} nel MDX`]);
    }
  }
  return [
    g.slug, cells.it, cells.en, cells.de,
    `R2 (${env.R2_BUCKET}): guides/${g.slug}/`,
    mirrorParts.length ? `private/audio/r2-mirror (${mirrorParts.join(',')})` : 'MANCA',
    copy2Parts.length ? `Google Drive: ${DRIVE_BACKUP_FOLDER} (${copy2Parts.join(',')})` : 'MANCA',
    chunkParts.length ? `chunks/ (${chunkParts.join(',')})` : 'nessuno',
  ];
});

// ── Trailer canonici: scansione del filesystem (i MDX non li hanno più) ──────
const TRAILER_DIR = path.join(ROOT, 'public/audio/trailers');
const trailerGroups = {};
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.mp3')) {
      const rel = path.relative(TRAILER_DIR, p).replace(/\\/g, '/');
      const base = e.name.replace(/-(it|en|de)\.mp3$/, '');
      const lang = (e.name.match(/-(it|en|de)\.mp3$/) ?? [])[1] ?? '?';
      trailerGroups[base] ??= { dir: path.dirname(rel), langs: {} };
      trailerGroups[base].langs[lang] = e.name;
    }
  }
}
walk(TRAILER_DIR);
const trailerRows = Object.entries(trailerGroups).sort().map(([base, t]) => {
  const langs = ['it', 'en', 'de'];
  const missing = langs.filter((l) => !t.langs[l]);
  if (missing.length) anomalies.push(['MEDIA', base, missing.join(',').toUpperCase(), 'trailer mancante per queste lingue']);
  return [
    base,
    t.langs.it ?? '—', t.langs.en ?? '—', t.langs.de ?? '—',
    `Sito (Netlify): public/audio/trailers/${t.dir === '.' ? '' : t.dir + '/'}`,
    'sì — versionato in git',
    'repo GitHub (remoto)',
    base === 'bari-vecchia-trailer' ? 'usato da pagine crociera + infopoint (non è trailer di zona)' : '',
  ];
});

// ── Orfani R2 ─────────────────────────────────────────────────────────────────
const referenced = new Set(guides.flatMap((g) =>
  ['it', 'en', 'de'].map((l) => g.full[l] ?? `guides/${g.slug}/${g.slug}-${l}.mp3`)));
const orphanRows = [...r2.keys()].filter((k) => !referenced.has(k)).sort().map((k) => {
  let cat = 'da classificare';
  if (k.startsWith('wm/')) cat = 'residuo watermark (sistema rimosso)';
  else if (k.includes('/full-')) cat = 'schema chiavi vecchio (full-{lang})';
  else if (k.includes('il-meglio-di-bari')) cat = 'guida sostituita da bari-tavola (tenere per clienti legacy)';
  return [k, mb(r2.get(k)), cat];
});

const anomalyRows = anomalies.sort((a, b) =>
  ['CRITICA', 'ALTA', 'MEDIA', 'BASSA'].indexOf(a[0]) - ['CRITICA', 'ALTA', 'MEDIA', 'BASSA'].indexOf(b[0]));
if (!anomalyRows.length) anomalyRows.push(['—', '—', '—', 'Nessuna anomalia rilevata ✓']);

// ── Google Sheets ─────────────────────────────────────────────────────────────
const TABS = ['Guide complete', 'Trailer', 'Anomalie', 'Orfani R2'];
const HEADERS = {
  'Guide complete': ['Guida', 'File IT', 'File EN', 'File DE', 'Dove vive (produzione)', 'Copia 1 (mirror locale)', 'Copia 2 (Google Drive)', 'Chunks capitoli'],
  'Trailer': ['Trailer', 'File IT', 'File EN', 'File DE', 'Dove vive (produzione)', 'Copia locale', 'Backup', 'Note'],
  'Anomalie': ['Severità', 'Voce', 'Lingua', 'Descrizione'],
  'Orfani R2': ['Chiave R2', 'Dimensione', 'Categoria'],
};
const DATA = {
  'Guide complete': fullRows,
  'Trailer': trailerRows,
  'Anomalie': anomalyRows,
  'Orfani R2': orphanRows,
};

let spreadsheetId = SPREADSHEET_ID;
let sheetIds;
if (spreadsheetId) {
  const cur = await sheets.spreadsheets.get({ spreadsheetId });
  sheetIds = Object.fromEntries(cur.data.sheets.map((s) => [s.properties.title, s.properties.sheetId]));
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ updateSpreadsheetProperties: { properties: { title: TITLE }, fields: 'title' } }] },
  });
} else {
  const created = await sheets.spreadsheets.create({
    requestBody: { properties: { title: TITLE }, sheets: TABS.map((t) => ({ properties: { title: t } })) },
  });
  spreadsheetId = created.data.spreadsheetId;
  sheetIds = Object.fromEntries(created.data.sheets.map((s) => [s.properties.title, s.properties.sheetId]));
}

for (const tab of TABS) {
  if (!(tab in sheetIds)) {
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
    });
    sheetIds[tab] = res.data.replies[0].addSheet.properties.sheetId;
  }
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${tab}'!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS[tab], ...DATA[tab]] },
  });
}

await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: TABS.flatMap((tab) => [
      {
        repeatCell: {
          range: { sheetId: sheetIds[tab], startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true } } },
          fields: 'userEnteredFormat.textFormat.bold',
        },
      },
      { updateSheetProperties: { properties: { sheetId: sheetIds[tab], gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
      { autoResizeDimensions: { dimensions: { sheetId: sheetIds[tab], dimension: 'COLUMNS', startIndex: 0, endIndex: HEADERS[tab].length } } },
    ]),
  },
});

console.log(JSON.stringify({
  url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  authMode,
  mode: SPREADSHEET_ID ? 'updated' : 'created',
  rows: { guide: fullRows.length, trailer: trailerRows.length, anomalie: anomalyRows.length, orfani: orphanRows.length },
}, null, 2));
