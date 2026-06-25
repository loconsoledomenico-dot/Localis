import re
import os
import base64
from email.mime.text import MIMEText

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")


def detect_lingua(email: str) -> str:
    # Lingua dedotta dal TLD del dominio. Default IT: i locali pugliesi con
    # email .com/.net sono quasi sempre a gestione italiana.
    dominio = email.rsplit("@", 1)[-1].lower()
    if dominio.endswith((".de", ".at")):
        return "de"
    if dominio.endswith((".co.uk", ".uk", ".ie")):
        return "en"
    return "it"


def render_template(tipo: str, lingua: str, nome: str, citta: str,
                    variante: str = "outreach") -> str:
    fname = f"{variante}_{lingua}.txt"
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


def _subject_followup(variante: str, lingua: str, nome: str) -> str:
    if variante == "followup2":  # break-up
        return {
            "en": f"Closing the loop — LocalisGuide × {nome}",
            "de": f"Letzte Nachricht — LocalisGuide × {nome}",
            "it": f"Ultimo messaggio — LocalisGuide × {nome}",
        }[lingua]
    return {  # followup1: re del primo contatto
        "en": f"Re: Partnership proposal — LocalisGuide × {nome}",
        "de": f"Re: Partnerschaft — LocalisGuide × {nome}",
        "it": f"Re: Collaborazione LocalisGuide × {nome}",
    }[lingua]


def crea_bozza_followup(service, record: dict, variante: str) -> str:
    lingua = detect_lingua(record["email"])
    body = render_template(record["tipo"], lingua, record["nome"],
                           record["citta"], variante)
    subject = _subject_followup(variante, lingua, record["nome"])
    return crea_bozza(service, record["email"], subject, body)


def crea_bozze_per_candidati(candidati: list[dict]) -> list[dict]:
    if not candidati:
        return []
    service = get_gmail_service()
    risultati = []
    for c in candidati:
        lingua = detect_lingua(c["email"])
        body = render_template(c["tipo"], lingua, c["nome"], c["citta"])

        if lingua == "en":
            subject = f"Partnership proposal — LocalisGuide × {c['nome']}"
        elif lingua == "de":
            subject = f"Partnerschaft — LocalisGuide × {c['nome']}"
        else:
            subject = f"Collaborazione LocalisGuide × {c['nome']}"

        draft_id = crea_bozza(service, c["email"], subject, body)
        risultati.append({**c, "draft_id": draft_id})
        print(f"  Bozza creata per {c['nome']} <{c['email']}> — {draft_id}")
    return risultati
