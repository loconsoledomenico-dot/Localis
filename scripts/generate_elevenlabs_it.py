"""
Generatore guide audio IT — ElevenLabs
Uso: python scripts/generate_elevenlabs_it.py <script.txt> <output.mp3> <voice_id> [api_key]

- Rimuove tag SSML ElevenLabs (<break .../>) — li gestisce nativamente
- Rimuove header capitoli (=====, KAP./CAP., voice:)
- Genera capitolo per capitolo con pause tra i paragrafi
- Concatena in MP3 finale

Voci italiane consigliate dalla ElevenLabs Voice Library:
  Cerca "Italian" su https://elevenlabs.io/voice-library
"""
import re
import sys
import time
import httpx
from pathlib import Path

API_KEY = None  # passa come argomento o imposta qui
DEFAULT_VOICE = None  # es. "pNInz6obpgDQGcFmaJgB"
MODEL = "eleven_multilingual_v2"

ACCENT_FIXES = {
    r'\bSiediti\b': 'Sièditi', r'\bsiediti\b': 'sièditi',
    r'\bCapita\b': 'Càpita', r'\bcapita\b': 'càpita',
    r'\bSubito\b': 'Sùbito', r'\bsubito\b': 'sùbito',
    r'\bNumero\b': 'Nùmero', r'\bnumero\b': 'nùmero',
    r'\bUltimo\b': 'Ùltimo', r'\bultimo\b': 'ùltimo',
    r'\bAnima\b': 'Ànima', r'\banima\b': 'ànima',
    r'\bchilometri\b': 'chilòmetri',
    r'\bsecolo\b': 'sècolo', r'\bSecolo\b': 'Sècolo',
    r'\bpopolo\b': 'pòpolo', r'\bPopolo\b': 'Pòpolo',
    r'\bsimile\b': 'sìmile', r'\bSimile\b': 'Sìmile',
    r'\bfacile\b': 'fàcile', r'\bFacile\b': 'Fàcile',
    r'\bdomani\b': 'domàni',
}


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
        # Mantieni i tag <break> — ElevenLabs li interpreta nativamente
        for p, r in ACCENT_FIXES.items():
            text = re.sub(p, r, text)
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        if len(text) > 20:
            chapters.append(text)
    return chapters


def tts(text: str, voice_id: str, api_key: str, retries: int = 3) -> bytes:
    for attempt in range(retries):
        try:
            r = httpx.post(
                f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
                headers={
                    'xi-api-key': api_key,
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
                print(f"  Errore {r.status_code}: {r.text[:200]}")
        except Exception as e:
            print(f"  Eccezione attempt {attempt+1}: {e}")
        time.sleep(3)
    raise RuntimeError(f"TTS fallito dopo {retries} tentativi")


def main():
    if len(sys.argv) < 4:
        print("Uso: python generate_elevenlabs_it.py <script.txt> <output.mp3> <voice_id> [api_key]")
        print("Esempio: python generate_elevenlabs_it.py src/content/scripts/gargano-nord-it.txt public/audio/guides/gargano-nord-it.mp3 pNInz6obpgDQGcFmaJgB")
        sys.exit(1)

    script_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    voice_id = sys.argv[3]
    api_key = sys.argv[4] if len(sys.argv) > 4 else API_KEY

    if not api_key:
        print("Errore: api_key mancante. Passala come 4° argomento o impostala nel file.")
        sys.exit(1)

    raw = script_path.read_text(encoding='utf-8')
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
        chars = len(chapter)
        print(f"Cap. {i}/{len(chapters)} — {chars} car...", end=' ', flush=True)
        audio = tts(chapter, voice_id, api_key)
        audio_parts.append(audio)
        print(f"OK ({len(audio)//1024} KB)")
        time.sleep(0.3)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    total = b''.join(audio_parts)
    output_path.write_bytes(total)
    print(f"\nDone — {output_path} ({len(total)/1024/1024:.1f} MB)")


if __name__ == '__main__':
    main()
