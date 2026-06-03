import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "he4iF6V8tdCa0FGloXxE"
OUTPUT_DIR = Path(__file__).parent.parent / "private" / "audio" / "guides"
SCRIPTS_DIR = Path(__file__).parent.parent / "src" / "content" / "scripts"

CHAPTERS = [
    ("bari-vecchia-domenico-cap1-de.txt", "bari-vecchia-domenico-cap1-de.mp3"),
    ("bari-vecchia-domenico-cap2-de.txt", "bari-vecchia-domenico-cap2-de.mp3"),
    ("bari-vecchia-domenico-cap3-de.txt", "bari-vecchia-domenico-cap3-de.mp3"),
    ("bari-vecchia-domenico-cap4-de.txt", "bari-vecchia-domenico-cap4-de.mp3"),
    ("bari-vecchia-domenico-cap5-de.txt", "bari-vecchia-domenico-cap5-de.mp3"),
    ("bari-vecchia-domenico-cap6-de.txt", "bari-vecchia-domenico-cap6-de.mp3"),
    ("bari-vecchia-domenico-cap7-de.txt", "bari-vecchia-domenico-cap7-de.mp3"),
    ("bari-vecchia-domenico-cap8-de.txt", "bari-vecchia-domenico-cap8-de.mp3"),
]


def generate_chapter(script_file, output_file):
    text = (SCRIPTS_DIR / script_file).read_text(encoding="utf-8")
    ssml = f"<speak>{text}</speak>"

    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={"xi-api-key": API_KEY, "Content-Type": "application/json"},
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
        print(f"ERRORE {script_file}: {resp.status_code} -- {resp.text}")
        return

    out_path = OUTPUT_DIR / output_file
    out_path.write_bytes(resp.content)
    print(f"OK  {output_file}  ({out_path.stat().st_size // 1024} KB)")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for script_file, output_file in CHAPTERS:
        out_path = OUTPUT_DIR / output_file
        if out_path.exists():
            print(f"SKIP {output_file} (gia esistente)")
            continue
        print(f"Genero {script_file}...")
        generate_chapter(script_file, output_file)
    print("\nFatto. File salvati in:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
