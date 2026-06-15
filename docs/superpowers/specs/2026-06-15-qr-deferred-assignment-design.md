# QR "stampa-prima, assegna-dopo" — Design

**Data:** 2026-06-15
**Stato:** approvato (brainstorming)
**Obiettivo:** eliminare il secondo viaggio dal partner. Presentarsi con QR già stampati e assegnarli a un partner in un secondo momento.

## Problema

Oggi il QR punta a `localis.guide/p/{slug}` dove `{slug}` **è** l'identità del partner, e `/p/[slug]` è prerenderizzata al build (solo i partner già esistenti hanno una pagina). Conseguenza: il QR si può stampare **solo dopo** aver creato il partner. Workflow attuale = due viaggi: 1) visita + convincimento, 2) seconda visita 1–2 settimane dopo con i QR stampati in tipografia.

Con una stampante professionale a casa, l'obiettivo è presentarsi con QR **già stampati** e legarli al partner dopo.

## Decisioni prese (brainstorming)

- **Momento di assegnazione:** "la sera, da casa" — modifica file + `git push` → rebuild Netlify. Niente login admin, niente store runtime, niente Netlify Blobs.
- **Architettura:** variante B — codice neutro + redirect. Il codice stampato è un gettone fisico neutro; il partner è un'entità separata; un registro li collega.
- **Card non assegnata:** landing generica "Benvenuto in Localis" con CTA verso `/guide` (no 404, no redirect alla home).

## Principio

Disaccoppiare l'**inventario fisico** (codice stampato) dall'**identità commerciale** (partner), legati da una foreign key nullable nel registro. La card è riutilizzabile: se un partner chiude, si ri-punta il codice a un altro.

## Componenti

### 1. Registro codici — `src/data/qr-codes.json`

File JSON unico (non una content collection: più semplice e testabile, coerente con `src/lib/partners.ts` che evita `astro:content` nei test).

```jsonc
[
  {
    "code": "A7X9K2",
    "partner_slug": "hotel-sole",
    "batch": "2026-06-lotto1",
    "printed_at": "2026-06-15",
    "assigned_at": "2026-06-16",
    "note": "lasciata in reception"
  },
  {
    "code": "M3R8TQ",
    "partner_slug": null,
    "batch": "2026-06-lotto1",
    "printed_at": "2026-06-15"
  }
]
```

Campi:
- `code` — 6 caratteri base32 senza ambigui (`O/0/I/1` esclusi). Univoco. Regex `^[A-HJ-NP-Z2-9]{6}$`.
- `partner_slug` — slug partner esistente, oppure `null` (= non assegnato).
- `batch` — etichetta lotto di stampa (opzionale).
- `printed_at` / `assigned_at` — date ISO (opzionali).
- `note` — annotazione libera (opzionale, es. dove è stata lasciata la card).

### 2. Route `/q/[code].astro` (prerendered, `noindex`)

- `export const prerender = true`.
- `getStaticPaths` sui codici del registro.
- Meta `robots: noindex` (i codici non devono finire su Google; la sitemap è una allowlist manuale, quindi `/q/` ne resta fuori da solo — il `noindex` è ridondanza difensiva).
- Logica di rendering:
  - **Codice assegnato a partner attivo** → redirect a `/p/{slug}`. Essendo pagina statica, il redirect è client-side: `<meta http-equiv="refresh" content="0; url=/p/{slug}">` + `<script>location.replace('/p/{slug}')</script>`, più set del cookie `lg_partner` lato client. Da `/p/{slug}` in poi vale **tutto il sistema esistente**: cookie, evento `qr_scan`, `partner_id` nei metadata Stripe, payout 25%. Nessuna logica di attribuzione nuova.
  - **Codice non assegnato, oppure partner in stato `paused`/`terminated`** → landing generica "Benvenuto in Localis" (Layout esistente) con CTA verso `/guide`. Emette `qr_scan` con sentinel `partner_id = "unassigned"` per visibilità GA4 (card viva ma scoperta).
  - **Codice non nel registro** → 404 (comportamento Astro di default; accettabile).

### 3. Helper — `src/lib/qr-codes.ts`

Funzione pura, testabile senza Astro:

```ts
type CodeStatus = 'assigned' | 'unassigned' | 'unknown';
export function resolveCode(code: string): { status: CodeStatus; partner_slug: string | null };
export function isValidCode(code: string): boolean;     // regex base32
export function generateCode(existing: Set<string>): string;  // anti-collisione
```

La route combina `resolveCode` con `getActivePartner` (esistente in `src/lib/partners.ts`) per gestire il caso "assegnato ma partner non più attivo" → fallback generico.

### 4. Generatore — `scripts/qr-batch.mjs`

`pnpm qr:batch --count 50 --batch giugno`

- Genera N codici unici (controllo collisioni contro il registro corrente).
- Li appende al registro come non assegnati (`partner_slug: null`, `printed_at` = oggi, `batch` = etichetta).
- Produce un **foglio HTML stampabile** in `private/qr-batches/{batch}.html`: griglia di QR (lib `qrcode` → SVG/dataURL) con il codice leggibile sotto ciascuno. Si stampa dal browser sulla stampante professionale. Niente lib PDF.
- URL codificato nel QR: `https://localis.guide/q/{code}`.

### 5. Assegnatore — `scripts/qr-assign.mjs`

`pnpm qr:assign A7X9K2 hotel-sole`

- Valida che il codice esista nel registro e che `partners/{slug}.mdx` esista.
- Scrive `partner_slug` + `assigned_at` (e `note` se passata) nel registro.
- Stampa promemoria: `git push` per attivare (rebuild ~2 min).
- Evita gli errori di edit a mano del JSON.

## Flusso completo

1. `pnpm qr:batch --count 50 --batch giugno` → 50 codici neutri + foglio QR → stampa a casa.
2. Visita partner: lascia la card `A7X9K2`, annota "A7X9K2 → Hotel Sole".
3. (Scan precoce di un ospite → landing generica, nessun 404.)
4. **La sera:** crea `src/content/partners/hotel-sole.mdx` (processo esistente, con `stripe_account_id`, `commission_rate`, ecc.) + `pnpm qr:assign A7X9K2 hotel-sole` → `git push` → ~2 min → live e attribuito.
5. Riassegnazione: se Hotel Sole chiude, `pnpm qr:assign A7X9K2 nuovo-partner` → push. Stessa card fisica.

## Casi limite

| Caso | Comportamento |
|------|---------------|
| Codice non nel registro | 404 |
| Più codici → stesso partner (più stanze) | Permesso (`partner_slug` non univoco) |
| Riassegnazione card | Cambia `partner_slug`, rebuild |
| Finestra ~2 min di rebuild | Coperta dalla landing generica |
| Partner assegnato ma `paused`/`terminated` | Fallback landing generica |
| Collisione in generazione | Rigenera fino a codice libero |

## File toccati

- `src/data/qr-codes.json` — nuovo (registro).
- `src/pages/q/[code].astro` — nuovo (route).
- `src/lib/qr-codes.ts` — nuovo (helper puro).
- `scripts/qr-batch.mjs` — nuovo (generatore + foglio stampa).
- `scripts/qr-assign.mjs` — nuovo (assegnatore).
- `tests/unit/qr-codes.test.ts` — nuovo (validazione regex, risoluzione assigned/unassigned/paused/unknown, anti-collisione).
- `package.json` — dep `qrcode`; script `qr:batch`, `qr:assign`.

**Non toccati:** flusso Stripe, attribuzione, payout, middleware. Il redirect riusa `/p/{slug}` esistente.

## Verifica

- `pnpm check` pulito.
- `pnpm test` verde (suite esistente + nuovi unit).
- `pnpm build` genera le route `/q/{code}` per ogni codice nel registro.
- Prova manuale: codice assegnato → redirect a `/p/{slug}` con cookie settato; codice non assegnato → landing generica.

## Fuori scope (YAGNI)

- Pagina admin / login: scartata con la scelta "la sera da casa".
- Netlify Blobs / store runtime: non serve, l'assegnazione passa dal rebuild.
- Auto-registrazione del partner: scartata (più attrito, meno controllo).
- Generazione PDF: foglio HTML stampabile sufficiente.
