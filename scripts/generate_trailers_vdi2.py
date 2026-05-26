"""
Genera i 9 trailer VdI2 (ostuni/cisternino/fasano × it/en/de).
Testi trailer scritti ad hoc — ~45 secondi, hook narrativo.
IT/DE → ElevenLabs  |  EN → Fish Audio
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

EL_KEY = "sk_950f82a503bbddfed6c8a6173f1ca1844f2f2c4f89226216"
FA_KEY = "bbfc479590954d1782b660512e12f96c"

TRAILER_DIR = REPO_ROOT / "public/audio/trailers"
TRAILER_DIR.mkdir(parents=True, exist_ok=True)

# ── Testi trailer (~630 chars = ~45 sec) ─────────────────────────────────────

TRAILERS = {

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

"ostuni-en": """\
They call it the White City. But for me — forty years walking these streets \
in uniform — Ostuni is simply home. I stopped cars from every country in Europe \
during August, patrolled every alley at midnight, watched generations of tourists \
arrive, take their photos, and leave without ever understanding what this place \
really is. I know where the real Ostuni hides: the streets no one photographs, \
the food no guidebook recommends, the stories that never make it into print. \
My name is Salvatore. I was the traffic warden here for forty years. \
Sit down and let me tell you what I know.\
""",

"ostuni-de": """\
Die nennen es die Weiße Stadt. Für mich — vierzig Jahre in Uniform auf diesen \
Straßen — ist Ostuni einfach Heimat. Ich habe in jedem August Autos aus ganz \
Europa angehalten, jede Gasse bei Nacht und bei Tagesanbruch abgelaufen, \
Generationen von Touristen kommen und gehen sehen — und fast niemand hat diese \
Stadt wirklich verstanden. Ich weiß, wo das echte Ostuni steckt: die Straßen, \
die niemand fotografiert, das Essen, das kein Reiseführer empfiehlt, \
die Geschichten, die nirgendwo stehen. \
Ich bin Salvatore, pensionierter Stadtpolizist. Setz dich. Ich erzähl dir, was ich weiß.\
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

"cisternino-en": """\
Cisternino isn't something you understand from a car window. \
You understand it from the smoke. The smoke from the fornello \
that rises at dawn and never stops until evening — it's been that way \
since my grandfather opened this butcher's shop, and it's still that way \
now that I run it. My name is Michele, third-generation butcher in the \
historic centre. I know how to cut the meat for a bombetta — \
the slice, the filling, the fire — and I know what has stayed the same \
in this town for sixty years. This isn't a tourist guide. \
It's the voice of fire, the taste of the grill, \
and the stories of a village that never stops surprising you.\
""",

"cisternino-de": """\
Cisternino versteht man nicht durch das Autofenster. \
Man versteht es durch den Rauch. Den Rauch des Fornello, \
der bei Tagesanbruch aufsteigt und erst am Abend aufhört — \
so war es, als mein Großvater diese Metzgerei eröffnete, \
und so ist es heute noch, wo ich sie führe. \
Ich bin Michele, Metzger in dritter Generation in der Altstadt. \
Ich weiß, wie man das Fleisch für eine Bombetta schneidet — \
der Schnitt, die Füllung, die Glut — und ich weiß, \
was in diesem Dorf seit sechzig Jahren gleich geblieben ist. \
Das hier ist kein Reiseführer. Das ist die Stimme des Feuers, \
der Geschmack der Brace und die Geschichten eines Ortes, \
der nie aufhört zu überraschen.\
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

"fasano-en": """\
I know the Valle d'Itria from below and from above. \
From below, like everyone: trulli, masserie, white lanes. \
But the real valley — the one that takes your breath away — \
I know it from the sky. I've been flying here for twenty years, \
and from up there you see things no guidebook tells you: \
how the trulli are arranged across the fields, \
how the masserie mark boundaries that go back to Roman times, \
how warm air rises from the stone walls every summer afternoon. \
My name is Andrea, paraglider pilot. \
I've seen this land the way almost no one has. \
In this guide, I'll tell you everything — \
from Fasano, from Selva, and from the sky above it all.\
""",

"fasano-de": """\
Das Valle d'Itria kenne ich von unten und von oben. \
Von unten wie alle: Trulli, Masserie, weiße Gassen. \
Aber das echte Tal — das, das einem den Atem verschlägt — \
kenne ich von oben. Ich fliege seit zwanzig Jahren über dieses Tal, \
und von dort oben sieht man Dinge, die kein Reiseführer erzählt: \
wie die Trulli über die Felder verteilt sind, \
wie die Masserie Grenzen markieren, die bis in die Römerzeit zurückreichen, \
wie die warme Luft an Sommernachmittagen von den Trockenmauern aufsteigt. \
Ich bin Andrea, Gleitschirmpilot. \
Ich habe dieses Land aus einer Perspektive gesehen, die fast niemand kennt. \
In dieser Führung erzähle ich dir alles — \
von Fasano, von Selva, und vom Himmel über allem.\
""",
}

# ── Voice config ──────────────────────────────────────────────────────────────
CONFIG = [
    ("ostuni-it",     "YGp1lBJLaHhfIFT0yeDE",               "el"),
    ("ostuni-en",     "536d3a5e000945adb7038665781a4aca",     "fa"),
    ("ostuni-de",     "JBFqnCBsd6RMkjVDRZzb",               "el"),
    ("cisternino-it", "mcMi8FJDhg35bMpWHv2R",               "el"),
    ("cisternino-en", "d8f13232599c4f60b5df3232ddededca",     "fa"),
    ("cisternino-de", "nPczCjzI2devNBz1zQrb",               "el"),
    ("fasano-it",     "q2LDrL29FLqRR3XanHLq",               "el"),
    ("fasano-en",     "9b20d81c64fd48448ee90da70f236d0e",     "fa"),
    ("fasano-de",     "IKne3meq5aSn9XLyUdCD",               "el"),
]


def tts_el(text: str, voice_id: str) -> bytes:
    r = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": EL_KEY, "Content-Type": "application/json"},
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


def tts_fa(text: str, voice_id: str) -> bytes:
    r = httpx.post(
        "https://api.fish.audio/v1/tts",
        headers={"Authorization": f"Bearer {FA_KEY}", "Content-Type": "application/json"},
        json={
            "text": text,
            "reference_id": voice_id,
            "model": "s2",
            "format": "mp3",
            "mp3_bitrate": 192,
            "latency": "normal",
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.content


def upload(local: Path, key: str):
    mb = local.stat().st_size / 1024 / 1024
    print(f"  [R2] {key}  ({mb:.2f} MB)...", end=" ", flush=True)
    s3.upload_file(str(local), R2_BUCKET, key, ExtraArgs={"ContentType": "audio/mpeg"})
    print("OK")


for stem, voice_id, provider in CONFIG:
    print(f"\n--- {stem} ---")
    text = TRAILERS[stem]
    print(f"  testo: {len(text)} chars")

    try:
        print(f"  [TTS] generazione...", end=" ", flush=True)
        audio = tts_el(text, voice_id) if provider == "el" else tts_fa(text, voice_id)
        local = TRAILER_DIR / f"{stem}.mp3"
        local.write_bytes(audio)
        print(f"OK ({len(audio)//1024} KB)")
        upload(local, f"audio/trailers/{stem}.mp3")
    except Exception as e:
        print(f"ERRORE: {e}")

    time.sleep(0.5)

print("\nFatto.")
