"""
Upload guide DE Bari su R2 + genera trailer DE + aggiorna MDX frontmatter.
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

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
    config=Config(signature_version="s3v4"),
    region_name="auto",
)
BUCKET = os.getenv("R2_BUCKET", "localis-audio")
FA_KEY = "bbfc479590954d1782b660512e12f96c"

AUDIO_DIR   = REPO_ROOT / "public/audio/guides"
TRAILER_DIR = REPO_ROOT / "public/audio/trailers"
TRAILER_DIR.mkdir(parents=True, exist_ok=True)
GUIDES_DIR  = REPO_ROOT / "src/content/guides"

GUIDES = [
    ("bari-vecchia",      "40f470ff12064bf1897215b41819147c"),
    ("porto-bari",        "21a055ae154d41fdb24d02e6ac3f1334"),
    ("san-nicola",        "dae27abda6be4299b86b300a8e3f326a"),
    ("tre-teatri",        "50954d64d2fc49de93fbe2a73f028763"),
    ("bari-sotterranea",  "285f00e53ff14eb1b111532fb39569d3"),
    ("il-meglio-di-bari", "39782934bdbb491b8bc567f831757fc9"),
]

TRAILERS = {
    "bari-vecchia": "Bari Vecchia. Die Altstadt, wie sie wirklich ist — nicht wie sie in Reiseführern steht. Ich bin Domenico, hier aufgewachsen, zwischen diesen Gassen, diesen Höfen, diesen Steinen. Ich kenne jede Geschichte, die auf keinem Schild steht. Dreißig Minuten. Sechzehn Orte. Viertausend Jahre Geschichte. Lass mich dir zeigen, wie wir wirklich leben.",

    "porto-bari": "Der Hafen von Bari ist nicht einfach ein Hafen. Er ist der Anfang und das Ende von allem. Hier kamen die Kreuzfahrer an. Hier gingen die Emigranten weg. Hier kommen heute die Fähren aus Griechenland und Albanien. Ich bin Luigi. Ich bin hier aufgewachsen, am Kai. Dieser Hafen ist nicht meine Arbeit — er ist meine Geschichte.",

    "san-nicola": "Achtzig Jahre. Sechzig Prozessionen. Unzählige Abende in dieser Basilika. Ich bin Nonno Nicola — und San Nicola ist für mich keine Geschichte aus dem Buch. Er ist Familie. Ich erzähle dir, wie der Heilige wirklich hierher kam, was wirklich in der Krypta liegt, und warum dieser Diebstahl im Jahr 1087 den Weihnachtsmann erfunden hat.",

    "tre-teatri": "Drei Theater haben Bari zu einer europäischen Stadt gemacht. Das Petruzzelli, das Margherita, das Piccinni. Ich bin Filippo, Architekt. Ich studiere diese Gebäude seit Jahren — ihre Schichten, ihre Narben, ihre Wiedergeburten. In dreißig Minuten erzähle ich dir, was diese Fassaden wirklich verbergen.",

    "bari-sotterranea": "Fünfzig Jahre in der Basilika von San Nicola. Ich habe gefegt, geordnet, zugehört. Jetzt bin ich in Rente — aber die Steine der Krypta kenne ich auswendig. Ich bin Rosa. Und ich nehme dich mit nach unten, dorthin, wo Bari anfängt.",

    "il-meglio-di-bari": "Focaccia vom Ofen. Tintenfisch vom Fischhändler. Orecchiette direkt von der Straße. Ich bin Rachele — und ich esse nie allein. Diese Führung ist keine Restaurantliste. Das ist das, was wir wirklich essen. Wo wir hingehen. Was du nicht verpassen darfst, wenn du nach Bari kommst.",
}


def tts_fa(text: str, voice_id: str) -> bytes:
    r = httpx.post(
        "https://api.fish.audio/v1/tts",
        headers={"Authorization": f"Bearer {FA_KEY}", "Content-Type": "application/json"},
        json={"text": text, "reference_id": voice_id, "model": "s2",
              "format": "mp3", "mp3_bitrate": 192, "latency": "normal"},
        timeout=120,
    )
    r.raise_for_status()
    return r.content


def upload(local: Path, key: str):
    mb = local.stat().st_size / 1024 / 1024
    print(f"  [R2] {key} ({mb:.1f}MB)...", end=" ", flush=True)
    s3.upload_file(str(local), BUCKET, key, ExtraArgs={"ContentType": "audio/mpeg"})
    print("OK")


def update_mdx(slug: str):
    mdx = GUIDES_DIR / f"{slug}.mdx"
    txt = mdx.read_text(encoding="utf-8")

    additions = {
        "audio_full_key_de":   f"guides/{slug}/full-de.mp3",
        "audio_trailer_path_de": f"/audio/trailers/{slug}-de.mp3",
    }

    for key, val in additions.items():
        if key in txt:
            print(f"  [MDX] {key} gia' presente, skip")
            continue
        # Insert after the _en version
        en_key = key.replace("_de", "_en")
        if en_key in txt:
            txt = txt.replace(
                f"{en_key}: {next(v for k,v in [('audio_full_key_en', f'guides/{slug}/full-en.mp3'), ('audio_trailer_path_en', f'/audio/trailers/{slug}-en.mp3')] if k == en_key)}",
                f"{en_key}: {next(v for k,v in [('audio_full_key_en', f'guides/{slug}/full-en.mp3'), ('audio_trailer_path_en', f'/audio/trailers/{slug}-en.mp3')] if k == en_key)}\n{key}: {val}",
            )
        else:
            print(f"  [MDX] WARNING: {en_key} non trovato, inserimento manuale necessario")

    mdx.write_text(txt, encoding="utf-8")
    print(f"  [MDX] {slug}.mdx aggiornato")


for slug, voice_id in GUIDES:
    stem = f"{slug}-de"
    print(f"\n--- {stem} ---")

    full_local = AUDIO_DIR / f"{stem}.mp3"
    if full_local.exists():
        upload(full_local, f"guides/{slug}/full-de.mp3")
    else:
        print(f"  [SKIP] {stem}.mp3 non trovato")
        continue

    # Trailer
    text = TRAILERS[slug]
    trailer_local = TRAILER_DIR / f"{stem}.mp3"
    print(f"  [TRL] {len(text)} chars...", end=" ", flush=True)
    try:
        audio = tts_fa(text, voice_id)
        trailer_local.write_bytes(audio)
        print(f"OK ({len(audio)//1024}KB)", end=" ")
        upload(trailer_local, f"audio/trailers/{stem}.mp3")
    except Exception as e:
        print(f"ERRORE trailer: {e}")

    time.sleep(0.3)

print("\nFatto.")
