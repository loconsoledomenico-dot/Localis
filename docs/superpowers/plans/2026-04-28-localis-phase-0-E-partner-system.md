# Milestone E — Partner system (cookie + Stripe Connect)

> Part of [Phase 0 master plan](2026-04-28-localis-phase-0-foundation.md). Prerequisites: A, B, C, D complete.

**Goal:** Implement the QR-driven partner attribution and 25% commission split. Visitors arriving via `localis.guide/?p=<slug>` or `/p/<slug>` get a 30-day cookie. Stripe Checkout sessions for cookie-attributed visitors split 25% via `transfer_data.destination` to the partner's Stripe Connect account. Partner landing pages render branded welcome copy.

**Architecture:** A small middleware reads the `?p=` query param on any request and sets `lg_partner` cookie + localStorage. The `/p/<slug>` route renders a custom landing page with partner welcome copy. The `/api/checkout` endpoint adds `payment_intent_data.transfer_data` when the cookie + active partner is present. Partner records live in `src/content/partners/<slug>.mdx` with their `stripe_account_id`.

**Estimated effort:** 10-14h.

---

## Files

```
src/
├── middleware.ts                          # cookie attribution on all requests
├── lib/
│   └── partners.ts                        # partner lookup helpers
├── pages/
│   ├── p/
│   │   └── [slug].astro                   # partner-branded landing
│   ├── diventa-partner.astro              # B2B pitch page (IT)
│   ├── en/
│   │   └── become-a-partner.astro         # B2B pitch (EN)
│   └── api/
│       └── partner-signup.ts              # form submission handler (sends email to admin)
├── content/
│   └── partners/
│       ├── _example-hotel.mdx             # template, prefixed _ to be ignored by collection
│       └── (real partners added later)
└── components/
    └── PartnerForm.astro                  # signup form

scripts/
└── generate-qr-cards.py                   # PDF generator for partner cards

tests/
└── unit/
    └── partners.test.ts                   # partner lookup
```

---

## Task 1: Create middleware for cookie attribution

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write middleware**

Astro middleware runs on every request (SSR routes only; SSG pages are pre-rendered, so attribution there relies on client-side JS — see Task 2).

Write to `src/middleware.ts`:

```typescript
import { defineMiddleware } from 'astro:middleware';

const COOKIE_NAME = 'lg_partner';
const MAX_AGE_DAYS = 30;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

export const onRequest = defineMiddleware(async (context, next) => {
  // Only act on routes where attribution makes sense (skip api, access, static)
  const url = context.url;
  const pathname = url.pathname;
  if (pathname.startsWith('/api/') || pathname.startsWith('/access/') || pathname.startsWith('/_astro/')) {
    return next();
  }

  // Extract ?p=<slug>
  const partnerFromQuery = url.searchParams.get('p');
  if (partnerFromQuery && /^[a-z0-9][a-z0-9-]{2,40}$/i.test(partnerFromQuery)) {
    context.cookies.set(COOKIE_NAME, partnerFromQuery, {
      path: '/',
      maxAge: MAX_AGE_SECONDS,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      httpOnly: false, // accessible to client JS for localStorage backup
    });
  }

  return next();
});
```

- [ ] **Step 2: Add client-side localStorage backup script**

Add to `src/components/Layout.astro` — inside `<body>`, near the bottom (before `<Footer />`):

```astro
<script is:inline>
  // Partner attribution: backup cookie value to localStorage for Safari ITP resilience
  (function() {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('p');
      if (p && /^[a-z0-9][a-z0-9-]{2,40}$/i.test(p)) {
        const cookieVal = document.cookie.split('; ').find(c => c.startsWith('lg_partner='));
        if (!cookieVal) {
          document.cookie = `lg_partner=${p}; path=/; max-age=${30*24*60*60}; SameSite=Lax`;
        }
        localStorage.setItem('lg_partner', p);
        localStorage.setItem('lg_partner_ts', String(Date.now()));
      }

      // On any page load, restore cookie from localStorage if cookie missing but localStorage has value
      const ls = localStorage.getItem('lg_partner');
      const lsTs = parseInt(localStorage.getItem('lg_partner_ts') || '0', 10);
      const expired = Date.now() - lsTs > 30*24*60*60*1000;
      if (ls && !expired) {
        const cookieExists = document.cookie.split('; ').some(c => c.startsWith('lg_partner='));
        if (!cookieExists) {
          document.cookie = `lg_partner=${ls}; path=/; max-age=${30*24*60*60}; SameSite=Lax`;
        }
      }
    } catch (e) {
      // localStorage may be disabled (Safari private mode) — fail silent
    }
  })();
</script>
```

Place this at the END of `<body>`, AFTER `<slot />` and `<Footer />` tag.

- [ ] **Step 3: Test attribution locally**

```bash
pnpm dev
```

Open http://localhost:4321/?p=test-hotel. DevTools → Application → Cookies → see `lg_partner=test-hotel`. Application → Local Storage → see `lg_partner=test-hotel`.

Reload without `?p=` → cookie persists.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts src/components/Layout.astro
git commit -m "feat: add partner cookie attribution middleware + client localStorage backup"
```

---

## Task 2: Build partner registry helpers

**Files:**
- Create: `src/lib/partners.ts`, `tests/unit/partners.test.ts`

- [ ] **Step 1: Write partner test**

Write to `tests/unit/partners.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isValidPartnerSlug } from '../../src/lib/partners';

describe('partner helpers', () => {
  describe('isValidPartnerSlug', () => {
    it('accepts kebab-case slugs', () => {
      expect(isValidPartnerSlug('hotel-excelsior-bari')).toBe(true);
      expect(isValidPartnerSlug('bb-fronte-cattedrale')).toBe(true);
      expect(isValidPartnerSlug('a1b2c3')).toBe(true);
    });

    it('rejects invalid characters', () => {
      expect(isValidPartnerSlug('Hotel/Excelsior')).toBe(false);
      expect(isValidPartnerSlug('hotel excelsior')).toBe(false);
      expect(isValidPartnerSlug('<script>')).toBe(false);
    });

    it('rejects too short or too long slugs', () => {
      expect(isValidPartnerSlug('ab')).toBe(false);
      expect(isValidPartnerSlug('a'.repeat(50))).toBe(false);
    });

    it('rejects slugs starting with hyphen', () => {
      expect(isValidPartnerSlug('-leading-hyphen')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Write partners.ts**

Write to `src/lib/partners.ts`:

```typescript
import { getCollection, getEntry } from 'astro:content';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,40}$/i;

export function isValidPartnerSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return SLUG_PATTERN.test(slug);
}

/**
 * Get an active partner by slug, or null if not found / not active.
 * Used during checkout for Stripe Connect attribution.
 */
export async function getActivePartner(slug: string) {
  if (!isValidPartnerSlug(slug)) return null;
  try {
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
  return getCollection('partners');
}
```

- [ ] **Step 3: Run tests → expect pass**

```bash
pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/partners.ts tests/unit/partners.test.ts
git commit -m "feat: add partner registry helpers with slug validation"
```

---

## Task 3: Update /api/checkout for Stripe Connect split

**Files:**
- Modify: `src/pages/api/checkout.ts`

- [ ] **Step 1: Add Connect transfer_data when partner present**

Open `src/pages/api/checkout.ts`. Update the `sessionParams` block to include Stripe Connect transfer when partner is attributed:

Replace the existing `stripe.checkout.sessions.create({ ... })` block with:

```typescript
import { getActivePartner } from '../../lib/partners';
import { getProductPriceCents } from '../../lib/stripe-prices';

// ... (existing code at the top stays unchanged)

  // Look up partner (if cookie present + valid + active)
  let partnerStripeAccount: string | null = null;
  let resolvedPartnerId: string | null = null;
  if (partner_id) {
    const partner = await getActivePartner(partner_id);
    if (partner) {
      partnerStripeAccount = partner.data.stripe_account_id;
      resolvedPartnerId = partner.data.slug;
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
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
    cancel_url: `${siteUrl}${lang === 'en' ? '/en' : ''}/guide/${guide_slugs[0]}?cancelled=1`,
  };

  // Stripe Connect: split 25% to partner if attribution active
  if (partnerStripeAccount) {
    const totalCents = getProductPriceCents(product);
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
    // ... rest unchanged (return Response)
```

The full updated file:

```typescript
import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import {
  getStripePrice,
  getGuideSlugsForProduct,
  getProductPriceCents,
  type ProductSlug,
} from '../../lib/stripe-prices';
import { getActivePartner } from '../../lib/partners';
import type Stripe from 'stripe';

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
  const partner_id_raw = cookies.get('lg_partner')?.value || null;

  const siteUrl = (process.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');

  // Resolve partner Stripe Connect account (only if cookie matches active partner)
  let partnerStripeAccount: string | null = null;
  let resolvedPartnerId: string | null = null;
  if (partner_id_raw) {
    const partner = await getActivePartner(partner_id_raw);
    if (partner) {
      partnerStripeAccount = partner.data.stripe_account_id;
      resolvedPartnerId = partner.data.slug;
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
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
    cancel_url: `${siteUrl}${lang === 'en' ? '/en' : ''}/guide/${guide_slugs[0]}?cancelled=1`,
  };

  if (partnerStripeAccount) {
    const totalCents = getProductPriceCents(product);
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
git commit -m "feat: add Stripe Connect 25% transfer_data split when partner cookie attributed"
```

---

## Task 4: Build partner landing page /p/[slug]

**Files:**
- Create: `src/pages/p/[slug].astro`

- [ ] **Step 1: Create partner landing**

Write to `src/pages/p/[slug].astro`:

```astro
---
import Layout from '../../components/Layout.astro';
import Eyebrow from '../../components/Eyebrow.astro';
import GuideCard from '../../components/GuideCard.astro';
import PriceCard from '../../components/PriceCard.astro';
import SectionDivider from '../../components/SectionDivider.astro';
import { getCollection, getEntry } from 'astro:content';

export async function getStaticPaths() {
  const partners = await getCollection('partners');
  return partners
    .filter((p) => p.data.status === 'active')
    .map((p) => ({
      params: { slug: p.data.slug },
      props: { partner: p },
    }));
}

const { partner } = Astro.props;

const guides = (await getCollection('guides'))
  .filter((g) => g.data.city === 'bari' && g.data.status === 'live')
  .sort((a, b) => a.data.published_at.getTime() - b.data.published_at.getTime());

const welcomeIt =
  partner.data.custom_landing_copy_it ||
  `Benvenuto. Goditi Bari come la racconterebbe chi ci vive — direttamente dalla tua stanza al ${partner.data.display_name}.`;
---
<Layout
  title={`Localis · benvenuto da ${partner.data.display_name}`}
  description={`Audioguide narrative di Bari. Goditi un'esperienza speciale grazie al ${partner.data.display_name}.`}
  lang="it"
>
  <section class="bg-surface-elev border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-2xl text-center">
      <Eyebrow class="justify-center mb-md">In collaborazione con {partner.data.display_name}</Eyebrow>
      <h1 class="font-display text-4xl text-ink leading-tight mb-md max-w-prose mx-auto">
        Ascolta Bari come una storia. <em class="text-accent">Mentre sei lì.</em>
      </h1>
      <p class="text-lg text-ink-muted max-w-prose mx-auto">{welcomeIt}</p>
    </div>
  </section>

  <section class="max-w-wrap mx-auto px-md py-2xl">
    <SectionDivider label="Le guide disponibili" />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
      {guides.map((g, i) => (
        <GuideCard guide={g} lang="it" index={i} />
      ))}
    </div>
  </section>

  <section class="max-w-wrap mx-auto px-md py-2xl">
    <SectionDivider label="Scegli il tuo piano" />
    <div class="grid grid-cols-1 md:grid-cols-2 gap-md max-w-3xl mx-auto">
      <PriceCard
        product="single"
        guideSlug="bari-vecchia"
        lang="it"
        features={[
          '1 guida a scelta',
          'Accesso illimitato',
          'Senza app, dal browser',
          'Italiano e inglese',
        ]}
      />
      <PriceCard
        product="bundle"
        lang="it"
        primary
        features={[
          'Bari Vecchia — Dentro la Città',
          'Porto di Bari — Dove è Successo Tutto',
          'San Nicola — Il Santo Rubato',
          'Accesso illimitato · Senza app',
        ]}
      />
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Add prerender export at top of frontmatter**

Add `export const prerender = true;` at the start of the frontmatter. Astro will pre-render one HTML file per active partner at build time.

The cookie attribution still works because the middleware also runs on these pre-rendered pages when served via Netlify (they hit the function pipeline through the adapter on first request, where middleware sees `?p=` → sets cookie). For pure static, the client-side script in Layout still handles attribution.

To set the partner cookie on direct `/p/<slug>` visits (no `?p=` query), add a small script to this page that sets the cookie based on the URL slug:

Append to `src/pages/p/[slug].astro` after `</Layout>`:

```astro
<script define:vars={{ slug: partner.data.slug }}>
  // Set partner cookie based on URL slug (canonical attribution for direct /p/<slug> visits)
  try {
    document.cookie = `lg_partner=${slug}; path=/; max-age=${30*24*60*60}; SameSite=Lax`;
    localStorage.setItem('lg_partner', slug);
    localStorage.setItem('lg_partner_ts', String(Date.now()));
  } catch (e) {}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/p/[slug].astro
git commit -m "feat: add partner-branded landing page at /p/[slug] with cookie attribution"
```

---

## Task 5: Build /diventa-partner pitch page + signup form + API

**Files:**
- Create: `src/pages/diventa-partner.astro`, `src/pages/api/partner-signup.ts`, `src/components/PartnerForm.astro`

- [ ] **Step 1: Create PartnerForm component**

Write to `src/components/PartnerForm.astro`:

```astro
---
import { type Lang } from '../lib/i18n';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;

const labels = lang === 'it' ? {
  business_name: 'Nome attività',
  type: 'Tipo',
  type_options: { hotel: 'Hotel', bb: 'B&B', bar: 'Bar / Caffè', restaurant: 'Ristorante', shop: 'Negozio', other: 'Altro' },
  city: 'Città',
  email: 'Email di contatto',
  phone: 'Telefono (opzionale)',
  message: 'Messaggio (opzionale)',
  submit: 'Diventa partner',
  submitting: 'Invio in corso...',
  success: 'Richiesta ricevuta. Ti contattiamo entro 48 ore.',
} : {
  business_name: 'Business name',
  type: 'Type',
  type_options: { hotel: 'Hotel', bb: 'B&B', bar: 'Bar / Café', restaurant: 'Restaurant', shop: 'Shop', other: 'Other' },
  city: 'City',
  email: 'Contact email',
  phone: 'Phone (optional)',
  message: 'Message (optional)',
  submit: 'Become a partner',
  submitting: 'Sending...',
  success: 'Request received. We\'ll contact you within 48 hours.',
};
---
<form id="partner-form" class="flex flex-col gap-md max-w-md">
  <div class="flex flex-col gap-2xs">
    <label for="business_name" class="text-sm font-semibold text-ink">{labels.business_name}</label>
    <input type="text" id="business_name" name="business_name" required class="px-md py-sm bg-surface border border-border rounded-md text-base focus:border-accent focus:outline-none" />
  </div>

  <div class="flex flex-col gap-2xs">
    <label for="type" class="text-sm font-semibold text-ink">{labels.type}</label>
    <select id="type" name="type" required class="px-md py-sm bg-surface border border-border rounded-md text-base focus:border-accent focus:outline-none">
      {Object.entries(labels.type_options).map(([k, v]) => (
        <option value={k}>{v}</option>
      ))}
    </select>
  </div>

  <div class="flex flex-col gap-2xs">
    <label for="city" class="text-sm font-semibold text-ink">{labels.city}</label>
    <input type="text" id="city" name="city" required value="Bari" class="px-md py-sm bg-surface border border-border rounded-md text-base focus:border-accent focus:outline-none" />
  </div>

  <div class="flex flex-col gap-2xs">
    <label for="email" class="text-sm font-semibold text-ink">{labels.email}</label>
    <input type="email" id="email" name="email" required class="px-md py-sm bg-surface border border-border rounded-md text-base focus:border-accent focus:outline-none" />
  </div>

  <div class="flex flex-col gap-2xs">
    <label for="phone" class="text-sm font-semibold text-ink">{labels.phone}</label>
    <input type="tel" id="phone" name="phone" class="px-md py-sm bg-surface border border-border rounded-md text-base focus:border-accent focus:outline-none" />
  </div>

  <div class="flex flex-col gap-2xs">
    <label for="message" class="text-sm font-semibold text-ink">{labels.message}</label>
    <textarea id="message" name="message" rows="3" class="px-md py-sm bg-surface border border-border rounded-md text-base focus:border-accent focus:outline-none resize-none"></textarea>
  </div>

  <button type="submit" class="px-md py-sm bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast">
    {labels.submit}
  </button>
</form>

<div id="partner-form-success" class="mt-md max-w-md hidden">
  <p class="text-base text-success">{labels.success}</p>
</div>

<script>
  const form = document.getElementById('partner-form') as HTMLFormElement | null;
  const success = document.getElementById('partner-form-success');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      business_name: data.get('business_name'),
      type: data.get('type'),
      city: data.get('city'),
      email: data.get('email'),
      phone: data.get('phone'),
      message: data.get('message'),
    };

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const original = submit.textContent;
    submit.disabled = true;
    submit.textContent = submit.dataset.submitting || 'Sending...';

    try {
      const res = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      form.style.display = 'none';
      success?.classList.remove('hidden');
    } catch (err) {
      console.error('[partner-signup]', err);
      submit.disabled = false;
      submit.textContent = original;
      alert('Errore di rete. Riprova.');
    }
  });
</script>
```

- [ ] **Step 2: Create /api/partner-signup endpoint**

Write to `src/pages/api/partner-signup.ts`:

```typescript
import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/resend';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const businessName = String(body.business_name || '').trim().slice(0, 200);
  const type = String(body.type || '').trim().slice(0, 50);
  const city = String(body.city || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 50);
  const message = String(body.message || '').trim().slice(0, 2000);

  if (!businessName || !email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html><body style="font-family: monospace; padding: 24px;">
<h1>Nuova richiesta partner</h1>
<dl>
  <dt><b>Attività:</b></dt><dd>${esc(businessName)}</dd>
  <dt><b>Tipo:</b></dt><dd>${esc(type)}</dd>
  <dt><b>Città:</b></dt><dd>${esc(city)}</dd>
  <dt><b>Email:</b></dt><dd><a href="mailto:${esc(email)}">${esc(email)}</a></dd>
  <dt><b>Telefono:</b></dt><dd>${esc(phone)}</dd>
  <dt><b>Messaggio:</b></dt><dd>${esc(message).replace(/\n/g, '<br>')}</dd>
</dl>
</body></html>`;

  const text = `Nuova richiesta partner

Attività: ${businessName}
Tipo: ${type}
Città: ${city}
Email: ${email}
Telefono: ${phone}
Messaggio: ${message}
`;

  try {
    await sendEmail({
      to: 'hello@localis.guide',
      replyTo: email,
      subject: `Partner: ${businessName} (${city})`,
      html,
      text,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[partner-signup]', msg);
    return new Response(JSON.stringify({ error: 'Send failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
```

- [ ] **Step 3: Create /diventa-partner page**

Write to `src/pages/diventa-partner.astro`:

```astro
---
export const prerender = true;
import Layout from '../components/Layout.astro';
import Eyebrow from '../components/Eyebrow.astro';
import PartnerForm from '../components/PartnerForm.astro';
---
<Layout
  title="Diventa partner · Localis"
  description="Diventa partner Localis: ospiti più felici, 25% di commissione su ogni acquisto, zero gestione."
  lang="it"
>
  <section class="max-w-wrap mx-auto px-md py-2xl grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-2xl items-start">
    <div>
      <Eyebrow class="mb-md">Programma partner</Eyebrow>
      <h1 class="font-display text-4xl text-ink leading-tight mb-md">
        Regala ai tuoi ospiti Bari come <em class="text-accent">loro la vorrebbero conoscere</em>.
      </h1>
      <p class="text-lg text-ink-muted leading-relaxed max-w-prose mb-2xl">
        Guadagni tu ogni volta che la scelgono. Niente da gestire.
      </p>

      <ul class="flex flex-col gap-md mb-2xl">
        <li class="flex items-start gap-md">
          <span class="text-accent flex-shrink-0 mt-1">✦</span>
          <div>
            <p class="font-semibold text-ink">25% di commissione su ogni acquisto</p>
            <p class="text-sm text-ink-muted">Pagamento automatico via Stripe Connect, bonifico mensile sul tuo conto.</p>
          </div>
        </li>
        <li class="flex items-start gap-md">
          <span class="text-accent flex-shrink-0 mt-1">✦</span>
          <div>
            <p class="font-semibold text-ink">Card QR plastificate gratis</p>
            <p class="text-sm text-ink-muted">5 card welcome kit per piazzare in stanze, lobby, tavoli.</p>
          </div>
        </li>
        <li class="flex items-start gap-md">
          <span class="text-accent flex-shrink-0 mt-1">✦</span>
          <div>
            <p class="font-semibold text-ink">Setup in 10 minuti</p>
            <p class="text-sm text-ink-muted">Compila Stripe Connect, ricevi le card, le piazzi. Stop.</p>
          </div>
        </li>
        <li class="flex items-start gap-md">
          <span class="text-accent flex-shrink-0 mt-1">✦</span>
          <div>
            <p class="font-semibold text-ink">Niente da gestire</p>
            <p class="text-sm text-ink-muted">I tuoi ospiti scansionano, comprano, ascoltano. Tu incassi.</p>
          </div>
        </li>
      </ul>

      <h2 class="font-display text-2xl text-ink mb-md">Come funziona</h2>
      <ol class="flex flex-col gap-sm text-base text-ink-muted leading-relaxed mb-2xl pl-lg list-decimal">
        <li>Compila il modulo qui a fianco — ti contattiamo entro 48 ore</li>
        <li>Riceviamo i tuoi dati e ti inviamo il link Stripe Connect (5-10 min per completarlo)</li>
        <li>Una volta attivato, ti mandiamo le 5 card QR per posta</li>
        <li>Ogni acquisto via QR del tuo locale = 25% va sul tuo conto Stripe automaticamente</li>
      </ol>
    </div>

    <aside class="lg:sticky lg:top-24">
      <h2 class="font-display text-2xl text-ink mb-md">Richiesta partner</h2>
      <PartnerForm lang="it" />
    </aside>
  </section>
</Layout>
```

- [ ] **Step 4: Test signup flow**

```bash
pnpm dev
```

Open http://localhost:4321/diventa-partner. Fill form → submit → check `hello@localis.guide` inbox for the request email.

- [ ] **Step 5: Commit**

```bash
git add src/pages/diventa-partner.astro src/pages/api/partner-signup.ts src/components/PartnerForm.astro
git commit -m "feat: add partner pitch page with form and email-based signup endpoint"
```

---

## Task 6: Create example partner MDX template

**Files:**
- Create: `src/content/partners/_example-hotel.mdx`

To document the schema, create a template file. Real partners go through the signup form, get manually onboarded via Stripe Connect, then a corresponding MDX file is created.

- [ ] **Step 1: Create template (note leading underscore = ignored by Astro Content Collections)**

Write to `src/content/partners/_example-hotel.mdx`:

```mdx
---
slug: example-hotel-bari
display_name: "Hotel Esempio Bari"
type: hotel
city: bari
contact_email: direzione@esempio.it
stripe_account_id: acct_REPLACE_WITH_REAL_CONNECT_ID
commission_rate: 0.25
created_at: 2026-05-01
status: active
custom_landing_copy_it: "Welcome guest dell'Hotel Esempio. Goditi Bari come la racconterebbe Domenico, vicino di casa nostro."
custom_landing_copy_en: "Welcome guest of Hotel Esempio. Enjoy Bari as Domenico would tell it — our local neighbor."
---

# Hotel Esempio Bari

Template partner. Modificare e rinominare in `<actual-slug>.mdx` (rimuovere underscore prefix) quando si onboardia un partner reale.

Il `stripe_account_id` deve essere ottenuto dal completamento dell'onboarding Stripe Connect Standard del partner.
```

NOTE: file starts with `_` so Astro's Content Collection loader ignores it (per Astro convention). When onboarding a real partner, copy this file to `<real-slug>.mdx` with real data.

- [ ] **Step 2: Commit template**

```bash
git add src/content/partners/_example-hotel.mdx
git commit -m "docs: add partner MDX template for onboarding reference"
```

---

## Task 7: Build QR card generator script

**Files:**
- Create: `scripts/generate-qr-cards.py`

- [ ] **Step 1: Add Python deps**

Update `scripts/pyproject.toml` deps:

```toml
[project]
name = "localis-scripts"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "boto3>=1.35.0",
    "python-dotenv>=1.0.0",
    "qrcode[pil]>=7.4.2",
    "reportlab>=4.0.0",
    "pyyaml>=6.0",
]
```

Install:

```bash
pip install qrcode[pil] reportlab pyyaml
```

- [ ] **Step 2: Create script**

Write to `scripts/generate-qr-cards.py`:

```python
"""
Generate print-ready PDF of QR cards (9×13cm) for a partner.

Usage:
  python scripts/generate-qr-cards.py <partner-slug> [--count 5]

Output: build/qr-cards/<partner-slug>.pdf
"""
import argparse
import sys
from pathlib import Path

import qrcode
import yaml
from reportlab.lib.colors import Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
PARTNERS_DIR = ROOT / 'src' / 'content' / 'partners'
SITE_URL = 'https://localis.guide'

# Card size 9x13 cm, 2 per A4 page
CARD_W = 90 * mm
CARD_H = 130 * mm
A4_W, A4_H = A4
GAP = 8 * mm

INK = Color(0.11, 0.08, 0.06)         # navy-black
ACCENT = Color(0.76, 0.32, 0.10)      # terracotta
SURFACE = Color(0.98, 0.97, 0.95)     # parchment


def parse_frontmatter(mdx_path: Path) -> dict:
    text = mdx_path.read_text(encoding='utf-8')
    if not text.startswith('---'):
        raise ValueError(f'No frontmatter in {mdx_path}')
    end = text.find('---', 3)
    if end < 0:
        raise ValueError(f'Bad frontmatter in {mdx_path}')
    return yaml.safe_load(text[3:end])


def make_qr(url: str) -> Path:
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    out = ROOT / 'build' / 'qr.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    return out


def draw_card(c: canvas.Canvas, x: float, y: float, partner: dict, qr_path: Path) -> None:
    # Background
    c.setFillColor(SURFACE)
    c.rect(x, y, CARD_W, CARD_H, fill=1, stroke=0)

    # QR (centered, top half)
    qr_size = 50 * mm
    qr_x = x + (CARD_W - qr_size) / 2
    qr_y = y + CARD_H - qr_size - 18 * mm
    c.drawImage(str(qr_path), qr_x, qr_y, qr_size, qr_size)

    # Tagline (Italian — Spectral italic, but using built-in Times-Italic since we don't ship Spectral here)
    c.setFillColor(INK)
    c.setFont('Times-Roman', 14)
    c.drawCentredString(x + CARD_W / 2, qr_y - 12 * mm, 'Ascolta Bari')
    c.setFont('Times-Italic', 14)
    c.drawCentredString(x + CARD_W / 2, qr_y - 18 * mm, 'come una storia.')

    # Subline
    c.setFillColor(INK)
    c.setFont('Helvetica', 8)
    c.drawCentredString(x + CARD_W / 2, qr_y - 28 * mm, 'Audioguide narrative · No app')

    # Partner brand
    c.setFillColor(ACCENT)
    c.setFont('Helvetica-Bold', 7)
    c.drawCentredString(x + CARD_W / 2, y + 12 * mm, f'In collaborazione con {partner["display_name"].upper()}')

    # localis.guide
    c.setFillColor(INK)
    c.setFont('Helvetica', 8)
    c.drawCentredString(x + CARD_W / 2, y + 6 * mm, 'localis.guide')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('slug')
    ap.add_argument('--count', type=int, default=5, help='Number of cards to generate (max 10 = 5 A4 pages)')
    args = ap.parse_args()

    mdx = PARTNERS_DIR / f'{args.slug}.mdx'
    if not mdx.exists():
        print(f'Partner MDX not found: {mdx}', file=sys.stderr)
        return 1

    partner = parse_frontmatter(mdx)
    url = f'{SITE_URL}/p/{partner["slug"]}'
    qr_path = make_qr(url)

    out_dir = ROOT / 'build' / 'qr-cards'
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / f'{args.slug}.pdf'

    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    cards_per_page = 2
    pages = (args.count + cards_per_page - 1) // cards_per_page

    margin_x = (A4_W - CARD_W) / 2
    margin_y = (A4_H - 2 * CARD_H - GAP) / 2

    cards_drawn = 0
    for _ in range(pages):
        for slot in range(cards_per_page):
            if cards_drawn >= args.count:
                break
            y = margin_y + (1 - slot) * (CARD_H + GAP)
            draw_card(c, margin_x, y, partner, qr_path)
            cards_drawn += 1
        c.showPage()

    c.save()
    print(f'Generated {cards_drawn} cards → {pdf_path}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
```

- [ ] **Step 3: Test with example partner**

```bash
# Rename example to make it active for testing
cp src/content/partners/_example-hotel.mdx src/content/partners/example-hotel.mdx
python scripts/generate-qr-cards.py example-hotel
# Open generated PDF
open build/qr-cards/example-hotel.pdf
# Cleanup test partner
rm src/content/partners/example-hotel.mdx
```

Verify: PDF has 5 cards across A4 pages with QR + tagline + brand placement.

- [ ] **Step 4: Add build/ to .gitignore**

Append to `.gitignore`:

```
build/
```

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-qr-cards.py scripts/pyproject.toml .gitignore
git commit -m "feat: add Python script to generate print-ready partner QR card PDFs"
```

---

## Task 8: E2E test partner attribution

**Files:**
- Create: `tests/e2e/partner-attribution.spec.ts`

- [ ] **Step 1: Write tests**

Write to `tests/e2e/partner-attribution.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Partner attribution', () => {
  test('?p= query param sets cookie', async ({ page, context }) => {
    await page.goto('/?p=test-hotel-bari');
    const cookies = await context.cookies();
    const cookie = cookies.find((c) => c.name === 'lg_partner');
    expect(cookie?.value).toBe('test-hotel-bari');
  });

  test('cookie persists across page navigation', async ({ page, context }) => {
    await page.goto('/?p=test-hotel-bari');
    await page.goto('/guide/bari-vecchia');
    const cookies = await context.cookies();
    const cookie = cookies.find((c) => c.name === 'lg_partner');
    expect(cookie?.value).toBe('test-hotel-bari');
  });

  test('invalid slug pattern is rejected (no cookie set)', async ({ page, context }) => {
    await page.goto('/?p=<script>alert(1)</script>');
    const cookies = await context.cookies();
    const cookie = cookies.find((c) => c.name === 'lg_partner');
    expect(cookie).toBeUndefined();
  });

  test('localStorage backup is set', async ({ page }) => {
    await page.goto('/?p=test-hotel-bari');
    const ls = await page.evaluate(() => localStorage.getItem('lg_partner'));
    expect(ls).toBe('test-hotel-bari');
  });

  test('partner pitch page renders form', async ({ page }) => {
    await page.goto('/diventa-partner');
    await expect(page.getByRole('heading', { name: /Regala ai tuoi ospiti/i })).toBeVisible();
    await expect(page.locator('#partner-form')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E**

```bash
pnpm test:e2e
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/partner-attribution.spec.ts
git commit -m "test: add E2E coverage for partner cookie attribution and pitch page"
```

---

## Task 9: Final Milestone E verification + tag

- [ ] **Step 1: Quality gate**

```bash
pnpm check && pnpm test && pnpm test:e2e && pnpm build
```

- [ ] **Step 2: Manual partner flow test (with Stripe Connect test mode)**

To test the actual transfer_data split, you need a Stripe Connect test account. Skip this verification for Phase 0 launch if no real partner is yet onboarded — the code path is unit-tested, and the first real partner test happens at first partner onboarding in Phase 0 Phase 2 timeline.

Manual verification steps when first partner exists:
1. Create a Stripe Express test account on https://dashboard.stripe.com/test/connect/accounts → "Add test account" → Standard
2. Save the `acct_test_xxx` ID
3. Create test partner MDX `src/content/partners/test-hotel.mdx` with that account ID
4. Visit `/p/test-hotel` → verify cookie set
5. Buy a guide → check Stripe → Payment shows "destination charge" with 25% transferred to test account

- [ ] **Step 3: Tag**

```bash
git tag phase-0-E-complete
git push origin phase-0-E-complete
```

- [ ] **Step 4: Update master plan**

Mark Milestone E complete; commit + push.

---

## Milestone E exit criteria

- [ ] ✅ Astro middleware sets `lg_partner` cookie on `?p=<slug>` query
- [ ] ✅ Layout has client-side localStorage backup for ITP resilience
- [ ] ✅ `src/lib/partners.ts` validates slugs and looks up active partners
- [ ] ✅ `/api/checkout` adds Stripe Connect `transfer_data` (25%) when partner active
- [ ] ✅ `/p/[slug]` renders branded landing for active partners
- [ ] ✅ `/diventa-partner` page with pitch + signup form
- [ ] ✅ `/api/partner-signup` sends notification email to admin
- [ ] ✅ Python QR card generator produces print-ready PDFs
- [ ] ✅ E2E tests cover cookie attribution + pitch page
- [ ] ✅ Tag `phase-0-E-complete` pushed

---

➡️ **Next: [Milestone F — SEO & polish](2026-04-28-localis-phase-0-F-seo-polish.md)** (sitemap, structured data, OG images, Plausible, Sentry, Lighthouse polish)
