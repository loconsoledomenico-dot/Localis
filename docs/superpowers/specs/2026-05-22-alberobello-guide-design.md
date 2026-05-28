# Guida Alberobello — Design Spec
**Data:** 2026-05-22  
**Progetto:** LocalisGuide — Valle d'Itria Bundle  
**Status:** Approvato dall'utente

---

## Contesto

Prima di tre guide separate per il bundle Valle d'Itria (Alberobello · Locorotondo · Martina Franca). Le guide si vendono singolarmente e in bundle. Approccio identico alle guide Bari: fatti verificati, tono colloquiale, voci locali costruite.

---

## Formato

- **Durata:** 25–30 minuti
- **Modalità:** misto auto + piedi
- **Lingue:** IT (prima) + EN (dopo)
- **Struttura:** intro in auto con paesaggio → discesa nel borgo → percorso a piedi

---

## Voce Narrante

**Michele** — 60 anni, contadino della Murgia. Ha visto Alberobello trasformarsi da paese povero a meta UNESCO. Tono burbero-affettuoso, dice le cose come stanno, zero cartolina. Non dice "benvenuti nel magico mondo dei trulli" — dice "questi li chiamano trulli, ma i vecchi del posto li chiamavano *casedde*."

---

## Capitoli

| # | Titolo | Modalità | Contenuto chiave |
|---|---|---|---|
| 1 | **Intro — la Murgia vista dal finestrino** | Auto | Paesaggio carsico, ulivi, muretti a secco (UNESCO 2018 "Arte dei muretti a secco") · cosa stai per vedere e perché è strano · Michele introduce se stesso |
| 2 | **Cosa è un trullo, davvero** | Auto/arrivo | Costruzione in pietra a secco senza malta · la leggenda fiscale del conte Acquaviva (vera? falsa?) · chi ci abitava · il termine *casedda* |
| 3 | **Rione Monti — la vetrina** | A piedi | Il rione UNESCO con 1.000+ trulli · differenza tra trulli-museo e trulli ancora abitati · come leggere il paesaggio urbano |
| 4 | **I simboli sui pinnacoli** | A piedi | Simboli magici, cristiani, pagani dipinti a calce · nessuno sa con certezza cosa significano · il reveal: origine incerta, interpretazioni molteplici |
| 5 | **Aia Piccola — quella vera** | A piedi | Il rione che i turisti saltano · ancora abitato · com'era Alberobello prima dell'UNESCO · la vita quotidiana nei trulli oggi |
| 6 | **Il Trullo Sovrano** | A piedi | L'unico trullo a due piani · storia della famiglia Perta · perché è costruttivamente diverso da tutti gli altri |
| 7 | **Come si vive in un trullo oggi** | A piedi | Temperatura interna (freschi d'estate, problema umidità d'inverno) · chi ci abita ancora · chi li ha trasformati in B&B o souvenir shop |
| 8 | **La Chiesa di Sant'Antonio** | A piedi | Unica chiesa a forma di trullo al mondo · costruita nel 1927 · storia della sua costruzione |
| 9 | **Chiusura — Michele saluta** | A piedi/auto | Cosa portarsi a casa oltre le foto · dove mangiare vero (non per turisti) · aggancio al bundle Locorotondo/Martina Franca |

---

## Angolo Narrativo

**Doppio livello:** struttura spaziale da road trip (auto → piedi → auto) con "reveal" in ogni capitolo che smonta il cliché turistico standard. Il turista medio arriva con aspettative da cartolina; Michele le ricostruisce su fatti reali.

**Cliché da smontare:**
- "I trulli si costruivano smontabili per non pagare le tasse" → leggenda apocrifa, la realtà è più complessa
- "Alberobello è sempre stata così" → era un paese povero, l'UNESCO ha trasformato tutto in 30 anni
- I simboli sui pinnacoli hanno significati precisi → nessuno lo sa davvero

---

## Tono e Stile

- Colloquiale, da bar, mai editoriale
- Fatti verificati con fonti (file `.mdx` sources separato)
- Dialetto/termini locali dove aggiungono autenticità (*casedde*, *muretti*, nomi locali)
- Michele non guida, racconta — il turista segue il percorso ma ascolta una storia

---

## File da creare

```
src/content/guides/alberobello.mdx          # metadati + capitoli
src/content/sources/alberobello.mdx         # fatti + fonti verificate
```

---

## Bundle Valle d'Itria

Questa guida è la prima di tre. Le successive:
- **Locorotondo** — borgo bianco, calma, vino Locorotondo DOC
- **Martina Franca** — barocco, Festival della Valle d'Itria, Accademia del Belcanto

Il Cap. 9 di ogni guida aggancia la successiva per spingere l'acquisto del bundle.
