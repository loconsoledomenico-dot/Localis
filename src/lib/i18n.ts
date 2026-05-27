import type { AstroGlobal } from 'astro';

export type Lang = 'it' | 'en' | 'de';

/**
 * Get current language from Astro context.
 */
export function getLang(astro: AstroGlobal): Lang {
  return (astro.currentLocale as Lang) || 'it';
}

/**
 * Build a localized URL given current lang and target path.
 * Italian (default) has no prefix; EN uses /en/, DE uses /de/.
 *
 * @example
 *   localizedHref('/guide/bari-vecchia', 'it') === '/guide/bari-vecchia'
 *   localizedHref('/guide/bari-vecchia', 'en') === '/en/guide/bari-vecchia'
 *   localizedHref('/guide/bari-vecchia', 'de') === '/de/guide/bari-vecchia'
 */
export function localizedHref(path: string, lang: Lang): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'it') return normalized;
  return `/${lang}${normalized}`;
}

/**
 * Strip locale prefix from path. Useful for building lang-switcher links.
 *
 * @example
 *   stripLocalePrefix('/en/guide/bari-vecchia') === '/guide/bari-vecchia'
 *   stripLocalePrefix('/de/bari') === '/bari'
 *   stripLocalePrefix('/guide/bari-vecchia') === '/guide/bari-vecchia'
 */
export function stripLocalePrefix(path: string): string {
  return path.replace(/^\/(en|de)\b/, '') || '/';
}

/**
 * Get the alternate language pair URL for hreflang tags (IT ↔ EN, legacy use).
 */
export function alternateLangUrl(currentPath: string, currentLang: Lang): string {
  const stripped = stripLocalePrefix(currentPath);
  const targetLang: Lang = currentLang === 'it' ? 'en' : 'it';
  return localizedHref(stripped, targetLang);
}

/** Pages where the slug differs across languages. Key = IT slug (no prefix). */
const SLUG_MAP: Record<string, { en: string; de: string }> = {
  '/crocieristi':   { en: '/cruise',      de: '/kreuzfahrt' },
  '/cruise':        { en: '/cruise',      de: '/kreuzfahrt' },
  '/kreuzfahrt':    { en: '/cruise',      de: '/kreuzfahrt' },
};

/**
 * Returns URLs for all 3 language versions of the current path.
 */
export function allLangUrls(currentPath: string): Record<Lang, string> {
  const stripped = stripLocalePrefix(currentPath);
  const map = SLUG_MAP[stripped];
  if (map) {
    return {
      it: '/crocieristi',
      en: `/en${map.en}`,
      de: `/de${map.de}`,
    };
  }
  return {
    it: localizedHref(stripped, 'it'),
    en: localizedHref(stripped, 'en'),
    de: localizedHref(stripped, 'de'),
  };
}
