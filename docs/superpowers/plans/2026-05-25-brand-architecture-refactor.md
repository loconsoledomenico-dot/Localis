# Brand Architecture Refactor — Localis (non più Bari) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare il sito da "Localis · Bari" a "Localis" brand-level, con pagine destinazione per Bari, Valle d'Itria e Gargano, così che ogni nuova zona si aggiunga senza toccare la homepage.

**Architecture:** La homepage diventa brand-level (Puglia/Italia, non Bari). Ogni destinazione ha la sua landing page (`/bari`, `/valle-d-itria`, `/gargano`). Un nuovo componente `DestinationsBlock` sostituisce `BariMap` in homepage mostrando le 3 zone come card. Il catalogo completo rimane su `/guide`.

**Tech Stack:** Astro 4, TypeScript, Tailwind utility classes inline, componenti `.astro` — stessi pattern del codebase esistente.

---

## File Map

| Azione | File |
|--------|------|
| Modifica | `src/components/Hero.astro` — lede da "I baresi" a generico |
| Modifica | `src/pages/index.astro` — rimuove BariMap+AuthorsBlock, inserisce DestinationsBlock, aggiorna copy Closer |
| Modifica | `src/components/FeatureBlock.astro` (no) — i bullets vengono dall'index.astro, si modificano lì |
| Crea | `src/components/DestinationsBlock.astro` — 3 card destinazione con photo, guides count, CTA |
| Crea | `src/pages/bari.astro` — landing Bari (BariMap + AuthorsBlock + Bari pricing) |
| Crea | `src/pages/valle-d-itria.astro` — landing Valle d'Itria (guide grid + valle pricing) |
| Crea | `src/pages/gargano.astro` — landing Gargano (coming soon o guide quando pronte) |
| Crea | `src/pages/en/bari.astro` — versione EN |
| Crea | `src/pages/en/valle-d-itria.astro` — versione EN |
| Crea | `src/pages/en/gargano.astro` — versione EN |
| Modifica | `src/components/StepsBlock.astro` — copy generalizzato (rimuove riferimenti Bari) |
| Modifica | `src/pages/en/index.astro` — stesse modifiche della homepage IT |

---

## Task 1: Aggiorna Hero copy — da Bari a brand-level

**Files:**
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Modifica le stringhe Bari-specifiche in Hero.astro**

In `src/components/Hero.astro`, cambia:

```ts
// DA:
const lede1 = lang === 'it'
  ? 'I baresi ti raccontano la loro città.'
  : 'Locals telling their own city.';
const lede2 = lang === 'it'
  ? 'Quella vera, mica le brochure.'
  : 'The real one — not the brochure version.';

// A:
const lede1 = lang === 'it'
  ? 'I locali ti raccontano la loro terra.'
  : 'Locals telling their own land.';
const lede2 = lang === 'it'
  ? 'Quella vera, mica le brochure.'
  : 'The real one — not the brochure version.';
```

Cambia anche il masthead destro:
```ts
// DA:
const masthead_r = lang === 'it' ? 'Sei guide live · edizione completa' : 'Six guides live · full edition';
// A:
const masthead_r = lang === 'it' ? 'Guide live · Puglia' : 'Live guides · Puglia';
```

Cambia il CTA primario (non è più solo Bari Vecchia come entry point):
```ts
// DA:
const ctaPrimaryHref = lang === 'it' ? '/guide/bari-vecchia' : '/en/guide/bari-vecchia';
// A:
const ctaPrimaryHref = lang === 'it' ? '/guide' : '/en/guide';
```

Cambia il CTA label:
```ts
// DA:
const ctaPrimary = lang === 'it' ? 'Ascolta un assaggio · 60 secondi gratis' : 'Listen a teaser · 60s free';
// A:
const ctaPrimary = lang === 'it' ? 'Scopri le guide' : 'Explore the guides';
```

Cambia il CTA secondario href (puntava a #guide, che era la BariMap):
```ts
// DA:
const ctaSecondary = lang === 'it' ? 'Vedi le guide' : 'See the guides';
// (href="#guide" nel template HTML)
// A: lascia label uguale, cambia href nel template:
// href="/guide"  invece di  href="#guide"
```

Nel template HTML di Hero.astro, cambia:
```html
<!-- DA: -->
<a href="#guide" class="...">
<!-- A: -->
<a href="/guide" class="...">
```

- [ ] **Step 2: Verifica che la build non abbia errori**

```bash
cd "C:/Users/Admin/Desktop/Progetti & Lab/Sites/LocalisGuide"
npx astro check
```
Expected: 0 errori TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro
git commit -m "refactor(hero): copy brand-level — rimuove riferimenti Bari da lede e CTA"
```

---

## Task 2: Aggiorna FeatureBlock bullets (Tav. III) in homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Aggiorna bullets FeatureBlock Tav. III in index.astro**

In `src/pages/index.astro`, trova il FeatureBlock con `eyebrow="Storie · Autori — Tav. III"` e cambia i bullets:

```astro
<!-- DA: -->
bullets={[
  'Sei autori baresi · uno per itinerario',
  'Sei guide live · edizione 01 Bari completa',
  'Italiano e inglese · scritti separatamente, mai tradotti',
  'Fonti pubbliche · ogni claim verificabile su /fonti',
]}
<!-- A: -->
bullets={[
  'Autori locali · uno per itinerario, firmato con nome e bio',
  'Guide live · Bari, Valle d\'Itria, Gargano in arrivo',
  'Italiano e inglese · scritti separatamente, mai tradotti',
  'Fonti pubbliche · ogni claim verificabile su /fonti',
]}
```

- [ ] **Step 2: Aggiorna il Closer (ultima sezione in index.astro)**

In `src/pages/index.astro`, trova la sezione `{/* CLOSER */}` e cambia il copy:

```astro
<!-- DA: -->
<p class="font-display italic text-xl sm:text-2xl text-ink-muted mb-2xs">
  Bari si visita in un giorno.
</p>
<p class="font-display text-3xl sm:text-4xl text-ink mb-lg leading-tight">
  Si capisce in capitoli.
</p>
<a href="#guide" ...>Inizia ad ascoltare</a>

<!-- A: -->
<p class="font-display italic text-xl sm:text-2xl text-ink-muted mb-2xs">
  La Puglia si visita in un viaggio.
</p>
<p class="font-display text-3xl sm:text-4xl text-ink mb-lg leading-tight">
  Si capisce in capitoli.
</p>
<a href="/guide" ...>Scopri le guide</a>
```

- [ ] **Step 3: Verifica build**

```bash
npx astro check
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "refactor(homepage): copy brand-level — bullets e closer generalizzati"
```

---

## Task 3: Crea DestinationsBlock — le 3 zone come card

**Files:**
- Create: `src/components/DestinationsBlock.astro`

Questo componente sostituirà `BariMap` in homepage. Mostra 3 card: Bari, Valle d'Itria, Gargano (coming soon).

- [ ] **Step 1: Crea il componente**

Crea `src/components/DestinationsBlock.astro`:

```astro
---
import { type Lang } from '../lib/i18n';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;

const eyebrow = lang === 'it' ? 'Tavola IV — Le destinazioni' : 'Plate IV — The destinations';
const heading1 = lang === 'it' ? 'Scegli dove andare.' : 'Choose your destination.';
const heading2 = lang === 'it' ? 'Ogni zona, una voce diversa.' : 'Every zone, a different voice.';
const intro = lang === 'it'
  ? 'Non un catalogo turistico. Una collezione di voci: ogni destinazione ha i suoi autori, le sue storie, il suo suono.'
  : 'Not a tourist catalogue. A collection of voices: every destination has its own authors, its own stories, its own sound.';

interface Destination {
  slug: string;
  href: string;
  name: string;
  tagline: string;
  guidesLabel: string;
  cover: string;
  alt: string;
  soon?: boolean;
}

const destinations: Destination[] = lang === 'it'
  ? [
      {
        slug: 'bari',
        href: '/bari',
        name: 'Bari',
        tagline: 'La città che non ti aspetti.',
        guidesLabel: '6 guide live',
        cover: '/images/covers/bari-vecchia.jpg',
        alt: 'Vicolo del Borgo Antico di Bari con colonne romane e palazzi storici',
      },
      {
        slug: 'valle-d-itria',
        href: '/valle-d-itria',
        name: "Valle d'Itria",
        tagline: 'Trulli, vini e borghi bianchi.',
        guidesLabel: '3 guide live',
        cover: '/images/covers/alberobello.jpg',
        alt: 'Trulli di Alberobello, Rione Monti',
      },
      {
        slug: 'gargano',
        href: '/gargano',
        name: 'Gargano',
        tagline: 'Il promontorio che guarda il mondo.',
        guidesLabel: 'In arrivo',
        cover: '/images/covers/bari-vecchia.jpg', // placeholder — sostituire con cover Gargano
        alt: 'Gargano, promontorio sul mare Adriatico',
        soon: true,
      },
    ]
  : [
      {
        slug: 'bari',
        href: '/en/bari',
        name: 'Bari',
        tagline: 'The city you didn\'t expect.',
        guidesLabel: '6 guides live',
        cover: '/images/covers/bari-vecchia.jpg',
        alt: 'Lane of Bari\'s Old Town with ancient Roman columns',
      },
      {
        slug: 'valle-d-itria',
        href: '/en/valle-d-itria',
        name: "Valle d'Itria",
        tagline: 'Trullos, wines and white villages.',
        guidesLabel: '3 guides live',
        cover: '/images/covers/alberobello.jpg',
        alt: 'Trulli of Alberobello, Rione Monti district',
      },
      {
        slug: 'gargano',
        href: '/en/gargano',
        name: 'Gargano',
        tagline: 'The promontory that faces the world.',
        guidesLabel: 'Coming soon',
        cover: '/images/covers/bari-vecchia.jpg', // placeholder
        alt: 'Gargano promontory over the Adriatic sea',
        soon: true,
      },
    ];
---

<section id="guide" class="destinations bg-surface">
  <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">

    <div class="flex items-center justify-center gap-sm mb-lg">
      <span class="block w-7 h-px bg-accent"></span>
      <span class="text-[10px] font-semibold tracking-[0.32em] uppercase text-accent">
        {eyebrow}
      </span>
      <span class="block w-7 h-px bg-accent"></span>
    </div>

    <div class="text-center mb-2xl max-w-[38ch] mx-auto">
      <h2 class="font-display font-light text-ink text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-tight mb-md">
        {heading1}<br /><em class="not-italic text-ink-muted">{heading2}</em>
      </h2>
      <p class="font-body text-base text-ink-muted leading-relaxed">{intro}</p>
    </div>

    <ol class="dest-grid list-none p-0 m-0">
      {destinations.map((d, i) => (
        <li class="dest-cell" style={`--idx:${i}`}>
          {d.soon ? (
            <div class="dest-card dest-card--soon" aria-label={`${d.name} · ${d.guidesLabel}`}>
              <figure class="dest-photo m-0">
                <img src={d.cover} alt={d.alt} class="dest-img" loading="lazy" decoding="async" />
                <div class="dest-soon-badge">
                  <span class="text-[10px] font-semibold tracking-[0.28em] uppercase">
                    {lang === 'it' ? 'In arrivo' : 'Coming soon'}
                  </span>
                </div>
                <span class="dest-scrim" aria-hidden="true">
                  <span class="dest-name">{d.name}</span>
                  <span class="dest-count">{d.guidesLabel}</span>
                </span>
              </figure>
              <div class="dest-meta">
                <h3 class="dest-title font-display font-light text-ink-muted leading-[1.2] m-0">{d.name}</h3>
                <p class="dest-sub font-body text-sm text-ink-subtle m-0">{d.tagline}</p>
              </div>
            </div>
          ) : (
            <a href={d.href} class="dest-card" aria-label={`${d.name} · ${d.guidesLabel}`}>
              <figure class="dest-photo m-0">
                <img src={d.cover} alt={d.alt} class="dest-img" loading="lazy" decoding="async" />
                <span class="dest-scrim" aria-hidden="true">
                  <span class="dest-name">{d.name}</span>
                  <span class="dest-count">{d.guidesLabel}</span>
                </span>
              </figure>
              <div class="dest-meta">
                <h3 class="dest-title font-display font-light text-ink leading-[1.2] m-0">{d.name}</h3>
                <p class="dest-sub font-body text-sm text-ink-muted m-0">{d.tagline}</p>
              </div>
            </a>
          )}
        </li>
      ))}
    </ol>
  </div>
</section>

<style>
  .dest-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--spacing-lg);
    row-gap: var(--spacing-2xl);
  }
  @media (min-width: 640px) { .dest-grid { grid-template-columns: repeat(3, 1fr); } }

  .dest-cell {
    opacity: 0;
    transform: translateY(14px);
    animation: destIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    animation-delay: calc(var(--idx, 0) * 100ms + 100ms);
  }

  .dest-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    text-decoration: none;
    color: inherit;
    border-top: 1px solid var(--color-ink);
    padding-top: var(--spacing-md);
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dest-card:hover { transform: translateY(-2px); }
  .dest-card--soon {
    border-top-style: dashed;
    border-top-color: var(--color-border);
    cursor: default;
  }

  .dest-photo {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    background: var(--color-surface-elev);
    overflow: hidden;
    border-radius: var(--radius-md);
    box-shadow: 0 1px 2px oklch(15% 0.012 240 / 0.08), 0 12px 32px -12px oklch(15% 0.012 240 / 0.16);
    transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 500ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dest-card:nth-child(3n+1) .dest-photo { transform: rotate(-1deg); }
  .dest-card:nth-child(3n+2) .dest-photo { transform: rotate(0.8deg); }
  .dest-card:nth-child(3n+3) .dest-photo { transform: rotate(-0.6deg); }
  .dest-card:hover .dest-photo,
  .dest-card:focus-visible .dest-photo {
    transform: rotate(0deg) scale(1.01);
    box-shadow: 0 2px 4px oklch(15% 0.012 240 / 0.12), 0 24px 48px -16px oklch(15% 0.012 240 / 0.22);
  }
  .dest-card--soon .dest-photo { filter: grayscale(0.4); }

  .dest-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    filter: saturate(0.94) contrast(1.04);
    transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dest-card:hover .dest-img { transform: scale(1.03); }

  .dest-soon-badge {
    position: absolute; top: var(--spacing-sm); right: var(--spacing-sm);
    background: var(--color-surface); color: var(--color-ink-subtle);
    padding: 4px 10px 5px; font-family: var(--font-body);
    border: 1px solid var(--color-border);
  }

  .dest-scrim {
    position: absolute; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: linear-gradient(to top, oklch(15% 0.012 240 / 0.78), transparent 100%);
    color: var(--color-surface); font-family: var(--font-body);
    font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
    pointer-events: none;
  }
  .dest-name { flex: 1; }
  .dest-count { flex-shrink: 0; color: var(--color-accent-soft); }

  .dest-meta { display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .dest-title { font-size: clamp(1.3rem, 3vw, 1.7rem); }
  .dest-sub { line-height: 1.5; }

  .dest-card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; border-radius: 2px; }

  @keyframes destIn { to { opacity: 1; transform: translateY(0); } }

  @media (prefers-reduced-motion: reduce) {
    .dest-cell, .dest-card, .dest-img { animation: none !important; transition: none !important; opacity: 1; transform: none; }
  }
</style>
```

- [ ] **Step 2: Verifica che il file compila**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DestinationsBlock.astro
git commit -m "feat(component): DestinationsBlock — 3 card destinazione Bari/Valle d'Itria/Gargano"
```

---

## Task 4: Homepage — sostituisce BariMap con DestinationsBlock, rimuove AuthorsBlock

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Aggiorna gli import in index.astro**

In `src/pages/index.astro`, cambia gli import:

```ts
// DA:
import BariMap from '../components/BariMap.astro';
// A:
import DestinationsBlock from '../components/DestinationsBlock.astro';

// Rimuovi questa riga (AuthorsBlock rimane solo su /bari):
// import AuthorsBlock from '../components/AuthorsBlock.astro';
```

- [ ] **Step 2: Sostituisci BariMap con DestinationsBlock nel template**

Nel template di `src/pages/index.astro`:

```astro
<!-- DA: -->
{/* I sei luoghi — griglia foto, l'unica sezione "scegli la guida" della pagina */}
<BariMap lang="it" />

{/* PRICING — subito dopo le 6 schede, momento decisione single vs bundle */}
<section id="prezzi" class="bg-surface">
  ...
</section>

...

{/* TAVOLE AUTORI — voci baresi, una per quartiere */}
<AuthorsBlock lang="it" />

<!-- A: -->
{/* DESTINAZIONI — le 3 zone come card */}
<DestinationsBlock lang="it" />

{/* PRICING — rimane, ma ora è brand-level: mostra bundle Bari come "la collezione più completa disponibile" */}
<section id="prezzi" class="bg-surface">
  ...
</section>

{/* AuthorsBlock rimosso — è Bari-specific, ora vive su /bari */}
```

Nota: la sezione pricing (#prezzi) con le PriceCard rimane per ora — è ancora Bari ma è la collezione più grande disponibile. In futuro diventerà multi-destinazione.

- [ ] **Step 3: Verifica build completa**

```bash
npx astro check && npx astro build 2>&1 | tail -20
```

Expected: build OK, 0 errori.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "refactor(homepage): sostituisce BariMap con DestinationsBlock, rimuove AuthorsBlock"
```

---

## Task 5: Aggiorna StepsBlock — copy generico (non più solo Bari)

**Files:**
- Modify: `src/components/StepsBlock.astro`

- [ ] **Step 1: Generalizza i testi in StepsBlock.astro**

In `src/components/StepsBlock.astro`, cambia i steps da Bari-specifici a generici:

```ts
// DA:
const steps = lang === 'it'
  ? [
      { n: '1', title: 'Apri il link', body: 'Dal porto, dal treno, dal divano di casa.' },
      { n: '2', title: 'Scegli l\'itinerario', body: 'Bari Vecchia, Porto, San Nicola, Teatri, Sotterranea — o tutto insieme.' },
      { n: '3', title: 'Premi play', body: 'Le storie partono. Tu ascolti, ti perdi nei vicoli — anche da fermo.' },
    ]
  : [
      { n: '1', title: 'Open the link', body: 'From the harbour, the train, your own couch.' },
      { n: '2', title: 'Pick a route', body: 'Old Bari, Port, San Nicola, Theatres, Underground — or all of them.' },
      { n: '3', title: 'Press play', body: 'The stories begin. You listen, you wander — even sitting still.' },
    ];

// A:
const steps = lang === 'it'
  ? [
      { n: '1', title: 'Scegli la destinazione', body: 'Bari, Valle d\'Itria, Gargano — ogni zona ha la sua guida.' },
      { n: '2', title: 'Apri il link', body: 'Niente app. Compri, ti arriva un link, premi play.' },
      { n: '3', title: 'Ascolta', body: 'Le storie partono. In strada, sul divano, in treno — ovunque.' },
    ]
  : [
      { n: '1', title: 'Choose a destination', body: 'Bari, Valle d\'Itria, Gargano — every zone has its own guide.' },
      { n: '2', title: 'Open the link', body: 'No app. Buy, get a link, press play.' },
      { n: '3', title: 'Listen', body: 'The stories begin. On the street, on the couch, on the train — anywhere.' },
    ];
```

Cambia anche il `headingItalic`:
```ts
// DA:
const headingItalic = lang === 'it' ? 'Una città che parla, quando vuoi tu.' : 'A city that speaks, whenever you want.';
// A:
const headingItalic = lang === 'it' ? 'Una terra che parla, quando vuoi tu.' : 'A land that speaks, whenever you want.';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StepsBlock.astro
git commit -m "refactor(steps): copy generico — non più Bari-specifico"
```

---

## Task 6: Crea `/bari` destination page

**Files:**
- Create: `src/pages/bari.astro`

La pagina `/bari` è la "vecchia homepage di Bari" — ha BariMap, AuthorsBlock, pricing Bari.

- [ ] **Step 1: Crea src/pages/bari.astro**

```astro
---
export const prerender = true;
import Layout from '../components/Layout.astro';
import FeatureBlock from '../components/FeatureBlock.astro';
import BariMap from '../components/BariMap.astro';
import PriceCard from '../components/PriceCard.astro';
import SectionDivider from '../components/SectionDivider.astro';
import AuthorsBlock from '../components/AuthorsBlock.astro';
import StepsBlock from '../components/StepsBlock.astro';
---
<Layout
  title="Bari — Audioguide narrative · Localis"
  description="Sei guide narrative di Bari raccontate da autori baresi. Bari Vecchia, San Nicola, Porto, Teatri, Sotterranea, Il Meglio di Bari. Da €4,99."
  lang="it"
>

  {/* PAGE HEADER */}
  <section class="bg-surface border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-2xl lg:py-3xl">
      <div class="flex items-center gap-sm mb-md">
        <span class="block w-7 h-px bg-accent"></span>
        <span class="text-[11px] font-semibold tracking-[0.24em] uppercase text-accent">
          Destinazione — Bari
        </span>
      </div>
      <h1 class="font-display font-light text-ink leading-[1.05] tracking-[-0.014em] text-[clamp(2.2rem,5vw,3.6rem)] max-w-[18ch]">
        Bari raccontata<br /><em class="not-italic text-ink-muted">da chi ci è nato.</em>
      </h1>
      <p class="font-body text-base sm:text-lg leading-relaxed text-ink-muted mt-md max-w-[52ch]">
        Sei guide live, sei voci baresi. Dal Borgo Antico al porto, dai teatri ai sotterranei: ogni itinerario è firmato da chi quei posti li ha vissuti da bambino.
      </p>
    </div>
  </section>

  {/* LE 6 GUIDE */}
  <BariMap lang="it" />

  {/* PRICING */}
  <section id="prezzi" class="bg-surface">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <SectionDivider label="Prendi quella che ti serve" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-lg max-w-[68rem] mx-auto">
        <PriceCard
          product="single"
          guideSlug="bari-vecchia"
          lang="it"
          features={[
            'Una guida a tua scelta',
            'Accesso illimitato, per sempre',
            'Italiano e inglese',
            'Rimborso 1-click entro 24h',
          ]}
        />
        <PriceCard
          product="essenziale"
          lang="it"
          features={[
            'Bari Vecchia · San Nicola · Il Meglio di Bari',
            '~1h 20min di racconto · 3 voci diverse',
            'Italiano e inglese',
            'Rimborso 1-click entro 24h',
          ]}
        />
        <PriceCard
          product="bundle"
          lang="it"
          primary
          features={[
            'Tutte le 6 guide di Bari',
            '~2h 20min di racconto · 6 voci diverse',
            'Risparmi €14,95 vs guide singole',
            'Rimborso 1-click entro 24h',
          ]}
        />
      </div>
    </div>
  </section>

  {/* AUTORI */}
  <AuthorsBlock lang="it" />

  {/* 3 PASSI */}
  <StepsBlock lang="it" ctaHref="/guide/bari-vecchia" />

</Layout>
```

- [ ] **Step 2: Verifica che la pagina rende senza errori**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/bari.astro
git commit -m "feat(pages): /bari destination page — BariMap + autori + pricing"
```

---

## Task 7: Crea `/valle-d-itria` destination page

**Files:**
- Create: `src/pages/valle-d-itria.astro`

- [ ] **Step 1: Crea src/pages/valle-d-itria.astro**

```astro
---
export const prerender = true;
import Layout from '../components/Layout.astro';
import SectionDivider from '../components/SectionDivider.astro';
import PriceCard from '../components/PriceCard.astro';

interface GuideEntry {
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  area: string;
  cover: string;
  alt: string;
  price?: string;
}

const guides: GuideEntry[] = [
  {
    slug: 'alberobello',
    title: 'Alberobello — Dentro i Trulli',
    subtitle: 'La storia fiscale che nessuno ti ha mai raccontato.',
    duration: '35 min',
    area: "Valle d'Itria",
    cover: '/images/covers/alberobello.jpg',
    alt: 'Trulli di Alberobello, Rione Monti',
    price: '€4,99',
  },
  {
    slug: 'locorotondo',
    title: 'Locorotondo — Il Borgo Rotondo',
    subtitle: "Un vino DOC, le cummerse e l'olio essenziale di lavanda.",
    duration: '31 min',
    area: "Valle d'Itria",
    cover: '/images/covers/locorotondo.jpg',
    alt: 'Locorotondo, case bianche con tetti a doppio spiovente',
    price: '€4,99',
  },
  {
    slug: 'martina-franca',
    title: 'Martina Franca — La Città Franca',
    subtitle: 'Trecento anni di ducato, raccontati da chi li ha nel sangue.',
    duration: '30 min',
    area: "Valle d'Itria",
    cover: '/images/covers/martina-franca.jpg',
    alt: 'Palazzo Ducale di Martina Franca, cortile barocco',
    price: '€4,99',
  },
];
---
<Layout
  title="Valle d'Itria — Audioguide narrative · Localis"
  description="Tre guide narrative della Valle d'Itria: Alberobello, Locorotondo, Martina Franca. Raccontate da chi ci vive. Da €4,99."
  lang="it"
>

  {/* PAGE HEADER */}
  <section class="bg-surface border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-2xl lg:py-3xl">
      <div class="flex items-center gap-sm mb-md">
        <span class="block w-7 h-px bg-accent"></span>
        <span class="text-[11px] font-semibold tracking-[0.24em] uppercase text-accent">
          Destinazione — Valle d'Itria
        </span>
      </div>
      <h1 class="font-display font-light text-ink leading-[1.05] tracking-[-0.014em] text-[clamp(2.2rem,5vw,3.6rem)] max-w-[22ch]">
        Valle d'Itria raccontata<br /><em class="not-italic text-ink-muted">da chi ci è nato.</em>
      </h1>
      <p class="font-body text-base sm:text-lg leading-relaxed text-ink-muted mt-md max-w-[52ch]">
        Tre guide live tra trulli, borghi bianchi e vigneti DOC. Alberobello, Locorotondo, Martina Franca — ogni voce è di chi ci vive.
      </p>
    </div>
  </section>

  {/* GUIDE GRID */}
  <section class="bg-surface">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <ol class="guide-grid list-none p-0 m-0">
        {guides.map((g, i) => (
          <li class="guide-cell" style={`--idx:${i}`}>
            <a href={`/guide/${g.slug}`} class="guide-card" aria-label={`${g.title} · ${g.duration}`}>
              <figure class="guide-photo m-0">
                <img src={g.cover} alt={g.alt} class="guide-img" loading="lazy" decoding="async" />
                <span class="guide-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                {g.price && <span class="guide-price" aria-hidden="true">{g.price}</span>}
                <span class="guide-scrim" aria-hidden="true">
                  <span class="guide-area">{g.area}</span>
                  <span class="guide-dur">{g.duration}</span>
                </span>
              </figure>
              <div class="guide-meta">
                <h3 class="guide-title font-display font-light text-ink leading-[1.2] m-0">{g.title}</h3>
                <p class="guide-sub font-body text-sm text-ink-muted m-0">{g.subtitle}</p>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  </section>

  {/* PRICING — singola o bundle valle */}
  <section id="prezzi" class="bg-surface-elev border-t border-border">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <SectionDivider label="Prendi quella che ti serve" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-[46rem] mx-auto">
        <PriceCard
          product="single"
          guideSlug="alberobello"
          lang="it"
          features={[
            'Una guida a tua scelta',
            'Accesso illimitato, per sempre',
            'Italiano e inglese',
            'Rimborso 1-click entro 24h',
          ]}
        />
        <PriceCard
          product="bundle"
          lang="it"
          primary
          features={[
            'Tutte le guide disponibili · Bari + Valle d\'Itria',
            '~3h di racconto · voci diverse',
            'Rimborso 1-click entro 24h',
          ]}
        />
      </div>
    </div>
  </section>

</Layout>

<style>
  .guide-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--spacing-lg);
    row-gap: var(--spacing-2xl);
  }
  @media (min-width: 640px) { .guide-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .guide-grid { grid-template-columns: repeat(3, 1fr); } }

  .guide-cell {
    opacity: 0;
    transform: translateY(14px);
    animation: guideIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    animation-delay: calc(var(--idx, 0) * 80ms + 100ms);
  }
  .guide-card {
    display: flex; flex-direction: column; gap: var(--spacing-md);
    text-decoration: none; color: inherit;
    border-top: 1px solid var(--color-ink); padding-top: var(--spacing-md);
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .guide-card:hover { transform: translateY(-2px); }
  .guide-photo {
    position: relative; width: 100%; aspect-ratio: 4 / 5;
    background: var(--color-surface-elev); overflow: hidden; border-radius: var(--radius-md);
    box-shadow: 0 1px 2px oklch(15% 0.012 240 / 0.08), 0 12px 32px -12px oklch(15% 0.012 240 / 0.16);
    transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 500ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .guide-card:nth-child(3n+1) .guide-photo { transform: rotate(-1deg); }
  .guide-card:nth-child(3n+2) .guide-photo { transform: rotate(0.8deg); }
  .guide-card:nth-child(3n+3) .guide-photo { transform: rotate(-0.6deg); }
  .guide-card:hover .guide-photo { transform: rotate(0deg) scale(1.01); box-shadow: 0 2px 4px oklch(15% 0.012 240 / 0.12), 0 24px 48px -16px oklch(15% 0.012 240 / 0.22); }
  .guide-img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.94) contrast(1.04); transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1); }
  .guide-card:hover .guide-img { transform: scale(1.03); }
  .guide-num { position: absolute; top: var(--spacing-sm); left: var(--spacing-sm); font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: clamp(2.4rem, 4.4vw, 3.2rem); line-height: 0.85; color: var(--color-surface); letter-spacing: -0.04em; text-shadow: 0 1px 8px oklch(15% 0.012 240 / 0.55); pointer-events: none; user-select: none; }
  .guide-price { position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); font-family: var(--font-body); font-size: 0.8125rem; font-weight: 700; color: var(--color-ink); background: var(--color-surface); border: 1px solid var(--color-accent); padding: 4px 10px 5px; line-height: 1.2; box-shadow: 0 1px 2px oklch(15% 0.012 240 / 0.18); pointer-events: none; user-select: none; z-index: 1; }
  .guide-scrim { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-sm) var(--spacing-md); background: linear-gradient(to top, oklch(15% 0.012 240 / 0.78), transparent 100%); color: var(--color-surface); font-family: var(--font-body); font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; pointer-events: none; }
  .guide-area { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .guide-dur { flex-shrink: 0; color: var(--color-accent-soft); }
  .guide-meta { display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .guide-title { font-size: clamp(1.1rem, 2.4vw, 1.35rem); }
  .guide-sub { line-height: 1.5; }
  .guide-card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; border-radius: 2px; }
  @keyframes guideIn { to { opacity: 1; transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .guide-cell, .guide-card, .guide-img { animation: none !important; transition: none !important; opacity: 1; transform: none; } }
</style>
```

- [ ] **Step 2: Verifica build**

```bash
npx astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/valle-d-itria.astro
git commit -m "feat(pages): /valle-d-itria destination page — 3 guide + pricing"
```

---

## Task 8: Crea `/gargano` destination page (coming soon)

**Files:**
- Create: `src/pages/gargano.astro`

Pagina minimale "in arrivo" — quando le guide saranno pronte si aggiungono senza toccare altro.

- [ ] **Step 1: Crea src/pages/gargano.astro**

```astro
---
export const prerender = true;
import Layout from '../components/Layout.astro';
---
<Layout
  title="Gargano — Audioguide narrative · Localis"
  description="Le guide narrative del Gargano sono in arrivo. Vieste, Mattinata, le Isole Tremiti — raccontate da chi ci vive."
  lang="it"
>
  <section class="bg-surface min-h-[60vh] flex items-center">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <div class="flex items-center gap-sm mb-md">
        <span class="block w-7 h-px bg-accent"></span>
        <span class="text-[11px] font-semibold tracking-[0.24em] uppercase text-accent">
          Destinazione — Gargano
        </span>
      </div>
      <h1 class="font-display font-light text-ink leading-[1.05] tracking-[-0.014em] text-[clamp(2.2rem,5vw,3.6rem)] max-w-[20ch] mb-md">
        Gargano.<br /><em class="not-italic text-ink-muted">In arrivo.</em>
      </h1>
      <p class="font-body text-base sm:text-lg leading-relaxed text-ink-muted max-w-[48ch] mb-2xl">
        Vieste, Mattinata, le Isole Tremiti, il Sacro Monte — le guide del Gargano sono in produzione. Storie raccontate da chi quei promontori li ha vissuti.
      </p>
      <a
        href="/guide"
        class="inline-flex items-center justify-center gap-xs px-lg py-md bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline min-h-[48px]"
      >
        Nel frattempo, scopri Bari e Valle d'Itria
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </a>
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/gargano.astro
git commit -m "feat(pages): /gargano destination page — coming soon placeholder"
```

---

## Task 9: Versioni EN delle 3 destination pages

**Files:**
- Create: `src/pages/en/bari.astro`
- Create: `src/pages/en/valle-d-itria.astro`
- Create: `src/pages/en/gargano.astro`

- [ ] **Step 1: Crea src/pages/en/bari.astro**

Stessa struttura di `src/pages/bari.astro` ma con `lang="en"` e testi in inglese:

```astro
---
export const prerender = true;
import Layout from '../../components/Layout.astro';
import FeatureBlock from '../../components/FeatureBlock.astro';
import BariMap from '../../components/BariMap.astro';
import PriceCard from '../../components/PriceCard.astro';
import SectionDivider from '../../components/SectionDivider.astro';
import AuthorsBlock from '../../components/AuthorsBlock.astro';
import StepsBlock from '../../components/StepsBlock.astro';
---
<Layout
  title="Bari — Narrative Audio Guides · Localis"
  description="Six narrative audio guides of Bari told by Bari-born authors. Old Town, San Nicola, Port, Theatres, Underground, Best of Bari. From €4.99."
  lang="en"
>
  <section class="bg-surface border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-2xl lg:py-3xl">
      <div class="flex items-center gap-sm mb-md">
        <span class="block w-7 h-px bg-accent"></span>
        <span class="text-[11px] font-semibold tracking-[0.24em] uppercase text-accent">
          Destination — Bari
        </span>
      </div>
      <h1 class="font-display font-light text-ink leading-[1.05] tracking-[-0.014em] text-[clamp(2.2rem,5vw,3.6rem)] max-w-[18ch]">
        Bari told<br /><em class="not-italic text-ink-muted">by people born there.</em>
      </h1>
      <p class="font-body text-base sm:text-lg leading-relaxed text-ink-muted mt-md max-w-[52ch]">
        Six live guides, six Bari voices. From the Old Town to the port, from the theatres to the underground city: every route is signed by someone who lived those places as a child.
      </p>
    </div>
  </section>

  <BariMap lang="en" />

  <section id="prezzi" class="bg-surface">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <SectionDivider label="Take what you need" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-lg max-w-[68rem] mx-auto">
        <PriceCard product="single" guideSlug="bari-vecchia" lang="en" features={['One guide of your choice','Unlimited access, forever','Italian and English','1-click refund within 24h']} />
        <PriceCard product="essenziale" lang="en" features={['Old Town · San Nicola · Best of Bari','~1h 20min · 3 different voices','Italian and English','1-click refund within 24h']} />
        <PriceCard product="bundle" lang="en" primary features={['All 6 Bari guides','~2h 20min · 6 different voices','Save €14.95 vs single guides','1-click refund within 24h']} />
      </div>
    </div>
  </section>

  <AuthorsBlock lang="en" />
  <StepsBlock lang="en" ctaHref="/en/guide/bari-vecchia" />
</Layout>
```

- [ ] **Step 2: Crea src/pages/en/valle-d-itria.astro**

Stessa struttura di `src/pages/valle-d-itria.astro` con `lang="en"`, testi inglesi, e link `/en/guide/[slug]`:

```astro
---
export const prerender = true;
import Layout from '../../components/Layout.astro';
import SectionDivider from '../../components/SectionDivider.astro';
import PriceCard from '../../components/PriceCard.astro';

interface GuideEntry {
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  area: string;
  cover: string;
  alt: string;
  price?: string;
}

const guides: GuideEntry[] = [
  {
    slug: 'alberobello',
    title: 'Alberobello — Inside the Trulli',
    subtitle: 'The tax story nobody ever told you.',
    duration: '35 min',
    area: "Valle d'Itria",
    cover: '/images/covers/alberobello.jpg',
    alt: 'Trulli of Alberobello, Rione Monti district',
    price: '€4.99',
  },
  {
    slug: 'locorotondo',
    title: 'Locorotondo — The Round Village',
    subtitle: 'A DOC wine, the cummerse and lavender essential oil.',
    duration: '31 min',
    area: "Valle d'Itria",
    cover: '/images/covers/locorotondo.jpg',
    alt: 'Locorotondo, white houses with double-pitched roofs',
    price: '€4.99',
  },
  {
    slug: 'martina-franca',
    title: 'Martina Franca — The Free City',
    subtitle: 'Three hundred years of duchy, told by those who carry it in their blood.',
    duration: '30 min',
    area: "Valle d'Itria",
    cover: '/images/covers/martina-franca.jpg',
    alt: 'Ducal Palace of Martina Franca, baroque courtyard',
    price: '€4.99',
  },
];
---
<Layout
  title="Valle d'Itria — Narrative Audio Guides · Localis"
  description="Three narrative audio guides of Valle d'Itria: Alberobello, Locorotondo, Martina Franca. Told by locals. From €4.99."
  lang="en"
>
  <section class="bg-surface border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-2xl lg:py-3xl">
      <div class="flex items-center gap-sm mb-md">
        <span class="block w-7 h-px bg-accent"></span>
        <span class="text-[11px] font-semibold tracking-[0.24em] uppercase text-accent">
          Destination — Valle d'Itria
        </span>
      </div>
      <h1 class="font-display font-light text-ink leading-[1.05] tracking-[-0.014em] text-[clamp(2.2rem,5vw,3.6rem)] max-w-[22ch]">
        Valle d'Itria told<br /><em class="not-italic text-ink-muted">by people born there.</em>
      </h1>
      <p class="font-body text-base sm:text-lg leading-relaxed text-ink-muted mt-md max-w-[52ch]">
        Three live guides among trulli, white villages and DOC vineyards. Alberobello, Locorotondo, Martina Franca — every voice belongs to someone who lives there.
      </p>
    </div>
  </section>

  <section class="bg-surface">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <ol class="guide-grid list-none p-0 m-0">
        {guides.map((g, i) => (
          <li class="guide-cell" style={`--idx:${i}`}>
            <a href={`/en/guide/${g.slug}`} class="guide-card" aria-label={`${g.title} · ${g.duration}`}>
              <figure class="guide-photo m-0">
                <img src={g.cover} alt={g.alt} class="guide-img" loading="lazy" decoding="async" />
                <span class="guide-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                {g.price && <span class="guide-price" aria-hidden="true">{g.price}</span>}
                <span class="guide-scrim" aria-hidden="true">
                  <span class="guide-area">{g.area}</span>
                  <span class="guide-dur">{g.duration}</span>
                </span>
              </figure>
              <div class="guide-meta">
                <h3 class="guide-title font-display font-light text-ink leading-[1.2] m-0">{g.title}</h3>
                <p class="guide-sub font-body text-sm text-ink-muted m-0">{g.subtitle}</p>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  </section>

  <section id="prezzi" class="bg-surface-elev border-t border-border">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <SectionDivider label="Take what you need" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-[46rem] mx-auto">
        <PriceCard product="single" guideSlug="alberobello" lang="en" features={['One guide of your choice','Unlimited access, forever','Italian and English','1-click refund within 24h']} />
        <PriceCard product="bundle" lang="en" primary features={['All available guides · Bari + Valle d\'Itria','~3h of storytelling · different voices','1-click refund within 24h']} />
      </div>
    </div>
  </section>
</Layout>

<style>
  /* Stessi stili di /valle-d-itria.astro — copiare il blocco <style> intero */
  .guide-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: var(--spacing-lg); row-gap: var(--spacing-2xl); }
  @media (min-width: 640px) { .guide-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .guide-grid { grid-template-columns: repeat(3, 1fr); } }
  .guide-cell { opacity: 0; transform: translateY(14px); animation: guideIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; animation-delay: calc(var(--idx, 0) * 80ms + 100ms); }
  .guide-card { display: flex; flex-direction: column; gap: var(--spacing-md); text-decoration: none; color: inherit; border-top: 1px solid var(--color-ink); padding-top: var(--spacing-md); transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1); }
  .guide-card:hover { transform: translateY(-2px); }
  .guide-photo { position: relative; width: 100%; aspect-ratio: 4 / 5; background: var(--color-surface-elev); overflow: hidden; border-radius: var(--radius-md); box-shadow: 0 1px 2px oklch(15% 0.012 240 / 0.08), 0 12px 32px -12px oklch(15% 0.012 240 / 0.16); transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 500ms cubic-bezier(0.22, 1, 0.36, 1); }
  .guide-card:nth-child(3n+1) .guide-photo { transform: rotate(-1deg); }
  .guide-card:nth-child(3n+2) .guide-photo { transform: rotate(0.8deg); }
  .guide-card:nth-child(3n+3) .guide-photo { transform: rotate(-0.6deg); }
  .guide-card:hover .guide-photo { transform: rotate(0deg) scale(1.01); box-shadow: 0 2px 4px oklch(15% 0.012 240 / 0.12), 0 24px 48px -16px oklch(15% 0.012 240 / 0.22); }
  .guide-img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.94) contrast(1.04); transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1); }
  .guide-card:hover .guide-img { transform: scale(1.03); }
  .guide-num { position: absolute; top: var(--spacing-sm); left: var(--spacing-sm); font-family: var(--font-display); font-style: italic; font-weight: 300; font-size: clamp(2.4rem, 4.4vw, 3.2rem); line-height: 0.85; color: var(--color-surface); letter-spacing: -0.04em; text-shadow: 0 1px 8px oklch(15% 0.012 240 / 0.55); pointer-events: none; user-select: none; }
  .guide-price { position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); font-family: var(--font-body); font-size: 0.8125rem; font-weight: 700; color: var(--color-ink); background: var(--color-surface); border: 1px solid var(--color-accent); padding: 4px 10px 5px; line-height: 1.2; box-shadow: 0 1px 2px oklch(15% 0.012 240 / 0.18); pointer-events: none; user-select: none; z-index: 1; }
  .guide-scrim { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-sm) var(--spacing-md); background: linear-gradient(to top, oklch(15% 0.012 240 / 0.78), transparent 100%); color: var(--color-surface); font-family: var(--font-body); font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; pointer-events: none; }
  .guide-area { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .guide-dur { flex-shrink: 0; color: var(--color-accent-soft); }
  .guide-meta { display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .guide-title { font-size: clamp(1.1rem, 2.4vw, 1.35rem); }
  .guide-sub { line-height: 1.5; }
  .guide-card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; border-radius: 2px; }
  @keyframes guideIn { to { opacity: 1; transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .guide-cell, .guide-card, .guide-img { animation: none !important; transition: none !important; opacity: 1; transform: none; } }
</style>
```

- [ ] **Step 3: Crea src/pages/en/gargano.astro**

```astro
---
export const prerender = true;
import Layout from '../../components/Layout.astro';
---
<Layout
  title="Gargano — Narrative Audio Guides · Localis"
  description="Narrative audio guides of Gargano are coming. Vieste, Mattinata, the Tremiti Islands — told by locals."
  lang="en"
>
  <section class="bg-surface min-h-[60vh] flex items-center">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <div class="flex items-center gap-sm mb-md">
        <span class="block w-7 h-px bg-accent"></span>
        <span class="text-[11px] font-semibold tracking-[0.24em] uppercase text-accent">
          Destination — Gargano
        </span>
      </div>
      <h1 class="font-display font-light text-ink leading-[1.05] tracking-[-0.014em] text-[clamp(2.2rem,5vw,3.6rem)] max-w-[20ch] mb-md">
        Gargano.<br /><em class="not-italic text-ink-muted">Coming soon.</em>
      </h1>
      <p class="font-body text-base sm:text-lg leading-relaxed text-ink-muted max-w-[48ch] mb-2xl">
        Vieste, Mattinata, the Tremiti Islands, the Sacred Mountain — Gargano guides are in production. Stories told by people who've lived on those cliffs.
      </p>
      <a
        href="/en/guide"
        class="inline-flex items-center justify-center gap-xs px-lg py-md bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-colors duration-fast no-underline min-h-[48px]"
      >
        Meanwhile, explore Bari and Valle d'Itria
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </a>
    </div>
  </section>
</Layout>
```

- [ ] **Step 4: Verifica build completa**

```bash
npx astro check && npx astro build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/en/bari.astro src/pages/en/valle-d-itria.astro src/pages/en/gargano.astro
git commit -m "feat(pages): versioni EN /bari, /valle-d-itria, /gargano"
```

---

## Task 10: Aggiorna homepage EN (en/index.astro) + nav

**Files:**
- Modify: `src/pages/en/index.astro`
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Apri src/pages/en/index.astro e applica le stesse modifiche della homepage IT**

- Importa `DestinationsBlock` invece di `BariMap`
- Rimuovi `AuthorsBlock`
- Cambia il FeatureBlock Tav. III bullets (stessa logica Task 2, versione EN)
- Aggiorna il Closer: "Puglia is visited in a journey. Understood in chapters."
- Il CTA Closer: `href="/en/guide"`

- [ ] **Step 2: Aggiorna Header.astro — aggiungi link destinazioni nel dropdown o nav**

In `src/components/Header.astro`, il link "Guide" punta già a `/guide`. Non è necessario cambiare la nav per ora — le destination pages sono accessibili dalla homepage via DestinationsBlock. Se in futuro si vuole un dropdown con Bari/Valle d'Itria/Gargano si può aggiungere.

Verifica solo che il link Guide usi path localizzato:

```astro
<!-- Controlla che il link Guide usi localizedHref correttamente -->
<a href={localizedHref('/guide', lang)} ...>
  {lang === 'it' ? 'Guide' : 'Guides'}
</a>
```

- [ ] **Step 3: Build finale e verifica**

```bash
npx astro check && npx astro build 2>&1 | tail -30
```

Expected: build OK, tutte le route generate incluse `/bari`, `/valle-d-itria`, `/gargano`, `/en/bari`, `/en/valle-d-itria`, `/en/gargano`.

- [ ] **Step 4: Commit e push**

```bash
git add src/pages/en/index.astro src/components/Header.astro
git commit -m "refactor(en/homepage): brand-level — DestinationsBlock, rimuove AuthorsBlock, aggiorna Closer"
git push
```

---

## Note post-implementazione

- **Cover Gargano**: il DestinationsBlock usa `/images/covers/bari-vecchia.jpg` come placeholder per Gargano. Sostituire con immagine Gargano appena disponibile.
- **Bundle Valle d'Itria pricing**: il PriceCard `product="bundle"` su `/valle-d-itria` usa il bundle Bari esistente. In futuro creare un bundle specifico Valle d'Itria o cross-destinazione.
- **Redirects**: se esistono link esterni che puntano alla homepage aspettandosi le guide Bari, aggiungere redirect `/` → contenuto invariato (non serve redirect, la homepage mostra ancora le destinazioni).
- **SEO**: aggiungere sitemap entries per `/bari`, `/valle-d-itria`, `/gargano` se la sitemap è generata staticamente.
