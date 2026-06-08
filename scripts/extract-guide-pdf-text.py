#!/usr/bin/env python3
"""
Extract clean working text from guide PDFs.

Usage:
  python scripts/extract-guide-pdf-text.py src/content/scripts/gargano-paesi-en.pdf
  python scripts/extract-guide-pdf-text.py src/content/scripts/gargano-paesi-en.pdf --out C:/tmp/out.txt
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from pypdf import PdfReader


CHAPTER_RE = re.compile(r"^CAP\.\s*\d+\s*[—-]\s*")
VOICE_RE = re.compile(r"^(Voce|Voice|Stimme)\s*:", re.IGNORECASE)
UPPERISH_RE = re.compile(r"^[A-ZÀ-ÖØ-Þ0-9 ,.:;'\"()\-—]+$")


def is_upperish(line: str) -> bool:
    return bool(line and UPPERISH_RE.match(line))


def normalize_lines(text: str) -> list[str]:
    raw_lines = [line.strip() for line in text.replace("\r", "").splitlines()]
    lines: list[str] = []
    previous_nonempty = None

    for line in raw_lines:
        if not line:
            if lines and lines[-1] != "":
                lines.append("")
            continue
        if line == previous_nonempty:
            continue
        lines.append(line)
        previous_nonempty = line

    while lines and lines[0] == "":
        lines.pop(0)
    while lines and lines[-1] == "":
        lines.pop()
    return lines


def merge_wrapped_headings(lines: list[str]) -> list[str]:
    merged: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line == "":
            merged.append(line)
            i += 1
            continue

        parts = [line]
        if CHAPTER_RE.match(line) or (is_upperish(line) and not VOICE_RE.match(line)):
            j = i + 1
            while j < len(lines) and lines[j] and is_upperish(lines[j]) and not VOICE_RE.match(lines[j]):
                parts.append(lines[j])
                j += 1
            merged.append(" ".join(parts))
            i = j
            continue

        merged.append(line)
        i += 1
    return merged


def to_paragraphs(lines: list[str]) -> str:
    paragraphs: list[str] = []
    current: list[str] = []

    def flush() -> None:
        if not current:
            return
        paragraph = " ".join(current)
        paragraph = re.sub(r"\s+", " ", paragraph).strip()
        paragraph = paragraph.replace(" ,", ",").replace(" .", ".").replace(" :", ":")
        paragraphs.append(paragraph)
        current.clear()

    for line in lines:
        if not line:
            flush()
            continue
        if CHAPTER_RE.match(line):
            flush()
            paragraphs.append(line)
            continue
        if VOICE_RE.match(line):
            flush()
            paragraphs.append(line)
            continue
        current.append(line)

    flush()
    deduped: list[str] = []
    for paragraph in paragraphs:
        if deduped and deduped[-1] == paragraph:
            continue
        deduped.append(paragraph)
    if len(deduped) >= 4 and deduped[0] == deduped[2] and deduped[1] == deduped[3]:
        deduped = [deduped[0], deduped[1], *deduped[4:]]
    return "\n\n".join(deduped) + "\n"


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    pages = [page.extract_text() or "" for page in reader.pages]
    lines = normalize_lines("\n".join(pages))
    lines = merge_wrapped_headings(lines)
    return to_paragraphs(lines)


def default_output_path(pdf_path: Path) -> Path:
    return pdf_path.with_name(f"{pdf_path.stem}-from-pdf.txt")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_path", help="Path to source PDF")
    parser.add_argument("--out", help="Output text path")
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        print(f"File not found: {pdf_path}", file=sys.stderr)
        return 1

    out_path = Path(args.out) if args.out else default_output_path(pdf_path)
    out_path.write_text(extract_text(pdf_path), encoding="utf-8")
    print(f"Text saved: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
