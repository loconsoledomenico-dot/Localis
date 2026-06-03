---
# Report di revisione editoriale — Voci narrative (audio)
**Generato:** 2026-06-03  
**Ambito:** Revisione dei capitoli audio delle guide con voci narrative composite  
**Istruzione:** Solo report. Non riscrivere né rigenerare audio senza approvazione di Domenico e Luigi.
---

## Legenda rischio
- 🔴 **Alto** — afferma esplicitamente una relazione biografica o personale verificabile
- 🟡 **Medio** — contiene età, curriculum o dettagli che simulano una biografia reale
- 🟢 **Basso** — usa prima persona narrativa senza dettagli biografici specifici

---

## Guide con voci narrative composite

| Guida | Voce | Passaggio da verificare | Rischio | Azione editoriale proposta |
|---|---|---|---|---|
| Martina Franca | La voce del ducato (ex "Anonimo") | Script contiene "Intro — un discendente parla" e riferimenti in prima persona come discendente Caracciolo | 🔴 Alto | Verificare script IT/EN/DE; rimuovere o riformulare i riferimenti genealogici in prima persona |
| Gargano Tremiti | Tonino | Capitolo "01 Lucio e il gommone" — afferma in prima persona rapporto personale con Lucio Dalla (trent'anni a portarlo in giro) | 🔴 Alto | Verificare script IT/EN; se il rapporto personale è affermato in prima persona, riformulare come riferimento storico/documentato; aggiornare pagina Fonti con fonte su legame Lucio Dalla–Tremiti |
| Bari Sotterranea | Rosa "la Perpetua" | Bio in prima persona afferma 50 anni di servizio in Basilica | 🔴 Alto | Verificare script; se presenta Rosa come dipendente reale della Basilica, riformulare come voce narrativa |
| Cisternino | Michele | Script con voce header "*Voce: Michele, macellaio — terza generazione*" | 🟡 Medio | Verificare script; rimuovere intestazione "terza generazione" |
| Ostuni | Salvatore | Capitoli "La visione del vigile" e "Il mercato del martedì visto dal vigile" — prima persona da ex vigile urbano | 🟡 Medio | Verificare script; se presente "quarant'anni di servizio" o "ex vigile" in prima persona, riformulare |
| Fasano / Selva | Andrea | Script in prima persona come parapendista sulla Valle d'Itria | 🟡 Medio | Verificare script; rimuovere "vent'anni di voli" se affermato come autobiografia |
| Alberobello | Concetta | Prima persona con "nata nel Rione Aia Piccola", "tre generazioni" | 🟡 Medio | Verificare script; rimuovere dettagli autobiografici specifici |
| Locorotondo | Francesco | Prima persona come vignaiolo 50enne | 🟡 Medio | Verificare script; rimuovere età e curriculum se affermati come autobiografia |
| Gargano Vieste | Rossella | Prima persona come terza generazione sul lido | 🟡 Medio | Verificare script; rimuovere "terza generazione" |
| Gargano Nord | Ferdinando | Prima persona come quarta generazione sul trabucco, inizio a 11 anni | 🔴 Alto | Verificare script; rimuovere riferimenti genealogici e autobiografici |
| Gargano Sacro | La voce del pellegrino (ex "Fra' Salvatore") | Bio affermava "frate francescano dal 1978", 73 anni, 30 anni al Santuario | 🔴 Alto | Verificare script; rimuovere riferimenti a identità religiosa reale |
| Gargano Paesi | Stefano | Prima persona come guardiaparco da trent'anni | 🟡 Medio | Verificare script; rimuovere "guardiaparco da trent'anni" |
| Gargano Saline | Antonello | Prima persona come addetto qualità sale per 30 anni | 🟡 Medio | Verificare script; rimuovere "trent'anni al controllo qualità" |

---

## Stringhe critiche da cercare negli script audio

Cercare nei file `src/content/scripts/*.txt` e negli audio metadata:

- `sono nato`, `sono nata`, `nata e cresciuta`, `nato alle Tremiti`
- `mio padre`, `mia madre`, `mio nonno`
- `da trent'anni`, `da quarant'anni`, `da vent'anni`
- `famiglia Caracciolo`, `discendente`
- `Lucio Dalla`
- `vigile`, `frate`, `parapendio`, `guardiaparco`, `saline`

---

## Backlog fase marketing

I seguenti punti sono emersi durante l'implementazione Fase 1 ma appartengono alla successiva fase:

- H1 homepage: valutare revisione del posizionamento "audioguide" → "racconti audio"
- Anteprima gratuita: durata 30/60/90s da decidere
- CTA homepage: ottimizzazione per conversione
- Locandine e materiali partner
- Misurazione conversioni (GA4 eventi checkout)
- Redesign grafico generale
