"""
Genera guide DE Bari con Fish Audio — CHUNK PER CAPITOLO.
Chunk salvati in chunks/<slug>-de/cap-N.mp3
Concatenati in public/audio/guides/<slug>-de.mp3
"""
import re
import os
import sys
import time
import httpx

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from pathlib import Path
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

FA_KEY = "bbfc479590954d1782b660512e12f96c"
MODEL  = "s2"

GUIDES = [
    ("bari-vecchia",      "40f470ff12064bf1897215b41819147c"),  # Domenico
    ("porto-bari",        "21a055ae154d41fdb24d02e6ac3f1334"),  # Luigi
    ("san-nicola",        "dae27abda6be4299b86b300a8e3f326a"),  # Nonno Nicola
    ("tre-teatri",        "50954d64d2fc49de93fbe2a73f028763"),  # Filippo
    ("bari-sotterranea",  "285f00e53ff14eb1b111532fb39569d3"),  # Rosa
    ("il-meglio-di-bari", "39782934bdbb491b8bc567f831757fc9"),  # Rachele
]

SCRIPT_DIR = REPO_ROOT / "src/content/scripts"
AUDIO_DIR  = REPO_ROOT / "public/audio/guides"
CHUNKS_DIR = REPO_ROOT / "chunks"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def parse_chapters(slug: str, lang: str):
    # Try slug-guida-fast-de.txt first, then slug-de.txt
    for name in [f"{slug}-guida-fast-{lang}.txt", f"{slug}-{lang}.txt"]:
        path = SCRIPT_DIR / name
        if path.exists():
            break
    raw = path.read_text(encoding="utf-8")
    parts = re.split(r"\n={5,}\n", raw)
    chapters = []
    for part in parts:
        lines = part.strip().split("\n")
        body_lines = []
        skip_header = True
        title = ""
        for line in lines:
            s = line.strip()
            if skip_header:
                if re.match(r"^KAP\.", s) or re.match(r"^CAP\.", s):
                    title = s
                    continue
                if re.match(r"^voice:", s, re.IGNORECASE):
                    continue
                if re.match(r"^##", s):
                    continue
                if re.match(r"^\*", s):
                    continue
                if s == "":
                    continue
                skip_header = False
            body_lines.append(line)
        # Strip SSML tags not supported by Fish Audio
        text = "\n".join(body_lines).strip()
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s{2,}", " ", text).strip()
        if len(text) > 80:
            chapters.append((title, text))
    return chapters


def tts(text: str, voice_id: str) -> bytes:
    r = httpx.post(
        "https://api.fish.audio/v1/tts",
        headers={"Authorization": f"Bearer {FA_KEY}", "Content-Type": "application/json"},
        json={
            "text": text,
            "reference_id": voice_id,
            "model": MODEL,
            "format": "mp3",
            "mp3_bitrate": 192,
            "latency": "normal",
        },
        timeout=180,
    )
    r.raise_for_status()
    return r.content


def concat_mp3(chunk_paths: list, out: Path):
    with open(out, "wb") as f:
        for p in chunk_paths:
            f.write(p.read_bytes())


for slug, voice_id in GUIDES:
    stem = f"{slug}-de"
    print(f"\n{'='*52}")
    print(f"  {stem}  (voice: {voice_id[:8]}...)")
    print(f"{'='*52}")

    chapters = parse_chapters(slug, "de")
    print(f"  Capitoli trovati: {len(chapters)}")

    chunk_dir = CHUNKS_DIR / stem
    chunk_dir.mkdir(parents=True, exist_ok=True)

    chunk_paths = []
    for i, (title, text) in enumerate(chapters, 1):
        chunk_path = chunk_dir / f"cap-{i:02d}.mp3"
        label = title[:48] if title else f"(cap {i})"
        print(f"  [{i:02d}/{len(chapters)}] {label}...", end=" ", flush=True)

        if chunk_path.exists():
            print(f"(skip — {chunk_path.stat().st_size//1024}KB)")
            chunk_paths.append(chunk_path)
            continue

        try:
            audio = tts(text, voice_id)
            chunk_path.write_bytes(audio)
            print(f"OK ({len(audio)//1024}KB)")
            chunk_paths.append(chunk_path)
        except Exception as e:
            print(f"ERRORE: {e}")
            break

        time.sleep(0.3)

    if len(chunk_paths) == len(chapters):
        out = AUDIO_DIR / f"{stem}.mp3"
        concat_mp3(chunk_paths, out)
        total_mb = out.stat().st_size / 1024 / 1024
        print(f"\n  Concatenato: {out.name}  ({total_mb:.1f} MB)")
        print(f"  Chunk in: {chunk_dir}/")
    else:
        print(f"\n  ATTENZIONE: {len(chunk_paths)}/{len(chapters)} chunk — NON concatenato")

print("\nFatto.")
