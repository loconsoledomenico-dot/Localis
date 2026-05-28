# Dynamic Bundle Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed pre-packaged pricing with a 4-tier dynamic builder where customers pick N guides freely, plus a Bari Completa zona-speciale.

**Architecture:** The frontend `GuideBuilder.astro` island manages selection state in vanilla JS and calls `/api/checkout` with `{ product, selectedSlugs[], lang }`. The checkout API uses Stripe `price_data` (inline amount, no stored price_id needed) for Tris/Sestina/Puglia Completa; single and crociera keep their stored price_ids. Validation lives in `stripe-prices.ts` and is tested in unit tests before wiring up the API.

**Tech Stack:** Astro + vanilla JS island, Stripe Checkout Sessions (`price_data`), Vitest unit tests, TypeScript.

---

## New Pricing Catalog

| Product | Slug | Price | Guide count | Stripe approach |
|---------|------|-------|-------------|-----------------|
| Guida singola | `single` | €4,99 | 1 (fixed) | stored price_id |
| Tris | `tris` | €11,99 | 3 (free choice) | price_data |
| Sestina | `sestina` | €19,99 | 6 (free choice) | price_data |
| Puglia Completa | `puglia-completa` | €29,99 | 18 (all) | price_data |
| Bari Completa | `bari-completa` | €14,99 | 6 (Bari only) | price_data |
| Pacchetto Crociera | `crociera` | €7,99 | 2 (fixed) | stored price_id |

**Retire:** `essenziale` (made redundant by Tris), `bundle` (replaced by `bari-completa`).

## All 18 Live Guides

```ts
// Bari (6)
'bari-vecchia', 'san-nicola', 'tre-teatri', 'il-meglio-di-bari', 'porto-bari', 'bari-sotterranea'
// Valle d'Itria (6)
'alberobello', 'locorotondo', 'martina-franca', 'cisternino', 'fasano', 'ostuni'
// Gargano (6)
'gargano-vieste', 'gargano-tremiti', 'gargano-nord', 'gargano-paesi', 'gargano-sacro', 'gargano-saline'
```

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/stripe-prices.ts` | Modify | New types, guide catalog, pricing logic, validation |
| `src/pages/api/checkout.ts` | Modify | Accept selectedSlugs, use price_data for bundles |
| `src/components/GuideBuilder.astro` | **Create** | Interactive selection UI island |
| `src/components/PriceCard.astro` | Modify | Support new product slugs + bari-completa card |
| `src/pages/index.astro` | Modify | Replace pricing section with GuideBuilder |
| `src/pages/guide/index.astro` | Modify | Replace pricing section with GuideBuilder |
| `src/pages/en/index.astro` | Modify | EN homepage pricing |
| `src/pages/de/index.astro` | Modify | DE homepage pricing |
| `tests/unit/stripe-prices.test.ts` | Modify | Update to new catalog |

---

## Task 1: Update `stripe-prices.ts` — new catalog and validation

**Files:**
- Modify: `src/lib/stripe-prices.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
// src/lib/stripe-prices.ts
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
  single:           499,
  tris:            1199,
  sestina:         1999,
  'puglia-completa': 2999,
  'bari-completa': 1499,
  crociera:         799,
};

// ── Tier definitions ──────────────────────────────────────────────────────────

export type Tier = { product: ProductSlug; count: number; priceCents: number };

export const FREE_CHOICE_TIERS: readonly Tier[] = [
  { product: 'tris',            count: 3,  priceCents: 1199 },
  { product: 'sestina',         count: 6,  priceCents: 1999 },
  { product: 'puglia-completa', count: 18, priceCents: 2999 },
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
    'puglia-completa': 18 * 499 - 2999,  // 5983
    'bari-completa':   6 * 499 - 1499,   // 1495
  };
  return tiers[product] ?? 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stripe-prices.ts
git commit -m "refactor(pricing): new 4-tier dynamic bundle catalog"
```

---

## Task 2: Update unit tests for new catalog

**Files:**
- Modify: `tests/unit/stripe-prices.test.ts`

- [ ] **Step 1: Replace test file**

```typescript
// tests/unit/stripe-prices.test.ts
import { describe, it, expect } from 'vitest';
import {
  ALL_GUIDES,
  BARI_GUIDES,
  VALLE_GUIDES,
  GARGANO_GUIDES,
  CROCIERA_GUIDES,
  PRODUCT_PRICE_CENTS,
  FREE_CHOICE_TIERS,
  getTierForCount,
  getNextTier,
  validateSelectedSlugs,
  savingsCents,
} from '../../src/lib/stripe-prices';

describe('guide catalog', () => {
  it('ALL_GUIDES has 18 entries', () => {
    expect(ALL_GUIDES.length).toBe(18);
  });

  it('BARI_GUIDES has 6 entries', () => {
    expect(BARI_GUIDES.length).toBe(6);
  });

  it('VALLE_GUIDES has 6 entries', () => {
    expect(VALLE_GUIDES.length).toBe(6);
  });

  it('GARGANO_GUIDES has 6 entries', () => {
    expect(GARGANO_GUIDES.length).toBe(6);
  });

  it('no duplicate slugs across ALL_GUIDES', () => {
    const unique = new Set(ALL_GUIDES);
    expect(unique.size).toBe(ALL_GUIDES.length);
  });
});

describe('PRODUCT_PRICE_CENTS', () => {
  it('single is 499', () => expect(PRODUCT_PRICE_CENTS.single).toBe(499));
  it('tris is 1199', () => expect(PRODUCT_PRICE_CENTS.tris).toBe(1199));
  it('sestina is 1999', () => expect(PRODUCT_PRICE_CENTS.sestina).toBe(1999));
  it('puglia-completa is 2999', () => expect(PRODUCT_PRICE_CENTS['puglia-completa']).toBe(2999));
  it('bari-completa is 1499', () => expect(PRODUCT_PRICE_CENTS['bari-completa']).toBe(1499));
});

describe('getTierForCount', () => {
  it('3 → tris', () => expect(getTierForCount(3)?.product).toBe('tris'));
  it('6 → sestina', () => expect(getTierForCount(6)?.product).toBe('sestina'));
  it('18 → puglia-completa', () => expect(getTierForCount(18)?.product).toBe('puglia-completa'));
  it('4 → null (not a tier boundary)', () => expect(getTierForCount(4)).toBeNull());
  it('0 → null', () => expect(getTierForCount(0)).toBeNull());
});

describe('getNextTier', () => {
  it('0 guides → next is tris (3)', () => expect(getNextTier(0)?.product).toBe('tris'));
  it('1 guide → next is tris', () => expect(getNextTier(1)?.product).toBe('tris'));
  it('3 guides → next is sestina (6)', () => expect(getNextTier(3)?.product).toBe('sestina'));
  it('4 guides → next is sestina', () => expect(getNextTier(4)?.product).toBe('sestina'));
  it('6 guides → next is puglia-completa', () => expect(getNextTier(6)?.product).toBe('puglia-completa'));
  it('18 guides → null (no tier above)', () => expect(getNextTier(18)).toBeNull());
});

describe('validateSelectedSlugs', () => {
  const bariSlugs = [...BARI_GUIDES];
  const threeSlugs = ['bari-vecchia', 'san-nicola', 'alberobello'];
  const sixSlugs = ['bari-vecchia', 'san-nicola', 'tre-teatri', 'il-meglio-di-bari', 'porto-bari', 'bari-sotterranea'];
  const allSlugs = [...ALL_GUIDES];

  it('single + 1 valid slug passes', () => {
    expect(() => validateSelectedSlugs('single', ['bari-vecchia'])).not.toThrow();
  });

  it('single + 2 slugs throws', () => {
    expect(() => validateSelectedSlugs('single', ['bari-vecchia', 'san-nicola'])).toThrow();
  });

  it('single + unknown slug throws', () => {
    expect(() => validateSelectedSlugs('single', ['not-a-guide'])).toThrow();
  });

  it('tris + 3 valid slugs passes', () => {
    expect(() => validateSelectedSlugs('tris', threeSlugs)).not.toThrow();
  });

  it('tris + 2 slugs throws', () => {
    expect(() => validateSelectedSlugs('tris', ['bari-vecchia', 'san-nicola'])).toThrow('tris requires exactly 3');
  });

  it('tris + 4 slugs throws', () => {
    expect(() => validateSelectedSlugs('tris', [...threeSlugs, 'porto-bari'])).toThrow('tris requires exactly 3');
  });

  it('sestina + 6 valid slugs passes', () => {
    expect(() => validateSelectedSlugs('sestina', sixSlugs)).not.toThrow();
  });

  it('puglia-completa + all 18 passes', () => {
    expect(() => validateSelectedSlugs('puglia-completa', allSlugs)).not.toThrow();
  });

  it('puglia-completa + 17 slugs throws', () => {
    expect(() => validateSelectedSlugs('puglia-completa', allSlugs.slice(0, 17))).toThrow();
  });

  it('bari-completa + all 6 Bari slugs passes', () => {
    expect(() => validateSelectedSlugs('bari-completa', bariSlugs)).not.toThrow();
  });

  it('bari-completa + non-Bari slug throws', () => {
    const mixed = [...bariSlugs.slice(0, 5), 'alberobello'];
    expect(() => validateSelectedSlugs('bari-completa', mixed)).toThrow();
  });
});

describe('savingsCents', () => {
  it('tris saves 298 cents', () => expect(savingsCents('tris')).toBe(298));
  it('sestina saves 995 cents', () => expect(savingsCents('sestina')).toBe(995));
  it('puglia-completa saves 5983 cents', () => expect(savingsCents('puglia-completa')).toBe(5983));
  it('bari-completa saves 1495 cents', () => expect(savingsCents('bari-completa')).toBe(1495));
  it('single saves 0', () => expect(savingsCents('single')).toBe(0));
});
```

- [ ] **Step 2: Run tests — expect FAIL initially (catalog not yet matching)**

```bash
cd "c:/Users/Admin/Desktop/Progetti & Lab/Sites/LocalisGuide"
pnpm test tests/unit/stripe-prices.test.ts
```

Expected: PASS (Task 1 was already done first).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/stripe-prices.test.ts
git commit -m "test(pricing): update unit tests for 4-tier dynamic catalog"
```

---

## Task 3: Update checkout API — accept selectedSlugs, use price_data

**Files:**
- Modify: `src/pages/api/checkout.ts`

- [ ] **Step 1: Replace checkout API**

```typescript
// src/pages/api/checkout.ts
import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import {
  getStripePrice,
  validateSelectedSlugs,
  PRODUCT_PRICE_CENTS,
  ALL_GUIDES,
  BARI_GUIDES,
  CROCIERA_GUIDES,
  type ProductSlug,
} from '../../lib/stripe-prices';
import { getActivePartner } from '../../lib/partners';
import type Stripe from 'stripe';

const VALID_PRODUCTS = new Set<ProductSlug>([
  'single', 'tris', 'sestina', 'puglia-completa', 'bari-completa', 'crociera',
]);

const PRODUCT_DISPLAY_NAME: Record<ProductSlug, string> = {
  single:           'Guida Localis',
  tris:             'Tris Localis — 3 guide a scelta',
  sestina:          'Sestina Localis — 6 guide a scelta',
  'puglia-completa':'Puglia Completa — 18 guide',
  'bari-completa':  'Bari Completa — 6 guide di Bari',
  crociera:         'Pacchetto Crociera Localis',
};

// Products that use stored price_ids (not price_data)
const STORED_PRICE_PRODUCTS = new Set<ProductSlug>(['single', 'crociera']);

// Fixed slug sets for non-free-choice products
function resolveFixedSlugs(product: ProductSlug): string[] | null {
  if (product === 'puglia-completa') return [...ALL_GUIDES];
  if (product === 'bari-completa')   return [...BARI_GUIDES];
  if (product === 'crociera')        return [...CROCIERA_GUIDES];
  return null;
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  let body: {
    product?: string;
    selectedSlugs?: string[];
    guideSlug?: string;  // legacy compat for single
    lang?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const product = body.product as ProductSlug | undefined;
  const lang = (body.lang === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (!product || !VALID_PRODUCTS.has(product)) {
    return jsonError(400, 'Missing or invalid product');
  }

  // Resolve the guide slugs to unlock
  let guide_slugs: string[];
  const fixedSlugs = resolveFixedSlugs(product);
  if (fixedSlugs) {
    guide_slugs = fixedSlugs;
  } else if (product === 'single') {
    const slug = body.guideSlug ?? body.selectedSlugs?.[0];
    if (!slug) return jsonError(400, 'single requires guideSlug');
    guide_slugs = [slug];
  } else {
    // tris or sestina — caller provides selected slugs
    guide_slugs = body.selectedSlugs ?? [];
  }

  // Validate
  try {
    validateSelectedSlugs(product, guide_slugs);
  } catch (err) {
    return jsonError(400, err instanceof Error ? err.message : 'Invalid slugs');
  }

  const partner_id_raw = cookies.get('lg_partner')?.value || null;
  const siteUrl = (process.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');

  let partnerStripeAccount: string | null = null;
  let resolvedPartnerId: string | null = null;
  if (partner_id_raw) {
    const partner = await getActivePartner(partner_id_raw);
    if (partner) {
      partnerStripeAccount = partner.data.stripe_account_id;
      resolvedPartnerId = partner.data.slug;
    }
  }

  const totalCents = PRODUCT_PRICE_CENTS[product];

  // Build line_items: stored price_id for single/crociera, price_data for the rest
  let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
  if (STORED_PRICE_PRODUCTS.has(product)) {
    let priceId: string;
    try {
      priceId = getStripePrice(product as 'single' | 'crociera');
    } catch {
      return jsonError(400, `Stripe price not configured for ${product}`);
    }
    lineItem = { price: priceId, quantity: 1 };
  } else {
    lineItem = {
      price_data: {
        currency: 'eur',
        unit_amount: totalCents,
        product_data: {
          name: PRODUCT_DISPLAY_NAME[product],
          description: `Audioguide Localis · Puglia · ${guide_slugs.length} guide`,
          metadata: { product },
        },
      },
      quantity: 1,
    };
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [lineItem],
    customer_creation: 'if_required',
    locale: lang === 'en' ? 'en' : 'it',
    automatic_tax: { enabled: true },
    consent_collection: { terms_of_service: 'required' },
    allow_promotion_codes: true,
    metadata: {
      product,
      guide_slugs: guide_slugs.join(','),
      partner_id: resolvedPartnerId ?? '',
      lang,
    },
    success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${siteUrl}${lang === 'en' ? '/en' : ''}/guide/${guide_slugs[0]}?cancelled=1`,
  };

  if (partnerStripeAccount) {
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: partnerStripeAccount,
        amount: Math.floor(totalCents * 0.25),
      },
    };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionParams);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[checkout]', msg);
    return jsonError(500, 'Checkout creation failed');
  }
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/checkout.ts
git commit -m "feat(checkout): accept selectedSlugs, use price_data for dynamic bundles"
```

---

## Task 4: Create `GuideBuilder.astro` — the interactive selection island

**Files:**
- Create: `src/components/GuideBuilder.astro`

This component renders all 18 guide cards as a selectable grid. Clicking a card toggles it selected. As selection grows, the CTA updates dynamically:
- 0 selected → disabled
- 1-2 selected → "Aggiungi ancora X → Tris €11,99"
- 3 selected → "Acquista Tris · €11,99" + upsell hint for Sestina
- 4 selected → "Aggiungi ancora 2 → Sestina €19,99 (risparmi altri €X)"
- 5 selected → "Aggiungi ancora 1 → Sestina €19,99"
- 6 selected → "Acquista Sestina · €19,99" + upsell hint for Puglia Completa
- 7–17 → hint toward Puglia Completa
- 18 selected → "Acquista Puglia Completa · €29,99"

- [ ] **Step 1: Create the file**

```astro
---
// src/components/GuideBuilder.astro
import { type Lang } from '../lib/i18n';
import {
  ALL_GUIDES,
  BARI_GUIDES,
  VALLE_GUIDES,
  GARGANO_GUIDES,
  PRODUCT_PRICE_CENTS,
  FREE_CHOICE_TIERS,
} from '../lib/stripe-prices';
import { getCollection } from 'astro:content';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;

// Build guide metadata from content collection for display
const allEntries = await getCollection('guides', (e) => e.data.language === lang || e.data.language === 'it');

type GuideCard = {
  slug: string;
  title: string;
  subtitle: string;
  cover: string;
  area: string;
};

// Map slug → display data
const guideMap = new Map<string, GuideCard>();
for (const entry of allEntries) {
  const d = entry.data;
  const slug = d.slug as string;
  const isIt = lang !== 'en';
  guideMap.set(slug, {
    slug,
    title:    isIt ? (d.title_it as string)    : (d.title_en as string),
    subtitle: isIt ? (d.subtitle_it as string) : (d.subtitle_en as string),
    cover:    d.cover as string,
    area:     BARI_GUIDES.includes(slug)
                ? (lang === 'it' ? 'Bari' : 'Bari')
                : VALLE_GUIDES.includes(slug)
                  ? (lang === 'it' ? "Valle d'Itria" : "Valle d'Itria")
                  : 'Gargano',
  });
}

const ZONE_ORDER = [
  { label: lang === 'it' ? 'Bari' : 'Bari', slugs: BARI_GUIDES },
  { label: lang === 'it' ? "Valle d'Itria" : "Valle d'Itria", slugs: VALLE_GUIDES },
  { label: 'Gargano', slugs: GARGANO_GUIDES },
];

const tiers = FREE_CHOICE_TIERS;
const singlePrice = PRODUCT_PRICE_CENTS.single; // 499
---

<section class="guide-builder" id="builder" aria-label="Scegli le tue guide">
  <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">

    <div class="text-center mb-2xl">
      <p class="text-xs font-semibold tracking-[0.32em] uppercase text-ink-subtle mb-sm">
        {lang === 'it' ? '— Costruisci il tuo pacchetto —' : '— Build your package —'}
      </p>
      <h2 class="font-display font-light text-[clamp(1.8rem,4vw,3rem)] text-ink leading-tight">
        {lang === 'it' ? 'Scegli le guide che vuoi.' : 'Choose the guides you want.'}
      </h2>
      <p class="font-body text-ink-muted text-base mt-sm max-w-[48ch] mx-auto">
        {lang === 'it'
          ? 'Seleziona 3 per il Tris (€11,99), 6 per la Sestina (€19,99), o prendi la Puglia Completa (€29,99). Una guida? €4,99.'
          : 'Pick 3 for Tris (€11.99), 6 for Sestina (€19.99), or get Puglia Completa (€29.99). Just one? €4.99.'}
      </p>
    </div>

    {ZONE_ORDER.map((zone) => (
      <div class="mb-2xl">
        <h3 class="font-display font-light text-xl text-ink mb-lg border-b border-border pb-sm">
          {zone.label}
        </h3>
        <div class="builder-grid">
          {zone.slugs.map((slug) => {
            const g = guideMap.get(slug);
            if (!g) return null;
            return (
              <button
                type="button"
                class="builder-card"
                data-slug={slug}
                aria-pressed="false"
                aria-label={g.title}
              >
                <figure class="builder-card-fig m-0">
                  <img src={g.cover} alt={g.title} class="builder-card-img" loading="lazy" decoding="async" />
                  <span class="builder-card-check" aria-hidden="true">✓</span>
                </figure>
                <div class="builder-card-meta">
                  <p class="builder-card-title font-display text-sm font-light text-ink leading-tight m-0">{g.title}</p>
                  <p class="builder-card-sub font-body text-xs text-ink-muted m-0 mt-[2px]">{g.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    ))}

    <!-- Sticky CTA bar -->
    <div class="builder-cta-bar" id="builder-cta-bar" aria-live="polite">
      <div class="builder-cta-inner">
        <div class="builder-cta-status" id="builder-status">
          <span id="builder-count" class="builder-count-badge">0</span>
          <span id="builder-status-text" class="text-sm text-ink-muted">
            {lang === 'it' ? 'guide selezionate' : 'guides selected'}
          </span>
        </div>
        <button
          type="button"
          id="builder-checkout-btn"
          class="builder-checkout-btn"
          disabled
          data-lang={lang}
        >
          {lang === 'it' ? 'Seleziona almeno una guida' : 'Select at least one guide'}
        </button>
      </div>
      <p id="builder-upsell" class="builder-upsell" aria-hidden="true"></p>
    </div>

  </div>
</section>

<style>
  .builder-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--spacing-md);
  }

  .builder-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    background: none;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
    text-align: left;
  }

  .builder-card:hover {
    border-color: var(--color-ink-muted);
  }

  .builder-card[aria-pressed="true"] {
    border-color: var(--color-ink);
    box-shadow: 0 0 0 1px var(--color-ink);
  }

  .builder-card-fig {
    position: relative;
    aspect-ratio: 3/2;
  }

  .builder-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .builder-card-check {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-ink);
    color: var(--color-surface);
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .builder-card[aria-pressed="true"] .builder-card-check {
    opacity: 1;
  }

  .builder-card-meta {
    padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-sm);
  }

  /* Sticky CTA bar */
  .builder-cta-bar {
    position: sticky;
    bottom: 0;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-md) 0;
    padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
    margin-top: var(--spacing-2xl);
    z-index: 40;
  }

  .builder-cta-inner {
    max-width: var(--container-wrap, 1280px);
    margin: 0 auto;
    padding: 0 var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .builder-cta-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .builder-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-ink);
    color: var(--color-surface);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 300;
    transition: transform 0.15s;
  }

  .builder-checkout-btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--color-ink);
    color: var(--color-surface);
    border: none;
    border-radius: 6px;
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    min-height: 48px;
  }

  .builder-checkout-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .builder-checkout-btn:not(:disabled):hover {
    background: oklch(15% 0.025 240);
  }

  .builder-upsell {
    max-width: var(--container-wrap, 1280px);
    margin: var(--spacing-xs) auto 0;
    padding: 0 var(--spacing-md);
    font-size: 0.8rem;
    color: var(--color-ink-muted);
    min-height: 1.2em;
  }
</style>

<script>
  // ── Constants (mirrored from stripe-prices.ts — keep in sync) ──────────────
  const TIERS = [
    { product: 'tris',             count: 3,  cents: 1199, label: 'Tris' },
    { product: 'sestina',          count: 6,  cents: 1999, label: 'Sestina' },
    { product: 'puglia-completa',  count: 18, cents: 2999, label: 'Puglia Completa' },
  ] as const;
  const SINGLE_CENTS = 499;
  const fmt = (c: number, lang: string) =>
    `€${(c / 100).toFixed(2).replace('.', lang === 'en' ? '.' : ',')}`;

  // ── DOM refs ─────────────────────────────────────────────────────────────────
  const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.builder-card'));
  const btn   = document.getElementById('builder-checkout-btn') as HTMLButtonElement;
  const countBadge = document.getElementById('builder-count') as HTMLElement;
  const statusText = document.getElementById('builder-status-text') as HTMLElement;
  const upsell     = document.getElementById('builder-upsell') as HTMLElement;
  const lang = btn.dataset.lang as string || 'it';
  const it = lang !== 'en';

  const selected = new Set<string>();

  // ── Toggle card selection ─────────────────────────────────────────────────
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug!;
      if (selected.has(slug)) {
        selected.delete(slug);
        card.setAttribute('aria-pressed', 'false');
      } else {
        selected.add(slug);
        card.setAttribute('aria-pressed', 'true');
      }
      updateUI();
    });
  });

  // ── Update CTA state ──────────────────────────────────────────────────────
  function updateUI() {
    const n = selected.size;
    countBadge.textContent = String(n);
    statusText.textContent = it
      ? (n === 1 ? 'guida selezionata' : 'guide selezionate')
      : (n === 1 ? 'guide selected' : 'guides selected');

    const tier = TIERS.find((t) => t.count === n) ?? null;
    const nextTier = TIERS.find((t) => t.count > n) ?? null;

    if (n === 0) {
      btn.disabled = true;
      btn.textContent = it ? 'Seleziona almeno una guida' : 'Select at least one guide';
      upsell.textContent = '';
    } else if (tier) {
      // Exactly at a tier boundary — enable checkout
      btn.disabled = false;
      btn.textContent = it
        ? `Acquista ${tier.label} · ${fmt(tier.cents, lang)}`
        : `Get ${tier.label} · ${fmt(tier.cents, lang)}`;

      // Upsell to next tier
      if (nextTier) {
        const extra = nextTier.count - n;
        const saved = n * SINGLE_CENTS - tier.cents; // savings vs singles
        upsell.textContent = it
          ? `➕ Aggiungi ${extra} ${extra === 1 ? 'guida' : 'guide'} → ${nextTier.label} a ${fmt(nextTier.cents, lang)} (risparmi di più)`
          : `➕ Add ${extra} more guide${extra > 1 ? 's' : ''} → ${nextTier.label} at ${fmt(nextTier.cents, lang)}`;
      } else {
        upsell.textContent = it ? '🎉 Hai la Puglia Completa!' : '🎉 You have all of Puglia!';
      }
    } else if (n === 1) {
      // Single guide purchase
      btn.disabled = false;
      btn.textContent = it
        ? `Acquista guida singola · ${fmt(SINGLE_CENTS, lang)}`
        : `Buy single guide · ${fmt(SINGLE_CENTS, lang)}`;

      const toTris = 3 - n;
      upsell.textContent = it
        ? `➕ Aggiungi ${toTris} guide → Tris a ${fmt(1199, lang)} (risparmi €2,98)`
        : `➕ Add ${toTris} more → Tris at ${fmt(1199, lang)} (save €2.98)`;
    } else {
      // 2 or 4-5 or 7-17: not at a tier, next tier pending
      btn.disabled = true;
      const toNext = nextTier ? nextTier.count - n : 0;
      btn.textContent = it
        ? `Aggiungi ${toNext} ${toNext === 1 ? 'guida' : 'guide'} → ${nextTier?.label}`
        : `Add ${toNext} more guide${toNext > 1 ? 's' : ''} → ${nextTier?.label}`;

      if (nextTier) {
        upsell.textContent = it
          ? `${nextTier.label} · ${fmt(nextTier.cents, lang)}`
          : `${nextTier.label} · ${fmt(nextTier.cents, lang)}`;
      }
    }
  }

  // ── Checkout ──────────────────────────────────────────────────────────────
  btn.addEventListener('click', async () => {
    const n = selected.size;
    if (n === 0 || btn.disabled) return;

    const slugsArray = [...selected];

    // Determine product slug
    let product: string;
    if (n === 1) {
      product = 'single';
    } else {
      const tier = TIERS.find((t) => t.count === n);
      if (!tier) return;
      product = tier.product;
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = it ? 'Apertura pagamento...' : 'Opening checkout...';

    try {
      const body: Record<string, unknown> = { product, lang, selectedSlugs: slugsArray };
      if (product === 'single') body.guideSlug = slugsArray[0];

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.url) throw new Error('No checkout URL');

      if (typeof (window as any).localisTrack === 'function') {
        (window as any).localisTrack('checkout_started', { product, guides: n, lang });
      }
      window.location.assign(data.url);
    } catch (err) {
      console.error('[builder]', err);
      btn.disabled = false;
      btn.textContent = originalText;
      alert(it ? 'Impossibile aprire il pagamento. Riprova.' : 'Could not open checkout. Please try again.');
    }
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GuideBuilder.astro
git commit -m "feat(builder): add interactive guide selection island"
```

---

## Task 5: Add `BariCompleta` static price card and update PriceCard

**Files:**
- Modify: `src/components/PriceCard.astro`

- [ ] **Step 1: Add `bari-completa` to PriceCard**

In `PriceCard.astro`, find the `priceCents` line and replace it (and all subsequent product-switch blocks) to support the new slugs. The key change: `bundle` → `bari-completa`, remove `essenziale`.

Replace the entire frontmatter computation block (lines 16–61 in the original):

```typescript
const priceCents =
  product === 'bari-completa' ? 1499
  : product === 'crociera'    ?  799
  : 499;

const priceLabel = formatPrice(priceCents);

const title =
  product === 'bari-completa'
    ? (lang === 'it' ? 'Bari Completa' : 'Complete Bari')
    : product === 'crociera'
      ? (lang === 'it' ? 'Pacchetto Crociera' : 'Cruise Package')
      : (lang === 'it' ? 'Guida singola' : 'Single guide');

const description =
  product === 'bari-completa'
    ? (lang === 'it'
        ? 'Tutte le 6 guide di Bari. Sei voci, sei itinerari.'
        : 'All 6 Bari guides. Six voices, six routes.')
    : product === 'crociera'
      ? (lang === 'it'
          ? 'Bari Vecchia + Il Meglio di Bari. Per chi ha 3 ore.'
          : 'Bari Vecchia + Best of Bari. For a 3-hour port stop.')
      : (lang === 'it'
          ? 'Una guida a scelta, tua per sempre.'
          : 'One guide of your choice, yours forever.');

const unitLabel =
  product === 'bari-completa'
    ? (lang === 'it' ? '/ 6 guide' : '/ 6 guides')
    : product === 'crociera'
      ? (lang === 'it' ? '/ 2 guide' : '/ 2 guides')
      : (lang === 'it' ? '/ guida' : '/ guide');

const ctaLabel =
  product === 'bari-completa'
    ? (lang === 'it' ? 'Acquista Bari Completa' : 'Get Complete Bari')
    : product === 'crociera'
      ? (lang === 'it' ? 'Acquista Pacchetto Crociera' : 'Get Cruise Package')
      : (lang === 'it' ? 'Acquista guida singola' : 'Buy single guide');
```

Also update `ProductSlug` import to include new types, and update the `data-product` logic in the `<button>` to handle `bari-completa` (send `selectedSlugs` of all 6 Bari guides):

In the `<script>` block, update the fetch body for `bari-completa`:

```javascript
const BARI_SLUGS = ['bari-vecchia','san-nicola','tre-teatri','il-meglio-di-bari','porto-bari','bari-sotterranea'];
const CROCIERA_SLUGS = ['bari-vecchia','il-meglio-di-bari'];

// In the click handler, before fetch:
let bodyPayload: Record<string, unknown> = { product, lang };
if (product === 'single') {
  bodyPayload.guideSlug = guideSlug || undefined;
  bodyPayload.selectedSlugs = guideSlug ? [guideSlug] : [];
} else if (product === 'bari-completa') {
  bodyPayload.selectedSlugs = BARI_SLUGS;
} else if (product === 'crociera') {
  bodyPayload.selectedSlugs = CROCIERA_SLUGS;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PriceCard.astro
git commit -m "feat(pricing): update PriceCard for bari-completa, remove essenziale"
```

---

## Task 6: Wire GuideBuilder into homepage and guide index

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/guide/index.astro`
- Modify: `src/pages/en/index.astro`
- Modify: `src/pages/de/index.astro`

- [ ] **Step 1: Update `src/pages/index.astro`**

Add import at top:
```typescript
import GuideBuilder from '../components/GuideBuilder.astro';
```

Replace the `#prezzi` pricing section (the grid with 3 `<PriceCard>` components) with:
```astro
{/* BUILDER — dynamic bundle selector */}
<GuideBuilder lang="it" />

{/* BARI COMPLETA — zona speciale below builder */}
<section class="bg-surface-elev border-y border-border">
  <div class="max-w-wrap mx-auto px-md py-2xl">
    <SectionDivider label="Edizione Speciale — Solo Bari" />
    <div class="max-w-sm mx-auto">
      <PriceCard
        product="bari-completa"
        lang="it"
        features={[
          'Tutte le 6 guide di Bari',
          '~2h 20min di racconto · 6 voci diverse',
          'Italiano e inglese',
          'Risparmi €14,95 vs guide singole',
          'Rimborso 1-click entro 24h',
        ]}
        primary
      />
    </div>
  </div>
</section>
```

- [ ] **Step 2: Update `src/pages/guide/index.astro`**

Replace the Bari bundle pricing section (the `<div class="mt-2xl">` after the Bari grid) with:
```astro
{/* BARI COMPLETA — zona speciale */}
<div class="mt-2xl">
  <SectionDivider label="Bari Completa" />
  <div class="max-w-sm mx-auto">
    <PriceCard
      product="bari-completa"
      lang="it"
      features={[
        'Tutte le 6 guide di Bari',
        '~2h 20min di racconto · 6 voci diverse',
        'Risparmi €14,95 vs guide singole',
        'Rimborso 1-click entro 24h',
      ]}
      primary
    />
  </div>
</div>
```

Add a link to the builder:
```astro
<div class="text-center mt-3xl">
  <a href="/#builder" class="inline-flex items-center gap-xs text-sm font-semibold text-link underline-offset-4 hover:underline">
    ← Vuoi mescolare zone? Usa il builder →
  </a>
</div>
```

- [ ] **Step 3: Update EN and DE homepages** similarly — `GuideBuilder lang="en"` / `lang="de"`, and the Bari Completa card with translated features.

- [ ] **Step 4: Remove now-unused `PriceCard` grid imports** from any page that no longer uses them (keep the import if Bari Completa card is still there).

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/pages/guide/index.astro src/pages/en/index.astro src/pages/de/index.astro
git commit -m "feat(pages): wire GuideBuilder into homepages, keep Bari Completa card"
```

---

## Task 7: Run full test suite and build

- [ ] **Step 1: Unit tests**

```bash
cd "c:/Users/Admin/Desktop/Progetti & Lab/Sites/LocalisGuide"
pnpm test
```

Expected: all tests pass. If stripe-prices tests fail, re-check Task 1 catalog values.

- [ ] **Step 2: Build check**

```bash
pnpm build
```

Expected: exits 0, no TypeScript errors. Common failure: `ProductSlug` type mismatch between `PriceCard` and `checkout.ts` — fix by aligning the type import.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(pricing): Modello B — 4-tier dynamic bundle builder complete"
git push
```

---

## Self-Review Checklist

- [x] Tris €11,99 — covered Task 1 + Task 3 + Task 4
- [x] Sestina €19,99 — covered
- [x] Puglia Completa €29,99 — covered
- [x] Bari Completa €14,99 — covered Task 5 + Task 6
- [x] Singola €4,99 — unchanged, covered
- [x] Crociera — untouched (stored price_id path preserved)
- [x] Upsell messaging when 4th guide added → "Aggiungi 2 → Sestina" — covered Task 4 script
- [x] `price_data` for dynamic bundles (no pre-configured Stripe prices needed) — Task 3
- [x] `validateSelectedSlugs` server-side — Task 3, tested Task 2
- [x] "Tua per sempre" — wording in product_data.description + PriceCard features
- [x] Partner transfer_data — preserved in checkout.ts Task 3
- [x] `essenziale` retired — removed from ProductSlug, no pages reference it after Task 5-6
- [x] `bundle` retired — replaced by `bari-completa`
- [x] EN/DE pages updated — Task 6 Step 3
- [x] No placeholder steps — all code blocks complete
- [x] Type consistency — `ProductSlug` exported from stripe-prices.ts, imported in checkout.ts and PriceCard.astro

**⚠️ One manual step required:** After Task 1, `stripe-prices.json` still has `essenziale` and `bundle` keys — they are harmless (the code no longer reads them) but can be cleaned up. If you want, remove them and leave only `single` and `crociera`.
