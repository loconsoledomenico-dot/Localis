# GA4 audio preview setup

Obiettivo: sapere con precisione quale guida o asset audio viene ascoltato e per quanti secondi.

## Cosa invia ora il frontend

Gli eventi preview ora includono sempre:

- `guide_slug` quando l'audio appartiene a una guida precisa
- `audio_asset_id` sempre, anche per trailer home o asset non associati a una guida singola
- `audio_context` con valori come `hero`, `guide_page`, `cruise`
- `audio_type` quando serve, per esempio `cruise_sample`
- `language`
- `page_path`
- `audio_duration_seconds`
- `max_position_seconds`
- `listen_percent`

In piu esiste un nuovo evento `audio_preview_session` che viene inviato a pausa, chiusura pagina o fine audio con:

- `listen_seconds`
- `listen_bucket`
- `completed`

## Settaggi GA4 da creare

In GA4: `Admin` -> `Custom definitions` -> `Create custom dimensions` o `Create custom metrics`.

### Event-scoped custom dimensions

- `guide_slug`
- `audio_asset_id`
- `audio_context`
- `audio_type`
- `listen_bucket`

### Event-scoped custom metrics

- `listen_seconds`
- `max_position_seconds`
- `audio_duration_seconds`
- `listen_percent`

## Nomi Data API

Dopo la registrazione in GA4, nella Data API userai:

- Dimensioni: `customEvent:guide_slug`, `customEvent:audio_asset_id`, `customEvent:audio_context`, `customEvent:audio_type`, `customEvent:listen_bucket`
- Metriche: `customEvent:listen_seconds`, `customEvent:max_position_seconds`, `customEvent:audio_duration_seconds`, `customEvent:listen_percent`

Se una custom definition non e registrata, le query Data API falliscono con `INVALID_ARGUMENT`.

## Come verificare

1. Apri il sito in produzione con consenso analytics attivo.
2. Riproduci una preview, fai pausa dopo qualche secondo e poi completa l'audio.
3. In GA4 controlla `Realtime` o `DebugView`.
4. Verifica gli eventi:
   - `preview_start`
   - `audio_preview_played`
   - `preview_10s`
   - `audio_preview_session`
   - `preview_complete`

## Query locale

Quando le custom definitions sono attive, puoi usare:

```bash
node scripts/ga4-audio-preview-report.mjs
```

Opzioni utili:

```bash
$env:GA4_START_DATE='2026-06-01'
$env:GA4_END_DATE='2026-06-08'
$env:PARTNER_ID='bluemarine-lido-sole'
node scripts/ga4-audio-preview-report.mjs
```

## Limite da tenere presente

Le custom definitions GA4 non sono retroattive. I nuovi campi diventano interrogabili solo dopo la loro registrazione e solo per gli eventi raccolti da quel momento in poi.
