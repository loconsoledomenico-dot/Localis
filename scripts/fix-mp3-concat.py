#!/usr/bin/env python3
"""
Fix MP3 files concatenated via binary concat (which produces broken VBR/Xing headers).

Re-concatenates chunks using ffmpeg with `-c copy` (no re-encoding, fast and lossless)
so the resulting MP3 has correct frame indexing and seekable duration.

Usage:
  python scripts/fix-mp3-concat.py <slug> [<slug> ...]
  python scripts/fix-mp3-concat.py --all      # all slugs with r2_audio/<slug>/chunks-* dirs
  python scripts/fix-mp3-concat.py --verify <slug>   # only check, don't fix
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
from mutagen.mp3 import MP3

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
REPO_ROOT = Path(__file__).resolve().parent.parent


def fix_one(slug: str, lang: str, verify_only: bool = False) -> bool:
    """Returns True on success, False on failure / skipped."""
    chunks_dir = REPO_ROOT / "r2_audio" / slug / f"chunks-{lang}"
    if not chunks_dir.exists():
        print(f"[skip] no chunks: {chunks_dir}")
        return False
    chunks = sorted(chunks_dir.glob("*.mp3"))
    if not chunks:
        print(f"[skip] no chunk files: {chunks_dir}")
        return False
    out = REPO_ROOT / "r2_audio" / slug / f"full-{lang}.mp3"

    # Check current declared duration vs sum of chunks
    sum_chunks = sum(MP3(str(c)).info.length for c in chunks)
    if out.exists():
        current = MP3(str(out)).info.length
        diff = abs(current - sum_chunks)
        status = "OK" if diff < 2 else "BROKEN"
        print(f"[{slug}/{lang}] declared={current:.2f}s · sum={sum_chunks:.2f}s · diff={diff:.2f}s · {status}")
        if verify_only or diff < 2:
            return True

    # Re-concat with ffmpeg
    backup = out.with_suffix(".broken.mp3")
    if out.exists() and not backup.exists():
        out.rename(backup)
        print(f"  backup -> {backup.name}")
    concat_input = "concat:" + "|".join(str(c).replace("\\", "/") for c in chunks)
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-i", concat_input, "-c:a", "copy", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  FAIL ffmpeg: {r.stderr.strip()}")
        return False
    fixed = MP3(str(out)).info.length
    diff = abs(fixed - sum_chunks)
    print(f"  fixed declared={fixed:.2f}s · sum={sum_chunks:.2f}s · diff={diff:.2f}s")
    return diff < 2


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*", help="Guide slugs to fix")
    ap.add_argument("--all", action="store_true", help="Fix all slugs found in r2_audio/")
    ap.add_argument("--verify", action="store_true", help="Only check, don't fix")
    args = ap.parse_args()

    if args.all:
        slugs = sorted([p.name for p in (REPO_ROOT / "r2_audio").iterdir()
                        if p.is_dir() and not p.name.startswith(".") and p.name != "samples"])
    else:
        slugs = args.slugs
    if not slugs:
        ap.print_help()
        return 1

    print(f"ffmpeg: {FFMPEG}\n")
    for slug in slugs:
        for lang in ["it", "en"]:
            fix_one(slug, lang, verify_only=args.verify)
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
