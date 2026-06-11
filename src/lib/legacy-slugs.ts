/**
 * Guide sostituite: gli slug vecchi vivono ancora nei JWT permanenti e nello
 * store entitlements dei clienti che hanno già acquistato. Qui vengono mappati
 * sulla guida che li ha rimpiazzati, così l'accesso non si rompe mai.
 */
export const LEGACY_GUIDE_SLUGS: Record<string, string> = {
  'il-meglio-di-bari': 'bari-tavola',
};

export function canonicalGuideSlug(slug: string): string {
  return LEGACY_GUIDE_SLUGS[slug] ?? slug;
}

/** Mappa e deduplica (un cliente potrebbe possedere vecchio e nuovo slug). */
export function canonicalGuideSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.map(canonicalGuideSlug))];
}
