# marketing/outreach/run.py
import argparse
import sys
import os

# Assicura import relativi corretti
sys.path.insert(0, os.path.dirname(__file__))


def cmd_scrape(args):
    from scraper import scrape_candidati
    from sheets import append_candidato, get_email_conosciute
    tipi = [t.strip() for t in args.type.split(",")]
    print(f"Scraping: city={args.city}, tipi={tipi}")
    candidati = scrape_candidati(args.city, tipi)
    print(f"Trovati {len(candidati)} candidati")

    # Dedup vs email già scrapate/contattate: niente doppioni a ogni run
    conosciute = get_email_conosciute()
    nuovi = 0
    gia_noti = 0
    for c in candidati:
        if c["email"].strip().lower() in conosciute:
            gia_noti += 1
            continue
        append_candidato(c)
        conosciute.add(c["email"].strip().lower())
        nuovi += 1
        print(f"  + {c['nome']} <{c['email']}>")
    print(f"Done. Nuovi: {nuovi} · Gia noti (skip): {gia_noti}")


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

    # Build id→original_index map so update_stato hits the right sheet row
    id_to_idx = {str(c.get("id")): i for i, c in enumerate(candidati)}

    from sheets import append_outreach
    for c in risultati:
        orig_idx = id_to_idx.get(str(c.get("id")))
        if orig_idx is not None:
            update_stato(SHEET_CANDIDATI, orig_idx, "bozza_pronta")
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


def cmd_followup(args):
    from sheets import get_outreach_all, seleziona_followup, update_outreach_fields
    from drafts import get_gmail_service, crea_bozza_followup
    from config import FOLLOWUP_GIORNI, FOLLOWUP_MAX_TENTATIVI
    import datetime

    oggi = datetime.date.today()
    pronti = seleziona_followup(
        get_outreach_all(), oggi, FOLLOWUP_GIORNI, FOLLOWUP_MAX_TENTATIVI
    )
    if args.id:
        pronti = [t for t in pronti if str(t[1].get("id")) == str(args.id)]

    if not pronti:
        print("Nessun follow-up da fare.")
        return

    print(f"Follow-up pronti: {len(pronti)}")
    service = get_gmail_service()
    for row_index, record, n in pronti:
        variante = f"followup{n}"
        draft_id = crea_bozza_followup(service, record, variante)
        update_outreach_fields(row_index, {
            "stato": "follow_up",
            "n_tentativi": n + 1,
            "data_ultimo_contatto": oggi.isoformat(),
        })
        print(f"  ~ {record['nome']} <{record['email']}> — "
              f"tentativo {n + 1} ({variante}) — {draft_id}")
    print(f"Bozze follow-up create: {len(pronti)}")


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

    p_fu = sub.add_parser("followup", help="Crea bozze follow-up per chi non ha risposto")
    p_fu.add_argument("--id", help="ID specifico (opzionale)")

    sub.add_parser("sync", help="Aggiorna tab Analytics")
    sub.add_parser("status", help="Stampa sommario")

    args = parser.parse_args()
    if args.cmd == "scrape":
        cmd_scrape(args)
    elif args.cmd == "drafts":
        cmd_drafts(args)
    elif args.cmd == "followup":
        cmd_followup(args)
    elif args.cmd == "sync":
        cmd_sync(args)
    elif args.cmd == "status":
        cmd_status(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
