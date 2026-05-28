"""
Upload VDI2 audio guides to R2 + generate and upload trailers.
Guide: ostuni, cisternino, fasano — IT (ElevenLabs) / EN (Fish Audio) / DE (ElevenLabs)

R2 structure:
  Full:    guides/<slug>/full-<lang>.mp3
  Trailer: audio/trailers/<slug>-<lang>.mp3
"""
import re
import os
import sys
import time
import httpx
import boto3

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from botocore.config import Config
from pathlib import Path
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

# ── R2 ────────────────────────────────────────────────────────────────────────
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET     = os.getenv("R2_BUCKET", "localis-audio")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

# ── API keys ──────────────────────────────────────────────────────────────────
EL_KEY  = "sk_950f82a503bbddfed6c8a6173f1ca1844f2f2c4f89226216"
FA_KEY  = "bbfc479590954d1782b660512e12f96c"

# ── Guide config ──────────────────────────────────────────────────────────────
# (slug, lang, voice_id, tts_provider)
GUIDES = [
    ("ostuni",     "it", "YGp1lBJLaHhfIFT0yeDE", "el"),   # Raffaele
    ("ostuni",     "en", "536d3a5e000945adb7038665781a4aca", "fa"),  # Ferdinando
    ("ostuni",     "de", "JBFqnCBsd6RMkjVDRZzb", "el"),   # George
    ("cisternino", "it", "mcMi8FJDhg35bMpWHv2R", "el"),   # Paolo
    ("cisternino", "en", "d8f13232599c4f60b5df3232ddededca", "fa"),  # Antonello
    ("cisternino", "de", "nPczCjzI2devNBz1zQrb", "el"),   # Brian
    ("fasano",     "it", "q2LDrL29FLqRR3XanHLq", "el"),   # Dante
    ("fasano",     "en", "9b20d81c64fd48448ee90da70f236d0e", "fa"),  # Nathan
    ("fasano",     "de", "IKne3meq5aSn9XLyUdCD", "el"),   # Charlie
]

SCRIPT_DIR = REPO_ROOT / "src/content/scripts"
AUDIO_DIR  = REPO_ROOT / "public/audio/guides"
TRAILER_DIR = REPO_ROOT / "public/audio/trailers"
TRAILER_DIR.mkdir(parents=True, exist_ok=True)


def upload(local: Path, key: str):
    mb = local.stat().st_size / 1024 / 1024
    print(f"  [R2] {key}  ({mb:.1f} MB)...", end=" ", flush=True)
    s3.upload_file(str(local), R2_BUCKET, key, ExtraArgs={"ContentType": "audio/mpeg"})
    print("OK")


def get_first_chapter(slug: str, lang: str) -> str:
    path = SCRIPT_DIR / f"{slug}-{lang}.txt"
    raw = path.read_text(encoding="utf-8")
    parts = re.split(r'={3,}', raw)
    for part in parts:
        body = []
        skip = True
        for line in part.strip().split('\n'):
            s = line.strip()
            if skip and (re.match(r'^(CAP\.|KAP\.|CHAP\.)', s) or
                         re.match(r'^voice:', s, re.IGNORECASE) or s == ''):
                continue
            skip = False
            body.append(line)
        text = '\n'.join(body).strip()
        if lang == "en":
            text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        if len(text) > 100:
            return text
    raise ValueError(f"No chapter found in {path}")


def tts_el(text: str, voice_id: str) -> bytes:
    r = httpx.post(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
        headers={'xi-api-key': EL_KEY, 'Content-Type': 'application/json'},
        json={
            'text': text, 'model_id': 'eleven_multilingual_v2',
            'voice_settings': {'stability': 0.45, 'similarity_boost': 0.80,
                               'style': 0.25, 'use_speaker_boost': True},
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.content


def tts_fa(text: str, voice_id: str) -> bytes:
    r = httpx.post(
        'https://api.fish.audio/v1/tts',
        headers={'Authorization': f'Bearer {FA_KEY}', 'Content-Type': 'application/json'},
        json={'text': text, 'reference_id': voice_id, 'model': 's2',
              'format': 'mp3', 'mp3_bitrate': 192, 'latency': 'normal'},
        timeout=120,
    )
    r.raise_for_status()
    return r.content


# ── Main ──────────────────────────────────────────────────────────────────────
for slug, lang, voice_id, provider in GUIDES:
    stem = f"{slug}-{lang}"
    print(f"\n--- {stem} ---")

    # 1. Upload full guide
    full_local = AUDIO_DIR / f"{stem}.mp3"
    full_key   = f"guides/{slug}/full-{lang}.mp3"
    if full_local.exists():
        upload(full_local, full_key)
    else:
        print(f"  [WARN] Full audio missing: {full_local.name}")

    # 2. Generate trailer (first chapter TTS)
    trailer_local = TRAILER_DIR / f"{stem}.mp3"
    trailer_key   = f"audio/trailers/{stem}.mp3"
    print(f"  [TRL] generating trailer...", end=" ", flush=True)
    try:
        chapter_text = get_first_chapter(slug, lang)
        audio = tts_el(chapter_text, voice_id) if provider == "el" else tts_fa(chapter_text, voice_id)
        trailer_local.write_bytes(audio)
        print(f"OK ({len(audio)//1024}KB)")
        upload(trailer_local, trailer_key)
    except Exception as e:
        print(f"ERRORE: {e}")

    time.sleep(0.5)

print("\nFatto.")
