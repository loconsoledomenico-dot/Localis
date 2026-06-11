---
name: audio
description: Genera o rigenera audioguide Localis via ElevenLabs (generate-guide.py). Usa quando l'utente dice "genera audio", "rigenera capitolo", "nuova guida audio", "rifai il cap X", "produci la voce", "render audioguida", o cita slug guida + lingua. Incapsula dry-run obbligatorio, rigenerazione per-capitolo, run in background, e le regole assolute di produzione.
---

# Produzione audioguide Localis

Pipeline attorno a `scripts/generate-guide.py`. Obiettivo: zero render sprecati, zero chunk persi, zero upload prematuri.

## Interfaccia dello script (verità di base)

```
python scripts/generate-guide.py <slug> <script_path> [--lang it|en|de] [--voice NAME] [--dry-run] [--model eleven_multilingual_v2]
```

- Capitoli separati da `=====` nel file sorgente. Un capitolo può iniziare con `voice: <nome>` per override voce.
- Output: `r2_audio/<slug>/chunks-<lang>/NN_MM.mp3` (chunk per capitolo) + `r2_audio/<slug>/full-<lang>.mp3` (concatenato con ffmpeg).
- **Caching automatico**: un chunk `NN_MM.mp3` già esistente (>1KB) viene SALTATO. Re-run = rigenera solo i chunk mancanti.
- Voci: chiavi in `VOICE_MAP` dentro lo script, oppure `<NOME>_VOICE_ID` nel `.env` (es. `LUIGI_VOICE_ID`).
- Lo script stampa a fine run il blocco `chapters:` + `duration_seconds` da incollare nel frontmatter MDX.

## SEMPRE da `C:\Dev\Sites\LocalisGuide`

Lavora dal path junction senza `&` (evita la rottura PowerShell/shim). Encoding sempre:
```
PYTHONIOENCODING=utf-8 python scripts/generate-guide.py ...
```

## Workflow

### Passo 1 — `--dry-run` SEMPRE prima (obbligatorio)
Mai lanciare il render completo a freddo. Prima:
```
PYTHONIOENCODING=utf-8 python scripts/generate-guide.py <slug> <script> --lang <l> --voice <v> --dry-run
```
Mostra all'utente: n° capitoli, voci usate, char totali, **costo stimato**, minuti stimati. Conferma prima di spendere quota API. Questo intercetta separatori `=====` sbagliati, header non saltati, voci inesistenti — i fallimenti più frequenti.

### Passo 2a — Guida nuova (tutti i capitoli)
Dopo conferma, lancia in **background** (il render è 5-10 min, non bloccare la sessione):
```
PYTHONIOENCODING=utf-8 python scripts/generate-guide.py <slug> <script> --lang <l> --voice <v>
```
Usa `run_in_background: true`. Sarai notificato a fine run.

### Passo 2b — Rigenerare UN SOLO capitolo cambiato (caso più comune, 10x più economico)
⚠️ Il chunk è nominato per **indice** (`NN_MM.mp3`), non per contenuto. Se cambi il testo del cap 3 e ri-lanci, lo script lo **salta** perché il file esiste già. Quindi:

1. Conta i capitoli prima del cambiato (l'indice è 0-based, esclusi gli header saltati). In dubbio: `--dry-run` mostra `[NN] titolo`.
2. **Cancella solo i chunk di quel capitolo**:
   ```
   Remove-Item "r2_audio/<slug>/chunks-<l>/03_*.mp3"
   ```
3. Ri-lancia lo stesso comando di generazione: rigenera solo il cap 03, tutti gli altri saltati da cache. Poi riconcatena (lo fa lo script in automatico).

### Passo 3 — Durata reale (mai inventata)
Dopo il render, `duration_seconds` e `start_seconds` SEMPRE da ffprobe sul file reale, mai stimati. Lo script li stampa già; usa quelli o verifica con ffprobe (`/c/ffmpeg/bin/`).

### Passo 4 — MDX + check
Aggiorna `src/content/guides/<slug>.mdx` con `chapters:` e `duration_seconds`. Poi:
```
pnpm check
```
0 errori → push (solo su richiesta esplicita dell'utente).

## REGOLE ASSOLUTE (da memoria progetto)

- **MAI caricare su R2 audio auto-generato** senza file finale approvato dall'utente. Il render serve per ascolto/test; l'upload R2 avviene col file mixato che porta l'utente.
- **MAI buttare i chunk** `NN_MM.mp3` dopo la concatenazione — le modifiche single-cap costano 10x meno con i chunk conservati.
- **MAI dichiarare "OK" su un check senza evidenza** (output mostrato).
- **`duration_seconds` / `start_seconds` sempre da ffprobe reale**, mai inventati.
- **Modifiche multilang in parallelo**: testo IT/EN/DE allineati; ma render EN/DE solo quando il testo è verificato riga per riga (check diretto, non delegato a subagent).
- Voci Localis = AI dichiarata, non umane.

## Note DE (nomi piatti invariati)
`du` informale · focaccia/orecchiette/panzerotti/sgagliozze/popizze invariati · polpo→Oktopus (NON Tintenfisch) · seppie→Sepien · arricciato→gerollt · teglia→Backform · cartoccio→Papiertüte · cime di rapa→Stängelkohl · crosticina→Kruste.
