# Milestone C — Payments (Stripe + Resend + JWT + Magic Link)

> Part of [Phase 0 master plan](2026-04-28-localis-phase-0-foundation.md). Prerequisites: [A](2026-04-28-localis-phase-0-A-foundation.md), [B](2026-04-28-localis-phase-0-B-public-site.md).

**Goal:** Connect Stripe Checkout to the existing CTA buttons. On payment success, a Stripe webhook generates a JWT magic link, sends it to the buyer via Resend, and the buyer can open `/access/<token>` to view a placeholder page (real audio player wired in Milestone D).

**Architecture:** Switch Astro to **hybrid SSR** mode (some pages remain SSG, API routes become serverless functions on Netlify). Stripe Checkout sessions are created server-side with metadata (`product`, `guide_slugs`, `partner_id`, `lang`). The Stripe webhook endpoint verifies signatures, generates a stateless JWT, and sends a transactional email via Resend. The `/access/<token>` page verifies the JWT and lists purchased guides.

**Estimated effort:** 14-18h.

---

## Files

```
src/
├── lib/
│   ├── stripe.ts                          # Stripe SDK wrapper + price catalog
│   ├── jwt.ts                             # token generation/verification
│   ├── resend.ts                          # email sending wrapper
│   ├── emails/
│   │   ├── access-email-it.ts             # IT magic link template
│   │   └── access-email-en.ts             # EN magic link template
│   └── stripe-prices.ts                   # static price ID lookup
├── pages/
│   ├── access/
│   │   └── [token].astro                  # magic link landing (audio in Milestone D)
│   ├── thanks.astro                       # post-checkout success
│   └── api/
│       ├── checkout.ts                    # POST: create Stripe session
│       ├── webhook.ts                     # POST: Stripe webhook handler
│       └── recover.ts                     # POST: re-send magic link by email
├── components/
│   └── CheckoutButton.astro               # reusable Stripe-wired button
└── data/
    └── stripe-prices.json                 # committed price IDs

tests/
└── unit/
    ├── jwt.test.ts                        # token round-trip tests
    └── stripe-prices.test.ts              # price catalog integrity
```

---

## Task 1: Switch Astro to hybrid output + Netlify adapter

**Files:**
- Modify: `astro.config.mjs`, `package.json`
- Create: `.env.example`

- [ ] **Step 1: Install Netlify adapter**

```bash
pnpm add @astrojs/netlify
```

- [ ] **Step 2: Update astro.config.mjs**

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://localis.guide',
  output: 'hybrid',                     // SSG by default, API routes can opt-in to SSR
  adapter: netlify(),
  integrations: [tailwind({ applyBaseStyles: false })],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

- [ ] **Step 3: Add prerender export to all static pages**

Pages must explicitly opt out of SSR. Modify each `.astro` page file under `src/pages/` (NOT under `src/pages/api/`) by adding `export const prerender = true;` to the frontmatter:

Files to modify:
- `src/pages/index.astro`
- `src/pages/en/index.astro`
- `src/pages/about.astro`
- `src/pages/en/about.astro`
- `src/pages/termini.astro`
- `src/pages/en/terms.astro`
- `src/pages/privacy.astro`
- `src/pages/en/privacy.astro`
- `src/pages/404.astro`
- `src/pages/access-invalid.astro`
- `src/pages/recover.astro`
- `src/pages/guide/[slug].astro`
- `src/pages/en/guide/[slug].astro`

For each, add at the top of the frontmatter (right after `---` opening):

```typescript
export const prerender = true;
```

Example for `src/pages/index.astro`:

```astro
---
export const prerender = true;
import Layout from '../components/Layout.astro';
// ... rest unchanged
---
```

- [ ] **Step 4: Create .env.example template**

Write to `.env.example`:

```
# Site
PUBLIC_SITE_URL=https://localis.guide

# Stripe (test mode for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT (generate: openssl rand -hex 32)
JWT_SECRET=change-me-32-random-chars-minimum

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Localis <noreply@localis.guide>

# Plausible (Milestone F)
PUBLIC_PLAUSIBLE_DOMAIN=localis.guide

# Sentry (Milestone F)
SENTRY_DSN=
PUBLIC_SENTRY_DSN=

# Cloudflare R2 (Milestone D)
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=localis-audio
R2_PUBLIC_URL=

# Stripe Connect (Milestone E)
STRIPE_CONNECT_CLIENT_ID=ca_...

# ElevenLabs (Milestone D content production)
ELEVENLABS_API_KEY=
DOMENICO_VOICE_ID=
```

- [ ] **Step 5: Create local .env.local from template**

```bash
cp .env.example .env.local
```

Manually populate Stripe test keys + JWT_SECRET + Resend key:

```
JWT_SECRET=$(openssl rand -hex 32)
```

Use `bash` or PowerShell to generate; paste into `.env.local`.

NOTE: `.env.local` is gitignored. Never commit.

- [ ] **Step 6: Verify hybrid build**

```bash
pnpm build
```

Expected: build succeeds. Output `dist/` now contains both static HTML and a `.netlify/functions-internal/` directory with serverless functions for non-prerendered routes (none yet, but infrastructure ready).

- [ ] **Step 7: Commit**

```bash
git add astro.config.mjs package.json pnpm-lock.yaml .env.example src/pages/index.astro src/pages/en/index.astro src/pages/about.astro src/pages/en/about.astro src/pages/termini.astro src/pages/en/terms.astro src/pages/privacy.astro src/pages/en/privacy.astro src/pages/404.astro src/pages/access-invalid.astro src/pages/recover.astro src/pages/guide/[slug].astro src/pages/en/guide/[slug].astro
git commit -m "feat: switch Astro to hybrid SSR mode with Netlify adapter; mark static pages as prerender"
```

---

## Task 2: Build JWT module with TDD

**Files:**
- Create: `src/lib/jwt.ts`, `tests/unit/jwt.test.ts`

- [ ] **Step 1: Install jsonwebtoken**

```bash
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/jwt.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateAccessToken, verifyAccessToken, type AccessTokenPayload } from '../../src/lib/jwt';

describe('JWT module', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret-min-32-chars-aaaaaaaaaaaa');
  });

  describe('generateAccessToken', () => {
    it('produces a non-empty string', () => {
      const token = generateAccessToken({
        email: 'buyer@test.com',
        guide_slugs: ['bari-vecchia'],
        stripe_session_id: 'cs_test_123',
        partner_id: null,
      });
      expect(token).toBeTypeOf('string');
      expect(token.length).toBeGreaterThan(50);
    });

    it('produces different tokens for different payloads', () => {
      const a = generateAccessToken({
        email: 'buyer1@test.com',
        guide_slugs: ['bari-vecchia'],
        stripe_session_id: 'cs_1',
        partner_id: null,
      });
      const b = generateAccessToken({
        email: 'buyer2@test.com',
        guide_slugs: ['bari-vecchia'],
        stripe_session_id: 'cs_1',
        partner_id: null,
      });
      expect(a).not.toBe(b);
    });
  });

  describe('verifyAccessToken', () => {
    it('round-trips a payload', () => {
      const payload: AccessTokenPayload = {
        email: 'buyer@test.com',
        guide_slugs: ['bari-vecchia', 'porto-bari'],
        stripe_session_id: 'cs_test_456',
        partner_id: 'hotel-excelsior-bari',
      };
      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);
      expect(verified).not.toBeNull();
      expect(verified!.email).toBe('buyer@test.com');
      expect(verified!.guide_slugs).toEqual(['bari-vecchia', 'porto-bari']);
      expect(verified!.partner_id).toBe('hotel-excelsior-bari');
    });

    it('returns null for invalid token', () => {
      expect(verifyAccessToken('not-a-real-token')).toBeNull();
    });

    it('returns null for token signed with different secret', () => {
      const token = generateAccessToken({
        email: 'a@b.com',
        guide_slugs: ['x'],
        stripe_session_id: 'y',
        partner_id: null,
      });
      vi.stubEnv('JWT_SECRET', 'different-secret-min-32-chars-bbbbbbb');
      expect(verifyAccessToken(token)).toBeNull();
    });

    it('returns null for empty/null token', () => {
      expect(verifyAccessToken('')).toBeNull();
      // @ts-expect-error testing runtime null
      expect(verifyAccessToken(null)).toBeNull();
    });

    it('includes iat timestamp', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = generateAccessToken({
        email: 'a@b.com',
        guide_slugs: ['x'],
        stripe_session_id: 'y',
        partner_id: null,
      });
      const verified = verifyAccessToken(token);
      const after = Math.floor(Date.now() / 1000);
      expect(verified!.iat).toBeGreaterThanOrEqual(before);
      expect(verified!.iat).toBeLessThanOrEqual(after);
    });
  });
});
```

- [ ] **Step 3: Run test → expect fail (no implementation yet)**

```bash
pnpm test
```

Expected: FAIL with import errors ("cannot find module '../../src/lib/jwt'").

- [ ] **Step 4: Write src/lib/jwt.ts implementation**

Create `src/lib/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';

export interface AccessTokenPayload {
  email: string;
  guide_slugs: string[];
  stripe_session_id: string;
  partner_id: string | null;
}

export interface VerifiedTokenPayload extends AccessTokenPayload {
  iat: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 chars long');
  }
  return secret;
}

/**
 * Generate a signed JWT for buyer access. No expiry — token is "permanent" until manually revoked.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getSecret(), { algorithm: 'HS256' });
}

/**
 * Verify a JWT and return its payload, or null if invalid/corrupted.
 * Never throws — use null check.
 */
export function verifyAccessToken(token: string | null | undefined): VerifiedTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, getSecret()) as VerifiedTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run test → expect pass**

```bash
pnpm test
```

Expected: all 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/jwt.ts tests/unit/jwt.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add JWT module for access token generation and verification (HS256, no expiry)"
```

---

## Task 3: Set up Stripe + price catalog

**Files:**
- Create: `src/data/stripe-prices.json`, `src/lib/stripe.ts`, `src/lib/stripe-prices.ts`, `tests/unit/stripe-prices.test.ts`

The engineer must first manually create Products and Prices in the Stripe dashboard, then commit the IDs.

- [ ] **Step 1: Install Stripe SDK**

```bash
pnpm add stripe
```

- [ ] **Step 2: Create Products and Prices in Stripe (manual dashboard work)**

Open https://dashboard.stripe.com/test/products. For each of the following, click "Add product":

1. **Product name**: `Localis · Bari Vecchia — Dentro la Città`
   - Description: `Audio guide of Old Bari — 9 minutes narrative`
   - Pricing: `One-time`, `€4.99 EUR`
   - Tax behavior: `Exclusive`
   - Save and copy the Price ID (starts with `price_`).

2. `Localis · Porto di Bari — Dove è Successo Tutto` — €4.99
3. `Localis · San Nicola — Il Santo Rubato` — €4.99
4. `Localis · Il Meglio di Bari — Mangia Prima di Capire` — €4.99
5. `Localis · I Tre Teatri — Fuoco, Musica e Borghesia` — €4.99 (status: soon, but create now)
6. `Localis · Bari Completa (Bundle 3 guide)` — €9.99

After all 6, you have 6 price IDs.

- [ ] **Step 3: Create stripe-prices.json with collected IDs**

Write to `src/data/stripe-prices.json` (REPLACE the placeholder values with your actual IDs):

```json
{
  "bari-vecchia": "price_REPLACE_WITH_REAL_ID",
  "porto-bari": "price_REPLACE_WITH_REAL_ID",
  "san-nicola": "price_REPLACE_WITH_REAL_ID",
  "il-meglio-di-bari": "price_REPLACE_WITH_REAL_ID",
  "tre-teatri": "price_REPLACE_WITH_REAL_ID",
  "bari-completa": "price_REPLACE_WITH_REAL_ID"
}
```

NOTE: price IDs are NOT secrets — they are public identifiers safe to commit.

- [ ] **Step 4: Create src/lib/stripe-prices.ts**

Write to `src/lib/stripe-prices.ts`:

```typescript
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
 * Get Stripe price ID for a product slug. Throws if unknown.
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
```

- [ ] **Step 5: Create test for stripe-prices**

Write `tests/unit/stripe-prices.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  STRIPE_PRICE_IDS,
  getGuideSlugsForProduct,
  getProductPriceCents,
} from '../../src/lib/stripe-prices';

describe('Stripe price catalog', () => {
  it('contains exactly the 6 expected products', () => {
    const keys = Object.keys(STRIPE_PRICE_IDS).sort();
    expect(keys).toEqual([
      'bari-completa',
      'bari-vecchia',
      'il-meglio-di-bari',
      'porto-bari',
      'san-nicola',
      'tre-teatri',
    ]);
  });

  it('all price IDs follow Stripe format prefix', () => {
    for (const [slug, id] of Object.entries(STRIPE_PRICE_IDS)) {
      // Either real (price_<...>) or placeholder (also matches "price_REPLACE...")
      expect(id).toMatch(/^price_/);
    }
  });

  describe('getGuideSlugsForProduct', () => {
    it('single product resolves to its own slug', () => {
      expect(getGuideSlugsForProduct('bari-vecchia')).toEqual(['bari-vecchia']);
    });

    it('bundle resolves to all 3 Bari guides', () => {
      expect(getGuideSlugsForProduct('bari-completa')).toEqual([
        'bari-vecchia',
        'porto-bari',
        'san-nicola',
      ]);
    });
  });

  describe('getProductPriceCents', () => {
    it('single guide is 499 cents', () => {
      expect(getProductPriceCents('bari-vecchia')).toBe(499);
    });

    it('bundle is 999 cents', () => {
      expect(getProductPriceCents('bari-completa')).toBe(999);
    });
  });
});
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all tests pass (assumes stripe-prices.json has placeholder format).

- [ ] **Step 7: Create src/lib/stripe.ts SDK wrapper**

Write to `src/lib/stripe.ts`:

```typescript
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazy-init Stripe client (avoids requiring secret at module load time, useful for build).
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  _stripe = new Stripe(key, {
    apiVersion: '2025-04-30.basil',
    typescript: true,
  });
  return _stripe;
}
```

NOTE: `apiVersion` should match the version Stripe Dashboard shows for your account. Check `https://dashboard.stripe.com/developers` and update if different.

- [ ] **Step 8: Commit**

```bash
git add src/data/stripe-prices.json src/lib/stripe.ts src/lib/stripe-prices.ts tests/unit/stripe-prices.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add Stripe SDK wrapper and price catalog with test coverage"
```

---

## Task 4: Build /api/checkout endpoint

**Files:**
- Create: `src/pages/api/checkout.ts`
- Modify: `src/components/PriceCard.astro` (replace stub alert with real fetch)

- [ ] **Step 1: Create checkout endpoint**

Write to `src/pages/api/checkout.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import {
  getStripePrice,
  getGuideSlugsForProduct,
  type ProductSlug,
} from '../../lib/stripe-prices';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  let body: { product?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const product = body.product as ProductSlug | undefined;
  const lang = (body.lang === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (!product) {
    return jsonError(400, 'Missing product');
  }

  let priceId: string;
  try {
    priceId = getStripePrice(product);
  } catch (err) {
    return jsonError(400, `Unknown product: ${product}`);
  }

  const guide_slugs = getGuideSlugsForProduct(product);

  // Read partner attribution from cookie (Milestone E uses it; null for now)
  const partner_id = cookies.get('lg_partner')?.value || null;

  const siteUrl = (process.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: 'if_required',
      locale: lang === 'en' ? 'en' : 'it',
      automatic_tax: { enabled: true },
      consent_collection: {
        terms_of_service: 'required',
      },
      allow_promotion_codes: true,
      metadata: {
        product,
        guide_slugs: guide_slugs.join(','),
        partner_id: partner_id ?? '',
        lang,
      },
      success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${lang === 'en' ? '/en' : ''}/guide/${guide_slugs[0]}?cancelled=1`,
    });

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

- [ ] **Step 2: Wire PriceCard button to real endpoint**

Modify `src/components/PriceCard.astro` — replace the `<script>` at the bottom with:

```astro
<script>
  document.querySelectorAll<HTMLButtonElement>('.checkout-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const product = btn.dataset.product;
      const lang = btn.dataset.lang || 'it';

      if (!product) return;

      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = lang === 'en' ? 'Opening checkout...' : 'Apertura pagamento...';

      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, lang }),
        });

        if (!res.ok) {
          throw new Error(`Checkout API returned ${res.status}`);
        }

        const data = await res.json();
        if (!data.url) {
          throw new Error('No checkout URL returned');
        }

        window.location.assign(data.url);
      } catch (err) {
        console.error('[checkout]', err);
        btn.disabled = false;
        btn.textContent = originalText;
        alert(
          lang === 'en'
            ? 'Could not open checkout. Please try again in a moment.'
            : 'Impossibile aprire il pagamento. Riprova tra un istante.',
        );
      }
    });
  });
</script>
```

- [ ] **Step 3: Test locally**

Add Stripe TEST keys to `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_<your-test-key>
STRIPE_PUBLISHABLE_KEY=pk_test_<your-test-key>
```

Restart dev server: `pnpm dev`. Open http://localhost:4321/. Click "Ascolta tutto · €4.99" on a guide card → should redirect to Stripe Checkout (hosted page) showing the product. Use test card `4242 4242 4242 4242` with any future expiry, any CVC, any postal code.

If checkout opens correctly, you've confirmed: cookie/metadata flow works, Stripe session creation works.

NOTE: webhook is NOT yet wired, so payment will succeed but no email will be sent. Buyer is redirected to `/thanks` page (which doesn't exist yet — Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/checkout.ts src/components/PriceCard.astro
git commit -m "feat: wire Stripe Checkout endpoint and PriceCard buttons (test mode)"
```

---

## Task 5: Build Resend email module + access email templates

**Files:**
- Create: `src/lib/resend.ts`, `src/lib/emails/access-email-it.ts`, `src/lib/emails/access-email-en.ts`

- [ ] **Step 1: Install Resend SDK**

```bash
pnpm add resend
```

- [ ] **Step 2: Create resend.ts wrapper**

Write to `src/lib/resend.ts`:

```typescript
import { Resend } from 'resend';

let _client: Resend | null = null;

function getResend(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }
  _client = new Resend(key);
  return _client;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const fromAddress = params.from || process.env.RESEND_FROM_EMAIL || 'Localis <noreply@localis.guide>';

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo || 'hello@localis.guide',
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`);
  }
}
```

- [ ] **Step 3: Create IT access email template**

Write to `src/lib/emails/access-email-it.ts`:

```typescript
export interface AccessEmailData {
  accessUrl: string;
  guideTitles: string[];          // titles in user's language
}

export function renderAccessEmailIt(data: AccessEmailData): { subject: string; html: string; text: string } {
  const guidesList = data.guideTitles.map((t) => `🎧  ${t}`).join('\n');
  const guidesListHtml = data.guideTitles
    .map((t) => `<li style="margin: 0.5em 0; font-family: 'Spectral', Georgia, serif; font-size: 18px; color: #1C1510;">🎧 ${escapeHtml(t)}</li>`)
    .join('');

  const subject = data.guideTitles.length === 1
    ? `La tua audioguida è pronta · Localis`
    : `Le tue audioguide sono pronte · Localis`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 32px 20px; background: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1510;">
  <div style="max-width: 540px; margin: 0 auto;">
    <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; margin: 0 0 24px 0; color: #1C1510;">
      Loc<em style="color: #C2521A; font-style: italic;">alis</em>
    </h1>

    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 16px 0;">Ciao,</p>
    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 24px 0;">
      Grazie per aver scelto Localis. La tua audioguida ti aspetta.
    </p>

    <ul style="list-style: none; padding: 0; margin: 0 0 32px 0;">
      ${guidesListHtml}
    </ul>

    <p style="margin: 0 0 32px 0;">
      <a href="${data.accessUrl}" style="display: inline-block; padding: 14px 28px; background: #1C1510; color: #FAF7F2; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Apri la guida →
      </a>
    </p>

    <hr style="border: 0; border-top: 1px solid #D6CDBE; margin: 32px 0;">

    <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: 400; color: #1C1510; margin: 0 0 12px 0;">Come funziona</h2>
    <ol style="font-size: 14px; line-height: 1.7; color: #5A6477; padding-left: 20px; margin: 0 0 24px 0;">
      <li>Apri il link sopra dal tuo telefono</li>
      <li>Clicca play. Cammina. Ascolta.</li>
      <li>Il link è tuo per sempre — riascoltala quando vuoi</li>
      <li>Funziona anche offline dopo il primo play</li>
    </ol>

    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 16px 0;">
      Salvalo nei preferiti del browser. Se cambi telefono, riapri lo stesso link.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 24px 0;">
      Domande? Rispondi a questa email — leggiamo tutto.
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #1C1510; margin: 0;">
      Domenico &amp; Luigi · Localis
    </p>
  </div>
</body>
</html>`;

  const text = `Ciao,

Grazie per aver scelto Localis. La tua audioguida ti aspetta.

${guidesList}

Apri la guida: ${data.accessUrl}

──────────────────────────

Come funziona:
1. Apri il link sopra dal tuo telefono
2. Clicca play. Cammina. Ascolta.
3. Il link è tuo per sempre — riascoltala quando vuoi
4. Funziona anche offline dopo il primo play

Salvalo nei preferiti del browser.
Se cambi telefono, riapri lo stesso link.

Domande? Rispondi a questa email — leggiamo tutto.

Domenico & Luigi · Localis
hello@localis.guide
https://localis.guide
`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

- [ ] **Step 4: Create EN access email template**

Write to `src/lib/emails/access-email-en.ts`:

```typescript
export interface AccessEmailData {
  accessUrl: string;
  guideTitles: string[];
}

export function renderAccessEmailEn(data: AccessEmailData): { subject: string; html: string; text: string } {
  const guidesList = data.guideTitles.map((t) => `🎧  ${t}`).join('\n');
  const guidesListHtml = data.guideTitles
    .map((t) => `<li style="margin: 0.5em 0; font-family: 'Spectral', Georgia, serif; font-size: 18px; color: #1C1510;">🎧 ${escapeHtml(t)}</li>`)
    .join('');

  const subject = data.guideTitles.length === 1
    ? `Your audio guide is ready · Localis`
    : `Your audio guides are ready · Localis`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 32px 20px; background: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1510;">
  <div style="max-width: 540px; margin: 0 auto;">
    <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; margin: 0 0 24px 0; color: #1C1510;">
      Loc<em style="color: #C2521A; font-style: italic;">alis</em>
    </h1>

    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 16px 0;">Hi,</p>
    <p style="font-size: 16px; line-height: 1.6; color: #1C1510; margin: 0 0 24px 0;">
      Thanks for choosing Localis. Your audio guide is ready.
    </p>

    <ul style="list-style: none; padding: 0; margin: 0 0 32px 0;">
      ${guidesListHtml}
    </ul>

    <p style="margin: 0 0 32px 0;">
      <a href="${data.accessUrl}" style="display: inline-block; padding: 14px 28px; background: #1C1510; color: #FAF7F2; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Open the guide →
      </a>
    </p>

    <hr style="border: 0; border-top: 1px solid #D6CDBE; margin: 32px 0;">

    <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: 400; color: #1C1510; margin: 0 0 12px 0;">How it works</h2>
    <ol style="font-size: 14px; line-height: 1.7; color: #5A6477; padding-left: 20px; margin: 0 0 24px 0;">
      <li>Open the link above on your phone</li>
      <li>Tap play. Walk. Listen.</li>
      <li>The link is yours forever — replay anytime</li>
      <li>Works offline after the first play</li>
    </ol>

    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 16px 0;">
      Save it in your browser bookmarks. If you change phones, reopen the same link.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #5A6477; margin: 0 0 24px 0;">
      Questions? Reply to this email — we read everything.
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #1C1510; margin: 0;">
      Domenico &amp; Luigi · Localis
    </p>
  </div>
</body>
</html>`;

  const text = `Hi,

Thanks for choosing Localis. Your audio guide is ready.

${guidesList}

Open the guide: ${data.accessUrl}

──────────────────────────

How it works:
1. Open the link above on your phone
2. Tap play. Walk. Listen.
3. The link is yours forever — replay anytime
4. Works offline after the first play

Save it in your browser bookmarks.
If you change phones, reopen the same link.

Questions? Reply to this email — we read everything.

Domenico & Luigi · Localis
hello@localis.guide
https://localis.guide
`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

- [ ] **Step 5: Verify Resend domain (manual setup)**

Open https://resend.com/domains. Add `localis.guide` as a domain. Copy the DKIM, SPF, and DMARC DNS records and add them to the Netlify DNS dashboard for `localis.guide`. Wait for verification (typically 5-30 minutes).

Once verified, your `from` address `noreply@localis.guide` will pass deliverability checks.

- [ ] **Step 6: Commit**

```bash
git add src/lib/resend.ts src/lib/emails/access-email-it.ts src/lib/emails/access-email-en.ts package.json pnpm-lock.yaml
git commit -m "feat: add Resend wrapper and bilingual access email templates (HTML + text)"
```

---

## Task 6: Build /api/webhook endpoint

**Files:**
- Create: `src/pages/api/webhook.ts`

- [ ] **Step 1: Create webhook handler**

Write to `src/pages/api/webhook.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { generateAccessToken } from '../../lib/jwt';
import { sendEmail } from '../../lib/resend';
import { renderAccessEmailIt } from '../../lib/emails/access-email-it';
import { renderAccessEmailEn } from '../../lib/emails/access-email-en';
import { getCollection } from 'astro:content';
import type Stripe from 'stripe';

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[webhook] Signature verification failed:', msg);
    return new Response(`Signature verification failed: ${msg}`, { status: 400 });
  }

  // Handle relevant events
  if (event.type === 'checkout.session.completed') {
    try {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      console.error('[webhook] checkout.session.completed handler error:', msg);
      // Return 500 so Stripe retries
      return new Response(`Internal error: ${msg}`, { status: 500 });
    }
  }

  return new Response('OK', { status: 200 });
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const email = session.customer_email || session.customer_details?.email;
  const meta = session.metadata || {};

  if (!email) {
    throw new Error(`Session ${session.id} has no customer_email`);
  }

  const guide_slugs = (meta.guide_slugs || '').split(',').filter(Boolean);
  const partner_id = meta.partner_id || null;
  const lang = (meta.lang === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (guide_slugs.length === 0) {
    throw new Error(`Session ${session.id} has no guide_slugs in metadata`);
  }

  // Generate magic link
  const token = generateAccessToken({
    email,
    guide_slugs,
    stripe_session_id: session.id,
    partner_id,
  });

  const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://localis.guide').replace(/\/$/, '');
  const accessUrl = `${siteUrl}/access/${token}`;

  // Look up guide titles in correct language
  const guides = await getCollection('guides');
  const guideTitles = guide_slugs.map((slug) => {
    const g = guides.find((g) => g.data.slug === slug);
    if (!g) return slug;
    return lang === 'en' ? g.data.title_en : g.data.title_it;
  });

  // Render email
  const { subject, html, text } = lang === 'en'
    ? renderAccessEmailEn({ accessUrl, guideTitles })
    : renderAccessEmailIt({ accessUrl, guideTitles });

  // Send via Resend
  await sendEmail({ to: email, subject, html, text });

  console.log(`[webhook] Sent access email to ${email} for guides ${guide_slugs.join(', ')}`);

  // Stripe Connect partner attribution log (Milestone E adds full split logic)
  if (partner_id) {
    console.log(`[webhook] Partner ${partner_id} attributed sale of session ${session.id}`);
  }
}
```

- [ ] **Step 2: Configure Stripe webhook endpoint**

In production deploy, the webhook URL will be `https://localis.guide/api/webhook`. For test mode in local dev, use Stripe CLI to forward webhook events:

```bash
# Install Stripe CLI: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to http://localhost:4321/api/webhook
```

The CLI prints a `whsec_...` webhook signing secret. Copy it into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

For production: open https://dashboard.stripe.com/test/webhooks → "Add endpoint" → URL `https://localis-guide-v2.netlify.app/api/webhook` (Netlify preview). Select events:
- `checkout.session.completed`

Save → copy webhook signing secret → add as Netlify env var `STRIPE_WEBHOOK_SECRET` (in Netlify dashboard → Site settings → Environment variables).

Repeat for production webhook once `localis.guide` apex is cut over.

- [ ] **Step 3: Test webhook locally end-to-end**

With Stripe CLI listener running:

```bash
# Terminal 1
pnpm dev

# Terminal 2
stripe listen --forward-to http://localhost:4321/api/webhook

# Terminal 3 (or browser)
# Trigger a test purchase from http://localhost:4321/
# Use test card 4242 4242 4242 4242
# Complete checkout
```

Expected:
- Stripe Checkout completes successfully.
- Stripe CLI shows webhook event forwarded.
- Browser logs show "Sent access email to ..." in dev console.
- Resend dashboard shows the email was sent (https://resend.com/emails).
- Buyer email inbox receives the access email.

If Resend domain not yet verified, switch `from` temporarily to `onboarding@resend.dev` (Resend's default verified sender for testing). Update `RESEND_FROM_EMAIL` env var.

- [ ] **Step 4: Commit webhook**

```bash
git add src/pages/api/webhook.ts
git commit -m "feat: add Stripe webhook handler that issues JWT magic link via Resend email"
```

---

## Task 7: Build /thanks page + /access/[token] placeholder

**Files:**
- Create: `src/pages/thanks.astro`, `src/pages/access/[token].astro`

- [ ] **Step 1: Create /thanks success page**

Write to `src/pages/thanks.astro`:

```astro
---
import Layout from '../components/Layout.astro';
import { getStripe } from '../lib/stripe';
import { generateAccessToken } from '../lib/jwt';

const sessionId = Astro.url.searchParams.get('session_id');
let directAccessUrl: string | null = null;
let buyerEmail: string | null = null;

// If we have a session_id, attempt to generate a direct-access link as fallback
// (in case email is delayed)
if (sessionId) {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_email || session.customer_details?.email;
    const meta = session.metadata || {};
    const guide_slugs = (meta.guide_slugs || '').split(',').filter(Boolean);

    if (email && guide_slugs.length > 0 && session.payment_status === 'paid') {
      const token = generateAccessToken({
        email,
        guide_slugs,
        stripe_session_id: session.id,
        partner_id: meta.partner_id || null,
      });
      directAccessUrl = `/access/${token}`;
      buyerEmail = email;
    }
  } catch (err) {
    console.error('[thanks] session lookup error', err);
  }
}
---
<Layout title="Grazie · Localis" lang="it">
  <main class="max-w-narrow mx-auto px-md py-3xl text-center">
    <p class="font-display italic text-2xl text-accent mb-md">Grazie.</p>
    <h1 class="font-display text-4xl text-ink mb-lg">La tua guida ti aspetta.</h1>

    {buyerEmail && (
      <p class="text-base text-ink-muted mb-xl max-w-prose mx-auto">
        Ti abbiamo inviato il link di accesso a <strong class="text-ink">{buyerEmail}</strong>.
        Arriva entro 1 minuto, controlla anche lo spam.
      </p>
    )}

    {!buyerEmail && (
      <p class="text-base text-ink-muted mb-xl max-w-prose mx-auto">
        Tra 30 secondi riceverai un'email con il link alla tua audioguida.
        Non vedi nulla? Controlla lo spam, oppure contattaci a hello@localis.guide.
      </p>
    )}

    {directAccessUrl && (
      <a
        href={directAccessUrl}
        class="inline-flex items-center gap-xs px-lg py-md bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline"
      >
        Apri la mia guida ora →
      </a>
    )}
    {!directAccessUrl && (
      <a
        href="/"
        class="inline-flex items-center gap-xs px-md py-sm border border-border text-ink rounded-md font-semibold text-sm hover:border-ink transition-colors duration-fast no-underline"
      >
        Torna in homepage
      </a>
    )}
  </main>
</Layout>
```

- [ ] **Step 2: Create /access/[token] placeholder page**

Write to `src/pages/access/[token].astro`:

```astro
---
import Layout from '../../components/Layout.astro';
import Eyebrow from '../../components/Eyebrow.astro';
import { verifyAccessToken } from '../../lib/jwt';
import { getCollection } from 'astro:content';

const { token } = Astro.params;

if (!token) {
  return Astro.redirect('/access-invalid');
}

const decoded = verifyAccessToken(token);

if (!decoded) {
  return Astro.redirect('/access-invalid');
}

const allGuides = await getCollection('guides');
const userGuides = decoded.guide_slugs
  .map((slug) => allGuides.find((g) => g.data.slug === slug))
  .filter((g): g is NonNullable<typeof g> => Boolean(g));

const lang: 'it' | 'en' = 'it'; // Future: derive from a query param or user preference
---
<Layout title="Le tue guide · Localis" description="" lang={lang}>
  <main class="max-w-wrap mx-auto px-md py-2xl">
    <header class="mb-2xl">
      <Eyebrow class="mb-md">Accesso permanente · {decoded.email}</Eyebrow>
      <h1 class="font-display text-4xl text-ink mb-md">Le tue guide</h1>
      <p class="text-base text-ink-muted max-w-prose">
        Salva questa pagina nei preferiti — è solo tua, vale per sempre.
        Funziona offline dopo il primo play su ogni dispositivo.
      </p>
    </header>

    <div class="flex flex-col gap-2xl">
      {userGuides.map((guide) => (
        <section class="border border-border rounded-lg p-lg bg-surface-elev">
          <h2 class="font-display text-2xl text-ink mb-xs">{guide.data.title_it}</h2>
          <p class="text-sm text-ink-muted mb-md">{guide.data.subtitle_it}</p>

          <div class="bg-surface border border-border rounded-md p-md text-center">
            <p class="text-sm text-ink-muted">
              🔧 Player audio in arrivo nel prossimo deploy.
            </p>
            <p class="text-xs text-ink-subtle mt-xs">
              (Phase 0 Milestone D)
            </p>
          </div>
        </section>
      ))}
    </div>

    <footer class="mt-3xl pt-lg border-t border-border text-center">
      <p class="text-sm text-ink-muted">
        Cambiato telefono? Riapri questo link.
        Smarrita email? <a href="/recover" class="text-link hover:text-link-hover">Recupera l'accesso</a>.
      </p>
    </footer>
  </main>
</Layout>
```

- [ ] **Step 3: Test full flow locally**

```bash
pnpm dev
```

Open http://localhost:4321/. Click "Acquista Bari Completa". Use test card. After payment:
- Land on `/thanks?session_id=cs_test_...`
- See "Apri la mia guida ora →" button (since `/thanks` does session lookup)
- Click → `/access/<token>` renders, shows 3 guide blocks (placeholder players)
- Email arrives in Resend inbox / your test email

- [ ] **Step 4: Commit**

```bash
git add src/pages/thanks.astro src/pages/access/[token].astro
git commit -m "feat: add /thanks success page and /access/[token] placeholder (player in Milestone D)"
```

---

## Task 8: Build /api/recover endpoint + wire form

**Files:**
- Create: `src/pages/api/recover.ts`
- Modify: `src/pages/recover.astro`

- [ ] **Step 1: Create recover endpoint**

Write to `src/pages/api/recover.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { generateAccessToken } from '../../lib/jwt';
import { sendEmail } from '../../lib/resend';
import { renderAccessEmailIt } from '../../lib/emails/access-email-it';
import { renderAccessEmailEn } from '../../lib/emails/access-email-en';
import { getCollection } from 'astro:content';
import type Stripe from 'stripe';

// Simple in-memory rate limit (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || 'unknown';
  if (!rateLimit(ip)) {
    return jsonError(429, 'Too many requests. Try again in 1 hour.');
  }

  let body: { email?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON');
  }

  const email = (body.email || '').trim().toLowerCase();
  const lang = (body.lang === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (!email || !email.includes('@')) {
    return jsonError(400, 'Invalid email');
  }

  // Look up purchases by customer_email in Stripe
  let allGuideSlugs: string[] = [];
  let lastSessionId: string | null = null;
  let lastPartnerId: string | null = null;

  try {
    const stripe = getStripe();
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      customer_details: { email } as never, // search by email; Stripe API accepts this filter
    });

    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue;
      const meta = session.metadata || {};
      const slugs = (meta.guide_slugs || '').split(',').filter(Boolean);
      for (const s of slugs) {
        if (!allGuideSlugs.includes(s)) allGuideSlugs.push(s);
      }
      lastSessionId = session.id;
      lastPartnerId = meta.partner_id || null;
    }
  } catch (err: unknown) {
    console.error('[recover] Stripe lookup error', err);
  }

  if (allGuideSlugs.length === 0) {
    // Don't leak whether email exists; respond with generic success
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate fresh token covering all purchased guides
  const token = generateAccessToken({
    email,
    guide_slugs: allGuideSlugs,
    stripe_session_id: lastSessionId || 'recover',
    partner_id: lastPartnerId,
  });

  const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://localis.guide').replace(/\/$/, '');
  const accessUrl = `${siteUrl}/access/${token}`;

  // Look up guide titles in language
  const guides = await getCollection('guides');
  const guideTitles = allGuideSlugs.map((slug) => {
    const g = guides.find((g) => g.data.slug === slug);
    if (!g) return slug;
    return lang === 'en' ? g.data.title_en : g.data.title_it;
  });

  const { subject, html, text } = lang === 'en'
    ? renderAccessEmailEn({ accessUrl, guideTitles })
    : renderAccessEmailIt({ accessUrl, guideTitles });

  await sendEmail({ to: email, subject, html, text });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Wire recover form to endpoint**

Modify `src/pages/recover.astro` — replace the `<script>` block at bottom with:

```astro
<script>
  const form = document.getElementById('recover-form') as HTMLFormElement | null;
  const result = document.getElementById('recover-result');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = data.get('email');

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.disabled = true;
    submit.textContent = 'Invio in corso...';

    try {
      const res = await fetch('/api/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang: 'it' }),
      });

      if (res.status === 429) {
        alert('Troppe richieste. Riprova tra un\'ora.');
        submit.disabled = false;
        submit.textContent = 'Recupera accesso';
        return;
      }

      // We always show success regardless of whether email matched (privacy)
      form.style.display = 'none';
      result?.classList.remove('hidden');
    } catch (err) {
      console.error('[recover]', err);
      alert('Errore di rete. Riprova.');
      submit.disabled = false;
      submit.textContent = 'Recupera accesso';
    }
  });
</script>
```

- [ ] **Step 3: Test recover flow**

```bash
pnpm dev
```

Open http://localhost:4321/recover. Submit a known buyer email. Verify:
- Form hides, success message shows.
- Email arrives in Resend inbox with magic link.
- Submit unknown email → still shows success (no leak), no email sent.
- Submit 4 times in a row → 4th gets 429.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/recover.ts src/pages/recover.astro
git commit -m "feat: implement recovery endpoint with email lookup, rate limit, and privacy-safe response"
```

---

## Task 9: Add E2E tests for checkout + access flow

**Files:**
- Create: `tests/e2e/checkout.spec.ts`

- [ ] **Step 1: Write checkout flow E2E**

Note: E2E for actual Stripe Checkout is tricky in CI because it loads Stripe's hosted page. For Phase 0 we test the *up to redirect* portion only. Full E2E with Stripe test card requires Stripe test fixtures + auth bypass — defer to integration tests in CI later.

Write to `tests/e2e/checkout.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Checkout flow', () => {
  test('clicking buy redirects to Stripe Checkout (host)', async ({ page }) => {
    await page.goto('/');

    // Click first guide bundle CTA
    const buyButton = page.getByRole('button', { name: /Acquista Bari Completa/i }).first();
    await buyButton.click();

    // Wait for navigation off our site to Stripe
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 });
    expect(page.url()).toContain('checkout.stripe.com');
  });

  test('thanks page handles missing session_id gracefully', async ({ page }) => {
    await page.goto('/thanks');
    await expect(page.getByRole('heading', { name: /tua guida ti aspetta/i })).toBeVisible();
  });

  test('access page with invalid token redirects to access-invalid', async ({ page }) => {
    await page.goto('/access/clearly-not-a-jwt');
    await expect(page).toHaveURL(/access-invalid/);
  });

  test('recover form submits and shows success', async ({ page }) => {
    await page.goto('/recover');
    await page.fill('input[name="email"]', 'test-noreal@example.com');
    await page.click('button[type="submit"]');
    // Form hides, success message appears
    await expect(page.getByText(/Email inviata/)).toBeVisible({ timeout: 10_000 });
  });
});
```

- [ ] **Step 2: Run E2E**

Note: First test requires Stripe test keys to be set in `.env.local` and dev server to be running. Run:

```bash
pnpm test:e2e
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/checkout.spec.ts
git commit -m "test: add E2E coverage for checkout redirect, thanks page, access guards, recover form"
```

---

## Task 10: Final Milestone C verification + tag

- [ ] **Step 1: Set Netlify production env vars**

Open https://app.netlify.com/sites/localis-guide-v2/configuration/env. Add (server-side, not exposed to client):

- `STRIPE_SECRET_KEY` (test mode for now: `sk_test_...`)
- `STRIPE_PUBLISHABLE_KEY` (`pk_test_...`)
- `STRIPE_WEBHOOK_SECRET` (`whsec_...` from Stripe dashboard webhook)
- `JWT_SECRET` (32+ random chars: `openssl rand -hex 32`)
- `RESEND_API_KEY` (`re_...`)
- `RESEND_FROM_EMAIL` (`Localis <noreply@localis.guide>` once domain verified, else `Localis <onboarding@resend.dev>`)
- `PUBLIC_SITE_URL` (`https://localis-guide-v2.netlify.app` for now; update at production cutover)

- [ ] **Step 2: Configure production Stripe webhook**

Stripe dashboard → https://dashboard.stripe.com/test/webhooks → Add endpoint → URL: `https://localis-guide-v2.netlify.app/api/webhook` → Event: `checkout.session.completed` → Save → copy signing secret to Netlify env var `STRIPE_WEBHOOK_SECRET`.

Trigger redeploy after env var changes:

```bash
netlify deploy --build --prod
```

OR push a small change to trigger build.

- [ ] **Step 3: Smoke test end-to-end on Netlify staging URL**

Open `https://localis-guide-v2.netlify.app/` in incognito.

1. Click "Acquista Bari Completa".
2. Stripe Checkout opens with €9.99 + IT locale.
3. Use test card `4242 4242 4242 4242`. Complete payment.
4. Redirect to `/thanks?session_id=cs_test_...`.
5. Page shows "Apri la mia guida ora →" button.
6. Email arrives in your test inbox within 30 seconds.
7. Click magic link in email → `/access/<token>` renders with 3 guides.

If any step fails, check:
- Netlify function logs (`netlify functions:log`)
- Stripe webhook event delivery (Stripe dashboard → Webhooks → Recent deliveries)
- Resend email log

- [ ] **Step 4: Quality gate**

```bash
pnpm check && pnpm test && pnpm test:e2e && pnpm build
```

- [ ] **Step 5: Tag**

```bash
git tag phase-0-C-complete
git push origin phase-0-C-complete
```

- [ ] **Step 6: Update master plan**

Edit master plan → mark Milestone C complete. Commit + push.

---

## Milestone C exit criteria

- [ ] ✅ Astro hybrid mode + Netlify adapter configured
- [ ] ✅ Stripe Products + Prices created in dashboard; IDs in `src/data/stripe-prices.json`
- [ ] ✅ `/api/checkout` creates Stripe sessions with correct metadata
- [ ] ✅ Resend domain `localis.guide` verified (DKIM/SPF/DMARC)
- [ ] ✅ `/api/webhook` verifies signatures, generates JWT, sends email via Resend
- [ ] ✅ `/api/recover` re-sends magic link by email lookup with rate limit
- [ ] ✅ `/thanks` page does session lookup and shows fallback direct link
- [ ] ✅ `/access/[token]` validates JWT and lists purchased guides (placeholder players)
- [ ] ✅ E2E test: homepage → buy → Stripe redirect succeeds
- [ ] ✅ E2E test: invalid token → redirects to access-invalid
- [ ] ✅ Production Netlify deploy with env vars and webhook configured
- [ ] ✅ Manual smoke test: full purchase → email → access page completes
- [ ] ✅ Tag `phase-0-C-complete` pushed

---

➡️ **Next: [Milestone D — Audio access](2026-04-28-localis-phase-0-D-audio-access.md)** (R2 bucket, signed URLs, AudioPlayer component, Service Worker, watermark generation)
