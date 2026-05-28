#!/usr/bin/env python3
"""
Export a guide script to clean PDF, stripping SSML tags.
Usage: python scripts/export-guide-pdf.py <script_path> [--out <output.pdf>]
"""
import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

SSML_RE = re.compile(r"<[^>]+>")
VOICE_TAG_RE = re.compile(r"^\s*voice\s*:\s*\S+\s*$", re.IGNORECASE)
SEP_RE = re.compile(r"^={3,}\s*$")

def clean_text(raw: str) -> list[tuple[str, str]]:
    """Return list of (chapter_title, body_text) with SSML stripped."""
    chapters = []
    current_title = None
    current_lines = []

    for line in raw.splitlines():
        if SEP_RE.match(line):
            if current_title is not None:
                body = "\n".join(current_lines).strip()
                body = SSML_RE.sub("", body)
                body = re.sub(r"  +", " ", body)
                body = re.sub(r"\n{3,}", "\n\n", body)
                chapters.append((current_title, body.strip()))
            current_title = None
            current_lines = []
        elif current_title is None and line.strip() and not VOICE_TAG_RE.match(line) and not line.startswith("Voce:") and not line.startswith("Voice:"):
            current_title = line.strip()
        elif VOICE_TAG_RE.match(line):
            pass
        else:
            current_lines.append(line)

    if current_title is not None:
        body = "\n".join(current_lines).strip()
        body = SSML_RE.sub("", body)
        body = re.sub(r"  +", " ", body)
        body = re.sub(r"\n{3,}", "\n\n", body)
        chapters.append((current_title, body.strip()))

    return chapters


def build_pdf(script_path: Path, out_path: Path) -> None:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.enums import TA_LEFT, TA_CENTER

    raw = script_path.read_text(encoding="utf-8")

    # Extract header (first two lines before first ===)
    header_lines = []
    for line in raw.splitlines():
        if SEP_RE.match(line):
            break
        if line.strip():
            header_lines.append(line.strip())

    guide_title = header_lines[0] if header_lines else script_path.stem
    guide_subtitle = header_lines[1] if len(header_lines) > 1 else ""

    chapters = clean_text(raw)

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=3*cm, rightMargin=3*cm,
        topMargin=3*cm, bottomMargin=3*cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "GuideTitle",
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=28,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor("#1a1a1a"),
    )
    subtitle_style = ParagraphStyle(
        "GuideSub",
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        alignment=TA_CENTER,
        spaceAfter=24,
        textColor=colors.HexColor("#555555"),
    )
    chapter_style = ParagraphStyle(
        "ChapterTitle",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=18,
        spaceBefore=20,
        spaceAfter=8,
        textColor=colors.HexColor("#1a1a1a"),
    )
    body_style = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=10.5,
        leading=16,
        spaceAfter=8,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#1a1a1a"),
    )

    story = []
    story.append(Paragraph(guide_title, title_style))
    if guide_subtitle:
        story.append(Paragraph(guide_subtitle, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 0.5*cm))

    for title, body in chapters:
        story.append(Paragraph(title, chapter_style))
        for para in body.split("\n\n"):
            para = para.strip()
            if para:
                story.append(Paragraph(para.replace("\n", " "), body_style))

    doc.build(story)
    print(f"PDF saved: {out_path} ({len(chapters)} chapters)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script_path", help="Path to script .txt file")
    parser.add_argument("--out", help="Output PDF path (default: same folder as script)")
    args = parser.parse_args()

    script_path = Path(args.script_path)
    if not script_path.exists():
        sys.exit(f"File not found: {script_path}")

    out_path = Path(args.out) if args.out else script_path.with_suffix(".pdf")
    build_pdf(script_path, out_path)


if __name__ == "__main__":
    main()
