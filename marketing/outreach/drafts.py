import re
import os
import base64
from email.mime.text import MIMEText

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
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from config import GMAIL_CREDENTIALS_FILE, GMAIL_TOKEN_FILE

    GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]

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
