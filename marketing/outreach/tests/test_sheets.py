import pytest
from unittest.mock import MagicMock, patch

def test_get_or_create_tab_esistente():
    mock_sheet = MagicMock()
    mock_tab = MagicMock()
    mock_tab.title = "Candidati"
    mock_sheet.worksheets.return_value = [mock_tab]

    with patch("sheets.get_spreadsheet", return_value=mock_sheet):
        from sheets import get_or_create_tab
        result = get_or_create_tab(mock_sheet, "Candidati")
        assert result == mock_tab
        mock_sheet.add_worksheet.assert_not_called()

def test_get_or_create_tab_nuovo():
    mock_sheet = MagicMock()
    mock_sheet.worksheets.return_value = []
    new_tab = MagicMock()
    mock_sheet.add_worksheet.return_value = new_tab

    from sheets import get_or_create_tab
    result = get_or_create_tab(mock_sheet, "Candidati")
    mock_sheet.add_worksheet.assert_called_once_with(title="Candidati", rows=1000, cols=20)
    assert result == new_tab

def test_estrai_email_da_records():
    from sheets import estrai_email_da_records
    records = [
        {"email": "Info@Hotel.IT"},
        {"email": "  bar@test.it  "},
        {"email": ""},
        {"nome": "senza email"},
        {"email": "info@hotel.it"},  # duplicato case-diverso
    ]
    result = estrai_email_da_records(records)
    assert result == {"info@hotel.it", "bar@test.it"}


def test_seleziona_followup():
    import datetime
    from sheets import seleziona_followup
    oggi = datetime.date(2026, 6, 18)
    records = [
        # 0: inviata, nessuna risposta, 5gg fa, n=1 -> PRONTO (soglia 4)
        {"id": "1", "nome": "A", "stato": "inviata", "sentiment_risposta": "nessuno",
         "n_tentativi": "1", "data_ultimo_contatto": "2026-06-13"},
        # 1: solo 2gg fa -> non pronto
        {"id": "2", "nome": "B", "stato": "inviata", "sentiment_risposta": "",
         "n_tentativi": "1", "data_ultimo_contatto": "2026-06-16"},
        # 2: ha risposto -> escluso
        {"id": "3", "nome": "C", "stato": "inviata", "sentiment_risposta": "positivo",
         "n_tentativi": "1", "data_ultimo_contatto": "2026-06-01"},
        # 3: gia 3 tentativi -> escluso
        {"id": "4", "nome": "D", "stato": "follow_up", "sentiment_risposta": "nessuno",
         "n_tentativi": "3", "data_ultimo_contatto": "2026-06-01"},
        # 4: bozza non ancora inviata -> escluso (gate umano)
        {"id": "5", "nome": "E", "stato": "bozza_pronta", "sentiment_risposta": "nessuno",
         "n_tentativi": "1", "data_ultimo_contatto": "2026-06-01"},
    ]
    pronti = seleziona_followup(records, oggi, {1: 4, 2: 6}, 3)
    assert [r["id"] for (_i, r, _n) in pronti] == ["1"]
    assert pronti[0][0] == 0  # row_index
    assert pronti[0][2] == 1  # n_tentativi corrente


def test_row_to_list_candidati():
    mock_tab = MagicMock()
    row = {
        "id": "1", "nome": "Hotel Test", "tipo": "hotel",
        "citta": "bari", "indirizzo": "", "email": "test@hotel.it",
        "url_fonte": "https://example.com", "data_trovato": "2026-05-26",
        "stato": "da_contattare"
    }
    from sheets import CANDIDATI_HEADERS, row_to_list
    result = row_to_list(row, CANDIDATI_HEADERS)
    assert result[0] == "1"
    assert result[5] == "test@hotel.it"
