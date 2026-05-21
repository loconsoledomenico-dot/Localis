#!/usr/bin/env python3
"""
Apply CORS policy on the Cloudflare R2 bucket via the S3-compatible API.

Uses the same R2_* env vars that the upload-r2.py script uses, so no
need to touch the Cloudflare dashboard.

Usage:
  python scripts/set-r2-cors.py
"""
from __future__ import annotations

import os
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

ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
SECRET_KEY = os.getenv("R2_SECRET_KEY")
BUCKET = os.getenv("R2_BUCKET", "localis-audio")

if not (ACCOUNT_ID and ACCESS_KEY and SECRET_KEY):
    raise SystemExit("[ERR] R2_* env vars missing in .env")

import boto3
from botocore.config import Config

client = boto3.client(
    "s3",
    endpoint_url=f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

cors_config = {
    "CORSRules": [
        {
            "AllowedOrigins": [
                "https://localis.guide",
                "https://www.localis.guide",
            ],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": [
                "Content-Length",
                "Content-Type",
                "Content-Range",
                "Accept-Ranges",
                "ETag",
            ],
            "MaxAgeSeconds": 3600,
        }
    ]
}

print(f"=== Applying CORS to bucket '{BUCKET}' on account {ACCOUNT_ID[:8]}...{ACCOUNT_ID[-4:]} ===")
client.put_bucket_cors(Bucket=BUCKET, CORSConfiguration=cors_config)
print("  [OK] CORS policy applied")

print("\n=== Verifying ===")
resp = client.get_bucket_cors(Bucket=BUCKET)
for i, rule in enumerate(resp["CORSRules"]):
    print(f"  Rule {i}: origins={rule['AllowedOrigins']}, methods={rule['AllowedMethods']}")
