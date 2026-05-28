"""
Test Fish Audio TTS — campione da Gargano Nord (Cap. 1, voce Ferdinando)
"""
import os
import httpx

API_KEY = "bbfc479590954d1782b660512e12f96c"

# Testo campione — primo paragrafo Cap.1 (senza tag SSML di ElevenLabs)
TESTO = """Siediti un momento sul bordo.

Guarda giù. L'acqua è sotto i piedi. Le travi di ginepro tengono tutto insieme — stesso legno di quando mio bisnonno ha costruito questa struttura. Novant'anni di sale, di vento, di onde. Tengono ancora.

Mi chiamo Ferdinando. Sessantotto anni. Quarta generazione su questo trabucco. Mio bisnonno lo costruì negli anni Trenta, mio nonno ci pescò tutta la vita, mio padre pure. Io ho cominciato a undici anni — alzarsi alle quattro, calare le reti, tirare su quello che c'era.

Trent'anni fa ho aperto il ristorante sul trabucco. Non perché avevo smesso di pescare — perché il pesce che pescavo era così buono che valeva la pena cucinarlo qui, sul posto, con il mare sotto.

Vi racconto questa costa come la conosce chi ci ha passato la vita. Dal trabucco si vede tutto. E si capisce tutto."""

OUTPUT = "scripts/test_gargano_nord_fishaudio.mp3"

def main():
    print("Fish Audio TTS — test Gargano Nord")
    print(f"Testo: {len(TESTO)} caratteri")

    # Primo: lista modelli pubblici (voce italiana)
    resp = httpx.get(
        "https://api.fish.audio/model?page_size=10&language=it",
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=30,
    )
    if resp.status_code == 200:
        models = resp.json()
        items = models.get("items", [])
        print(f"\nVoci italiane disponibili ({len(items)}):")
        for m in items[:5]:
            print(f"  - {m.get('title','?')} | id: {m.get('_id','?')}")
        if items:
            voice_id = items[0]["_id"]
            print(f"\nUso: {items[0].get('title')} ({voice_id})")
        else:
            # fallback: nessuna voce IT trovata, uso senza reference
            voice_id = None
            print("Nessuna voce IT trovata — uso voce default")
    else:
        print(f"Errore lista modelli: {resp.status_code} — {resp.text[:200]}")
        voice_id = None

    # TTS request
    payload = {
        "text": TESTO,
        "format": "mp3",
        "mp3_bitrate": 192,
        "latency": "normal",
    }
    if voice_id:
        payload["reference_id"] = voice_id

    print("\nGenero audio...")
    tts_resp = httpx.post(
        "https://api.fish.audio/v1/tts",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )

    if tts_resp.status_code == 200:
        with open(OUTPUT, "wb") as f:
            f.write(tts_resp.content)
        size_kb = len(tts_resp.content) / 1024
        print(f"OK — {OUTPUT} ({size_kb:.0f} KB)")
    else:
        print(f"Errore TTS: {tts_resp.status_code}")
        print(tts_resp.text[:500])

if __name__ == "__main__":
    main()
