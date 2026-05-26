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
        if "@" not in email:
            continue
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
