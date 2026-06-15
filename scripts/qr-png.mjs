import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

/**
 * Esporta i codici del registro come singoli PNG ad alta risoluzione (2000px),
 * uno per codice, nominati col codice — da trascinare in una locandina Photoshop.
 * Nero su bianco con bordo bianco incluso (massima scansionabilità).
 *
 * Uso:
 *   node scripts/qr-png.mjs                  → tutti i codici (escluso il seed)
 *   node scripts/qr-png.mjs 2026-06-lotto1   → solo quel lotto
 */

const registryPath = new URL('../src/data/qr-codes.json', import.meta.url);
const outRoot = new URL('../private/qr-batches/', import.meta.url);
const BASE_URL = process.env.LOCALIS_BASE_URL || 'https://localis.guide';

async function main() {
  const batch = process.argv[2] || '';
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
  const codes = registry
    .filter((c) => c.batch && c.batch !== 'esempio')
    .filter((c) => (batch ? c.batch === batch : true))
    .map((c) => c.code);

  if (!codes.length) {
    throw new Error(batch ? `Nessun codice nel lotto "${batch}".` : 'Nessun codice nel registro.');
  }

  const dir = fileURLToPath(new URL(`png-${batch || 'tutti'}/`, outRoot));
  await fs.mkdir(dir, { recursive: true });

  for (const code of codes) {
    await QRCode.toFile(
      path.join(dir, `${code}.png`),
      `${BASE_URL}/q/${code}`,
      { width: 2000, margin: 4, color: { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel: 'M' },
    );
  }

  console.log(`${codes.length} PNG generati in ${dir}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
