import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PRODUCT_PRICE_CENTS, type ProductSlug } from '../../src/lib/stripe-prices';

// Un cliente tedesco (22/08) ha abbandonato l'acquisto perche' un articolo
// annunciava il pacchetto Bari a 9,99 € mentre ne costa 19,99: il box CTA del
// blog dichiara un prezzo che nessuno ricalcola dal listino.
const BLOG_DIR = new URL('../../src/content/blog/', import.meta.url);

type Post = { file: string; product: ProductSlug; label: string };

function posts(): Post[] {
  return readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => {
      const src = readFileSync(new URL(file, BLOG_DIR), 'utf8').slice(0, 4000);
      const product = src.match(/^guide_product:\s*(\S+)\s*$/m)?.[1];
      const label = src.match(/^guide_price_label:\s*"([^"]+)"\s*$/m)?.[1];
      return product && label ? { file, product: product as ProductSlug, label } : null;
    })
    .filter((p): p is Post => p !== null);
}

/** "19,99 €" / "€19.99" -> 1999 */
function labelToCents(label: string): number | null {
  const digits = label.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : null;
}

describe('prezzi dichiarati negli articoli del blog', () => {
  const all = posts();

  it('ci sono articoli con prezzo da controllare', () => {
    expect(all.length).toBeGreaterThan(50);
  });

  it.each(all.map((p) => [p.file, p] as const))(
    '%s dichiara il prezzo reale del prodotto',
    (_file, post) => {
      const expected = PRODUCT_PRICE_CENTS[post.product];
      expect(expected, `prodotto sconosciuto: ${post.product}`).toBeDefined();
      expect(labelToCents(post.label)).toBe(expected);
    },
  );
});
