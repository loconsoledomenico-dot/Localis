import prices from '../data/stripe-prices.json';

export type ProductSlug =
  | 'bari-vecchia'
  | 'porto-bari'
  | 'san-nicola'
  | 'il-meglio-di-bari'
  | 'tre-teatri'
  | 'bari-completa';

export const STRIPE_PRICE_IDS: Record<ProductSlug, string> = prices as Record<ProductSlug, string>;

/**
 * Get Stripe price ID for a product slug. Throws if unknown or placeholder.
 */
export function getStripePrice(slug: ProductSlug): string {
  const id = STRIPE_PRICE_IDS[slug];
  if (!id || id.startsWith('price_REPLACE')) {
    throw new Error(`Stripe price ID not configured for product "${slug}"`);
  }
  return id;
}

/**
 * Resolve which guide slugs a product unlocks.
 * Bundle resolves to multiple; single guide resolves to itself.
 */
export function getGuideSlugsForProduct(product: ProductSlug): string[] {
  if (product === 'bari-completa') {
    return ['bari-vecchia', 'porto-bari', 'san-nicola'];
  }
  return [product];
}

/**
 * Get gross price in cents for a product (used for Stripe Connect commission split).
 */
export function getProductPriceCents(product: ProductSlug): number {
  return product === 'bari-completa' ? 999 : 499;
}
