#!/usr/bin/env python3
"""Generate a Localis partner QR code.

Usage:
    python scripts/generate-qr.py <slug>
    python scripts/generate-qr.py london-bar
    python scripts/generate-qr.py hotel-oriente --size 1200

Output: marketing/qr-codes/<slug>.png

Constraints:
- slug must match [a-z0-9][a-z0-9-]{2,40} (matches PriceCard / Layout regex)
- Error correction level H (~30%) so the QR survives print scuffs / partial cover
- Brand palette: ink #1C1510 on cream #FAF7F2

After generation:
1. Add a row to marketing/partners-registry.md under "Live partners"
2. Print at 8×8 cm minimum (counter / window decal / menu insert)
3. Hand-deliver with a 30-second pitch + one free demo guide
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_H

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,40}$")
BASE_URL = "https://localis.guide/p/{slug}"
INK = "#1C1510"
CREAM = "#FAF7F2"
OUT_DIR = Path(__file__).resolve().parent.parent / "marketing" / "qr-codes"


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate a Localis partner QR code")
    ap.add_argument("slug", help="Partner slug, e.g. 'london-bar'")
    ap.add_argument("--size", type=int, default=20, help="Box pixel size (default 20 → ~900px image)")
    ap.add_argument("--border", type=int, default=4, help="Quiet zone modules (default 4)")
    ap.add_argument("--format", choices=("png", "svg"), default="png", help="Output format (default png)")
    args = ap.parse_args()

    slug = args.slug.strip().lower()
    if not SLUG_RE.match(slug):
        print(f"ERROR: slug '{slug}' must match {SLUG_RE.pattern}", file=sys.stderr)
        return 1

    url = BASE_URL.format(slug=slug)
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=args.size, border=args.border)
    qr.add_data(url)
    qr.make(fit=True)
    if args.format == "svg":
        from qrcode.image.svg import SvgPathImage

        img = qr.make_image(image_factory=SvgPathImage, fill_color=INK, back_color=CREAM)
    else:
        img = qr.make_image(fill_color=INK, back_color=CREAM)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{slug}.{args.format}"
    img.save(out)
    if hasattr(img, "size"):
        print(f"Saved: {out} ({img.size[0]}x{img.size[1]} px) -> {url}")
    else:
        print(f"Saved: {out} ({args.format}) -> {url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
