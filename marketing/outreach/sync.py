import re
import csv
import os
from config import PARTNER_REGISTRY_PATH
from sheets import upsert_analytics


def parse_partner_registry(testo: str) -> list[dict]:
    pattern = re.compile(
        r"\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|"
    )
    risultati = []
    for match in pattern.finditer(testo):
        risultati.append({
            "slug": match.group(1).strip(),
            "nome": match.group(2).strip(),
        })
    return risultati


def calcola_quota(revenue_lorda: float) -> float:
    return round(revenue_lorda * 0.25, 2)


def calcola_cr(visitatori: int, acquisti: int) -> str:
    if visitatori == 0:
        return "0.00%"
    return f"{(acquisti / visitatori * 100):.2f}%"


def sync_da_registry():
    with open(PARTNER_REGISTRY_PATH, encoding="utf-8") as f:
        testo = f.read()
    partner = parse_partner_registry(testo)
    for p in partner:
        row = {
            "slug": p["slug"],
            "nome": p["nome"],
            "periodo_da": "",
            "periodo_a": "",
            "visitatori": "",
            "preview_ascoltate": "",
            "checkout_iniziati": "",
            "acquisti": "",
            "revenue_lorda": "",
            "quota_partner_25pct": "",
            "cr_visit_buy": "",
        }
        upsert_analytics(row)
        print(f"  Sync: {p['slug']} — {p['nome']}")


def sync_da_csv(csv_path: str):
    """Importa un CSV export GA4/Stripe con colonne: slug, visitatori, acquisti, revenue_lorda"""
    if not os.path.exists(csv_path):
        print(f"  File non trovato: {csv_path}")
        return
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            visitatori = int(row.get("visitatori", 0))
            acquisti = int(row.get("acquisti", 0))
            revenue = float(row.get("revenue_lorda", 0))
            upsert_analytics({
                "slug": row["slug"],
                "nome": row.get("nome", ""),
                "periodo_da": row.get("periodo_da", ""),
                "periodo_a": row.get("periodo_a", ""),
                "visitatori": visitatori,
                "preview_ascoltate": row.get("preview_ascoltate", ""),
                "checkout_iniziati": row.get("checkout_iniziati", ""),
                "acquisti": acquisti,
                "revenue_lorda": revenue,
                "quota_partner_25pct": calcola_quota(revenue),
                "cr_visit_buy": calcola_cr(visitatori, acquisti),
            })
            print(f"  Aggiornato: {row['slug']}")
