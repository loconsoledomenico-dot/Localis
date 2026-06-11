// Carica la copia 2 del mirror R2 su Google Drive (cartella LocalisGuide-audio-backup).
// Idempotente: salta i file già presenti con la stessa dimensione — riusabile come sync.
// Uso: node scripts/drive-backup-upload.mjs
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth.mjs';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'private/audio/r2-mirror');
const ROOT_FOLDER = 'LocalisGuide-audio-backup';

const { auth } = await getGoogleAuth({
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  preferServiceAccount: false,
});
const drive = google.drive({ version: 'v3', auth });

async function ensureFolder(name, parentId) {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    'trashed = false',
    parentId ? `'${parentId}' in parents` : null,
  ].filter(Boolean).join(' and ');
  const found = await drive.files.list({ q, fields: 'files(id)' });
  if (found.data.files.length) return found.data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined },
    fields: 'id',
  });
  return created.data.id;
}

async function listFiles(folderId) {
  const out = new Map();
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, size)',
      pageToken,
    });
    for (const f of res.data.files) out.set(f.name, Number(f.size ?? -1));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return out;
}

const rootId = await ensureFolder(ROOT_FOLDER, null);
const folderCache = new Map([['', rootId]]);

async function folderFor(relDir) {
  if (folderCache.has(relDir)) return folderCache.get(relDir);
  const parent = await folderFor(path.dirname(relDir) === '.' ? '' : path.dirname(relDir));
  const id = await ensureFolder(path.basename(relDir), parent);
  folderCache.set(relDir, id);
  return id;
}

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else files.push(p);
  }
})(SRC);

let uploaded = 0;
let skipped = 0;
const existingCache = new Map();
for (const file of files.sort()) {
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  const relDir = path.dirname(rel) === '.' ? '' : path.dirname(rel);
  const folderId = await folderFor(relDir);
  if (!existingCache.has(folderId)) existingCache.set(folderId, await listFiles(folderId));
  const existing = existingCache.get(folderId);
  const size = fs.statSync(file).size;
  if (existing.get(path.basename(file)) === size) {
    skipped++;
    continue;
  }
  await drive.files.create({
    requestBody: { name: path.basename(file), parents: [folderId] },
    media: { mimeType: 'audio/mpeg', body: fs.createReadStream(file) },
    fields: 'id',
  });
  uploaded++;
  console.log(`[${uploaded + skipped}/${files.length}] ${rel} (${(size / 1048576).toFixed(1)} MB)`);
}

console.log(JSON.stringify({
  folderUrl: `https://drive.google.com/drive/folders/${rootId}`,
  uploaded,
  skipped,
  total: files.length,
}, null, 2));
