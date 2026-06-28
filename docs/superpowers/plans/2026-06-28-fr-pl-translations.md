# Traduzioni FR/PL — Fase 1 (dati verificati) — Piano d'implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere francese e polacco alle 19 guide live come *dati* (script `.txt` + campi MDX), verificati da un audit, senza toccare routing/`Lang`/audio.

**Architecture:** I testi FR/PL vivono inline nei file esistenti (frontmatter MDX + `src/content/scripts/`), seguendo le convenzioni attuali. Lo schema guadagna campi `*_fr`/`*_pl` **opzionali** (build verde durante il riempimento incrementale). La completezza la impone uno script di audit (`pnpm i18n:audit`), non lo schema. Una `source-map.json` risolve il naming eterogeneo degli script (3 pattern) e fa da contratto tra traduzione e audit.

**Tech Stack:** Astro content collections (zod), Node `.mjs` scripts, `yaml`/`js-yaml`, vitest (`tests/unit/**/*.test.ts`).

**Riferimento spec:** `docs/superpowers/specs/2026-06-28-fr-pl-translations-design.md`

---

## Mappa file

- Create: `docs/i18n/source-map.json` — per guida, i file script IT canonici "online".
- Create: `docs/i18n/glossary-fr.md`, `docs/i18n/glossary-pl.md` — termini e nomi propri.
- Create: `docs/i18n/translation-procedure.md` — la ricetta per-guida (eseguita a mano da me).
- Create: `scripts/translation-audit.mjs` — verificatore + helper puri esportati.
- Create: `tests/unit/translation-audit.test.ts` — unit test degli helper puri.
- Modify: `src/content.config.ts` — campi `*_fr`/`*_pl` opzionali (collection `guides`).
- Modify: `package.json` — script `i18n:audit`.
- Create: `src/content/scripts/{...}-fr.txt`, `{...}-pl.txt` — output traduzioni (struttura = sorgente).
- Modify: `src/content/guides/{slug}.mdx` ×19 — campi `*_fr`/`*_pl` nel frontmatter.

---

## Task 1: Source-map degli script canonici

Lo script `.txt` non è 1:1 con le guide. Tre pattern osservati:
- `{slug}-it.txt` (singolo) → 13 guide: alberobello, cisternino, fasano, gargano-{nord,paesi,sacro,saline,tremiti,vieste}, locorotondo, martina-franca, matera, ostuni.
- `{slug}-guida-fast.txt` (IT senza suffisso) → bari-sotterranea, porto-bari, san-nicola, tre-teatri.
- a capitoli (`...-capN.txt`) → bari-vecchia (`bari-vecchia-domenico-cap1..8`), bari-tavola.

**Files:**
- Create: `docs/i18n/source-map.json`

- [ ] **Step 1: Elenca i candidati per le guide ambigue**

Run:
```bash
cd /c/Dev/Sites/LocalisGuide
for s in bari-sotterranea bari-tavola porto-bari san-nicola tre-teatri bari-vecchia; do
  echo "--- $s ---"; ls src/content/scripts/ | grep -iE "^$s" | grep -viE "\-(en|de)\.txt$"
done
```
Expected: i file IT (no `-en/-de`) per ciascuna. Annotare quali esistono.

- [ ] **Step 2: Per ogni guida con sorgente ambigua, conferma quale `.txt` è "online"**

Confronta la durata reale dell'audio online (frontmatter `duration_seconds` della guida) con la lunghezza del candidato. Se un solo candidato "full" esiste (es. `-guida-fast`), è quello. Se ce ne sono più di uno plausibile (es. `guida-fast` **e** una versione a capitoli), **NON indovinare**: aggiungi la guida a una lista `"needs_confirmation"` da chiarire con l'utente prima di tradurla.

- [ ] **Step 3: Scrivi `docs/i18n/source-map.json`**

```json
{
  "_doc": "Sorgente IT canonica per guida. L'audit deriva i nomi FR/PL: se il file finisce in '-it.txt' sostituisce -it→-fr/-pl, altrimenti appende -fr/-pl prima di .txt.",
  "guides": {
    "alberobello":      { "script": ["alberobello-it.txt"] },
    "cisternino":       { "script": ["cisternino-it.txt"] },
    "fasano":           { "script": ["fasano-it.txt"] },
    "gargano-nord":     { "script": ["gargano-nord-it.txt"] },
    "gargano-paesi":    { "script": ["gargano-paesi-it.txt"] },
    "gargano-sacro":    { "script": ["gargano-sacro-it.txt"] },
    "gargano-saline":   { "script": ["gargano-saline-it.txt"] },
    "gargano-tremiti":  { "script": ["gargano-tremiti-it.txt"] },
    "gargano-vieste":   { "script": ["gargano-vieste-it.txt"] },
    "locorotondo":      { "script": ["locorotondo-it.txt"] },
    "martina-franca":   { "script": ["martina-franca-it.txt"] },
    "matera":           { "script": ["matera-it.txt"] },
    "ostuni":           { "script": ["ostuni-it.txt"] },
    "bari-sotterranea": { "script": ["bari-sotterranea-guida-fast.txt"] },
    "porto-bari":       { "script": ["porto-bari-guida-fast.txt"] },
    "san-nicola":       { "script": ["san-nicola-guida-fast.txt"] },
    "tre-teatri":       { "script": ["tre-teatri-guida-fast.txt"] },
    "bari-vecchia":     { "script": ["bari-vecchia-domenico-cap1.txt","bari-vecchia-domenico-cap2.txt","bari-vecchia-domenico-cap3.txt","bari-vecchia-domenico-cap4.txt","bari-vecchia-domenico-cap5.txt","bari-vecchia-domenico-cap6.txt","bari-vecchia-domenico-cap7.txt","bari-vecchia-domenico-cap8.txt"] },
    "bari-tavola":      { "script": ["__CONFERMARE__"] }
  },
  "needs_confirmation": ["bari-tavola"]
}
```
(`bari-tavola` ha solo `-trailer` tra i file trovati: la sorgente full va confermata allo Step 2 prima di tradurla. Aggiorna `script` e togli da `needs_confirmation` quando risolta.)

- [ ] **Step 4: Verifica che ogni file sorgente elencato esista**

Run:
```bash
node -e '
const fs=require("fs"),m=require("./docs/i18n/source-map.json");
let bad=0;
for(const[g,v]of Object.entries(m.guides)){for(const f of v.script){
  if(f.includes("__")) {console.log("PENDING",g,f);continue;}
  if(!fs.existsSync("src/content/scripts/"+f)){console.log("MISSING",g,f);bad++;}
}}
console.log(bad?`${bad} mancanti`:"tutti i sorgenti presenti (escluse pending)");
'
```
Expected: nessun `MISSING` (a parte i `PENDING`).

- [ ] **Step 5: Commit**

```bash
git add docs/i18n/source-map.json
git commit -m "docs(i18n): source-map script canonici per traduzione FR/PL"
```

---

## Task 2: Glossari FR e PL

Coerenza terminologica su 19 guide. Si scrivono **prima** di tradurre.

**Files:**
- Create: `docs/i18n/glossary-fr.md`, `docs/i18n/glossary-pl.md`

- [ ] **Step 1: Scrivi `docs/i18n/glossary-fr.md`**

```markdown
# Glossario FR — LocalisGuide

Registro: **informale (tu)**. Tono colloquiale, "da bar", mai da targa di museo.

## Regola nomi propri
Toponimi e termini culturali restano in **italiano**, non si traducono:
Bari Vecchia, Sassi, Valle d'Itria, Gargano, Foresta Umbra, Pizzomunno, ecc.
Alla prima occorrenza si può aggiungere una breve glossa tra parentesi.

## Termini ricorrenti (IT → FR)
| IT | FR | Nota |
|----|----|----|
| trabucco / trabucchi | *trabucco / trabucchi* (in corsivo, invariato) | macchina da pesca; spiegare alla 1ª occorrenza |
| masseria | *masseria* | non "ferme"; glossa "ferme fortifiée" la 1ª volta |
| orecchiette | *orecchiette* | invariato |
| centro storico | vieille ville | |
| vicolo / vicoli | ruelle / ruelles | |
| borgo | village (bourg se medievale) | |
| lungomare | front de mer | |
| pizzica / taranta | *pizzica / taranta* | danza salentina; invariato |

## Frasi-firma del brand (resa concordata)
| IT | FR |
|----|----|
| Le guide spiegano. Noi raccontiamo. | Les guides expliquent. Nous, on raconte. |
| Capire un luogo, non attraversarlo. | Comprendre un lieu, pas seulement le traverser. |
```

- [ ] **Step 2: Scrivi `docs/i18n/glossary-pl.md`**

```markdown
# Glossario PL — LocalisGuide

Registro: **informale (ty)**. Ton potoczny, "przy barze", nigdy jak tabliczka w muzeum.
Attenzione a declinazione e ordine parole: il polacco flette i nomi propri stranieri solo
quando naturale; in dubbio lasciare il toponimo al nominativo italiano.

## Regola nomi propri
Toponimi e termini culturali restano in **italiano**: Bari Vecchia, Sassi, Valle d'Itria,
Gargano, Foresta Umbra, Pizzomunno. Glossa breve tra parentesi alla 1ª occorrenza.

## Termini ricorrenti (IT → PL)
| IT | PL | Nota |
|----|----|----|
| trabucco / trabucchi | *trabucco / trabucchi* (kursywa, bez zmian) | maszyna do połowu; wyjaśnić przy 1. użyciu |
| masseria | *masseria* | glossa "ufortyfikowane gospodarstwo" 1. raz |
| orecchiette | *orecchiette* | bez zmian |
| centro storico | stare miasto | |
| vicolo / vicoli | uliczka / uliczki | |
| borgo | miasteczko (gródek se medievale) | |
| lungomare | nadmorska promenada | |
| pizzica / taranta | *pizzica / taranta* | taniec z Salento; bez zmian |

## Frasi-firma del brand (resa concordata)
| IT | PL |
|----|----|
| Le guide spiegano. Noi raccontiamo. | Przewodniki tłumaczą. My opowiadamy. |
| Capire un luogo, non attraversarlo. | Zrozumieć miejsce, a nie tylko je przejść. |
```

- [ ] **Step 3: Commit**

```bash
git add docs/i18n/glossary-fr.md docs/i18n/glossary-pl.md
git commit -m "docs(i18n): glossari FR e PL (registro informale, nomi propri in IT)"
```

---

## Task 3: Schema — campi `*_fr`/`*_pl` opzionali

**Files:**
- Modify: `src/content.config.ts` (collection `guides`)

- [ ] **Step 1: Aggiungi i campi opzionali, ricalcando il pattern `_de`**

In `src/content.config.ts`, dentro lo schema `guides`, aggiungi accanto a ogni coppia `_en`/`_de`:

```ts
// titoli
title_fr: z.string().optional(),
title_pl: z.string().optional(),
// sottotitoli
subtitle_fr: z.string().optional(),
subtitle_pl: z.string().optional(),
// durate (per Fase 2 audio; opzionali ora)
duration_seconds_fr: z.number().int().nonnegative().optional(),
duration_seconds_pl: z.number().int().nonnegative().optional(),
// audio key (Fase 2)
audio_full_key_fr: z.string().optional(),
audio_full_key_pl: z.string().optional(),
```

Dentro `chapters[]`:
```ts
title_fr: z.string().optional(),
title_pl: z.string().optional(),
start_seconds_fr: z.number().int().nonnegative().optional(),
start_seconds_pl: z.number().int().nonnegative().optional(),
```

Dentro `narrator`:
```ts
bio_fr: z.string().optional(),
bio_pl: z.string().optional(),
```

Campi display opzionali (accanto agli `_de` esistenti):
```ts
route_mode_fr: z.string().optional(),
route_mode_pl: z.string().optional(),
accessibility_fr: z.string().optional(),
accessibility_pl: z.string().optional(),
needs_fr: z.string().optional(),
needs_pl: z.string().optional(),
use_case_intro_fr: z.string().optional(),
use_case_intro_pl: z.string().optional(),
```

Dentro `seo`:
```ts
description_fr: z.string().max(160).optional(),
description_pl: z.string().max(160).optional(),
```

- [ ] **Step 2: Verifica build verde (nessun contenuto FR/PL ancora)**

Run: `pnpm check`
Expected: `0 errors` (i campi sono opzionali, nessuna guida li ha ancora).

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat(i18n): campi schema FR/PL opzionali nella collection guides"
```

---

## Task 4: Audit script + unit test

L'audit è il "sistema di controllo finale". Esporta helper puri (testabili) e un runner.
Regola di completezza: **per ogni campo che ha `_it` non vuoto, esige `_fr` e `_pl` non vuoti.**

**Files:**
- Create: `scripts/translation-audit.mjs`
- Create: `tests/unit/translation-audit.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Scrivi il test degli helper puri (fallirà)**

`tests/unit/translation-audit.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { countBreaks, looksUntranslated, expectedScriptName } from '../../scripts/translation-audit.mjs';

describe('countBreaks', () => {
  it('conta i tag SSML <break>', () => {
    expect(countBreaks('a <break time="0.8s"/> b <break time="1.2s"/> c')).toBe(2);
    expect(countBreaks('nessuna pausa')).toBe(0);
  });
});

describe('looksUntranslated', () => {
  it('segnala stringa identica alla sorgente', () => {
    expect(looksUntranslated('Ciao mondo', 'Ciao mondo')).toBe(true);
  });
  it('non segnala una traduzione vera', () => {
    expect(looksUntranslated('Ciao mondo', 'Bonjour le monde')).toBe(false);
  });
  it('ignora stringhe troppo corte (nomi propri)', () => {
    expect(looksUntranslated('Bari', 'Bari')).toBe(false);
  });
});

describe('expectedScriptName', () => {
  it('sostituisce -it con -fr/-pl', () => {
    expect(expectedScriptName('gargano-nord-it.txt', 'fr')).toBe('gargano-nord-fr.txt');
  });
  it('appende il suffisso ai file senza -it', () => {
    expect(expectedScriptName('porto-bari-guida-fast.txt', 'pl')).toBe('porto-bari-guida-fast-pl.txt');
  });
});
```

- [ ] **Step 2: Esegui il test, verifica che fallisca**

Run: `pnpm test -- translation-audit`
Expected: FAIL — modulo `scripts/translation-audit.mjs` inesistente.

- [ ] **Step 3: Implementa `scripts/translation-audit.mjs`**

```js
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const GUIDES_DIR = path.join(ROOT, 'src/content/guides');
const SCRIPTS_DIR = path.join(ROOT, 'src/content/scripts');
const SOURCE_MAP = path.join(ROOT, 'docs/i18n/source-map.json');
const TARGET_LANGS = ['fr', 'pl'];
const BREAK_TOLERANCE = 2; // differenza ammessa nel conteggio <break>

// ── helper puri (testati) ───────────────────────────────────────────────
export function countBreaks(s) {
  return (String(s).match(/<break\b/g) || []).length;
}
export function looksUntranslated(src, candidate) {
  if (!candidate || candidate.trim().length < 8) return false;
  return src.trim() === candidate.trim();
}
export function expectedScriptName(srcName, lang) {
  if (srcName.endsWith('-it.txt')) return srcName.replace(/-it\.txt$/, `-${lang}.txt`);
  return srcName.replace(/\.txt$/, `-${lang}.txt`);
}

// ── frontmatter ─────────────────────────────────────────────────────────
function readFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter: ${file}`);
  return yaml.load(m[1]);
}

// campi scalari che, se hanno _it, richiedono _fr/_pl
const SCALAR_BASES = ['title', 'subtitle', 'route_mode', 'accessibility', 'needs', 'use_case_intro'];

function checkGuide(slug, data, sourceMap, problems) {
  const add = (msg) => problems.push(`[${slug}] ${msg}`);

  for (const lang of TARGET_LANGS) {
    // scalari top-level
    for (const base of SCALAR_BASES) {
      const it = data[`${base}_it`];
      if (it && !String(data[`${base}_${lang}`] || '').trim()) add(`manca ${base}_${lang}`);
      if (it && looksUntranslated(it, data[`${base}_${lang}`])) add(`${base}_${lang} = IT (non tradotto)`);
    }
    // seo.description
    const seoIt = data.seo?.description_it;
    const seoX = data.seo?.[`description_${lang}`];
    if (seoIt && !String(seoX || '').trim()) add(`manca seo.description_${lang}`);
    if (seoX && seoX.length > 160) add(`seo.description_${lang} > 160 (${seoX.length})`);
    // narrator.bio
    if (data.narrator?.bio_it) {
      if (!String(data.narrator[`bio_${lang}`] || '').trim()) add(`manca narrator.bio_${lang}`);
    }
    // capitoli
    (data.chapters || []).forEach((ch, i) => {
      if (ch.title_it && !String(ch[`title_${lang}`] || '').trim()) add(`manca chapters[${i}].title_${lang}`);
      if (ch.title_it && looksUntranslated(ch.title_it, ch[`title_${lang}`])) add(`chapters[${i}].title_${lang} = IT`);
    });
    // script files
    const entry = sourceMap.guides[slug];
    if (!entry) { add(`assente da source-map.json`); continue; }
    for (const src of entry.script) {
      if (src.includes('__')) { add(`source-map PENDING: ${src}`); continue; }
      const want = expectedScriptName(src, lang);
      const wantPath = path.join(SCRIPTS_DIR, want);
      if (!fs.existsSync(wantPath)) { add(`manca script ${want}`); continue; }
      const srcTxt = fs.readFileSync(path.join(SCRIPTS_DIR, src), 'utf8');
      const dstTxt = fs.readFileSync(wantPath, 'utf8');
      if (dstTxt.trim().length < srcTxt.trim().length * 0.4) add(`script ${want} troppo corto vs IT`);
      if (Math.abs(countBreaks(srcTxt) - countBreaks(dstTxt)) > BREAK_TOLERANCE)
        add(`script ${want}: <break> ${countBreaks(dstTxt)} vs IT ${countBreaks(srcTxt)}`);
    }
  }
}

export function runAudit() {
  const sourceMap = JSON.parse(fs.readFileSync(SOURCE_MAP, 'utf8'));
  const problems = [];
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx'));
  for (const f of files) {
    const data = readFrontmatter(path.join(GUIDES_DIR, f));
    checkGuide(data.slug || f.replace(/\.mdx$/, ''), data, sourceMap, problems);
  }
  const total = files.length;
  const okGuides = total - new Set(problems.map((p) => p.match(/^\[(.+?)\]/)[1])).size;
  console.log(`Guide pulite: ${okGuides}/${total}`);
  if (problems.length) {
    console.log(`\n${problems.length} problemi:`);
    for (const p of problems) console.log('  - ' + p);
    process.exitCode = 1;
  } else {
    console.log('Audit FR/PL verde ✅');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) runAudit();
```

- [ ] **Step 4: Esegui il test, verifica che passi**

Run: `pnpm test -- translation-audit`
Expected: PASS (3 describe verdi).

- [ ] **Step 5: Aggiungi lo script npm e prova la baseline (rossa attesa)**

In `package.json`, dopo `"ga4:audio": ...`, aggiungi:
```json
"i18n:audit": "node scripts/translation-audit.mjs",
```
Run: `pnpm i18n:audit`
Expected: exit 1, elenca i buchi (nessuna guida ha ancora FR/PL) → baseline rossa corretta.

- [ ] **Step 6: Commit**

```bash
git add scripts/translation-audit.mjs tests/unit/translation-audit.test.ts package.json
git commit -m "feat(i18n): audit traduzioni FR/PL (pnpm i18n:audit) + unit test"
```

---

## Task 5: Procedura di traduzione per-guida (documento)

**Files:**
- Create: `docs/i18n/translation-procedure.md`

- [ ] **Step 1: Scrivi la procedura**

```markdown
# Procedura traduzione guida (FR + PL) — Fase 1

Per ogni guida, **una lingua alla volta**, prima FR poi PL:

1. **Leggi la sorgente**: gli script IT da `source-map.json` + il frontmatter MDX IT.
   Incrocia con EN/DE dove aiutano la sfumatura. Tieni aperti i glossari.
2. **Giro 1 — traduci**:
   - Script: crea `{nome}-{fr|pl}.txt` rispecchiando 1:1 la struttura della sorgente
     (stesso numero di file se a capitoli). **Preserva ogni `<break .../>` nella stessa posizione**;
     traduci solo il parlato. Registro informale (tu/ty).
   - Campi MDX: compila `title_{lang}`, `subtitle_{lang}`, ogni `chapters[].title_{lang}`,
     `seo.description_{lang}` (≤160), `narrator.bio_{lang}`, e i display field (`route_mode_…`,
     ecc.) **solo dove esiste l'`_it`**.
3. **Giro 2 — rileggi** la traduzione contro la sorgente: fedeltà, niente omissioni,
   nomi propri in italiano (glossario), tono colloquiale, SEO entro 160.
4. **Verifica**: `pnpm i18n:audit` deve calare i problemi di questa guida a 0; `pnpm check` verde.
5. **Commit** della singola guida (entrambe le lingue insieme):
   `git add` dei `.txt` nuovi + il `.mdx` modificato →
   `git commit -m "content(i18n): traduzione FR/PL <slug>"`.

**Regole assolute:** mai inventare contenuto non presente nella sorgente; mai lasciare
righe in IT/EN; mai concatenare/buttare i capitoli; un commit per guida.
```

- [ ] **Step 2: Commit**

```bash
git add docs/i18n/translation-procedure.md
git commit -m "docs(i18n): procedura di traduzione per-guida FR/PL"
```

---

## Task 6: Traduzione a lotti (gate audit per guida)

Esegui la procedura del Task 5 per ogni guida, **per zona**, committando per guida.
Dopo ogni guida: `pnpm i18n:audit` (i problemi di quella guida → 0) e `pnpm check` verde.

- [ ] **Lotto A — Gargano (6):** gargano-nord, gargano-vieste, gargano-tremiti, gargano-sacro, gargano-paesi, gargano-saline
- [ ] **Lotto B — Bari (6):** porto-bari, bari-vecchia, san-nicola, tre-teatri, bari-sotterranea, bari-tavola
  *(bari-tavola solo dopo aver risolto `needs_confirmation` nel Task 1)*
- [ ] **Lotto C — Valle d'Itria (6):** alberobello, locorotondo, martina-franca, cisternino, fasano, ostuni
- [ ] **Lotto D — Matera (1):** matera

---

## Task 7: Chiusura Fase 1

- [ ] **Step 1: Audit completo verde**

Run: `pnpm i18n:audit`
Expected: `Guide pulite: 19/19`, `Audit FR/PL verde ✅`, exit 0.

- [ ] **Step 2: Build verde**

Run: `pnpm check`
Expected: `0 errors`.

- [ ] **Step 3: Riepilogo all'utente** — conferma 19×{fr,pl} complete, audit verde, niente route/Lang/audio toccati. Fase 2 (messa in onda + audio) parte da spec separato.

---

## Self-review (coverage vs spec)

- Scope "testi guide completi" → Task 3 (schema), Task 6 (campi+script). ✓
- "sistemali in cartelle appropriate" → convenzioni esistenti (`scripts/`, frontmatter), Task 1 source-map. ✓
- "completa in autonomia, guida per guida, doppio giro" → Task 5 procedura (giro 1+2), Task 6. ✓
- "sistemi di controllo finale" → Task 4 audit + test, gate in Task 6, Task 7. ✓
- Registro informale tu/ty → glossari Task 2, procedura Task 5. ✓
- Sorgente = online, no varianti → Task 1 source-map + `needs_confirmation`. ✓
- Fuori scope (route/Lang/audio/fonti) → non toccati in nessun task. ✓
- Rischio "opzionale maschera buchi" → audit Task 4 impone presenza, non lo schema. ✓
```
