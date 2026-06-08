import argparse
import os
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import boto3
import imageio_ffmpeg
from dotenv import load_dotenv
from mutagen.mp3 import MP3


REPO_ROOT = Path(__file__).resolve().parent.parent
GUIDES_DIR = REPO_ROOT / "src" / "content" / "guides"
TARGET_BITRATE = 64_000
REENCODE_THRESHOLD = 96_000


@dataclass
class GuideAsset:
    slug: str
    lang: str
    key: str


@dataclass
class AudioInfo:
    bitrate: int
    seconds: float
    bytes_size: int


def get_s3_client():
    load_dotenv(REPO_ROOT / ".env")
    account_id = os.getenv("R2_ACCOUNT_ID")
    access_key = os.getenv("R2_ACCESS_KEY")
    secret_key = os.getenv("R2_SECRET_KEY")
    bucket = os.getenv("R2_BUCKET")
    if not all([account_id, access_key, secret_key, bucket]):
        raise RuntimeError("R2 credentials missing in environment or .env")
    client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
    return client, bucket


def iter_guide_assets() -> Iterable[GuideAsset]:
    for path in sorted(GUIDES_DIR.glob("*.mdx")):
        slug = path.stem
        content = path.read_text(encoding="utf-8")
        for line in content.splitlines():
            line = line.strip()
            if not line.startswith("audio_full_key_"):
                continue
            field, value = line.split(":", 1)
            lang = field.removeprefix("audio_full_key_")
            key = value.strip().strip('"').strip("'")
            if key:
                yield GuideAsset(slug=slug, lang=lang, key=key)


def inspect_mp3(path: Path) -> AudioInfo:
    info = MP3(str(path)).info
    return AudioInfo(
        bitrate=int(getattr(info, "bitrate", 0) or 0),
        seconds=float(info.length),
        bytes_size=path.stat().st_size,
    )


def format_mib(num_bytes: int) -> str:
    return f"{num_bytes / (1024 * 1024):.2f} MiB"


def format_kbps(bitrate: int) -> str:
    return f"{round(bitrate / 1000):.0f} kbps"


def needs_reencode(info: AudioInfo) -> bool:
    return info.bitrate >= REENCODE_THRESHOLD


def download_file(s3, bucket: str, key: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    s3.download_file(bucket, key, str(dest))


def upload_file(s3, bucket: str, key: str, src: Path) -> None:
    s3.upload_file(str(src), bucket, key, ExtraArgs={"ContentType": "audio/mpeg"})


def reencode_to_64k(src: Path, dest: Path) -> None:
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i",
        str(src),
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "64k",
        "-ac",
        "1",
        str(dest),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {src.name}: {result.stderr.strip()}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Audit and optimize R2 guide MP3 files.")
    ap.add_argument("--apply", action="store_true", help="Re-encode files above threshold and upload them back to R2.")
    args = ap.parse_args()

    s3, bucket = get_s3_client()
    assets = list(iter_guide_assets())
    print(f"Checking {len(assets)} guide audio files in bucket {bucket}...")

    updated = 0
    missing = []
    before_total = 0
    after_total = 0

    with tempfile.TemporaryDirectory(prefix="r2-guide-audit-") as tmpdir:
        tmpdir_path = Path(tmpdir)
        for asset in assets:
            local_in = tmpdir_path / f"{asset.slug}-{asset.lang}.mp3"
            local_out = tmpdir_path / f"{asset.slug}-{asset.lang}.64k.mp3"
            try:
                download_file(s3, bucket, asset.key, local_in)
            except Exception as exc:
                missing.append((asset, str(exc)))
                print(f"[missing] {asset.key} :: {exc}")
                continue

            before = inspect_mp3(local_in)
            before_total += before.bytes_size
            action = "keep"

            if args.apply and needs_reencode(before):
                reencode_to_64k(local_in, local_out)
                after = inspect_mp3(local_out)
                upload_file(s3, bucket, asset.key, local_out)
                action = "updated"
                updated += 1
            else:
                after = before

            after_total += after.bytes_size
            print(
                f"[{action}] {asset.key} | {format_kbps(before.bitrate)} -> {format_kbps(after.bitrate)} | "
                f"{format_mib(before.bytes_size)} -> {format_mib(after.bytes_size)} | {before.seconds/60:.1f} min"
            )

    print(
        f"Summary: checked={len(assets) - len(missing)} missing={len(missing)} "
        f"updated={updated} saved={(before_total - after_total) / (1024 * 1024):.2f} MiB"
    )
    return 0 if not missing else 1


if __name__ == "__main__":
    raise SystemExit(main())
