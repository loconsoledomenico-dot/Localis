import os
import subprocess
import boto3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

AUDIO_DIR = Path(__file__).parent.parent / "private" / "audio" / "guides"
OUTPUT_FILE = AUDIO_DIR / "bari-vecchia-domenico-it.mp3"
FILELIST    = AUDIO_DIR / "_filelist.txt"

CHAPTERS = [
    "bari-vecchia-domenico-cap1-it.mp3",
    "bari-vecchia-domenico-cap2-it.mp3",
    "bari-vecchia-domenico-cap3-it.mp3",
    "bari-vecchia-domenico-cap4-it.mp3",
    "bari-vecchia-domenico-cap5-it.mp3",
    "bari-vecchia-domenico-cap6-it.mp3",
    "bari-vecchia-domenico-cap7-it.mp3",
    "bari-vecchia-domenico-cap8-it.mp3",
]

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET     = os.getenv("R2_BUCKET")
R2_KEY        = "bari-vecchia-domenico-it.mp3"


def concat():
    print("Concateno capitoli con ffmpeg...")
    lines = "\n".join(f"file '{AUDIO_DIR / f}'" for f in CHAPTERS)
    FILELIST.write_text(lines, encoding="utf-8")
    for f in CHAPTERS:
        print(f"  + {f} ({(AUDIO_DIR / f).stat().st_size // 1024} KB)")
    subprocess.run([
        r"C:\ffmpeg\bin\ffmpeg.exe", "-y", "-f", "concat", "-safe", "0",
        "-i", str(FILELIST),
        "-c", "copy", str(OUTPUT_FILE)
    ], check=True)
    FILELIST.unlink()
    print(f"Salvato: {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size // 1024} KB)\n")


def upload():
    print("Carico su R2...")
    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto",
    )
    s3.upload_file(
        str(OUTPUT_FILE),
        R2_BUCKET,
        R2_KEY,
        ExtraArgs={"ContentType": "audio/mpeg"},
    )
    print(f"Caricato: r2://{R2_BUCKET}/{R2_KEY}")


if __name__ == "__main__":
    concat()
    upload()
