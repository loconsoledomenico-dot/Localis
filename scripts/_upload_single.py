import os, boto3, sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

local = Path(sys.argv[1])
key   = sys.argv[2]

s3 = boto3.client("s3",
    endpoint_url="https://" + os.getenv("R2_ACCOUNT_ID") + ".r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
    region_name="auto",
)
print(f"Upload {key} ({local.stat().st_size/1024/1024:.1f} MB)...")
s3.upload_file(str(local), os.getenv("R2_BUCKET"), key, ExtraArgs={"ContentType": "audio/mpeg"})
print("Caricato su R2.")
