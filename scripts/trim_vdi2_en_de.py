"""Taglia i primi 18s (preamble) dalle guide EN e DE VdI2, carica su R2."""
import sys, os, subprocess, boto3
sys.stdout.reconfigure(encoding="utf-8")
from botocore.config import Config
from dotenv import load_dotenv
from pathlib import Path

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
FFMPEG = str(Path.home() / "ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe")
audio_dir = REPO_ROOT / "public/audio/guides"

GUIDES = [
    ("ostuni-en",     "guides/ostuni/full-en.mp3"),
    ("ostuni-de",     "guides/ostuni/full-de.mp3"),
    ("cisternino-en", "guides/cisternino/full-en.mp3"),
    ("cisternino-de", "guides/cisternino/full-de.mp3"),
    ("fasano-en",     "guides/fasano/full-en.mp3"),
    ("fasano-de",     "guides/fasano/full-de.mp3"),
]

for stem, r2_key in GUIDES:
    src = audio_dir / f"{stem}.mp3"
    tmp = audio_dir / f"{stem}_trimmed.mp3"
    print(f"{stem}: taglio 18s...", end=" ", flush=True)
    result = subprocess.run(
        [FFMPEG, "-y", "-i", str(src), "-ss", "18", "-c", "copy", str(tmp)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"ERRORE ffmpeg: {result.stderr[-300:]}")
        continue
    mb_before = src.stat().st_size / 1024 / 1024
    mb_after  = tmp.stat().st_size / 1024 / 1024
    tmp.replace(src)
    print(f"{mb_before:.1f}MB -> {mb_after:.1f}MB", end=" ")
    s3.upload_file(str(src), BUCKET, r2_key, ExtraArgs={"ContentType": "audio/mpeg"})
    print("-> R2 OK")

print("\nFatto.")
