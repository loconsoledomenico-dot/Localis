# Localis · Hybrid Architecture Blueprint

**Data**: 2026-05-04
**Scopo**: blueprint architettonico per landing page e flusso pubblico di Localis Guide, costruito ibridando l'architettura informativa di app outdoor consolidate (Komoot, VoiceMap) con il sistema di marca editoriale già definito in [`.impeccable.md`](../../.impeccable.md).

> **Importante**: questo documento estrae **pattern strutturali e architettonici**, non copy né asset visivi. Tutto il testo italiano usato come esempio è scritto da zero per Localis. Palette/font Localis restano quelle di [`.impeccable.md`](../../.impeccable.md) — il blueprint NON sostituisce il sistema di marca esistente.

---

## 1. Fonti di riferimento

| Fonte | Cosa estraggo | Cosa NON uso |
|---|---|---|
| **Komoot** ([komoot.com](https://www.komoot.com/)) | Architettura sezioni, flusso CTA, pattern "feature alternati con mockup", social proof numerico, sezione "Collections" curate, footer link-cloud SEO | Plus Jakarta Sans (bannato), palette verde-sabbia, tono "adventure community", screenshot smartphone come elemento centrale dominante |
| **VoiceMap** ([voicemap.me](https://voicemap.me/)) | Messaging audio-guide ("GPS autoplay", "offline", "off-path alert"), partnership locale storyteller, "tour by city" pattern | Avenir, palette rosso-blu, voice copy generica turistica |
| **Field Mag** ([fieldmag.com](https://www.fieldmag.com/)) | Layout editoriale magazine (no card UI, type-driven hierarchy), hero left-aligned, eyebrow categorie | Cyan accent, font Pressura/Favorit |
| **`.impeccable.md` Localis** | TUTTO il sistema di marca: palette OKLCH, Spectral + Schibsted Grotesk, voce "intellettuale barese", principi 1-5 | — (è la fonte autoritativa) |

---

## 2. Architettura informativa — flusso landing `/`

Sequenza sezioni mutuata dall'IA Komoot (alternanza feature + mockup + CTA, poi curated collections, social proof, footer SEO), riadattata per:
- **Singola città** (Bari) invece di copertura globale
- **Audio-first** (capitoli, non rotte)
- **Browser-first** (no enfasi App Store; CTA principale = avvia ascolto via web/PWA)
- **Tono editoriale italiano** invece di SaaS-outdoor

### 2.1 Sezione `Hero`

**Pattern Komoot da estrarre**: hero con tagline + sub-claim + CTA primario + secondario, mockup mobile a destra.

**Adattamento Localis** (per [`.impeccable.md`](../../.impeccable.md) §Aesthetic Direction):
- Hero **left-aligned**, NON centrato. Asimmetria editoriale.
- Tagline display in **Spectral 300 italic** per la frase evocativa (es. *"Mentre sei lì."*) seguita da Spectral 500 regular per il claim funzionale.
- NESSUN mockup smartphone in primo piano (anti-pattern Komoot per Localis: troppo SaaS). Sostituito con:
  - Opzione A — **placeholder editoriale**: dettaglio fotografico Bari Vecchia in tono caldo, ritagliato a piena altezza colonna destra, no shadow, no rounded corners.
  - Opzione B — **player audio inline**: il bottone play è il primo elemento interattivo (rispetta principio 5 "Audio-first hierarchy").
- CTA primario: terracotta `oklch(56% 0.14 45)` su parchment. Testo: "Ascolta i 9 minuti del Borgo Antico" (specifico, non "Try free").
- CTA secondario: link blu Adriatico, sotto-linea sottile. Testo: "Vedi tutti i capitoli".

**Spec implementativa Hero**:
```
viewport mobile: 100vh max, padding 24px
desktop: griglia 12 colonne — testo cols 1-7, immagine/player cols 8-12
type scale: --text-5xl per claim hook, --text-base per sub
```

### 2.2 Sezione `Why this place` (mutuata da Komoot "Plan/Find/Navigate/Share")

Komoot alterna 4 feature block con mockup + CTA ripetuti. Per Localis: **2-3 sezioni narrative**, NON feature SaaS.

Ogni blocco:
- **Eyebrow** (Schibsted Grotesk 700 uppercase, letter-spacing 0.22em, terracotta): es. `01 — STORIE VERE`, `02 — CINQUE QUARTIERI`, `03 — NEI VICOLI`
- **Heading** (Spectral 400, `--text-3xl`): claim narrativo specifico
- **Body** (Schibsted 400, `--text-lg`, max 65ch): paragrafo lived-in — fatti specifici, nomi propri, dettagli sensoriali
- **Image**: foto editoriale full-bleed verticale OPPURE estratto cartografia stilizzata (NO screenshot UI dell'app)
- **Inline CTA**: link a capitolo specifico ("Ascolta l'incipit del Borgo Antico →")

**Differenza chiave vs Komoot**: nessuna ripetizione del CTA "Sign up + App Store" sotto ogni blocco. Anti-pattern per audience che resiste agli app install (`.impeccable.md` Users §Mental state).

### 2.3 Sezione `Itinerari curati` (mutuata da Komoot "Collections")

Komoot mostra 15 collections con cover + nome + autore + categoria attività.

**Adattamento Localis**:
- Griglia **3 colonne desktop / 1 mobile**, gap 32px (4pt scale x8)
- Card **senza bordo** né shadow (vedi banned `.impeccable.md`). Solo:
  - Foto 4:5 verticale, parchment underlay
  - Eyebrow durata: `9 MIN · BARI VECCHIA`
  - Titolo Spectral 500: nome itinerario (es. "Il Borgo Antico al tramonto")
  - Sub-meta Schibsted 400 small: numero capitoli + autore (es. "7 capitoli · narrato da Pietro Marino")
- Hover: leggera traslazione verticale (`translateY(-2px)`), no scale, no glow.
- **Numero itinerari**: 3-6 ora, scalabile. Komoot ne mostra 15 — eccessivo per il primo lancio.

### 2.4 Sezione `Come funziona` (mutuata da Komoot "Navigation features")

Komoot enfatizza: turn-by-turn voice, offline maps, off-path alerts.

**Adattamento Localis** (audio walking guide, non navigation):
1. **Apri al porto** — geo-trigger automatico al primo capitolo quando arrivi a Bari
2. **Cammina nei vicoli** — capitoli si avviano da soli quando ti avvicini al punto
3. **Funziona offline** — scarichi una volta, ascolti senza dati (importante: passeggeri crociera spesso senza roaming)
4. **Niente app, niente registrazione** — apri il link, premi play

Layout: 4 step orizzontali su desktop, lista verticale mobile. Numerazione `01 02 03 04` in Spectral 500 grande, contenuto Schibsted body.

### 2.5 Sezione `Social proof` (mutuata da Komoot "50M+ users")

Komoot: 50M utenti / 8M rotte / 850M foto. Stats grandi, no decorazione.

**Adattamento Localis**: il pattern numerico funziona, MA i numeri assoluti per un prodotto al lancio sono auto-sabotanti. Soluzioni:

**Opzione A — Stats qualitative**:
- `9 min · medio per capitolo`
- `5 quartieri · raccontati`
- `IT/EN · disponibili`

**Opzione B — Citazioni ospiti** (più adatta a fase early):
- 2-3 testimonianze brevi formattate come pull-quote editoriale Spectral italic, con attribuzione (nome + città di provenienza + mese)
- NO stelle, NO logo "as seen on", NO carosello.

**Opzione C — Endorsement curatoriali** (più potente per posizionamento):
- "Voci e firme" — cita brevemente i narratori (es. giornalista del Corriere del Mezzogiorno, scrittore barese, etc.) con foto B/N e bio 2-righe.

**Raccomandazione**: lancia con C, aggiungi B dopo prime recensioni reali, salta A (troppo defensive).

### 2.6 Sezione `Footer SEO link-cloud`

Komoot ha un footer SEO massivo: 100+ link a categorie/regioni/POI tipo. Strategia long-tail.

**Adattamento Localis**:
- Footer leggero per ora (singola città).
- Predisponi struttura per futura espansione: quando arriveranno altre città (Lecce, Matera, Polignano), il pattern Komoot diventa rilevante.
- Per ora: link a 5 quartieri Bari + lingua IT/EN + privacy/terms. Quando i contenuti SEO crescono (Fase 0-F), espandi a:
  - Quartieri: Bari Vecchia, Murat, Liberta, San Nicola, San Pasquale
  - Tipologie: passeggiata, sera, gastronomia, monumenti, mercato
  - Tour partner: cantine, ristoranti, hotel locali

---

## 3. Componenti UI — spec mappata sui token Localis

| Componente | Komoot fa così | Localis fa così (per `.impeccable.md`) |
|---|---|---|
| **Bottone primario** | Verde `#4F6814` su crema, radius 16px, no shadow | Terracotta `oklch(56% 0.14 45)` su parchment, radius 4px (più editoriale, meno toy), no shadow, padding 16/24px, Schibsted 600 |
| **Bottone secondario** | Sabbia `#E3D2B4`, stesso radius | Outline ink 1px su parchment, radius 4px, hover fill ink 8% opacity |
| **Card itinerario** | Cover image + bordo arrotondato | NO bordo, NO shadow. Foto + meta tipografica. Type fa il lavoro (principio 2). |
| **Eyebrow tag** | — | Schibsted 700 uppercase 0.22em, terracotta o ink 60% |
| **Player audio** | — | Custom: cerchio play 64px terracotta, tracker progress lineare ink 1px, time stamp Schibsted tabular-nums |
| **Header sticky** | Logo a sx, nav centro, CTA dx (verde) | Logo Spectral wordmark a sx, nav minima (3 voci max), CTA terracotta dx. Background `oklch(96% 0.012 75 / 92%)` con backdrop-blur lieve solo dopo scroll >40px |
| **Map embed** | Mapbox GL stile outdoor verde | Custom Mapbox stile editoriale: parchment base, sea-blue water, ink lines, NO labels colorate, etichette Schibsted |
| **Stats block** | Numeri grandi sans, no decorazione | Numeri Spectral 300 `--text-5xl`, label Schibsted uppercase eyebrow. Aliniati a sinistra, NON centrati |

---

## 4. Pattern interattivi mutuati

| Pattern Komoot | Adattamento Localis |
|---|---|
| **Header trasparente → solid on scroll** | OK, stesso pattern. Trigger 40px. Transition 200ms ease (NO bounce, vedi banned). |
| **Scroll-triggered fade-in** | OK ma sobrio: opacity 0→1 + translateY(8px→0), stagger 60ms. NO scale, NO blur. |
| **App store badge dual download** | NO. Localis è browser-first. Sostituisci con singolo CTA "Ascolta ora" che apre player web. PWA install prompt opzionale, dismissible. |
| **QR code per download app** | NO per ora. Opzionale: QR statico nei punti fisici di promozione (porto Bari, hotel partner) che linka direttamente al capitolo "Bari Vecchia · introduzione". |
| **Sticky bottom bar mobile** | OK ma: solo player controls quando un capitolo è in riproduzione. Mai CTA marketing intrusivo. |

---

## 5. Cosa NON copiare da Komoot (esplicito)

- ❌ Mockup smartphone come hero — troppo SaaS, contraddice principio 1 "Restraint over decoration"
- ❌ Verde muschio come accento — palette Localis è terracotta + Adriatico
- ❌ Plus Jakarta Sans / Nohemi — esplicitamente bannati
- ❌ Tono "adventure community" — Localis è intimo, non sociale
- ❌ App store CTA dominante — audience resiste agli install
- ❌ Footer SEO da 100+ link al lancio — premature optimization SEO
- ❌ Card con border-radius 16px — Localis usa max 4px, preferisce no-border
- ❌ Carosello cookie consent stile europeo invasivo — Plausible analytics, no banner

---

## 6. Cosa NON copiare da VoiceMap

- ❌ Rosso `#E22D3A` come primary — collide con terracotta Localis
- ❌ Avenir sans — banned (no Inter-clone)
- ❌ Layout marketplace "tour by tour by tour" — Localis è autoriale curato, non UGC

---

## 7. Lezioni da Field Mag (positive)

- ✅ Type-driven hierarchy (no card UI a fare il lavoro della tipografia)
- ✅ Eyebrow categorie uppercase
- ✅ Hero asimmetrico
- ✅ Layout editoriale magazine (multi-colonna desktop, single-column mobile)
- ❌ Cyan accent (palette sbagliata)
- ❌ Pressura body (font sbagliato)

---

## 8. Sequenza di build raccomandata

Fase 0-B (vedi [`plans/2026-04-28-localis-phase-0-B-public-site.md`](../superpowers/plans/2026-04-28-localis-phase-0-B-public-site.md)):

1. **Hero** (left-aligned, opzione A o B player)
2. **3 sezioni narrative** "Why this place"
3. **Itinerari curati** (3 cards iniziali)
4. **Come funziona** (4 step)
5. **Voci e firme** (endorsement curatoriali)
6. **Footer leggero** (5 quartieri + IT/EN + legal)

Iterazioni successive:
- Stats reali (dopo prime metriche)
- Footer SEO link-cloud (Fase 0-F)
- Espansione multi-città (oltre Bari)

---

## 9. Cross-reference

- [`.impeccable.md`](../../.impeccable.md) — sistema marca autoritativo (palette, font, principi)
- [`docs/superpowers/specs/2026-04-28-localis-restructure-design.md`](../superpowers/specs/2026-04-28-localis-restructure-design.md) — spec ristrutturazione
- [`docs/superpowers/plans/2026-04-28-localis-phase-0-B-public-site.md`](../superpowers/plans/2026-04-28-localis-phase-0-B-public-site.md) — piano sito pubblico
- [`src/components/Hero.astro`](../../src/components/Hero.astro) — hero attuale (oggetto di redesign)

---

## 10. Note di proprietà intellettuale

Questo blueprint estrae **pattern strutturali** (architettura informativa, sequenza sezioni, gerarchia componenti) e **dati di marca pubblici** (palette, font dichiarati nei file CSS) dalle fonti citate. Non riproduce copy, immagini, asset proprietari né design unici di Komoot/VoiceMap/Field Mag. Tutto il testo italiano in questo documento è scritto da zero per Localis. Il sistema di marca finale Localis è quello definito in `.impeccable.md` e differisce sostanzialmente dalle fonti per palette, tipografia, voce, e layout.
