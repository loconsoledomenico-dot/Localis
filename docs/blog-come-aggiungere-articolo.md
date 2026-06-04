# Blog Localis — Come aggiungere un articolo

## Struttura URL

```
localis.guide/blog/[slug-italiano]/          ← IT (default, nessun prefisso)
localis.guide/en/blog/[slug-inglese]/        ← EN
localis.guide/de/blog/[slug-tedesco]/        ← DE
localis.guide/blog/                          ← listing IT
localis.guide/en/blog/                       ← listing EN
localis.guide/de/blog/                       ← listing DE
```

## Struttura cartelle

```
src/
  content/
    blog/
      storia-bari-vecchia.mdx       ← articolo IT
      history-old-bari.mdx          ← articolo EN (stesso pezzo, lingua diversa)
      geschichte-bari-vecchia.mdx   ← articolo DE (opzionale)
  pages/
    blog/
      index.astro                   ← listing IT (non toccare)
      [slug].astro                  ← engine IT (non toccare)
    en/blog/
      index.astro                   ← listing EN
      [slug].astro                  ← engine EN
    de/blog/
      index.astro                   ← listing DE
      [slug].astro                  ← engine DE
  components/
    BlogCtaBox.astro                ← box CTA "Ascolta la guida"
```

## Come aggiungere un nuovo articolo (passo per passo)

### 1. Prepara l'immagine copertina

- Formato: **WebP** (obbligatorio)
- Dimensioni consigliate: **1200 × 630 px** (proporzione Open Graph)
- Dove metterla: `public/images/blog/[slug-articolo].webp`
- **MAI** codificare in base64 — sempre file separato

### 2. Crea il file IT

Copia `src/content/blog/storia-bari-vecchia.mdx`, rinomina, e compila:

```mdx
---
lang: it
slug: cosa-vedere-vieste           # ← URL: /blog/cosa-vedere-vieste/
slug_it: cosa-vedere-vieste
slug_en: what-to-see-vieste        # ← URL EN: /en/blog/what-to-see-vieste/
slug_de: sehenswuerdigkeiten-vieste  # ← URL DE (opzionale)

title: "Cosa vedere a Vieste: storia, mare e grotte"
description: "Guida storica a Vieste sul Gargano: la cattedrale normanna, il Castello Svevo, la spiaggia di Pizzomunno. Tutto quello che devi sapere prima di visitare."

cover: /images/blog/cosa-vedere-vieste.webp
cover_alt: "Vista panoramica di Vieste con il promontorio sul mare"
cover_width: 1200
cover_height: 630

published_at: 2026-06-01

guide_slug: gargano-vieste
guide_title: "Vieste — Tra Roccia e Mare"
guide_product: single
guide_price_label: "€4,99"

related:
  - gargano-tremiti-storia      # altri slug blog IT correlati (max 3)

zone_label: Gargano
zone_href: /gargano

status: published
---

Corpo dell'articolo in MDX...

## Titolo sezione

Testo...
```

### 3. Crea il file EN (opzionale ma consigliato)

Copia la struttura, rinomina slug, cambia `lang: en`, scrivi in inglese.
Il file può chiamarsi qualsiasi nome — il routing usa il campo `slug` nel frontmatter.

### 4. Verifica locale

```bash
pnpm dev
# Apri http://localhost:4321/blog/cosa-vedere-vieste/
# Verifica: title, meta description, immagine, CTA, hreflang nel <head>
```

### 5. Deploy

```bash
git add src/content/blog/ public/images/blog/
git commit -m "blog: aggiungi articolo cosa-vedere-vieste"
git push
```
Netlify fa il build automaticamente.

---

## Checklist per ogni articolo

- [ ] Slug IT unico, solo minuscole e trattini
- [ ] `title` tra 50–60 caratteri (misura con: [charcounter.com](https://charcounter.com))
- [ ] `description` tra 150–160 caratteri
- [ ] Immagine WebP in `public/images/blog/` (mai base64)
- [ ] `cover_width` e `cover_height` corretti (anti layout-shift)
- [ ] `guide_slug` e `guide_title` corrispondono a una guida esistente
- [ ] Articolo non spoilera il contenuto narrativo della guida audio
- [ ] `status: published` solo quando è pronto

---

## Sitemap e robots.txt

La sitemap è **generata automaticamente** da `@astrojs/sitemap` a ogni build.
Gli articoli blog compaiono nella sitemap non appena `status: published` e `prerender: true`
(già impostato in tutte le pagine blog).

Il `robots.txt` non richiede modifiche: `/blog/` non è nella lista dei percorsi esclusi.

---

## Guida collegata → checkout

Il `guide_slug` nel frontmatter determina quale guida appare nel box CTA.
`guide_product: single` → checkout per quella singola guida.
`guide_product: bari-completa` → checkout per il bundle Bari completa.
Il prezzo viene letto dal campo `guide_price_label` (stringa, es. `"€4,99"`).
