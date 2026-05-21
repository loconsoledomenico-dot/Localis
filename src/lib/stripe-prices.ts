import prices from '../data/stripe-prices.json';

export type ProductSlug = 'single' | 'essenziale' | 'bundle';

/**
 * Stripe Price IDs. Production reads from env (`Stripe_id_singola`,
 * `Stripe_id_essenziale`, `Stripe_id_bundle`) so real IDs never end up in git.
 * JSON file holds placeholders used as a last-resort fallback (e.g. unit tests).
 */
const envSingle = process.env.Stripe_id_singola;
const envEssenziale = process.env.Stripe_id_essenziale;
const envBundle = process.env.Stripe_id_bundle;

const priceMap = prices as Record<string, string>;

export const STRIPE_PRICE_IDS: Record<ProductSlug, string> = {
  single: envSingle || priceMap.single,
  essenziale: envEssenziale || priceMap.essenziale,
  bundle: envBundle || priceMap.bundle,
};

export const BARI_GUIDES: readonly string[] = [
  'bari-vecchia',
  'san-nicola',
  'tre-teatri',
  'il-meglio-di-bari',
  'porto-bari',
  'bari-sotterranea',
] as const;

/** Curated 3-guide pack — "il primo giorno a Bari, queste tre" */
export const BARI_ESSENZIALE_GUIDES: readonly string[] = [
  'bari-vecchia',
  'san-nicola',
  'il-meglio-di-bari',
] as const;

export function getStripePrice(slug: ProductSlug): string {
  const id = STRIPE_PRICE_IDS[slug];
  if (!id || id.startsWith('price_REPLACE')) {
    throw new Error(`Stripe price ID not configured for product "${slug}"`);
  }
  return id;
}

/**
 * Resolve which guide slugs a product unlocks.
 * - bundle: all live Bari guides (6)
 * - essenziale: curated 3-guide pack (Bari Vecchia + San Nicola + Il Meglio)
 * - single: requires guideSlug (the specific guide being bought)
 */
export function getGuideSlugsForProduct(
  product: ProductSlug,
  guideSlug?: string,
): string[] {
  if (product === 'bundle') {
    return [...BARI_GUIDES];
  }
  if (product === 'essenziale') {
    return [...BARI_ESSENZIALE_GUIDES];
  }
  if (!guideSlug || !BARI_GUIDES.includes(guideSlug)) {
    throw new Error(`Invalid or missing guideSlug for single purchase: ${guideSlug}`);
  }
  return [guideSlug];
}

export function getProductPriceCents(product: ProductSlug): number {
  if (product === 'bundle') return 1499;
  if (product === 'essenziale') return 999;
  return 499;
}
