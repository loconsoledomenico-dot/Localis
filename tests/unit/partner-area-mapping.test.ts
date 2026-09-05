import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Una citta' non elencata in AREA_CITY_MAP non rompe niente: cade in
// silenzio su 'bari'. Cosi' Tenace Petrol (Cagnano Varano, Gargano) ha
// offerto per due mesi le guide di Bari a chi stava a 180 km di distanza,
// e nessuno se n'e' accorto perche' la pagina si costruiva benissimo.
const LANDINGS = [
  'src/pages/p/[slug].astro',
  'src/pages/en/p/[slug].astro',
  'src/pages/de/p/[slug].astro',
];

function activePartnerCities() {
  return readdirSync('src/content/partners')
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => readFileSync(`src/content/partners/${f}`, 'utf8'))
    .filter((src) => /^status:\s*"?active/m.test(src))
    .map((src) => ({
      city: (src.match(/^city:\s*"?([a-z-]+)/m) || [])[1],
      slug: (src.match(/^slug:\s*"?([a-z0-9-]+)/m) || [])[1],
    }))
    .filter((p) => p.city && p.city !== 'online');
}

describe('mappatura zona delle landing partner', () => {
  it('ogni citta di un partner attivo e mappata esplicitamente, in tutte le lingue', () => {
    const partners = activePartnerCities();
    expect(partners.length).toBeGreaterThan(0);

    for (const file of LANDINGS) {
      const source = readFileSync(file, 'utf8');
      // Solo dentro AREA_CITY_MAP: una citta' che coincide con lo slug di una
      // guida farebbe passare il test per sbaglio se cercassimo nel file intero.
      const block = source.match(/AREA_CITY_MAP[^=]*=\s*\{([\s\S]*?)\n\};/);
      if (!block) throw new Error(`AREA_CITY_MAP non trovata in ${file}`);
      const mapped = new Set([...block[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));
      const missing = partners.filter((p) => !mapped.has(p.city));
      expect(missing.map((p) => `${p.slug} (${p.city}) in ${file}`)).toEqual([]);
    }
  });
});
