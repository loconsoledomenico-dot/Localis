import type { Lang } from './i18n';

/**
 * UI strings shared across components. Page-specific copy lives in MDX content.
 * Keep keys flat for simplicity; add nesting only if strings grow >50.
 */
export const STRINGS = {
  it: {
    'site.name': 'Localis',
    'site.tagline': 'Audioguide narrative · Puglia',
    'nav.home': 'Home',
    'nav.guide': 'Guide',
    'nav.partner': 'Diventa partner',
    'nav.about': 'Chi siamo',
    'lang.switch_to_en': 'EN',
    'lang.switch_to_it': 'IT',
    'lang.current_it': 'Italiano',
    'lang.current_en': 'English',
    'footer.copyright': '© Localis · Audioguide narrative della Puglia',
    'footer.terms': 'Termini',
    'footer.privacy': 'Privacy',
    'a11y.skip_to_content': 'Salta al contenuto principale',
  },
  en: {
    'site.name': 'Localis',
    'site.tagline': 'Narrative audio guides · Puglia',
    'nav.home': 'Home',
    'nav.guide': 'Guides',
    'nav.partner': 'Become a partner',
    'nav.about': 'About',
    'lang.switch_to_en': 'EN',
    'lang.switch_to_it': 'IT',
    'lang.current_it': 'Italiano',
    'lang.current_en': 'English',
    'footer.copyright': '© Localis · Narrative audio guides for Puglia',
    'footer.terms': 'Terms',
    'footer.privacy': 'Privacy',
    'a11y.skip_to_content': 'Skip to main content',
  },
} as const;

export type StringKey = keyof typeof STRINGS['it'];

/**
 * Lookup a translation. Falls back to Italian if key missing in English.
 */
export function t(key: StringKey, lang: Lang): string {
  return STRINGS[lang][key] ?? STRINGS.it[key];
}
