# Procedura traduzione guida (FR + PL) — Fase 1

Per ogni guida, **una lingua alla volta**, prima FR poi PL:

1. **Leggi la sorgente**: gli script IT da `source-map.json` + il frontmatter MDX IT.
   Incrocia con EN/DE dove aiutano la sfumatura. Tieni aperti `glossary-fr.md` / `glossary-pl.md`.
2. **Giro 1 — traduci**:
   - Script: crea `{nome}-{fr|pl}.txt` rispecchiando 1:1 la struttura della sorgente
     (stesso numero di file se a capitoli). **Preserva ogni `<break .../>` nella stessa posizione**;
     traduci solo il parlato. Registro informale (tu/ty).
   - Campi MDX: compila `title_{lang}`, `subtitle_{lang}`, ogni `chapters[].title_{lang}`,
     `seo.description_{lang}` (≤160), `narrator.bio_{lang}`, e i display field (`route_mode_…`,
     `accessibility_…`, `needs_…`, `use_case_intro_…`) **solo dove esiste l'`_it`**.
3. **Giro 2 — rileggi** la traduzione contro la sorgente: fedeltà, niente omissioni,
   nomi propri in italiano (glossario), tono colloquiale, SEO entro 160.
4. **Verifica**: `pnpm i18n:audit` (i problemi di questa guida → 0); `pnpm check` verde.
5. **Commit** della singola guida (entrambe le lingue insieme):
   `git add` dei `.txt` nuovi + il `.mdx` modificato →
   `git commit -m "content(i18n): traduzione FR/PL <slug>"`.

**Regole assolute:** mai inventare contenuto non presente nella sorgente; mai lasciare
righe in IT/EN; mai concatenare/buttare i capitoli; un commit per guida.

**Nota nomi file output** (l'audit li deriva così):
- sorgente `…-it.txt` → output `…-fr.txt` / `…-pl.txt` (sostituzione di `-it`)
- sorgente senza suffisso lingua (es. `…-guida-fast.txt`, `…-capN-it.txt`) →
  `-it` viene sostituito; se non c'è `-it`, il suffisso `-fr`/`-pl` viene appeso prima di `.txt`.
