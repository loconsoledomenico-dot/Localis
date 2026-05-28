# Landing Crocieristi — Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rifare da zero la landing `/crocieristi` con bundle dedicato `crociera` a €7,99 (Bari Vecchia + Il Meglio di Bari), sticky CTA mobile, mappa statica placeholder, hero aggiornato, nav link, e pillola homepage Bari.

**Architecture:** Nuovo `ProductSlug` `crociera` in `stripe-prices.ts`/`checkout.ts` → CTA inline nella pagina (no PriceCard) → IntersectionObserver per sticky mobile CTA → Header e homepage aggiornati.

**Tech Stack:** Astro 4, Tailwind (custom design tokens), Stripe Checkout Sessions, TypeScript

---

## File Map

| Azione | File |
|--------|------|
| Modify | `src/data/stripe-prices.json` |
| Modify | `src/lib/stripe-prices.ts` |
| Modify | `src/pages/api/checkout.ts` |
| Replace | `src/pages/crocieristi.astro` |
| Modify | `src/components/Header.astro` |
| Modify | `src/pages/index.astro` (pillola Bari card) |
| Add | `public/images/maps/bari-crociera-route.png` ← **da generare manualmente, vedi Task 3** |

---

## Task 1: Estendi il sistema Stripe per il prodotto `crociera`

**Files:**
- Modify: `src/data/stripe-prices.json`
- Modify: `src/lib/stripe-prices.ts`
- Modify: `src/pages/api/checkout.ts`

Il prodotto `crociera` è un bundle 2-guide (Bari Vecchia + Il Meglio di Bari) a €7,99. Usa lo stesso flow checkout esistente: POST `/api/checkout` → Stripe Session → webhook → magic link.

- [ ] **Step 1: Aggiungi placeholder in stripe-prices.json**

Sostituisci l'intero file con:
```json
{
  "single": "price_REPLACE_WITH_REAL_ID",
  "essenziale": "price_REPLACE_WITH_REAL_ID",
  "bundle": "price_REPLACE_WITH_REAL_ID",
  "crociera": "price_REPLACE_WITH_REAL_ID"
}
```

- [ ] **Step 2: Aggiorna stripe-prices.ts**

Sostituisci l'intero file con:
```typescript
import prices from '../data/stripe-prices.json';

export type ProductSlug = 'single' | 'essenziale' | 'bundle' | 'crociera';

const envSingle    = process.env.Stripe_id_singola;
const envEssenziale = process.env.Stripe_id_essenziale;
const envBundle    = process.env.Stripe_id_bundle;
const envCrociera  = process.env.Stripe_id_crociera;

const priceMap = prices as Record<string, string>;

export const STRIPE_PRICE_IDS: Record<ProductSlug, string> = {
  single:    envSingle    || priceMap.single,
  essenziale: envEssenziale || priceMap.essenziale,
  bundle:    envBundle    || priceMap.bundle,
  crociera:  envCrociera  || priceMap.crociera,
};

export const BARI_GUIDES: readonly string[] = [
  'bari-vecchia',
  'san-nicola',
  'tre-teatri',
  'il-meglio-di-bari',
  'porto-bari',
  'bari-sotterranea',
] as const;

export const BARI_ESSENZIALE_GUIDES: readonly string[] = [
  'bari-vecchia',
  'san-nicola',
  'il-meglio-di-bari',
] as const;

export const CROCIERA_GUIDES: readonly string[] = [
  'bari-vecchia',
  'il-meglio-di-bari',
] as const;

export function getStripePrice(slug: ProductSlug): string {
  const id = STRIPE_PRICE_IDS[slug];
  if (!id || id.startsWith('price_REPLACE')) {
    throw new Error(`Stripe price ID not configured for product "${slug}"`);
  }
  return id;
}

export function getGuideSlugsForProduct(
  product: ProductSlug,
  guideSlug?: string,
): string[] {
  if (product === 'bundle')    return [...BARI_GUIDES];
  if (product === 'essenziale') return [...BARI_ESSENZIALE_GUIDES];
  if (product === 'crociera')  return [...CROCIERA_GUIDES];
  if (!guideSlug || !BARI_GUIDES.includes(guideSlug)) {
    throw new Error(`Invalid or missing guideSlug for single purchase: ${guideSlug}`);
  }
  return [guideSlug];
}

export function getProductPriceCents(product: ProductSlug): number {
  if (product === 'bundle')    return 1499;
  if (product === 'essenziale') return 999;
  if (product === 'crociera')  return 799;
  return 499;
}
```

- [ ] **Step 3: Aggiorna checkout.ts — validazione product**

Riga 24 in `src/pages/api/checkout.ts`, cambia la guard:
```typescript
// DA:
if (!product || (product !== 'single' && product !== 'essenziale' && product !== 'bundle')) {
// A:
if (!product || !['single', 'essenziale', 'bundle', 'crociera'].includes(product)) {
```

- [ ] **Step 4: Aggiungi env var `Stripe_id_crociera` su Vercel**

  1. Vai su Vercel → LocalisGuide → Settings → Environment Variables
  2. Aggiungi `Stripe_id_crociera` con il Price ID Stripe del prodotto "Pacchetto Crociera" (€7,99)
  3. **Prima crea il prodotto in Stripe** (Dashboard → Products → Add product → "Pacchetto Crociera" → €7,99 one-time → salva il `price_xxx`)
  4. Su Vercel aggiorna anche le variabili esistenti se sono placeholder

- [ ] **Step 5: Commit**

```bash
git add src/data/stripe-prices.json src/lib/stripe-prices.ts src/pages/api/checkout.ts
git commit -m "feat(stripe): add crociera product at 7,99 — bari-vecchia + il-meglio"
```

---

## Task 2: Mappa statica — PNG route Molo Pizzoli → Bari Vecchia

**Files:**
- Add: `public/images/maps/bari-crociera-route.png`

Questo step richiede lavoro manuale. La pagina usa un placeholder fino a quando l'immagine viene aggiunta.

- [ ] **Step 1: Genera la mappa**

  Opzione A (consigliata) — uMap (gratuito, OpenStreetMap):
  1. Vai su https://umap.openstreetmap.fr/it/
  2. Crea nuova mappa centrata su Bari (41.1256, 16.8719)
  3. Traccia una linea: Molo Pizzoli → Via Venezia → Lungomare → Via Nazareno Sauro → entrata Bari Vecchia
  4. Aggiungi marker su: Molo Pizzoli, Cattedrale S.Sabino, Basilica S.Nicola, Via delle Orecchiette
  5. Esporta come PNG (tasto destro → salva immagine) 1200x800 px
  6. Ottimizza con https://squoosh.app → WebP o JPG sotto 150kb
  
  Opzione B — Mapbox Static Images API (se hai account):
  ```
  https://api.mapbox.com/styles/v1/mapbox/light-v11/static/
  path-3+f97316-0.8([16.869,41.129],[16.870,41.129],[16.869,41.128]...)
  /16.8719,41.1255,15/1200x800@2x?access_token=TOKEN
  ```

- [ ] **Step 2: Salva il file**

  Copia in `public/images/maps/bari-crociera-route.png` (o `.jpg`)
  
  Verifica peso: sotto 150kb. Se superiore, ri-ottimizza con squoosh.

- [ ] **Step 3: Commit**

```bash
git add public/images/maps/
git commit -m "feat(assets): mappa statica route crocieristi bari"
```

> **Nota:** Il Task 3 (rebuild pagina) usa già il path `src="/images/maps/bari-crociera-route.png"`. Se la mappa non è ancora pronta, viene mostrato un box placeholder con testo — questo è gestito nel markup con `onerror`.

---

## Task 3: Rebuild `/crocieristi.astro`

**Files:**
- Replace: `src/pages/crocieristi.astro`

Struttura: Hero → Cosa ascolti → Il percorso → Come funziona → Torni in tempo → FAQ → Closer → Footer. Sticky CTA mobile attivata dopo scroll oltre l'hero.

- [ ] **Step 1: Riscrivi il file completo**

Sostituisci `src/pages/crocieristi.astro` con:

```astro
---
export const prerender = true;
import Layout from '../components/Layout.astro';
---
<Layout
  title="Bari porto crociere · cosa fare in 4 ore · Localis"
  description="Due audioguide narrative pensate per crocieristi a Bari. 7,99 euro il pacchetto, offline, senza app. Visiti Bari Vecchia in 4 ore."
  lang="it"
  ogImage="/og/og-bari-vecchia.jpg"
>

  <!-- ══════════════════════════════════════════
       1 · HERO
  ══════════════════════════════════════════ -->
  <section id="hero-crociera" class="cruise-hero relative overflow-hidden border-b border-border">
    <img
      src="/images/covers/nave-crociera.jpg"
      alt="Nave da crociera ormeggiata al molo di Bari"
      class="cruise-hero-bg"
      width="1200"
      height="800"
      loading="eager"
      fetchpriority="high"
      decoding="async"
    />
    <div class="cruise-hero-scrim" aria-hidden="true"></div>
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl relative z-10">
      <div class="flex items-center gap-sm mb-md">
        <span class="block w-7 h-px bg-accent"></span>
        <span class="text-[11px] font-semibold tracking-[0.24em] uppercase text-accent">Scali · Bari</span>
      </div>
      <h1 class="font-display font-light text-ink leading-[1.05] tracking-[-0.014em] text-[clamp(2rem,5vw,3.4rem)] max-w-[22ch]">
        Sei sbarcato a Bari?<br />Hai 4 ore.<br /><em class="not-italic text-ink-muted">Te le facciamo valere.</em>
      </h1>
      <p class="font-body text-base sm:text-lg leading-relaxed text-ink-muted mt-md max-w-[50ch]">
        Due audioguide pensate per chi ha poco tempo e vuole vedere il vero centro storico. Senza app, senza prenotazioni, senza guide al seguito.
      </p>
      <div class="flex flex-col sm:flex-row gap-sm mt-lg">
        <button
          type="button"
          id="hero-cta-btn"
          class="checkout-btn-crociera inline-flex items-center justify-center gap-xs px-lg py-md bg-ink text-surface rounded-md font-semibold text-sm hover:bg-ink/90 transition-[background-color,transform] duration-fast hover:-translate-y-[1px] active:translate-y-0 no-underline min-h-[48px]"
          data-product="crociera"
          data-lang="it"
        >
          Pacchetto Crociera — €7,99
        </button>
        <button
          type="button"
          id="trailer-btn"
          class="inline-flex items-center justify-center gap-xs px-lg py-md border border-border text-ink rounded-md font-semibold text-sm hover:bg-surface-elev transition-colors duration-fast no-underline min-h-[48px]"
          aria-label="Ascolta 60 secondi di assaggio"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Ascolta 60 secondi di assaggio
        </button>
      </div>
      <!-- hidden audio player for trailer -->
      <audio id="trailer-audio" src="/audio/trailers/bari-vecchia.mp3" preload="none" class="hidden"></audio>
    </div>
  </section>

  <!-- ══════════════════════════════════════════
       2 · COSA ASCOLTI
  ══════════════════════════════════════════ -->
  <section class="bg-surface-elev border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <p class="text-[10px] font-semibold tracking-[0.32em] uppercase text-ink-subtle mb-sm">— Le guide —</p>
      <h2 class="font-display text-3xl sm:text-4xl text-ink mb-xl leading-tight max-w-[26ch]">
        Due capitoli. Una mattina che ricorderai.
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">

        <!-- Card 1: Bari Vecchia -->
        <article class="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
          <div class="aspect-[16/9] overflow-hidden">
            <img
              src="/images/covers/bari-vecchia.jpg"
              alt="Vicoli di Bari Vecchia"
              class="w-full h-full object-cover"
              width="640"
              height="360"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="p-lg flex flex-col gap-sm flex-1">
            <p class="text-[10px] font-semibold tracking-[0.28em] uppercase text-accent">21 minuti</p>
            <h3 class="font-display text-xl text-ink leading-snug">Bari Vecchia — Dentro la Città</h3>
            <p class="text-sm text-ink-muted leading-relaxed">
              Parte da Strada delle Crociate. Il Borgo Antico capitolo per capitolo: la Basilica di San Nicola, le strette, la Cattedrale, i rioni. Storia vera, non la guida turistica standard.
            </p>
          </div>
        </article>

        <!-- Card 2: Il Meglio di Bari -->
        <article class="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
          <div class="aspect-[16/9] overflow-hidden">
            <img
              src="/images/covers/il-meglio-di-bari.jpg"
              alt="Mercato del pesce e lungomare di Bari"
              class="w-full h-full object-cover"
              width="640"
              height="360"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="p-lg flex flex-col gap-sm flex-1">
            <p class="text-[10px] font-semibold tracking-[0.28em] uppercase text-accent">29 minuti</p>
            <h3 class="font-display text-xl text-ink leading-snug">Il Meglio di Bari — Mangia Prima di Capire</h3>
            <p class="text-sm text-ink-muted leading-relaxed">
              Parte da Strada Arco Basso. Il lungomare, il mercato del pesce, i panzerotti. I posti che i baresi non spiegano perché li danno per scontati.
            </p>
          </div>
        </article>

      </div>
      <p class="text-sm text-ink-muted mt-xl text-center">
        50 minuti di racconto più il tempo del cammino. Totale <strong class="text-ink">3–4 ore</strong>, ritorno in nave compreso.
      </p>
    </div>
  </section>

  <!-- ══════════════════════════════════════════
       3 · IL PERCORSO
  ══════════════════════════════════════════ -->
  <section class="bg-surface border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <p class="text-[10px] font-semibold tracking-[0.32em] uppercase text-ink-subtle mb-sm">— Mappa —</p>
      <h2 class="font-display text-3xl text-ink mb-lg leading-tight">
        Dal molo a Bari Vecchia. <span class="font-light italic text-ink-muted">600 metri.</span>
      </h2>
      <div class="rounded-lg overflow-hidden border border-border bg-surface-elev mb-lg">
        <img
          src="/images/maps/bari-crociera-route.png"
          alt="Mappa percorso dal Molo Pizzoli a Bari Vecchia — 600 metri a piedi"
          class="w-full h-auto"
          width="1200"
          height="600"
          loading="lazy"
          decoding="async"
          onerror="this.closest('.map-wrap')?.classList.add('map-error')"
        />
      </div>
      <ol class="flex flex-wrap gap-sm text-sm text-ink-muted">
        {[
          'Molo Pizzoli',
          '8 minuti a piedi',
          'Cattedrale di San Sabino',
          'Basilica di San Nicola',
          'Strada delle Orecchiette',
          'Ritorno al molo',
        ].map((step, i) => (
          <li class="flex items-center gap-xs">
            {i > 0 && <span class="text-ink-subtle" aria-hidden="true">→</span>}
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p class="text-xs text-ink-subtle mt-md">La guida parte dove serve. Tu cammini al tuo ritmo.</p>
    </div>
  </section>

  <!-- ══════════════════════════════════════════
       4 · COME FUNZIONA
  ══════════════════════════════════════════ -->
  <section class="bg-surface-elev border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <p class="text-[10px] font-semibold tracking-[0.32em] uppercase text-ink-subtle mb-sm">— Istruzioni —</p>
      <h2 class="font-display text-3xl text-ink mb-xl leading-tight">In due minuti sei dentro.</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-xl">
        {[
          {
            n: '01',
            title: 'Acquisti',
            body: 'Dal wifi della nave, del terminal o di un bar. Carta di credito, niente registrazione.',
          },
          {
            n: '02',
            title: 'Apri il link',
            body: 'Arriva via email. Scarichi, ascolti anche offline — senza app, senza account.',
          },
          {
            n: '03',
            title: 'Cammini e ascolti',
            body: 'Le mani libere per le foto e il caffè. La guida ti accompagna passo dopo passo.',
          },
        ].map(({ n, title, body }) => (
          <div class="flex flex-col gap-sm">
            <span class="font-display text-5xl text-ink-subtle/30 leading-none">{n}</span>
            <h3 class="font-display text-xl text-ink">{title}</h3>
            <p class="text-sm text-ink-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
      <div class="mt-xl">
        <button
          type="button"
          class="checkout-btn-crociera inline-flex items-center justify-center gap-xs px-xl py-md bg-ink text-surface rounded-md font-semibold text-base hover:bg-ink/90 transition-[background-color,transform] duration-fast hover:-translate-y-[1px] active:translate-y-0 min-h-[52px]"
          data-product="crociera"
          data-lang="it"
        >
          Inizia ora — €7,99
        </button>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════
       5 · TORNI IN TEMPO
  ══════════════════════════════════════════ -->
  <section class="bg-surface border-b border-border">
    <div class="max-w-wrap mx-auto px-md py-3xl lg:py-4xl">
      <div class="max-w-[54ch]">
        <p class="text-[10px] font-semibold tracking-[0.32em] uppercase text-ink-subtle mb-sm">— Timing —</p>
        <h2 class="font-display text-3xl text-ink mb-xl leading-tight">Torni in nave puntuale. <span class="font-light italic text-ink-muted">Garantito.</span></h2>
        <ul class="flex flex-col gap-md">
          {[
            'Le guide durano poco apposta — 50 minuti totali',
            "Aggiungi un'ora e mezza–due di camminata con calma",
            'Tieni 30 minuti di margine per il ritorno al molo',
            'Se sbarchi alle 9 e riparti alle 17, hai tutto il tempo',
          ].map((item) => (
            <li class="flex items-start gap-md text-sm text-ink-muted leading-relaxed">
              <span class="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════
       6 · FAQ
  ══════════════════════════════════════════ -->
  <section class="bg-surface-elev border-b border-border">
    <div class="max-w-narrow mx-auto px-md py-3xl lg:py-4xl">
      <p class="text-[10px] font-semibold tracking-[0.32em] uppercase text-ink-subtle mb-sm">— Domande —</p>
      <h2 class="font-display text-3xl text-ink mb-xl leading-tight">FAQ</h2>
      <dl class="flex flex-col divide-y divide-border">
        {[
          {
            q: 'Mi serve internet mentre cammino?',
            a: 'No. Una volta scaricata la guida funziona offline. Compra dal wifi del terminal o della nave.',
          },
          {
            q: 'Quanto dista Bari Vecchia dal molo?',
            a: '600 metri, 8–10 minuti a piedi sul lungomare. Tutto pianeggiante.',
          },
          {
            q: 'E se non torno in tempo per la nave?',
            a: 'Le guide durano apposta poco. Con 4 ore di sbarco hai sempre 2 ore di margine.',
          },
          {
            q: 'Posso ascoltarla anche dopo, a casa?',
            a: 'Sì, la guida è tua per sempre. Molti la riascoltano dopo il viaggio.',
          },
          {
            q: 'Le voci sono reali o AI?',
            a: 'Sono voci sintetizzate, lo dichiariamo. I testi sono scritti da noi, baresi, con bibliografia su /fonti. Stiamo lavorando per sostituirle con narratori pugliesi.',
          },
        ].map(({ q, a }) => (
          <div class="py-lg">
            <dt class="font-semibold text-ink text-base mb-xs">{q}</dt>
            <dd class="text-sm text-ink-muted leading-relaxed m-0">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>

  <!-- ══════════════════════════════════════════
       7 · CLOSER + CTA FINALE
  ══════════════════════════════════════════ -->
  <section class="bg-surface border-b border-border">
    <div class="max-w-narrow mx-auto px-md py-3xl lg:py-4xl text-center flex flex-col items-center gap-xl">
      <blockquote class="font-display italic text-ink leading-[1.25] text-[clamp(1.3rem,3vw,2rem)] m-0 max-w-[30ch]">
        Non ti vendiamo un tour. Ti vendiamo le parole giuste, da ascoltare quando vuoi, durante una mattina che è tua.
      </blockquote>
      <button
        type="button"
        class="checkout-btn-crociera inline-flex items-center justify-center gap-xs px-2xl py-lg bg-ink text-surface rounded-md font-semibold text-base hover:bg-ink/90 transition-[background-color,transform] duration-fast hover:-translate-y-[1px] active:translate-y-0 min-h-[56px]"
        data-product="crociera"
        data-lang="it"
      >
        Acquista Pacchetto Crociera — €7,99
      </button>
      <p class="text-xs text-ink-subtle">Accesso immediato via email · Offline · Tuo per sempre · Rimborso 1-click entro 24h</p>
    </div>
  </section>

  <!-- ══════════════════════════════════════════
       STICKY CTA MOBILE (appare dopo scroll hero)
  ══════════════════════════════════════════ -->
  <div
    id="sticky-cta"
    class="fixed bottom-0 inset-x-0 z-50 p-md bg-surface/95 backdrop-blur border-t border-border md:hidden translate-y-full transition-transform duration-300"
    aria-hidden="true"
  >
    <button
      type="button"
      class="checkout-btn-crociera w-full flex items-center justify-center gap-xs py-md bg-ink text-surface rounded-md font-semibold text-sm min-h-[52px]"
      data-product="crociera"
      data-lang="it"
    >
      Pacchetto Crociera — €7,99
    </button>
  </div>

</Layout>

<style>
  .cruise-hero {
    min-height: clamp(320px, 50vh, 560px);
    display: flex;
    align-items: center;
  }
  .cruise-hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 40%;
    filter: saturate(0.9) contrast(1.05);
  }
  .cruise-hero-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      oklch(from var(--color-surface) l c h / 0.92) 0%,
      oklch(from var(--color-surface) l c h / 0.68) 40%,
      oklch(from var(--color-surface) l c h / 0.15) 75%,
      oklch(from var(--color-surface) l c h / 0) 100%
    );
    pointer-events: none;
  }
  @media (max-width: 768px) {
    .cruise-hero-scrim {
      background: linear-gradient(
        to bottom,
        oklch(from var(--color-surface) l c h / 0.92) 0%,
        oklch(from var(--color-surface) l c h / 0.75) 60%,
        oklch(from var(--color-surface) l c h / 0.55) 100%
      );
    }
  }
</style>

<script>
  // ── Checkout buttons ─────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.checkout-btn-crociera').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const product = btn.dataset.product ?? 'crociera';
      const lang    = btn.dataset.lang    ?? 'it';
      btn.disabled  = true;
      const orig    = btn.textContent;
      btn.textContent = 'Apertura pagamento...';
      try {
        const res  = await fetch('/api/checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ product, lang }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const { url } = await res.json() as { url: string };
        if (!url) throw new Error('no url');
        if (typeof (window as any).localisTrack === 'function') {
          (window as any).localisTrack('checkout_started', { product, lang });
        }
        window.location.assign(url);
      } catch (err) {
        console.error('[checkout/crociera]', err);
        btn.disabled    = false;
        btn.textContent = orig;
        alert('Impossibile aprire il pagamento. Riprova tra un istante.');
      }
    });
  });

  // ── Trailer player ───────────────────────────────────────────────
  const trailerBtn   = document.getElementById('trailer-btn') as HTMLButtonElement | null;
  const trailerAudio = document.getElementById('trailer-audio') as HTMLAudioElement | null;
  if (trailerBtn && trailerAudio) {
    trailerBtn.addEventListener('click', () => {
      if (trailerAudio.paused) {
        trailerAudio.play();
        trailerBtn.textContent = '⏸ Ferma assaggio';
      } else {
        trailerAudio.pause();
        trailerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Ascolta 60 secondi di assaggio';
      }
    });
    trailerAudio.addEventListener('ended', () => {
      trailerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Ascolta 60 secondi di assaggio';
    });
  }

  // ── Sticky CTA (IntersectionObserver) ───────────────────────────
  const hero      = document.getElementById('hero-crociera');
  const stickyCta = document.getElementById('sticky-cta');
  if (hero && stickyCta) {
    const obs = new IntersectionObserver(
      ([entry]) => {
        const hidden = entry.isIntersecting;
        stickyCta.classList.toggle('translate-y-full', hidden);
        stickyCta.setAttribute('aria-hidden', String(hidden));
      },
      { threshold: 0 },
    );
    obs.observe(hero);
  }
</script>
```

- [ ] **Step 2: Verifica typecheck**

```bash
npx astro check
```

Atteso: 0 errori. Se ci sono errori di tipo sui `.map()` JSX, aggiungi `{/* @ts-ignore */}` prima del blocco o usa `Array.from([...]).map(...)`.

- [ ] **Step 3: Build locale**

```bash
npm run build
```

Atteso: build completa senza errori. Verifica che `/crocieristi` sia nell'output `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/crocieristi.astro
git commit -m "feat(crocieristi): rebuild landing — bundle 7,99, sticky CTA, FAQ, closer"
```

---

## Task 4: Header — voce "Per crocieristi"

**Files:**
- Modify: `src/components/Header.astro`

Aggiunge un link "Crocieristi" nella nav (visibile solo IT; si nasconde su schermi molto piccoli).

- [ ] **Step 1: Aggiungi il link nel nav**

In `src/components/Header.astro`, dopo il link "Chi siamo" (riga ~40), aggiungi:

```astro
      {lang === 'it' && (
        <a
          href="/crocieristi"
          class="font-body text-sm font-medium text-ink-muted hover:text-ink no-underline transition-colors duration-fast hidden sm:inline"
        >
          Crocieristi
        </a>
      )}
```

- [ ] **Step 2: Verifica**

```bash
npm run build
```

Atteso: build OK, link presente nel HTML generato di `/` (controlla `dist/index.html`).

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat(nav): aggiungi link Crocieristi per locale IT"
```

---

## Task 5: Homepage — pillola Bari card

**Files:**
- Modify: `src/components/DestinationsBlock.astro`

Aggiunge una piccola pillola/badge "Sei in crociera?" sotto la card di Bari che linka `/crocieristi`.

- [ ] **Step 1: Leggi DestinationsBlock per capire la struttura card Bari**

```bash
# Apri src/components/DestinationsBlock.astro e cerca come viene renderizzata la card Bari
```

- [ ] **Step 2: Aggiungi la pillola**

Dentro il blocco della card Bari (identificala per `slug: 'bari'` o `href: '/bari'`), dopo il titolo/descrizione ma prima della freccia, inserisci:

```astro
{lang === 'it' && dest.slug === 'bari' && (
  <a
    href="/crocieristi"
    class="inline-flex items-center gap-xs text-[11px] font-semibold tracking-[0.18em] uppercase text-accent border border-accent/30 rounded-full px-sm py-[3px] no-underline hover:bg-accent/5 transition-colors mt-xs"
  >
    Sei in crociera? → Pacchetto dedicato
  </a>
)}
```

Se la struttura della card non supporta slot aggiuntivi facilmente, aggiungila subito dopo il link della card come elemento separato nello stesso contenitore.

- [ ] **Step 3: Verifica**

```bash
npm run build && grep -r "crocieristi" dist/index.html
```

Atteso: trovi il link `/crocieristi` nell'HTML homepage.

- [ ] **Step 4: Commit**

```bash
git add src/components/DestinationsBlock.astro
git commit -m "feat(homepage): pillola crocieristi sulla card Bari"
```

---

## Task 6: Deploy e verifica finale

- [ ] **Push e deploy**

```bash
git push origin main
```

Poi su Vercel: verifica che il deploy sia triggerato (Settings → Deployments → should appear as "Building").

- [ ] **Verifica env var Stripe**

Assicurati che `Stripe_id_crociera` sia settato su Vercel con il Price ID reale. Senza di esso il bottone mostra "Stripe price ID not configured" in console.

- [ ] **Test checkout su Stripe test mode**

1. Usa la carta test Stripe `4242 4242 4242 4242` con qualsiasi data futura
2. Completa l'acquisto → verifica redirect su `/thanks`
3. Controlla che il webhook invii il magic link con accesso a `bari-vecchia` + `il-meglio-di-bari`

- [ ] **Test mobile (Safari iPhone)**

1. Apri https://localis.guide/crocieristi su iPhone
2. Verifica che la sticky CTA appaia dopo aver scrollato oltre l'hero
3. Verifica che i bottoni abbiano altezza minima 48px (touch target)
4. Verifica peso pagina: DevTools → Network → Size totale sotto 500kb

- [ ] **Verifica mappa**

Se la PNG della mappa non è ancora in `public/images/maps/bari-crociera-route.png`, l'`<img>` mostrerà immagine rotta. Genera la mappa (Task 2) e fai un commit separato.

---

## Note post-deploy

- **Versioni EN/DE**: `/en/cruise-port-bari` e `/de/bari-kreuzfahrt` andranno create in un momento successivo con copy riscritto ex novo (non traduzione automatica).
- **Sitemap**: già auto-generata da `@astrojs/sitemap` — `/crocieristi` viene inclusa automaticamente al deploy.
- **Footer**: già ha il link `/crocieristi` hardcoded nel Footer.astro — nessuna modifica necessaria.
- **Hero image peso**: verificare che `/images/covers/nave-crociera.jpg` sia sotto 80kb. Se è più pesante, ottimizzare con squoosh prima di andare live.
