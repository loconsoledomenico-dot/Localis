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
