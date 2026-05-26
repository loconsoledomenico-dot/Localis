import pytest


def test_render_template_it_bar():
    from drafts import render_template
    body = render_template("bar", "it", "London Bar", "bari")
    assert "London Bar" in body
    assert "tavoli" in body or "bancone" in body
    assert "[TIPO:" not in body


def test_render_template_it_hotel():
    from drafts import render_template
    body = render_template("hotel", "it", "Hotel Belvedere", "alberobello")
    assert "Hotel Belvedere" in body
    assert "reception" in body or "camera" in body
    assert "[TIPO:" not in body


def test_render_template_rimuove_blocchi_altri_tipi():
    from drafts import render_template
    body = render_template("bb", "it", "B&B Trulli", "alberobello")
    assert "[TIPO:" not in body
    assert "[/TIPO]" not in body


def test_detect_lingua_en():
    from drafts import detect_lingua
    assert detect_lingua("info@hotel.co.uk") == "en"
    assert detect_lingua("info@hotel.it") == "it"
    assert detect_lingua("info@hotel.de") == "it"  # fallback IT
