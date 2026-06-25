import pytest
from unittest.mock import MagicMock, patch

def test_estrai_email_da_testo():
    from scraper import estrai_email
    testo = "Contattaci a info@hoteltest.it oppure prenota@hoteltest.it"
    result = estrai_email(testo)
    assert "info@hoteltest.it" in result
    assert "prenota@hoteltest.it" in result

def test_estrai_email_esclude_noreply():
    from scraper import estrai_email
    testo = "noreply@sistema.it e info@hoteltest.it"
    result = estrai_email(testo)
    assert "noreply@sistema.it" not in result
    assert "info@hoteltest.it" in result

def test_estrai_email_esclude_comune():
    from scraper import estrai_email
    testo = "info@comune.bari.it e prenotazioni@bb-bari.it"
    result = estrai_email(testo)
    assert "info@comune.bari.it" not in result
    assert "prenotazioni@bb-bari.it" in result

def test_build_query():
    from scraper import build_query
    q = build_query("hotel", "bari")
    assert "hotel" in q
    assert "bari" in q
    assert "email" in q.lower() or "contatti" in q.lower()

def test_pulisci_nome_rimuove_separatori():
    from scraper import pulisci_nome
    assert pulisci_nome("Hotel Belvedere | Sito ufficiale", "") == "Hotel Belvedere"
    assert pulisci_nome("Hotel Belvedere - Booking.com", "") == "Hotel Belvedere"

def test_pulisci_nome_non_spezza_trattino_interno():
    from scraper import pulisci_nome
    assert pulisci_nome("B&B Santa-Teresa", "") == "B&B Santa-Teresa"

def test_pulisci_nome_fallback_dominio():
    from scraper import pulisci_nome
    assert pulisci_nome("", "https://www.hotelbelvedere.it/contatti") == "hotelbelvedere"

def test_deduplicazione_dominio():
    from scraper import deduplicazione_per_dominio
    emails = ["info@hotel.it", "prenota@hotel.it", "info@altrohotel.it"]
    result = deduplicazione_per_dominio(emails)
    assert len(result) == 2
    assert "info@hotel.it" in result or "prenota@hotel.it" in result
    assert "info@altrohotel.it" in result
