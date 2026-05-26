"""
Rigenera guide IT VdI2 con nuove voci — CHUNK PER CAPITOLO.
Ogni capitolo viene salvato in chunks/<slug>-it/cap-N.mp3
Poi concatenati in public/audio/guides/<slug>-it.mp3
I chunk NON vengono cancellati.

Voci:
  ostuni-it:     DLMxnwJE0a28JQLTMJPJ  (Salvatore)
  cisternino-it: HQ7Ez220YT02q2IAnVFl  (Michele)
  fasano-it:     sKbNSlHXq99bttvf8rRF  (Andrea)
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

EL_KEY = "sk_950f82a503bbddfed6c8a6173f1ca1844f2f2c4f89226216"
MODEL  = "eleven_multilingual_v2"

GUIDES = [
    ("ostuni",     "DLMxnwJE0a28JQLTMJPJ"),
    ("cisternino", "HQ7Ez220YT02q2IAnVFl"),
    ("fasano",     "sKbNSlHXq99bttvf8rRF"),
]

SCRIPT_DIR = REPO_ROOT / "src/content/scripts"
AUDIO_DIR  = REPO_ROOT / "public/audio/guides"
CHUNKS_DIR = REPO_ROOT / "chunks"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def parse_chapters(slug: str, lang: str):
    path = SCRIPT_DIR / f"{slug}-{lang}.txt"
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
                if re.match(r"^CAP\.", s):
                    title = s
                    continue
                if re.match(r"^voice:", s, re.IGNORECASE):
                    continue
                if s == "":
                    continue
                skip_header = False
            body_lines.append(line)
        text = "\n".join(body_lines).strip()
        if len(text) > 80:
            chapters.append((title, text))
    return chapters


def tts(text: str, voice_id: str) -> bytes:
    r = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": EL_KEY, "Content-Type": "application/json"},
        json={
            "text": text,
            "model_id": MODEL,
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.80,
                "style": 0.25,
                "use_speaker_boost": True,
            },
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.content


def concat_mp3(chunk_paths: list, out: Path):
    """Concatena MP3 binari (funziona senza ffmpeg per file CBR/VBR semplici)."""
    with open(out, "wb") as f:
        for p in chunk_paths:
            f.write(p.read_bytes())


for slug, voice_id in GUIDES:
    stem = f"{slug}-it"
    print(f"\n{'='*50}")
    print(f"  {stem}  (voice: {voice_id})")
    print(f"{'='*50}")

    chapters = parse_chapters(slug, "it")
    print(f"  Capitoli trovati: {len(chapters)}")

    chunk_dir = CHUNKS_DIR / stem
    chunk_dir.mkdir(parents=True, exist_ok=True)

    chunk_paths = []
    for i, (title, text) in enumerate(chapters, 1):
        chunk_path = chunk_dir / f"cap-{i:02d}.mp3"
        print(f"  [{i:02d}/{len(chapters)}] {title[:50]}...", end=" ", flush=True)

        if chunk_path.exists():
            print(f"  (skip — gia' esistente, {chunk_path.stat().st_size//1024}KB)")
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

        time.sleep(0.4)

    if len(chunk_paths) == len(chapters):
        out = AUDIO_DIR / f"{stem}.mp3"
        concat_mp3(chunk_paths, out)
        total_kb = out.stat().st_size // 1024
        print(f"\n  Concatenato: {out.name}  ({total_kb} KB)")
        print(f"  Chunk salvati in: {chunk_dir}/")
    else:
        print(f"\n  ATTENZIONE: solo {len(chunk_paths)}/{len(chapters)} chunk completati — NON concatenato")

print("\nFatto.")
