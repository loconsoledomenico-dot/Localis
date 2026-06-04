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

renames = [
    ("bari-vecchia-domenico-it.mp3", "guides/bari-vecchia/bari-vecchia-it.mp3"),
    ("bari-vecchia-domenico-en.mp3", "guides/bari-vecchia/bari-vecchia-en.mp3"),
    ("bari-vecchia-domenico-de.mp3", "guides/bari-vecchia/bari-vecchia-de.mp3"),
    ("guides/il-meglio-di-bari/full-it.mp3",  "guides/il-meglio-di-bari/il-meglio-di-bari-it.mp3"),
    ("guides/il-meglio-di-bari/full-en.mp3",  "guides/il-meglio-di-bari/il-meglio-di-bari-en.mp3"),
    ("guides/il-meglio-di-bari/full-de.mp3",  "guides/il-meglio-di-bari/il-meglio-di-bari-de.mp3"),
    ("guides/porto-bari/full-it.mp3",         "guides/porto-bari/porto-bari-it.mp3"),
    ("guides/porto-bari/full-en.mp3",         "guides/porto-bari/porto-bari-en.mp3"),
    ("guides/porto-bari/full-de.mp3",         "guides/porto-bari/porto-bari-de.mp3"),
    ("guides/san-nicola/full-it.mp3",         "guides/san-nicola/san-nicola-it.mp3"),
    ("guides/san-nicola/full-en.mp3",         "guides/san-nicola/san-nicola-en.mp3"),
    ("guides/san-nicola/full-de.mp3",         "guides/san-nicola/san-nicola-de.mp3"),
    ("guides/tre-teatri/full-it.mp3",         "guides/tre-teatri/tre-teatri-it.mp3"),
    ("guides/tre-teatri/full-en.mp3",         "guides/tre-teatri/tre-teatri-en.mp3"),
    ("guides/tre-teatri/full-de.mp3",         "guides/tre-teatri/tre-teatri-de.mp3"),
    ("guides/bari-sotterranea/full-it.mp3",   "guides/bari-sotterranea/bari-sotterranea-it.mp3"),
    ("guides/bari-sotterranea/full-en.mp3",   "guides/bari-sotterranea/bari-sotterranea-en.mp3"),
    ("guides/bari-sotterranea/full-de.mp3",   "guides/bari-sotterranea/bari-sotterranea-de.mp3"),
    ("guides/gargano-nord/full-it.mp3",       "guides/gargano-nord/gargano-nord-it.mp3"),
    ("guides/gargano-nord/full-en.mp3",       "guides/gargano-nord/gargano-nord-en.mp3"),
    ("guides/gargano-nord/full-de.mp3",       "guides/gargano-nord/gargano-nord-de.mp3"),
    ("guides/gargano-paesi/full-it.mp3",      "guides/gargano-paesi/gargano-paesi-it.mp3"),
    ("guides/gargano-paesi/full-en.mp3",      "guides/gargano-paesi/gargano-paesi-en.mp3"),
    ("guides/gargano-paesi/full-de.mp3",      "guides/gargano-paesi/gargano-paesi-de.mp3"),
    ("guides/gargano-sacro/full-it.mp3",      "guides/gargano-sacro/gargano-sacro-it.mp3"),
    ("guides/gargano-sacro/full-en.mp3",      "guides/gargano-sacro/gargano-sacro-en.mp3"),
    ("guides/gargano-sacro/full-de.mp3",      "guides/gargano-sacro/gargano-sacro-de.mp3"),
    ("guides/gargano-saline/full-it.mp3",     "guides/gargano-saline/gargano-saline-it.mp3"),
    ("guides/gargano-saline/full-en.mp3",     "guides/gargano-saline/gargano-saline-en.mp3"),
    ("guides/gargano-saline/full-de.mp3",     "guides/gargano-saline/gargano-saline-de.mp3"),
    ("guides/gargano-tremiti/full-it.mp3",    "guides/gargano-tremiti/gargano-tremiti-it.mp3"),
    ("guides/gargano-tremiti/full-en.mp3",    "guides/gargano-tremiti/gargano-tremiti-en.mp3"),
    ("guides/gargano-tremiti/full-de.mp3",    "guides/gargano-tremiti/gargano-tremiti-de.mp3"),
    ("guides/gargano-vieste/full-it.mp3",     "guides/gargano-vieste/gargano-vieste-it.mp3"),
    ("guides/gargano-vieste/full-en.mp3",     "guides/gargano-vieste/gargano-vieste-en.mp3"),
    ("guides/gargano-vieste/full-de.mp3",     "guides/gargano-vieste/gargano-vieste-de.mp3"),
    ("guides/alberobello/full-it.mp3",        "guides/alberobello/alberobello-it.mp3"),
    ("guides/alberobello/full-en.mp3",        "guides/alberobello/alberobello-en.mp3"),
    ("guides/alberobello/full-de.mp3",        "guides/alberobello/alberobello-de.mp3"),
    ("guides/cisternino/full-it.mp3",         "guides/cisternino/cisternino-it.mp3"),
    ("guides/cisternino/full-en.mp3",         "guides/cisternino/cisternino-en.mp3"),
    ("guides/cisternino/full-de.mp3",         "guides/cisternino/cisternino-de.mp3"),
    ("guides/fasano/full-it.mp3",             "guides/fasano/fasano-it.mp3"),
    ("guides/fasano/full-en.mp3",             "guides/fasano/fasano-en.mp3"),
    ("guides/fasano/full-de.mp3",             "guides/fasano/fasano-de.mp3"),
    ("guides/locorotondo/full-it.mp3",        "guides/locorotondo/locorotondo-it.mp3"),
    ("guides/locorotondo/full-en.mp3",        "guides/locorotondo/locorotondo-en.mp3"),
    ("guides/locorotondo/full-de.mp3",        "guides/locorotondo/locorotondo-de.mp3"),
    ("guides/martina-franca/full-it.mp3",     "guides/martina-franca/martina-franca-it.mp3"),
    ("guides/martina-franca/full-en.mp3",     "guides/martina-franca/martina-franca-en.mp3"),
    ("guides/martina-franca/full-de.mp3",     "guides/martina-franca/martina-franca-de.mp3"),
    ("guides/ostuni/full-it.mp3",             "guides/ostuni/ostuni-it.mp3"),
    ("guides/ostuni/full-en.mp3",             "guides/ostuni/ostuni-en.mp3"),
    ("guides/ostuni/full-de.mp3",             "guides/ostuni/ostuni-de.mp3"),
]

ok = skip = err = 0
for old, new in renames:
    try:
        s3.copy_object(Bucket=bucket, CopySource={"Bucket": bucket, "Key": old}, Key=new)
        short = new.split("/")[-1]
        print(f"OK   {old}  ->  {short}")
        ok += 1
    except Exception as e:
        msg = str(e)
        if "404" in msg or "NoSuchKey" in msg:
            print(f"SKIP {old}")
            skip += 1
        else:
            print(f"ERR  {old}: {e}")
            err += 1

print(f"\nCopiati: {ok}  Saltati: {skip}  Errori: {err}")
