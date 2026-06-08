"""
Generate IT guide audio with ElevenLabs.
Usage:
  python scripts/generate_elevenlabs_it.py <script.txt> <output.mp3> <voice_id> [api_key]
"""
import re
import sys
import time
import tempfile
from pathlib import Path

import httpx

from tts_pause_utils import build_tts_plan, concat_mp3_files, make_silence_mp3


API_KEY = None
MODEL = "eleven_multilingual_v2"

ACCENT_FIXES = {
    r"\bSiediti\b": "Sièditi",
    r"\bsiediti\b": "sièditi",
    r"\bCapita\b": "Càpita",
    r"\bcapita\b": "càpita",
    r"\bSubito\b": "Sùbito",
    r"\bsubito\b": "sùbito",
    r"\bNumero\b": "Nùmero",
    r"\bnumero\b": "nùmero",
    r"\bUltimo\b": "Ùltimo",
    r"\bultimo\b": "ùltimo",
    r"\bAnima\b": "Ànima",
    r"\banima\b": "ànima",
    r"\bchilometri\b": "chilòmetri",
    r"\bsecolo\b": "sècolo",
    r"\bSecolo\b": "Sècolo",
    r"\bpopolo\b": "pòpolo",
    r"\bPopolo\b": "Pòpolo",
    r"\bsimile\b": "sìmile",
    r"\bSimile\b": "Sìmile",
    r"\bfacile\b": "fàcile",
    r"\bFacile\b": "Fàcile",
    r"\bdomani\b": "domàni",
    r"\bGargano\b": "Gargàno",
    r"\bgargano\b": "gargàno",
    r"\bCaffe\b": "Caffè",
    r"\bcaffe\b": "caffè",
    r"\bCaffè\b": "Caffè",
}


def split_chapters(raw: str) -> list[str]:
    parts = re.split(r"={3,}", raw)
    chapters: list[str] = []
    for part in parts:
        body = []
        skip = True
        for line in part.strip().split("\n"):
            s = line.strip()
            if skip and (
                re.match(r"^(CAP\.|KAP\.)", s)
                or re.match(r"^voice:", s, re.IGNORECASE)
                or s == ""
            ):
                continue
            skip = False
            body.append(line)
        text = "\n".join(body).strip()
        for pattern, replacement in ACCENT_FIXES.items():
            text = re.sub(pattern, replacement, text)
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if len(text) > 20:
            chapters.append(text)
    return chapters


def tts(text: str, voice_id: str, api_key: str, retries: int = 3) -> bytes:
    for attempt in range(retries):
        try:
            response = httpx.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                },
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
            if response.status_code == 200:
                return response.content
            print(f"  Errore {response.status_code}: {response.text[:200]}")
        except Exception as exc:
            print(f"  Eccezione attempt {attempt + 1}: {exc}")
        time.sleep(3)
    raise RuntimeError(f"TTS fallito dopo {retries} tentativi")


def main() -> None:
    if len(sys.argv) < 4:
        print("Uso: python generate_elevenlabs_it.py <script.txt> <output.mp3> <voice_id> [api_key]")
        sys.exit(1)

    script_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    voice_id = sys.argv[3]
    api_key = sys.argv[4] if len(sys.argv) > 4 else API_KEY

    if not api_key:
        print("Errore: api_key mancante.")
        sys.exit(1)

    raw = script_path.read_text(encoding="utf-8")
    lines = raw.split("\n")
    start = next((i for i, line in enumerate(lines) if line.strip().startswith("=====")), 0)
    chapters = split_chapters("\n".join(lines[start:]))

    print(f"Script: {script_path.name}")
    print(f"Voce: {voice_id}")
    print(f"Capitoli: {len(chapters)}")

    with tempfile.TemporaryDirectory(prefix=f"{script_path.stem}-") as tmpdir:
        tmpdir_path = Path(tmpdir)
        part_paths: list[Path] = []
        clip_idx = 1

        for index, chapter in enumerate(chapters, 1):
            plan = build_tts_plan(chapter)
            speech_segments = sum(1 for kind, _ in plan if kind == "speech")
            print(f"Cap. {index}/{len(chapters)} - {speech_segments} segmenti voce...", end=" ", flush=True)
            for kind, payload in plan:
                clip_path = tmpdir_path / f"{clip_idx:04d}.mp3"
                if kind == "speech":
                    audio = tts(str(payload), voice_id, api_key)
                    clip_path.write_bytes(audio)
                else:
                    make_silence_mp3(clip_path, float(payload))
                part_paths.append(clip_path)
                clip_idx += 1
            print("OK")
            time.sleep(0.3)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        concat_mp3_files(part_paths, output_path, bitrate="192k")
        print(f"\nDone - {output_path} ({output_path.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
