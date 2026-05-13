#!/usr/bin/env python3
"""
Generate the same script with N different ElevenLabs voices for A/B comparison.

Usage:
  python scripts/sample-voices.py <script_path> [--out-dir r2_audio/samples]

Voices are hardcoded below; edit VOICES list to change candidates.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

VOICES = [
    # IT voices
    ("marcotrox", "W71zT1VwIFFx3mMGH2uZ", "MarcoTrox · intense · narrative"),
    ("marco",     "13Cuh3NuYvWOVQtLbRN8", "Marco · classy · deep reflective"),
    ("gian",      "pwvkOXKI34DbjtR6yUk5", "Gian · pleasant · velvety warm"),
    ("francesco", "PJucOeN3PPVPnud4XocS", "Francesco · warm confident · deep"),
    # EN voices (premade)
    ("george",    "JBFqnCBsd6RMkjVDRZzb", "George · british · warm captivating storyteller"),
    ("daniel",    "onwK4e9ZLuTAKqWW03F9", "Daniel · british · steady broadcaster"),
    ("brian",     "nPczCjzI2devNBz1zQrb", "Brian · american · deep resonant comforting"),
]

VOICE_SETTINGS = {
    "stability": 0.55,
    "similarity_boost": 0.85,
    "style": 0.20,
    "use_speaker_boost": True,
}

CHAPTER_SEP_RE = re.compile(r"^={3,}\s*$", re.MULTILINE)


def extract_body(raw: str) -> str:
    """Take the last chapter body from a multi-section file (skips the header)."""
    blocks = [b.strip() for b in CHAPTER_SEP_RE.split(raw) if b.strip()]
    if not blocks:
        return raw.strip()
    last = blocks[-1]
    lines = [l.rstrip() for l in last.splitlines() if not re.fullmatch(r"-{3,}", l.strip())]
    if len(lines) > 1:
        return "\n".join(lines[1:]).strip()
    return last.strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("script_path")
    ap.add_argument("--out-dir", default="r2_audio/samples")
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--only", help="Comma-separated voice slugs to use (e.g. 'gian,marco'). Default: all.")
    args = ap.parse_args()

    voices = VOICES
    if args.only:
        wanted = {s.strip() for s in args.only.split(",")}
        voices = [v for v in VOICES if v[0] in wanted]
        if not voices:
            raise SystemExit(f"[ERR] No voices matched --only={args.only}. Available: {[v[0] for v in VOICES]}")

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise SystemExit("[ERR] Missing ELEVENLABS_API_KEY in .env")

    script_path = Path(args.script_path)
    if not script_path.is_absolute():
        script_path = REPO_ROOT / script_path
    if not script_path.exists():
        raise SystemExit(f"[ERR] Script not found: {script_path}")

    raw = script_path.read_text(encoding="utf-8")
    body = extract_body(raw)
    billable = len(re.sub(r"<[^>]+>", "", body))

    out_dir = REPO_ROOT / args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=== Voice sample comparison ===")
    print(f"Script: {script_path}")
    print(f"Body chars (billable): {billable}")
    print(f"Voices: {len(voices)}")
    print(f"Estimated cost: ~${billable * len(voices) * 22 / 100_000:.2f} USD")
    print(f"Output: {out_dir}/")
    print()

    from elevenlabs.client import ElevenLabs
    client = ElevenLabs(api_key=api_key)

    t0 = time.time()
    for slug, voice_id, label in voices:
        out_path = out_dir / f"{script_path.stem}__{slug}.mp3"
        if out_path.exists():
            print(f"  [skip] {out_path.name} (already exists)")
            continue
        print(f"  [gen ] {label} → {out_path.name} ...", end=" ", flush=True)
        t = time.time()
        audio_iter = client.text_to_speech.convert(
            voice_id=voice_id,
            text=body,
            model_id=args.model,
            output_format="mp3_44100_128",
            voice_settings=VOICE_SETTINGS,
        )
        with open(out_path, "wb") as f:
            for chunk in audio_iter:
                f.write(chunk)
        print(f"OK ({time.time()-t:.1f}s, {out_path.stat().st_size:,} bytes)")

    print(f"\n=== Done in {time.time()-t0:.1f}s ===")
    print(f"\nSample files:")
    for slug, _, label in voices:
        out_path = out_dir / f"{script_path.stem}__{slug}.mp3"
        if out_path.exists():
            size_mb = out_path.stat().st_size / 1024 / 1024
            print(f"  {label:<55} → {out_path.relative_to(REPO_ROOT)} ({size_mb:.2f} MB)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
