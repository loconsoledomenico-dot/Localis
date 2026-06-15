import fs from 'node:fs/promises';
import QRCode from 'qrcode';

const registryPath = new URL('../src/data/qr-codes.json', import.meta.url);
const outDir = new URL('../private/qr-batches/', import.meta.url);
const BASE_URL = process.env.LOCALIS_BASE_URL || 'https://localis.guide';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // niente I O 0 1

function parseArgs(argv) {
  const args = { count: 20, batch: 'lotto' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--count') args.count = parseInt(argv[i + 1], 10);
    else if (argv[i] === '--batch') args.batch = argv[i + 1];
  }
  if (!Number.isInteger(args.count) || args.count < 1 || args.count > 500) {
    throw new Error('--count deve essere un intero tra 1 e 500');
  }
  if (!args.batch) throw new Error('--batch obbligatorio (etichetta del lotto)');
  return args;
}

function randomCode() {
  let s = '';
  for (let i = 0; i < 6; i += 1) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function generateCodes(count, existing) {
  const seen = new Set(existing);
  const out = [];
  while (out.length < count) {
    const code = randomCode();
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

async function loadRegistry() {
  try {
    return JSON.parse(await fs.readFile(registryPath, 'utf8'));
  } catch {
    return [];
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function buildSheet(codes, batch) {
  const cells = [];
  for (const code of codes) {
    const svg = await QRCode.toString(`${BASE_URL}/q/${code}`, { type: 'svg', margin: 1 });
    cells.push(`<figure class="cell"><div class="qr">${svg}</div><figcaption>${code}</figcaption></figure>`);
  }
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>Localis QR - ${batch}</title>
<style>
  @page { margin: 12mm; }
  body { font-family: system-ui, sans-serif; }
  h1 { font-size: 13pt; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18mm 10mm; }
  .cell { text-align: center; break-inside: avoid; }
  .qr svg { width: 48mm; height: 48mm; }
  figcaption { font-size: 11pt; letter-spacing: 2px; font-weight: 600; margin-top: 4mm; }
</style></head><body>
<h1>Localis - lotto ${batch} - ${codes.length} codici - ${today()}</h1>
<div class="grid">${cells.join('')}</div>
</body></html>`;
}

async function main() {
  const { count, batch } = parseArgs(process.argv.slice(2));
  const registry = await loadRegistry();
  const codes = generateCodes(count, registry.map((c) => c.code));
  const printedAt = today();
  for (const code of codes) registry.push({ code, partner_slug: null, batch, printed_at: printedAt });
  await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  await fs.mkdir(outDir, { recursive: true });
  const sheetPath = new URL(`${batch}-${printedAt}.html`, outDir);
  await fs.writeFile(sheetPath, await buildSheet(codes, batch));

  console.log(`${count} codici aggiunti al registro (batch "${batch}").`);
  console.log(`Foglio stampa: ${decodeURIComponent(sheetPath.pathname)}`);
  console.log('Ricorda: git push per pubblicare le nuove route /q/{code}.');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
