import prices from '../data/stripe-prices.json';

export type ProductSlug = 'single' | 'bundle';

export const STRIPE_PRICE_IDS: Record<ProductSlug, string> = prices as Record<ProductSlug, string>;

export const BARI_GUIDES: readonly string[] = [
  'bari-vecchia',
  'san-nicola',
  'tre-teatri',
  'il-meglio-di-bari',
  'porto-bari',
  'bari-sotterranea',
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
 * - bundle: all live Bari guides
 * - single: requires guideSlug (the specific guide being bought)
 */
export function getGuideSlugsForProduct(
  product: ProductSlug,
  guideSlug?: string,
): string[] {
  if (product === 'bundle') {
    return [...BARI_GUIDES];
  }
  if (!guideSlug || !BARI_GUIDES.includes(guideSlug)) {
    throw new Error(`Invalid or missing guideSlug for single purchase: ${guideSlug}`);
  }
  return [guideSlug];
}

export function getProductPriceCents(product: ProductSlug): number {
  return product === 'bundle' ? 1990 : 499;
}
