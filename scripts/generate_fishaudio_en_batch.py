"""
Generatore guide audio EN — Fish Audio s2 (batch)
Mappatura definitiva personaggi → guide (uniforme con IT e DE):
  gargano-nord    → Nathan       9b20d81c64fd48448ee90da70f236d0e
  gargano-paesi   → Ferdinando   536d3a5e000945adb7038665781a4aca
  gargano-sacro   → Fra Salvatore 0327fdb5da9e4fd782899a8058c8ae2b
  gargano-saline  → Antonello    d8f13232599c4f60b5df3232ddededca
  gargano-tremiti → Tonino       cd3b00723b114873918c0870b0a87843
  gargano-vieste  → Rossella     d8a1340984ee4b63ad1ffae27a6a4339
"""
import re
import sys
import time
import httpx
from pathlib import Path

API_KEY = "bbfc479590954d1782b660512e12f96c"
MODEL = "s2"

GUIDES = [
    ("gargano-nord-en",    "9b20d81c64fd48448ee90da70f236d0e"),   # Nathan
    ("gargano-paesi-en",   "536d3a5e000945adb7038665781a4aca"),   # Ferdinando
    ("gargano-sacro-en",   "0327fdb5da9e4fd782899a8058c8ae2b"),   # Fra Salvatore
    ("gargano-saline-en",  "d8f13232599c4f60b5df3232ddededca"),   # Antonello
    ("gargano-tremiti-en", "cd3b00723b114873918c0870b0a87843"),   # Tonino
    ("gargano-vieste-en",  "d8a1340984ee4b63ad1ffae27a6a4339"),   # Rossella
]

SCRIPT_DIR = Path("src/content/scripts")
OUT_DIR = Path("public/audio/guides")


def split_chapters(raw: str) -> list[str]:
    parts = re.split(r'={3,}', raw)
    chapters = []
    for part in parts:
        body = []
        skip = True
        for line in part.strip().split('\n'):
            s = line.strip()
            if skip and (
                re.match(r'^(CAP\.|KAP\.|CHAP\.)', s) or
                re.match(r'^voice:', s, re.IGNORECASE) or
                s == ''
            ):
                continue
            skip = False
            body.append(line)
        text = '\n'.join(body).strip()
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        if len(text) > 20:
            chapters.append(text)
    return chapters


def tts(text: str, voice_id: str, retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            r = httpx.post(
                'https://api.fish.audio/v1/tts',
                headers={
                    'Authorization': f'Bearer {API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'text': text,
                    'reference_id': voice_id,
                    'model': MODEL,
                    'format': 'mp3',
                    'mp3_bitrate': 192,
                    'latency': 'normal',
                },
                timeout=120,
            )
            if r.status_code == 200:
                return r.content
            else:
                print(f" retry {attempt+1} ({r.status_code})..", end=' ', flush=True)
                time.sleep(5)
        except Exception as e:
            print(f" retry {attempt+1} (err: {e})..", end=' ', flush=True)
            time.sleep(5)
    return None


def generate_guide(stem: str, voice_id: str):
    script_path = SCRIPT_DIR / f"{stem}.txt"
    out_path = OUT_DIR / f"{stem}.mp3"

    if not script_path.exists():
        print(f"Script mancante: {script_path}")
        return

    for enc in ['utf-8', 'latin-1', 'cp1252']:
        try:
            raw = script_path.read_text(encoding=enc)
            break
        except UnicodeDecodeError:
            continue

    lines = raw.split('\n')
    start = next((i for i, l in enumerate(lines) if l.strip().startswith('=====')), 0)
    chapters = split_chapters('\n'.join(lines[start:]))

    print(f"\n{stem} — {len(chapters)} cap")
    audio_parts = []
    for i, chapter in enumerate(chapters, 1):
        print(f"  Cap {i}/{len(chapters)}...", end=' ', flush=True)
        audio = tts(chapter, voice_id)
        if audio:
            audio_parts.append(audio)
            print(f"OK ({len(audio)//1024}KB)")
        else:
            print("FALLITO — saltato")
        time.sleep(0.5)

    if audio_parts:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        if out_path.exists():
            out_path.unlink()
        out_path.write_bytes(b''.join(audio_parts))
        mb = out_path.stat().st_size / 1024 / 1024
        print(f"  => {out_path} ({mb:.1f} MB)")
    else:
        print(f"  Nessun audio per {stem}")


if __name__ == '__main__':
    # Passa un stem come argomento per rigenerare solo quella guida
    filter_stem = sys.argv[1] if len(sys.argv) > 1 else None
    for stem, voice_id in GUIDES:
        if filter_stem and stem != filter_stem:
            continue
        generate_guide(stem, voice_id)
    print("\nFatto.")
