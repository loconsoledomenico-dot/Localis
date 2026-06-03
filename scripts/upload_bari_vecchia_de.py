"""Upload bari-vecchia-domenico-de.mp3 su R2."""
import os
import boto3
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

local = REPO_ROOT / "private" / "audio" / "guides" / "bari-vecchia-domenico-de.mp3"
key = "bari-vecchia-domenico-de.mp3"

mb = local.stat().st_size / 1024 / 1024
print(f"Upload {local.name} ({mb:.1f} MB) -> {key}")
s3.upload_file(str(local), BUCKET, key, ExtraArgs={"ContentType": "audio/mpeg"})
print("OK")
