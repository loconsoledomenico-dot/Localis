# QR "stampa-prima, assegna-dopo" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stampare QR neutri in anticipo e legarli a un partner in un secondo momento, senza tipografia e senza secondo viaggio.

**Architecture:** Il codice stampato (`/q/{code}`) è un gettone neutro; un registro JSON `code → partner_slug` viene riempito la sera e pubblicato via `git push` (rebuild Netlify). Codice assegnato → redirect a `/p/{slug}` (riusa tutta l'attribuzione esistente: cookie `lg_partner`, `qr_scan`, metadata Stripe, payout 25%). Codice non assegnato → landing generica "Benvenuto in Localis".

**Tech Stack:** Astro 6 (prerender + getStaticPaths), TypeScript, Vitest, script Node `.mjs`, libreria `qrcode` per generare i QR. pnpm.

**Spec:** `docs/superpowers/specs/2026-06-15-qr-deferred-assignment-design.md`

**Note ambiente:** lavorare dal path pulito `C:\Dev\Sites\LocalisGuide` (junction). Verifica = `pnpm check`, `pnpm test`, `pnpm build`.

---

### Task 1: Registro + helper di risoluzione (TDD)

**Files:**
- Create: `src/data/qr-codes.json`
- Create: `src/lib/qr-codes.ts`
- Test: `tests/unit/qr-codes.test.ts`

- [ ] **Step 1: Crea il registro seed**

`src/data/qr-codes.json`:

```json
[
  { "code": "K7M2X9", "partner_slug": null, "batch": "esempio", "printed_at": "2026-06-15" }
]
```

- [ ] **Step 2: Scrivi il test che fallisce**

`tests/unit/qr-codes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isValidCode, resolveCode, type QrCode } from '../../src/lib/qr-codes';

const fixture: QrCode[] = [
  { code: 'A7X9K2', partner_slug: 'hotel-sole' },
  { code: 'M3R8TQ', partner_slug: null },
];

describe('qr-codes', () => {
  describe('isValidCode', () => {
    it('accetta 6 caratteri base32 senza ambigui', () => {
      expect(isValidCode('A7X9K2')).toBe(true);
      expect(isValidCode('M3R8TQ')).toBe(true);
    });
    it('rifiuta i caratteri ambigui I O 0 1', () => {
      expect(isValidCode('AIO012')).toBe(false);
      expect(isValidCode('ABCDE0')).toBe(false);
    });
    it('rifiuta lunghezza errata, minuscole, simboli', () => {
      expect(isValidCode('A7X9K')).toBe(false);
      expect(isValidCode('a7x9k2')).toBe(false);
      expect(isValidCode('A7X9K2X')).toBe(false);
      expect(isValidCode('A7-9K2')).toBe(false);
    });
  });

  describe('resolveCode', () => {
    it('assigned per un codice mappato', () => {
      expect(resolveCode('A7X9K2', fixture)).toEqual({ status: 'assigned', partner_slug: 'hotel-sole' });
    });
    it('unassigned per partner_slug null', () => {
      expect(resolveCode('M3R8TQ', fixture)).toEqual({ status: 'unassigned', partner_slug: null });
    });
    it('unknown per un codice fuori registro', () => {
      expect(resolveCode('ZZZ999', fixture)).toEqual({ status: 'unknown', partner_slug: null });
    });
  });
});
```

- [ ] **Step 3: Esegui il test, verifica che fallisca**

Run: `pnpm test qr-codes`
Expected: FAIL — `Failed to resolve import '../../src/lib/qr-codes'`.

- [ ] **Step 4: Scrivi l'implementazione minima**

`src/lib/qr-codes.ts`:

```ts
import registryData from '../data/qr-codes.json';

export interface QrCode {
  code: string;
  partner_slug: string | null;
  batch?: string;
  printed_at?: string;
  assigned_at?: string;
  note?: string;
}

export type CodeStatus = 'assigned' | 'unassigned' | 'unknown';

const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function isValidCode(code: string): boolean {
  return typeof code === 'string' && CODE_PATTERN.test(code);
}

export function getAllCodes(registry: QrCode[] = registryData as QrCode[]): QrCode[] {
  return registry;
}

export function resolveCode(
  code: string,
  registry: QrCode[] = registryData as QrCode[],
): { status: CodeStatus; partner_slug: string | null } {
  const entry = registry.find((c) => c.code === code);
  if (!entry) return { status: 'unknown', partner_slug: null };
  if (entry.partner_slug) return { status: 'assigned', partner_slug: entry.partner_slug };
  return { status: 'unassigned', partner_slug: null };
}
```

- [ ] **Step 5: Esegui il test, verifica che passi**

Run: `pnpm test qr-codes`
Expected: PASS (9 test verdi).

- [ ] **Step 6: Typecheck**

Run: `pnpm check`
Expected: 0 errori.

- [ ] **Step 7: Commit**

```bash
git add src/data/qr-codes.json src/lib/qr-codes.ts tests/unit/qr-codes.test.ts
git commit -m "feat(qr): registro codici + helper resolveCode/isValidCode"
```

---

### Task 2: Route `/q/[code].astro` (redirect o landing generica)

**Files:**
- Create: `src/pages/q/[code].astro`

- [ ] **Step 1: Crea la route**

`src/pages/q/[code].astro`:

```astro
---
export const prerender = true;
import Layout from '../../components/Layout.astro';
import Eyebrow from '../../components/Eyebrow.astro';
import { getAllCodes, resolveCode } from '../../lib/qr-codes';
import { getActivePartner } from '../../lib/partners';

export async function getStaticPaths() {
  const codes = getAllCodes();
  const paths = [];
  for (const entry of codes) {
    const resolved = resolveCode(entry.code);
    let redirectTo: string | null = null;
    if (resolved.status === 'assigned' && resolved.partner_slug) {
      const partner = await getActivePartner(resolved.partner_slug);
      if (partner) redirectTo = `/p/${resolved.partner_slug}`;
    }
    paths.push({ params: { code: entry.code }, props: { redirectTo } });
  }
  return paths;
}

const { redirectTo } = Astro.props as { redirectTo: string | null };
---
{redirectTo ? (
  <html lang="it">
    <head>
      <meta charset="utf-8" />
      <meta name="robots" content="noindex" />
      <meta http-equiv="refresh" content={`0; url=${redirectTo}`} />
      <link rel="canonical" href={redirectTo} />
      <script is:inline define:vars={{ redirectTo }}>location.replace(redirectTo);</script>
    </head>
    <body>
      <p>Reindirizzamento… <a href={redirectTo}>continua qui</a>.</p>
    </body>
  </html>
) : (
  <Layout
    title="Benvenuto in Localis"
    description="Le audioguide narrative della Puglia."
    lang="it"
    robots="noindex"
  >
    <section class="max-w-wrap mx-auto px-md py-2xl text-center">
      <Eyebrow class="justify-center mb-md">Benvenuto in Localis</Eyebrow>
      <h1 class="font-display text-4xl text-ink leading-tight mb-md max-w-prose mx-auto">
        Le audioguide della Puglia, raccontate da chi ci vive.
      </h1>
      <p class="text-lg text-ink-muted max-w-prose mx-auto mb-lg">
        Scegli una guida e ascolta la storia dei luoghi mentre ci sei.
      </p>
      <a
        href="/guide"
        class="inline-block rounded-pill bg-accent text-white px-lg py-sm font-medium"
      >
        Scopri le guide →
      </a>
    </section>
  </Layout>
)}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm check`
Expected: 0 errori.

- [ ] **Step 3: Build, verifica che la route venga generata**

Run: `pnpm build`
Expected: build OK; tra i file generati compare `dist/q/K7M2X9/index.html` (il codice seed non assegnato → contiene "Benvenuto in Localis").

- [ ] **Step 4: Commit**

```bash
git add src/pages/q/[code].astro
git commit -m "feat(qr): route /q/[code] redirect a partner o landing generica"
```

---

### Task 3: Generatore lotti `qr:batch` (+ foglio QR stampabile)

**Files:**
- Modify: `package.json` (dep `qrcode` + script `qr:batch`)
- Create: `scripts/qr-batch.mjs`

- [ ] **Step 1: Aggiungi la dipendenza `qrcode`**

Run: `pnpm add -D qrcode`
Expected: `qrcode` compare in `devDependencies`.

- [ ] **Step 2: Aggiungi lo script npm**

In `package.json`, dentro `"scripts"`, aggiungi dopo `"sheet:sync"`:

```json
    "qr:batch": "node scripts/qr-batch.mjs",
```

- [ ] **Step 3: Crea il generatore**

`scripts/qr-batch.mjs`:

```js
import fs from 'node:fs/promises';
import QRCode from 'qrcode';

const registryPath = new URL('../src/data/qr-codes.json', import.meta.url);
const outDir = new URL('../private/qr-batches/', import.meta.url);
const BASE_URL = process.env.LOCALIS_BASE_URL || 'https://localis.guide';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // niente I O 0 1

function parseArgs(argv) {
  const args = { count: 20, batch: 'lotto' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--count') args.count = parseInt(argv[i + 1], 10);
    else if (argv[i] === '--batch') args.batch = argv[i + 1];
  }
  if (!Number.isInteger(args.count) || args.count < 1 || args.count > 500) {
    throw new Error('--count deve essere un intero tra 1 e 500');
  }
  if (!args.batch) throw new Error('--batch obbligatorio (etichetta del lotto)');
  return args;
}

function randomCode() {
  let s = '';
  for (let i = 0; i < 6; i += 1) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function generateCodes(count, existing) {
  const seen = new Set(existing);
  const out = [];
  while (out.length < count) {
    const code = randomCode();
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

async function loadRegistry() {
  try {
    return JSON.parse(await fs.readFile(registryPath, 'utf8'));
  } catch {
    return [];
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function buildSheet(codes, batch) {
  const cells = [];
  for (const code of codes) {
    const svg = await QRCode.toString(`${BASE_URL}/q/${code}`, { type: 'svg', margin: 1 });
    cells.push(`<figure class="cell"><div class="qr">${svg}</div><figcaption>${code}</figcaption></figure>`);
  }
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>Localis QR - ${batch}</title>
<style>
  @page { margin: 12mm; }
  body { font-family: system-ui, sans-serif; }
  h1 { font-size: 13pt; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18mm 10mm; }
  .cell { text-align: center; break-inside: avoid; }
  .qr svg { width: 48mm; height: 48mm; }
  figcaption { font-size: 11pt; letter-spacing: 2px; font-weight: 600; margin-top: 4mm; }
</style></head><body>
<h1>Localis - lotto ${batch} - ${codes.length} codici - ${today()}</h1>
<div class="grid">${cells.join('')}</div>
</body></html>`;
}

async function main() {
  const { count, batch } = parseArgs(process.argv.slice(2));
  const registry = await loadRegistry();
  const codes = generateCodes(count, registry.map((c) => c.code));
  const printedAt = today();
  for (const code of codes) registry.push({ code, partner_slug: null, batch, printed_at: printedAt });
  await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  await fs.mkdir(outDir, { recursive: true });
  const sheetPath = new URL(`${batch}-${printedAt}.html`, outDir);
  await fs.writeFile(sheetPath, await buildSheet(codes, batch));

  console.log(`${count} codici aggiunti al registro (batch "${batch}").`);
  console.log(`Foglio stampa: ${decodeURIComponent(sheetPath.pathname)}`);
  console.log('Ricorda: git push per pubblicare le nuove route /q/{code}.');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
```

- [ ] **Step 4: Prova il generatore**

Run: `pnpm qr:batch --count 3 --batch test`
Expected: stampa "3 codici aggiunti..."; `src/data/qr-codes.json` ora ha 4 voci (1 seed + 3 nuove); esiste `private/qr-batches/test-<oggi>.html` con 3 QR.

- [ ] **Step 5: Ripristina il registro (rimuovi i 3 codici di prova)**

Riporta `src/data/qr-codes.json` al solo codice seed `K7M2X9` (i codici `test` non vanno committati). Cancella `private/qr-batches/test-<oggi>.html`.

Run: `git checkout src/data/qr-codes.json`
Expected: il file torna a 1 voce.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/qr-batch.mjs
git commit -m "feat(qr): script qr:batch genera lotti di codici + foglio QR stampabile"
```

---

### Task 4: Assegnatore `qr:assign`

**Files:**
- Modify: `package.json` (script `qr:assign`)
- Create: `scripts/qr-assign.mjs`

- [ ] **Step 1: Aggiungi lo script npm**

In `package.json`, dentro `"scripts"`, dopo `"qr:batch"`:

```json
    "qr:assign": "node scripts/qr-assign.mjs",
```

- [ ] **Step 2: Crea l'assegnatore**

`scripts/qr-assign.mjs`:

```js
import fs from 'node:fs/promises';

const registryPath = new URL('../src/data/qr-codes.json', import.meta.url);
const partnerDir = new URL('../src/content/partners/', import.meta.url);

async function partnerExists(slug) {
  for (const ext of ['mdx', 'md']) {
    try {
      await fs.access(new URL(`${slug}.${ext}`, partnerDir));
      return true;
    } catch {
      // prova l'estensione successiva
    }
  }
  return false;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const [code, slug, ...rest] = process.argv.slice(2);
  const note = rest.join(' ').trim();
  if (!code || !slug) {
    throw new Error('Uso: node scripts/qr-assign.mjs <CODICE> <partner-slug> [nota]');
  }

  const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
  const entry = registry.find((c) => c.code === code);
  if (!entry) {
    throw new Error(`Codice ${code} non presente nel registro. Genera prima un lotto con: pnpm qr:batch`);
  }
  if (!(await partnerExists(slug))) {
    throw new Error(`Partner "${slug}" non trovato: crea prima src/content/partners/${slug}.mdx`);
  }

  const previous = entry.partner_slug;
  entry.partner_slug = slug;
  entry.assigned_at = today();
  if (note) entry.note = note;
  await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  console.log(previous && previous !== slug
    ? `Codice ${code}: riassegnato da "${previous}" a "${slug}".`
    : `Codice ${code} -> "${slug}".`);
  console.log('git push per attivare (rebuild Netlify ~2 min).');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
```

- [ ] **Step 3: Prova errore — partner inesistente**

Run: `pnpm qr:assign K7M2X9 partner-che-non-esiste`
Expected: errore "Partner ... non trovato"; `qr-codes.json` invariato.

- [ ] **Step 4: Prova assegnazione reale (partner esistente)**

Run: `pnpm qr:assign K7M2X9 example-hotel`
Expected: stampa `Codice K7M2X9 -> "example-hotel".`; in `qr-codes.json` il codice seed ora ha `"partner_slug": "example-hotel"` e `assigned_at`.

- [ ] **Step 5: Verifica il redirect a build**

Run: `pnpm build`
Expected: `dist/q/K7M2X9/index.html` ora contiene `url=/p/example-hotel` (meta refresh) invece della landing generica.
(Se `example-hotel` ha `status` diverso da `active`, la pagina resta generica: in tal caso ripeti con uno slug partner attivo a scelta. Il comportamento è corretto in entrambi i casi.)

- [ ] **Step 6: Ripristina il registro seed**

Run: `git checkout src/data/qr-codes.json`
Expected: il codice seed torna `partner_slug: null`.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/qr-assign.mjs
git commit -m "feat(qr): script qr:assign lega un codice a un partner esistente"
```

---

### Task 5: Verifica finale

- [ ] **Step 1: Suite completa**

Run: `pnpm test`
Expected: tutti i test verdi (baseline 111 + i nuovi 9).

- [ ] **Step 2: Typecheck + build**

Run: `pnpm check && pnpm build`
Expected: 0 errori typecheck; build OK con `dist/q/K7M2X9/` generata.

- [ ] **Step 3: Riepilogo evidenza**

Dichiarare esplicitamente cosa è stato verificato, es.: "pnpm check pulito · pnpm test 120/120 verdi · build OK · route /q/{code} generata · redirect e landing generica entrambi esercitati".

- [ ] **Step 4: (Opzionale) push**

Il push su `main` triggera il deploy Netlify. Eseguire solo su richiesta esplicita dell'utente (regola progetto: push solo quando richiesto).

---

## Self-review (esito)

- **Copertura spec:** registro (T1) · route redirect+generica (T2) · generatore+foglio stampa (T3) · assegnatore+riassegnazione (T4) · verifica (T5). Tutti i componenti della spec hanno un task.
- **Deviazione consapevole dalla spec:** la spec menzionava un evento `qr_scan` con sentinel `unassigned` sulla landing generica. Semplificato (YAGNI): la visibilità sugli scan di card non assegnate arriva dai pageview GA4 sui path `/q/{code}` (la landing generica usa Layout → pageview standard). Nessun codice analytics custom. Se in futuro serve l'evento dedicato, si aggiunge un singolo `window.localisTrack('qr_scan', {...})` inline.
- **Coerenza tipi:** `QrCode`, `resolveCode`, `getAllCodes`, `isValidCode` usati con le stesse firme in T1→T2; lo schema del registro JSON (`code`, `partner_slug`, `batch`, `printed_at`, `assigned_at`, `note`) è identico tra registro, generatore e assegnatore.
- **Nessun placeholder.**
