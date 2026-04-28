import type { AstroGlobal } from 'astro';

export type Lang = 'it' | 'en';

/**
 * Get current language from Astro context.
 */
export function getLang(astro: AstroGlobal): Lang {
  return (astro.currentLocale as Lang) || 'it';
}

/**
 * Build a localized URL given current lang and target path.
 * Italian (default) has no prefix; English uses /en/.
 *
 * @example
 *   localizedHref('/guide/bari-vecchia', 'it') === '/guide/bari-vecchia'
 *   localizedHref('/guide/bari-vecchia', 'en') === '/en/guide/bari-vecchia'
 */
export function localizedHref(path: string, lang: Lang): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'it') return normalized;
  return `/en${normalized}`;
}

/**
 * Strip locale prefix from path. Useful for building lang-switcher links.
 *
 * @example
 *   stripLocalePrefix('/en/guide/bari-vecchia') === '/guide/bari-vecchia'
 *   stripLocalePrefix('/guide/bari-vecchia') === '/guide/bari-vecchia'
 */
export function stripLocalePrefix(path: string): string {
  return path.replace(/^\/en\b/, '') || '/';
}

/**
 * Get the alternate language pair URL for hreflang tags.
 */
export function alternateLangUrl(currentPath: string, currentLang: Lang): string {
  const stripped = stripLocalePrefix(currentPath);
  const targetLang: Lang = currentLang === 'it' ? 'en' : 'it';
  return localizedHref(stripped, targetLang);
}
