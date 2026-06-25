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


def test_detect_lingua():
    from drafts import detect_lingua
    assert detect_lingua("info@hotel.co.uk") == "en"
    assert detect_lingua("info@hotel.uk") == "en"
    assert detect_lingua("info@hotel.de") == "de"
    assert detect_lingua("info@hotel.at") == "de"
    assert detect_lingua("info@hotel.it") == "it"
    assert detect_lingua("info@hotel.com") == "it"  # default IT


def test_render_template_followup1_it():
    from drafts import render_template
    body = render_template("hotel", "it", "Hotel Belvedere", "bari", "followup1")
    assert "Hotel Belvedere" in body
    assert "[TIPO:" not in body


def test_render_template_followup2_de():
    from drafts import render_template
    body = render_template("bar", "de", "Caffè Centrale", "bari", "followup2")
    assert "Caffè Centrale" in body
    assert "LocalisGuide" in body


def test_subject_followup_breakup():
    from drafts import _subject_followup
    assert _subject_followup("followup2", "it", "Hotel X") == "Ultimo messaggio — LocalisGuide × Hotel X"
    assert _subject_followup("followup1", "en", "Hotel X").startswith("Re: Partnership")


def test_render_template_de_hotel():
    from drafts import render_template
    body = render_template("hotel", "de", "Hotel Belvedere", "bari")
    assert "Hotel Belvedere" in body
    assert "Rezeption" in body or "Zimmer" in body
    assert "[TIPO:" not in body
