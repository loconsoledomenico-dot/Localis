import re
import datetime
from firecrawl import FirecrawlApp

try:  # SDK v2 espone ScrapeOptions dal package
    from firecrawl import ScrapeOptions
except Exception:  # fallback per layout interni diversi
    from firecrawl.v2.types import ScrapeOptions

from config import FIRECRAWL_API_KEY, EMAIL_EXCLUDE_PATTERNS

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# Email spazzatura oltre ai pattern di config (asset, tracking, esempi)
EMAIL_EXCLUDE_EXTRA = ["sentry", "wixpress", "example.com", ".png", ".jpg", ".jpeg", ".webp", "@2x"]

# Domini aggregatori: non sono il contatto diretto del locale
AGGREGATORS = (
    "booking.com", "tripadvisor", "thehotelguru", "expedia", "hotels.com",
    "airbnb", "trivago", "agoda", "hotel.info", "holidaycheck", "lastminute",
    "edreams", "kayak", "hotelbb.com", "hotel-bb.com",
)

# Query per tipo: termini che pescano il locale singolo, non le directory
TIPO_QUERY = {
    "bb": "b&b masseria agriturismo {city} Puglia contatti email",
    "hotel": "hotel {city} Puglia contatti email",
    "bar": "bar caffe {city} Puglia contatti email",
    "ristorante": "ristorante {city} Puglia contatti email",
    "infopoint": "info point turismo {city} Puglia email",
    "negozio": "negozio prodotti tipici {city} Puglia contatti email",
}


# Separatori tipici nei <title>: pipe, dash/en/em con spazi, due punti.
# Il trattino richiede spazi su entrambi i lati per non spezzare "Santa-Teresa".
SEPARATORI_TITOLO = re.compile(r"\s*[|·–—]\s*|\s+-\s+|\s*:\s+")

# Segmenti spazzatura da scartare nel nome (boilerplate SEO / aggregatori)
NOME_JUNK = (
    "booking", "tripadvisor", "expedia", "sito ufficiale", "official site",
    "official website", "home page", "homepage", "benvenuti", "welcome",
    "contatti", "contact", "prenota", "book now", "prezzi",
)


def pulisci_nome(titolo: str, url: str) -> str:
    """Estrae un nome leggibile dal <title>: primo segmento non-spazzatura,
    fallback al dominio se il titolo è vuoto o tutto boilerplate."""
    titolo = (titolo or "").strip()
    if titolo:
        segmenti = [s.strip() for s in SEPARATORI_TITOLO.split(titolo) if s.strip()]
        for s in segmenti:
            if not any(j in s.lower() for j in NOME_JUNK):
                return s[:60]
        if segmenti:
            return segmenti[0][:60]
    # Fallback: label di dominio (es. "hotelbelvedere.it" -> "hotelbelvedere")
    dominio = re.sub(r"^https?://(www\.)?", "", url or "").split("/")[0]
    return (dominio.split(".")[0] or url or "")[:60]


def estrai_email(testo: str) -> list[str]:
    trovate = EMAIL_REGEX.findall(testo or "")
    risultati = []
    for email in trovate:
        el = email.lower()
        if any(re.search(p, el) for p in EMAIL_EXCLUDE_PATTERNS):
            continue
        if any(b in el for b in EMAIL_EXCLUDE_EXTRA):
            continue
        risultati.append(el)
    return list(set(risultati))


def deduplicazione_per_dominio(emails: list[str]) -> list[str]:
    visti = {}
    for email in emails:
        if "@" not in email:
            continue
        domain = email.split("@")[1]
        if domain not in visti:
            visti[domain] = email
    return list(visti.values())


def build_query(tipo: str, city: str) -> str:
    template = TIPO_QUERY.get(tipo, "{tipo} {city} Puglia contatti email")
    return template.format(tipo=tipo, city=city)


def scrape_candidati(city: str, tipi: list[str], limit: int = 8) -> list[dict]:
    app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    candidati = []
    id_counter = 1
    visti_email = set()

    for tipo in tipi:
        query = build_query(tipo, city)
        print(f"  Cerco: {query}")
        try:
            # scrape_options serve a ottenere il markdown della pagina:
            # senza, la search restituisce solo titolo/url/descrizione (niente email).
            risposta = app.search(query, limit=limit, scrape_options=ScrapeOptions(formats=["markdown"]))
        except Exception as e:
            print(f"  Errore Firecrawl: {type(e).__name__}: {e}")
            continue

        for r in (getattr(risposta, "web", None) or []):
            url = getattr(r, "url", "") or ""
            if any(a in url for a in AGGREGATORS):
                continue

            markdown = getattr(r, "markdown", "") or getattr(r, "description", "") or ""
            emails = deduplicazione_per_dominio(estrai_email(markdown))

            nome = pulisci_nome(getattr(r, "title", "") or "", url)

            for email in emails:
                if email in visti_email:
                    continue
                visti_email.add(email)
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
