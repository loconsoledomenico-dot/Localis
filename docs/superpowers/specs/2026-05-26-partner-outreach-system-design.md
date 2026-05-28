# LocalisGuide — Partner Outreach System

**Date:** 2026-05-26  
**Status:** Approved  
**Scope:** Sistema Python per identificare, contattare e tracciare partner commerciali (bar, hotel, B&B, infopoint, negozi turistici) nelle destinazioni coperte da LocalisGuide.

---

## Obiettivo

Automatizzare la pipeline di partner outreach:
1. Trovare candidati via Firecrawl (web scraping)
2. Estrarre email dai siti trovati
3. Creare bozze Gmail personalizzate per revisione manuale
4. Tracciare tutto in Google Sheets con analytics integrata

---

## Architettura

```
marketing/outreach/
├── scraper.py          # Firecrawl → candidati + email
├── drafts.py           # Gmail API → crea bozze
├── sheets.py           # Google Sheets read/write
├── sync.py             # Aggiorna tab Analytics da registry + GA4/Stripe CSV
├── templates/
│   ├── outreach_it.txt # Template italiano (bar, hotel, infopoint — varianti)
│   └── outreach_en.txt # Template inglese
├── config.py           # Credenziali, Sheet ID, parametri
└── run.py              # CLI entry point
```

---

## Modulo 1 — `scraper.py`

**Input:** `--city` (es. `bari`, `alberobello`) + `--type` (es. `hotel,bb,bar,infopoint`)

**Processo:**
- Per ogni combinazione city+type, lancia query Firecrawl search: `"<type> <city> puglia email contatti"`
- Per ogni URL trovato, fa scrape della pagina e cerca pattern email con regex
- Deduplica per dominio (no duplicati stessa attività)
- Filtra email generiche da escludere (info@comune.*, noreply@*)

**Output:** righe scritte nella tab **Candidati** del Google Sheet:

| Campo | Tipo |
|-------|------|
| id | auto-incrementale |
| nome | stringa |
| tipo | bar/hotel/bb/infopoint/negozio |
| città | stringa |
| indirizzo | stringa (se trovato) |
| email | stringa |
| url_fonte | URL |
| data_trovato | ISO date |
| stato | `da_contattare` (default) |

---

## Modulo 2 — `drafts.py`

**Input:** legge tab **Outreach** (o **Candidati** con stato `da_contattare`)

**Processo:**
- Per ogni riga eleggibile, carica template in base a `tipo` (bar/hotel/infopoint hanno paragrafi diversi) e `lingua` (IT default, EN se email `.co.uk` o città non pugliese)
- Sostituisce variabili: `{nome}`, `{città}`, `{tipo_proposta}` (volantini vs partnership)
- Crea bozza Gmail via API (non invia)
- Aggiorna stato riga → `bozza_pronta`

**Template varianti per tipo:**
- `bar/ristorante` — proposta volantini/QR su tavoli e bancone
- `hotel/bb` — proposta volantini in reception + QR in camera
- `infopoint` — proposta partnership strutturata o semplice distribuzione materiale
- `negozio` — proposta vetrina QR

---

## Modulo 3 — `sheets.py`

Google Sheet con 3 tab:

### Tab: Candidati
Fonte grezza scraper (vedi schema Modulo 1).

### Tab: Outreach

| Campo | Tipo |
|-------|------|
| id | FK → Candidati |
| nome | stringa |
| email | stringa |
| tipo | categoria |
| città | stringa |
| stato | enum (vedi sotto) |
| data_primo_contatto | ISO date |
| data_ultimo_contatto | ISO date |
| n_tentativi | int |
| sentiment_risposta | positivo/neutro/negativo/nessuno |
| slug_qr | stringa (se partner attivo) |
| note | testo libero |

**Stati possibili:** `da_contattare` → `bozza_pronta` → `inviata` → `risposta_ricevuta` → `partner_attivo` / `rifiutato` / `follow_up`

### Tab: Analytics

| Campo | Fonte |
|-------|-------|
| slug | partners-registry.md |
| nome | partners-registry.md |
| periodo_da / periodo_a | manuale |
| visitatori | GA4 CSV |
| preview_ascoltate | GA4 CSV |
| checkout_iniziati | GA4 CSV |
| acquisti | GA4 CSV / Stripe |
| revenue_lorda | Stripe |
| quota_partner_25pct | calcolato |
| cr_visit_buy | calcolato |

---

## Modulo 4 — `sync.py`

- Legge `marketing/partners-registry.md` → aggiorna nomi/slug in tab Analytics
- Se presente un CSV export GA4 o Stripe in `marketing/exports/`, lo parsa e aggiorna le colonne metriche
- Aggiorna `data_ultimo_sync` in config

---

## CLI — `run.py`

```bash
python run.py scrape --city bari --type hotel,bb,bar,infopoint
python run.py scrape --city alberobello --type hotel,bb
python run.py drafts            # crea bozze Gmail per tutti i da_contattare
python run.py drafts --id 42    # solo una riga specifica
python run.py sync              # aggiorna tab Analytics
python run.py status            # stampa sommario: N candidati, N bozze, N inviati, N attivi
```

---

## Credenziali necessarie

| Servizio | Cosa serve |
|----------|-----------|
| Google Sheets API | Service account JSON o OAuth2 credentials |
| Gmail API | OAuth2 con scope `gmail.compose` (solo bozze, non lettura) |
| Firecrawl | API key (già disponibile via plugin) |

Tutte le credenziali in `config.py` (gitignored) o variabili d'ambiente.

---

## Dipendenze Python

```
google-api-python-client
google-auth-oauthlib
gspread
firecrawl-py
```

---

## Non incluso in questo scope

- Invio automatico email (deliberatamente escluso — revisione manuale via Gmail)
- Risposta automatica ai partner
- Integrazione diretta GA4 API (si usa CSV export manuale per ora)
- Notifiche Telegram/email su nuove risposte
