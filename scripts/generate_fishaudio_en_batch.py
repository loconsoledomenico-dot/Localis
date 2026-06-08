"""
Generate EN guide audio with Fish Audio.
"""
import re
import sys
import time
import tempfile
from pathlib import Path

import httpx

from tts_pause_utils import build_tts_plan, concat_mp3_files, make_silence_mp3


API_KEY = "bbfc479590954d1782b660512e12f96c"
MODEL = "s2"

GUIDES = [
    ("gargano-nord-en", "9b20d81c64fd48448ee90da70f236d0e"),
    ("gargano-paesi-en", "536d3a5e000945adb7038665781a4aca"),
    ("gargano-sacro-en", "0327fdb5da9e4fd782899a8058c8ae2b"),
    ("gargano-saline-en", "d8f13232599c4f60b5df3232ddededca"),
    ("gargano-tremiti-en", "cd3b00723b114873918c0870b0a87843"),
    ("gargano-vieste-en", "d8a1340984ee4b63ad1ffae27a6a4339"),
]

SCRIPT_DIR = Path("src/content/scripts")
OUT_DIR = Path("public/audio/guides")


def split_chapters(raw: str) -> list[str]:
    parts = re.split(r"={3,}", raw)
    chapters: list[str] = []
    for part in parts:
        body = []
        skip = True
        for line in part.strip().split("\n"):
            s = line.strip()
            if skip and (
                re.match(r"^(CAP\.|KAP\.|CHAP\.)", s)
                or re.match(r"^voice:", s, re.IGNORECASE)
                or s == ""
            ):
                continue
            skip = False
            body.append(line)
        text = "\n".join(body).strip()
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if len(text) > 20:
            chapters.append(text)
    return chapters


def tts(text: str, voice_id: str, retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            response = httpx.post(
                "https://api.fish.audio/v1/tts",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "reference_id": voice_id,
                    "model": MODEL,
                    "format": "mp3",
                    "mp3_bitrate": 192,
                    "latency": "normal",
                },
                timeout=120,
            )
            if response.status_code == 200:
                return response.content
            print(f" retry {attempt + 1} ({response.status_code})..", end=" ", flush=True)
            time.sleep(5)
        except Exception as exc:
            print(f" retry {attempt + 1} (err: {exc})..", end=" ", flush=True)
            time.sleep(5)
    return None


def generate_guide(stem: str, voice_id: str) -> None:
    script_path = SCRIPT_DIR / f"{stem}.txt"
    out_path = OUT_DIR / f"{stem}.mp3"

    if not script_path.exists():
        print(f"Script mancante: {script_path}")
        return

    raw = None
    for encoding in ("utf-8", "latin-1", "cp1252"):
        try:
            raw = script_path.read_text(encoding=encoding)
            break
        except UnicodeDecodeError:
            continue
    if raw is None:
        print(f"Impossibile leggere: {script_path}")
        return

    lines = raw.split("\n")
    start = next((i for i, line in enumerate(lines) if line.strip().startswith("=====")), 0)
    chapters = split_chapters("\n".join(lines[start:]))

    print(f"\n{stem} - {len(chapters)} cap")
    with tempfile.TemporaryDirectory(prefix=f"{stem}-") as tmpdir:
        tmpdir_path = Path(tmpdir)
        part_paths: list[Path] = []
        clip_idx = 1

        for index, chapter in enumerate(chapters, 1):
            print(f"  Cap {index}/{len(chapters)}...", end=" ", flush=True)
            plan = build_tts_plan(chapter)
            speech_segments = 0
            for kind, payload in plan:
                clip_path = tmpdir_path / f"{clip_idx:04d}.mp3"
                if kind == "speech":
                    audio = tts(str(payload), voice_id)
                    if not audio:
                        continue
                    clip_path.write_bytes(audio)
                    speech_segments += 1
                else:
                    make_silence_mp3(clip_path, float(payload))
                part_paths.append(clip_path)
                clip_idx += 1
            print(f"OK ({speech_segments} segmenti voce)")
            time.sleep(0.5)

        if not part_paths:
            print(f"  Nessun audio per {stem}")
            return

        OUT_DIR.mkdir(parents=True, exist_ok=True)
        concat_mp3_files(part_paths, out_path, bitrate="192k")
        mb = out_path.stat().st_size / 1024 / 1024
        print(f"  => {out_path} ({mb:.1f} MB)")


if __name__ == "__main__":
    filter_stem = sys.argv[1] if len(sys.argv) > 1 else None
    voice_override = sys.argv[2] if len(sys.argv) > 2 else None
    for stem, voice_id in GUIDES:
        if filter_stem and stem != filter_stem:
            continue
        generate_guide(stem, voice_override or voice_id)
    print("\nFatto.")
