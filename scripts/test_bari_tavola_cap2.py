"""
Test generazione Cap 02 — Bari a Tavola
Voce: oVJbgLwL0s5pk9e2U6QH (Rachele)
Output: private/audio/guides/bari-tavola-rachele-cap2-it-TEST.mp3
"""
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")

VOICE_ID = "CiwzbDpaN3pQXjTgx3ML"
OUTPUT_DIR = Path(__file__).parent.parent / "private" / "audio" / "guides"
OUTPUT_FILE = "bari-tavola-rachele-cap2-it-TEST2.mp3"

CAP2_TEXT = """Qui devi fermarti.

<break time="0.6s"/>

Perché se ti raccontassi il cibo di Bari senza portarti a N'dèrr'a la lanze, ti racconterei soltanto una parte della città.

<break time="0.4s"/>

Il nome è dialetto barese.
Richiama le lanze — le piccole barche dei pescatori — e il punto in cui venivano tirate a terra.
Non un mercato ordinato dietro una vetrina.
Il contrario: il confine corto, quasi brusco, tra ciò che veniva dal mare e chi era pronto a portarselo via — o a mangiarlo lì.

<break time="0.5s"/>

Questo è il Molo San Nicola.

Da una parte il lungomare, il Teatro Margherita, la città che passeggia.
Dall'altra i gozzi, le mani bagnate, i secchi, le cassette, il mare che non serve a fare panorama — ma a dare da vivere.

<break time="0.6s"/>

A Bari il pesce crudo non è nato come una moda.
Prima di diventare una cosa cercata dai visitatori, era un'abitudine legata a un rapporto diretto con il pescato:
cozze, seppie, allievi, ricci quando ce n'erano, e soprattutto il polpo.

<break time="0.4s"/>

Il polpo, qui, non veniva semplicemente pulito.

Veniva ARRICCIATO.

<break time="0.5s"/>

Lo si sbatteva sulla pietra.
Lo si lavorava nell'acqua.
Lo si faceva girare finché i tentacoli cambiavano consistenza e si chiudevano in riccioli più compatti.

Un gesto lungo, fisico, antico.
Non una preparazione da vedere in fotografia — ma un lavoro che aveva bisogno di mani, tempo e mare.

<break time="0.5s"/>

Ancora oggi, quando quel gesto si vede, capisci subito che il cibo barese non comincia nel piatto.

Comincia prima.

Nel rumore del polpo battuto sulla pietra.

Nell'acqua che lo muove.

Nel pescatore che sa quando è pronto — senza doverlo misurare.

<break time="0.7s"/>

E poi arriva il momento in cui il mare si mangia quasi senza distanza:
un pezzo di polpo crudo arricciato, una cozza aperta, una seppia — ciò che il mare e la giornata hanno reso disponibile.

<break time="0.5s"/>

Per molti baresi, soprattutto nelle mattine di festa o della domenica, passare da qui significava — e può ancora significare — non soltanto comprare il pesce.
Significava fermarsi a mangiarne un po' sul posto.
In piedi. Con un piattino semplice. Magari con una birra accanto.
Davanti all'acqua da cui tutto quel sapore sembra essere appena arrivato.

<break time="0.6s"/>

Non devi trasformare questo luogo in una prova da superare.

Il crudo di mare richiede sempre prudenza: provenienza regolare, corretta conservazione, rispetto delle regole del momento.

<break time="0.4s"/>

Ma anche senza assaggiare nulla, puoi capire il valore di N'dèrr'a la lanze.

Qui Bari mostra un lato che non ha bisogno di essere messo in scena:
una città che non ha mai tenuto il mare a distanza.
Lo porta vicino. Lo pulisce. Lo arriccia. Lo apre. Lo divide. Lo mangia.

<break time="1.0s"/>

E quando io penso a questo rapporto con il mare...
il ricordo si sposta più a sud.
Verso Savelletri.

Verso un posto che per me e Domenico non era un ristorante.
E non era nemmeno una destinazione da consigliare su una guida.

Era... Forcatella.

<break time="0.8s"/>

Oggi in quella zona ci sono locali e ristoranti.
Ma io la ricordo com'era allora:
baracche sul mare, pescatori davanti all'acqua, e ricci presi nel mare antistante — portati a riva e aperti lì.

<break time="0.5s"/>

Io per i ricci impazzisco.

<break time="0.4s"/>

Io e Domenico andavamo lì con il pane croccante.
Il riccio veniva aperto, e quella parte arancione la raccoglievi direttamente col pane.

Non serviva altro.

Il mare era davanti a te... e in qualche modo, era anche quello che stavi mangiando.

<break time="0.6s"/>

Ne mangiavamo almeno cento in due.

<break time="0.5s"/>

Detto oggi sembra perfino esagerato.
Ma in quel momento non lo vivevamo come un eccesso da raccontare.
Era il nostro modo di stare lì:
il pane tra le mani, il mare davanti, il tempo senza fretta e un sapore che non somigliava a niente altro.

<break time="0.8s"/>

Oggi so che quel ricordo appartiene a un altro tempo.
I ricci sono una risorsa fragile e vanno consumati soltanto quando disponibili legalmente, e con provenienza controllata.

Ma i ricordi non si correggono.
Si raccontano con onestà.

<break time="0.6s"/>

Per me il sapore del mare di questa terra resta quello:
prima Bari, con i polpi arricciati a N'dèrr'a la lanze e il crudo mangiato davanti all'acqua...
poi Forcatella, il pane croccante tra le dita, Domenico accanto a me, e un riccio appena aperto sulla riva.

<break time="1.0s"/>

Ora torna lentamente verso la città vecchia.

Dal mare passiamo alla casa.

Non a una casa separata dalla strada.
A una casa barese che, per raccontare il proprio cibo, porta il tavolo quasi sull'uscio."""


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    ssml = f"<speak>{CAP2_TEXT}</speak>"

    print(f"Genero Cap 02 con voce {VOICE_ID}...")

    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": ssml,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.35,
                "similarity_boost": 0.80,
                "style": 0.45,
                "use_speaker_boost": True,
            },
        },
    )

    if resp.status_code != 200:
        print(f"ERRORE: {resp.status_code} — {resp.text}")
        return

    out_path = OUTPUT_DIR / OUTPUT_FILE
    out_path.write_bytes(resp.content)
    size_kb = out_path.stat().st_size // 1024
    print(f"OK  {out_path}  ({size_kb} KB)")


if __name__ == "__main__":
    main()
