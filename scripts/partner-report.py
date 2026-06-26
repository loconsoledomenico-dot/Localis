#!/usr/bin/env python3
"""Localis · Partner Referral Report

Query Stripe live, aggrega per partner_id, stampa tabella + salva CSV.

Usage:
    python scripts/partner-report.py
    python scripts/partner-report.py --from 2026-05-01
    python scripts/partner-report.py --partner london-bar
    python scripts/partner-report.py --csv out/report.csv

Requires:
    pip install stripe python-dotenv
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Load .env from project root
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / '.env')
except ImportError:
    pass  # dotenv optional, env vars can be set externally

import stripe
import yaml

DEFAULT_COMMISSION_RATE = 0.25
AGENT_RATE = 0.15
PARTNERS_DIR = Path(__file__).resolve().parent.parent / 'src' / 'content' / 'partners'


def commission_eur(gross_cents: int, rate: float) -> float:
    """Quota in euro su un lordo in cents, arrotondata a 2 decimali."""
    return round(gross_cents * rate / 100, 2)


def parse_frontmatter(text: str) -> dict:
    """Estrae il blocco YAML tra i primi due '---' di una scheda .mdx."""
    if not text.startswith('---'):
        return {}
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}
    data = yaml.safe_load(parts[1]) or {}
    return data if isinstance(data, dict) else {}


def load_partner_rates() -> dict[str, dict]:
    """slug -> {'rate': float, 'agent': str|None} dalle schede partner."""
    rates: dict[str, dict] = {}
    if not PARTNERS_DIR.is_dir():
        return rates
    for path in PARTNERS_DIR.glob('*.mdx'):
        fm = parse_frontmatter(path.read_text(encoding='utf-8'))
        slug = fm.get('slug')
        if not slug:
            continue
        rates[str(slug)] = {
            'rate': float(fm.get('commission_rate', DEFAULT_COMMISSION_RATE)),
            'agent': fm.get('agent'),
        }
    return rates


def fetch_sessions(created_after: datetime | None, partner_filter: str | None) -> list[dict]:
    api_key = os.environ.get('STRIPE_SECRET_KEY')
    if not api_key:
        print('ERROR: STRIPE_SECRET_KEY not set', file=sys.stderr)
        sys.exit(1)

    stripe.api_key = api_key
    sessions = []
    partner_rates = load_partner_rates()

    params: dict = {
        'limit': 100,
        'expand': [],
    }
    if created_after:
        params['created'] = {'gte': int(created_after.timestamp())}

    print('Fetching Stripe sessions...')
    count = 0
    for session in stripe.checkout.Session.list(**params).auto_paging_iter():
        count += 1
        if count % 100 == 0:
            print(f'  ...{count} sessions scanned')

        if session.get('payment_status') != 'paid':
            continue
        meta = session.get('metadata') or {}
        pid = meta.get('partner_id', '').strip()
        if not pid:
            continue
        if partner_filter and pid != partner_filter:
            continue

        gross = session.get('amount_total') or 0
        info = partner_rates.get(pid, {})
        rate = info.get('rate', DEFAULT_COMMISSION_RATE)
        agent = info.get('agent')
        sessions.append({
            'session_id': session['id'],
            'created': datetime.fromtimestamp(session['created'], tz=timezone.utc),
            'partner_id': pid,
            'product': meta.get('product', 'unknown'),
            'gross_eur': gross / 100,
            'rate': rate,
            'payout_eur': commission_eur(gross, rate),
            'agent': agent or '',
            'agent_payout_eur': commission_eur(gross, AGENT_RATE) if agent else 0.0,
            'currency': session.get('currency', 'eur').upper(),
            'customer_email': (session.get('customer_details') or {}).get('email') or '',
        })

    print(f'Scanned {count} total sessions, found {len(sessions)} with partner referral.')
    return sessions


def print_summary(sessions: list[dict]) -> None:
    if not sessions:
        print('\nNessuna vendita referral trovata.')
        return

    # Group by partner
    partners: dict[str, dict] = {}
    for s in sessions:
        pid = s['partner_id']
        if pid not in partners:
            partners[pid] = {'count': 0, 'gross': 0.0, 'payout': 0.0, 'rate': 0.25, 'agent': '', 'agent_payout': 0.0}
        partners[pid]['count'] += 1
        partners[pid]['gross'] += s['gross_eur']
        partners[pid]['payout'] += s['payout_eur']
        partners[pid]['rate'] = s['rate']
        partners[pid]['agent'] = s['agent']
        partners[pid]['agent_payout'] = partners[pid].get('agent_payout', 0.0) + s['agent_payout_eur']

    print('\n' + '=' * 65)
    print('RIEPILOGO PARTNER')
    print('=' * 65)
    print(f'{"Partner":<25} {"Rate":>5} {"Vend":>6} {"Lordo":>12} {"Da pagare":>12}')
    print('-' * 65)
    total_gross = 0.0
    total_payout = 0.0
    for pid, data in sorted(partners.items(), key=lambda x: -x[1]['payout']):
        rate_pct = f'{round(data["rate"] * 100)}%'
        print(f'{pid:<25} {rate_pct:>5} {data["count"]:>6} {data["gross"]:>11.2f}€ {data["payout"]:>11.2f}€')
        total_gross += data['gross']
        total_payout += data['payout']
    print('=' * 65)
    print(f'{"TOTALE":<25} {"":>5} {len(sessions):>6} {total_gross:>11.2f}€ {total_payout:>11.2f}€')
    print('=' * 65)
    print(f'\n  Revenue totale referral: {total_gross:.2f}€')
    print(f'  Importo da pagare ai partner: {total_payout:.2f}€')

    total_agent = sum(p.get('agent_payout', 0.0) for p in partners.values())
    if total_agent > 0:
        agents = sorted({p['agent'] for p in partners.values() if p.get('agent')})
        label = ', '.join(agents) if agents else 'agente'
        print(f'  Da pagare all\'agente ({label}, 15%): {total_agent:.2f}€')


def save_csv(sessions: list[dict], path: str) -> None:
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    fields = ['session_id', 'created', 'partner_id', 'product', 'gross_eur', 'rate', 'payout_eur', 'agent', 'agent_payout_eur', 'currency', 'customer_email']
    with open(out, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for s in sessions:
            row = dict(s)
            row['created'] = s['created'].strftime('%Y-%m-%d %H:%M')
            w.writerow(row)
    print(f'\nCSV salvato: {out} ({len(sessions)} righe)')


def main() -> int:
    ap = argparse.ArgumentParser(description='Localis partner referral report')
    ap.add_argument('--from', dest='from_date', metavar='YYYY-MM-DD', help='Filtra vendite da questa data')
    ap.add_argument('--partner', metavar='SLUG', help='Mostra solo questo partner')
    ap.add_argument('--csv', metavar='PATH', help='Salva CSV in questo percorso')
    args = ap.parse_args()

    created_after: datetime | None = None
    if args.from_date:
        try:
            created_after = datetime.fromisoformat(args.from_date).replace(tzinfo=timezone.utc)
        except ValueError:
            print(f'ERROR: data non valida "{args.from_date}", usa formato YYYY-MM-DD', file=sys.stderr)
            return 1

    sessions = fetch_sessions(created_after, args.partner)
    print_summary(sessions)

    if args.csv:
        save_csv(sessions, args.csv)
    elif sessions:
        # Auto-save to marketing/reports/
        out_dir = Path(__file__).resolve().parent.parent / 'marketing' / 'reports'
        ts = datetime.now().strftime('%Y%m%d_%H%M')
        save_csv(sessions, str(out_dir / f'partner-report-{ts}.csv'))

    return 0


if __name__ == '__main__':
    sys.exit(main())
