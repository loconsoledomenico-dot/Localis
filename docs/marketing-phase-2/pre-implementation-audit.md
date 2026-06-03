# Pre-Implementation Audit — Fase 2 Marketing
**Data:** 3 giugno 2026  
**Stato:** Gate fix applicati. Pronto per Commit B.

---

## 1. Framework e routing

- **Framework:** Astro SSR con adapter Netlify
- **i18n:** directory-based, `prefixDefaultLocale: false`
  - IT: `/`, `/bari/`, `/guide/[slug]/`
  - EN: `/en/`, `/en/bari/`, `/en/guide/[slug]/`
  - DE: `/de/`, `/de/bari/`, `/de/guide/[slug]/`
- **Nessun route `?lang=`**: tutto su path puliti → nessun problema duplicazione indicizzabile
- **Prerendering:** `export const prerender = true` su zone e guide → build statico

---

## 2. Componenti chiave

| Componente | File | Utilizzo |
|---|---|---|
| Hero homepage | `src/components/Hero.astro` | H1, audio sample, quickAccess |
| HeroAudioSample | `src/components/HeroAudioSample.astro` | Player trailer inline hero |
| AuthorsBlock | `src/components/AuthorsBlock.astro` | Sezione 6 autori Bari con trasparenza |
| GuideCard | `src/components/GuideCard.astro` | Card liste guide |
| PriceCard | `src/components/PriceCard.astro` | Pack e prezzi con checkout |
| GuideSeoEditorial | `src/components/GuideSeoEditorial.astro` | Testo SEO lungo per guide singole |
| MobileStickyCTA | `src/components/MobileStickyCTA.astro` | CTA sticky mobile |
| Partner landing | `src/pages/p/[slug].astro` | Landing partner dinamica via MDX collection |

---

## 3. Data source guide

- **Formato:** MDX con frontmatter YAML in `src/content/guides/`
- **Schema definito** in `src/content.config.ts`
- **Single source of truth:** ogni campo (durata, audio, prezzi, narrator) è nel frontmatter MDX → nessuna duplicazione critica trovata
- **Prezzi:** campo `price_cents` (default 499 = €4,99) nei frontmatter
- **Pack / bundle:** definiti in `PriceCard.astro` con logica hardcoded IT/EN/DE

---

## 4. Inventario guide Bari — dati reali

| Slug | Titolo IT | Durata IT | Durata EN | Durata DE | Prezzo | Audio IT | Audio EN | Audio DE | Trailer IT | Trailer EN | Trailer DE |
|---|---|---:|---:|---:|---:|---|---|---|---|---|---|
| bari-vecchia | Bari Vecchia — Dentro la Città | 31m 46s | 31m | 32m 51s | €4,99 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| san-nicola | San Nicola — Il Santo Rubato | 30m 13s | 27m 56s | campo presente¹ | €4,99 | ✓ | ✓ | ① | ✓ | ✓ | ① |
| il-meglio-di-bari | Il Meglio di Bari — Mangia Prima di Capire | 29m 23s | 27m 30s | campo presente¹ | €4,99 | ✓ | ✓ | ① | ✓ | ✓ | ① |
| porto-bari | Porto di Bari — Dove è Successo Tutto | 33m 1s | 32m 6s | campo presente¹ | €4,99 | ✓ | ✓ | ① | ✓ | ✓ | ① |
| tre-teatri | I Tre Teatri — Fuoco, Musica e Borghesia | 28m 25s | 27m 38s | campo presente¹ | €4,99 | ✓ | ✓ | ① | ✓ | ✓ | ① |
| bari-sotterranea | Bari Sotterranea — Quello che sta sotto | 26m 5s | 25m 45s | campo presente¹ | €4,99 | ✓ | ✓ | ① | ✓ | ✓ | ① |

**① Nota DE:** 5 guide hanno il campo `audio_full_key_de` nel frontmatter ma **nessuna `duration_seconds_de`**. Questo indica che il campo è stato aggiunto come placeholder. L'audio DE potrebbe non essere prodotto o non essere verificato. Da confermare con Domenico prima di dichiarare DE disponibile per queste guide. Fino a conferma: usare formula "Lingue indicate in ogni racconto" senza dichiarare IT/EN/DE come universali.

**Pack Bari:** €19,99 (tutte 6 guide = risparmio €9,95 vs singole)  
**Pack Crociera:** €7,99 (bari-vecchia + il-meglio-di-bari)

---

## 5. Prezzi e pack esistenti

| Prodotto | Prezzo | Contenuto |
|---|---:|---|
| Singola | €4,99 | 1 guida a scelta |
| Tris | €11,99 | 3 guide a scelta da tutte le zone |
| Bari Completa | €19,99 | 6 guide Bari |
| Valle d'Itria Completa | €19,99 | 6 guide Valle |
| Gargano Completa | €19,99 | 6 guide Gargano |
| Crociera | €7,99 | bari-vecchia + il-meglio-di-bari |

---

## 6. Trasparenza voci — stato attuale

| Guida | Narrator | Tipo dichiarato | Stato |
|---|---|---|---|
| Bari Vecchia | Domenico Loconsole | Persona reale — `composite: false` | ✓ OK |
| Tre Teatri | Filippo Bellomo | Persona reale — `composite: false` | ⚠️ Bio mismatch² |
| San Nicola | Nonno Nicola | Persona reale — `composite: false` | ⚠️ Bio mismatch³ |
| Il Meglio di Bari | Rachele Grande | Persona reale — `composite: false` | ✓ OK |
| Porto di Bari | Luigi Loconsole | Persona reale — `composite: false` | ✓ OK |
| Bari Sotterranea | Rosa "la Perpetua" | Ritratto narrativo — `composite: true` | ✓ OK dichiarato |

**AuthorsBlock.astro:** già implementa "Cinque autori reali, una voce narrativa." (IT/EN/DE) con badge "Ritratto narrativo" / "Persona reale. Ritratto dell'autore." per ogni card.

**② Filippo:** AuthorsBlock dice "Quarant'anni alla Camera di Commercio di Bari" — MDX dice "Architetto, innamorato del liberty barese." Biografie divergenti. Da allineare in Commit E.

**③ Nonno Nicola:** AuthorsBlock dice "Ottantatré anni" — MDX dice "Ottant'anni". Età divergente. Da allineare in Commit E.

---

## 7. Analytics — stato attuale

- **Stack:** GA4 (`PUBLIC_GA4_ID`) + Plausible (no consent) + PostHog (opzionale, `PUBLIC_POSTHOG_KEY`)
- **Partner attribution:** funzionante via `?p=<partner_id>` → cookie `lg_partner` → localStorage → GA4 user_property
- **Evento checkout:** `checkout_started` in PriceCard.astro (product, guide, lang, partner_id)
- **UTM:** NON gestiti nativamente — il sistema usa `?p=` per partner attribution. I parametri UTM del QR (`utm_source=infopoint_bari&utm_medium=qr...`) non vengono attualmente letti né conservati fino all'acquisto
- **Mancano:** eventi `preview_start`, `preview_10s`, `preview_complete`, `landing_view`, `qr_landing_view`, `offline_save_*`, `partner_lead`

---

## 8. Incoerenze trovate

| ID | Tipo | File | Descrizione |
|---|---|---|---|
| G1 | ✅ RISOLTO | `GuideSeoEditorial.astro` | "oltre le trappole turistiche", "decodificare la realtà antropologica", "isolarvi dal caos turistico" → rimossi (IT/EN/DE) |
| G2 | ✅ RISOLTO | `crocieristi.astro:241` | "Torni in nave puntuale. Garantito." → "Un percorso pensato per lasciarti margine per il ritorno al porto." |
| G3 | ✅ RISOLTO | `Hero.astro:35` | "Offline dopo il primo play" → formula prudente IT/EN/DE |
| B1 | 🔶 Aperto | Frontmatter guide | DE audio non verificato per 5/6 guide Bari (no duration_seconds_de) |
| B2 | 🔶 Aperto | `AuthorsBlock.astro` | Bio Filippo: "Camera di Commercio" vs MDX "Architetto" |
| B3 | 🔶 Aperto | `AuthorsBlock.astro` | Bio Nonno Nicola: età 83 vs MDX 80 |
| B4 | 🔶 Commit B | `Analytics.astro` | UTM non conservati fino all'acquisto — da implementare |
| B5 | 🔶 Commit C | `src/pages/p/` | La landing partner esistente è generica; infopoint-bari richiede layout dedicato |
| B6 | 🔶 Commit C | `src/pages/en/p/`, `src/pages/de/p/` | Non esistono ancora — da creare per versioni EN/DE infopoint |

---

## 9. Route esistenti vs. route richieste

### IT
| Route | Stato |
|---|---|
| `/` | ✓ live |
| `/bari/` | ✓ live |
| `/guide/[slug]/` | ✓ live |
| `/guide/` | ✓ live |
| `/crocieristi/` | ✓ live |
| `/diventa-partner/` | ✓ live |
| `/faq/`, `/fonti/`, `/metodo/` | ✓ live |
| `/p/[slug]/` | ✓ live (partner dinamico) |
| `/p/infopoint-bari/` | ⚠️ richiede nuovo MDX o pagina dedicata |

### EN
| Route | Stato |
|---|---|
| `/en/`, `/en/bari/`, `/en/guide/[slug]/` | ✓ live |
| `/en/cruise/` | ✓ live |
| `/en/p/infopoint-bari/` | ❌ da creare |

### DE
| Route | Stato |
|---|---|
| `/de/`, `/de/bari/`, `/de/guide/[slug]/` | ✓ live |
| `/de/kreuzfahrt/` | ✓ live |
| `/de/p/infopoint-bari/` | ❌ da creare |

---

## 10. File previsti per commit

### Commit pre-Gate (applicato)
- `src/components/GuideSeoEditorial.astro`
- `src/components/Hero.astro`
- `src/pages/crocieristi.astro`

### Commit A
- `docs/marketing-phase-2/pre-implementation-audit.md` ← questo file

### Commit B — Analytics e QR attribution
- `src/components/Analytics.astro` — aggiungere lettura UTM, conservation fino a purchase
- `src/components/HeroAudioSample.astro` — eventi `preview_start`, `preview_10s`, `preview_complete`
- `src/components/TrailerPlayer.astro` (se esiste) — stessi eventi

### Commit C — Landing InfoPoint Bari
- `src/content/partners/infopoint-bari.mdx` — oppure pagina dedicata
- `src/pages/p/infopoint-bari.astro` — se layout dedicato
- `src/pages/en/p/infopoint-bari.astro`
- `src/pages/de/p/infopoint-bari.astro`

### Commit D — Homepage e pagina Bari
- `src/components/Hero.astro` — nuovo H1, subtitle, CTA
- `src/pages/bari.astro` — intro "cinque autori reali, un ritratto narrativo"
- `src/pages/en/bari.astro`
- `src/pages/de/bari.astro`
- `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/de/index.astro`

### Commit E — Template pagine prodotto Bari
- `src/pages/guide/[slug].astro` — struttura, info pratiche, copy
- `src/components/GuideSeoEditorial.astro` — già parzialmente fatto
- `src/content/guides/bari-vecchia.mdx` — (già aggiornato, verifica)
- Bio mismatch Filippo e Nonno Nicola: `src/components/AuthorsBlock.astro` + MDX

### Commit F — Crocieristi e Partner
- `src/pages/crocieristi.astro` — copy completo, H1, info pratiche, SEO
- `src/pages/en/cruise.astro`, `src/pages/de/kreuzfahrt.astro`
- `src/pages/diventa-partner.astro` — distinzione partner commerciali/informativi

### Commit G — SEO tecnica
- `src/components/Layout.astro` — title, meta, canonical, hreflang
- Pagine zone e guide prioritarie — structured data Product, BreadcrumbList, Organization
- `src/pages/robots.txt.ts`, sitemap config

---

## 11. Note tecniche per decisioni

**Landing infopoint-bari:** l'attuale `p/[slug].astro` mostra un hero generico con welcome copy partner. La landing InfoPoint richiede hero specifico (6 audio stories, player prominente, 6 card guide). Opzioni:
1. **Pagina dedicata** `src/pages/p/infopoint-bari.astro` (bypass [slug].astro) → più semplice, nessun rischio regressione partner
2. **Estendi** [slug].astro con `landing_type: 'infopoint'` nel MDX → più flessibile ma più complesso

**Raccomandazione:** pagina dedicata per infopoint, il sistema partner [slug].astro rimane invariato.

**UTM attribution:** aggiungere lettura `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` in `Analytics.astro` e conservarli in sessionStorage (stessa strategia del `lg_partner` già in uso). Passare come custom params agli eventi GA4. Non richiede modifiche alla cookie policy se già consentita per analytics.
