# Scarica l'intero bucket R2 in private/audio/r2-mirror/ rispecchiando le chiavi.
import os
from pathlib import Path

import boto3
from dotenv import load_dotenv

REPO = Path(__file__).resolve().parent.parent
DEST = REPO / "private" / "audio" / "r2-mirror"
load_dotenv(REPO / ".env")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY"],
    aws_secret_access_key=os.environ["R2_SECRET_KEY"],
    region_name="auto",
)
bucket = os.environ["R2_BUCKET"]

keys = []
token = None
while True:
    kwargs = {"Bucket": bucket}
    if token:
        kwargs["ContinuationToken"] = token
    out = s3.list_objects_v2(**kwargs)
    keys.extend((o["Key"], o["Size"]) for o in out.get("Contents", []))
    if not out.get("IsTruncated"):
        break
    token = out["NextContinuationToken"]

total = sum(s for _, s in keys)
print(f"{len(keys)} oggetti, {total/1048576:.0f} MB totali")

done = 0
for key, size in sorted(keys):
    local = DEST / key
    if local.exists() and local.stat().st_size == size:
        done += 1
        continue
    local.parent.mkdir(parents=True, exist_ok=True)
    s3.download_file(bucket, key, str(local))
    done += 1
    print(f"[{done}/{len(keys)}] {key} ({size/1048576:.1f} MB)")

print("MIRROR COMPLETO")
