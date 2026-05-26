"""
Carica su R2 le guide IT rigenerate + trailer IT con nuove voci.
Salta fasano-it se il file non esiste (da completare dopo).
"""
import os
import sys
import time
import httpx
import boto3

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from botocore.config import Config
from pathlib import Path
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET     = os.getenv("R2_BUCKET", "localis-audio")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

EL_KEY = None  # inserire nuova chiave quando disponibile
FA_KEY = "bbfc479590954d1782b660512e12f96c"

AUDIO_DIR   = REPO_ROOT / "public/audio/guides"
TRAILER_DIR = REPO_ROOT / "public/audio/trailers"

TRAILER_TEXTS = {
    "ostuni-it": """\
La chiamano la Città Bianca. Io, che ci ho lavorato quarant'anni in divisa, \
la chiamo semplicemente casa mia. Ho fermato macchine di tutta Europa in agosto, \
ho percorso ogni vicolo all'alba e a mezzanotte, ho visto generazioni di turisti \
arrivare e ripartire — e quasi nessuno ha capito davvero questa città. \
So dove si nasconde la vera Ostuni: le strade che non finiscono nelle fotografie, \
il cibo che non trovi nei ristoranti consigliati, le storie che nessuna guida \
turistica ti racconta. Io sono Salvatore, ex vigile urbano. \
Questa non è una guida. È quello che ti dico io, che ci ho vissuto.\
""",
    "cisternino-it": """\
Cisternino non si capisce dai finestrini. Si capisce dal fumo. \
Il fumo del fornello che si alza all'alba e non si ferma fino a sera — \
è così da quando mio nonno ha aperto questa macelleria, \
ed è così ancora adesso che la gestisco io. \
Io sono Michele, macellaio di terza generazione nel centro storico. \
So come si taglia la carne per la bombetta — taglio, ripieno, brace — \
e so cosa è rimasto uguale in questo paese negli ultimi sessant'anni \
e cosa invece è cambiato. Questa non è una guida turistica. \
È la voce del fuoco, il sapore della brace, \
e le storie di un borgo che non finisce mai di sorprenderti.\
""",
    "fasano-it": """\
La Valle d'Itria la conosco da sotto e da sopra. \
Da sotto, come chiunque: trulli, masserie, vicoli bianchi. \
Ma quella vera — quella che ti toglie il fiato — la conosco dall'alto. \
Volo su questa valle da vent'anni, e da quassù vedi cose \
che nessuna guida ti racconta: come i trulli sono sistemati nei campi, \
come le masserie disegnano confini che risalgono ai Romani, \
come il vento caldo sale dai muretti a secco ogni pomeriggio d'estate. \
Io sono Andrea, pilota di parapendio. \
Ho visto questa terra in un modo che quasi nessuno ha mai visto. \
E in questa guida te la racconto io — da Fasano, da Selva, e dal cielo sopra tutto.\
""",
}

VOICES = {
    "ostuni-it":     ("DLMxnwJE0a28JQLTMJPJ", "el"),
    "cisternino-it": ("HQ7Ez220YT02q2IAnVFl", "el"),
    "fasano-it":     ("sKbNSlHXq99bttvf8rRF", "el"),
}


def upload(local: Path, key: str):
    mb = local.stat().st_size / 1024 / 1024
    print(f"  [R2] {key}  ({mb:.1f} MB)...", end=" ", flush=True)
    s3.upload_file(str(local), R2_BUCKET, key, ExtraArgs={"ContentType": "audio/mpeg"})
    print("OK")


def tts_el(text: str, voice_id: str, key: str) -> bytes:
    r = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": key, "Content-Type": "application/json"},
        json={
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.80,
                "style": 0.25,
                "use_speaker_boost": True,
            },
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.content


for stem in ["ostuni-it", "cisternino-it", "fasano-it"]:
    slug = stem.replace("-it", "")
    print(f"\n--- {stem} ---")

    # Upload full guide
    full_local = AUDIO_DIR / f"{stem}.mp3"
    if full_local.exists():
        upload(full_local, f"guides/{slug}/full-it.mp3")
    else:
        print(f"  [SKIP] {full_local.name} non trovato")

    # Trailer
    if EL_KEY is None:
        print(f"  [SKIP] trailer — chiave EL non disponibile")
        continue

    voice_id, provider = VOICES[stem]
    text = TRAILER_TEXTS[stem]
    trailer_local = TRAILER_DIR / f"{stem}.mp3"
    print(f"  [TRL] generazione trailer ({len(text)} chars)...", end=" ", flush=True)
    try:
        audio = tts_el(text, voice_id, EL_KEY)
        trailer_local.write_bytes(audio)
        print(f"OK ({len(audio)//1024}KB)")
        upload(trailer_local, f"audio/trailers/{stem}.mp3")
    except Exception as e:
        print(f"ERRORE: {e}")

    time.sleep(0.5)

print("\nFatto.")
