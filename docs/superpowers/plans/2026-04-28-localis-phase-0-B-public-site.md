# Milestone B — Public site

> Part of [Phase 0 master plan](2026-04-28-localis-phase-0-foundation.md). Prerequisite: [Milestone A](2026-04-28-localis-phase-0-A-foundation.md) complete.

**Goal:** Render the public-facing site: homepage IT/EN, 5 guide detail pages with trailer playback + paywall stub (CTA goes to Stripe in Milestone C), static legal pages, and migrate the 5 existing audioguide trailers from the legacy site. Content lives in MDX files under `src/content/guides/`.

**Architecture:** All pages are SSG (static). Each guide page is generated from its corresponding MDX in `src/content/guides/[slug].mdx`. Trailers are 60-second public MP3s in `public/audio/trailers/`. The "Ascolta tutto" CTA renders a button that POSTs to `/api/checkout` (endpoint added in Milestone C — for now the button shows a temporary stub modal "checkout disponibile presto").

**Estimated effort:** 16-20h.

---

## Files

### Created in this milestone

```
public/
├── audio/
│   └── trailers/
│       ├── bari-vecchia.mp3
│       ├── porto-bari.mp3
│       ├── san-nicola.mp3
│       ├── il-meglio-di-bari.mp3
│       └── tre-teatri.mp3
└── images/
    ├── covers/
    │   ├── bari-vecchia.jpg
    │   ├── porto-bari.jpg
    │   ├── san-nicola.jpg
    │   ├── il-meglio-di-bari.jpg
    │   ├── tre-teatri.jpg
    │   └── bari-di-notte.jpg
    └── hero/
        ├── home-it.jpg
        └── home-en.jpg

src/
├── components/
│   ├── Hero.astro
│   ├── GuideCard.astro
│   ├── TrailerPlayer.astro
│   ├── PriceCard.astro
│   ├── ChapterList.astro
│   ├── Eyebrow.astro
│   ├── SectionDivider.astro
│   └── FAQ.astro
├── content/
│   └── guides/
│       ├── bari-vecchia.mdx
│       ├── porto-bari.mdx
│       ├── san-nicola.mdx
│       ├── il-meglio-di-bari.mdx
│       └── tre-teatri.mdx
├── pages/
│   ├── index.astro                       # full IT homepage
│   ├── en/index.astro                    # full EN homepage
│   ├── guide/
│   │   └── [slug].astro                  # IT guide detail
│   ├── en/guide/
│   │   └── [slug].astro                  # EN guide detail
│   ├── about.astro
│   ├── en/about.astro
│   ├── termini.astro
│   ├── en/terms.astro
│   ├── privacy.astro
│   ├── en/privacy.astro
│   ├── 404.astro
│   ├── access-invalid.astro
│   └── recover.astro                     # form only; backend in Milestone C
└── lib/
    └── format.ts                         # utility: formatDuration, formatPrice
```

---

## Task 1: Migrate trailer MP3s and cover images from legacy site

**Files:**
- Create: `public/audio/trailers/*.mp3`, `public/images/covers/*.jpg`, `public/images/hero/*.jpg`

The legacy static site files are already on disk in `LocalisGuide/` root from earlier download. Move them into the new `public/` structure.

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p public/audio/trailers
mkdir -p public/images/covers
mkdir -p public/images/hero
```

- [ ] **Step 2: Move trailer MP3 files**

The legacy site only had ONE trailer (`trailer.mp3`, 35s for Porto di Bari). For Phase 0 launch we need 5 trailers — one per guide. Until Milestone D content production phase generates per-guide trailers via ElevenLabs, use the existing `trailer.mp3` as placeholder for all 5 guides; replace individually in Milestone D.

```bash
cp trailer.mp3 public/audio/trailers/bari-vecchia.mp3
cp trailer.mp3 public/audio/trailers/porto-bari.mp3
cp trailer.mp3 public/audio/trailers/san-nicola.mp3
cp trailer.mp3 public/audio/trailers/il-meglio-di-bari.mp3
cp trailer.mp3 public/audio/trailers/tre-teatri.mp3
```

NOTE: this is intentional placeholder. Milestone D Task 4 replaces these with hand-curated 45-60s trailers per guide.

- [ ] **Step 3: Move cover images**

```bash
cp cover-bari-vecchia.jpg public/images/covers/bari-vecchia.jpg
cp cover-porto.jpg public/images/covers/porto-bari.jpg
cp cover-san-nicola.jpg public/images/covers/san-nicola.jpg
cp cover-meglio.jpg public/images/covers/il-meglio-di-bari.jpg
cp cover-teatri.jpg public/images/covers/tre-teatri.jpg
cp cover-notte.jpg public/images/covers/bari-di-notte.jpg
cp hero-web.jpg public/images/hero/home-it.jpg
cp hero-web.jpg public/images/hero/home-en.jpg
```

- [ ] **Step 4: Optimize images (optional but recommended)**

Astro's `astro:assets` will optimize images at build time once they're imported via `import` or `<Image>` component. For now skip manual optimization; Milestone F handles AVIF/WebP variants.

- [ ] **Step 5: Verify file sizes**

```bash
ls -lh public/audio/trailers/ public/images/covers/ public/images/hero/
```

Expected: trailers ~570KB each (placeholder copies), covers 200-700KB each, hero ~350KB.

- [ ] **Step 6: Remove legacy files from repo root**

We already gitignored them in Milestone A but let's actually delete to keep the working directory clean:

```bash
rm -f index.html bari-vecchia-audioguida-v2.html il-meglio-di-bari-audioguida.html porto-bari-audioguida.html san-nicola-audioguida-completa.html tre-teatri-bari-audioguida.html
rm -f bari-vecchia-v2.mp3 porto-bari.mp3 san_nicola_audio_completo.mp3 trailer.mp3
rm -f bari-street-web.jpg cover-bari-vecchia.jpg cover-meglio.jpg cover-notte.jpg cover-porto.jpg cover-san-nicola.jpg cover-teatri.jpg hero-web.jpg
```

- [ ] **Step 7: Commit migrated assets**

```bash
git add public/audio public/images
git commit -m "feat: migrate trailer MP3s and cover images from legacy site to public/"
```

---

## Task 2: Author MDX content for 5 guides

**Files:**
- Create: `src/content/guides/bari-vecchia.mdx`, `porto-bari.mdx`, `san-nicola.mdx`, `il-meglio-di-bari.mdx`, `tre-teatri.mdx`

Content draft is based on the legacy site copy. In Milestone D, Domenico revises and adds full transcripts. For Phase 0 these MDX files contain frontmatter + a short body intro (transcript stays empty until D).

- [ ] **Step 1: Create bari-vecchia.mdx**

Write to `src/content/guides/bari-vecchia.mdx`:

```mdx
---
slug: bari-vecchia
city: bari
title_it: "Bari Vecchia — Dentro la Città"
title_en: "Old Bari — Inside the City"
subtitle_it: "Nove minuti dentro il labirinto che ha resistito a tutti."
subtitle_en: "Nine minutes inside the labyrinth that resisted everyone."
duration_seconds: 540
cover: /images/covers/bari-vecchia.jpg
audio_full_key_it: guides/bari-vecchia/full-it.mp3
audio_full_key_en: guides/bari-vecchia/full-en.mp3
audio_trailer_path: /audio/trailers/bari-vecchia.mp3
chapters:
  - title_it: "Il vicolo di San Nicola"
    title_en: "San Nicola alley"
    start_seconds: 0
  - title_it: "La pasta di nonna Concetta"
    title_en: "Granny Concetta's pasta"
    start_seconds: 120
  - title_it: "I saraceni che non sono mai partiti"
    title_en: "The Saracens who never left"
    start_seconds: 280
  - title_it: "Cosa nasconde la Cattedrale"
    title_en: "What the Cathedral hides"
    start_seconds: 410
coords_start:
  lat: 41.1295
  lng: 16.8714
price_cents: 499
status: live
published_at: 2026-04-15
seo:
  description_it: "Audioguida narrativa di Bari Vecchia. 9 minuti di storie vere sui vicoli, le piazze, le tradizioni che nessuna guida turistica racconta. €4.99, IT/EN, senza app."
  description_en: "Narrative audio guide of Old Bari. 9 minutes of real stories about alleys, squares, traditions no tourist guide tells. €4.99, IT/EN, no app."
---

import Eyebrow from '../../components/Eyebrow.astro';

<Eyebrow>Capitolo 01 · Bari</Eyebrow>

Bari Vecchia non si visita. Si ascolta. Cammini fra muri di tufo che hanno mille anni di voci accumulate, e ognuna ha una storia che nessun cartello racconta.

In nove minuti scoprirai perché un papa lascia per primi i Saraceni, dove nasce la pasta più discussa d'Italia, e cosa nasconde davvero la Cattedrale dietro l'altare.

_Trascrizione completa pubblicata in Milestone D._
```

- [ ] **Step 2: Create porto-bari.mdx**

Write to `src/content/guides/porto-bari.mdx`:

```mdx
---
slug: porto-bari
city: bari
title_it: "Porto di Bari — Dove è Successo Tutto"
title_en: "Port of Bari — Where It All Happened"
subtitle_it: "Otto minuti dove l'Adriatico ha cambiato l'Italia."
subtitle_en: "Eight minutes where the Adriatic changed Italy."
duration_seconds: 480
cover: /images/covers/porto-bari.jpg
audio_full_key_it: guides/porto-bari/full-it.mp3
audio_full_key_en: guides/porto-bari/full-en.mp3
audio_trailer_path: /audio/trailers/porto-bari.mp3
chapters:
  - title_it: "L'arrivo dei profughi"
    title_en: "The arrival of refugees"
    start_seconds: 0
  - title_it: "I crociati che non tornarono"
    title_en: "The crusaders who never came back"
    start_seconds: 110
  - title_it: "Il pesce che salvò la città"
    title_en: "The fish that saved the city"
    start_seconds: 250
  - title_it: "Quel giorno del 1991"
    title_en: "That day in 1991"
    start_seconds: 380
coords_start:
  lat: 41.1340
  lng: 16.8700
price_cents: 499
status: live
published_at: 2026-04-15
seo:
  description_it: "Audioguida narrativa del Porto di Bari. 8 minuti sulla storia reale del porto: profughi, crociati, pescatori, Vlora 1991. €4.99, IT/EN."
  description_en: "Narrative audio guide of the Port of Bari. 8 minutes on the real history: refugees, crusaders, fishermen, Vlora 1991. €4.99, IT/EN."
---

import Eyebrow from '../../components/Eyebrow.astro';

<Eyebrow>Capitolo 02 · Bari</Eyebrow>

Il porto di Bari non è un punto di passaggio. È un punto dove si ferma la storia.

In otto minuti scoprirai chi è arrivato qui per primo, chi è partito e non è mai tornato, e perché nel 1991 questa città ha cambiato faccia per sempre.

_Trascrizione completa pubblicata in Milestone D._
```

- [ ] **Step 3: Create san-nicola.mdx**

Write to `src/content/guides/san-nicola.mdx`:

```mdx
---
slug: san-nicola
city: bari
title_it: "San Nicola — Il Santo Rubato"
title_en: "San Nicola — The Stolen Saint"
subtitle_it: "Sette minuti su un rapimento che ha fatto la Chiesa."
subtitle_en: "Seven minutes on a kidnapping that built a church."
duration_seconds: 420
cover: /images/covers/san-nicola.jpg
audio_full_key_it: guides/san-nicola/full-it.mp3
audio_full_key_en: guides/san-nicola/full-en.mp3
audio_trailer_path: /audio/trailers/san-nicola.mp3
chapters:
  - title_it: "Una notte del 1087"
    title_en: "A night in 1087"
    start_seconds: 0
  - title_it: "I 62 marinai di Bari"
    title_en: "The 62 sailors of Bari"
    start_seconds: 90
  - title_it: "La Basilica costruita su un compromesso"
    title_en: "The Basilica built on a compromise"
    start_seconds: 230
  - title_it: "Il Babbo Natale che non ti aspetti"
    title_en: "The Santa Claus you wouldn't expect"
    start_seconds: 340
coords_start:
  lat: 41.1308
  lng: 16.8703
price_cents: 499
status: live
published_at: 2026-04-15
seo:
  description_it: "Audioguida narrativa su San Nicola di Bari. 7 minuti sulla storia vera del rapimento del santo da Myra nel 1087, la Basilica e il Babbo Natale. €4.99."
  description_en: "Narrative audio guide on San Nicola of Bari. 7 minutes on the true story of the saint's kidnapping from Myra in 1087, the Basilica, and Santa Claus. €4.99."
---

import Eyebrow from '../../components/Eyebrow.astro';

<Eyebrow>Capitolo 03 · Bari</Eyebrow>

Nel 1087 sessantadue marinai baresi entrarono di notte in una chiesa a Myra, in Turchia. Volevano un santo. Tornarono con le sue ossa.

In sette minuti scoprirai perché Bari è diventata "la città di San Nicola" attraverso un atto che oggi chiameremmo terrorismo religioso.

_Trascrizione completa pubblicata in Milestone D._
```

- [ ] **Step 4: Create il-meglio-di-bari.mdx**

Write to `src/content/guides/il-meglio-di-bari.mdx`:

```mdx
---
slug: il-meglio-di-bari
city: bari
title_it: "Il Meglio di Bari — Mangia Prima di Capire"
title_en: "The Best of Bari — Eat Before You Think"
subtitle_it: "Otto minuti dove il cibo è prima il racconto, poi la ricetta."
subtitle_en: "Eight minutes where food is the story before the recipe."
duration_seconds: 480
cover: /images/covers/il-meglio-di-bari.jpg
audio_full_key_it: guides/il-meglio-di-bari/full-it.mp3
audio_full_key_en: guides/il-meglio-di-bari/full-en.mp3
audio_trailer_path: /audio/trailers/il-meglio-di-bari.mp3
chapters:
  - title_it: "La focaccia che divide la città"
    title_en: "The focaccia that divides the city"
    start_seconds: 0
  - title_it: "Il polpo, l'anima e il mare"
    title_en: "Octopus, soul, and the sea"
    start_seconds: 130
  - title_it: "Le orecchiette di strada Arco Basso"
    title_en: "Orecchiette of Strada Arco Basso"
    start_seconds: 270
  - title_it: "Il caffè e il dialogo"
    title_en: "Coffee and conversation"
    start_seconds: 390
coords_start:
  lat: 41.1290
  lng: 16.8710
price_cents: 499
status: live
published_at: 2026-04-15
seo:
  description_it: "Audioguida narrativa sul cibo di Bari. 8 minuti su focaccia, polpo, orecchiette di Arco Basso e caffè. Storia vera, non ricette. €4.99."
  description_en: "Narrative audio guide on Bari food. 8 minutes on focaccia, octopus, Arco Basso orecchiette, and coffee. Real stories, not recipes. €4.99."
---

import Eyebrow from '../../components/Eyebrow.astro';

<Eyebrow>Capitolo 04 · Bari</Eyebrow>

A Bari il cibo viene prima della parola. Te lo mettono nel piatto e solo dopo ti spiegano cosa stai mangiando — se decidono di farlo.

In otto minuti scoprirai perché la focaccia barese non si discute, da quale fondale viene il polpo che mangerai, e chi sono le donne che ancora oggi fanno orecchiette in strada Arco Basso.

_Trascrizione completa pubblicata in Milestone D._
```

- [ ] **Step 5: Create tre-teatri.mdx**

Write to `src/content/guides/tre-teatri.mdx`:

```mdx
---
slug: tre-teatri
city: bari
title_it: "I Tre Teatri — Fuoco, Musica e Borghesia"
title_en: "The Three Theatres — Fire, Music and Bourgeoisie"
subtitle_it: "Dieci minuti su come la Bari moderna ha bruciato e ricominciato."
subtitle_en: "Ten minutes on how modern Bari burned and started over."
duration_seconds: 615
cover: /images/covers/tre-teatri.jpg
audio_full_key_it: guides/tre-teatri/full-it.mp3
audio_full_key_en: guides/tre-teatri/full-en.mp3
audio_trailer_path: /audio/trailers/tre-teatri.mp3
chapters:
  - title_it: "Il Petruzzelli prima del fuoco"
    title_en: "The Petruzzelli before the fire"
    start_seconds: 0
  - title_it: "La notte del 1991"
    title_en: "The night of 1991"
    start_seconds: 150
  - title_it: "Il Margherita liberty"
    title_en: "The Liberty-style Margherita"
    start_seconds: 320
  - title_it: "Il Piccinni e la borghesia"
    title_en: "The Piccinni and the bourgeoisie"
    start_seconds: 470
coords_start:
  lat: 41.1227
  lng: 16.8689
price_cents: 499
status: soon
published_at: 2026-05-01
seo:
  description_it: "Audioguida narrativa sui tre teatri di Bari: Petruzzelli, Margherita, Piccinni. 10 minuti sulla notte del rogo del 1991 e sulla borghesia che li costruì. €4.99."
  description_en: "Narrative audio guide on Bari's three theatres: Petruzzelli, Margherita, Piccinni. 10 minutes on the 1991 fire and the bourgeoisie that built them. €4.99."
---

import Eyebrow from '../../components/Eyebrow.astro';

<Eyebrow>Capitolo 05 · Bari</Eyebrow>

Tre teatri raccontano tre Bari diverse: quella della borghesia ottocentesca, quella che ha bruciato in una notte del 1991, quella liberty che resiste ancora.

In dieci minuti scoprirai chi appiccò davvero il fuoco al Petruzzelli, quale teatro nasce dentro un giardino, e perché ognuno dei tre ha una sua identità di pubblico precisa.

_Trascrizione completa pubblicata in Milestone D._
```

- [ ] **Step 6: Verify content collection compiles**

```bash
pnpm astro sync
pnpm check
```

Expected: 0 errors. Astro generates `.astro/types.d.ts` reflecting the 5 guides typed with collection schema.

- [ ] **Step 7: Commit MDX content**

```bash
git add src/content/guides/
git commit -m "feat: add MDX content for 5 Bari guides (frontmatter + intro, transcripts in Milestone D)"
```

---

## Task 3: Build supporting components

**Files:**
- Create: `src/components/Eyebrow.astro`, `SectionDivider.astro`, `GuideCard.astro`, `Hero.astro`, `TrailerPlayer.astro`, `PriceCard.astro`, `ChapterList.astro`
- Create: `src/lib/format.ts`

- [ ] **Step 1: Create format utility**

Write to `src/lib/format.ts`:

```typescript
/**
 * Format duration in seconds to "M min" or "MM:SS" depending on context.
 */
export function formatDuration(seconds: number, format: 'short' | 'long' = 'short'): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  if (format === 'long') {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return `${m} min`;
}

/**
 * Format price in cents to display string. €4.99 not €4,99 (we use international notation).
 */
export function formatPrice(cents: number, currency: string = '€'): string {
  const euros = (cents / 100).toFixed(2);
  return `${currency}${euros}`;
}

/**
 * Format a Date as ISO 8601 date-only (yyyy-mm-dd).
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

- [ ] **Step 2: Create Eyebrow component**

Write to `src/components/Eyebrow.astro`:

```astro
---
export interface Props {
  class?: string;
}

const { class: className = '' } = Astro.props;
---
<div class={`flex items-center gap-sm ${className}`}>
  <div class="w-7 h-px bg-accent"></div>
  <span class="text-xs font-semibold tracking-[0.22em] uppercase text-accent">
    <slot />
  </span>
</div>
```

- [ ] **Step 3: Create SectionDivider component**

Write to `src/components/SectionDivider.astro`:

```astro
---
export interface Props {
  label?: string;
}

const { label } = Astro.props;
---
<div class="flex items-center gap-md my-2xl">
  <div class="flex-1 h-px bg-border"></div>
  {label && (
    <span class="text-xs font-semibold tracking-[0.2em] uppercase text-ink-subtle whitespace-nowrap">
      {label}
    </span>
  )}
  <div class="flex-1 h-px bg-border"></div>
</div>
```

- [ ] **Step 4: Create GuideCard component**

Write to `src/components/GuideCard.astro`:

```astro
---
import { localizedHref, type Lang } from '../lib/i18n';
import { formatDuration, formatPrice } from '../lib/format';
import type { CollectionEntry } from 'astro:content';

export interface Props {
  guide: CollectionEntry<'guides'>;
  lang: Lang;
  index: number;
}

const { guide, lang, index } = Astro.props;
const data = guide.data;
const title = lang === 'it' ? data.title_it : data.title_en;
const subtitle = lang === 'it' ? data.subtitle_it : data.subtitle_en;
const isSoon = data.status === 'soon';
const href = isSoon ? '#' : localizedHref(`/guide/${data.slug}`, lang);

const chapterCount = data.chapters.length;
const durationLabel = formatDuration(data.duration_seconds);
const priceLabel = formatPrice(data.price_cents);
const indexLabel = String(index + 1).padStart(2, '0');
---
<a
  href={href}
  class={`group relative flex flex-col bg-surface-elev border border-border rounded-lg overflow-hidden transition-colors duration-med hover:border-accent/40 ${isSoon ? 'opacity-60 pointer-events-none' : ''}`}
  aria-label={title}
  aria-disabled={isSoon}
>
  <div class="relative aspect-[4/3] overflow-hidden bg-ink/5">
    <img
      src={data.cover}
      alt=""
      loading="lazy"
      decoding="async"
      class="w-full h-full object-cover transition-transform duration-slow group-hover:scale-[1.02]"
    />
    {isSoon && (
      <div class="absolute top-sm right-sm bg-ink/80 text-surface text-xs uppercase tracking-widest font-semibold px-sm py-2xs rounded-full backdrop-blur-sm">
        {lang === 'it' ? 'Presto' : 'Soon'}
      </div>
    )}
  </div>

  <div class="flex-1 flex flex-col gap-sm p-md">
    <div class="flex items-center gap-sm text-xs font-semibold tracking-[0.18em] uppercase text-ink-subtle">
      <span>N° {indexLabel}</span>
      <span class="text-border">·</span>
      <span>{durationLabel}</span>
      <span class="text-border">·</span>
      <span>{chapterCount} cap.</span>
    </div>

    <h3 class="font-display text-2xl font-normal leading-tight text-ink">
      {title}
    </h3>

    <p class="text-sm text-ink-muted leading-relaxed">{subtitle}</p>

    <div class="flex items-center justify-between mt-auto pt-sm">
      <span class="font-display text-lg italic text-accent">{priceLabel}</span>
      {!isSoon && (
        <span class="font-body text-xs uppercase tracking-widest font-semibold text-ink-subtle group-hover:text-ink transition-colors duration-fast">
          {lang === 'it' ? 'Ascolta →' : 'Listen →'}
        </span>
      )}
    </div>
  </div>
</a>
```

- [ ] **Step 5: Create TrailerPlayer component**

Write to `src/components/TrailerPlayer.astro`:

```astro
---
import { type Lang } from '../lib/i18n';

export interface Props {
  src: string;
  label?: string;
  lang: Lang;
}

const { src, label, lang } = Astro.props;
const playLabel = lang === 'it' ? 'Riproduci anteprima' : 'Play preview';
---
<div class="trailer-player border border-border rounded-lg p-md bg-surface-elev" data-src={src}>
  <div class="flex items-center gap-md">
    <button
      type="button"
      class="trailer-toggle flex-shrink-0 w-12 h-12 rounded-full bg-ink text-surface flex items-center justify-center transition-transform duration-fast hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      aria-label={playLabel}
    >
      <svg class="trailer-icon-play" width="14" height="16" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true">
        <path d="M0 0l10 6-10 6z" />
      </svg>
      <svg class="trailer-icon-pause hidden" width="14" height="16" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
        <path d="M2 0h3v14H2zM7 0h3v14H7z" />
      </svg>
    </button>

    <div class="flex-1 min-w-0">
      {label && (
        <p class="text-xs font-semibold tracking-[0.18em] uppercase text-ink-subtle mb-xs">
          {label}
        </p>
      )}
      <div class="trailer-progress h-1 bg-ink/10 rounded-full overflow-hidden cursor-pointer" role="progressbar" aria-label="Trailer progress" tabindex="0">
        <div class="trailer-fill h-full bg-accent rounded-full transition-[width] duration-fast" style="width: 0%;"></div>
      </div>
      <div class="flex justify-between mt-xs text-xs text-ink-subtle">
        <span class="trailer-current">0:00</span>
        <span class="trailer-duration">--:--</span>
      </div>
    </div>
  </div>

  <audio class="trailer-audio" preload="metadata">
    <source src={src} type="audio/mpeg" />
  </audio>
</div>

<script>
  function fmtTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function initTrailer(player: HTMLElement) {
    const audio = player.querySelector<HTMLAudioElement>('.trailer-audio')!;
    const toggle = player.querySelector<HTMLButtonElement>('.trailer-toggle')!;
    const iconPlay = player.querySelector<SVGElement>('.trailer-icon-play')!;
    const iconPause = player.querySelector<SVGElement>('.trailer-icon-pause')!;
    const progress = player.querySelector<HTMLElement>('.trailer-progress')!;
    const fill = player.querySelector<HTMLElement>('.trailer-fill')!;
    const cur = player.querySelector<HTMLElement>('.trailer-current')!;
    const dur = player.querySelector<HTMLElement>('.trailer-duration')!;

    audio.addEventListener('loadedmetadata', () => {
      dur.textContent = fmtTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      fill.style.width = `${pct}%`;
      cur.textContent = fmtTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
    });

    toggle.addEventListener('click', () => {
      if (audio.paused) {
        // Pause any other trailer playing
        document.querySelectorAll<HTMLAudioElement>('.trailer-audio').forEach((a) => {
          if (a !== audio) {
            a.pause();
            const otherPlayer = a.closest('.trailer-player')!;
            otherPlayer.querySelector('.trailer-icon-play')!.classList.remove('hidden');
            otherPlayer.querySelector('.trailer-icon-pause')!.classList.add('hidden');
          }
        });
        audio.play();
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
      } else {
        audio.pause();
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
      }
    });

    progress.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progress.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = audio.duration * pct;
    });

    progress.addEventListener('keydown', (e) => {
      if (!audio.duration) return;
      const STEP = 5;
      if (e.key === 'ArrowRight') {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + STEP);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        audio.currentTime = Math.max(0, audio.currentTime - STEP);
        e.preventDefault();
      }
    });
  }

  document.querySelectorAll<HTMLElement>('.trailer-player').forEach(initTrailer);
</script>
```

- [ ] **Step 6: Create PriceCard component**

Write to `src/components/PriceCard.astro`:

```astro
---
import { formatPrice } from '../lib/format';
import { type Lang } from '../lib/i18n';

export interface Props {
  product: 'single' | 'bundle';
  guideSlug?: string;          // required when product = 'single'
  lang: Lang;
  features: string[];
  primary?: boolean;
}

const { product, guideSlug, lang, features, primary = false } = Astro.props;

const isBundle = product === 'bundle';
const priceCents = isBundle ? 999 : 499;
const priceLabel = formatPrice(priceCents);

const title = isBundle
  ? lang === 'it' ? 'Bari completa' : 'Complete Bari'
  : lang === 'it' ? 'Guida singola' : 'Single guide';

const description = isBundle
  ? lang === 'it'
    ? 'Tutte le 3 guide live di Bari. Risparmi €4.98.'
    : 'All 3 live Bari guides. Save €4.98.'
  : lang === 'it'
    ? 'Una guida a scelta, tua per sempre.'
    : 'One guide of your choice, yours forever.';

const ctaLabel = isBundle
  ? lang === 'it' ? 'Acquista Bari Completa' : 'Get Complete Bari'
  : lang === 'it' ? 'Ascolta tutto' : 'Listen full';

const productKey = isBundle ? 'bari-completa' : guideSlug;
---
<article class={`flex flex-col gap-md p-lg border rounded-lg ${primary ? 'border-accent bg-surface-elev' : 'border-border bg-surface'}`}>
  <header>
    {primary && (
      <p class="text-xs font-semibold tracking-[0.22em] uppercase text-accent mb-xs">
        {lang === 'it' ? 'Più scelto' : 'Most popular'}
      </p>
    )}
    <h3 class="font-display text-2xl text-ink leading-tight">{title}</h3>
    <p class="text-sm text-ink-muted mt-xs">{description}</p>
  </header>

  <div class="flex items-baseline gap-xs">
    <span class="font-display text-4xl text-ink">{priceLabel}</span>
    <span class="text-sm text-ink-muted">
      {isBundle ? (lang === 'it' ? '/ 3 guide' : '/ 3 guides') : (lang === 'it' ? '/ guida' : '/ guide')}
    </span>
  </div>

  <ul class="flex flex-col gap-xs">
    {features.map((f) => (
      <li class="text-sm text-ink-muted flex items-start gap-sm">
        <span class="text-accent flex-shrink-0 mt-1">✦</span>
        <span>{f}</span>
      </li>
    ))}
  </ul>

  <button
    type="button"
    class={`checkout-btn mt-auto px-md py-sm rounded-md font-semibold text-sm transition-colors duration-fast ${primary ? 'bg-ink text-surface hover:bg-ink/90' : 'border border-ink text-ink hover:bg-ink hover:text-surface'}`}
    data-product={productKey}
    data-lang={lang}
  >
    {ctaLabel} · {priceLabel}
  </button>
</article>

<script>
  // Stub: real checkout wired in Milestone C
  document.querySelectorAll<HTMLButtonElement>('.checkout-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const product = btn.dataset.product;
      const lang = btn.dataset.lang;
      // Phase 0 stub — real checkout in Milestone C
      alert(
        lang === 'it'
          ? `Pagamento per "${product}" disponibile a breve. Stripe in arrivo nella prossima fase.`
          : `Checkout for "${product}" available soon. Stripe arriving in next phase.`,
      );
    });
  });
</script>
```

- [ ] **Step 7: Create ChapterList component**

Write to `src/components/ChapterList.astro`:

```astro
---
import { formatDuration } from '../lib/format';
import { type Lang } from '../lib/i18n';

export interface Props {
  chapters: Array<{
    title_it: string;
    title_en: string;
    start_seconds: number;
  }>;
  lang: Lang;
}

const { chapters, lang } = Astro.props;
---
<ol class="flex flex-col gap-sm">
  {chapters.map((ch, i) => {
    const title = lang === 'it' ? ch.title_it : ch.title_en;
    const time = formatDuration(ch.start_seconds, 'long');
    const num = String(i + 1).padStart(2, '0');
    return (
      <li class="flex items-baseline gap-md py-xs border-b border-border last:border-0">
        <span class="font-display text-sm tabular-nums text-ink-subtle flex-shrink-0 w-6">{num}</span>
        <span class="flex-1 text-base text-ink">{title}</span>
        <span class="font-mono text-xs text-ink-subtle tabular-nums">{time}</span>
      </li>
    );
  })}
</ol>
```

- [ ] **Step 8: Create Hero component**

Write to `src/components/Hero.astro`:

```astro
---
import { type Lang } from '../lib/i18n';
import Eyebrow from './Eyebrow.astro';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const eyebrow = lang === 'it' ? 'Audioguide narrative · Puglia' : 'Narrative audio guides · Puglia';
const heading = lang === 'it' ? 'Ascolta Bari' : 'Listen to Bari';
const heading2 = lang === 'it' ? 'come una storia.' : 'as a story.';
const italic = lang === 'it' ? 'Mentre sei lì.' : "While you're there.";
const sub = lang === 'it'
  ? 'Storie vere sui luoghi reali della città. Senza app, dal browser del telefono. Per sempre tue.'
  : 'Real stories of real places. No app, opens in your phone browser. Yours forever.';
const ctaPrimary = lang === 'it' ? 'Ascolta le guide' : 'Listen to the guides';
const ctaSecondary = lang === 'it' ? 'Vedi i prezzi' : 'See pricing';
---
<section class="relative bg-surface overflow-hidden">
  <div class="max-w-wrap mx-auto px-md pt-2xl pb-3xl grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-2xl items-start">
    <div>
      <Eyebrow class="mb-lg">{eyebrow}</Eyebrow>

      <h1 class="font-display text-4xl text-ink leading-[0.95] tracking-tight mb-md">
        {heading}<br />
        {heading2}<br />
        <em class="text-accent font-normal">{italic}</em>
      </h1>

      <p class="text-lg text-ink-muted leading-relaxed max-w-prose mb-lg">{sub}</p>

      <div class="flex flex-wrap gap-sm">
        <a
          href="#guide"
          class="inline-flex items-center gap-xs px-md py-sm bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline"
        >
          {ctaPrimary} →
        </a>
        <a
          href="#prezzi"
          class="inline-flex items-center gap-xs px-md py-sm border border-border text-ink rounded-md font-semibold text-sm hover:border-ink transition-colors duration-fast no-underline"
        >
          {ctaSecondary}
        </a>
      </div>
    </div>

    <aside class="hidden lg:block">
      <img
        src="/images/hero/home-it.jpg"
        alt=""
        class="w-full aspect-[4/5] object-cover rounded-lg"
        loading="eager"
        fetchpriority="high"
      />
    </aside>
  </div>
</section>
```

- [ ] **Step 9: Build → verify components compile**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 10: Commit components**

```bash
git add src/lib/format.ts src/components/Eyebrow.astro src/components/SectionDivider.astro src/components/GuideCard.astro src/components/Hero.astro src/components/TrailerPlayer.astro src/components/PriceCard.astro src/components/ChapterList.astro
git commit -m "feat: add Hero, GuideCard, TrailerPlayer, PriceCard, ChapterList, Eyebrow components"
```

---

## Task 4: Build full Italian homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace src/pages/index.astro with full homepage**

Write to `src/pages/index.astro`:

```astro
---
import Layout from '../components/Layout.astro';
import Hero from '../components/Hero.astro';
import GuideCard from '../components/GuideCard.astro';
import TrailerPlayer from '../components/TrailerPlayer.astro';
import PriceCard from '../components/PriceCard.astro';
import SectionDivider from '../components/SectionDivider.astro';
import { getCollection } from 'astro:content';

const guides = (await getCollection('guides'))
  .filter((g) => g.data.city === 'bari')
  .sort((a, b) => a.data.published_at.getTime() - b.data.published_at.getTime());

const liveGuides = guides.filter((g) => g.data.status === 'live');

const featuredTrailer = liveGuides[0]; // Bari Vecchia
---
<Layout
  title="Localis — audioguide narrative della Puglia"
  description="Audioguide narrative di Bari e Puglia. Storie vere, senza app. Per sempre tue. €4.99 a guida."
  lang="it"
>
  <Hero lang="it" />

  <section class="max-w-narrow mx-auto px-md py-2xl">
    <SectionDivider label="Prima di decidere, ascolta questo" />
    {featuredTrailer && (
      <TrailerPlayer
        src={featuredTrailer.data.audio_trailer_path}
        label={`~${Math.round(60)}s · ${featuredTrailer.data.title_it.split('—')[0].trim()}`}
        lang="it"
      />
    )}
    <p class="text-center font-display italic text-2xl text-ink-muted mt-lg max-w-prose mx-auto">
      "Fermati. Guarda il mare davanti a te. Questo non è uno sfondo. È il posto dove tutto è successo davvero."
    </p>
  </section>

  <section id="guide" class="max-w-wrap mx-auto px-md py-2xl">
    <SectionDivider label="Scegli la tua esperienza" />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
      {guides.map((g, i) => (
        <GuideCard guide={g} lang="it" index={i} />
      ))}
    </div>
  </section>

  <section class="max-w-narrow mx-auto px-md py-2xl text-center">
    <p class="font-display italic text-3xl text-ink mb-md">
      Queste non sono guide turistiche.
    </p>
    <p class="text-base text-ink-muted leading-relaxed max-w-prose mx-auto">
      Non troverai indicazioni su dove mangiare o cosa evitare. Qui ascolti storie vere, costruite sui luoghi reali della città. E mentre ascolti, sei esattamente lì dove tutto è successo.
    </p>
  </section>

  <section id="prezzi" class="max-w-wrap mx-auto px-md py-2xl">
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

  <section class="max-w-wrap mx-auto px-md py-3xl text-center">
    <p class="font-display italic text-2xl text-ink-muted mb-xs">
      Se vuoi visitare Bari, puoi farlo.
    </p>
    <p class="font-display text-3xl text-ink mb-lg">Se vuoi capirla, ascoltala.</p>
    <a href="#guide" class="inline-flex items-center gap-xs px-lg py-md bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline">
      Inizia il percorso →
    </a>
  </section>
</Layout>
```

- [ ] **Step 2: Visual check**

```bash
pnpm dev
```

Open http://localhost:4321/. Verify:
- ✓ Hero with eyebrow, h1, italic accent, two CTAs
- ✓ Trailer section plays the placeholder MP3 on click
- ✓ 5 guide cards in grid (3 visible "live", others "soon")
- ✓ Pricing section with two PriceCards (bundle is highlighted)
- ✓ Final CTA italic + button
- ✓ Footer at bottom

- [ ] **Step 3: Commit homepage**

```bash
git add src/pages/index.astro
git commit -m "feat: build full Italian homepage with hero, trailer, guide grid, pricing, final CTA"
```

---

## Task 5: Build full English homepage

**Files:**
- Modify: `src/pages/en/index.astro`

- [ ] **Step 1: Mirror Italian homepage in English**

Write to `src/pages/en/index.astro`:

```astro
---
import Layout from '../../components/Layout.astro';
import Hero from '../../components/Hero.astro';
import GuideCard from '../../components/GuideCard.astro';
import TrailerPlayer from '../../components/TrailerPlayer.astro';
import PriceCard from '../../components/PriceCard.astro';
import SectionDivider from '../../components/SectionDivider.astro';
import { getCollection } from 'astro:content';

const guides = (await getCollection('guides'))
  .filter((g) => g.data.city === 'bari')
  .sort((a, b) => a.data.published_at.getTime() - b.data.published_at.getTime());

const featuredTrailer = guides.find((g) => g.data.status === 'live');
---
<Layout
  title="Localis — narrative audio guides for Puglia"
  description="Narrative audio guides of Bari and Puglia. Real stories, no app. Yours forever. €4.99 per guide."
  lang="en"
>
  <Hero lang="en" />

  <section class="max-w-narrow mx-auto px-md py-2xl">
    <SectionDivider label="Before you decide, hear this" />
    {featuredTrailer && (
      <TrailerPlayer
        src={featuredTrailer.data.audio_trailer_path}
        label={`~60s · ${featuredTrailer.data.title_en.split('—')[0].trim()}`}
        lang="en"
      />
    )}
    <p class="text-center font-display italic text-2xl text-ink-muted mt-lg max-w-prose mx-auto">
      "Stop. Look at the sea in front of you. This is not a backdrop. This is where everything really happened."
    </p>
  </section>

  <section id="guide" class="max-w-wrap mx-auto px-md py-2xl">
    <SectionDivider label="Choose your experience" />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
      {guides.map((g, i) => (
        <GuideCard guide={g} lang="en" index={i} />
      ))}
    </div>
  </section>

  <section class="max-w-narrow mx-auto px-md py-2xl text-center">
    <p class="font-display italic text-3xl text-ink mb-md">These are not tourist guides.</p>
    <p class="text-base text-ink-muted leading-relaxed max-w-prose mx-auto">
      You won't find advice on where to eat or what to avoid. Here you listen to real stories, built on the real places of the city. And while you listen, you are exactly where it all happened.
    </p>
  </section>

  <section id="prezzi" class="max-w-wrap mx-auto px-md py-2xl">
    <SectionDivider label="Choose your plan" />
    <div class="grid grid-cols-1 md:grid-cols-2 gap-md max-w-3xl mx-auto">
      <PriceCard
        product="single"
        guideSlug="bari-vecchia"
        lang="en"
        features={[
          '1 guide of your choice',
          'Unlimited access',
          'No app, opens in browser',
          'Italian and English',
        ]}
      />
      <PriceCard
        product="bundle"
        lang="en"
        primary
        features={[
          'Old Bari — Inside the City',
          'Port of Bari — Where It All Happened',
          'San Nicola — The Stolen Saint',
          'Unlimited access · No app',
        ]}
      />
    </div>
  </section>

  <section class="max-w-wrap mx-auto px-md py-3xl text-center">
    <p class="font-display italic text-2xl text-ink-muted mb-xs">If you want to visit Bari, you can.</p>
    <p class="font-display text-3xl text-ink mb-lg">If you want to understand it, listen.</p>
    <a href="#guide" class="inline-flex items-center gap-xs px-lg py-md bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline">
      Start the journey →
    </a>
  </section>
</Layout>
```

- [ ] **Step 2: Visual check**

Open http://localhost:4321/en/. Verify English content renders identically to IT layout but with EN strings.

- [ ] **Step 3: Commit EN homepage**

```bash
git add src/pages/en/index.astro
git commit -m "feat: build full English homepage mirroring Italian structure"
```

---

## Task 6: Build dynamic guide detail pages

**Files:**
- Create: `src/pages/guide/[slug].astro`, `src/pages/en/guide/[slug].astro`

- [ ] **Step 1: Create IT guide detail page**

Write to `src/pages/guide/[slug].astro`:

```astro
---
import Layout from '../../components/Layout.astro';
import Eyebrow from '../../components/Eyebrow.astro';
import TrailerPlayer from '../../components/TrailerPlayer.astro';
import PriceCard from '../../components/PriceCard.astro';
import ChapterList from '../../components/ChapterList.astro';
import SectionDivider from '../../components/SectionDivider.astro';
import { getCollection, render } from 'astro:content';
import { formatDuration } from '../../lib/format';

export async function getStaticPaths() {
  const guides = await getCollection('guides');
  return guides
    .filter((g) => g.data.status === 'live')
    .map((guide) => ({
      params: { slug: guide.data.slug },
      props: { guide },
    }));
}

const { guide } = Astro.props;
const data = guide.data;
const { Content } = await render(guide);

const durationLabel = formatDuration(data.duration_seconds);
---
<Layout title={`${data.title_it} · Localis`} description={data.seo.description_it} lang="it">
  <article class="max-w-wrap mx-auto px-md py-2xl grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-2xl items-start">
    <header class="lg:col-span-2 mb-2xl">
      <Eyebrow class="mb-md">{`Bari · ${durationLabel} · IT/EN`}</Eyebrow>
      <h1 class="font-display text-4xl text-ink leading-tight mb-sm">{data.title_it}</h1>
      <p class="font-display italic text-2xl text-ink-muted">{data.subtitle_it}</p>
    </header>

    <div class="flex flex-col gap-lg">
      <img
        src={data.cover}
        alt=""
        class="w-full aspect-[4/3] object-cover rounded-lg"
        loading="eager"
      />

      <TrailerPlayer
        src={data.audio_trailer_path}
        label="Anteprima · 60s"
        lang="it"
      />

      <section class="prose prose-ink max-w-prose">
        <Content />
      </section>

      <section>
        <h2 class="font-display text-3xl text-ink mb-md">Capitoli</h2>
        <ChapterList chapters={data.chapters} lang="it" />
      </section>
    </div>

    <aside class="lg:sticky lg:top-24 flex flex-col gap-md">
      <PriceCard
        product="single"
        guideSlug={data.slug}
        lang="it"
        features={[
          `${data.chapters.length} capitoli`,
          `${durationLabel} di ascolto`,
          'Italiano e inglese',
          'Per sempre accessibile',
          'Funziona offline dopo il primo play',
        ]}
      />
      <PriceCard
        product="bundle"
        lang="it"
        primary
        features={[
          'Tutte le 3 guide live di Bari',
          'Risparmi €4.98 vs guide singole',
          "Aggiornamenti gratuiti quando esce nuovo contenuto Bari",
        ]}
      />
    </aside>
  </article>
</Layout>
```

- [ ] **Step 2: Create EN guide detail page**

Write to `src/pages/en/guide/[slug].astro`:

```astro
---
import Layout from '../../../components/Layout.astro';
import Eyebrow from '../../../components/Eyebrow.astro';
import TrailerPlayer from '../../../components/TrailerPlayer.astro';
import PriceCard from '../../../components/PriceCard.astro';
import ChapterList from '../../../components/ChapterList.astro';
import { getCollection, render } from 'astro:content';
import { formatDuration } from '../../../lib/format';

export async function getStaticPaths() {
  const guides = await getCollection('guides');
  return guides
    .filter((g) => g.data.status === 'live')
    .map((guide) => ({
      params: { slug: guide.data.slug },
      props: { guide },
    }));
}

const { guide } = Astro.props;
const data = guide.data;
const { Content } = await render(guide);

const durationLabel = formatDuration(data.duration_seconds);
---
<Layout title={`${data.title_en} · Localis`} description={data.seo.description_en} lang="en">
  <article class="max-w-wrap mx-auto px-md py-2xl grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-2xl items-start">
    <header class="lg:col-span-2 mb-2xl">
      <Eyebrow class="mb-md">{`Bari · ${durationLabel} · IT/EN`}</Eyebrow>
      <h1 class="font-display text-4xl text-ink leading-tight mb-sm">{data.title_en}</h1>
      <p class="font-display italic text-2xl text-ink-muted">{data.subtitle_en}</p>
    </header>

    <div class="flex flex-col gap-lg">
      <img src={data.cover} alt="" class="w-full aspect-[4/3] object-cover rounded-lg" loading="eager" />

      <TrailerPlayer src={data.audio_trailer_path} label="Preview · 60s" lang="en" />

      <section class="prose prose-ink max-w-prose">
        <Content />
      </section>

      <section>
        <h2 class="font-display text-3xl text-ink mb-md">Chapters</h2>
        <ChapterList chapters={data.chapters} lang="en" />
      </section>
    </div>

    <aside class="lg:sticky lg:top-24 flex flex-col gap-md">
      <PriceCard
        product="single"
        guideSlug={data.slug}
        lang="en"
        features={[
          `${data.chapters.length} chapters`,
          `${durationLabel} runtime`,
          'Italian and English',
          'Forever accessible',
          'Works offline after first play',
        ]}
      />
      <PriceCard
        product="bundle"
        lang="en"
        primary
        features={[
          'All 3 live Bari guides',
          'Save €4.98 vs single guides',
          'Free updates when new Bari content drops',
        ]}
      />
    </aside>
  </article>
</Layout>
```

- [ ] **Step 3: Install @tailwindcss/typography for prose styles**

```bash
pnpm add -D @tailwindcss/typography
```

Modify `tailwind.config.mjs` to add the plugin:

```js
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // ... (keep existing)
      typography: {
        ink: {
          css: {
            '--tw-prose-body': 'var(--color-ink-muted)',
            '--tw-prose-headings': 'var(--color-ink)',
            '--tw-prose-bold': 'var(--color-ink)',
            '--tw-prose-links': 'var(--color-link)',
            'p': {
              fontSize: '1rem',
              lineHeight: '1.7',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};
```

- [ ] **Step 4: Build → verify all 3 live guides generate pages**

```bash
pnpm build
```

Expected: dist contains `/guide/bari-vecchia/index.html`, `/guide/porto-bari/index.html`, `/guide/san-nicola/index.html`, `/guide/il-meglio-di-bari/index.html` (live), and EN equivalents under `/en/guide/`. Tre Teatri excluded (status: soon).

- [ ] **Step 5: Visual check**

```bash
pnpm dev
```

Open http://localhost:4321/guide/bari-vecchia. Verify:
- ✓ Hero with title + subtitle in Spectral
- ✓ Cover image renders
- ✓ Trailer player works
- ✓ Body intro renders from MDX
- ✓ Chapter list renders
- ✓ Two PriceCards in sidebar (sticky on desktop)

Open `/en/guide/bari-vecchia` → English version.

- [ ] **Step 6: Commit guide detail pages**

```bash
git add src/pages/guide/[slug].astro src/pages/en/guide/[slug].astro tailwind.config.mjs package.json pnpm-lock.yaml
git commit -m "feat: add dynamic guide detail pages with MDX content + chapters + paywall stub"
```

---

## Task 7: Add legal pages (terms, privacy, about)

**Files:**
- Create: `src/pages/about.astro`, `src/pages/en/about.astro`, `src/pages/termini.astro`, `src/pages/en/terms.astro`, `src/pages/privacy.astro`, `src/pages/en/privacy.astro`

For Phase 0, terms and privacy use minimal-but-compliant generic templates. Production-quality legal review is recommended but not blocking for launch.

- [ ] **Step 1: Create IT about page**

Write to `src/pages/about.astro`:

```astro
---
import Layout from '../components/Layout.astro';
import Eyebrow from '../components/Eyebrow.astro';
---
<Layout
  title="Chi siamo · Localis"
  description="Localis nasce da Domenico e Luigi Loconsole, baresi. Abbiamo iniziato con un'audioguida sui misteri di Modugno. Ora raccontiamo la Puglia."
  lang="it"
>
  <article class="max-w-narrow mx-auto px-md py-2xl">
    <Eyebrow class="mb-md">Chi ha creato queste guide</Eyebrow>
    <h1 class="font-display text-4xl text-ink mb-lg">Localis è un progetto pugliese.</h1>

    <div class="prose prose-ink max-w-prose">
      <p>
        Tutto è cominciato da un'audioguida sui misteri di Modugno. Da quel momento abbiamo capito che raccontare i luoghi attraverso l'audio cambia il modo in cui li vivi.
      </p>
      <p>
        <strong>Domenico Loconsole</strong> si occupa di ricerca storica e narrazione. <strong>Luigi Loconsole</strong> costruisce la parte tecnica. Abbiamo costruito Localis con una convinzione sola: ogni città ha storie che nessun pannello turistico racconta. Noi le cerchiamo. E le mettiamo nelle tue cuffie.
      </p>
      <p>
        Tutte le voci che ascolti sono ricreate digitalmente sulla voce reale di Domenico. Niente attori prestati, niente AI generica: un timbro pugliese che ti accompagna fra i vicoli.
      </p>
    </div>
  </article>
</Layout>
```

- [ ] **Step 2: Create EN about page**

Write to `src/pages/en/about.astro`:

```astro
---
import Layout from '../../components/Layout.astro';
import Eyebrow from '../../components/Eyebrow.astro';
---
<Layout
  title="About · Localis"
  description="Localis was started by Domenico and Luigi Loconsole, born in Bari. It began with an audio guide on the mysteries of Modugno. Now we tell the story of Puglia."
  lang="en"
>
  <article class="max-w-narrow mx-auto px-md py-2xl">
    <Eyebrow class="mb-md">Who built these guides</Eyebrow>
    <h1 class="font-display text-4xl text-ink mb-lg">Localis is a Puglia-born project.</h1>

    <div class="prose prose-ink max-w-prose">
      <p>
        It all started with an audio guide about the mysteries of Modugno. From that moment we understood that telling places through audio changes the way you experience them.
      </p>
      <p>
        <strong>Domenico Loconsole</strong> handles historical research and narration. <strong>Luigi Loconsole</strong> builds the technical side. We built Localis with one conviction: every city has stories that no tourist panel tells. We find them. And we put them in your ears.
      </p>
      <p>
        All voices you hear are digitally recreated from Domenico's real voice. No hired actors, no generic AI: a Puglia accent that walks with you through the alleys.
      </p>
    </div>
  </article>
</Layout>
```

- [ ] **Step 3: Create IT terms page**

Write to `src/pages/termini.astro`:

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Termini di servizio · Localis" lang="it">
  <article class="max-w-narrow mx-auto px-md py-2xl">
    <h1 class="font-display text-3xl text-ink mb-lg">Termini di servizio</h1>
    <p class="text-sm text-ink-subtle mb-2xl">Aggiornati il 28 aprile 2026</p>

    <div class="prose prose-ink max-w-prose">
      <h2>1. Chi siamo</h2>
      <p>
        Localis è un progetto editoriale dei Sig. Domenico Loconsole e Luigi Loconsole, residenti a Bari (BA). Per ogni questione contrattuale o di consumatore, riferimento al foro di Bari.
      </p>

      <h2>2. Cosa vendiamo</h2>
      <p>
        Audioguide narrative in formato audio digitale, distribuite via web browser. Ogni guida è erogata tramite un link permanente (magic link) inviato via email all'indirizzo fornito al momento dell'acquisto.
      </p>

      <h2>3. Pagamento e prezzi</h2>
      <p>
        Tutti i prezzi sono in Euro e includono l'IVA applicabile (regime OSS). I pagamenti sono processati da Stripe Payments Europe Ltd. Localis non memorizza dati di pagamento.
      </p>

      <h2>4. Diritto di recesso</h2>
      <p>
        Hai diritto al rimborso integrale entro 14 giorni dall'acquisto, conformemente al Codice del Consumo (D.Lgs. 206/2005). Il diritto di recesso si estingue se hai già fruito di oltre il 30% del contenuto audio. Per esercitare il recesso scrivi a hello@localis.guide o usa il modulo a /recover.
      </p>

      <h2>5. Accesso ai contenuti</h2>
      <p>
        Il magic link è personale e legato all'email d'acquisto. Localis si riserva il diritto di limitare il numero di stream mensili (max 50) per impedire condivisione massiva. La condivisione del link con terzi non è incoraggiata e ogni file audio contiene un identificatore vocale legato all'acquirente.
      </p>

      <h2>6. Proprietà intellettuale</h2>
      <p>
        Tutti i contenuti (testi, audio, immagini) sono di proprietà di Localis o degli autori citati. È vietata la riproduzione, distribuzione o diffusione pubblica senza esplicito consenso scritto.
      </p>

      <h2>7. Limitazione di responsabilità</h2>
      <p>
        Localis non è responsabile di danni derivanti dall'uso del servizio in luoghi non sicuri. Non camminare ascoltando in zone di traffico veicolare intenso o senza prestare attenzione all'ambiente circostante.
      </p>

      <h2>8. Contatti</h2>
      <p>
        Email: hello@localis.guide
      </p>
    </div>
  </article>
</Layout>
```

- [ ] **Step 4: Create EN terms page**

Write to `src/pages/en/terms.astro`:

```astro
---
import Layout from '../../components/Layout.astro';
---
<Layout title="Terms of service · Localis" lang="en">
  <article class="max-w-narrow mx-auto px-md py-2xl">
    <h1 class="font-display text-3xl text-ink mb-lg">Terms of service</h1>
    <p class="text-sm text-ink-subtle mb-2xl">Updated April 28, 2026</p>

    <div class="prose prose-ink max-w-prose">
      <h2>1. Who we are</h2>
      <p>
        Localis is an editorial project by Domenico Loconsole and Luigi Loconsole, based in Bari (Italy). For all consumer or contractual matters, jurisdiction lies with the court of Bari.
      </p>

      <h2>2. What we sell</h2>
      <p>
        Narrative audio guides in digital audio format, delivered via web browser. Each guide is accessed through a permanent magic link sent by email to the address provided at purchase.
      </p>

      <h2>3. Payment and prices</h2>
      <p>
        All prices are in Euro and include applicable VAT (OSS regime). Payments are processed by Stripe Payments Europe Ltd. Localis does not store payment data.
      </p>

      <h2>4. Right of withdrawal</h2>
      <p>
        You have the right to a full refund within 14 days of purchase under EU Consumer Rights Directive 2011/83/EU. This right expires once you have consumed more than 30% of the audio content. To exercise withdrawal, email hello@localis.guide or use the /recover form.
      </p>

      <h2>5. Content access</h2>
      <p>
        The magic link is personal and tied to the email used at purchase. Localis reserves the right to limit monthly streams (max 50) to prevent mass sharing. Sharing of the link is discouraged; every audio file contains a vocal identifier tied to the purchaser.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        All content (text, audio, images) belongs to Localis or its credited authors. Reproduction, distribution, or public broadcast without explicit written consent is forbidden.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        Localis is not responsible for damages from listening in unsafe locations. Do not walk while listening in heavy traffic or without attention to your surroundings.
      </p>

      <h2>8. Contact</h2>
      <p>Email: hello@localis.guide</p>
    </div>
  </article>
</Layout>
```

- [ ] **Step 5: Create IT privacy page**

Write to `src/pages/privacy.astro`:

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Informativa privacy · Localis" lang="it">
  <article class="max-w-narrow mx-auto px-md py-2xl">
    <h1 class="font-display text-3xl text-ink mb-lg">Informativa privacy</h1>
    <p class="text-sm text-ink-subtle mb-2xl">Aggiornata il 28 aprile 2026</p>

    <div class="prose prose-ink max-w-prose">
      <h2>1. Titolare del trattamento</h2>
      <p>Domenico Loconsole + Luigi Loconsole — Bari (BA), Italia. Email: hello@localis.guide.</p>

      <h2>2. Dati raccolti</h2>
      <ul>
        <li><strong>Email</strong> — fornita all'acquisto, usata per inviarti il magic link e (se acconsenti) comunicazioni di servizio.</li>
        <li><strong>Dati di pagamento</strong> — gestiti esclusivamente da Stripe; Localis non li memorizza.</li>
        <li><strong>Cookie tecnico</strong> — un solo cookie (`lg_partner`) per attribuire vendita a partner se arrivi tramite QR; durata 30 giorni; nessun cookie di tracciamento.</li>
        <li><strong>Statistiche aggregate</strong> — Plausible Analytics, senza cookie e senza dati personali (conformi GDPR senza necessità di banner).</li>
      </ul>

      <h2>3. Base giuridica</h2>
      <p>Esecuzione del contratto (vendita audioguida) e legittimo interesse (analytics aggregata).</p>

      <h2>4. Conservazione</h2>
      <p>
        L'email è conservata finché esiste il tuo accesso alle guide acquistate (illimitato per design). Puoi richiederne cancellazione scrivendo a hello@localis.guide; la cancellazione comporta la perdita di accesso alle guide.
      </p>

      <h2>5. Diritti dell'interessato</h2>
      <p>
        Hai diritto di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità (artt. 15-22 GDPR). Esercita questi diritti scrivendo a hello@localis.guide.
      </p>

      <h2>6. Trasferimenti extra-UE</h2>
      <p>
        Stripe (Irlanda, conforme GDPR) processa pagamenti. Resend (USA, partecipante a EU-US DPF) consegna email. Cloudflare (USA/internazionale, partecipante a EU-US DPF) eroga audio.
      </p>

      <h2>7. Reclami</h2>
      <p>Puoi presentare reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).</p>
    </div>
  </article>
</Layout>
```

- [ ] **Step 6: Create EN privacy page**

Write to `src/pages/en/privacy.astro`:

```astro
---
import Layout from '../../components/Layout.astro';
---
<Layout title="Privacy policy · Localis" lang="en">
  <article class="max-w-narrow mx-auto px-md py-2xl">
    <h1 class="font-display text-3xl text-ink mb-lg">Privacy policy</h1>
    <p class="text-sm text-ink-subtle mb-2xl">Updated April 28, 2026</p>

    <div class="prose prose-ink max-w-prose">
      <h2>1. Data controller</h2>
      <p>Domenico Loconsole + Luigi Loconsole — Bari, Italy. Email: hello@localis.guide.</p>

      <h2>2. Data we collect</h2>
      <ul>
        <li><strong>Email</strong> — provided at checkout, used to send your magic link and (with consent) service communications.</li>
        <li><strong>Payment data</strong> — handled solely by Stripe; Localis does not store it.</li>
        <li><strong>Technical cookie</strong> — a single cookie (`lg_partner`) to attribute sales to partners when you arrive via QR; 30-day duration; no tracking cookies.</li>
        <li><strong>Aggregate statistics</strong> — Plausible Analytics, cookieless and without personal data (GDPR-compliant without consent banner).</li>
      </ul>

      <h2>3. Legal basis</h2>
      <p>Contract performance (audio guide sale) and legitimate interest (aggregate analytics).</p>

      <h2>4. Retention</h2>
      <p>Email is retained as long as your access to purchased guides exists (unlimited by design). You may request deletion at hello@localis.guide; deletion forfeits access to guides.</p>

      <h2>5. Your rights</h2>
      <p>You have rights of access, rectification, erasure, restriction, objection, and portability under GDPR (Articles 15-22). Exercise these by emailing hello@localis.guide.</p>

      <h2>6. Non-EU transfers</h2>
      <p>Stripe (Ireland, GDPR-compliant) processes payments. Resend (USA, EU-US DPF participant) delivers emails. Cloudflare (USA/international, EU-US DPF participant) serves audio.</p>

      <h2>7. Complaints</h2>
      <p>You may file complaints with the Italian Data Protection Authority (www.garanteprivacy.it).</p>
    </div>
  </article>
</Layout>
```

- [ ] **Step 7: Build → verify legal pages**

```bash
pnpm build
```

Expected: 6 new HTML files in dist (3 IT + 3 EN). Verify visually.

- [ ] **Step 8: Commit legal pages**

```bash
git add src/pages/about.astro src/pages/en/about.astro src/pages/termini.astro src/pages/en/terms.astro src/pages/privacy.astro src/pages/en/privacy.astro
git commit -m "feat: add about, terms, and privacy pages in IT and EN"
```

---

## Task 8: Add 404 and access-invalid + recover stub pages

**Files:**
- Create: `src/pages/404.astro`, `src/pages/access-invalid.astro`, `src/pages/recover.astro`

- [ ] **Step 1: Create 404 page**

Write to `src/pages/404.astro`:

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="404 · Localis" lang="it">
  <main class="max-w-narrow mx-auto px-md py-3xl text-center">
    <p class="font-display italic text-2xl text-ink-muted mb-md">Questa storia non esiste.</p>
    <h1 class="font-display text-4xl text-ink mb-lg">404</h1>
    <p class="text-base text-ink-muted mb-xl max-w-prose mx-auto">
      La pagina che cerchi non c'è — o non c'è ancora. Forse è una guida che non abbiamo ancora pubblicato, o un link rotto. Torna in homepage e scegli da lì.
    </p>
    <div class="flex flex-wrap justify-center gap-sm">
      <a href="/" class="inline-flex px-md py-sm bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline">
        Vai in homepage
      </a>
      <a href="/#guide" class="inline-flex px-md py-sm border border-border text-ink rounded-md font-semibold text-sm hover:border-ink transition-colors duration-fast no-underline">
        Vedi le guide
      </a>
    </div>
  </main>
</Layout>
```

- [ ] **Step 2: Create access-invalid page**

Write to `src/pages/access-invalid.astro`:

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Link non valido · Localis" lang="it">
  <main class="max-w-narrow mx-auto px-md py-3xl text-center">
    <h1 class="font-display text-4xl text-ink mb-lg">Link non valido</h1>
    <p class="text-base text-ink-muted mb-xl max-w-prose mx-auto">
      Il link che hai aperto non è valido — potrebbe essere stato corrotto, o revocato per sospetta condivisione. Inserisci l'email che hai usato all'acquisto e ti rimandiamo un nuovo link.
    </p>
    <a href="/recover" class="inline-flex px-md py-sm bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline">
      Recupera l'accesso
    </a>
  </main>
</Layout>
```

- [ ] **Step 3: Create recover page (form only, backend in Milestone C)**

Write to `src/pages/recover.astro`:

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Recupera l'accesso · Localis" lang="it">
  <main class="max-w-narrow mx-auto px-md py-3xl">
    <h1 class="font-display text-4xl text-ink mb-md">Recupera la tua guida</h1>
    <p class="text-base text-ink-muted mb-xl max-w-prose">
      Hai smarrito il link via email? Inserisci la stessa email che hai usato all'acquisto. Ti rimandiamo il magic link in 30 secondi.
    </p>

    <form id="recover-form" class="flex flex-col gap-md max-w-md">
      <label for="email" class="text-sm font-semibold text-ink">Email d'acquisto</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        placeholder="tu@esempio.com"
        class="px-md py-sm bg-surface border border-border rounded-md text-base focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        class="px-md py-sm bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast"
      >
        Recupera accesso
      </button>
    </form>

    <div id="recover-result" class="mt-lg max-w-md hidden">
      <p class="text-base text-success">Email inviata. Controlla la tua casella (anche spam).</p>
    </div>
  </main>
</Layout>

<script>
  const form = document.getElementById('recover-form') as HTMLFormElement | null;
  const result = document.getElementById('recover-result');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = data.get('email');

    // Phase 0 stub — real recovery wired in Milestone C
    alert(`Funzionalità in arrivo nella prossima fase. Email: ${email}`);
    // result?.classList.remove('hidden');
  });
</script>
```

- [ ] **Step 4: Build + visual check**

```bash
pnpm build && pnpm preview
```

Open http://localhost:4321/non-existent-route → 404 renders.
Open http://localhost:4321/access-invalid → invalid access page.
Open http://localhost:4321/recover → recovery form (submit shows alert stub).

- [ ] **Step 5: Commit error and recovery pages**

```bash
git add src/pages/404.astro src/pages/access-invalid.astro src/pages/recover.astro
git commit -m "feat: add 404, access-invalid, and recover form (recovery backend in Milestone C)"
```

---

## Task 9: Update Playwright E2E for guide pages

**Files:**
- Modify: `tests/e2e/homepage.spec.ts`
- Create: `tests/e2e/guide-detail.spec.ts`

- [ ] **Step 1: Extend homepage tests for new content**

Replace `tests/e2e/homepage.spec.ts` contents:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Italian homepage', () => {
  test('renders hero with correct copy', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ascolta Bari');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('come una storia');
    await expect(page.getByText('Mentre sei lì.')).toBeVisible();
  });

  test('renders 5 guide cards', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('a').filter({ hasText: /Bari|Porto|San Nicola|Meglio|Teatri/ });
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
  });

  test('renders pricing section with two cards', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Vedi i prezzi' }).click();
    await expect(page.getByRole('heading', { name: 'Guida singola' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bari completa' })).toBeVisible();
  });

  test('checkout button shows phase-0 stub', async ({ page }) => {
    await page.goto('/');
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('disponibile a breve');
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: /Ascolta tutto/i }).first().click();
  });

  test('language switcher works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /switch language/i }).click();
    await expect(page).toHaveURL(/\/en\//);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Listen to Bari');
  });
});

test.describe('English homepage', () => {
  test('renders English hero copy', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.getByText("While you're there.")).toBeVisible();
  });
});
```

- [ ] **Step 2: Add guide detail tests**

Write to `tests/e2e/guide-detail.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Guide detail page', () => {
  test('Bari Vecchia detail renders title, trailer, chapters, sidebar', async ({ page }) => {
    await page.goto('/guide/bari-vecchia');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bari Vecchia');
    await expect(page.locator('audio').first()).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Capitoli' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guida singola' })).toBeVisible();
  });

  test('English version renders correctly', async ({ page }) => {
    await page.goto('/en/guide/bari-vecchia');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Old Bari');
    await expect(page.getByRole('heading', { name: 'Chapters' })).toBeVisible();
  });

  test('soon-status guide is not directly accessible', async ({ page }) => {
    const response = await page.goto('/guide/tre-teatri', { waitUntil: 'commit' });
    // tre-teatri has status: soon, getStaticPaths excludes it
    expect(response?.status()).toBe(404);
  });
});

test.describe('Legal and error pages', () => {
  test('404 page renders for unknown route', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('404')).toBeVisible();
  });

  test('terms page renders', async ({ page }) => {
    await page.goto('/termini');
    await expect(page.getByRole('heading', { name: 'Termini di servizio' })).toBeVisible();
  });

  test('privacy page renders', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Informativa privacy' })).toBeVisible();
  });

  test('about page renders both languages', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /progetto pugliese/i })).toBeVisible();
    await page.goto('/en/about');
    await expect(page.getByRole('heading', { name: /Puglia-born/i })).toBeVisible();
  });
});
```

- [ ] **Step 3: Run E2E**

```bash
pnpm test:e2e
```

Expected: all tests PASS.

- [ ] **Step 4: Commit tests**

```bash
git add tests/e2e/homepage.spec.ts tests/e2e/guide-detail.spec.ts
git commit -m "test: extend E2E coverage for homepage content, guide detail, legal pages"
```

---

## Task 10: Final Milestone B verification + tag

- [ ] **Step 1: Full quality gate**

```bash
pnpm check && pnpm test && pnpm test:e2e && pnpm build
```

Expected: all pass.

- [ ] **Step 2: Push and verify Netlify deploy**

```bash
git push origin main
```

Wait for Netlify build (~1-2 min). Open deploy URL → smoke-test:
- Homepage IT renders fully (hero, trailer, 5 cards, pricing, final CTA)
- Click trailer play → audio plays
- Click "Ascolta tutto" → stub alert
- Click guide card → detail page renders with chapters
- Toggle EN → English homepage; click guide → English detail
- Footer links → terms, privacy, about render
- Try `/non-existent-route` → 404 page

- [ ] **Step 3: Lighthouse mobile**

Run Lighthouse on Netlify staging URL.

Expected:
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 90

- [ ] **Step 4: Tag milestone**

```bash
git tag phase-0-B-complete
git push origin phase-0-B-complete
```

- [ ] **Step 5: Update master plan**

Edit `docs/superpowers/plans/2026-04-28-localis-phase-0-foundation.md` Decomposition table → Milestone B = "✅ complete".

```bash
git add docs/superpowers/plans/2026-04-28-localis-phase-0-foundation.md
git commit -m "docs: mark Milestone B complete in master plan"
git push origin main
```

---

## Milestone B exit criteria

Verify each before proceeding to Milestone C:

- [ ] ✅ 5 guide MDX files in `src/content/guides/` with correct frontmatter
- [ ] ✅ Homepage IT renders hero, trailer, 5 guide cards, pricing, final CTA
- [ ] ✅ Homepage EN mirrors IT structure with English content
- [ ] ✅ 4 live guide detail pages render (`/guide/bari-vecchia`, `/guide/porto-bari`, `/guide/san-nicola`, `/guide/il-meglio-di-bari`) plus EN equivalents
- [ ] ✅ "Tre Teatri" guide has `status: soon` and is excluded from detail routing
- [ ] ✅ Trailer player works (play, pause, seek, keyboard arrow keys)
- [ ] ✅ Checkout buttons show stub alert (real Stripe in Milestone C)
- [ ] ✅ Legal pages: about, terms, privacy in both IT and EN
- [ ] ✅ 404, access-invalid, recover stub pages render
- [ ] ✅ Vitest unit tests pass
- [ ] ✅ Playwright E2E covers homepage + guide detail + legal + 404
- [ ] ✅ Lighthouse mobile: Perf ≥90, A11y ≥95, BP ≥95, SEO ≥90
- [ ] ✅ Tag `phase-0-B-complete` pushed

---

➡️ **Next: [Milestone C — Payments](2026-04-28-localis-phase-0-C-payments.md)** (Stripe Products, Checkout endpoint, webhook, Resend email, JWT, magic link delivery)
