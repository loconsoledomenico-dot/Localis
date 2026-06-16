/**
 * Regala accesso gratuito alle guide a un'email (influencer, stampa, partner cortesia).
 *
 * Scrive un entitlement nello store "entitlements" su Netlify Blobs — lo stesso
 * che la webhook Stripe popola sugli acquisti. La persona poi va su
 * https://localis.guide/recover, inserisce l'email e riceve il link /access/{token}.
 *
 * Niente token a mano: usa la CLI Netlify (gia' autenticata) per leggere/scrivere
 * il blob del sito collegato in .netlify/state.json.
 *
 * Uso:
 *   pnpm gift <email> [slug,slug,... | all] --note "<handle>" [--dry-run]
 *
 * Esempi:
 *   pnpm gift amanda@example.com all --note "abcuinitaly" --dry-run
 *   pnpm gift amanda@example.com bari-vecchia,porto-bari,alberobello --note "abcuinitaly"
 *
 * - partner_id resta null: un omaggio non e' un partner, non inquina l'attribuzione rev-share.
 * - last_session_id = "gift:<note>" cosi' l'omaggio e' riconoscibile nello store.
 * - Merge idempotente: se l'email ha gia' delle guide, le slug si sommano (come grantEntitlement).
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const STORE = 'entitlements';
const guidesDir = new URL('../src/content/guides/', import.meta.url);

function parseArgs(argv) {
  const positional = [];
  let note = '';
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--note') note = (argv[++i] || '').trim();
    else positional.push(a);
  }
  return { email: positional[0], slugsArg: positional[1] || 'all', note, dryRun };
}

function emailKey(email) {
  // DEVE combaciare con src/lib/entitlements.ts emailKey()
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

async function allGuideSlugs() {
  const files = (await fs.readdir(guidesDir)).filter((f) => f.endsWith('.mdx'));
  const slugs = [];
  for (const f of files) {
    const raw = await fs.readFile(new URL(f, guidesDir), 'utf8');
    const m = raw.match(/^slug:\s*(\S+)\s*$/m);
    if (m) slugs.push(m[1]);
  }
  return [...new Set(slugs)].sort();
}

/** Invoca la CLI Netlify. shell:true per risolvere netlify.cmd su Windows. */
function netlify(args, opts = {}) {
  return spawnSync('netlify', args, { encoding: 'utf8', shell: true, ...opts });
}

function readExisting(key) {
  const res = netlify(['blobs:get', STORE, key]);
  if (res.status !== 0) return null; // chiave assente => exit !=0
  const out = (res.stdout || '').trim();
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

async function writeEntitlement(key, json) {
  const tmp = path.join(os.tmpdir(), `gift-${key.slice(0, 12)}.json`);
  await fs.writeFile(tmp, json, 'utf8');
  try {
    const res = netlify(['blobs:set', STORE, key, '--input', tmp]);
    if (res.status !== 0) {
      throw new Error(`netlify blobs:set fallito:\n${res.stderr || res.stdout}`);
    }
  } finally {
    await fs.rm(tmp, { force: true });
  }
}

async function main() {
  const { email, slugsArg, note, dryRun } = parseArgs(process.argv.slice(2));

  if (!email || !email.includes('@')) {
    throw new Error('Uso: pnpm gift <email> [slug,slug | all] --note "<handle>" [--dry-run]');
  }

  const requested =
    slugsArg === 'all'
      ? await allGuideSlugs()
      : slugsArg.split(',').map((s) => s.trim()).filter(Boolean);

  if (requested.length === 0) {
    throw new Error('Nessuna guida specificata.');
  }

  const key = emailKey(email);
  const existing = dryRun ? null : readExisting(key);
  const merged = [...new Set([...(existing?.guide_slugs ?? []), ...requested])].sort();

  const entitlement = {
    guide_slugs: merged,
    partner_id: existing?.partner_id ?? null,
    last_session_id: note ? `gift:${note}` : 'gift',
    updated_at: new Date().toISOString(),
  };
  const json = JSON.stringify(entitlement);

  console.log(`Email:     ${email.trim().toLowerCase()}`);
  console.log(`Chiave:    ${key}`);
  console.log(`Guide:     ${merged.length} (${merged.join(', ')})`);
  console.log(`Marker:    ${entitlement.last_session_id}`);

  if (dryRun) {
    console.log('\n[DRY-RUN] Niente scritto. Entitlement che verrebbe salvato:');
    console.log(json);
    return;
  }

  await writeEntitlement(key, json);
  console.log('\nOK -> entitlement scritto su Netlify Blobs (store "entitlements").');
  console.log('Dille di andare su https://localis.guide/recover, inserire questa email');
  console.log('e cliccare il link /access/... che riceve via email.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
