# Localis — Design Document: Restructure & Launch

**Date**: 2026-04-28  
**Authors**: Domenico Loconsole (product/content), Luigi Loconsole (engineering)  
**Status**: Approved (pending user spec review)  
**Domain**: localis.guide  
**Phase**: from drag&drop static site to production-grade revenue-generating product

---

## 1. Executive summary

Localis is a narrative audio-guide product for Bari and Puglia, currently published as a static drag-and-drop site at `localis-guide.netlify.app` with **zero working business infrastructure** (no payments, no email delivery, no analytics, no Git). This document defines the complete restructure: a production-grade Astro 5 site with Stripe payments, Stripe Connect partner program with QR-driven distribution, AI voice cloning pipeline (ElevenLabs Professional Voice Cloning of co-founder Domenico), offline-capable audio delivery via Service Worker, and a brand identity rebuilt from scratch under the constraints of the `/impeccable` design skill (Spectral + Schibsted Grotesk typography, parchment + deep navy + terracotta palette in OKLCH).

The goal is to ship Phase 0 (foundation: working site + Stripe + email delivery + Git) within 2-3 weeks, then proceed through 7 progressive phases over 18 months ending with ~30 audio guides spanning 12+ Puglia cities, partner network of 100+ hotels/B&Bs/bars, and 5000+ paying customers.

The product remains intentionally narrow: web-only (no native apps), Puglia-only (no geographic expansion outside the region within 18 months), one-time payments (no subscription complexity), and authored content (no UGC marketplace).

---

## 2. Business context

### Product definition

Narrative audio guides delivered via web browser. Each guide is a 8-18 minute MP3 produced as a story (not a tour information dump). Bari Vecchia, the historic Old Town, is the first city, with 5 guides currently published (Bari Vecchia, Porto, San Nicola, Il Meglio di Bari, Tre Teatri).

### Founders

- **Domenico Loconsole** — research, scriptwriting, narration. Origin project: "Misteri di Modugno" (Modugno mysteries audio walk).
- **Luigi Loconsole** — engineering, ops, design.

### Market

- **Audio walking tour app market**: $1.42B in 2024, 13.8% CAGR through 2033 (datainsightsmarket).
- **Bari tourism 2025**: 1.097M visitors, 2.6M overnight stays, +25% YoY. Bari is #1 destination in Puglia. 600k+ cruise passengers annually.
- **Top international source markets for Bari**: Polonia 13%, Romania 6%, France 5.5%, Germany 4%.

### Competitive landscape

| Competitor | Model | Bari pricing | Strength | Weakness |
|------------|-------|--------------|----------|----------|
| izi.TRAVEL | App-based, free + paid | $4.54 (full) + free | Brand, scale (25k tours) | Generic, app-required |
| VoiceMap | App, GPS-triggered | $5-15 | Local narrators, GPS | Bari coverage thin, app-required |
| GuruWalk | Free physical walking tours | "Pay what you want" €15-50 | Human experience, social proof | Scheduled, requires booking |
| GetYourGuide / Viator | Marketplace tours | $4-50+ | Massive distribution, reviews | Physical tour, no narrative |
| MyPugliaStory | Narrative IT online | Web | Same narrative angle | Mostly text, small brand |
| Audioguida Digitale Bari (Comune) | Free official | €0 | Endorsed, free | Amateur quality |
| Audiala | AI multilingual | Subscription | Auto-scaled languages | AI voice quality, generic |

### Strategic positioning (canonical)

> **"L'unica audioguida di Bari raccontata da chi ci vive. Senza app. Storie vere, non da brochure."**

Three differentiators:
1. **AUTHENTIC** — local founders, documented historical research (Modugno project provenance), AI voice cloned from Domenico himself (not generic ElevenLabs voice)
2. **FRICTIONLESS** — browser web, no native app required, no install
3. **NARRATIVE** — cinematic storytelling, not info aggregation. Reference: NYT podcast "The Daily" feel, not Wikipedia.

Target audience prioritization:
1. **Cruise passengers** (4-6h port stop): wants to maximize time, hates app installs, wants to understand context. **Primary target**.
2. **Cultural tourists** (2-3 day visit): wants authentic experiences, pre-trip research, pays for quality. **Secondary target**.
3. **Backpackers / tip-tour seekers**: wants free, human experience. **Not target** (they'll prefer GuruWalk).

Out of scope: subscription audiences, Italian users searching for free content (Comune already serves them).

---

## 3. Strategic decisions (canonical record)

These decisions are settled and frame all subsequent architecture/design choices. Changes require explicit revisitation.

| Decision | Choice | Made on | Rationale |
|----------|--------|---------|-----------|
| Voice production | AI clone of Domenico via ElevenLabs Professional Voice Cloning ($22/mo Creator plan) | 2026-04-28 | Founder voice + AI scalability; preserves authenticity of narrative claim |
| Distribution primary | Physical QR cards in hotels, B&Bs, bars (B2B partners) | 2026-04-28 | Ground game leveraging Bari tourism flow; bypasses search-dependent organic acquisition |
| Partner commission | 25% of gross sale, paid via Stripe Connect Standard split-payment | 2026-04-28 | Industry-standard tour aggregator rate; balances margin and partner motivation |
| Payment model | One-time per guide ("per sempre tua") + bundle pricing | 2026-04-28 | No subscription complexity; matches impulse-buy mental model |
| Geographic scope | Puglia only for 18 months | 2026-04-28 | Depth over breadth; brand "the Puglia experts" |
| Free preview | 30-60s trailer per guide, hard paywall on full content | 2026-04-28 | Audiobook industry standard; reduces cold-traffic friction; avoids mid-listening frustration |
| Audio access UX | Streaming-first via magic link + Service Worker offline cache (Option C) | 2026-04-28 | Balances anti-piracy and Bari Vecchia 4G unreliability; matches Audible/Spotify model |
| Domain | localis.guide (already owned) | 2026-04-28 | Premium TLD aligned with category |
| Stripe account | already provisioned | 2026-04-28 | Unblocks payment work |
| Brand visual direction | Editorial Modern (parchment + deep navy + terracotta accent, OKLCH palette) | 2026-04-28 | Differentiates from generic SaaS dark mode + souvenir-shop terracotta; reads outdoors |
| Typography | Spectral (display, italic-leveraging) + Schibsted Grotesk (body), under /impeccable constraints | 2026-04-28 | Avoids exhausted Cormorant/Inter reflex; matches "1960s Italian magazine" reference |
| Out of scope (≤18mo) | Native apps; non-Puglia expansion; subscription products; UGC marketplace; multi-narrator content; direct MP3 download | 2026-04-28 | Focus discipline; revisit only after Phase 7 success metrics |

---

## 4. Architecture

### Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Astro 5** (SSG) | Component model, native i18n, near-zero JS by default |
| Styling | **Tailwind CSS** + custom OKLCH design tokens | Utility-first with project-specific tokens in `src/styles/tokens.css` |
| Content | **MDX** in `src/content/guides/` and `src/content/partners/` | Astro Content Collections, type-safe via Zod |
| Audio storage | **Cloudflare R2** | S3-compatible API, free egress |
| Audio delivery | Signed URLs (1h expiry) + Service Worker cache | Anti-piracy + offline UX |
| Payments | **Stripe Checkout** (hosted) + **Stripe Connect Standard** for partners | Account already provisioned |
| Email | **Resend** | $0 up to 3k emails/mo |
| Magic link tokens | JWT (HS256) signed; no DB until Phase 4 | Stateless; rotate on revocation only |
| Analytics | **Plausible** (€9/mo) — cookieless, GDPR-compliant | No cookie banner needed |
| Error monitoring | **Sentry** (free tier) | JS + serverless errors |
| Hosting | **Netlify** (current) — Git-based deploys | Existing setup retained |
| Source control | GitHub private repo `localis-guide` | Netlify integration native |
| Voice production | **ElevenLabs Creator plan** ($22/mo) — Professional Voice Cloning | Generates IT and EN audio from Italian script |

### Repository layout

```
LocalisGuide/
├── src/
│   ├── content/
│   │   ├── config.ts                    # Zod schema (guides, partners)
│   │   ├── guides/
│   │   │   ├── bari-vecchia.mdx
│   │   │   ├── porto-bari.mdx
│   │   │   ├── san-nicola.mdx
│   │   │   ├── il-meglio-di-bari.mdx
│   │   │   └── tre-teatri.mdx
│   │   ├── partners/
│   │   │   └── *.mdx                    # one file per active partner
│   │   └── scripts/                     # raw IT/EN scripts before TTS
│   │       ├── bari-vecchia.it.md
│   │       └── bari-vecchia.en.md
│   ├── components/                      # Astro components (no React unless needed)
│   ├── pages/
│   │   ├── index.astro                  # IT homepage
│   │   ├── en/index.astro               # EN homepage
│   │   ├── guide/[slug].astro           # public guide pages with trailer + paywall
│   │   ├── access/[token].astro         # post-payment audio player
│   │   ├── p/[slug].astro               # partner landing pages
│   │   ├── citta/[slug].astro           # city hub pages (Phase 5+)
│   │   ├── storia/[slug].astro          # blog/SEO content (Phase 3+)
│   │   ├── api/
│   │   │   ├── checkout.ts              # Stripe session creation
│   │   │   ├── webhook.ts               # Stripe webhook → token gen + email
│   │   │   ├── audio-url.ts             # signed R2 URL with rate limit
│   │   │   ├── recover.ts               # email lookup → resend magic link
│   │   │   └── partner-signup.ts        # B2B partner registration
│   │   ├── thanks.astro                 # post-checkout success page
│   │   ├── recover.astro                # form to recover lost magic link
│   │   ├── diventa-partner.astro        # partner pitch + form
│   │   ├── about.astro
│   │   ├── termini.astro
│   │   ├── privacy.astro
│   │   ├── 404.astro
│   │   └── access-invalid.astro
│   ├── lib/
│   │   ├── stripe.ts
│   │   ├── resend.ts
│   │   ├── jwt.ts
│   │   ├── partners.ts
│   │   ├── audio-storage.ts
│   │   ├── watermark.ts
│   │   └── i18n.ts
│   └── styles/
│       └── tokens.css                   # OKLCH design tokens, type scale
├── public/
│   ├── audio/trailers/                  # 60s public preview MP3s
│   ├── images/                          # cover photos (optimized AVIF + WebP)
│   ├── og/                              # Open Graph generated images
│   ├── sw.js                            # Service Worker
│   ├── offline.html
│   └── favicon.svg
├── scripts/                             # Python content production pipeline
│   ├── generate-guide.py                # script.md → MP3 via ElevenLabs
│   ├── generate-watermark.py            # buyer-personalized intro
│   ├── generate-qr-cards.py             # PDF for partner card printing
│   └── upload-r2.py
├── docs/
│   └── superpowers/specs/               # design docs (this file lives here)
├── .impeccable.md                       # design context for /impeccable skill
├── .env.local                           # secrets (not committed)
├── .gitignore                           # includes .env*, .superpowers/
├── astro.config.mjs
├── tailwind.config.mjs
├── netlify.toml                         # cache headers, redirects
├── package.json
└── README.md
```

### Content schema (Astro Content Collections)

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const guides = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string(),
    city: z.enum(['bari', 'polignano', 'ostuni', 'lecce', 'matera', 'trani', 'otranto', 'gallipoli', 'alberobello', 'vieste']),
    title_it: z.string(),
    title_en: z.string(),
    subtitle_it: z.string(),
    subtitle_en: z.string(),
    duration_seconds: z.number().int().positive(),
    cover: z.string(),
    audio_full_key_it: z.string(),    // R2 key
    audio_full_key_en: z.string(),
    audio_trailer_path: z.string(),   // /audio/trailers/<slug>.mp3
    chapters: z.array(z.object({
      title_it: z.string(),
      title_en: z.string(),
      start_seconds: z.number().int().nonnegative(),
    })),
    coords_start: z.object({ lat: z.number(), lng: z.number() }).optional(),
    price_cents: z.number().int().default(499),
    status: z.enum(['live', 'soon', 'archived']).default('live'),
    published_at: z.date(),
    seo: z.object({
      description_it: z.string().max(160),
      description_en: z.string().max(160),
    }),
  }),
});

const partners = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string(),
    display_name: z.string(),
    type: z.enum(['hotel', 'bb', 'bar', 'restaurant', 'shop', 'other']),
    city: z.string(),
    contact_email: z.string().email(),
    stripe_account_id: z.string().regex(/^acct_/),
    commission_rate: z.number().min(0).max(0.5).default(0.25),
    created_at: z.date(),
    status: z.enum(['active', 'paused', 'terminated']),
    custom_landing_copy_it: z.string().optional(),
    custom_landing_copy_en: z.string().optional(),
  }),
});

export const collections = { guides, partners };
```

### Data flow (purchase to playback)

```
1. Visitor scans QR card in hotel room
2. → localis.guide/p/hotel-excelsior-bari (or ?p=hotel-excelsior-bari on any URL)
3. → cookie lg_partner=hotel-excelsior-bari set, max-age 30 days
4. → User browses, plays trailers, clicks "Ascolta tutto · €4.99" on bari-vecchia
5. → POST /api/checkout {product:'bari-vecchia', lang:'it'}
6. → Server reads cookie, creates Stripe session with metadata + Stripe Connect transfer_data
7. → User redirected to Stripe Checkout (hosted)
8. → User completes payment
9. → Stripe webhook fires checkout.session.completed → POST /api/webhook
10. → Server: verify webhook signature; generate JWT (email, guide_slugs, partner_id, iat); send email via Resend with magic link
11. → If partner_id present, Stripe Connect already split 25% to partner account at payment time (transfer_data)
12. → User redirected to /thanks (success page) with session_id; can also click "Apri ora" which generates token from session lookup
13. → User clicks magic link in email → /access/<token>
14. → Server verifies JWT, renders player page with embedded audio for each purchased guide
15. → Browser registers Service Worker; first play streams from R2 signed URL with watermark; SW caches MP3 in browser IndexedDB
16. → On subsequent visits (even offline), SW serves cached audio
```

---

## 5. Brand & visual direction

### Concept

Editorial Modern: parchment-paper feel, deep navy ink, terracotta accent. Reference: 1960s Italian travel magazines (Domus, Bell'Italia), Mondadori Oscar paperback covers. Anti-references: tourist brochure, generic SaaS, dark-mode-with-glow, souvenir-shop terracotta.

### Palette (OKLCH, perceptually uniform)

```css
/* src/styles/tokens.css */
:root {
  --color-surface:        oklch(96% 0.012 75);   /* parchment base */
  --color-surface-elev:   oklch(92% 0.018 75);   /* elevated cards */
  --color-surface-deep:   oklch(99% 0.006 75);   /* white-tinted, never pure white */
  --color-ink:            oklch(20% 0.025 240);  /* deep navy-black text */
  --color-ink-muted:      oklch(45% 0.020 240);  /* secondary text */
  --color-ink-subtle:     oklch(55% 0.012 240);  /* labels, eyebrows */
  --color-border:         oklch(85% 0.012 75);   /* hairlines, dividers */
  --color-accent:         oklch(56% 0.14 45);    /* terracotta (1-3 uses per screen max) */
  --color-accent-soft:    oklch(85% 0.06 45);    /* soft terracotta wash, rare */
  --color-link:           oklch(46% 0.085 240);  /* muted Adriatic for links */
  --color-link-hover:     oklch(38% 0.10 240);
  --color-success:        oklch(58% 0.12 145);
  --color-warning:        oklch(68% 0.16 70);
  --color-error:          oklch(54% 0.18 25);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface:        oklch(18% 0.020 240);
    --color-surface-elev:   oklch(22% 0.022 240);
    --color-ink:            oklch(94% 0.012 75);
    --color-ink-muted:      oklch(70% 0.012 75);
    --color-border:         oklch(28% 0.018 240);
    --color-accent:         oklch(68% 0.14 45);
    --color-link:           oklch(70% 0.10 220);
  }
}
```

Dark mode is opt-in via `prefers-color-scheme`, not the default. Light is the design intent.

### Typography (resolved)

- **Display**: **Spectral** (Production Type, free Google Fonts). Weights 300/400/500. Italic 300/400 used for emphasis (`<em>`, evocative phrases like "Mentre sei lì.")
- **Body**: **Schibsted Grotesk** (Schibsted media group, free Google Fonts). Weights 400/500/600/700.
- **Type scale** (modular 1.25 ratio):
  - `--text-xs`: 0.75rem (12px) — eyebrows, microcopy
  - `--text-sm`: 0.875rem (14px) — secondary labels
  - `--text-base`: 1rem (16px) — body
  - `--text-lg`: 1.125rem (18px) — lead body
  - `--text-xl`: 1.25rem (20px) — h4
  - `--text-2xl`: 1.5rem (24px) — h3
  - `--text-3xl`: 2rem (32px) — h2
  - `--text-4xl`: clamp(2.2rem, 5vw, 3.4rem) — h1 hero
  - `--text-5xl`: clamp(2.8rem, 7vw, 4.8rem) — display (rare landing hook)
- **Letter-spacing**: `-0.018em` on large headings, `-0.012em` on mid, normal on body, `0.22em` on uppercase eyebrow labels.
- **Line-height**: 1.65 body prose, 1.2 headings, 1.3 UI labels.
- **Italic policy**: only on Spectral, for narrative emphasis. Never for product names or Latin abbreviations.
- **Body line length cap**: `max-width: 65ch` on prose.
- **Loading**: `<link rel="preconnect">` + `<link rel="preload">` for hero font. `font-display: swap` to prevent FOIT.

### Spacing scale

4pt base, semantic tokens (not pixel-named):
```css
--space-2xs: 0.25rem;  /* 4px */
--space-xs:  0.5rem;   /* 8px */
--space-sm:  0.75rem;  /* 12px */
--space-md:  1rem;     /* 16px */
--space-lg:  1.5rem;   /* 24px */
--space-xl:  2rem;     /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
--space-4xl: 6rem;     /* 96px */
```
Use `gap` not `margin` for sibling spacing. Vary spacing for hierarchy; don't apply identical padding everywhere.

### Component patterns

- **Cards**: full 1px border in `--color-border`, subtle background tint (`--color-surface-elev`), no drop shadows. Never `border-left`/`border-right` >1px (banned by /impeccable).
- **Hero**: left-aligned text, asymmetric grid, optional photographic full-bleed image with terracotta overlay. Italic Spectral em for the kicker phrase.
- **Audio player**: large round play button as visual anchor (always largest interactive element on a guide page). Chapters as plain list with leading numbers, not boxed cards.
- **Buttons**: solid `--color-ink` background with white text for primary CTA; ghost border for secondary; text-only with underline for tertiary. NO gradient buttons. NO drop shadows. NO icon-prefix unless icon adds meaning.
- **Forms**: minimal labels, generous padding, focus ring 2px `--color-accent` outline.
- **Eyebrows**: short hairline + uppercase label in `--color-accent`, `letter-spacing: 0.22em`, weight 600 Schibsted Grotesk.

### Banned visual patterns (project-specific, derived from /impeccable)

- ❌ Cormorant Garamond, Inter, IBM Plex, Fraunces, Newsreader, Lora, Crimson, Playfair Display, Syne, DM family, Plus Jakarta, Outfit, Instrument
- ❌ Side-stripe borders (left/right colored borders >1px on cards/callouts/alerts)
- ❌ Gradient text (background-clip: text on text fill)
- ❌ Glassmorphism (blur + glass cards as decoration)
- ❌ Pure black `#000` or pure white `#fff` (always tint toward brand hue)
- ❌ Cyan-on-dark / purple-blue gradients
- ❌ Bouncy/elastic easing
- ❌ Modal dialogs except when truly unavoidable
- ❌ Centered text everywhere; favor asymmetric left-aligned editorial layout
- ❌ Same padding everywhere; vary spacing for hierarchy
- ❌ Icons inside circles above every heading (templated AI tell)

### Motion

- Use `transform` and `opacity` only; never animate `width`/`height`/`padding`/`margin`.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart) for entrances; default `ease-out` for hover.
- Durations: 150ms (UI feedback), 250ms (entrance), 400ms (large reveals). Never longer.
- Respect `prefers-reduced-motion: reduce` — disable all non-essential animation.
- Hero load: single staggered sequence (eyebrow → h1 → subtitle → CTA → hero card) across ~600ms total. No scattered micro-interactions.

### Accessibility (WCAG AA minimum, AAA on body text)

- All text ≥ 4.5:1 contrast. Verified: ink `oklch(20% 0.025 240)` on surface `oklch(96% 0.012 75)` = ~14.8:1 ✓
- Audio player: full keyboard navigation (Tab + Space play/pause + ← → seek), ARIA labels on every control, `role="region"` on player container, `aria-live="polite"` on current time.
- Full transcript published on every guide page (also benefits SEO).
- Lang attribute on `<html>` per page (`it` or `en`), correct hreflang on every page.
- Skip-to-content link in nav.
- Focus visible: 2px outline `--color-accent` on every interactive element.
- Screen reader testing required (VoiceOver Mac, NVDA Windows) before each release.

---

## 6. Content production pipeline

### Per-guide workflow

1. **Research** (Domenico, ~8-16h): topic, places, episodes, sources documented in `src/content/scripts/<slug>.research.md`.
2. **Italian script** (Domenico, ~4-8h): 1500-3000 words narrative structure (hook → 3-5 chapters → close). Saved to `src/content/scripts/<slug>.it.md` with `## Chapter N` H2 headers marking chapter boundaries.
3. **English translation** (DeepL Pro draft, Domenico revises idioms/place names, ~1-2h): saved to `src/content/scripts/<slug>.en.md`.
4. **Audio generation** (~50min total: 20 min ElevenLabs + 30 min editing): Python script `scripts/generate-guide.py <slug>` calls ElevenLabs API with cloned Domenico voice, splits script into ≤2500-char chunks, generates per-chunk MP3, concatenates with 200ms silence between, exports 128kbps MP3. Generates IT and EN.
5. **Trailer curation** (~30 min): Domenico hand-selects 45-60s extract with cliffhanger; saved to `public/audio/trailers/<slug>.mp3`. Trailers are deliberately tease-y, not summary-y.
6. **MDX file**: frontmatter (title IT/EN, subtitle IT/EN, duration, chapters with timestamps, cover image, coords, price, SEO descriptions) + body with full transcript. Saved to `src/content/guides/<slug>.mdx`.
7. **R2 upload** (~5 min): `scripts/upload-r2.py` uploads `full-it.mp3` and `full-en.mp3` to keys matching `audio_full_key_*` in MDX.
8. **Git commit + push**: triggers Netlify build → deploys to `localis.guide`.

Total time per new guide: **14-30 hours** (90% research+writing, 10% technical).

### ElevenLabs voice cloning setup

- **Plan**: Creator $22/mo (provides Professional Voice Cloning, 100k chars/mo).
- **Sample collection**: Domenico records 1-3 hours of clean audio in quiet room with USB mic (Samson Q2U €70 or Blue Yeti €100). Mix of narration, dialogue, descriptions, exclamations. Italian + a few English phrases.
- **Training**: Upload to ElevenLabs → "Add Voice" → "Professional Voice Cloning" → wait 2-3 hours for training.
- **Tuning**: stability 0.55, similarity_boost 0.85, style 0.20, speaker_boost on. Refined per-script if needed.
- **Quality control**: Domenico reviews every generated MP3 before publication. Pronunciation list maintained for problematic words (e.g., "Murat" → "Mu-rà") with phonetic substitutions or `<break>` SSML tags inserted into source script.

### Watermarking (anti-piracy soft layer)

When buyer accesses guide via magic link, the audio served is NOT the raw R2 file but a watermarked variant generated on first request and cached:

- Watermark: 2-second TTS intro saying `"Localis · guida personale per <buyer-name-or-email-prefix>"`.
- Generated once per (email × guide) tuple, cached at R2 key `wm/<sha256(email+slug)>.mp3`.
- ElevenLabs cost per watermark: <€0.01.
- Cache hit rate expected ~99% (one buyer plays many times → one generation).
- Effect: psychological deterrent against forwarding MP3s; even if pirated, source is identifiable.

### Content roadmap (18 months Puglia)

| Quarter | City | New guides | Cumulative |
|---------|------|------------|------------|
| Q2 2026 | Bari | 5 existing + 2 new (Bari di Notte, Murat) | 7 Bari |
| Q3 2026 | Polignano | 3 (sea, grottoes, Modugno) | 10 |
| Q4 2026 | Ostuni + Lecce | 2 + 3 = 5 | 15 |
| Q1 2027 | Matera + Trani | 3 + 2 = 5 | 20 |
| Q2 2027 | Otranto + Gallipoli + Alberobello | 6 | 26 |
| **18mo total** | **8 cities** | **26 audio guides** | **26** |

---

## 7. Audio access & offline UX

### Magic link generation

Post-payment, a JWT token is generated with payload `{email, guide_slugs[], stripe_session_id, partner_id, iat}` and HS256-signed with `JWT_SECRET` (32+ random chars in Netlify env). No expiry; the token is "permanent" until manually revoked via JWT secret rotation or env-based blacklist.

Magic link format: `https://localis.guide/access/<base64url-encoded-jwt>` (~250 chars total).

### Email delivery (Resend)

Triggered from `/api/webhook.ts` upon receiving Stripe `checkout.session.completed`:

```
Subject: La tua audioguida è pronta · Localis
From: Localis <noreply@localis.guide>

Hi,

Grazie per aver scelto Localis. La tua audioguida ti aspetta:

  🎧 [Guide title]  ([N] min)

  [Apri la guida →]

Come funziona:
1. Apri il link sopra dal tuo telefono
2. Clicca play. Cammina. Ascolta.
3. Il link è tuo per sempre — riascoltala quando vuoi
4. Funziona anche offline dopo il primo play

Salvalo nei preferiti del browser.
Se cambi telefono, riapri lo stesso link.

Domande? Rispondi a questa email — leggiamo tutto.
Domenico & Luigi · Localis
```

Plain-text alternative version always included (deliverability).

### Audio access page (`/access/[token]`)

- Verifies JWT signature server-side (Astro endpoint).
- If invalid → redirect `/access-invalid` with email recovery form.
- If valid → renders one `<AudioPlayer>` component per purchased guide, with chapters list, IT/EN switcher, controls (play/pause, ±15s, speed 1×/1.25×/1.5×/2×), progress bar.
- Registers Service Worker on page load.
- Shows hint banner: "💡 Salva nei preferiti — è solo tuo, vale per sempre."

### Audio URL endpoint (`/api/audio-url`)

GET parameters: `guide`, `token`, `lang` (default `it`).

Logic:
1. Verify JWT.
2. Check guide is in `decoded.guide_slugs`.
3. Check monthly usage rate-limit: max 50 streams per (token, guide) per calendar month. If exceeded → 429.
4. Compute watermark cache key `wm/<sha256(email + slug)>.mp3`. If absent in R2, generate watermarked variant (concat 2s TTS intro + raw audio) and upload.
5. Generate signed R2 URL valid 1 hour.
6. Increment usage counter (Stripe metadata or simple Turso/SQLite counter Phase 1+).
7. Return JSON `{url, expires_in: 3600}`.

### Service Worker (`public/sw.js`)

- Cache strategy:
  - **Audio R2 URLs**: cache-first. After first network fetch, audio is cached in browser; subsequent plays serve from cache (offline-ready).
  - **HTML pages**: network-first, fallback to `/offline.html`.
  - **Static assets** (CSS, JS, images): cache-first.
- Custom message handler `PRECACHE_AUDIO`: triggered on first play to ensure full file downloads in background while user listens.
- Cache versioning: `localis-audio-v1`, `localis-static-v1`. Old caches purged on activate.
- Audio cache size budget: ~50MB per user (Safari iOS effective cap). 5 guides × ~7MB = 35MB, fits.

### iOS Safari quirks (verified)

- Autoplay restriction: audio requires user gesture. Play button is always the trigger; this is acceptable.
- Cache eviction: Safari may evict caches if site unvisited 7+ days. Mitigation: SW re-caches on next visit transparently.
- PWA install (Phase 7): adding `manifest.json` + "Add to Home Screen" prompt yields more durable cache.
- Range requests: R2 supports `Accept-Ranges: bytes` natively; iOS audio seeking works.
- HTTPS required: Netlify provides default; SW won't register otherwise.

### Recovery flow

`/recover` page: simple email input. POST `/api/recover` searches Stripe for purchases by `customer_email`, regenerates JWT for matching `guide_slugs`, sends fresh magic link email. Rate-limited 3 requests/hour/IP to prevent abuse.

### Edge cases

| Case | Handling |
|------|----------|
| Token invalid/corrupted | Redirect `/access-invalid` with recovery form |
| Token revoked (admin blacklist) | Same page + "contact support" message |
| Email matches no Stripe purchase | Polite "no purchase found, check email used at checkout" |
| R2 unreachable | Frontend retries 3× with exponential backoff; Sentry alerts |
| SW not supported (legacy browser) | Streaming-only fallback, banner informs user |
| Cache full (>browser limit) | LRU eviction by SW; re-download on next play |
| Multi-language switcher | Same token, different `lang` param to `/api/audio-url` → different audio file |

---

## 8. Pricing & Stripe checkout

### Pricing tiers (Phase 0)

| Product | Price | Includes |
|---------|-------|----------|
| Single guide | €4.99 | One audio guide IT+EN, lifetime access |
| Bari Completa (bundle) | €9.99 | All 3 currently-live Bari guides; expands to 5 then 7 as new Bari guides ship, price stays flat (existing buyers get freebies) |

Phase 1 (after 100 paying customers): introduce **Puglia Pass €19.99** unlocking all current and future Puglia guides. One-time, no subscription.

Phase 2+ (after 1000 customers): optional **Localis Premium €4.99/mo** for early access + extended cuts + interactive map. Reassess based on data.

### Stripe Products & Prices setup

Configured in Stripe Dashboard before launch. IDs stored in `src/data/stripe-prices.json` (committed; price IDs are not secrets).

```json
{
  "bari-vecchia": "price_<...>",
  "porto-bari": "price_<...>",
  "san-nicola": "price_<...>",
  "il-meglio-di-bari": "price_<...>",
  "tre-teatri": "price_<...>",
  "bari-completa": "price_<...>"
}
```

### Checkout flow

1. User on `/guide/<slug>` clicks CTA "Ascolta tutto · €4.99" or "Acquista Bari Completa · €9.99".
2. Frontend POSTs `/api/checkout {product, lang}`.
3. Server endpoint:
   - Reads `lg_partner` cookie (if present).
   - Determines `guide_slugs` (single or bundle).
   - Creates Stripe Checkout session with `metadata` (product, guide_slugs CSV, partner_id, lang), `automatic_tax: enabled`, `consent_collection.terms_of_service: required`, `allow_promotion_codes: true`.
   - If `partner_id` and partner has `stripe_account_id`: adds `payment_intent_data.transfer_data` to split 25% to partner Connect account.
   - Returns `session.url`.
4. Redirect to Stripe Checkout (hosted page); user pays.
5. Stripe webhook → see Section 7.
6. Redirect to `/thanks?session_id=cs_xxx` showing "Tra 30 secondi ricevi email. Non vedi nulla? Apri la tua guida ora →" (button generates token from session lookup).

### VAT handling

- **Stripe Tax** enabled (~$0.50/transaction).
- OSS (One-Stop-Shop) registration with Italian Agenzia Entrate required pre-launch (~1 week).
- All site-displayed prices include VAT (Italian consumer law).
- Stripe Checkout shows breakdown for Italian buyers ("Prezzo €4.99 — IVA €0.90 inclusa") and adapts for non-EU.

### Refund policy

- Default: full refund within 14 days (EU consumer rights for digital goods).
- Stripe `charge.refunded` webhook → blacklist token (env-based deny list initially; DB-based Phase 4+).
- Stripe Connect: partner commission auto-clawed back on refund (native behavior).
- Exception (Phase 1): if `>30%` audio streamed, refund denied per terms. Tracking via SW message events sent server-side; not implemented in Phase 0.
- TOS published at `/termini` with consumer rights, foro di Bari, 14-day cooling-off, post-fruition non-refund clause.

### Coupon codes (allowlisted in Stripe)

| Code | Discount | Cap | Audience |
|------|----------|-----|----------|
| `BENVENUTO50` | 50% off first purchase | 100 | Initial launch |
| `EXCELSIOR10` | 10% off | unlimited | Hotel partner Excelsior |
| `BARIPRESS25` | 25% off | 30 | Local press review |
| `INFLUENCER` | 100% off | 5 | Influencer review trades |

No coupon stacking (Stripe default).

### Single-purchase upsell (no cart)

On every single-guide page, the bundle is presented as a sibling option (Bari Completa, "Risparmi €4.98"). Industry-standard 30-40% bundle attach rate expected.

No cart system; each transaction is one Stripe session. Multi-product purchase = repeat checkout or bundle.

---

## 9. Partner QR program

### Onboarding

1. Domenico identifies candidate partner (hotel, B&B, bar, restaurant, shop in Bari Vecchia or Bari proper).
2. In-person or email pitch with 1-pager (commission %, no setup work, free QR cards, Stripe Connect onboarding).
3. Partner signs verbally; Localis sends `/diventa-partner` form link.
4. Form fields: business name, type, contact email, city, address, IBAN (only for fallback, not stored — used only for paper agreement).
5. On submit, partner-MDX-draft created locally + Stripe Connect onboarding link sent via email.
6. Partner completes Stripe Connect Standard (5-10 min, fills tax info on Stripe).
7. Stripe sends webhook with `account.updated` → Localis populates `stripe_account_id` in MDX, sets `status: active`.
8. Domenico orders printed QR cards via Vistaprint or local Bari printer; ships welcome kit (5 cards + welcome letter + 1-pager) to partner.
9. Partner places cards in agreed locations (rooms, lobby, tables).

### URL & cookie attribution

- Partner-specific URLs:
  - Generic: `localis.guide/?p=<slug>` (sets cookie, shows normal homepage)
  - Branded landing: `localis.guide/p/<slug>` (sets cookie, shows partner-branded landing with custom welcome copy)
  - Deep link: `localis.guide/p/<slug>/<guide-slug>` (sets cookie, jumps to specific guide)
- Cookie: `lg_partner=<slug>`, `path=/`, `max-age=2592000` (30 days), `SameSite=Lax`. Backed up to localStorage for Safari ITP resilience.
- Last-click attribution: if user passes through multiple partner URLs, the most recent wins.

### Commission flow

Stripe Connect Standard split-payment in `payment_intent_data.transfer_data`:
```
amount_to_partner = floor(total_cents × 0.25)
```
Funds settle directly to partner's Stripe account. Stripe handles their tax compliance, not Localis.

Refunds: Stripe Connect auto-claws back partner commission on full refund.

### QR card production

`scripts/generate-qr-cards.py`:
- Reads partner MDX file.
- Generates QR code encoding `https://localis.guide/p/<slug>`.
- Lays out 9×13cm bilingual card (front IT, back EN) with QR + tagline + brand mark.
- Exports print-ready PDF (300dpi, CMYK, bleed marks).
- Print options: Vistaprint (~€0.30/card at 100+ qty) or local Bari print shop.

### Partner dashboard (Phase 6)

`/partner/dashboard` accessed via magic link to partner contact email. Shows:
- Total sales generated by their QR cookie attribution
- Commission earned (current month + lifetime)
- Last 10 payouts (Stripe receipt links)
- QR card visit analytics (visits, conversions, conversion rate)
- Top guides sold via their attribution
- "Order more cards" CTA

Phase 0 fallback: Domenico generates monthly partner reports manually from Stripe + Plausible filters.

### Anti-fraud

- Soft self-purchase check: flag if partner-attributed sale comes from same IP that registered the partner.
- 30-day cookie window; expires automatically.
- Stripe Connect handles refund clawback nativey.
- Partner Connect account suspended (rare) → fallback: payment fully retained by Localis, Domenico pays partner commission manually.

---

## 10. SEO, performance, accessibility, analytics

### SEO foundation

- URL structure: `/`, `/en/`, `/guide/<slug>`, `/en/guide/<slug>`, `/citta/<slug>`, `/storia/<slug>` (blog Phase 3+).
- Canonical URL on every page; hreflang `it`, `en`, `x-default` between localized versions.
- `<title>` and `<meta description>` per page, populated from MDX frontmatter `seo.description_*`.
- Open Graph + Twitter cards on every page; OG images dynamically generated at build time via `@vercel/og` or `satori` (1200×630, brand-styled with cover photo + title in Spectral).
- Structured data (JSON-LD):
  - `AudioObject` per guide page (name, description, duration, encoding, language, author Domenico, publisher Localis, offer with price/currency/availability)
  - `TouristAttraction` per guide (geo coordinates, address)
  - `Product` + `AggregateRating` (once reviews exist, Phase 3+)
  - `Organization` on homepage (name, url, logo, founders, sameAs links to social)
- Sitemap.xml auto-generated via `@astrojs/sitemap`, locales declared, `/access/`, `/api/`, `/thanks` excluded.
- robots.txt: `Disallow /access/, /api/, /thanks`. `Sitemap: https://localis.guide/sitemap-index.xml`.

### Content marketing (Phase 3+)

Blog at `/storia/<slug>`. Articles 1500-2500 words, narrative, SEO-targeted for local-intent + curiosity-intent keywords. Calendar respects hard rule (CLAUDE.md memory `feedback_no_batch_publishing.md`): max 1 article every 2-3 weeks, never batched, every article with author + JSON-LD + sources cited.

Initial keyword targets (volumes are estimates):
- "audioguida bari" / "bari vecchia cosa vedere" (transactional)
- "san nicola bari storia" / "porto bari storia" / "polignano a mare storia" (curiosity/long-tail)
- "bari escursione crociera" (cruise-specific intent)

### Performance budget

- Lighthouse Performance ≥ 90 mobile, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.
- Per-page weight (excluding audio): ≤ 100KB
  - HTML ≤ 30KB gzipped
  - CSS ≤ 20KB gzipped (Tailwind purge)
  - JS ≤ 15KB gzipped (player + i18n + SW register)
- Audio sizes:
  - Trailer: 64kbps mono ~500KB per 60s
  - Full guide: 96-128kbps mono ~5-8MB per 9 min
- Optimizations: Tailwind purge; Astro `client:visible` on player; `astro:assets` for AVIF/WebP image generation + responsive srcset; font subset (latin-extended for Spectral italic supporting Italian); preconnect Google Fonts; `font-display: swap`; aggressive cache headers in `netlify.toml` for `/audio/trailers/*` and `/_astro/*` (1 year immutable); SW pre-cache trailers on first homepage visit (~3MB) for instant subsequent plays.

### Accessibility

- WCAG AA minimum, AAA on body text contrast.
- Full transcript published per guide (SEO + screen reader).
- Lang attribute correct.
- Skip-to-content link in nav.
- Audio player: ARIA labels on every control, role="region" on container, `aria-live="polite"` on time updates.
- Keyboard navigation: Tab + Space play/pause + ←/→ seek 15s.
- Focus visible: 2px terracotta outline.
- `prefers-reduced-motion: reduce` respected.
- Form labels properly associated.
- Alt text on all images, descriptive not decorative.

### Analytics

- **Plausible** primary (€9/mo, cookieless, no banner needed).
- Custom events tracked: `Trailer Played` (with guide prop), `Checkout Started` (with product + partner props), `Checkout Completed`, `Audio Played Full` (>80% playthrough), `Recovery Requested`, `Partner QR Visit`.
- **Microsoft Clarity** added at Phase 3 (free, GDPR-friendly with PII masking) for heatmaps and session replay.
- Server-side: Stripe metadata + webhook events provide ground-truth conversion data.

### Critical funnel targets

| Step | Target conversion |
|------|-------------------|
| Homepage view | 100% baseline |
| Trailer played | 35-45% |
| Pricing scrolled to | 25-35% |
| Checkout started | 8-12% |
| Checkout completed (of started) | 60-75% |
| Overall homepage → buyer | 5-9% |
| Magic link clicked (of completed) | 90%+ |
| Audio played full (of accessed) | 70%+ |

### Vanity short-links

QR cards encode `localis.guide/p/<slug>` (no third-party shortener). All path ownership stays internal; no link-rot risk.

### Error handling

- 404 page (`src/pages/404.astro`): branded, suggests homepage + 3 top guides.
- `public/offline.html`: minimal "Sei offline. Le guide aperte funzionano. Riapri quando sei in WiFi."
- Sentry captures JS + serverless errors. Daily digest reviewed by Luigi.
- Audio MP3 path: never changed after publication; if rename ever necessary, 301 redirect retained indefinitely.
- JWT secret: rotated only on emergency; rotation procedure includes regenerating tokens for all active customers via Resend bulk send.

---

## 11. Roadmap

Eight phases over 18 months. Each phase has explicit exit criteria. Phase N+1 does not begin until Phase N exit criteria are met.

### Phase 0 — Foundation (Weeks 1-2)
**Goal**: production-ready sellable site.

Deliverables:
- GitHub private repo `localis-guide` initialized.
- Astro 5 + Tailwind setup, deploy to Netlify via Git integration.
- `localis.guide` apex + www DNS connected, SSL active.
- Design system tokens (palette + typography + spacing) implemented in `src/styles/tokens.css`.
- Components: Layout, Header, Footer, LangSwitcher, GuideCard, AudioPlayer, TrailerPlayer, PriceCard, FAQ.
- Homepage IT + EN.
- 5 guide pages with trailer + paywall + chapters preview.
- Stripe Checkout wired (existing account); 6 Products + Prices configured.
- Resend account + magic link email template (HTML + plain text).
- JWT system + `/access/<token>` page + `/api/audio-url` + `/api/webhook` + `/api/checkout` + `/api/recover`.
- Service Worker offline cache.
- Cloudflare R2 bucket + signed URL helper.
- Stripe Tax + Italian OSS registration.
- `/termini`, `/privacy`, `/cookie` legal pages (custom or Iubenda free tier).
- Plausible analytics + 7 events tracked.
- Sitemap + robots + structured data on all pages.
- Sentry error tracking integrated.
- Email `noreply@localis.guide` configured (Resend domain auth: SPF, DKIM, DMARC).

Exit criteria:
- ✓ End-to-end purchase test passes: homepage → trailer play → checkout test card → email received → magic link works → audio plays → offline still plays after airplane mode.
- ✓ Lighthouse mobile Performance ≥ 90.
- ✓ 5 sandbox Stripe purchases without error.

Estimated effort: 80-100 hours (Luigi).

### Phase 1 — Voice cloning & content production (Weeks 3-4)
**Goal**: 5 guides live with cloned Domenico voice.

Deliverables:
- ElevenLabs Creator subscription active.
- Domenico records 1.5-2h voice sample in quiet environment with USB mic.
- PVC training complete; tuning pass with parameter sweep.
- Python pipeline `scripts/generate-guide.py` tested.
- 5 IT scripts + 5 EN translations finalized.
- 5 Italian + 5 English audio MP3s generated, watermarked, uploaded to R2.
- 5 hand-curated trailers (60s each with cliffhanger) in `public/audio/trailers/`.
- 5 MDX files in `src/content/guides/` with metadata + chapters + transcripts.
- Domenico QA pass on every track.

Exit criteria:
- ✓ All 5 guides playable on live site with cloned voice.
- ✓ Domenico personally approves quality ("è la mia voce credibile").
- ✓ Local pronunciation correct (Murat, San Sabino, etc.).

Estimated effort: 40-60 hours (30h Domenico voice + script, 20h Luigi pipeline + automation).

### Phase 2 — Partner program launch (Weeks 5-6)
**Goal**: 5 pilot partners signed with QR cards distributed.

Deliverables:
- Stripe Connect Standard activated.
- `/diventa-partner` form + landing.
- Partner registry MDX system.
- `/p/<slug>` partner-branded landing pages.
- Cookie + localStorage attribution end-to-end tested.
- Webhook split-payment via `transfer_data` working in production with test partner.
- `scripts/generate-qr-cards.py` produces print-ready PDFs.
- 5 pilot partners identified, contacted, signed:
  - 2 hotels (mid-tier, 30-50 rooms)
  - 2 B&Bs (Bari Vecchia adjacent)
  - 1 high-traffic bar/café in city center
- 25 cards plastified and distributed physically by Domenico.
- 1-page pitch deck for outbound use refined.

Exit criteria:
- ✓ 5 partners with active `stripe_account_id`.
- ✓ 25 physical cards placed.
- ✓ ≥1 real sale tracked through partner attribution.

Estimated effort: 30-40 hours (15h tech, 20h Domenico outreach).

### Phase 3 — Validation (Months 2-3)
**Goal**: 100 paying customers + 20 reviews.

Deliverables:
- TripAdvisor "Tours & Activities" listing for Bari (Localis as audio-guide operator).
- Google Business Profile.
- Instagram + TikTok @localis.guide accounts launched.
- 8 Instagram posts (1 per guide × 2: trailer extract + behind-the-scenes).
- 4 TikTok/Reels (one weekly: Domenico tells a Bari story).
- Email post-purchase + 7-day-later follow-up requesting review.
- Reviews section on homepage rendering 10+ entries.
- Outreach to 10 micro-influencers (1k-20k followers, Puglia food/travel) with comp guide trials.
- 1-2 local press mentions (BariToday, Borderline24, Quotidiano di Puglia).
- Daily KPI review by Domenico.
- First conversion optimization round (A/B test homepage CTA copy or pricing display).

Exit criteria (after 8 weeks):
- ✓ 100+ paying customers cumulatively.
- ✓ 20+ reviews (Trustpilot, Google, on-site).
- ✓ Conversion rate ≥ 4% homepage → buyer.
- ✓ ≥ 8 active partners.
- ✓ NPS ≥ 40 (post-listen survey).

If exit criteria fail: diagnose (traffic? conversion? product? voice?). Decision gate: pivot vs iterate.

Estimated effort: ongoing — Domenico ~10-15h/week marketing, Luigi ~5h/week support.

### Phase 4 — Bari content scaling (Month 4)
**Goal**: complete Bari catalog; bundle stays €9.99 with more value.

Deliverables:
- 2 new Bari guides published: "Bari di Notte — Quello che non Ti Raccontano", "Murat — Quando Bari Diventò Moderna".
- Bari Completa bundle now contains 5 guides; price unchanged.
- Existing buyers receive "regalo" email with magic link upgraded to include new guides.
- 4 SEO blog articles published (1 every 2 weeks per CLAUDE.md hard rule on no-batch-publishing).

Exit criteria:
- ✓ 7 Bari guides live.
- ✓ 250+ paying customers cumulatively.
- ✓ 30+ active partners.
- ✓ Top 3 Italian keywords on Google page 1: "audioguida bari", "bari vecchia cosa vedere", "san nicola bari storia".

Estimated effort: ~60 hours (40h research/writing Domenico, 20h tech Luigi).

### Phase 5 — Polignano expansion (Months 5-6)
**Goal**: first city beyond Bari.

Deliverables:
- 3 Polignano guides published: "Polignano sul Mare — La Pietra che si Spezza", "Le Grotte di Polignano — Sotto il Mare", "Domenico Modugno — La Voce che Cambiò l'Italia".
- `/citta/polignano` city hub page.
- "Polignano completa" bundle €7.99.
- 10 partners outreach in Polignano (B&Bs, restaurants).
- Local press push.
- Optional: TikTok ads experiment €100/mo for 30 days to test paid acquisition.

Exit criteria:
- ✓ Polignano live + 30 sales in first month.
- ✓ 5+ Polignano partners active.
- ✓ 500+ paying customers cumulatively.

### Phase 6 — Puglia Pass + partner dashboard (Months 7-9)
**Goal**: scale revenue through Pass + automate partner ops.

Deliverables:
- **Puglia Pass €19.99** launched: unlocks all current and future Puglia guides.
- Existing customers offered upgrade pricing (delta-only).
- `/partner/dashboard` self-service via partner email magic link.
- 3 new cities: Ostuni (3 guides), Lecce (3 guides), Trani (2 guides).
- Interactive Puglia map on homepage with city pins.
- Monthly newsletter "Storia del mese" engaging past buyers.

Exit criteria:
- ✓ 8 cities live, 18+ guides total.
- ✓ 1500+ paying customers cumulatively.
- ✓ Puglia Pass = ≥25% of monthly revenue.
- ✓ Monthly revenue ~€3-5k.

### Phase 7 — Defense & scale (Months 10-12)
**Goal**: differentiation against AI-generated competitors + scale acquisition.

Deliverables:
- Optional GPS-aware mode: web Geolocation API auto-advances chapters near matching coords.
- Lite user account: `/le-mie-guide` accessed via email magic link, lists all purchased guides.
- PWA: `manifest.json` + "Add to Home Screen" prompt for durable mobile cache.
- Final Puglia city expansion: Otranto, Gallipoli, Alberobello, Vieste.
- Bari Port Authority partnership for cruise terminal welcome-area material.
- First international PR push (Polish/German press, top international markets).

Exit criteria:
- ✓ 12+ Puglia cities, 30+ guides.
- ✓ 5000+ paying customers cumulatively.
- ✓ Operating margin positive.
- ✓ Domenico full-time on Localis.

### Phase 8+ (>Month 18) — Out of scope for this design
Italy expansion, native apps, subscription model, internationalization beyond Puglia content — all deferred. Will require new design doc and re-evaluation.

---

## 12. Risks & mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ElevenLabs voice clone unconvincing | Medium | High | Start with sample-tier test before $22/mo commitment. Plan B: hire pro voice actor for €500-1000 one-time. |
| Conversion rate <2% | Medium | High | Iterate homepage + pricing. Plan B: introduce €2.99 entry-tier guide. |
| Zero partner signed in 30 days | Low | Medium | Offer first partner 0% commission + comped guides for testing. |
| Viral piracy | Low | High | Watermark + rate limit + token rotation. Accept 5-10% piracy as cost-of-business. |
| Winter seasonality (Nov-Mar) | High | Medium | Off-season content marketing; "Christmas gift" bundle Dec; January promo. |
| Comune Bari releases free competing audioguide | Low | Medium | Differentiate on "narrative authoring", reposition copy if needed. |
| Domenico burnout on content | Medium | High | AI pipeline accelerates. Plan B: freelance researcher (€100/script) for base research. |

---

## 13. Success metrics summary

Top-line KPIs reviewed monthly:

| Metric | Phase 0 target | Phase 3 target | Phase 6 target | Phase 7 target |
|--------|----------------|----------------|----------------|----------------|
| Cumulative paying customers | 0 | 100 | 1500 | 5000 |
| Active partners | 0 | 8 | 30 | 100 |
| Live audio guides | 5 | 7 | 18 | 30+ |
| Cities covered | 1 | 1 | 4 | 12+ |
| Monthly revenue (net) | €0 | €300 | €3-5k | €10-15k |
| Conversion rate (HP→buyer) | n/a | 4%+ | 5%+ | 6%+ |
| Lighthouse Performance | 90+ | 90+ | 90+ | 90+ |

---

## 14. Out of scope (≤18 months)

Explicitly NOT in this design — to be reconsidered only after Phase 7:

- Native iOS / Android apps
- Geographic expansion outside Puglia (Sicily, Tuscany, etc.)
- Subscription products (other than possible Phase 2 Premium experiment)
- UGC marketplace where users author their own guides
- Multi-narrator content (preserve single Domenico voice for brand coherence)
- Direct MP3 file download (decided in Section 7: streaming-first only)
- Social features (friends-listened-to, public reviews, etc.)
- VR / AR augmentations
- B2B white-label for tour operators

---

## 15. Operational economics

### Fixed monthly costs (cruising state, Phase 6+)

| Item | Cost |
|------|------|
| ElevenLabs Creator | $22 (~€20) |
| Plausible analytics | $9 (~€8) |
| Cloudflare R2 storage | ~€1 |
| Resend (post-3k email tier) | ~€20 |
| Domain renewal (amortized) | ~€1.50/mo |
| Sentry | €0 (free tier) |
| **Total fixed** | **~€50/mo** |

### Variable costs per €4.99 sale

| Item | Cost |
|------|------|
| Stripe payment fee (1.5% + €0.25) | ~€0.32 |
| Stripe Tax | ~€0.50 |
| Partner commission (when applicable, 50% of sales assumed) | ~€1.25 |
| Watermark generation (cached) | <€0.01 |
| **Net per partner-attributed sale** | **~€2.92** |
| **Net per direct sale (no partner)** | **~€4.17** |

### Break-even

- Fixed monthly: ~10 sales/month covers operational fixed costs.
- Domenico part-time wage equivalent (€1500/mo net): ~750 sales/month or ~25 sales/day.
- Phase 6 target (1500 cumulative customers, ~€3-5k/mo) clears Domenico part-time + retained earnings for content investment.

---

## Document control

This is a canonical reference. Updates require explicit revisitation; do not silently scope-creep. Material changes append a "Revision History" section below.

### Revision history

- 2026-04-28 — Initial document (Domenico + Luigi via brainstorming session with Claude Opus 4.7)

### Next steps

1. User reviews this spec end-to-end.
2. On approval, transition to `superpowers:writing-plans` skill to produce the detailed Phase 0 implementation plan (file-level tasks, code paths, test strategy).
3. Phase 0 implementation begins on its own branch (`refactor/foundation-v2`) without disturbing current `localis-guide.netlify.app`.
4. Phase 0 ships behind staging URL → final QA → cutover to production `localis.guide`.
