"""
Generatore guide audio DE — ElevenLabs (batch)
Voci tedesche assegnate:
  gargano-nord    → Stefano    (Tristan)    sx7WD8TJIOrk5RQOptDH
  gargano-paesi   → Ferdinando (Leon Stern) re2r5d74PqDzicySNW0I
  gargano-sacro   → Frà Salvatore (Alexander) kkJxCnlRCckmfFvzDW5Q
  gargano-saline  → Antonello  (Vincent)   ABvMrd8urrMUl3V6UZ3Y
  gargano-tremiti → Tonino     (Stephan)   IWm8DnJ4NGjFI7QAM5lM
  gargano-vieste  → Rossella   (Annika)    ViKqgJNeCiWZlYgHiAOO
"""
import re
import sys
import time
import httpx
from pathlib import Path

API_KEY = "sk_a4afd3f8c93b9a8c26d0c6f0e12e6505c8d7dcca7c42a115"
MODEL = "eleven_multilingual_v2"

GUIDES = [
    ("gargano-nord-de",    "sx7WD8TJIOrk5RQOptDH"),   # Stefano / Tristan
    ("gargano-paesi-de",   "re2r5d74PqDzicySNW0I"),   # Ferdinando / Leon Stern
    ("gargano-sacro-de",   "kkJxCnlRCckmfFvzDW5Q"),   # Fra Salvatore / Alexander
    ("gargano-saline-de",  "ABvMrd8urrMUl3V6UZ3Y"),   # Antonello / Vincent
    ("gargano-tremiti-de", "IWm8DnJ4NGjFI7QAM5lM"),   # Tonino / Stephan
    ("gargano-vieste-de",  "ViKqgJNeCiWZlYgHiAOO"),   # Rossella / Annika
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
                re.match(r'^(CAP\.|KAP\.)', s) or
                re.match(r'^voice:', s, re.IGNORECASE) or
                s == ''
            ):
                continue
            skip = False
            body.append(line)
        text = '\n'.join(body).strip()
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        if len(text) > 20:
            chapters.append(text)
    return chapters


def tts(text: str, voice_id: str, retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            r = httpx.post(
                f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
                headers={
                    'xi-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                json={
                    'text': text,
                    'model_id': MODEL,
                    'voice_settings': {
                        'stability': 0.45,
                        'similarity_boost': 0.80,
                        'style': 0.25,
                        'use_speaker_boost': True,
                    },
                },
                timeout=120,
            )
            if r.status_code == 200:
                return r.content
            else:
                code = r.status_code
                print(f" retry {attempt+1} ({code})..", end=' ', flush=True)
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

    raw = script_path.read_text(encoding='utf-8')
    lines = raw.split('\n')
    start = next((i for i, l in enumerate(lines) if l.strip().startswith('=====')), 0)
    raw_body = '\n'.join(lines[start:])
    chapters = split_chapters(raw_body)

    print(f"\n{stem} — {len(chapters)} cap")
    audio_parts = []
    for i, chapter in enumerate(chapters, 1):
        print(f"  Cap {i}/{len(chapters)}...", end=' ', flush=True)
        audio = tts(chapter, voice_id)
        if audio:
            audio_parts.append(audio)
            print(f"OK ({len(audio)//1024}KB)")
        else:
            print("FALLITO — capitolo saltato")
        time.sleep(0.3)

    if audio_parts:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        if out_path.exists():
            out_path.unlink()
        out_path.write_bytes(b''.join(audio_parts))
        mb = out_path.stat().st_size / 1024 / 1024
        print(f"  => {out_path} ({mb:.1f} MB)")
    else:
        print(f"  Nessun audio generato per {stem}")


if __name__ == '__main__':
    filter_stem = sys.argv[1] if len(sys.argv) > 1 else None
    for stem, voice_id in GUIDES:
        if filter_stem and stem != filter_stem:
            continue
        generate_guide(stem, voice_id)
    print("\nFatto.")
