#!/usr/bin/env python3
"""
Upload Localis audio files to Cloudflare R2 (S3-compatible).

Reads the guide MDX frontmatter to know the expected R2 keys (audio_full_key_it / _en),
then uploads the corresponding local mp3 files from r2_audio/<slug>/.
Also uploads public trailers from public/audio/trailers/ if --trailer is set.

Usage:
  python scripts/upload-r2.py <slug> [--trailer] [--dry-run] [--public-read]

Examples:
  python scripts/upload-r2.py bari-vecchia
  python scripts/upload-r2.py bari-vecchia --trailer
  python scripts/upload-r2.py bari-vecchia --dry-run

Required .env vars:
  R2_ACCOUNT_ID    - Cloudflare account id
  R2_ACCESS_KEY    - R2 access key id (S3-compatible)
  R2_SECRET_KEY    - R2 secret access key
  R2_BUCKET        - bucket name (default: localis-audio)
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")


def parse_mdx_frontmatter(mdx_path: Path) -> dict:
    """Tiny YAML extractor for the fields we care about (no full YAML parser)."""
    content = mdx_path.read_text(encoding="utf-8")
    m = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not m:
        raise SystemExit(f"[ERR] No frontmatter in {mdx_path}")
    fm = m.group(1)
    fields = {}
    for line in fm.splitlines():
        m = re.match(r"^([a-z_]+):\s*(.+)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip().strip('"').strip("'")
            fields[key] = val
    return fields


def upload_one(s3, bucket: str, local: Path, key: str, dry_run: bool, public_read: bool) -> None:
    size_mb = local.stat().st_size / 1024 / 1024
    if dry_run:
        print(f"  [DRY] {local.name} → s3://{bucket}/{key}  ({size_mb:.2f} MB)")
        return
    print(f"  [up ] {local.name} → s3://{bucket}/{key}  ({size_mb:.2f} MB) ...", end=" ", flush=True)
    extra = {"ContentType": "audio/mpeg"}
    if public_read:
        extra["ACL"] = "public-read"
    s3.upload_file(str(local), bucket, key, ExtraArgs=extra)
    print("OK")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", help="Guide slug, e.g. bari-vecchia")
    ap.add_argument("--trailer", action="store_true", help="Also upload the trailer file")
    ap.add_argument("--dry-run", action="store_true", help="Print actions without uploading")
    ap.add_argument("--public-read", action="store_true",
                    help="Set public-read ACL on uploaded objects (only if bucket policy allows)")
    args = ap.parse_args()

    mdx = REPO_ROOT / "src" / "content" / "guides" / f"{args.slug}.mdx"
    if not mdx.exists():
        raise SystemExit(f"[ERR] MDX not found: {mdx}")

    fm = parse_mdx_frontmatter(mdx)
    key_it = fm.get("audio_full_key_it")
    key_en = fm.get("audio_full_key_en")
    trailer_path_it = fm.get("audio_trailer_path")
    trailer_path_en = fm.get("audio_trailer_path_en")

    if not key_it or not key_en:
        raise SystemExit(f"[ERR] Missing audio_full_key_* in {mdx}")

    local_dir = REPO_ROOT / "r2_audio" / args.slug
    targets: list[tuple[Path, str]] = [
        (local_dir / "full-it.mp3", key_it),
        (local_dir / "full-en.mp3", key_en),
    ]

    if args.trailer:
        if trailer_path_it:
            # audio_trailer_path is "/audio/trailers/X.mp3"; the key in R2 mirrors that.
            r2_key = trailer_path_it.lstrip("/")
            targets.append((REPO_ROOT / "public" / r2_key, r2_key))
        if trailer_path_en:
            r2_key = trailer_path_en.lstrip("/")
            targets.append((REPO_ROOT / "public" / r2_key, r2_key))

    print(f"\n=== R2 upload · {args.slug} ===")
    print(f"MDX: {mdx.relative_to(REPO_ROOT)}")
    print(f"Files to upload: {len(targets)}")
    for local, key in targets:
        if not local.exists():
            print(f"  [WARN] {local.relative_to(REPO_ROOT)} does not exist (skipped)")
    print()

    if args.dry_run:
        print("[DRY RUN] Listing only, no upload.\n")
        for local, key in targets:
            if local.exists():
                upload_one(None, "<bucket>", local, key, True, args.public_read)
        return 0

    account_id = os.getenv("R2_ACCOUNT_ID")
    access_key = os.getenv("R2_ACCESS_KEY")
    secret_key = os.getenv("R2_SECRET_KEY")
    bucket = os.getenv("R2_BUCKET", "localis-audio")
    if not all([account_id, access_key, secret_key, bucket]):
        raise SystemExit(
            "[ERR] Missing R2 credentials in .env\n"
            "      Required: R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET\n"
            "      Find them at https://dash.cloudflare.com → R2 → Manage R2 API Tokens"
        )

    import boto3
    from botocore.config import Config

    endpoint = f"https://{account_id}.r2.cloudflarestorage.com"
    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )

    for local, key in targets:
        if not local.exists():
            continue
        upload_one(s3, bucket, local, key, False, args.public_read)

    public_url = os.getenv("R2_PUBLIC_URL", "").rstrip("/")
    if public_url:
        print(f"\nPublic URLs (if bucket exposes public domain):")
        for _, key in targets:
            print(f"  {public_url}/{key}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
