"""
Generatore guide audio — Fish Audio
Uso: python scripts/generate_guide_fishaudio.py <script.txt> <output.mp3> [voice_id]

- Rimuove tag SSML (<break .../>, <...>)
- Rimuove header capitoli (=====, CAP., voice:)
- Genera capitolo per capitolo
- Concatena tutto in un MP3 finale
"""
import re
import sys
import time
import httpx
from pathlib import Path

API_KEY = "bbfc479590954d1782b660512e12f96c"
DEFAULT_VOICE = "3430505376334b7f9993456179b4737a"

# Parole sdrucciole italiane comuni che il TTS sbaglia — aggiungi accent mark
ACCENT_FIXES = {
    r'\bSiediti\b': 'Sièditi',
    r'\bsiediti\b': 'sièditi',
    r'\bCapita\b': 'Càpita',
    r'\bcapita\b': 'càpita',
    r'\bUltimo\b': 'Ùltimo',
    r'\bultimo\b': 'ùltimo',
    r'\bSubito\b': 'Sùbito',
    r'\bsubito\b': 'sùbito',
    r'\bAnima\b': 'Ànima',
    r'\banima\b': 'ànima',
    r'\bNumero\b': 'Nùmero',
    r'\bnumero\b': 'nùmero',
    r'\bCentimetri\b': 'Centìmetri',
    r'\bcentimetri\b': 'centìmetri',
    r'\bKilometri\b': 'Chilòmetri',
    r'\bchilometri\b': 'chilòmetri',
}


def clean_text(text: str) -> str:
    # Rimuovi tag SSML
    text = re.sub(r'<[^>]+>', '', text)
    # Rimuovi header sezione (=====)
    text = re.sub(r'=+', '', text)
    # Rimuovi header capitolo (CAP. N — ...)
    text = re.sub(r'^CAP\.\s+\d+\s*—.*$', '', text, flags=re.MULTILINE)
    # Rimuovi riga "voice: xxx"
    text = re.sub(r'^voice:\s*\w+\s*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    # Rimuovi prima riga (titolo guida) e seconda (descrizione voce)
    lines = text.split('\n')
    # Applica fix accenti
    for pattern, replacement in ACCENT_FIXES.items():
        text = re.sub(pattern, replacement, text)
    # Comprimi righe vuote multiple in massimo 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def split_chapters(raw: str) -> list[str]:
    """Divide il testo grezzo in capitoli (separati da =====)."""
    parts = re.split(r'={3,}', raw)
    chapters = []
    for part in parts:
        # Rimuovi header (CAP. / voice:) e tieni solo il corpo
        lines = part.strip().split('\n')
        body_lines = []
        skip_header = True
        for line in lines:
            stripped = line.strip()
            if skip_header and (
                re.match(r'^CAP\.', stripped) or
                re.match(r'^voice:', stripped, re.IGNORECASE) or
                stripped == ''
            ):
                continue
            skip_header = False
            body_lines.append(line)
        body = '\n'.join(body_lines).strip()
        if len(body) > 20:
            chapters.append(body)
    return chapters


def clean_chapter(text: str) -> str:
    # Rimuovi tag SSML
    text = re.sub(r'<[^>]+>', '', text)
    # Applica fix accenti
    for pattern, replacement in ACCENT_FIXES.items():
        text = re.sub(pattern, replacement, text)
    # Comprimi righe vuote multiple
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def tts(text: str, voice_id: str, retries: int = 3) -> bytes:
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
    if len(sys.argv) < 3:
        print("Uso: python generate_guide_fishaudio.py <script.txt> <output.mp3> [voice_id]")
        sys.exit(1)

    script_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    voice_id = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_VOICE

    raw = script_path.read_text(encoding='utf-8')

    # Rimuovi titolo guida e descrizione voce (prime righe non-vuote)
    lines = raw.split('\n')
    start = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('====='):
            start = i
            break
    raw_body = '\n'.join(lines[start:])

    chapters = split_chapters(raw_body)
    print(f"Capitoli trovati: {len(chapters)}")

    audio_parts = []
    for i, chapter in enumerate(chapters, 1):
        text = clean_chapter(chapter)
        chars = len(text)
        print(f"Cap. {i}/{len(chapters)} — {chars} caratteri...", end=' ', flush=True)
        audio = tts(text, voice_id)
        audio_parts.append(audio)
        print(f"OK ({len(audio)//1024} KB)")
        time.sleep(0.5)  # rate limit gentile

    # Concatena MP3 (concatenazione diretta funziona per MP3 CBR)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    total = b''.join(audio_parts)
    output_path.write_bytes(total)

    total_kb = len(total) / 1024
    total_mb = total_kb / 1024
    print(f"\nDone — {output_path} ({total_mb:.1f} MB, {len(chapters)} capitoli)")


if __name__ == '__main__':
    main()
