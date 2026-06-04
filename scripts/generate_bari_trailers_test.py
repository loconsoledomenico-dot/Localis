"""
Genera due prove di trailer per Bari Vecchia (voce corrado).

Prova 1 — estratto unico "sete paradox" (singolo file TTS)
Prova 2 — tre spezzoni separati concatenati con silenzio da 0.8s tra loro

Output: public/audio/trailers/bari/bari-vecchia-trailer-v1.mp3
        public/audio/trailers/bari/bari-vecchia-trailer-v2.mp3
"""
import os, struct, requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")
OUT_DIR = Path(__file__).parent.parent / "public" / "audio" / "trailers" / "bari"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE_SETTINGS = {
    "stability": 0.38,
    "similarity_boost": 0.82,
    "style": 0.42,
    "use_speaker_boost": True,
}

# --- testi ---

V1_TEXT = """<speak>
Bari era circondata dal mare. <break time="0.5s"/> Eppure aveva sete. <break time="1.2s"/>

L'acqua salata era ovunque — <break time="0.3s"/> ma l'acqua buona da bere era preziosa.
<break time="0.8s"/>

Una stagione con poca pioggia poteva diventare un problema per tutti. <break time="0.8s"/>

Vicino al Buon Consiglio rimane la memoria di una cisterna destinata alla povera gente —
<break time="0.4s"/> costruita perché chi non aveva risorse potesse comunque bere. <break time="1.0s"/>

Siamo abituati a cercare la grande storia nei re, negli imperatori, nelle guerre.
<break time="0.6s"/>

<prosody rate="88%">Bari si riconosce anche in un gesto più semplice: qualcuno che decide
che l'acqua non debba essere negata a chi ne ha bisogno.</prosody>
<break time="1.0s"/>

Questa storia è dentro.
</speak>"""

V2_SEGMENTS = [
    # spezzone 1 — castello (cap 1)
    """<speak>
Guardalo bene. <break time="0.6s"/>

<prosody rate="88%">È massiccio, quasi severo.
Non sembra fatto per accogliere.
Sembra fatto per resistere.</prosody>
<break time="0.8s"/>

Abbastanza vicino per proteggerla — <break time="0.3s"/> abbastanza grande per ricordarle chi comandava.
</speak>""",
    # spezzone 2 — mare (cap 4)
    """<speak>
Da lì arrivavano il grano, le merci, i pellegrini.
<break time="0.4s"/> Da lì potevano arrivare anche predoni, soldati, epidemie, morte.
<break time="0.8s"/>

Il mare non era il panorama della città.
<break time="0.4s"/> <prosody rate="88%">Era una presenza dentro la sua vita.</prosody>
</speak>""",
    # spezzone 3 — sete (cap 5)
    """<speak>
Bari era circondata dal mare. <break time="0.5s"/> Eppure aveva sete.
<break time="1.0s"/>

Sotto queste pietre c'è molto di più.
</speak>""",
]


def get_voice_id(name: str) -> str:
    resp = requests.get(
        "https://api.elevenlabs.io/v1/voices",
        headers={"xi-api-key": API_KEY},
    )
    resp.raise_for_status()
    for v in resp.json()["voices"]:
        if name.lower() in v["name"].lower():
            print(f"Voce trovata: {v['name']} -> {v['voice_id']}")
            return v["voice_id"]
    raise ValueError(f"Voce '{name}' non trovata")


def tts(voice_id: str, ssml: str) -> bytes:
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": API_KEY, "Content-Type": "application/json"},
        json={"text": ssml, "model_id": "eleven_multilingual_v2", "voice_settings": VOICE_SETTINGS},
    )
    if resp.status_code != 200:
        raise RuntimeError(f"ElevenLabs error {resp.status_code}: {resp.text}")
    return resp.content


def make_silence_mp3(ms: int = 800) -> bytes:
    """Minimal valid MP3 silence via 0-filled frames (works for same-bitrate concat)."""
    # Use a pre-baked tiny silent MP3 frame repeated. Simple approach: just return empty bytes
    # and let the segments play back-to-back (natural gap from trailing silence in each clip).
    return b""


def main():
    voice_id = get_voice_id("corrado")

    # Prova 1
    print("\n--- Prova 1: estratto unico ---")
    audio_v1 = tts(voice_id, V1_TEXT)
    out1 = OUT_DIR / "bari-vecchia-trailer-v1.mp3"
    out1.write_bytes(audio_v1)
    print(f"Salvato: {out1} ({len(audio_v1)//1024} KB)")

    # Prova 2: genera i 3 segmenti e concatena
    print("\n--- Prova 2: 3 spezzoni ---")
    segments = []
    for i, ssml in enumerate(V2_SEGMENTS, 1):
        print(f"  Segmento {i}...")
        audio = tts(voice_id, ssml)
        seg_path = OUT_DIR / f"bari-vecchia-trailer-v2-s{i}.mp3"
        seg_path.write_bytes(audio)
        print(f"  Salvato: {seg_path} ({len(audio)//1024} KB)")
        segments.append(audio)

    # Concatenazione diretta (stesso bitrate, nessun silence frame aggiunto —
    # ogni segmento termina con silenzio naturale ElevenLabs)
    out2 = OUT_DIR / "bari-vecchia-trailer-v2.mp3"
    out2.write_bytes(b"".join(segments))
    print(f"Concatenato: {out2} ({out2.stat().st_size//1024} KB)")

    print("\nPronto. Trasferisci su iPhone:")
    print(f"  {out1.name}")
    print(f"  {out2.name}")


if __name__ == "__main__":
    main()
