// Pubblica gli articoli blog programmati la cui data è arrivata.
// Flippa `status: draft` -> `status: published` per ogni .mdx in
// src/content/blog con published_at <= oggi (UTC). Eseguito dal workflow
// GitHub Actions ogni giorno; il push risultante fa rebuildare Netlify.
//
// Uso locale (dry-run, non scrive): node scripts/publish-scheduled.mjs --dry
// Test con data finta:            PUBLISH_TODAY=2026-06-19 node scripts/publish-scheduled.mjs --dry

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/blog';
const DRY = process.argv.includes('--dry');
const today = process.env.PUBLISH_TODAY ?? new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const published = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.mdx'))) {
  const path = join(DIR, file);
  const src = readFileSync(path, 'utf8');
  const status = src.match(/^status:\s*(\S+)/m)?.[1];
  const date = src.match(/^published_at:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];

  if (status !== 'draft' || !date) continue;
  if (date <= today) {
    const out = src.replace(/^status:\s*draft\s*$/m, 'status: published');
    if (!DRY) writeFileSync(path, out);
    published.push(`${file} (${date})`);
  }
}

if (published.length) {
  console.log(`${DRY ? '[dry] ' : ''}Pubblicati per ${today}:\n  - ${published.join('\n  - ')}`);
} else {
  console.log(`Nessun articolo programmato per oggi (${today}).`);
}
