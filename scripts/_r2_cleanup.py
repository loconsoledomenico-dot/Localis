"""
Elimina le vecchie chiavi R2 dopo il rename alla naming convention univoca.
Chiavi obsolete:
  - bari-vecchia-domenico-it/en/de.mp3  (root level, ora guides/bari-vecchia/...)
  - guides/*/full-it/en/de.mp3          (ora guides/*/slug-it/en/de.mp3)
"""
import os, boto3
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")

s3 = boto3.client("s3",
    endpoint_url="https://" + os.getenv("R2_ACCOUNT_ID") + ".r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
    region_name="auto",
)
bucket = os.getenv("R2_BUCKET")

old_keys = [
    # Bari Vecchia vecchie chiavi root
    "bari-vecchia-domenico-it.mp3",
    "bari-vecchia-domenico-en.mp3",
    "bari-vecchia-domenico-de.mp3",
    # Tutte le guide: full-it/en/de
    "guides/il-meglio-di-bari/full-it.mp3",
    "guides/il-meglio-di-bari/full-en.mp3",
    "guides/il-meglio-di-bari/full-de.mp3",
    "guides/porto-bari/full-it.mp3",
    "guides/porto-bari/full-en.mp3",
    "guides/porto-bari/full-de.mp3",
    "guides/san-nicola/full-it.mp3",
    "guides/san-nicola/full-en.mp3",
    "guides/san-nicola/full-de.mp3",
    "guides/tre-teatri/full-it.mp3",
    "guides/tre-teatri/full-en.mp3",
    "guides/tre-teatri/full-de.mp3",
    "guides/bari-sotterranea/full-it.mp3",
    "guides/bari-sotterranea/full-en.mp3",
    "guides/bari-sotterranea/full-de.mp3",
    "guides/gargano-nord/full-it.mp3",
    "guides/gargano-nord/full-en.mp3",
    "guides/gargano-nord/full-de.mp3",
    "guides/gargano-paesi/full-it.mp3",
    "guides/gargano-paesi/full-en.mp3",
    "guides/gargano-paesi/full-de.mp3",
    "guides/gargano-sacro/full-it.mp3",
    "guides/gargano-sacro/full-en.mp3",
    "guides/gargano-sacro/full-de.mp3",
    "guides/gargano-saline/full-it.mp3",
    "guides/gargano-saline/full-en.mp3",
    "guides/gargano-saline/full-de.mp3",
    "guides/gargano-tremiti/full-it.mp3",
    "guides/gargano-tremiti/full-en.mp3",
    "guides/gargano-tremiti/full-de.mp3",
    "guides/gargano-vieste/full-it.mp3",
    "guides/gargano-vieste/full-en.mp3",
    "guides/gargano-vieste/full-de.mp3",
    "guides/alberobello/full-it.mp3",
    "guides/alberobello/full-en.mp3",
    "guides/alberobello/full-de.mp3",
    "guides/cisternino/full-it.mp3",
    "guides/cisternino/full-en.mp3",
    "guides/cisternino/full-de.mp3",
    "guides/fasano/full-it.mp3",
    "guides/fasano/full-en.mp3",
    "guides/fasano/full-de.mp3",
    "guides/locorotondo/full-it.mp3",
    "guides/locorotondo/full-en.mp3",
    "guides/locorotondo/full-de.mp3",
    "guides/martina-franca/full-it.mp3",
    "guides/martina-franca/full-en.mp3",
    "guides/martina-franca/full-de.mp3",
    "guides/ostuni/full-it.mp3",
    "guides/ostuni/full-en.mp3",
    "guides/ostuni/full-de.mp3",
]

ok = skip = err = 0
for key in old_keys:
    try:
        s3.delete_object(Bucket=bucket, Key=key)
        print(f"DEL  {key}")
        ok += 1
    except Exception as e:
        msg = str(e)
        if "404" in msg or "NoSuchKey" in msg:
            print(f"SKIP {key}")
            skip += 1
        else:
            print(f"ERR  {key}: {e}")
            err += 1

print(f"\nEliminati: {ok}  Non trovati: {skip}  Errori: {err}")
