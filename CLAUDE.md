# LocalisGuide — istruzioni progetto

Sito audioguide (Astro 6, MDX, Netlify, R2 per audio, pnpm). Risposte in italiano.

## Percorso & shell (anti-errore #1 e #2)

- **Lavora sempre da `C:\Dev\Sites\LocalisGuide`** (junction senza `&`). Il path reale `...\Progetti & Lab\...` ha un ampersand che rompe PowerShell e gli shim `node_modules\.bin\` — non usarlo nei comandi.
- **Una shell sola per comando.** Niente sintassi bash dentro PowerShell e viceversa. `winget`/comandi Windows → PowerShell; pipe POSIX/heredoc → Bash.
- **Python sempre con `PYTHONIOENCODING=utf-8`** (evita UnicodeEncodeError su Windows).

## Verifica (standard unico)

- Typecheck: **`pnpm check`** (= `astro check`). NON `npx astro check` né `cd ... && node_modules/.bin/...`.
- Build: `pnpm build` · Test: `pnpm test`.
- Prima di dire "fatto" su modifiche non banali: `pnpm check` pulito, evidenza mostrata.

## Disciplina edit (anti-errore Read-before-Edit)

- **Read prima di ogni Edit/Write.** Non assumere il contenuto di un file — è l'errore #1 nei log (117 occorrenze).
- Edit fallita per "string not found" → ri-Read la zona esatta, non tentare a memoria.
- Mai cambiare dati/numeri/prezzi non richiesti. Segnalare prima di correggere.

## Audio

- Produzione/rigenerazione audioguide → usa la skill **`/audio`** (incapsula dry-run, render per-capitolo, background, regole R2).
- `duration_seconds` / `start_seconds` SEMPRE da ffprobe reale, mai inventati.
- Mai caricare su R2 audio auto-generato senza file finale approvato dall'utente.

## Deploy

- **Netlify, NON Vercel.** Push su `main` → deploy automatico. Verifica che il deploy parta davvero.

## Multilang

- Modifiche pagina → applica in parallelo IT + `en/` + `de/`. Push solo su richiesta esplicita.
