import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// I link di accesso sono /access/<JWT>: il token contiene email del cliente e
// session id Stripe. Era finito in GA4 come pagina piu' vista (visto nel digest
// del 22/08). Questi test fissano la redazione lato client.
const source = readFileSync(new URL('../../src/components/Analytics.astro', import.meta.url), 'utf8');

/** Estrae le due funzioni di redazione dal componente e le rende eseguibili. */
function loadRedactors() {
  const path = source.match(/function localisSafePath\(p\) \{[\s\S]*?\n {10}\}/);
  const url = source.match(/function localisSafeUrl\(u\) \{[\s\S]*?\n {10}\}/);
  if (!path || !url) throw new Error('funzioni di redazione non trovate in Analytics.astro');
  const factory = new Function(`
    const window = { location: { origin: 'https://localis.guide' } };
    ${path[0]}
    ${url[0]}
    return { localisSafePath, localisSafeUrl };
  `);
  return factory() as {
    localisSafePath: (p: string) => string;
    localisSafeUrl: (u: string) => string;
  };
}

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InRlc3RAZXNlbXBpby5pdCJ9.firma';

describe('redazione del token di accesso negli analytics', () => {
  const { localisSafePath, localisSafeUrl } = loadRedactors();

  it('sostituisce il token nel path italiano', () => {
    expect(localisSafePath(`/access/${JWT}`)).toBe('/access/[token]');
  });

  it.each(['en', 'de'])('sostituisce il token nel path /%s', (lang) => {
    expect(localisSafePath(`/${lang}/access/${JWT}`)).toBe(`/${lang}/access/[token]`);
  });

  it('conserva la query string', () => {
    expect(localisSafePath(`/access/${JWT}?lang=de`)).toBe('/access/[token]?lang=de');
  });

  it('non tocca le altre pagine', () => {
    expect(localisSafePath('/guide/bari-vecchia/')).toBe('/guide/bari-vecchia/');
    expect(localisSafePath('/access-invalid')).toBe('/access-invalid');
  });

  it('redige anche gli URL completi (referrer inclusi)', () => {
    expect(localisSafeUrl(`https://localis.guide/access/${JWT}`))
      .toBe('https://localis.guide/access/[token]');
  });

  it('non lascia mai passare la firma del token', () => {
    const out = `${localisSafePath(`/access/${JWT}`)} ${localisSafeUrl(`https://localis.guide/de/access/${JWT}`)}`;
    expect(out).not.toContain('eyJ');
  });
});

describe('configurazione dei tracker', () => {
  it('GA4 riceve page_path e page_location redatti', () => {
    expect(source).toContain('page_path: localisSafePath(');
    expect(source).toContain('page_location: localisSafeUrl(');
  });

  it('PostHog redige le proprietà degli eventi', () => {
    expect(source).toContain('sanitize_properties:');
    expect(source).toContain('$initial_current_url');
  });

  it('Plausible esclude del tutto le rotte di accesso', () => {
    expect(source).toContain('script.tagged-events.exclusions.js');
    expect(source).toMatch(/data-exclude="[^"]*\/access\/\*/);
  });
});
