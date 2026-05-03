const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,40}$/i;

export function isValidPartnerSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return SLUG_PATTERN.test(slug);
}

/**
 * Get an active partner by slug, or null if not found / not active.
 *
 * Uses dynamic import for `astro:content` so this module can be imported
 * by unit tests for `isValidPartnerSlug` without pulling Astro's virtual modules.
 */
export async function getActivePartner(slug: string) {
  if (!isValidPartnerSlug(slug)) return null;
  try {
    const { getEntry } = await import('astro:content');
    const entry = await getEntry('partners', slug);
    if (!entry) return null;
    if (entry.data.status !== 'active') return null;
    return entry;
  } catch {
    return null;
  }
}

/**
 * Get all partners (any status) for admin listings.
 */
export async function getAllPartners() {
  const { getCollection } = await import('astro:content');
  return getCollection('partners');
}
