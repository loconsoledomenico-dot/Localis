import fs from 'node:fs/promises';

const registryPath = new URL('../src/data/qr-codes.json', import.meta.url);
const partnerDir = new URL('../src/content/partners/', import.meta.url);

async function partnerExists(slug) {
  for (const ext of ['mdx', 'md']) {
    try {
      await fs.access(new URL(`${slug}.${ext}`, partnerDir));
      return true;
    } catch {
      // prova l'estensione successiva
    }
  }
  return false;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const [code, slug, ...rest] = process.argv.slice(2);
  const note = rest.join(' ').trim();
  if (!code || !slug) {
    throw new Error('Uso: node scripts/qr-assign.mjs <CODICE> <partner-slug> [nota]');
  }

  const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
  const entry = registry.find((c) => c.code === code);
  if (!entry) {
    throw new Error(`Codice ${code} non presente nel registro. Genera prima un lotto con: pnpm qr:batch`);
  }
  if (!(await partnerExists(slug))) {
    throw new Error(`Partner "${slug}" non trovato: crea prima src/content/partners/${slug}.mdx`);
  }

  const previous = entry.partner_slug;
  entry.partner_slug = slug;
  entry.assigned_at = today();
  if (note) entry.note = note;
  await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  console.log(previous && previous !== slug
    ? `Codice ${code}: riassegnato da "${previous}" a "${slug}".`
    : `Codice ${code} -> "${slug}".`);
  console.log('git push per attivare (rebuild Netlify ~2 min).');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
