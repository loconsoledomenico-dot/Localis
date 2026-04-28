# Milestone F — SEO, analytics & launch polish

> Part of [Phase 0 master plan](2026-04-28-localis-phase-0-foundation.md). Prerequisites: A, B, C, D, E complete.

**Goal:** Final foundation pass before production cutover. Add sitemap, structured data, dynamic OG images, hreflang tags, Plausible analytics with conversion events, Sentry error tracking, performance polish, and apex domain DNS cutover. Site reaches Lighthouse 90+ across all 4 categories on mobile.

**Architecture:** Astro Sitemap integration generates `sitemap-index.xml` automatically. JSON-LD structured data is rendered via a `<StructuredData>` component pulling from page props. OG images are generated at build time using `astro-og-canvas` (or `@vercel/og` via Edge function fallback). Plausible uses a single `<script>` tag + custom `plausible(...)` event calls. Sentry uses `@sentry/astro` for SSR + browser error capture.

**Estimated effort:** 12-16h.

---

## Files

```
src/
├── components/
│   ├── StructuredData.astro
│   └── Analytics.astro                    # Plausible + Sentry init
├── pages/
│   ├── api/
│   │   └── og.ts                          # dynamic OG image (Edge function)
│   └── robots.txt.ts                      # generated robots.txt
├── lib/
│   └── seo.ts                             # helpers for canonical, hreflang
└── content/
    └── _shared/
        └── reviews.ts                     # placeholder review data structure (Phase 3+)

public/
├── og-default.jpg                         # static fallback OG image
└── apple-touch-icon.png                   # iOS home screen icon

netlify.toml                               # add redirects + headers updates
```

---

## Task 1: Add Astro sitemap integration

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Install sitemap integration**

```bash
pnpm astro add sitemap
```

Answer "y" to all prompts.

- [ ] **Step 2: Configure with i18n**

Update `astro.config.mjs` to pass full sitemap config:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://localis.guide',
  output: 'hybrid',
  adapter: netlify(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      i18n: {
        defaultLocale: 'it',
        locales: {
          it: 'it-IT',
          en: 'en-US',
        },
      },
      filter: (page) =>
        !page.includes('/access/') &&
        !page.includes('/api/') &&
        !page.includes('/thanks') &&
        !page.includes('/access-invalid') &&
        !page.includes('/recover'),
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
    }),
  ],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

- [ ] **Step 3: Build → verify sitemap**

```bash
pnpm build
```

Expected: `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist. Open `sitemap-0.xml` → verify it contains all live IT and EN pages with proper hreflang annotations.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs package.json pnpm-lock.yaml
git commit -m "feat: add Astro sitemap integration with i18n and exclusions for private routes"
```

---

## Task 2: Create dynamic robots.txt

**Files:**
- Create: `src/pages/robots.txt.ts`

- [ ] **Step 1: Generate robots.txt**

Write to `src/pages/robots.txt.ts`:

```typescript
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).toString();

  const body = `User-agent: *
Allow: /
Disallow: /access/
Disallow: /api/
Disallow: /thanks
Disallow: /access-invalid
Disallow: /recover

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
```

- [ ] **Step 2: Build → verify**

```bash
pnpm build
```

Expected: `dist/robots.txt` exists with proper directives + sitemap URL.

- [ ] **Step 3: Commit**

```bash
git add src/pages/robots.txt.ts
git commit -m "feat: generate dynamic robots.txt with sitemap reference"
```

---

## Task 3: Add JSON-LD structured data

**Files:**
- Create: `src/components/StructuredData.astro`, `src/lib/seo.ts`
- Modify: `src/components/Layout.astro`, guide detail pages, homepage

- [ ] **Step 1: Create seo.ts helpers**

Write to `src/lib/seo.ts`:

```typescript
export function organizationLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Localis',
    url: 'https://localis.guide',
    logo: 'https://localis.guide/favicon.svg',
    founder: [
      { '@type': 'Person', name: 'Domenico Loconsole' },
      { '@type': 'Person', name: 'Luigi Loconsole' },
    ],
    description: 'Audioguide narrative della Puglia. Storie vere, senza app.',
  };
}

export interface GuideLDInput {
  slug: string;
  title: string;
  description: string;
  durationSeconds: number;
  audioUrl?: string;
  language: 'it' | 'en';
  priceCents: number;
  coords?: { lat: number; lng: number };
  cityName?: string;
}

export function audioObjectLD(g: GuideLDInput) {
  const url = `https://localis.guide${g.language === 'en' ? '/en' : ''}/guide/${g.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    name: g.title,
    description: g.description,
    url,
    duration: `PT${Math.floor(g.durationSeconds / 60)}M${g.durationSeconds % 60}S`,
    encodingFormat: 'audio/mpeg',
    inLanguage: g.language,
    author: { '@type': 'Person', name: 'Domenico Loconsole' },
    publisher: organizationLD(),
    offers: {
      '@type': 'Offer',
      price: (g.priceCents / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}

export function touristAttractionLD(name: string, coords: { lat: number; lng: number }, city: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: coords.lat,
      longitude: coords.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: 'Puglia',
      addressCountry: 'IT',
    },
  };
}
```

- [ ] **Step 2: Create StructuredData component**

Write to `src/components/StructuredData.astro`:

```astro
---
export interface Props {
  data: object | object[];
}

const { data } = Astro.props;
const arr = Array.isArray(data) ? data : [data];
---
{arr.map((d) => (
  <script type="application/ld+json" set:html={JSON.stringify(d)} />
))}
```

- [ ] **Step 3: Add Organization LD to Layout**

Modify `src/components/Layout.astro` — add `<StructuredData>` to `<head>`:

Import at top of frontmatter:
```typescript
import StructuredData from './StructuredData.astro';
import { organizationLD } from '../lib/seo';
```

Add inside `<head>`, before closing tag:
```astro
<StructuredData data={organizationLD()} />
```

- [ ] **Step 4: Add per-guide LD on detail pages**

Modify `src/pages/guide/[slug].astro` and `src/pages/en/guide/[slug].astro`:

Add to frontmatter imports:
```typescript
import StructuredData from '../../components/StructuredData.astro';
import { audioObjectLD, touristAttractionLD } from '../../lib/seo';
```

(EN file uses `'../../../components/...'` adjusted paths.)

Build LD inside frontmatter (after `const data = guide.data;`):

```typescript
const ld: object[] = [
  audioObjectLD({
    slug: data.slug,
    title: data.title_it, // (or title_en in EN file)
    description: data.seo.description_it, // (or description_en in EN file)
    durationSeconds: data.duration_seconds,
    language: 'it', // (or 'en' in EN file)
    priceCents: data.price_cents,
    coords: data.coords_start,
    cityName: data.city,
  }),
];

if (data.coords_start) {
  ld.push(
    touristAttractionLD(
      data.title_it, // (or title_en)
      data.coords_start,
      data.city.charAt(0).toUpperCase() + data.city.slice(1),
    ),
  );
}
```

Add inside the page `<Layout>` slot near the top:

```astro
<StructuredData data={ld} />
```

Apply identical changes to EN guide page using `title_en` / `description_en` / `language: 'en'`.

- [ ] **Step 5: Verify in build output**

```bash
pnpm build
```

Open any `dist/guide/<slug>/index.html` → search for `application/ld+json` → confirm both Organization + AudioObject + TouristAttraction render.

- [ ] **Step 6: Validate via Schema.org tester**

After deploy, run https://search.google.com/test/rich-results on `https://localis.guide/guide/bari-vecchia` → expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo.ts src/components/StructuredData.astro src/components/Layout.astro src/pages/guide/[slug].astro src/pages/en/guide/[slug].astro
git commit -m "feat: add JSON-LD structured data (Organization, AudioObject, TouristAttraction)"
```

---

## Task 4: Add hreflang tags

**Files:**
- Modify: `src/components/Layout.astro`

- [ ] **Step 1: Compute alternate URLs**

Update `src/components/Layout.astro` head section. Add hreflang link tags:

Add to frontmatter imports:
```typescript
import { alternateLangUrl, stripLocalePrefix } from '../lib/i18n';
```

In the frontmatter, compute:
```typescript
const currentPath = Astro.url.pathname;
const altUrl = alternateLangUrl(currentPath, lang);
const itUrl = lang === 'it' ? currentPath : stripLocalePrefix(currentPath);
const enUrl = lang === 'en' ? currentPath : `/en${stripLocalePrefix(currentPath)}`;
const SITE = 'https://localis.guide';
const canonical = `${SITE}${currentPath}`;
```

Inside `<head>`, add (before `<title>`):

```astro
<link rel="canonical" href={canonical} />
<link rel="alternate" hreflang="it" href={`${SITE}${itUrl}`} />
<link rel="alternate" hreflang="en" href={`${SITE}${enUrl}`} />
<link rel="alternate" hreflang="x-default" href={`${SITE}${itUrl}`} />
```

Also add Open Graph tags using existing `description` prop:

```astro
<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
{description && <meta property="og:description" content={description} />}
<meta property="og:url" content={canonical} />
<meta property="og:locale" content={lang === 'en' ? 'en_US' : 'it_IT'} />
<meta property="og:locale:alternate" content={lang === 'en' ? 'it_IT' : 'en_US'} />
<meta property="og:site_name" content="Localis" />
<meta property="og:image" content={`${SITE}/og-default.jpg`} />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
{description && <meta name="twitter:description" content={description} />}
<meta name="twitter:image" content={`${SITE}/og-default.jpg`} />
```

- [ ] **Step 2: Add static fallback OG image**

Use any cover image (e.g. `cover-bari-vecchia.jpg`) resized to 1200×630 as `public/og-default.jpg`. Manually crop with image editor or run:

```bash
# If ImageMagick available
magick public/images/covers/bari-vecchia.jpg -resize 1200x630^ -gravity center -extent 1200x630 public/og-default.jpg
```

If no ImageMagick: use online tool or any 1200×630 brand-appropriate JPEG.

- [ ] **Step 3: Verify in build output**

```bash
pnpm build
```

Inspect any HTML in `dist/` → confirm `<link rel="alternate" hreflang="it">` and `<link rel="alternate" hreflang="en">` and `<meta property="og:*">` tags present.

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.astro public/og-default.jpg
git commit -m "feat: add canonical, hreflang IT/EN/x-default, Open Graph and Twitter card meta"
```

---

## Task 5: Dynamic OG image generation per guide

**Files:**
- Create: `src/pages/og/[slug].png.ts`

For more compelling social sharing, generate a unique OG image per guide using `astro-og-canvas` (Astro-friendly satori-based renderer).

- [ ] **Step 1: Install**

```bash
pnpm add astro-og-canvas canvaskit-wasm
```

- [ ] **Step 2: Create OG image route**

Write to `src/pages/og/[slug].png.ts`:

```typescript
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const guides = await getCollection('guides');

const pages = Object.fromEntries(
  guides.map((g) => [
    g.data.slug,
    {
      title: g.data.title_it,
      description: g.data.subtitle_it,
    },
  ]),
);

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'slug',
  pages,
  getImageOptions: (slug, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[250, 247, 242]], // parchment
    border: { color: [194, 82, 26], width: 8, side: 'inline-start' },
    padding: 80,
    font: {
      title: {
        families: ['Spectral'],
        size: 72,
        weight: 'Normal',
        color: [28, 21, 16],
      },
      description: {
        families: ['Spectral'],
        size: 32,
        weight: 'Normal',
        color: [90, 100, 119],
      },
    },
    fonts: [
      'https://fonts.gstatic.com/s/spectral/v15/rnCs-xNNww_2s0amA9v8qnGuUfk.woff2',
    ],
  }),
});
```

NOTE: `astro-og-canvas` documentation (https://npmjs.com/package/astro-og-canvas) for full options.

- [ ] **Step 3: Update Layout to use per-guide OG image when available**

Modify Layout to accept optional `ogImage` prop:

In `Layout.astro` Props interface:
```typescript
export interface Props {
  title: string;
  description?: string;
  lang?: Lang;
  ogImage?: string;          // override default
}
```

In frontmatter:
```typescript
const { title, description = '', lang = 'it', ogImage } = Astro.props;
const ogImageUrl = ogImage || `${SITE}/og-default.jpg`;
```

Update OG image meta to use `ogImageUrl` instead of hardcoded `/og-default.jpg`.

In guide detail pages, pass:
```astro
<Layout title={...} description={...} lang="it" ogImage={`/og/${data.slug}.png`}>
```

- [ ] **Step 4: Build → verify per-guide OG**

```bash
pnpm build
```

Expected: `dist/og/bari-vecchia.png` etc. exist. Inspect a generated PNG (1200×630) → verify it shows guide title in Spectral on parchment background.

- [ ] **Step 5: Commit**

```bash
git add src/pages/og/[slug].png.ts src/components/Layout.astro src/pages/guide/[slug].astro src/pages/en/guide/[slug].astro package.json pnpm-lock.yaml
git commit -m "feat: dynamic per-guide OG image generation via astro-og-canvas"
```

---

## Task 6: Plausible analytics

**Files:**
- Create: `src/components/Analytics.astro`
- Modify: `src/components/Layout.astro`, `src/components/PriceCard.astro`, `src/components/TrailerPlayer.astro`, `src/components/AudioPlayer.astro`

- [ ] **Step 1: Sign up + add domain**

https://plausible.io → Add Site → Domain: `localis.guide` → save. (30-day trial covers this milestone.)

- [ ] **Step 2: Create Analytics component**

Write to `src/components/Analytics.astro`:

```astro
---
const domain = import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN || 'localis.guide';
const isProd = import.meta.env.PROD;
---
{isProd && (
  <>
    <script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.tagged-events.js"
    ></script>
    <script is:inline>
      window.plausible = window.plausible || function() {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
    </script>
  </>
)}
```

- [ ] **Step 3: Include in Layout**

Modify `src/components/Layout.astro` — add inside `<head>` (after fonts):

```astro
import Analytics from './Analytics.astro';

...

<Analytics />
```

- [ ] **Step 4: Add custom events**

In `src/components/PriceCard.astro` — modify the click handler script. After fetching `/api/checkout`, add event tracking BEFORE redirecting:

```javascript
// inside the click handler, before window.location.assign(data.url):
if (typeof window.plausible === 'function') {
  window.plausible('Checkout Started', { props: { product, lang } });
}
```

In `src/components/TrailerPlayer.astro` — track trailer play in the toggle handler:

```javascript
// when audio.play() succeeds:
if (typeof window.plausible === 'function') {
  const guide = player.dataset.src?.split('/').pop()?.replace('.mp3', '') || 'unknown';
  window.plausible('Trailer Played', { props: { guide } });
}
```

In `src/components/AudioPlayer.astro` — track full audio engagement at 80% played:

```javascript
// add inside p.audio.timeupdate handler:
if (!p.audio.duration) return;
const pct = p.audio.currentTime / p.audio.duration;
if (pct > 0.8 && !p.fullPlayedTracked) {
  p.fullPlayedTracked = true;
  if (typeof window.plausible === 'function') {
    window.plausible('Audio Played Full', { props: { guide: p.slug } });
  }
}
```

(Add `fullPlayedTracked` to the Player type definition.)

In `src/pages/thanks.astro` — add a script that fires on render to record completed checkouts:

```astro
<script is:inline define:vars={{ sessionId, success: !!directAccessUrl }}>
  if (success && typeof window.plausible === 'function') {
    window.plausible('Checkout Completed', { props: { session: sessionId || 'unknown' } });
  }
</script>
```

In `src/pages/p/[slug].astro` — track partner QR visit:

```astro
<script is:inline define:vars={{ partnerSlug: partner.data.slug }}>
  if (typeof window.plausible === 'function') {
    window.plausible('Partner QR Visit', { props: { partner: partnerSlug } });
  }
</script>
```

- [ ] **Step 5: Add env var to Netlify**

Netlify dashboard → env vars → add:
- `PUBLIC_PLAUSIBLE_DOMAIN=localis.guide`

- [ ] **Step 6: Build + deploy**

```bash
pnpm build
git add src/components/Analytics.astro src/components/Layout.astro src/components/PriceCard.astro src/components/TrailerPlayer.astro src/components/AudioPlayer.astro src/pages/thanks.astro src/pages/p/[slug].astro
git commit -m "feat: add Plausible analytics with custom events for funnel tracking"
git push origin main
```

After deploy, visit Plausible dashboard → see traffic + custom event registrations.

---

## Task 7: Sentry error monitoring

**Files:**
- Modify: `astro.config.mjs`, `package.json`

- [ ] **Step 1: Install Sentry Astro integration**

```bash
pnpm astro add @sentry/astro
```

Answer "y". Sentry asks for DSN — paste your Sentry project DSN. Or skip and add manually.

- [ ] **Step 2: Update astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';

export default defineConfig({
  site: 'https://localis.guide',
  output: 'hybrid',
  adapter: netlify(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({ /* same as before */ }),
    sentry({
      dsn: import.meta.env.SENTRY_DSN,
      sourceMapsUploadOptions: {
        project: 'localis-guide',
        authToken: import.meta.env.SENTRY_AUTH_TOKEN,
      },
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 1.0,
    }),
  ],
  i18n: { /* same as before */ },
});
```

- [ ] **Step 3: Add env vars**

Add to `.env.local` and Netlify env dashboard:

```
SENTRY_DSN=<from Sentry project>
PUBLIC_SENTRY_DSN=<same DSN>
SENTRY_AUTH_TOKEN=<from Sentry org settings, only needed for source maps upload>
```

- [ ] **Step 4: Test error capture**

Add a temporary intentional error in dev:

```typescript
// somewhere in a page
throw new Error('Sentry test error');
```

Reload page → error appears in Sentry dashboard within 30s. Remove the test error.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs package.json pnpm-lock.yaml
git commit -m "feat: add Sentry error monitoring for SSR routes and browser"
```

---

## Task 8: Performance polish

**Files:**
- Modify: `src/components/Layout.astro`, various

- [ ] **Step 1: Preload key fonts**

Modify `src/components/Layout.astro` — replace the Google Fonts link with explicit preload + delayed stylesheet load:

```astro
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
/>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
/>
```

- [ ] **Step 2: Optimize hero image**

Modify `src/components/Hero.astro` — use Astro `<Image>` for hero photo:

```astro
---
import { Image } from 'astro:assets';
import heroIt from '../../public/images/hero/home-it.jpg';
// ... existing imports
---

<!-- Replace existing <img src="/images/hero/home-it.jpg" ... /> with: -->
<Image
  src={heroIt}
  alt=""
  width={400}
  height={500}
  class="w-full aspect-[4/5] object-cover rounded-lg"
  loading="eager"
  fetchpriority="high"
/>
```

NOTE: For this to work, move hero images from `public/images/hero/` to `src/assets/hero/` so Astro can process them. Update import paths accordingly. Astro generates AVIF/WebP variants automatically.

- [ ] **Step 3: Optimize cover images on guide cards**

In `src/components/GuideCard.astro`, the current `<img src={data.cover} />` reads from `/images/covers/...` which is in `public/`. To get Astro asset processing, EITHER:

(a) Keep public path and use static loading attributes (current state — works for Phase 0).

(b) Restructure: move covers to `src/content/guides/covers/` with imports in MDX. Phase 1 work.

For Phase 0, keep (a) but ensure each `<img>` has explicit `width`, `height`, and `loading="lazy"` attributes (already present).

- [ ] **Step 4: Add explicit dimensions to all images**

Audit any `<img>` in components — every one must have `width` and `height` attributes (set via Tailwind classes is fine; explicit `width={N} height={N}` better for Lighthouse CLS).

- [ ] **Step 5: Run Lighthouse mobile**

```bash
pnpm build
git push
```

Wait for Netlify deploy. Run Lighthouse on staging URL.

Expected:
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: 100

If Performance < 90: investigate via Lighthouse "Opportunities" panel. Common fixes:
- Add `font-display: swap` (already done via Google Fonts URL)
- Lazy-load below-fold images
- Reduce CSS (Tailwind purge already aggressive)
- Defer non-critical JS

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout.astro src/components/Hero.astro src/assets/
git commit -m "perf: preload fonts, use Astro Image for hero, ensure explicit image dimensions"
```

---

## Task 9: Apple touch icon + manifest stub

**Files:**
- Create: `public/apple-touch-icon.png`

- [ ] **Step 1: Generate apple-touch-icon**

Create a 180×180 PNG of the Localis logo on parchment background. Use any image tool or render from favicon.svg:

```bash
# If ImageMagick available
magick public/favicon.svg -density 300 -resize 180x180 public/apple-touch-icon.png
```

Otherwise: design manually in any tool (Figma, Sketch, GIMP) — 180×180 transparent PNG, "L" letter in terracotta on parchment background, matching brand.

- [ ] **Step 2: Reference in Layout**

Add to `src/components/Layout.astro` `<head>`:

```astro
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

- [ ] **Step 3: Commit**

```bash
git add public/apple-touch-icon.png src/components/Layout.astro
git commit -m "feat: add apple-touch-icon for iOS home screen"
```

---

## Task 10: Production cutover preparation

This step prepares apex `localis.guide` for production cutover. Schedule this for off-peak hours (low traffic).

- [ ] **Step 1: Verify all env vars in Netlify production environment**

Netlify dashboard → site `localis-guide-v2` → Site configuration → Environment variables. Confirm presence of:

- `STRIPE_SECRET_KEY` (live mode `sk_live_...`)
- `STRIPE_PUBLISHABLE_KEY` (`pk_live_...`)
- `STRIPE_WEBHOOK_SECRET` (live mode webhook secret)
- `JWT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=Localis <noreply@localis.guide>` (domain verified)
- `PUBLIC_SITE_URL=https://localis.guide`
- `PUBLIC_PLAUSIBLE_DOMAIN=localis.guide`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET=localis-audio`
- `SENTRY_DSN`, `PUBLIC_SENTRY_DSN`

- [ ] **Step 2: Switch Stripe to live mode**

In Stripe Dashboard → toggle "Test mode" off (top-right) → recreate the same 6 Products and Prices in LIVE mode → save the live Price IDs → update `src/data/stripe-prices.json` → push to main.

(Alternatively, keep test mode for first weeks of soft launch; switch to live when first real partner ready.)

- [ ] **Step 3: Add new live webhook in Stripe live dashboard**

URL: `https://localis.guide/api/webhook` → Event: `checkout.session.completed` → save signing secret → update Netlify `STRIPE_WEBHOOK_SECRET` env var.

- [ ] **Step 4: Activate Stripe Tax + register OSS**

In Stripe Dashboard → Tax → enable. Register Italian OSS via Agenzia Entrate online if not already done.

- [ ] **Step 5: Configure DNS for localis.guide on Netlify**

Netlify dashboard → site → Domain management → "Add custom domain" → `localis.guide` → follow instructions.

If `localis.guide` DNS is hosted elsewhere: add A record pointing to Netlify load balancer IP, plus CNAME for `www` to `<site>.netlify.app`. Wait for SSL certificate provisioning (~5-30 min).

- [ ] **Step 6: Set redirect rules**

Update `netlify.toml` to add:

```toml
# Force HTTPS
[[redirects]]
  from = "http://localis.guide/*"
  to = "https://localis.guide/:splat"
  status = 301
  force = true

# Force apex (no www)
[[redirects]]
  from = "https://www.localis.guide/*"
  to = "https://localis.guide/:splat"
  status = 301
  force = true
```

- [ ] **Step 7: Final smoke test on production URL**

Open `https://localis.guide/` in incognito. Test:
- ✓ Homepage loads with Spectral + Schibsted Grotesk fonts
- ✓ Trailer plays
- ✓ Switch to EN works
- ✓ Click guide → detail renders
- ✓ Click "Acquista Bari Completa" → Stripe Checkout opens with LIVE mode
- ✓ Use real card (small purchase, refund yourself after) → email arrives → magic link works → audio plays
- ✓ Lighthouse mobile passes 90/95/95/100

- [ ] **Step 8: Decommission legacy site**

Once production cutover validated for 24 hours:

Old Netlify site `localis-guide.netlify.app` (drag-and-drop deploy from earlier) — leave running for now as fallback. Plan to delete after 30 days no-issue period.

- [ ] **Step 9: Tag**

```bash
git tag phase-0-F-complete
git push origin phase-0-F-complete
git tag phase-0-complete
git push origin phase-0-complete
```

- [ ] **Step 10: Update master plan**

Mark Milestone F complete + add cutover date to spec revision history.

---

## Milestone F exit criteria

- [ ] ✅ Astro sitemap integration generates `sitemap-index.xml` with i18n
- [ ] ✅ `robots.txt` references sitemap; private routes disallowed
- [ ] ✅ JSON-LD structured data: Organization (all pages), AudioObject + TouristAttraction (guide pages)
- [ ] ✅ Hreflang tags for IT/EN/x-default on every page
- [ ] ✅ Open Graph + Twitter Card meta on every page
- [ ] ✅ Per-guide OG image generated dynamically via astro-og-canvas
- [ ] ✅ Plausible analytics: domain configured, custom events firing
- [ ] ✅ Sentry error tracking active (SSR + browser)
- [ ] ✅ Apple touch icon present
- [ ] ✅ Lighthouse mobile: Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO = 100
- [ ] ✅ Production env vars set in Netlify (live Stripe keys, webhook, etc.)
- [ ] ✅ DNS apex `localis.guide` cut over to Netlify; SSL active
- [ ] ✅ HTTPS + apex redirects in `netlify.toml`
- [ ] ✅ End-to-end production smoke test: real purchase → email → magic link → audio
- [ ] ✅ Tag `phase-0-complete` pushed

---

## Phase 0 wrap-up

🎉 **Phase 0 complete when all 6 milestones shipped.**

Summary of what now exists:
- Production site at `localis.guide` with full e-commerce
- 5 audioguides salable (4 active + 1 "soon"); placeholder MP3s ready to be replaced by real ElevenLabs-cloned audio in parallel content track
- Stripe Checkout + Connect partner split working
- Magic link delivery + permanent JWT tokens
- Service Worker offline-capable audio playback
- Watermarked per-buyer audio variants (Phase 0 = path-based; Phase 1 = TTS prefix)
- Partner program infrastructure ready for first real signup
- Lighthouse 90+/95+/95+/100 mobile
- SEO foundation (sitemap + structured data + hreflang + per-guide OG images)
- Plausible + Sentry observability

**Next**: Phase 1 starts content production (real Domenico voice clone, real per-guide MP3s, refined trailers) and first 5 partner signups. Phase 1 will get its own design doc and plan files in `docs/superpowers/specs/` and `docs/superpowers/plans/` when Phase 0 is verified production-stable.

---

**Phase 0 plan complete.** Return to [master plan](2026-04-28-localis-phase-0-foundation.md) for execution handoff.
