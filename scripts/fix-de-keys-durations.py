# Completa i MDX: dichiara audio_full_key_de per le 5 guide Gargano approvate
# e corregge le durate EN=0 / DE mancanti con misure ffprobe reali da R2.
import os
import re
import subprocess
import tempfile
from pathlib import Path

import boto3
from dotenv import load_dotenv

REPO = Path(__file__).resolve().parent.parent
GUIDES = REPO / "src" / "content" / "guides"
FFPROBE = r"C:\ffmpeg\bin\ffprobe.exe"

ADD_DE_KEY = ["gargano-nord", "gargano-sacro", "gargano-saline", "gargano-tremiti", "gargano-vieste"]
FIX_EN_ZERO = ADD_DE_KEY
ADD_DE_DURATION = ADD_DE_KEY + ["bari-sotterranea", "porto-bari", "san-nicola", "tre-teatri"]

load_dotenv(REPO / ".env")
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY"],
    aws_secret_access_key=os.environ["R2_SECRET_KEY"],
    region_name="auto",
)
BUCKET = os.environ["R2_BUCKET"]


def probe_seconds(path: Path) -> int:
    out = subprocess.run(
        [FFPROBE, "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return round(float(out.stdout.strip()))


def measure(slug: str, lang: str, tmp: Path) -> int:
    key = f"guides/{slug}/{slug}-{lang}.mp3"
    local = tmp / f"{slug}-{lang}.mp3"
    s3.download_file(BUCKET, key, str(local))
    return probe_seconds(local)


with tempfile.TemporaryDirectory(prefix="de-fix-") as tmpdir:
    tmp = Path(tmpdir)
    for slug in sorted(set(ADD_DE_KEY + FIX_EN_ZERO + ADD_DE_DURATION)):
        mdx = GUIDES / f"{slug}.mdx"
        text = mdx.read_text(encoding="utf-8")
        changes = []

        if slug in ADD_DE_KEY and "audio_full_key_de:" not in text:
            text = re.sub(
                r"(^audio_full_key_en:.*$)",
                rf"\1\naudio_full_key_de: guides/{slug}/{slug}-de.mp3",
                text, count=1, flags=re.M,
            )
            changes.append("key_de aggiunta")

        if slug in FIX_EN_ZERO and re.search(r"^duration_seconds_en:\s*0\s*$", text, re.M):
            en = measure(slug, "en", tmp)
            text = re.sub(r"^duration_seconds_en:\s*0\s*$", f"duration_seconds_en: {en}", text, count=1, flags=re.M)
            changes.append(f"durata EN -> {en}s")

        if slug in ADD_DE_DURATION and "duration_seconds_de:" not in text:
            de = measure(slug, "de", tmp)
            text = re.sub(
                r"(^duration_seconds_en:.*$)",
                rf"\1\nduration_seconds_de: {de}",
                text, count=1, flags=re.M,
            )
            changes.append(f"durata DE -> {de}s")

        if changes:
            mdx.write_text(text, encoding="utf-8")
        print(f"{slug}: {', '.join(changes) or 'nessuna modifica'}")
