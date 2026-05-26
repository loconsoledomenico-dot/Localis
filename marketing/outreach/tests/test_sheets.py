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
