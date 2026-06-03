# Analytics Implementation — Fase 2 Marketing
**Data:** 3 giugno 2026

---

## Strumento usato

**GA4** come strumento primario, **Plausible** come fallback privacy-friendly (no consent), **PostHog** opzionale.

---

## UTM Attribution (QR InfoPoint)

I parametri UTM vengono letti da URL al page load in `Analytics.astro`:

```
utm_source=infopoint_bari
utm_medium=qr
utm_campaign=bari_on_site_launch
utm_content=cartolina_a6_porto
```

**Conservazione:** salvati in `sessionStorage['localis_utm']` alla prima visita. Nelle pagine successive della stessa sessione vengono ripristinati anche senza parametri URL.

**Propagazione:** ogni chiamata a `window.localisTrack(name, params)` include automaticamente i parametri UTM trovati. Il funnel QR → preview → checkout → purchase è quindi tracciabile end-to-end.

**Privacy:** sessionStorage (non persistente oltre la scheda). Nessuna modifica alla cookie policy richiesta: i dati UTM sono attributi di navigazione anonimi già coperti dal consenso analytics esistente.

---

## Eventi implementati

| Evento | Componente | Quando scatta | Parametri |
|---|---|---|---|
| `preview_start` | `HeroAudioSample.astro`, `TrailerPlayer.astro` | Primo play per sessione audio | `guide_slug`, `language`, `source`, `page` + UTM |
| `preview_10s` | `HeroAudioSample.astro`, `TrailerPlayer.astro` | Ascolto raggiunge 10 secondi (una sola volta) | `guide_slug`, `language`, `source` + UTM |
| `preview_complete` | `HeroAudioSample.astro`, `TrailerPlayer.astro` | Anteprima termina | `guide_slug`, `language`, `source` + UTM |
| `checkout_started` | `PriceCard.astro` (esistente) | Click CTA acquisto | `product`, `guide`, `lang`, `partner_id` + UTM |
| `landing_view` | Da fire inline nelle landing specifiche | Caricamento landing strategica | `page`, `language`, `source`, `campaign` |
| `qr_landing_view` | Da fire inline in `/p/infopoint-bari/` | `utm_medium === 'qr'` | `partner_id`, `placement`, `campaign`, `language` |
| `offline_save_start` | Da fire nel SW / access page | Avvio download offline | `guide_slug`, `language`, `size_mb` |
| `offline_save_complete` | Da fire nel SW / access page | Download completato | `guide_slug`, `language`, `size_mb` |
| `partner_lead` | Da fire in diventa-partner form | Invio richiesta | `partner_type`, `page` |

---

## Parametri garantiti su ogni evento via localisTrack

```javascript
window.localisTrack('nome_evento', {
  guide_slug: 'bari-vecchia',
  language: 'it',
  source: 'hero',
  // Automaticamente aggiunti da Analytics.astro:
  partner_id: 'infopoint_bari' | '(direct)',
  utm_source: 'infopoint_bari',
  utm_medium: 'qr',
  utm_campaign: 'bari_on_site_launch',
  utm_content: 'cartolina_a6_porto',
});
```

---

## Prevenzione duplicati

- `preview_start`: flag `_started` per istanza audio → non riparte se l'utente pausa e riprende
- `preview_10s`: flag `_10sFired` per istanza audio → un solo evento per ascolto
- `checkout_started`: già one-shot (click button) in PriceCard.astro
- UTM: sovrascrittura protetta — se il parametro è già in `params` non viene rimpiazzato

---

## Verifica in debug

1. Aprire DevTools → Console
2. Visitare `/p/infopoint-bari/?utm_source=infopoint_bari&utm_medium=qr&utm_campaign=bari_on_site_launch&utm_content=cartolina_a6_porto`
3. Verificare: `window.localisUtm` contiene i 4 parametri
4. Verificare: `sessionStorage.getItem('localis_utm')` li conserva
5. Premere Play sull'anteprima → nella Network tab o Console verificare eventi `preview_start`, poi `preview_10s` dopo 10s
6. Navigare a una guida e fare checkout → verificare `checkout_started` con `utm_source: 'infopoint_bari'`

---

## Come leggere i risultati InfoPoint su GA4

Filtro consigliato in GA4 → Esplora:
- Segmento: `utm_source == infopoint_bari`
- Metriche: `preview_start`, `preview_complete`, `checkout_started`, `purchase`
- Breakdown: `utm_content` per capire quale cartolina ha performato meglio

---

## Backlog non implementato in questo commit

- `view_item`, `select_item` (ecommerce GA4 standard) — da aggiungere su GuideCard e pagina guida
- `begin_checkout` (distinto da `checkout_started`) — da allineare nomenclatura GA4 ecommerce
- `offline_save_*` — da aggiungere nella pagina `/access/` o nel Service Worker
- `partner_lead` — da aggiungere nel form di diventa-partner
