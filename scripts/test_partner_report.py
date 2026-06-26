import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "partner_report", Path(__file__).resolve().parent / "partner-report.py"
)
pr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pr)


def test_commission_eur_partner_standard():
    assert pr.commission_eur(1000, 0.25) == 2.50


def test_commission_eur_partner_agente():
    assert pr.commission_eur(1000, 0.10) == 1.00


def test_commission_eur_quota_agente():
    assert pr.commission_eur(1000, pr.AGENT_RATE) == 1.50


def test_parse_frontmatter_legge_rate_e_agent():
    text = (
        "---\n"
        "slug: antonello-bar\n"
        'display_name: "Bar di prova"\n'
        "commission_rate: 0.10\n"
        "agent: antonello\n"
        "status: active\n"
        "---\n\n# corpo\n"
    )
    fm = pr.parse_frontmatter(text)
    assert fm["slug"] == "antonello-bar"
    assert float(fm["commission_rate"]) == 0.10
    assert fm["agent"] == "antonello"


def test_parse_frontmatter_agent_assente():
    text = "---\nslug: vecchio-bar\ncommission_rate: 0.25\nstatus: active\n---\n"
    fm = pr.parse_frontmatter(text)
    assert "agent" not in fm
