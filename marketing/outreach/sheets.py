import datetime
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
    if "stato" not in headers:
        raise ValueError(f"Colonna 'stato' non trovata nel tab '{tab_name}'. Headers: {headers}")
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


def estrai_email_da_records(records: list[dict]) -> set[str]:
    """Set di email (lowercase) presenti nei record, ignorando le vuote."""
    return {
        str(r.get("email", "")).strip().lower()
        for r in records
        if str(r.get("email", "")).strip()
    }


def update_outreach_fields(row_index: int, fields: dict):
    """Aggiorna celle specifiche di una riga Outreach (row_index 0-based sui
    record, +2 per saltare header e passare a 1-based)."""
    sheet = get_spreadsheet()
    tab = get_or_create_tab(sheet, SHEET_OUTREACH)
    headers = tab.row_values(1)
    for campo, valore in fields.items():
        if campo not in headers:
            raise ValueError(f"Colonna '{campo}' non in Outreach. Headers: {headers}")
        col = headers.index(campo) + 1
        tab.update_cell(row_index + 2, col, str(valore))


def seleziona_followup(records: list[dict], oggi, giorni_soglia: dict,
                       max_tentativi: int = 3) -> list[tuple]:
    """Righe Outreach pronte per un follow-up: gia contattate, senza risposta,
    con abbastanza giorni dall'ultimo contatto. Pura, niente rete.
    Ritorna (row_index, record, n_tentativi_corrente)."""
    pronti = []
    for i, r in enumerate(records):
        stato = str(r.get("stato", "")).strip().lower()
        if stato not in ("inviata", "follow_up"):
            continue
        sentiment = str(r.get("sentiment_risposta", "")).strip().lower()
        if sentiment not in ("", "nessuno"):
            continue
        try:
            n = int(str(r.get("n_tentativi", "1")).strip() or "1")
        except ValueError:
            n = 1
        if n >= max_tentativi:
            continue
        soglia = giorni_soglia.get(n)
        if soglia is None:
            continue
        try:
            ultimo = datetime.date.fromisoformat(
                str(r.get("data_ultimo_contatto", "")).strip()
            )
        except ValueError:
            continue
        if (oggi - ultimo).days < soglia:
            continue
        pronti.append((i, r, n))
    return pronti


def get_email_conosciute() -> set[str]:
    """Email già in pipeline: candidati scrapati + contattati/partner.
    Usata per non riproporre lo stesso contatto a ogni nuovo scrape."""
    sheet = get_spreadsheet()
    candidati = get_or_create_tab(sheet, SHEET_CANDIDATI).get_all_records()
    outreach = get_or_create_tab(sheet, SHEET_OUTREACH).get_all_records()
    return estrai_email_da_records(candidati) | estrai_email_da_records(outreach)


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
