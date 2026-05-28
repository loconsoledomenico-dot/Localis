"""
Generatore guide audio EN/DE — Fish Audio s2
Uso: python scripts/generate_fishaudio_en_de.py <script.txt> <output.mp3> <voice_id> [api_key]

Voci consigliate Fish Audio:
  EN: cerca "English narrator" o "storytelling" su fish.audio
  DE: cerca "German narrator" su fish.audio
"""
import re
import sys
import time
import httpx
from pathlib import Path

API_KEY = "bbfc479590954d1782b660512e12f96c"
MODEL = "s2"


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
        # Rimuovi tag SSML — Fish Audio non li supporta
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        if len(text) > 20:
            chapters.append(text)
    return chapters


def tts(text: str, voice_id: str, api_key: str, retries: int = 3) -> bytes:
    for attempt in range(retries):
        try:
            r = httpx.post(
                'https://api.fish.audio/v1/tts',
                headers={
                    'Authorization': f'Bearer {api_key}',
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
                print(f"  Errore {r.status_code}: {r.text[:200]}")
        except Exception as e:
            print(f"  Eccezione attempt {attempt+1}: {e}")
        time.sleep(2)
    raise RuntimeError(f"TTS fallito dopo {retries} tentativi")


def main():
    if len(sys.argv) < 4:
        print("Uso: python generate_fishaudio_en_de.py <script.txt> <output.mp3> <voice_id> [api_key]")
        print("Esempio: python generate_fishaudio_en_de.py src/content/scripts/gargano-nord-en.txt public/audio/guides/gargano-nord-en.mp3 <voice_id>")
        sys.exit(1)

    script_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    voice_id = sys.argv[3]
    api_key = sys.argv[4] if len(sys.argv) > 4 else API_KEY

    for enc in ['utf-8', 'latin-1', 'cp1252']:
        try:
            raw = script_path.read_text(encoding=enc)
            break
        except UnicodeDecodeError:
            continue

    lines = raw.split('\n')
    start = next((i for i, l in enumerate(lines) if l.strip().startswith('=====')), 0)
    raw_body = '\n'.join(lines[start:])

    chapters = split_chapters(raw_body)
    print(f"Script: {script_path.name}")
    print(f"Voce: {voice_id}")
    print(f"Capitoli: {len(chapters)}")
    total_chars = sum(len(c) for c in chapters)
    print(f"Caratteri totali: {total_chars:,}")

    audio_parts = []
    for i, chapter in enumerate(chapters, 1):
        print(f"Cap. {i}/{len(chapters)} — {len(chapter)} car...", end=' ', flush=True)
        audio = tts(chapter, voice_id, api_key)
        audio_parts.append(audio)
        print(f"OK ({len(audio)//1024} KB)")
        time.sleep(0.5)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    total = b''.join(audio_parts)
    output_path.write_bytes(total)
    print(f"\nDone — {output_path} ({len(total)/1024/1024:.1f} MB)")


if __name__ == '__main__':
    main()
