# Partner Outreach System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistema Python CLI che trova partner turistici via Firecrawl, crea bozze Gmail personalizzate e traccia tutto in Google Sheets con analytics.

**Architecture:** 4 moduli indipendenti (scraper, drafts, sheets, sync) coordinati da un CLI entry point. Google Sheets è il database centrale con 3 tab (Candidati, Outreach, Analytics). Gmail API usata solo per creare bozze — nessun invio automatico.

**Tech Stack:** Python 3.14, `firecrawl-py`, `gspread`, `google-api-python-client`, `google-auth-oauthlib`

---

## File Structure

```
marketing/outreach/
├── config.py               # costanti, credenziali da env, Sheet ID
├── sheets.py               # wrapper gspread: init sheet, read/write tab
├── scraper.py              # Firecrawl search + email extraction
├── drafts.py               # Gmail API bozze
├── sync.py                 # aggiorna tab Analytics da registry + CSV
├── run.py                  # CLI argparse entry point
├── templates/
│   ├── outreach_it.txt     # template IT con varianti per tipo
│   └── outreach_en.txt     # template EN
└── tests/
    ├── test_scraper.py
    ├── test_drafts.py
    ├── test_sheets.py
    └── test_sync.py
```

**Credenziali (gitignored):**
```
marketing/outreach/credentials/
├── google-service-account.json   # Google Sheets API
└── gmail-oauth2.json             # Gmail API (OAuth2)
```

Aggiungere a `.gitignore`:
```
marketing/outreach/credentials/
marketing/outreach/.env
```

---

## Task 1: Setup progetto e config

**Files:**
- Create: `marketing/outreach/config.py`
- Create: `marketing/outreach/credentials/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Crea directory structure**

```powershell
New-Item -ItemType Directory -Force "marketing/outreach/templates"
New-Item -ItemType Directory -Force "marketing/outreach/tests"
New-Item -ItemType Directory -Force "marketing/outreach/credentials"
New-Item -ItemType File -Force "marketing/outreach/credentials/.gitkeep"
```

- [ ] **Step 2: Crea `config.py`**

```python
import os

FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")

GOOGLE_SHEET_ID = os.environ.get("LOCALIS_SHEET_ID", "")
SERVICE_ACCOUNT_FILE = os.path.join(
    os.path.dirname(__file__), "credentials", "google-service-account.json"
)
GMAIL_CREDENTIALS_FILE = os.path.join(
    os.path.dirname(__file__), "credentials", "gmail-oauth2.json"
)
GMAIL_TOKEN_FILE = os.path.join(
    os.path.dirname(__file__), "credentials", "gmail-token.json"
)

SHEET_CANDIDATI = "Candidati"
SHEET_OUTREACH = "Outreach"
SHEET_ANALYTICS = "Analytics"

PARTNER_REGISTRY_PATH = os.path.join(
    os.path.dirname(__file__), "..", "partners-registry.md"
)

STATI_VALIDI = [
    "da_contattare",
    "bozza_pronta",
    "inviata",
    "risposta_ricevuta",
    "partner_attivo",
    "rifiutato",
    "follow_up",
]

EMAIL_EXCLUDE_PATTERNS = [
    r"noreply@",
    r"no-reply@",
    r"info@comune\.",
    r"postmaster@",
]

TIPI_VALIDI = ["bar", "hotel", "bb", "infopoint", "negozio", "ristorante"]
```

- [ ] **Step 3: Aggiungi a `.gitignore`**

Apri `.gitignore` e aggiungi in fondo:
```
# Outreach credentials
marketing/outreach/credentials/*.json
marketing/outreach/.env
marketing/exports/
```

- [ ] **Step 4: Installa dipendenze**

```powershell
C:/Python314/python.exe -m pip install firecrawl-py gspread google-api-python-client google-auth-oauthlib
```

- [ ] **Step 5: Commit**

```bash
git add marketing/outreach/config.py marketing/outreach/credentials/.gitkeep .gitignore
git commit -m "feat(outreach): setup progetto config e credenziali"
```

---

## Task 2: Google Sheets wrapper (`sheets.py`)

**Files:**
- Create: `marketing/outreach/sheets.py`
- Create: `marketing/outreach/tests/test_sheets.py`

- [ ] **Step 1: Scrivi il test**

```python
# marketing/outreach/tests/test_sheets.py
import pytest
from unittest.mock import MagicMock, patch

def test_get_or_create_tab_esistente():
    mock_sheet = MagicMock()
    mock_tab = MagicMock()
    mock_tab.title = "Candidati"
    mock_sheet.worksheets.return_value = [mock_tab]

    with patch("sheets.get_spreadsheet", return_value=mock_sheet):
        from sheets import get_or_create_tab
        result = get_or_create_tab(mock_sheet, "Candidati")
        assert result == mock_tab
        mock_sheet.add_worksheet.assert_not_called()

def test_get_or_create_tab_nuovo():
    mock_sheet = MagicMock()
    mock_sheet.worksheets.return_value = []
    new_tab = MagicMock()
    mock_sheet.add_worksheet.return_value = new_tab

    from sheets import get_or_create_tab
    result = get_or_create_tab(mock_sheet, "Candidati")
    mock_sheet.add_worksheet.assert_called_once_with(title="Candidati", rows=1000, cols=20)
    assert result == new_tab

def test_append_row_candidati():
    mock_tab = MagicMock()
    row = {
        "id": "1", "nome": "Hotel Test", "tipo": "hotel",
        "citta": "bari", "indirizzo": "", "email": "test@hotel.it",
        "url_fonte": "https://example.com", "data_trovato": "2026-05-26",
        "stato": "da_contattare"
    }
    from sheets import CANDIDATI_HEADERS, row_to_list
    result = row_to_list(row, CANDIDATI_HEADERS)
    assert result[0] == "1"
    assert result[5] == "test@hotel.it"
```

- [ ] **Step 2: Esegui il test — deve fallire**

```powershell
cd marketing/outreach
C:/Python314/python.exe -m pytest tests/test_sheets.py -v
```
Expected: `ModuleNotFoundError: No module named 'sheets'`

- [ ] **Step 3: Implementa `sheets.py`**

```python
# marketing/outreach/sheets.py
import gspread
from google.oauth2.service_account import Credentials
from config import SERVICE_ACCOUNT_FILE, GOOGLE_SHEET_ID, SHEET_CANDIDATI, SHEET_OUTREACH, SHEET_ANALYTICS

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

CANDIDATI_HEADERS = [
    "id", "nome", "tipo", "citta", "indirizzo",
    "email", "url_fonte", "data_trovato", "stato"
]

OUTREACH_HEADERS = [
    "id", "nome", "email", "tipo", "citta", "stato",
    "data_primo_contatto", "data_ultimo_contatto", "n_tentativi",
    "sentiment_risposta", "slug_qr", "note"
]

ANALYTICS_HEADERS = [
    "slug", "nome", "periodo_da", "periodo_a",
    "visitatori", "preview_ascoltate", "checkout_iniziati",
    "acquisti", "revenue_lorda", "quota_partner_25pct", "cr_visit_buy"
]


def get_spreadsheet():
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    return client.open_by_key(GOOGLE_SHEET_ID)


def get_or_create_tab(spreadsheet, name: str):
    existing = {ws.title: ws for ws in spreadsheet.worksheets()}
    if name in existing:
        return existing[name]
    return spreadsheet.add_worksheet(title=name, rows=1000, cols=20)


def ensure_headers(tab, headers: list[str]):
    existing = tab.row_values(1)
    if existing != headers:
        tab.update("A1", [headers])


def row_to_list(row: dict, headers: list[str]) -> list:
    return [str(row.get(h, "")) for h in headers]


def append_candidato(row: dict):
    sheet = get_spreadsheet()
    tab = get_or_create_tab(sheet, SHEET_CANDIDATI)
    ensure_headers(tab, CANDIDATI_HEADERS)
    tab.append_row(row_to_list(row, CANDIDATI_HEADERS))


def get_candidati_da_contattare() -> list[dict]:
    sheet = get_spreadsheet()
    tab = get_or_create_tab(sheet, SHEET_CANDIDATI)
    records = tab.get_all_records()
    return [r for r in records if r.get("stato") == "da_contattare"]


def update_stato(tab_name: str, row_index: int, nuovo_stato: str):
    sheet = get_spreadsheet()
    tab = get_or_create_tab(sheet, tab_name)
    headers = tab.row_values(1)
    stato_col = headers.index("stato") + 1
    tab.update_cell(row_index + 2, stato_col, nuovo_stato)


def append_outreach(row: dict):
    sheet = get_spreadsheet()
    tab = get_or_create_tab(sheet, SHEET_OUTREACH)
    ensure_headers(tab, OUTREACH_HEADERS)
    tab.append_row(row_to_list(row, OUTREACH_HEADERS))


def get_outreach_all() -> list[dict]:
    sheet = get_spreadsheet()
    tab = get_or_create_tab(sheet, SHEET_OUTREACH)
    return tab.get_all_records()


def upsert_analytics(row: dict):
    sheet = get_spreadsheet()
    tab = get_or_create_tab(sheet, SHEET_ANALYTICS)
    ensure_headers(tab, ANALYTICS_HEADERS)
    records = tab.get_all_records()
    for i, r in enumerate(records):
        if r.get("slug") == row.get("slug"):
            tab.update(f"A{i+2}", [row_to_list(row, ANALYTICS_HEADERS)])
            return
    tab.append_row(row_to_list(row, ANALYTICS_HEADERS))
```

- [ ] **Step 4: Esegui test**

```powershell
C:/Python314/python.exe -m pytest tests/test_sheets.py -v
```
Expected: tutti i test PASS

- [ ] **Step 5: Commit**

```bash
git add marketing/outreach/sheets.py marketing/outreach/tests/test_sheets.py
git commit -m "feat(outreach): sheets wrapper con 3 tab e helper functions"
```

---

## Task 3: Templates email

**Files:**
- Create: `marketing/outreach/templates/outreach_it.txt`
- Create: `marketing/outreach/templates/outreach_en.txt`

- [ ] **Step 1: Crea template italiano**

```
marketing/outreach/templates/outreach_it.txt
```

Contenuto:
```
Oggetto: Collaborazione LocalisGuide × {nome}

Gentili,

mi chiamo Luigi Loconsole e sono il fondatore di LocalisGuide (localis.guide), un servizio di audioguide turistiche per visitatori di Bari e della Puglia.

Le nostre guide sono narrate da persone del posto — baresi veri, con voce e storie autentiche — e disponibili direttamente sullo smartphone del turista, senza app da scaricare. Copriamo Bari Vecchia, Porto Vecchio, San Nicola e altre destinazioni pugliesi, con guide in italiano, inglese e tedesco.

[TIPO:bar|ristorante]
Ci piacerebbe collaborare con {nome}: un QR code sui tavoli o al bancone permetterebbe ai vostri clienti stranieri di scoprire la città mentre aspettano o si rilassano.
[/TIPO]

[TIPO:hotel|bb]
Ci piacerebbe collaborare con {nome}: un QR code in reception o in camera offrirebbe ai vostri ospiti una guida audio della città, curata da chi ci vive.
[/TIPO]

[TIPO:infopoint]
Ci piacerebbe collaborare con il vostro Infopoint, che vediamo come un punto di riferimento naturale per i turisti che arrivano in città.
[/TIPO]

[TIPO:negozio]
Ci piacerebbe collaborare con {nome}: un QR code in vetrina o all'interno attirerebbe turisti in cerca di esperienze locali autentiche.
[/TIPO]

Siamo flessibili su come strutturarla:
- Opzione semplice: lasciare qualche nostro volantino/QR code presso di voi, senza nessun onere economico
- Opzione partnership: accordo con riconoscimento del 25% su ogni acquisto generato tramite il vostro canale

Saremo felici di presentarvi il prodotto di persona o via call.

Cordiali saluti,
Luigi Loconsole
Fondatore, LocalisGuide
localis.guide
```

- [ ] **Step 2: Crea template inglese**

```
marketing/outreach/templates/outreach_en.txt
```

Contenuto:
```
Subject: Partnership proposal — LocalisGuide × {nome}

Dear team,

My name is Luigi Loconsole and I'm the founder of LocalisGuide (localis.guide), an audio guide service for tourists visiting Bari and Puglia.

Our guides are narrated by real locals — authentic voices and stories from people who live here — available directly on the tourist's smartphone, no app download required. We cover Bari Vecchia, the Old Port, San Nicola and other Puglia destinations, with guides in Italian, English and German.

[TIPO:bar|ristorante]
We'd love to partner with {nome}: a QR code on tables or at the bar would let your international guests explore the city while they relax.
[/TIPO]

[TIPO:hotel|bb]
We'd love to partner with {nome}: a QR code at reception or in rooms would give your guests an authentic local audio guide of the city.
[/TIPO]

[TIPO:infopoint]
We'd love to partner with your Infopoint, which we see as a natural touchpoint for tourists arriving in the city.
[/TIPO]

[TIPO:negozio]
We'd love to partner with {nome}: a QR code in your window or inside would attract tourists looking for authentic local experiences.
[/TIPO]

We're flexible on structure:
- Simple option: leave our flyers/QR codes with you, no cost to you
- Partnership option: a referral agreement with 25% of every purchase attributed to your channel

Happy to present the product in person or on a call.

Best regards,
Luigi Loconsole
Founder, LocalisGuide
localis.guide
```

- [ ] **Step 3: Commit**

```bash
git add marketing/outreach/templates/
git commit -m "feat(outreach): template email IT+EN con varianti per tipo partner"
```

---

## Task 4: Scraper (`scraper.py`)

**Files:**
- Create: `marketing/outreach/scraper.py`
- Create: `marketing/outreach/tests/test_scraper.py`

- [ ] **Step 1: Scrivi il test**

```python
# marketing/outreach/tests/test_scraper.py
import pytest
from unittest.mock import MagicMock, patch

def test_estrai_email_da_testo():
    from scraper import estrai_email
    testo = "Contattaci a info@hoteltest.it oppure prenota@hoteltest.it"
    result = estrai_email(testo)
    assert "info@hoteltest.it" in result
    assert "prenota@hoteltest.it" in result

def test_estrai_email_esclude_noreply():
    from scraper import estrai_email
    testo = "noreply@sistema.it e info@hoteltest.it"
    result = estrai_email(testo)
    assert "noreply@sistema.it" not in result
    assert "info@hoteltest.it" in result

def test_estrai_email_esclude_comune():
    from scraper import estrai_email
    testo = "info@comune.bari.it e prenotazioni@bb-bari.it"
    result = estrai_email(testo)
    assert "info@comune.bari.it" not in result
    assert "prenotazioni@bb-bari.it" in result

def test_build_query():
    from scraper import build_query
    q = build_query("hotel", "bari")
    assert "hotel" in q
    assert "bari" in q
    assert "email" in q.lower() or "contatti" in q.lower()

def test_deduplicazione_dominio():
    from scraper import deduplicazione_per_dominio
    emails = ["info@hotel.it", "prenota@hotel.it", "info@altrohotel.it"]
    result = deduplicazione_per_dominio(emails)
    assert len(result) == 2
    assert "info@hotel.it" in result or "prenota@hotel.it" in result
    assert "info@altrohotel.it" in result
```

- [ ] **Step 2: Esegui il test — deve fallire**

```powershell
C:/Python314/python.exe -m pytest tests/test_scraper.py -v
```
Expected: `ModuleNotFoundError: No module named 'scraper'`

- [ ] **Step 3: Implementa `scraper.py`**

```python
# marketing/outreach/scraper.py
import re
import datetime
from firecrawl import FirecrawlApp
from config import FIRECRAWL_API_KEY, EMAIL_EXCLUDE_PATTERNS

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


def estrai_email(testo: str) -> list[str]:
    trovate = EMAIL_REGEX.findall(testo)
    risultati = []
    for email in trovate:
        escludi = any(re.search(p, email) for p in EMAIL_EXCLUDE_PATTERNS)
        if not escludi:
            risultati.append(email.lower())
    return list(set(risultati))


def deduplicazione_per_dominio(emails: list[str]) -> list[str]:
    visti = {}
    for email in emails:
        domain = email.split("@")[1]
        if domain not in visti:
            visti[domain] = email
    return list(visti.values())


def build_query(tipo: str, city: str) -> str:
    return f'"{tipo}" "{city}" puglia email contatti sito'


def scrape_candidati(city: str, tipi: list[str]) -> list[dict]:
    app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    candidati = []
    id_counter = 1

    for tipo in tipi:
        query = build_query(tipo, city)
        print(f"  Cerco: {query}")
        try:
            risultati = app.search(query, limit=10)
        except Exception as e:
            print(f"  Errore Firecrawl: {e}")
            continue

        for r in risultati:
            url = r.get("url", "")
            markdown = r.get("markdown", "") or r.get("content", "")
            emails = estrai_email(markdown)
            emails = deduplicazione_per_dominio(emails)

            nome = r.get("title", url)[:80]

            for email in emails:
                candidati.append({
                    "id": str(id_counter),
                    "nome": nome,
                    "tipo": tipo,
                    "citta": city,
                    "indirizzo": "",
                    "email": email,
                    "url_fonte": url,
                    "data_trovato": datetime.date.today().isoformat(),
                    "stato": "da_contattare",
                })
                id_counter += 1

    return candidati
```

- [ ] **Step 4: Esegui test**

```powershell
C:/Python314/python.exe -m pytest tests/test_scraper.py -v
```
Expected: tutti i test PASS

- [ ] **Step 5: Commit**

```bash
git add marketing/outreach/scraper.py marketing/outreach/tests/test_scraper.py
git commit -m "feat(outreach): scraper Firecrawl con estrazione email e deduplicazione"
```

---

## Task 5: Gmail drafts (`drafts.py`)

**Files:**
- Create: `marketing/outreach/drafts.py`
- Create: `marketing/outreach/tests/test_drafts.py`

- [ ] **Step 1: Scrivi il test**

```python
# marketing/outreach/tests/test_drafts.py
import pytest

def test_render_template_it_bar():
    from drafts import render_template
    body = render_template("bar", "it", "London Bar", "bari")
    assert "London Bar" in body
    assert "tavoli" in body or "bancone" in body
    assert "[TIPO:" not in body

def test_render_template_it_hotel():
    from drafts import render_template
    body = render_template("hotel", "it", "Hotel Belvedere", "alberobello")
    assert "Hotel Belvedere" in body
    assert "reception" in body or "camera" in body
    assert "[TIPO:" not in body

def test_render_template_rimuove_blocchi_altri_tipi():
    from drafts import render_template
    body = render_template("bb", "it", "B&B Trulli", "alberobello")
    assert "[TIPO:" not in body
    assert "[/TIPO]" not in body

def test_detect_lingua_en():
    from drafts import detect_lingua
    assert detect_lingua("info@hotel.co.uk") == "en"
    assert detect_lingua("info@hotel.it") == "it"
    assert detect_lingua("info@hotel.de") == "it"  # fallback IT
```

- [ ] **Step 2: Esegui il test — deve fallire**

```powershell
C:/Python314/python.exe -m pytest tests/test_drafts.py -v
```
Expected: `ModuleNotFoundError: No module named 'drafts'`

- [ ] **Step 3: Implementa `drafts.py`**

```python
# marketing/outreach/drafts.py
import re
import os
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from config import GMAIL_CREDENTIALS_FILE, GMAIL_TOKEN_FILE

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")


def detect_lingua(email: str) -> str:
    return "en" if email.endswith(".co.uk") else "it"


def render_template(tipo: str, lingua: str, nome: str, citta: str) -> str:
    fname = f"outreach_{lingua}.txt"
    path = os.path.join(TEMPLATES_DIR, fname)
    with open(path, encoding="utf-8") as f:
        testo = f.read()

    # Sostituisci variabili
    testo = testo.replace("{nome}", nome).replace("{citta}", citta)

    # Risolvi blocchi [TIPO:x|y]...[/TIPO]
    def sostituisci_blocco(match):
        tipi_blocco = match.group(1).split("|")
        contenuto = match.group(2)
        if tipo in tipi_blocco:
            return contenuto.strip()
        return ""

    testo = re.sub(
        r"\[TIPO:([^\]]+)\](.*?)\[/TIPO\]",
        sostituisci_blocco,
        testo,
        flags=re.DOTALL,
    )

    # Pulisci righe vuote multiple
    testo = re.sub(r"\n{3,}", "\n\n", testo)
    return testo.strip()


def get_gmail_service():
    creds = None
    if os.path.exists(GMAIL_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(GMAIL_TOKEN_FILE, GMAIL_SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                GMAIL_CREDENTIALS_FILE, GMAIL_SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open(GMAIL_TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def crea_bozza(service, to_email: str, subject: str, body: str) -> str:
    message = MIMEText(body, "plain", "utf-8")
    message["to"] = to_email
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    draft = service.users().drafts().create(
        userId="me", body={"message": {"raw": raw}}
    ).execute()
    return draft["id"]


def crea_bozze_per_candidati(candidati: list[dict]) -> list[dict]:
    service = get_gmail_service()
    risultati = []
    for c in candidati:
        lingua = detect_lingua(c["email"])
        body = render_template(c["tipo"], lingua, c["nome"], c["citta"])

        if lingua == "en":
            subject = f"Partnership proposal — LocalisGuide × {c['nome']}"
        else:
            subject = f"Collaborazione LocalisGuide × {c['nome']}"

        draft_id = crea_bozza(service, c["email"], subject, body)
        risultati.append({**c, "draft_id": draft_id})
        print(f"  Bozza creata per {c['nome']} <{c['email']}> — {draft_id}")
    return risultati
```

- [ ] **Step 4: Esegui test**

```powershell
C:/Python314/python.exe -m pytest tests/test_drafts.py -v
```
Expected: tutti i test PASS

- [ ] **Step 5: Commit**

```bash
git add marketing/outreach/drafts.py marketing/outreach/tests/test_drafts.py
git commit -m "feat(outreach): Gmail draft creator con template rendering e detect lingua"
```

---

## Task 6: Sync analytics (`sync.py`)

**Files:**
- Create: `marketing/outreach/sync.py`
- Create: `marketing/outreach/tests/test_sync.py`

- [ ] **Step 1: Scrivi il test**

```python
# marketing/outreach/tests/test_sync.py
import pytest

def test_parse_registry_estrae_slug():
    from sync import parse_partner_registry
    testo = """
| 001 | `london-bar` | London Bar | Via Principe Amedeo | Bar | 7 | — | 2026-05-21 | file | note |
| 002 | `paesaggi` | Paesaggi | Centro Bari | Negozio | 1 | — | 2026-05-21 | file | note |
"""
    result = parse_partner_registry(testo)
    assert len(result) == 2
    assert result[0]["slug"] == "london-bar"
    assert result[0]["nome"] == "London Bar"
    assert result[1]["slug"] == "paesaggi"

def test_calcola_quota_partner():
    from sync import calcola_quota
    assert calcola_quota(100.0) == 25.0
    assert calcola_quota(0.0) == 0.0

def test_calcola_cr():
    from sync import calcola_cr
    assert calcola_cr(visitatori=100, acquisti=5) == "5.00%"
    assert calcola_cr(visitatori=0, acquisti=0) == "0.00%"
```

- [ ] **Step 2: Esegui il test — deve fallire**

```powershell
C:/Python314/python.exe -m pytest tests/test_sync.py -v
```
Expected: `ModuleNotFoundError: No module named 'sync'`

- [ ] **Step 3: Implementa `sync.py`**

```python
# marketing/outreach/sync.py
import re
import csv
import os
from config import PARTNER_REGISTRY_PATH
from sheets import upsert_analytics


def parse_partner_registry(testo: str) -> list[dict]:
    pattern = re.compile(
        r"\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|"
    )
    risultati = []
    for match in pattern.finditer(testo):
        risultati.append({
            "slug": match.group(1).strip(),
            "nome": match.group(2).strip(),
        })
    return risultati


def calcola_quota(revenue_lorda: float) -> float:
    return round(revenue_lorda * 0.25, 2)


def calcola_cr(visitatori: int, acquisti: int) -> str:
    if visitatori == 0:
        return "0.00%"
    return f"{(acquisti / visitatori * 100):.2f}%"


def sync_da_registry():
    with open(PARTNER_REGISTRY_PATH, encoding="utf-8") as f:
        testo = f.read()
    partner = parse_partner_registry(testo)
    for p in partner:
        row = {
            "slug": p["slug"],
            "nome": p["nome"],
            "periodo_da": "",
            "periodo_a": "",
            "visitatori": "",
            "preview_ascoltate": "",
            "checkout_iniziati": "",
            "acquisti": "",
            "revenue_lorda": "",
            "quota_partner_25pct": "",
            "cr_visit_buy": "",
        }
        upsert_analytics(row)
        print(f"  Sync: {p['slug']} — {p['nome']}")


def sync_da_csv(csv_path: str):
    """Importa un CSV export GA4/Stripe con colonne: slug, visitatori, acquisti, revenue_lorda"""
    if not os.path.exists(csv_path):
        print(f"  File non trovato: {csv_path}")
        return
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            visitatori = int(row.get("visitatori", 0))
            acquisti = int(row.get("acquisti", 0))
            revenue = float(row.get("revenue_lorda", 0))
            upsert_analytics({
                "slug": row["slug"],
                "nome": row.get("nome", ""),
                "periodo_da": row.get("periodo_da", ""),
                "periodo_a": row.get("periodo_a", ""),
                "visitatori": visitatori,
                "preview_ascoltate": row.get("preview_ascoltate", ""),
                "checkout_iniziati": row.get("checkout_iniziati", ""),
                "acquisti": acquisti,
                "revenue_lorda": revenue,
                "quota_partner_25pct": calcola_quota(revenue),
                "cr_visit_buy": calcola_cr(visitatori, acquisti),
            })
            print(f"  Aggiornato: {row['slug']}")
```

- [ ] **Step 4: Esegui test**

```powershell
C:/Python314/python.exe -m pytest tests/test_sync.py -v
```
Expected: tutti i test PASS

- [ ] **Step 5: Commit**

```bash
git add marketing/outreach/sync.py marketing/outreach/tests/test_sync.py
git commit -m "feat(outreach): sync analytics da partners-registry e CSV GA4/Stripe"
```

---

## Task 7: CLI entry point (`run.py`)

**Files:**
- Create: `marketing/outreach/run.py`

- [ ] **Step 1: Crea `run.py`**

```python
# marketing/outreach/run.py
import argparse
import sys
import os

# Assicura import relativi corretti
sys.path.insert(0, os.path.dirname(__file__))


def cmd_scrape(args):
    from scraper import scrape_candidati
    from sheets import append_candidato
    tipi = [t.strip() for t in args.type.split(",")]
    print(f"Scraping: city={args.city}, tipi={tipi}")
    candidati = scrape_candidati(args.city, tipi)
    print(f"Trovati {len(candidati)} candidati")
    for c in candidati:
        append_candidato(c)
        print(f"  + {c['nome']} <{c['email']}>")
    print("Done.")


def cmd_drafts(args):
    from sheets import get_candidati_da_contattare, update_stato, SHEET_CANDIDATI
    from drafts import crea_bozze_per_candidati
    import datetime

    candidati = get_candidati_da_contattare()
    if args.id:
        candidati = [c for c in candidati if str(c.get("id")) == str(args.id)]

    if not candidati:
        print("Nessun candidato da contattare.")
        return

    print(f"Creo bozze per {len(candidati)} candidati...")
    risultati = crea_bozze_per_candidati(candidati)

    from sheets import append_outreach
    for i, c in enumerate(risultati):
        update_stato(SHEET_CANDIDATI, i, "bozza_pronta")
        append_outreach({
            "id": c["id"],
            "nome": c["nome"],
            "email": c["email"],
            "tipo": c["tipo"],
            "citta": c["citta"],
            "stato": "bozza_pronta",
            "data_primo_contatto": datetime.date.today().isoformat(),
            "data_ultimo_contatto": datetime.date.today().isoformat(),
            "n_tentativi": "1",
            "sentiment_risposta": "nessuno",
            "slug_qr": "",
            "note": "",
        })
    print(f"Bozze create: {len(risultati)}")


def cmd_sync(args):
    from sync import sync_da_registry, sync_da_csv
    print("Sync da partners-registry...")
    sync_da_registry()
    csv_path = os.path.join(os.path.dirname(__file__), "..", "exports", "ga4-export.csv")
    if os.path.exists(csv_path):
        print(f"Sync da CSV: {csv_path}")
        sync_da_csv(csv_path)
    print("Sync completo.")


def cmd_status(args):
    from sheets import get_candidati_da_contattare, get_outreach_all
    candidati = get_candidati_da_contattare()
    outreach = get_outreach_all()
    stati = {}
    for r in outreach:
        s = r.get("stato", "?")
        stati[s] = stati.get(s, 0) + 1
    print("=== LocalisGuide Outreach Status ===")
    print(f"  Da contattare:    {len(candidati)}")
    for stato, n in stati.items():
        print(f"  {stato}: {n}")
    print("====================================")


def main():
    parser = argparse.ArgumentParser(description="LocalisGuide Partner Outreach")
    sub = parser.add_subparsers(dest="cmd")

    p_scrape = sub.add_parser("scrape", help="Trova candidati via Firecrawl")
    p_scrape.add_argument("--city", required=True)
    p_scrape.add_argument("--type", required=True, help="es. hotel,bb,bar")

    p_drafts = sub.add_parser("drafts", help="Crea bozze Gmail")
    p_drafts.add_argument("--id", help="ID specifico (opzionale)")

    sub.add_parser("sync", help="Aggiorna tab Analytics")
    sub.add_parser("status", help="Stampa sommario")

    args = parser.parse_args()
    if args.cmd == "scrape":
        cmd_scrape(args)
    elif args.cmd == "drafts":
        cmd_drafts(args)
    elif args.cmd == "sync":
        cmd_sync(args)
    elif args.cmd == "status":
        cmd_status(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test smoke CLI**

```powershell
cd marketing/outreach
C:/Python314/python.exe run.py --help
```
Expected: mostra i 4 sottocomandi (scrape, drafts, sync, status)

- [ ] **Step 3: Commit**

```bash
git add marketing/outreach/run.py
git commit -m "feat(outreach): CLI entry point con scrape/drafts/sync/status"
```

---

## Task 8: Setup credenziali Google (manuale)

**Files:** nessuno da creare — procedura di setup una tantum.

- [ ] **Step 1: Crea Google Sheet**

1. Vai su [sheets.google.com](https://sheets.google.com) e crea un nuovo foglio vuoto
2. Nominalo `LocalisGuide Outreach`
3. Copia l'ID dal URL: `https://docs.google.com/spreadsheets/d/QUESTO_ID/edit`
4. Salva in `config.py` come `GOOGLE_SHEET_ID` oppure in variabile d'ambiente `LOCALIS_SHEET_ID`

- [ ] **Step 2: Service Account per Google Sheets**

1. Vai su [console.cloud.google.com](https://console.cloud.google.com)
2. Crea progetto `localis-outreach` (o usa uno esistente)
3. Abilita **Google Sheets API**
4. IAM & Admin → Service Accounts → Crea service account `localis-sheets`
5. Genera chiave JSON → scarica → salva come `marketing/outreach/credentials/google-service-account.json`
6. Copia l'email del service account (es. `localis-sheets@progetto.iam.gserviceaccount.com`)
7. Apri il Google Sheet → Condividi → incolla l'email del service account con ruolo **Editor**

- [ ] **Step 3: OAuth2 per Gmail**

1. Nella stessa console Cloud, abilita **Gmail API**
2. OAuth consent screen → External → aggiungi la tua email come test user
3. Credentials → Crea OAuth2 client ID → tipo: Desktop app
4. Scarica JSON → salva come `marketing/outreach/credentials/gmail-oauth2.json`

- [ ] **Step 4: Test autenticazione Sheets**

```powershell
cd marketing/outreach
C:/Python314/python.exe -c "from sheets import get_spreadsheet; s = get_spreadsheet(); print('OK:', s.title)"
```
Expected: `OK: LocalisGuide Outreach`

- [ ] **Step 5: Test autenticazione Gmail (aprirà browser una volta)**

```powershell
C:/Python314/python.exe -c "from drafts import get_gmail_service; s = get_gmail_service(); print('Gmail OK')"
```
Expected: browser si apre, autorizzi, poi `Gmail OK` nel terminale. Il token viene salvato in `credentials/gmail-token.json`.

---

## Task 9: Test end-to-end e verifica

- [ ] **Step 1: Esegui tutti i test unitari**

```powershell
cd marketing/outreach
C:/Python314/python.exe -m pytest tests/ -v
```
Expected: tutti PASS

- [ ] **Step 2: Smoke test scrape (1 tipo, città piccola)**

```powershell
C:/Python314/python.exe run.py scrape --city "alberobello" --type "bb"
```
Expected: stampa candidati trovati, nessun errore, righe appaiono nel tab Candidati del Google Sheet.

- [ ] **Step 3: Smoke test drafts (un candidato)**

Nel Google Sheet, prendi l'ID di un candidato con email reale tua (per test). Poi:
```powershell
C:/Python314/python.exe run.py drafts --id 1
```
Expected: bozza compare in Gmail → Bozze. Verificare che il template sia compilato correttamente e il blocco tipo sia quello giusto.

- [ ] **Step 4: Smoke test sync**

```powershell
C:/Python314/python.exe run.py sync
```
Expected: tab Analytics aggiornata con london-bar e paesaggi dal registry.

- [ ] **Step 5: Status**

```powershell
C:/Python314/python.exe run.py status
```
Expected: stampa sommario con conteggi per stato.

- [ ] **Step 6: Commit finale**

```bash
git add marketing/outreach/
git commit -m "feat(outreach): sistema partner outreach completo — scrape+drafts+sync+CLI"
```
