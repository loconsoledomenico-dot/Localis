import prices from '../data/stripe-prices.json';

export type ProductSlug =
  | 'single'
  | 'tris'
  | 'sestina'
  | 'puglia-completa'
  | 'bari-completa'
  | 'crociera';

const priceMap = prices as Record<string, string>;

// Only single and crociera use stored Stripe price IDs.
// Dynamic bundles (tris/sestina/puglia-completa/bari-completa) use price_data.
export const STRIPE_PRICE_IDS: Record<'single' | 'crociera', string> = {
  single:   process.env.Stripe_id_singola  || priceMap.single  || '',
  crociera: process.env.Stripe_id_crociera || priceMap.crociera || '',
};

// ── Guide catalog ─────────────────────────────────────────────────────────────

export const BARI_GUIDES: readonly string[] = [
  'bari-vecchia',
  'san-nicola',
  'tre-teatri',
  'il-meglio-di-bari',
  'porto-bari',
  'bari-sotterranea',
] as const;

export const VALLE_GUIDES: readonly string[] = [
  'alberobello',
  'locorotondo',
  'martina-franca',
  'cisternino',
  'fasano',
  'ostuni',
] as const;

export const GARGANO_GUIDES: readonly string[] = [
  'gargano-vieste',
  'gargano-tremiti',
  'gargano-nord',
  'gargano-paesi',
  'gargano-sacro',
  'gargano-saline',
] as const;

export const ALL_GUIDES: readonly string[] = [
  ...BARI_GUIDES,
  ...VALLE_GUIDES,
  ...GARGANO_GUIDES,
] as const;

export const CROCIERA_GUIDES: readonly string[] = [
  'bari-vecchia',
  'il-meglio-di-bari',
] as const;

// ── Pricing constants (in euro cents) ────────────────────────────────────────

export const PRODUCT_PRICE_CENTS: Record<ProductSlug, number> = {
  single:             499,
  tris:              1199,
  sestina:           1999,
  'puglia-completa': 3999,
  'bari-completa':   1499,
  crociera:           799,
};

// ── Tier definitions ──────────────────────────────────────────────────────────

export type Tier = { product: ProductSlug; count: number; priceCents: number };

export const FREE_CHOICE_TIERS: readonly Tier[] = [
  { product: 'tris',            count: 3,  priceCents: 1199 },
  { product: 'sestina',         count: 6,  priceCents: 1999 },
  { product: 'puglia-completa', count: 18, priceCents: 3999 },
] as const;

/**
 * Given a selection count, return the matching free-choice tier or null.
 */
export function getTierForCount(count: number): Tier | null {
  return FREE_CHOICE_TIERS.find((t) => t.count === count) ?? null;
}

/**
 * Next tier above the current selection count (for upsell messaging).
 */
export function getNextTier(count: number): Tier | null {
  return FREE_CHOICE_TIERS.find((t) => t.count > count) ?? null;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateSelectedSlugs(
  product: ProductSlug,
  selectedSlugs: string[],
): void {
  const validSet = new Set(ALL_GUIDES);
  for (const s of selectedSlugs) {
    if (!validSet.has(s)) {
      throw new Error(`Unknown guide slug: "${s}"`);
    }
  }
  if (product === 'tris' && selectedSlugs.length !== 3) {
    throw new Error(`tris requires exactly 3 guides, got ${selectedSlugs.length}`);
  }
  if (product === 'sestina' && selectedSlugs.length !== 6) {
    throw new Error(`sestina requires exactly 6 guides, got ${selectedSlugs.length}`);
  }
  if (product === 'puglia-completa' && selectedSlugs.length !== 18) {
    throw new Error(`puglia-completa requires all 18 guides`);
  }
  if (product === 'bari-completa') {
    const bariSet = new Set(BARI_GUIDES);
    if (selectedSlugs.length !== 6 || !selectedSlugs.every((s) => bariSet.has(s))) {
      throw new Error(`bari-completa requires exactly the 6 Bari guides`);
    }
  }
  if (product === 'single' && selectedSlugs.length !== 1) {
    throw new Error(`single requires exactly 1 guide slug`);
  }
  if (product === 'crociera' && selectedSlugs.length !== 2) {
    throw new Error(`crociera requires exactly 2 guide slugs`);
  }
}

export function getStripePrice(slug: 'single' | 'crociera'): string {
  const id = STRIPE_PRICE_IDS[slug];
  if (!id || id.startsWith('price_REPLACE')) {
    throw new Error(`Stripe price ID not configured for product "${slug}"`);
  }
  return id;
}

/** Cents → euro string for display (e.g. 1199 → "€11,99") */
export function formatPriceCents(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

/** Savings in cents vs buying singles */
export function savingsCents(product: ProductSlug): number {
  const tiers: Partial<Record<ProductSlug, number>> = {
    tris:              3 * 499 - 1199,   // 298
    sestina:           6 * 499 - 1999,   // 995
    'puglia-completa': 18 * 499 - 3999,  // 4983
    'bari-completa':   6 * 499 - 1499,   // 1495
  };
  return tiers[product] ?? 0;
}
