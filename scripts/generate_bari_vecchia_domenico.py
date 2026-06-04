import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")
OUTPUT_DIR = Path(__file__).parent.parent / "private" / "audio" / "guides"
SCRIPTS_DIR = Path(__file__).parent.parent / "src" / "content" / "scripts"

CHAPTERS = [
    ("bari-vecchia-domenico-cap1-it.txt", "bari-vecchia-domenico-cap1-it.mp3"),
    ("bari-vecchia-domenico-cap2-it.txt", "bari-vecchia-domenico-cap2-it.mp3"),
    ("bari-vecchia-domenico-cap3-it.txt", "bari-vecchia-domenico-cap3-it.mp3"),
    ("bari-vecchia-domenico-cap4-it.txt", "bari-vecchia-domenico-cap4-it.mp3"),
    ("bari-vecchia-domenico-cap5-it.txt", "bari-vecchia-domenico-cap5-it.mp3"),
    ("bari-vecchia-domenico-cap6-it.txt", "bari-vecchia-domenico-cap6-it.mp3"),
    ("bari-vecchia-domenico-cap7-it.txt", "bari-vecchia-domenico-cap7-it.mp3"),
    ("bari-vecchia-domenico-cap8-it.txt", "bari-vecchia-domenico-cap8-it.mp3"),
]


def get_voice_id(name: str) -> str:
    """Trova il voice_id cercando per nome."""
    resp = requests.get(
        "https://api.elevenlabs.io/v1/voices",
        headers={"xi-api-key": API_KEY},
    )
    resp.raise_for_status()
    voices = resp.json()["voices"]
    for v in voices:
        if name.lower() in v["name"].lower():
            print(f"Trovata voce: {v['name']} -> {v['voice_id']}")
            return v["voice_id"]
    raise ValueError(f"Voce '{name}' non trovata. Voci disponibili: {[v['name'] for v in voices]}")


def generate_chapter(voice_id: str, script_file: str, output_file: str):
    text = (SCRIPTS_DIR / script_file).read_text(encoding="utf-8")
    ssml = f"<speak>{text}</speak>"

    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": ssml,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.35,
                "similarity_boost": 0.80,
                "style": 0.45,
                "use_speaker_boost": True,
            },
        },
    )

    if resp.status_code != 200:
        print(f"ERRORE {script_file}: {resp.status_code} — {resp.text}")
        return

    out_path = OUTPUT_DIR / output_file
    out_path.write_bytes(resp.content)
    size_kb = out_path.stat().st_size // 1024
    print(f"OK  {output_file}  ({size_kb} KB)")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    voice_id = get_voice_id("corrado")

    for script_file, output_file in CHAPTERS:
        out_path = OUTPUT_DIR / output_file
        if out_path.exists():
            print(f"SKIP {output_file} (già esistente)")
            continue
        print(f"Genero {script_file}...")
        generate_chapter(voice_id, script_file, output_file)

    print("\nFatto. File salvati in:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
