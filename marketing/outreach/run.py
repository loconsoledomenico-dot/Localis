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
