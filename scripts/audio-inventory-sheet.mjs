// Crea un Google Sheet con l'inventario audio completo (full + trailer, IT/EN/DE):
// dove vive ogni file, copie locali, backup, anomalie e orfani R2.
// Uso: node scripts/audio-inventory-sheet.mjs
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getGoogleAuth } from './google-auth.mjs';

const ROOT = process.cwd();
const SHARE_WITH = 'luigiloconsole72@gmail.com';
const TITLE = `Localis — Inventario Audio ${new Date().toISOString().slice(0, 10)}`;

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
    trailer: { it: get('audio_trailer_path'), en: get('audio_trailer_path_en'), de: get('audio_trailer_path_de') },
    duration: { it: get('duration_seconds'), en: get('duration_seconds_en'), de: get('duration_seconds_de') },
  };
}

// ── filesystem locale ─────────────────────────────────────────────────────────
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
const existsPublic = (p) => (p ? fs.existsSync(path.join(ROOT, 'public', p.replace(/^\//, ''))) : false);
const listDirMp3 = (dir) => {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.toLowerCase().endsWith('.mp3'));
};
const chunkDirs = fs.existsSync(path.join(ROOT, 'chunks')) ? fs.readdirSync(path.join(ROOT, 'chunks')) : [];
const backupR2Files = listDirMp3('private/audio/_backup-r2');
const r2audioDirs = fs.existsSync(path.join(ROOT, 'r2_audio')) ? fs.readdirSync(path.join(ROOT, 'r2_audio')) : [];

function localCopiesFor(slug, lang) {
  const hits = [];
  if (backupR2Files.includes(`${slug}-${lang}.mp3`)) hits.push(`private/audio/_backup-r2/${slug}-${lang}.mp3`);
  if (r2audioDirs.includes(slug)) {
    const files = listDirMp3(`r2_audio/${slug}`).filter((f) => f.includes(`-${lang}`) || f.includes(`full-${lang}`));
    for (const f of files) hits.push(`r2_audio/${slug}/${f}`);
  }
  return hits;
}

// ── raccolta ──────────────────────────────────────────────────────────────────
const r2 = await listAllR2();
const guidesDir = path.join(ROOT, 'src/content/guides');
const guides = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx'))
  .map((f) => parseFrontmatter(path.join(guidesDir, f)))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const fullRows = [];
const trailerRows = [];
const anomalies = [];

for (const g of guides) {
  const fileCells = {};
  const noteParts = [];
  const localParts = [];
  const backupParts = [];

  for (const lang of ['it', 'en', 'de']) {
    const key = g.full[lang];
    const stagedKey = `guides/${g.slug}/${g.slug}-${lang}.mp3`;
    if (key) {
      const onR2 = r2.has(key);
      fileCells[lang] = `${path.basename(key)}${onR2 ? ` (${mb(r2.get(key))})` : ' ⚠ NON SU R2'}`;
      if (!onR2) anomalies.push(['CRITICA', g.slug, lang.toUpperCase(), `MDX punta a ${key} ma il file non esiste su R2 — acquisto rotto`]);
    } else if (r2.has(stagedKey)) {
      fileCells[lang] = `(non pubblicato — su R2: ${path.basename(stagedKey)}, ${mb(r2.get(stagedKey))})`;
      anomalies.push(['MEDIA', g.slug, lang.toUpperCase(), `Audio ${lang.toUpperCase()} pronto su R2 (${stagedKey}) ma non collegato nel MDX — la versione ${lang.toUpperCase()} non è in vendita`]);
    } else {
      fileCells[lang] = '—';
    }
    const copies = localCopiesFor(g.slug, lang);
    if (copies.length) localParts.push(`${lang.toUpperCase()}: ${copies.join(' · ')}`);
    if (chunkDirs.includes(`${g.slug}-${lang}`)) backupParts.push(`chunks/${g.slug}-${lang}/`);

    const dur = g.duration[lang];
    if (key && dur === '0') anomalies.push(['ALTA', g.slug, lang.toUpperCase(), `duration_seconds_${lang} = 0 nel MDX — durata mostrata sbagliata (regola: sempre da ffprobe)`]);
    if (key && dur === null && lang !== 'it') anomalies.push(['BASSA', g.slug, lang.toUpperCase(), `duration_seconds_${lang} assente nel MDX`]);
  }

  fullRows.push([
    g.slug,
    fileCells.it, fileCells.en, fileCells.de,
    `R2 (bucket ${env.R2_BUCKET}): guides/${g.slug}/`,
    localParts.join('\n') || 'nessuna',
    backupParts.join('\n') || 'nessuna',
  ]);

  // trailer
  const tCells = {};
  const tNotes = [];
  for (const lang of ['it', 'en', 'de']) {
    const p = g.trailer[lang];
    if (p) {
      const ok = existsPublic(p);
      tCells[lang] = `${path.basename(p)}${ok ? '' : ' ⚠ FILE MANCANTE (404 live)'}`;
      if (!ok) anomalies.push(['CRITICA', g.slug, lang.toUpperCase(), `Trailer ${p} referenziato nel MDX ma assente in public/ — 404 in produzione, anteprima rotta`]);
    } else {
      tCells[lang] = '—';
      if (g.full[lang] || r2.has(`guides/${g.slug}/${g.slug}-${lang}.mp3`)) tNotes.push(`trailer ${lang.toUpperCase()} non definito`);
    }
    if (r2.has(`guides/${g.slug}/trailer-${lang}.mp3`)) tNotes.push(`trailer ${lang.toUpperCase()} presente su R2 (guides/${g.slug}/trailer-${lang}.mp3) ma non sul sito`);
  }
  const tDir = g.trailer.it ? path.dirname(g.trailer.it) : (g.trailer.en ? path.dirname(g.trailer.en) : '—');
  const tBackup = r2audioDirs.filter((d) => d.startsWith(`${g.slug}-trailer`)).map((d) => `r2_audio/${d}/`);
  trailerRows.push([
    g.slug,
    tCells.it, tCells.en, tCells.de,
    tDir === '—' ? '—' : `Sito (Netlify, nel repo): public${tDir}/`,
    tDir === '—' ? '—' : `sì — public${tDir}/ è la copia locale versionata`,
    tBackup.join('\n') || 'nessuna',
    tNotes.join('\n'),
  ]);
}

// orfani R2
const referenced = new Set(guides.flatMap((g) => Object.values(g.full).filter(Boolean)));
const orphanRows = [...r2.keys()].filter((k) => !referenced.has(k)).sort().map((k) => {
  let cat = 'da classificare';
  if (k.startsWith('wm/')) cat = 'residuo watermark (sistema rimosso)';
  else if (k.startsWith('audio/trailers/')) cat = 'trailer schema vecchio (i trailer ora vivono sul sito)';
  else if (k.includes('/full-')) cat = 'schema chiavi vecchio (full-{lang})';
  else if (k.includes('il-meglio-di-bari')) cat = 'guida sostituita da bari-tavola (tenere per clienti legacy)';
  else if (k.includes('/trailer-')) cat = 'trailer DE/staging mai pubblicato sul sito';
  else if (k.match(/guides\/gargano-[a-z]+\/gargano-[a-z]+-de\.mp3/)) cat = 'audio DE pronto, non collegato nel MDX';
  return [k, mb(r2.get(k)), cat];
});

const anomalyRows = anomalies
  .sort((a, b) => ['CRITICA', 'ALTA', 'MEDIA', 'BASSA'].indexOf(a[0]) - ['CRITICA', 'ALTA', 'MEDIA', 'BASSA'].indexOf(b[0]));

// ── Google Sheets ─────────────────────────────────────────────────────────────
// OAuth utente (token in private/google-oauth-token.json): il foglio nasce
// nel Drive di Luigi, nessuna condivisione necessaria. Il service account dà
// 403 su spreadsheets.create.
const { auth, authMode, serviceAccountEmail } = await getGoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  preferServiceAccount: false,
});
const sheets = google.sheets({ version: 'v4', auth });

const TABS = ['Guide complete', 'Trailer', 'Anomalie', 'Orfani R2'];
const created = await sheets.spreadsheets.create({
  requestBody: { properties: { title: TITLE }, sheets: TABS.map((t) => ({ properties: { title: t } })) },
});
const spreadsheetId = created.data.spreadsheetId;
const sheetIds = Object.fromEntries(created.data.sheets.map((s) => [s.properties.title, s.properties.sheetId]));

const HEADERS = {
  'Guide complete': ['Guida', 'File IT', 'File EN', 'File DE', 'Dove vive (produzione)', 'Copia locale', 'Backup capitoli (chunks)'],
  'Trailer': ['Guida', 'File IT', 'File EN', 'File DE', 'Dove vive (produzione)', 'Copia locale', 'Backup', 'Note'],
  'Anomalie': ['Severità', 'Guida', 'Lingua', 'Descrizione'],
  'Orfani R2': ['Chiave R2', 'Dimensione', 'Categoria'],
};
const DATA = {
  'Guide complete': fullRows,
  'Trailer': trailerRows,
  'Anomalie': anomalyRows,
  'Orfani R2': orphanRows,
};

for (const tab of TABS) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS[tab], ...DATA[tab]] },
  });
}

// header bold + freeze + colonne auto
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

let shared = false;
if (authMode === 'service_account') {
  try {
    const drive = google.drive({ version: 'v3', auth });
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: { type: 'user', role: 'writer', emailAddress: SHARE_WITH },
      sendNotificationEmail: true,
    });
    shared = true;
  } catch (err) {
    console.error('Condivisione fallita:', err.message);
  }
}

console.log(JSON.stringify({
  url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  authMode,
  serviceAccountEmail,
  shared,
  rows: { full: fullRows.length, trailer: trailerRows.length, anomalie: anomalyRows.length, orfani: orphanRows.length },
}, null, 2));
