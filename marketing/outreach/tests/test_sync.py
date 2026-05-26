import pytest

def test_parse_registry_estrae_slug():
    from sync import parse_partner_registry
    testo = """
| 001 | `london-bar` | London Bar | Via Principe Amedeo | Bar | 7 | — | 2026-05-21 | file | note |
| 002 | `paesaggi` | Paesaggi | Centro Bari | Negozio | 1 | — | 2026-05-21 | file | note |
"""
    result = parse_partner_registry(testo)
    assert len(result) == 2
    assert result[0]["slug"] == "london-bar"
    assert result[0]["nome"] == "London Bar"
    assert result[1]["slug"] == "paesaggi"

def test_calcola_quota_partner():
    from sync import calcola_quota
    assert calcola_quota(100.0) == 25.0
    assert calcola_quota(0.0) == 0.0

def test_calcola_cr():
    from sync import calcola_cr
    assert calcola_cr(visitatori=100, acquisti=5) == "5.00%"
    assert calcola_cr(visitatori=0, acquisti=0) == "0.00%"
