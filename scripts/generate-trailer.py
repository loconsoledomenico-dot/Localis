#!/usr/bin/env python3
"""
Generate a trailer MP3 from the first chapter of a guide script.

Usage:
  python scripts/generate-trailer.py <slug> <script_path> [--lang it|en]

Examples:
  python scripts/generate-trailer.py alberobello src/content/scripts/alberobello-it.txt --lang it
  python scripts/generate-trailer.py alberobello src/content/scripts/alberobello-en.txt --lang en
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

CHAPTER_SEP_RE = re.compile(r"^={3,}\s*$", re.MULTILINE)
VOICE_TAG_RE = re.compile(r"^\s*voice\s*:\s*(\S+)\s*$", re.IGNORECASE)
MIN_CHAPTER_CHARS = 250

VOICE_MAP: dict[str, str] = {
    "gian":      "pwvkOXKI34DbjtR6yUk5",
    "valerio":   "f8NAZK1ciwrVujah7clz",
    "brando":    "ovchBcE0QzMVMrtS8r4T",
    "paolo":     "mcMi8FJDhg35bMpWHv2R",
    "raffaele":  "YGp1lBJLaHhfIFT0yeDE",
    "tiziana":   "RXoaSpLaWTEckJgPUBG3",
    "beatrice":  "UnOINkXZ3yK4vVg3Iayj",
    "manuela":   "oVJbgLwL0s5pk9e2U6QH",
    "sami":      "b8jhBTcGAq4kQGWmKprT",
    "dante":     "q2LDrL29FLqRR3XanHLq",
    "angelina":  "MLpDWJvrjFIdb63xbJp8",
    "maruzzeja": "zzBa3JLSQKDusYxegeHf",
    "george":    "JBFqnCBsd6RMkjVDRZzb",
    "jeff":      "rqeqvyUEJUTgWU0eqxXO",
    "roger":     "CwhRBWXzGAHq8TQ4Fs17",
    "alice":     "Xb7hH8MSUJpSbSDYk0k2",
    "brian":     "nPczCjzI2devNBz1zQrb",
    "charlie":   "IKne3meq5aSn9XLyUdCD",
    "matilda":   "XrExE9yKIg1WjnnlVkGX",
    "callum":    "N2lVS1w4EtoT3dr4eOWO",
    "jessica":   "cgSgspJ2msm6clMCkdW9",
    "jane":      "RILOU7YmBhvwJGDGjNmP",
    "custom-alberobello": "G0q9AYE8QsarSbMtaIEu",
}

VOICE_SETTINGS = {
    "stability": 0.55,
    "similarity_boost": 0.85,
    "style": 0.20,
    "use_speaker_boost": True,
}


def parse_first_chapter(raw: str) -> tuple[str, str]:
    """Return (voice_name, text) for the first real chapter."""
    blocks = [b.strip() for b in CHAPTER_SEP_RE.split(raw) if b.strip()]
    for block in blocks:
        lines = [l.rstrip() for l in block.splitlines()]
        voice_override: str | None = None
        kept: list[str] = []
        title_skipped = False
        for line in lines:
            m = VOICE_TAG_RE.match(line)
            if m and voice_override is None:
                voice_override = m.group(1).lower()
            elif not title_skipped and line.strip() and not m:
                # skip the chapter title (first non-empty, non-voice line)
                title_skipped = True
            else:
                kept.append(line)
        text = "\n".join(kept).strip()
        clean = re.sub(r"<[^>]+>", "", text)
        if len(clean) >= MIN_CHAPTER_CHARS and voice_override:
            return voice_override, text
    raise ValueError("No valid chapter found in script")


def generate_audio(text: str, voice_name: str, api_key: str) -> bytes:
    import urllib.request
    import json

    voice_id = VOICE_MAP.get(voice_name)
    if not voice_id:
        raise ValueError(f"Unknown voice: {voice_name}")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = json.dumps({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": VOICE_SETTINGS,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("slug", help="Guide slug, e.g. alberobello")
    parser.add_argument("script_path", help="Path to .txt script")
    parser.add_argument("--lang", default="it", choices=["it", "en"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key and not args.dry_run:
        sys.exit("ERROR: ELEVENLABS_API_KEY not set in .env")

    script = Path(args.script_path).read_text(encoding="utf-8")
    voice_name, text = parse_first_chapter(script)

    char_count = len(re.sub(r"<[^>]+>", "", text))
    cost = char_count * 22.0 / 100_000
    print(f"Voice: {voice_name} | chars: {char_count} | est. cost: ${cost:.4f}")

    if args.dry_run:
        print("Dry run — skipping API call.")
        return

    print("Calling ElevenLabs...")
    audio = generate_audio(text, voice_name, api_key)

    out_dir = REPO_ROOT / "public" / "audio" / "trailers"
    out_dir.mkdir(parents=True, exist_ok=True)

    suffix = "" if args.lang == "it" else "-en"
    out_path = out_dir / f"{args.slug}{suffix}.mp3"
    out_path.write_bytes(audio)
    print(f"Saved: {out_path} ({len(audio):,} bytes)")


if __name__ == "__main__":
    main()
