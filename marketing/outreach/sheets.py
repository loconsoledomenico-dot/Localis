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
