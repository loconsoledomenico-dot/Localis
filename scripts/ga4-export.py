#!/usr/bin/env python3
"""Estrae i dati GA4 via Data API e produce marketing/exports/ga4-export.csv.

Il CSV ha esattamente le colonne che si aspetta marketing/outreach/sync.py::sync_da_csv,
quindi dopo l'export basta `python marketing/outreach/run.py sync`.

Uso:
    python scripts/ga4-export.py --property 123456789
    python scripts/ga4-export.py --property 123456789 --from 2026-05-01 --to 2026-08-23
    python scripts/ga4-export.py --discover      # elenca le property visibili (serve Admin API attiva)

Auth: service account in marketing/outreach/credentials/google-service-account.json
      (lo stesso usato per Google Sheets). Va aggiunto come Viewer sulla property GA4.
"""

import argparse
import csv
import os
import sys

import requests
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRED_FILE = os.path.join(ROOT, "marketing", "outreach", "credentials", "google-service-account.json")
OUT_CSV = os.path.join(ROOT, "marketing", "exports", "ga4-export.csv")

SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]
DATA_API = "https://analyticsdata.googleapis.com/v1beta"
ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta"

# Nomi eventi come appaiono DAVVERO in GA4 (verificati sulla property 538539129).
#
# Attenzione: la property riceve eventi da due sorgenti diverse — il codice del sito
# (window.localisTrack) e un tag esterno non presente nel repo (probabilmente GTM).
# Qui contiamo solo gli eventi del sito, tranne per gli acquisti dove il sito non
# produce nulla (vedi sotto). Usa --events per rivedere l'elenco completo.
#
# audio_preview_played e preview_played arrivano da componenti diversi
# (HeroAudioSample / pagine crociera vs TrailerPlayer): sommarli e' corretto.
EV_PREVIEW = ("audio_preview_played", "preview_played")

# checkout_started = evento del sito (GuideBuilder, PriceCard, pagine crociera).
# NON includere begin_checkout: e' del tag esterno e duplicherebbe la stessa azione.
EV_CHECKOUT = ("checkout_started",)

# Il sito invia purchase_completed (thanks.astro) ma in GA4 non e' mai arrivato:
# gli unici acquisti registrati sono sotto il nome 'purchase', dal tag esterno.
# Contiamo entrambi e segnaliamo se compaiono insieme (rischio doppio conteggio).
EV_PURCHASE_SITE = ("purchase_completed",)
EV_PURCHASE_EXT = ("purchase",)
EV_PURCHASE = EV_PURCHASE_SITE + EV_PURCHASE_EXT

# La dimensione partner_id e' registrata sia come user property sia come event param.
# Proviamo prima quella user-scoped, poi ripieghiamo su quella event-scoped.
PARTNER_DIMS = ("customUser:partner_id", "customEvent:partner_id")

CSV_HEADERS = [
    "slug", "nome", "periodo_da", "periodo_a",
    "visitatori", "preview_ascoltate", "checkout_iniziati",
    "acquisti", "revenue_lorda",
]


def get_token():
    if not os.path.exists(CRED_FILE):
        sys.exit(f"ERRORE: service account non trovato: {CRED_FILE}")
    creds = Credentials.from_service_account_file(CRED_FILE, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token, creds.service_account_email


def api_error(resp):
    try:
        return resp.json().get("error", {}).get("message", resp.text[:400])
    except ValueError:
        return resp.text[:400]


def discover(token):
    r = requests.get(f"{ADMIN_API}/accountSummaries",
                     headers={"Authorization": f"Bearer {token}"}, timeout=30)
    if r.status_code != 200:
        print(f"Admin API HTTP {r.status_code}: {api_error(r)}", file=sys.stderr)
        return 1
    found = False
    for acc in r.json().get("accountSummaries", []):
        print(f"Account: {acc.get('displayName')}")
        for prop in acc.get("propertySummaries", []):
            # property e' del tipo "properties/123456789"
            pid = prop.get("property", "").split("/")[-1]
            print(f"  property_id={pid}  {prop.get('displayName')}")
            found = True
    if not found:
        print("Nessuna property visibile a questo service account.")
    return 0


def list_events(token, prop, d_from, d_to):
    """Elenca tutti gli eventi presenti in GA4, segnando quali lo script conta."""
    r = run_report(token, prop, {
        "dateRanges": [{"startDate": d_from, "endDate": d_to}],
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}],
        "limit": 500,
    })
    if r.status_code != 200:
        print(f"ERRORE HTTP {r.status_code}: {api_error(r)}", file=sys.stderr)
        return 1
    mapped = {}
    for name in EV_PREVIEW:
        mapped[name] = "preview_ascoltate"
    for name in EV_CHECKOUT:
        mapped[name] = "checkout_iniziati"
    for name in EV_PURCHASE:
        mapped[name] = "acquisti"

    print(f"Eventi in GA4 dal {d_from} al {d_to}:\n")
    seen = set()
    for dims, mets in sorted(rows_of(r.json()), key=lambda x: -int(x[1][0] or 0)):
        name = dims[0]
        seen.add(name)
        col = mapped.get(name)
        flag = f"-> {col}" if col else "   (ignorato)"
        print(f"  {name:<28} {mets[0]:>7}  {flag}")

    missing = [n for n in mapped if n not in seen]
    if missing:
        print("\nEventi attesi dallo script ma MAI arrivati in GA4:", file=sys.stderr)
        for name in missing:
            print(f"  {name}  (doveva alimentare {mapped[name]})", file=sys.stderr)
    return 0


def run_report(token, prop, body):
    r = requests.post(f"{DATA_API}/properties/{prop}:runReport",
                      headers={"Authorization": f"Bearer {token}"},
                      json=body, timeout=60)
    return r


def rows_of(payload):
    """Normalizza la risposta runReport in una lista di (dimensioni[], metriche[])."""
    for row in payload.get("rows", []):
        dims = [d.get("value", "") for d in row.get("dimensionValues", [])]
        mets = [m.get("value", "0") for m in row.get("metricValues", [])]
        yield dims, mets


def pick_partner_dim(token, prop, d_from, d_to):
    """Sceglie la prima dimensione partner_id che la property accetta davvero."""
    last_err = None
    for dim in PARTNER_DIMS:
        r = run_report(token, prop, {
            "dateRanges": [{"startDate": d_from, "endDate": d_to}],
            "dimensions": [{"name": dim}],
            "metrics": [{"name": "activeUsers"}],
            "limit": 1,
        })
        if r.status_code == 200:
            return dim, None
        last_err = f"{dim} -> HTTP {r.status_code}: {api_error(r)}"
        print(f"  dimensione non disponibile: {last_err}", file=sys.stderr)
    return None, last_err


def export(prop, d_from, d_to):
    token, sa_email = get_token()
    print(f"Service account: {sa_email}")
    print(f"Property: {prop}   Periodo: {d_from} -> {d_to}")

    dim, err = pick_partner_dim(token, prop, d_from, d_to)
    if dim is None:
        print("\nNessuna dimensione partner_id utilizzabile.", file=sys.stderr)
        print("Verifica che in GA4 > Admin > Custom definitions esista una custom dimension", file=sys.stderr)
        print("con parameter name 'partner_id' (user-scoped o event-scoped).", file=sys.stderr)
        print(f"Ultimo errore: {err}", file=sys.stderr)
        return 1
    print(f"Dimensione partner usata: {dim}")

    # 1) Visitatori per partner
    r = run_report(token, prop, {
        "dateRanges": [{"startDate": d_from, "endDate": d_to}],
        "dimensions": [{"name": dim}],
        "metrics": [{"name": "activeUsers"}],
        "limit": 10000,
    })
    if r.status_code != 200:
        print(f"ERRORE report visitatori HTTP {r.status_code}: {api_error(r)}", file=sys.stderr)
        return 1
    data = {}
    for dims, mets in rows_of(r.json()):
        slug = dims[0] or "(direct)"
        data.setdefault(slug, {}).update({"visitatori": int(mets[0] or 0)})

    # 2) Eventi per partner
    r = run_report(token, prop, {
        "dateRanges": [{"startDate": d_from, "endDate": d_to}],
        "dimensions": [{"name": dim}, {"name": "eventName"}],
        "metrics": [{"name": "eventCount"}],
        "limit": 100000,
    })
    if r.status_code != 200:
        print(f"ERRORE report eventi HTTP {r.status_code}: {api_error(r)}", file=sys.stderr)
        return 1
    n_site_purchase = 0
    n_ext_purchase = 0
    for dims, mets in rows_of(r.json()):
        slug = dims[0] or "(direct)"
        event = dims[1]
        n = int(mets[0] or 0)
        rec = data.setdefault(slug, {})
        if event in EV_PREVIEW:
            rec["preview_ascoltate"] = rec.get("preview_ascoltate", 0) + n
        elif event in EV_CHECKOUT:
            rec["checkout_iniziati"] = rec.get("checkout_iniziati", 0) + n
        elif event in EV_PURCHASE:
            rec["acquisti"] = rec.get("acquisti", 0) + n
            if event in EV_PURCHASE_SITE:
                n_site_purchase += n
            else:
                n_ext_purchase += n

    if n_site_purchase and n_ext_purchase:
        print(f"\nATTENZIONE: presenti sia {EV_PURCHASE_SITE[0]} ({n_site_purchase}) sia "
              f"{EV_PURCHASE_EXT[0]} ({n_ext_purchase}).", file=sys.stderr)
        print("Se tracciano lo stesso acquisto la colonna 'acquisti' e' raddoppiata: "
              "tieni una sola sorgente in EV_PURCHASE.", file=sys.stderr)
    elif n_site_purchase == 0 and n_ext_purchase:
        print(f"\nNota: nessun {EV_PURCHASE_SITE[0]} in GA4; i {n_ext_purchase} acquisti "
              f"vengono dall'evento '{EV_PURCHASE_EXT[0]}' del tag esterno.", file=sys.stderr)

    if not data:
        print("Nessuna riga restituita da GA4 per questo periodo.")
        return 0

    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        w.writeheader()
        for slug in sorted(data):
            rec = data[slug]
            w.writerow({
                "slug": slug,
                "nome": "",
                "periodo_da": d_from,
                "periodo_a": d_to,
                "visitatori": rec.get("visitatori", 0),
                "preview_ascoltate": rec.get("preview_ascoltate", 0),
                "checkout_iniziati": rec.get("checkout_iniziati", 0),
                "acquisti": rec.get("acquisti", 0),
                # revenue: GA4 non e' la fonte di verita' qui (purchase_completed e' un
                # evento custom senza valore monetario). Si compila da Stripe.
                "revenue_lorda": "",
            })

    print(f"\nScritte {len(data)} righe in {OUT_CSV}")
    print("Prossimo passo: python marketing/outreach/run.py sync")
    return 0


def main():
    ap = argparse.ArgumentParser(description="Export dati GA4 -> CSV per la pipeline outreach")
    ap.add_argument("--property", help="ID numerico della property GA4 (non il G-XXXX)")
    ap.add_argument("--from", dest="d_from", default="90daysAgo", help="data inizio (YYYY-MM-DD o NdaysAgo)")
    ap.add_argument("--to", dest="d_to", default="today", help="data fine (YYYY-MM-DD o today)")
    ap.add_argument("--discover", action="store_true", help="elenca le property accessibili")
    ap.add_argument("--events", action="store_true",
                    help="elenca gli eventi presenti in GA4 e come vengono mappati")
    args = ap.parse_args()

    if args.discover:
        token, sa_email = get_token()
        print(f"Service account: {sa_email}\n")
        return discover(token)

    if not args.property:
        ap.error("serve --property <ID numerico> (oppure --discover)")

    if args.events:
        token, _ = get_token()
        return list_events(token, args.property, args.d_from, args.d_to)
    return export(args.property, args.d_from, args.d_to)


if __name__ == "__main__":
    sys.exit(main())
