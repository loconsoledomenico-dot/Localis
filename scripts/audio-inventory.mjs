// Inventario audio completo: MDX ↔ trailer locali ↔ R2 ↔ chunks ↔ cover/OG.
// Output JSON su stdout; usato per audit e per il foglio Google.
import fs from 'node:fs';
import path from 'node:path';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const ROOT = path.resolve(process.cwd());

// .env parse minimale (niente dipendenze)
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
    const out = await s3.send(new ListObjectsV2Command({
      Bucket: env.R2_BUCKET,
      ContinuationToken: token,
    }));
    for (const o of out.Contents ?? []) objects.set(o.Key, o.Size);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return objects;
}

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.split('---')[1] ?? '';
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\r\\n]*)"?\\s*$`, 'm'));
    return m ? m[1].trim() : null;
  };
  return {
    slug: get('slug'),
    audio_full_key_it: get('audio_full_key_it'),
    audio_full_key_en: get('audio_full_key_en'),
    audio_full_key_de: get('audio_full_key_de'),
    trailer_it: get('audio_trailer_path'),
    trailer_en: get('audio_trailer_path_en'),
    trailer_de: get('audio_trailer_path_de'),
    duration_it: get('duration_seconds'),
    duration_en: get('duration_seconds_en'),
    duration_de: get('duration_seconds_de'),
    cover: get('cover'),
  };
}

const r2 = await listAllR2();
const guidesDir = path.join(ROOT, 'src/content/guides');
const guides = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx'))
  .map((f) => parseFrontmatter(path.join(guidesDir, f)));

const chunkDirs = fs.existsSync(path.join(ROOT, 'chunks'))
  ? fs.readdirSync(path.join(ROOT, 'chunks'))
  : [];

const existsPublic = (p) => p ? fs.existsSync(path.join(ROOT, 'public', p.replace(/^\//, ''))) : null;

const report = guides.map((g) => {
  const langs = {};
  for (const lang of ['it', 'en', 'de']) {
    const key = g[`audio_full_key_${lang}`];
    const trailer = g[`trailer_${lang === 'it' ? 'it' : lang}`];
    langs[lang] = {
      full_r2_key: key,
      full_on_r2: key ? r2.has(key) : null,
      full_r2_size_mb: key && r2.has(key) ? +(r2.get(key) / 1048576).toFixed(1) : null,
      trailer_path: trailer,
      trailer_local_exists: existsPublic(trailer),
      duration_seconds: g[`duration_${lang}`],
      chunks_local: chunkDirs.includes(`${g.slug}-${lang}`),
    };
  }
  return {
    slug: g.slug,
    cover: g.cover,
    cover_exists: existsPublic(g.cover ? `/${g.cover.replace(/^\//, '')}` : null),
    og_exists: fs.existsSync(path.join(ROOT, 'public/og', `og-${g.slug}.jpg`)),
    ...langs,
  };
});

// Oggetti R2 non referenziati da nessun MDX
const referenced = new Set(guides.flatMap((g) =>
  ['it', 'en', 'de'].map((l) => g[`audio_full_key_${l}`]).filter(Boolean)));
const orphans = [...r2.keys()].filter((k) => !referenced.has(k));

console.log(JSON.stringify({ report, orphans, r2_total_objects: r2.size }, null, 2));
