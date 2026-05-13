#!/usr/bin/env python3
"""
List Italian ElevenLabs voices available to this account.
Shows: personal voices (cloned/added) + premade library + searchable library.

Usage:
  python scripts/list-voices.py [--gender male|female] [--age young|middle|old] [--limit 20]
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gender", default="male", choices=["male", "female", "neutral", "any"])
    ap.add_argument("--age", default="middle_aged", choices=["young", "middle_aged", "old", "any"])
    ap.add_argument("--limit", type=int, default=15)
    args = ap.parse_args()

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise SystemExit("[ERR] Missing ELEVENLABS_API_KEY in .env")

    from elevenlabs.client import ElevenLabs
    client = ElevenLabs(api_key=api_key)

    print("=== Personal voices (your account) ===")
    personal = client.voices.get_all()
    voices_iter = personal.voices if hasattr(personal, "voices") else personal
    for v in voices_iter:
        labels = getattr(v, "labels", None) or {}
        name = getattr(v, "name", "?")
        vid = getattr(v, "voice_id", "?")
        category = getattr(v, "category", "?")
        desc = getattr(v, "description", "") or ""
        print(f"  [{category:<12}] {name:<24} id={vid}")
        if labels:
            print(f"               labels: {labels}")
        if desc:
            print(f"               desc: {desc[:80]}")

    print(f"\n=== Library search · gender={args.gender} · age={args.age} · italian ===")
    try:
        kwargs = {
            "language": "it",
            "page_size": args.limit,
        }
        if args.gender != "any":
            kwargs["gender"] = args.gender
        if args.age != "any":
            kwargs["age"] = args.age
        results = client.voices.get_shared(**kwargs)
        shared = results.voices if hasattr(results, "voices") else results
        for v in shared:
            name = getattr(v, "name", "?")
            vid = getattr(v, "voice_id", getattr(v, "public_owner_id", "?"))
            descr = getattr(v, "description", "") or ""
            accent = getattr(v, "accent", "") or ""
            age = getattr(v, "age", "") or ""
            gender = getattr(v, "gender", "") or ""
            usage = getattr(v, "usage_character_count_1y", 0)
            preview = getattr(v, "preview_url", "") or ""
            print(f"\n  • {name}  ({gender}, {age}, accent={accent})")
            print(f"    id: {vid}")
            if descr:
                print(f"    {descr[:120]}")
            if preview:
                print(f"    preview: {preview}")
            if usage:
                print(f"    usage 1y: {usage:,} chars")
    except Exception as e:
        print(f"  [warn] Library search failed: {e}")
        print("  Fallback: visit https://elevenlabs.io/app/voice-library and filter by Italian + Male + Middle Aged")

    print("\nTo use a voice in generate-guide.py:")
    print("  1. Add to .env:  CUSTOM_VOICE_ID=<id_from_above>")
    print("  2. Run:  python scripts/generate-guide.py <slug> <script.txt> --voice custom")

    return 0


if __name__ == "__main__":
    sys.exit(main())
