# Francese e Polacco — Fase 1: traduzioni come dati verificati

> Spec · 2026-06-28 · LocalisGuide
> Stato: approvato il design, in attesa di revisione spec prima del piano.

## Obiettivo

Aggiungere **francese (fr)** e **polacco (pl)** alle 19 guide oggi live in IT/EN/DE.
Questa Fase 1 produce e **verifica** solo i *testi*; la messa in onda pubblica e
l'audio sono Fase 2 (spec separato).

Vincolo dato dall'utente: **un mese di tempo, con calma, fatto bene.** Niente fretta,
verifica robusta, una guida alla volta.

## Decisioni fissate (dal brainstorming)

- **Scope fase 1:** testi guide completi (script audio + tutti i campi guida). Route e audio dopo.
- **Metodo:** traduco io, guida per guida, con doppio giro (traduzione + rilettura contro sorgente). Niente subagent.
- **Registro:** informale — FR *tu*, PL *ty*. Coerente col brand colloquiale ("tono da bar").
- **Sorgente di verità:** il testo **attualmente online** di ciascuna guida. Le varianti/draft
  `.txt` in eccesso (IT ha 33 file per 19 guide) **non** si traducono.
- **/fonti** (collection `sources`, 7 file): **fuori** dalla Fase 1.

## Scope

**Dentro:**
- Script audio FR/PL: un file per guida per lingua, `src/content/scripts/{slug}-fr.txt` e `-pl.txt`.
- Campi guida FR/PL nel frontmatter di ogni `src/content/guides/{slug}.mdx`:
  `title`, `subtitle`, `chapters[].title`, `seo.description`, `narrator.bio`, e
  `route_mode / accessibility / needs / use_case_intro` dove IT/EN li hanno.
- Estensione schema (`content.config.ts`) con i campi `*_fr` / `*_pl` **opzionali**.
- Glossario terminologico FR e PL.
- Script di verifica `scripts/translation-audit.mjs` + comando `pnpm i18n:audit`.

**Fuori (rimandato a Fase 2 o mini-task dedicati):**
- Tipo `Lang`, route `/fr` `/pl`, rami helper in `guide-localization.ts`, LangPills, hreflang,
  sitemap, middleware di detection.
- Produzione audio.
- `/fonti` (collection `sources`), blog, UI di chrome, checkout.
- Varianti/draft script non corrispondenti al testo online.

## Architettura

### Storage e convenzioni
Si seguono le convenzioni già esistenti — nessuna nuova fonte di verità.
- **Script:** `src/content/scripts/{slug}-{fr|pl}.txt`. SSML `<break .../>` preservati 1:1
  (cambia solo il parlato; il pacing fine si tara in Fase 2 audio).
- **Campi guida:** inline nel frontmatter MDX, come già per `_it/_en/_de`.

### Schema (`src/content.config.ts`)
Aggiunta minima che ricalca il pattern `_de` (opzionale, nessun default).
Campi opzionali ⇒ il build resta verde mentre si riempie una guida alla volta.
La **completezza non la impone lo schema ma l'audit** — così un campo mancante non
viene mascherato da un fallback silenzioso (rischio noto: un FR vuoto che mostra EN).
Nessun helper di rendering cambia in Fase 1 (niente pagina renderizza FR/PL).

### Sistema di controllo — `scripts/translation-audit.mjs`
Eseguibile con `pnpm i18n:audit`. Per FR e PL, su tutte le 19 guide:
1. **Completezza:** ogni campo richiesto presente e non vuoto → report dei buchi per guida.
2. **Presenza script:** `{slug}-fr.txt` e `-pl.txt` esistono e di lunghezza plausibile vs IT.
3. **Parità strutturale:** n. capitoli uguale tra lingue; conteggio `<break>` FR/PL == IT
   (±tolleranza); righe identiche a IT/EN segnalate come *non tradotte*.
4. **SEO:** `description_fr/pl` ≤ 160 caratteri.
5. **Exit code ≠ 0** se qualcosa fallisce → gate prima di ogni commit.

Oltre all'automazione, il **doppio giro umano**: giro 1 = traduzione; giro 2 = rilettura
di ogni guida contro la sorgente per fedeltà e registro. Una guida è "fatta" solo dopo
il giro 2 **e** audit verde.

### Glossario
`docs/i18n/glossary-fr.md` e `docs/i18n/glossary-pl.md`: termini ricorrenti e nomi propri
(trabucco, masseria, sassi, orecchiette, toponimi → **restano in italiano**), resa concordata
dei termini di brand. Si scrive **prima** di tradurre, per coerenza sulle 19 guide.

## Ordine del lavoro (a lotti, con gate audit)

0. Enumerare con precisione, per ciascuna delle 19 guide, il file script "online" canonico
   (scartando le varianti). Confermare la mappa slug → script prima di tradurre.
1. Glossari FR e PL.
2. Schema: campi `*_fr` / `*_pl` opzionali. `pnpm check` verde.
3. `translation-audit.mjs` + `pnpm i18n:audit` (gira a vuoto su 0/19, baseline rossa attesa).
4. Traduzione a lotti per zona: **Gargano (6) → Bari (6) → Valle d'Itria (6) → Matera (1)**.
   Per guida: FR + PL (script + campi) → giro 2 → `pnpm i18n:audit` → commit.

## Definition of Done (Fase 1)

- 19 guide × {fr, pl}: script `.txt` presenti + tutti i campi MDX compilati.
- `pnpm i18n:audit` verde (0 buchi, 0 parità rotte, 0 righe non tradotte, SEO entro 160).
- `pnpm check` verde.
- Glossari committati. Nessuna route/`Lang`/audio toccati.

## Rischi e mitigazioni

- **Campi opzionali mascherano buchi** → l'audit impone la completezza, non lo schema.
- **Pacing SSML diverso per lingua** → in Fase 1 si preservano i `<break>` 1:1; il fine-tuning
  è in Fase 2 (audio).
- **Qualità polacca (declinazioni, ordine parole)** → traduzione manuale attenta + audit che
  segnala righe non tradotte; giro 2 dedicato.
- **Confusione varianti script** → step 0 fissa la mappa slug → script online prima di iniziare.
