# LOCALIS — Piano di intervento sul sito
## Fase 1: trasparenza narrativa e messa in sicurezza della credibilità

**Documento operativo per Claude Code**  
**Destinatari:** Luigi e Domenico Loconsole  
**Data di preparazione:** 2 giugno 2026  
**Ambito di questa fase:** credibilità, coerenza editoriale, chiarezza sulla natura delle voci narrative.  
**Fuori ambito per ora:** riposizionamento marketing, nuova hero, durata delle anteprime audio, prezzo, conversione, redesign generale.

---

# 0. Istruzione principale per Claude Code

Lavora sul repository del sito Localis con un principio preciso:

> **In questa fase non dobbiamo rendere il sito più seducente. Dobbiamo renderlo inattaccabile e coerente su ciò che è reale e ciò che è narrazione.**

Non procedere con una riscrittura generale del sito.  
Non cambiare la strategia commerciale.  
Non modificare prezzi, checkout, pacchetti, hero o anteprime audio salvo ciò che viene espressamente richiesto in questo documento.

L'obiettivo è risolvere le ambiguità presenti nelle schede voce, nelle promesse generali e nelle pagine Metodo/Chi siamo/Fonti.

---

# 1. Contesto strategico da rispettare

Localis produce racconti audio dei luoghi della Puglia. La sua promessa è aiutare il visitatore a capire ciò che sta guardando, non limitarsi a descriverlo.

Il progetto usa forme narrative differenti:

1. **Autori o testimoni reali**, quando esistono persone realmente coinvolte.
2. **Voci narrative composite**, quando un personaggio è costruito editorialmente.
3. **Ricostruzioni narrative documentate**, quando una scena o una prospettiva nasce da fonti e ricerca.
4. **Racconti storici senza personaggio**, quando il protagonista è il luogo o l'evento.

Il principio non negoziabile è:

> **La narrazione può emozionare. La provenienza della storia deve essere trasparente.**

Un personaggio narrativo non è un problema.  
È invece un problema presentarlo, anche indirettamente, come una persona reale con biografia, parentele o incontri verificabili se ciò non è vero.

---

# 2. Correzione importante rispetto al brief precedente

Nel brief iniziale era stata assunta questa regola:

> “Bari resta com'è: è tutto reale.”

L'audit del sito live mostra però una precisazione necessaria.

Nella pagina `/bari/` cinque schede risultano presentate come **“Persona reale. Ritratto dell'autore.”**, mentre **Rosa “la Perpetua”**, guida di *Bari Sotterranea*, è già indicata come:

> “Voce editoriale composita. Ritratto evocativo.”

Allo stesso tempo, la stessa pagina dichiara:

> “Sei voci baresi... ogni itinerario è firmato da chi quei posti li ha vissuti da bambino.”  
> “Sei autori baresi. Sei voci, sei guide, una sola Bari.”  
> “Ogni guida è firmata: nome, volto, storia.”

Queste frasi sono incompatibili con la presenza di Rosa come voce composita.

## Decisione operativa aggiornata

- **Non modificare le cinque schede di autori reali di Bari**, salvo refusi o modifiche richieste direttamente dai fondatori.
- **Correggere la presentazione generale della pagina Bari** affinché distingua le cinque persone reali dalla voce narrativa di *Bari Sotterranea*.
- **Correggere la scheda di Rosa** e la relativa pagina guida affinché non sembri una ex collaboratrice reale della Basilica.
- **Valle d'Itria e Gargano** restano le aree principali di revisione delle voci narrative composite.

---

# 3. Regola pubblica per la classificazione delle voci

Il sito deve poter mostrare, in modo uniforme e immediatamente comprensibile, la natura della voce di ogni guida.

## 3.1 Categorie editoriali da predisporre

Nel modello dati o nei contenuti del sito predisporre, se tecnicamente possibile, un campo strutturato come:

```ts
type NarrativeOrigin =
  | "real_person"
  | "composite_narrative_voice"
  | "documented_reconstruction"
  | "documented_historical_narration";
```

Campi suggeriti:

```ts
narrativeOrigin: NarrativeOrigin;
originLabel: string;
originDescription?: string;
portraitType?: "real_photo" | "evocative_portrait" | "none";
requiresEditorialReview?: boolean;
```

Se il progetto non usa un modello dati centralizzato, applicare lo stesso schema ai contenuti statici esistenti, evitando duplicazioni incoerenti.

## 3.2 Dicitura pubblica standard in italiano

### Persona reale
Usare soltanto quando confermato dai fondatori:

> **Persona reale. Ritratto dell'autore.**

### Voce narrativa composita — dicitura da usare ora per i personaggi costruiti
Sostituire la formula tecnica attuale con:

> **Ritratto narrativo. Costruito su ricerca e fonti Localis.**

Questa formula è più comprensibile di “voce editoriale composita” e non afferma che siano state raccolte testimonianze reali, finché questo non viene confermato.

### Voce composta da testimonianze reali
Usarla soltanto in futuro e soltanto se Domenico e Luigi confermano l'esistenza di testimonianze effettivamente raccolte:

> **Voce narrativa composta da testimonianze raccolte sul territorio.**

### Racconto storico senza personaggio
Per guide future o guide che verranno convertite in narrazione non-personale:

> **Racconto storico costruito da fonti documentate e ricerca Localis.**

## 3.3 Versioni inglese e tedesca della dicitura standard

Le pagine pubbliche esistono in IT/EN/DE. Applicare le correzioni nelle tre lingue, senza lasciare una lingua con la promessa precedente.

**Italiano**  
`Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**English**  
`Narrative portrait. Created from Localis research and sources.`

**Deutsch**  
`Narratives Porträt. Auf Grundlage der Recherchen und Quellen von Localis gestaltet.`

Per le bio EN/DE, tradurre fedelmente il nuovo significato; non introdurre dettagli biografici o testimonianze non presenti nella versione italiana approvata.

---

# 4. Programma di esecuzione

## FASE A — Audit del repository prima delle modifiche

Prima di editare:

1. Individua framework e struttura del progetto.
2. Individua dove sono memorizzati:
   - dati delle guide;
   - dati delle voci/autori;
   - testi homepage;
   - testi `/about`, `/metodo`, `/fonti`;
   - footer globale;
   - stringhe localizzate IT/EN/DE;
   - titoli/meta title/description, senza modificarli in questa fase.
3. Cerca nel repository tutte le occorrenze delle stringhe critiche:
   - `Voce editoriale composita`
   - `Ritratto evocativo`
   - `discendente`
   - `Caracciolo`
   - `Lucio Dalla`
   - `terza generazione`
   - `quarta generazione`
   - `quarant'anni di servizio`
   - `vent'anni di voli`
   - `chi quei posti li vive`
   - `da chi ci è nato`
   - `voci personali`
   - `memoria orale raccolta`
   - `Storie raccolte sul territorio`
   - `Non esiste un'altra audioguida`
   - `bibligrafia`
4. Prima del commit, genera un riepilogo dei file toccati e delle stringhe ancora presenti.

Non dedurre i file dal presente documento: trovali nel repository reale.

---

## FASE B — Correzioni bloccanti di credibilità

Queste modifiche hanno priorità assoluta.

### B1. Martina Franca — rimuovere la discendenza Caracciolo

**Route live interessate:**
- `/valle-d-itria/`
- `/guide/`
- `/guide/martina-franca/`
- eventuali versioni EN/DE e componenti/data source condivisi.

**Testi attuali da eliminare ovunque:**
- `Discendente dei Caracciolo`
- `Discendente diretto della famiglia Caracciolo. Preferisce non dare il nome — vuole raccontare storie, non fare dichiarazioni.`
- `Trecento anni di ducato, raccontati da chi li ha nel sangue.`
- `Intro — un discendente parla`

**Nuovo nome visualizzato della voce:**
> `La voce del ducato`

Non usare `Anonimo`, perché suggerisce una persona reale che vuole nascondere la propria identità.

**Nuova riga di provenienza:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Nuova bio:**
> `Una voce narrativa accompagna il racconto del ducato, dei Caracciolo e della memoria storica di Martina Franca.`

**Nuovo sottotitolo/teaser breve nella lista guide:**
> `Trecento anni di ducato attraverso la memoria storica della città.`

**Nuovo titolo capitolo, se il capitolo è visibile nella pagina:**
> `01 Intro — una voce dal ducato`

**Nota:** non alterare il contenuto storico dei Caracciolo; si elimina soltanto la falsa/imprecisata relazione genealogica del narratore.

---

### B2. Isole Tremiti — rimuovere la relazione personale di Tonino con Lucio Dalla

**Route live interessate:**
- `/gargano/`
- `/guide/`
- `/guide/gargano-tremiti/`
- eventuali versioni EN/DE e componenti/data source condivisi.

**Testi attuali da eliminare ovunque:**
- `Tonino ci portava Lucio Dalla per trent'anni.`
- `Per vent'anni ha portato Lucio Dalla in giro per le grotte.`
- `Ha portato Lucio Dalla a fare il giro delle grotte per trent'anni.`
- ogni variante che attribuisca a Tonino un rapporto personale con Lucio Dalla.

**Mantenere eventualmente il riferimento a Lucio Dalla solo se:**
- espresso come legame documentato tra l'artista e le Tremiti;
- sostenuto nella pagina Fonti da fonte verificabile;
- non presentato come ricordo personale del narratore.

**Nuova riga di provenienza:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Nuova bio:**
> `Attraverso Tonino, Localis racconta le grotte, le cale, le correnti e la vita insulare delle Tremiti.`

**Nuovo sottotitolo/teaser individuale sicuro:**
> `San Domino, San Nicola, le grotte marine e la vita dell'arcipelago.`

**Nuovo sottotitolo voce nella pagina zona:**
> `Tonino, voce narrativa delle Tremiti`

**Audit obbligatorio, non correzione automatica del testo audio:**  
Il capitolo pubblico compare come `01 Lucio e il gommone`. Segnalarlo nel report finale come punto da verificare editorialmente nell'audio e nella pagina Fonti. Non riscrivere il copione audio senza approvazione di Domenico e Luigi.

---

### B3. Bari — correggere l'incoerenza prodotta dalla voce composita Rosa

**Route live interessate:**
- `/bari/`
- `/guide/bari-sotterranea/`
- eventuali versioni EN/DE e componenti/data source condivisi.

**Non cambiare:**
- i cinque autori presentati come persone reali, salvo indicazione dei fondatori;
- l'H1 `Bari raccontata da chi la vive.` in questa fase.

**Sostituire nella pagina Bari il testo generale che oggi presenta tutte le sei guide come autori reali.**

**Testo attuale da sostituire:**
> `Sei voci baresi. Dalla città di pietra al porto, dai teatri ai sotterranei: ogni itinerario è firmato da chi quei posti li ha vissuti da bambino. Tocca un riquadro per ascoltare.`

**Nuovo testo:**
> `Cinque autori reali raccontano la loro Bari. Per Bari Sotterranea, Localis utilizza una voce narrativa dichiarata, costruita su ricerca e fonti del luogo. Tocca un riquadro per ascoltare.`

**Titolo attuale da sostituire:**
> `Sei autori baresi. Sei voci, sei guide, una sola Bari.`

**Nuovo titolo:**
> `Cinque autori reali, una voce narrativa. Sei guide, una sola Bari.`

**Paragrafo attuale da sostituire:**
> `Non guide certificate, non copia-incolla Wikipedia. Autori che quei vicoli li hanno vissuti, hanno mangiato in quei panifici, hanno visto cambiare quei mercati. Ogni guida e firmata: nome, volto, storia.`

**Nuovo paragrafo:**
> `Le guide di Bari nascono da esperienze reali e ricerca Localis. Quando parla una persona reale, la presentiamo come tale. Quando il racconto usa una voce narrativa, lo dichiariamo con la stessa chiarezza.`

**Scheda Rosa — eliminare:**
- `Cinquant'anni di servizio nella Basilica di San Nicola`
- `Adesso in pensione`
- qualunque frase che la presenti come reale dipendente o collaboratrice della Basilica.

**Nuova riga di provenienza Rosa:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Nuova bio Rosa:**
> `Attraverso Rosa, Localis accompagna l'ascoltatore nel sottosuolo di Bari, tra cripte, pietra e stratificazioni della città antica.`

Applicare la medesima correzione nella pagina individuale `/guide/bari-sotterranea/`.

---

## FASE C — Revisione delle schede composite di Valle d'Itria

**Route principali:**
- `/valle-d-itria/`
- `/guide/`
- tutte le singole pagine guida relative alla Valle d'Itria;
- localizzazioni EN/DE.

La regola di questa fase è: mantenere il personaggio come dispositivo narrativo, ma rimuovere età, curriculum e dettagli che lo trasformano in una persona concreta non verificata.

### C1. Alberobello — Concetta

**Conservare:** nome `Concetta`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Concetta, il racconto entra nella vita quotidiana dei trulli: pietra, acqua, freddo e trasformazioni di Alberobello.`

**Eliminare dalla scheda pubblica:**
- `Sessantacinque anni`
- `nata e cresciuta nel Rione Aia Piccola`
- `Tre generazioni sotto lo stesso tetto di pietra`

**Audit editoriale successivo, non modifica automatica dell'audio:**  
La guida in prima persona contiene o può contenere ricordi autobiografici specifici. Preparare un elenco dei passaggi da verificare; non riscrivere l'audio in questa fase.

### C2. Locorotondo — Francesco

**Conservare:** nome `Francesco`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Francesco, Localis racconta il legame tra il borgo, le vigne e i prodotti della Valle d'Itria.`

**Eliminare dalla scheda pubblica:**
- `Cinquant'anni`
- `Produce vino DOC, olio e olio essenziale di lavanda`

### C3. Martina Franca — La voce del ducato

Applicare integralmente le modifiche bloccanti della Fase B1.

### C4. Cisternino — Michele

**Conservare:** nome `Michele`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Michele, Localis racconta il rito del fornello pronto: la brace, la bombetta e la vita del centro storico.`

**Teaser da sostituire:**
- Attuale: `Un macellaio di terza generazione e la bombetta più buona che mangerai.`
- Nuovo: `Il fornello pronto, la bombetta e il rito della brace nel centro storico.`

**Eliminare dalla scheda:**
- `Macellaio di terza generazione`
- `Gestisce il fornello pronto più antico del centro storico`

**Controllare i titoli capitolo visibili:**  
`La macelleria — la giornata di Michele` può restare solo se è chiaramente trattato come racconto narrativo; segnalarlo comunque nel report per revisione audio/editoriale.

### C5. Ostuni — Salvatore

**Conservare:** nome `Salvatore`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Salvatore, Localis racconta i vicoli di Ostuni, le estati affollate e il silenzio dell'inverno.`

**Teaser da sostituire:**
- Attuale: `Trenta minuti, quarant'anni di servizio, e i segreti di una città che fa perdere la testa in agosto.`
- Nuovo: `Trenta minuti tra vicoli bianchi, estati affollate e inverni silenziosi.`

**Eliminare dalla scheda:**
- `Ex vigile urbano`
- `quarant'anni di servizio`
- `conosce ogni multa`

**Controllare titoli capitolo visibili:**
- `La visione del vigile — le stagioni del turismo`
- `Il mercato del martedì visto dal vigile`
- `Chiusura — il vigile lascia andare`

Segnalarli per eventuale revisione editoriale; se sono soltanto metadata/testi pubblici e non richiedono modifica audio, sostituirli con formule neutrali:
- `Le stagioni del turismo`
- `Il mercato del martedì`
- `Chiusura — Ostuni in inverno`

### C6. Fasano / Selva di Fasano — Andrea

**Conservare:** nome `Andrea`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Andrea, Localis osserva la geometria di trulli, masserie e colline da una prospettiva alta sulla Valle d'Itria.`

**Teaser da sostituire:**
- Attuale: `Vent'anni di voli sulla Valle d'Itria e una prospettiva che non trovi sui libri.`
- Nuovo: `La Valle d'Itria vista dall'alto, tra trulli, masserie e colline.`

**Eliminare dalla scheda:**
- `Appassionato di parapendio`
- `vola sulla Valle d'Itria da vent'anni`

---

## FASE D — Revisione delle schede composite del Gargano

**Route principali:**
- `/gargano/`
- `/guide/`
- tutte le singole pagine guida Gargano;
- localizzazioni EN/DE.

### D1. Vieste — Rossella

**Conservare:** nome `Rossella`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Rossella, Localis racconta la costa di Vieste, il rapporto con il mare e le trasformazioni del litorale.`

**Sostituire sottotitoli/etichette che dicono:**
- `terza generazione sul lido`
- `Raccontati da chi gestisce un lido da tre generazioni`

**Con:**
> `Rossella, voce narrativa della costa di Vieste`

### D2. Costa Nord — Ferdinando

**Conservare:** nome `Ferdinando`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Ferdinando, Localis racconta i trabucchi e il mare tra Peschici, Rodi Garganico e Lesina.`

**Eliminare:**
- `quarta generazione sul trabucco`
- `trabucco di famiglia`
- `da quando aveva undici anni`

**Sostituire etichetta:**
> `Ferdinando, voce narrativa dei trabucchi`

### D3. Gargano Sacro — Fra' Salvatore

L'espressione `Fra' Salvatore` e la biografia attuale fanno pensare a un religioso reale. In assenza di conferma, modificare.

**Nuovo nome visualizzato:**
> `La voce del pellegrino`

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Una voce narrativa accompagna il cammino tra la Foresta Umbra, Monte Sant'Angelo e la grotta dell'Arcangelo.`

**Eliminare:**
- `Frate francescano dal 1978`
- `Settantatré anni`
- `Trent'anni al Santuario`

### D4. Tremiti — Tonino

Applicare integralmente le modifiche bloccanti della Fase B2.

### D5. I Borghi — Stefano

**Conservare:** nome `Stefano`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Stefano, Localis racconta i borghi interni del Gargano, le loro strade e il paesaggio lontano dalla costa.`

**Eliminare:**
- `Guardiaparco da trent'anni`
- `Trent'anni nel Parco Nazionale del Gargano`
- eventuali età e curriculum attribuiti come reali.

**Sostituire etichetta:**
> `Stefano, voce narrativa dei borghi interni`

### D6. Saline — Antonello

**Conservare:** nome `Antonello`.

**Riga di provenienza nuova:**
> `Ritratto narrativo. Costruito su ricerca e fonti Localis.`

**Bio nuova:**
> `Attraverso Antonello, Localis racconta le saline di Margherita di Savoia, il lavoro del sale e il paesaggio delle vasche.`

**Eliminare:**
- `Trent'anni al controllo qualità del sale`
- `Trent'anni alle saline`
- età e provenienze presentate come biografia reale.

**Sostituire etichetta:**
> `Antonello, voce narrativa delle saline`

---

# 5. Pagine generali: interventi necessari

## 5.1 Homepage `/`

### Obiettivo
Non modificare ora l'H1 o la strategia marketing. Correggere soltanto le frasi che estendono implicitamente l'autenticità personale a tutte le guide.

### Lasciare invariato in questa fase
- H1: `Audioguide narrative per capire la Puglia, anche prima di partire.`
- CTA e struttura dell'hero.
- Prezzi, pack, durata assaggio, sezioni di conversione.

### Sostituzioni obbligatorie

**Testo attuale:**
> `Localis non è la solita audioguida turistica: è un racconto audio del luogo, con storie, aneddoti storici e voci personali che aiutano a capire come quel posto è diventato ciò che è oggi.`

**Nuovo testo:**
> `Localis non è la solita audioguida turistica: è un racconto audio del luogo, con storie, contesto storico e voci narrative dichiarate che aiutano a capire come quel posto è diventato ciò che è oggi.`

---

**Titolo attuale:**
> `Scritte in Puglia. Con fonti verificabili.`

Può restare, a condizione che la pagina Fonti venga resa coerente come richiesto più avanti.

**Paragrafo attuale da sostituire:**
> `Ogni capitolo nasce da ricerca d'archivio: Treccani, DBI, monografie accademiche, memoria orale raccolta sul territorio. Un cortile, un altare laterale, la storia del porto — ogni affermazione ha una fonte pubblica.`

**Nuovo paragrafo:**
> `Ogni guida nasce da ricerca e verifica editoriale: fonti storiche, fonti istituzionali e, dove realmente raccolta, memoria orale locale. Nella pagina Fonti pubblichiamo i riferimenti utilizzati per costruire i racconti.`

---

**Testo attuale da sostituire:**
> `Non un catalogo turistico. Una collezione di voci: ogni destinazione ha i suoi autori, le sue storie, il suo suono.`

**Nuovo testo:**
> `Non un catalogo turistico. Una collezione di racconti: ogni destinazione ha le sue storie, le sue fonti e il suo punto di vista.`

---

## 5.2 Footer globale

**Testo attuale:**
> `Audioguide scritte in Puglia · Fonti d'archivio verificabili · Storie raccolte sul territorio`

**Nuovo testo:**
> `Audioguide scritte in Puglia · Fonti consultabili · Racconti narrativi dei luoghi`

Applicare a tutte le pagine e a tutte le lingue.

---

## 5.3 Catalogo generale `/guide/`

### Intro attuale da sostituire
> `Non un catalogo. Una collezione di voci: baresi, martinesi, vignaioli, discendenti. Ogni guida è scritta da chi quei posti li vive.`

### Nuovo intro
> `Non un catalogo. Una collezione di racconti: autori reali dove dichiarati, voci narrative dove il luogo richiede una ricostruzione. Ogni guida nasce da ricerca, fonti e scrittura Localis.`

Applicare inoltre nel catalogo tutte le sostituzioni dei teaser indicate nelle Fasi B, C e D.

---

## 5.4 Pagina `/about/`

La pagina attuale contiene promesse non coerenti con la presenza di personaggi compositi, in particolare:

- `Ogni guida combina ricerca d archivio verificabile, memoria orale raccolta sul territorio e revisione editoriale umana.`
- `Le voci audio sono sintetiche ... mantenere i racconti nelle parole di chi ce le ha consegnate.`
- `Concetta (Alberobello) — Autrice territoriale — Raccoglie memoria orale...`

### Intervento richiesto

**Mantenere:**
- titolo `Localis è una redazione, non un generatore.`
- card di Domenico Loconsole e Luigi Loconsole, salvo refusi.
- eventuali card di persone reali confermate.

**Sostituire il paragrafo introduttivo con:**
> `Localis nasce a Bari da Domenico e Luigi Loconsole. Ogni guida combina ricerca, fonti verificabili e revisione editoriale umana. Quando un racconto nasce anche da memorie raccolte sul territorio, lo dichiariamo. Quando utilizziamo una voce narrativa costruita, lo dichiariamo con la stessa chiarezza.`

**Sostituire il paragrafo sulle voci sintetiche con:**
> `Le voci audio sono sintetiche per una scelta dichiarata: offrire una lettura stabile, chiara e ascoltabile in strada. La scrittura, la selezione delle fonti e la responsabilità editoriale restano umane.`

### Separare persone reali e voci narrative

Non lasciare Concetta sotto il titolo `Le persone dietro le guide` come se fosse una collaboratrice reale.

Soluzione richiesta:

1. mantenere la sezione `Le persone dietro Localis` per Domenico, Luigi e persone reali;
2. aggiungere una sezione distinta:

**Titolo:**
> `Le voci narrative`

**Testo introduttivo:**
> `Alcune guide utilizzano personaggi narrativi dichiarati: non testimoni individuali, ma ritratti costruiti attraverso ricerca e fonti per dare al luogo un punto di vista umano.`

**Card Concetta:**
- Nome: `Concetta — Alberobello`
- Ruolo: `Ritratto narrativo`
- Descrizione: `Una voce costruita per raccontare la vita quotidiana nei trulli, tra pietra, acqua e trasformazioni del paese.`

---

## 5.5 Pagina `/metodo/`

### Correzioni obbligatorie

**Refusi:**
- `bibligrafia` → `bibliografia`
- correggere tutti gli accenti mancanti: `piu` → `più`, `non e` → `non è`, `sensibilita` → `sensibilità`, e simili.

**Eliminare completamente questa affermazione:**
> `Non esiste un'altra audioguida italiana con questo livello di trasparenza sulle fonti.`

Non sostituirla con un'altra affermazione comparativa assoluta.

### Passo 2 — Memoria orale

**Testo attuale problematico:** dichiara che per ogni guida vengono svolte conversazioni sul territorio.

**Nuovo testo:**
> `I libri danno la struttura. Quando una guida nasce anche da memorie raccolte sul territorio, queste aggiungono lessico, gesti e prospettive che una fonte scritta non può restituire da sola. Non presentiamo mai come testimonianza reale ciò che è una costruzione narrativa.`

### Passo 3 — Scrittura

Mantenere il concetto già presente, ma sostituire il paragrafo sulle voci con una formulazione più diretta:

> `In questa fase definiamo anche la natura della voce narrativa. Quando la voce appartiene a una persona reale, lo indichiamo espressamente. Quando il racconto utilizza un personaggio costruito, lo presentiamo come ritratto narrativo: una prospettiva editoriale basata su ricerca e fonti Localis, non una testimonianza individuale.`

### Passo 4 — Produzione audio

**Testo attuale da sostituire perché implica sempre parole consegnate da testimoni:**
> `La voce sintetica permette di mantenere le storie nelle parole di chi ce le ha date, senza le limitazioni del microfono.`

**Nuovo testo:**
> `La voce sintetica permette una lettura stabile, nitida e ascoltabile durante la visita. Le voci AI non sostituiscono la responsabilità editoriale: fonti, scrittura e natura del racconto restano dichiarate in modo trasparente.`

### Aggiungere box finale: “Come leggiamo le voci”

Inserire prima della chiusura una breve legenda:

> **Come leggiamo le voci**
>
> - **Persona reale:** autore o testimone realmente coinvolto, presentato con il suo consenso.
> - **Ritratto narrativo:** personaggio costruito su ricerca e fonti Localis; non è una testimonianza individuale.
> - **Racconto storico documentato:** narrazione affidata a una voce senza fingere un testimone personale.

---

## 5.6 Pagina `/fonti/`

### Obiettivo
La pagina Fonti è un punto di forza, ma non deve formulare promesse universali sulla memoria orale o sulla completezza assoluta delle prove se non verificabili guida per guida.

### Header attuale da sostituire
> `Ogni guida nasce da fonti verificabili, sopralluoghi e memoria orale locale. Quando un dettaglio non è documentabile, lo dichiariamo come ricostruzione narrativa.`

### Nuovo header
> `Ogni guida nasce da ricerca e fonti dichiarate. Dove utilizziamo memoria orale raccolta sul territorio, lo indichiamo; dove il racconto ricostruisce una scena o una voce narrativa, lo dichiariamo come tale.`

### Non eseguire automaticamente una revisione storica totale
Claude Code non deve decidere autonomamente quali affermazioni storiche siano vere o false. Deve però:

1. aggiungere, se possibile, una struttura visiva per distinguere:
   - `Fonte istituzionale o primaria`
   - `Studio scientifico / accademico`
   - `Fonte divulgativa o di contesto`
   - `Memoria orale`, solo se realmente esistente e confermata
   - `Ricostruzione narrativa`, quando applicabile
2. produrre nel report finale una lista delle fonti divulgative/blog/Wikipedia che sarebbe opportuno rafforzare editorialmente con fonti più autorevoli;
3. non cancellare riferimenti senza una fonte sostitutiva approvata.

---

# 6. Audit degli audio e dei capitoli: solo report, non riscrittura automatica

Le modifiche richieste sopra riguardano il sito e i testi pubblici.

Tuttavia molte guide contengono capitoli o testi audio in prima persona. Claude Code deve cercare, nei file delle trascrizioni o dei contenuti audio se presenti nel repository, affermazioni che possano simulare biografie reali.

## Stringhe e concetti da cercare

- `sono nato`, `sono nata`, `nata e cresciuta`, `nato alle Tremiti`
- `mio padre`, `mia madre`, `mio nonno`
- `da trent'anni`, `da quarant'anni`, `da vent'anni`
- `famiglia Caracciolo`, `discendente`
- `Lucio Dalla`
- `vigile`, `frate`, `parapendio`, `guardiaparco`, `saline`
- riferimenti a lavoro, parentela, incontro con personaggi famosi o residenza specifica attribuiti alle voci composite.

## Output richiesto

Creare nel repository, senza modificare gli audio, un report:

`docs/editorial-audit/narrative-voices-audio-review.md`

Il report deve contenere per ogni guida composita:

| Guida | Voce | Passaggio da verificare | Rischio | Azione editoriale proposta |
|---|---|---|---|---|

Non riscrivere né rigenerare audio senza approvazione esplicita di Domenico e Luigi.

---

# 7. Localizzazione IT / EN / DE

Il sito dichiara contenuti disponibili in italiano, inglese e tedesco.

## Regola
Ogni correzione che rimuove una promessa falsa o ambigua deve essere applicata anche alle versioni EN e DE, se presenti nel repository o generate da file di contenuto distinti.

## Priorità
1. eliminazione di `Caracciolo descendant` / equivalenti;
2. eliminazione del rapporto personale Tonino–Lucio Dalla / equivalenti;
3. sostituzione della dicitura delle voci composite;
4. correzione dei claim globali e della pagina Metodo/About;
5. verifica che nessuna lingua continui a promettere testimonianze personali non dichiarate.

## Vincolo
Non introdurre nelle versioni straniere dettagli nuovi rispetto all'italiano approvato.

---

# 8. Elementi da NON modificare in questa fase

Questi punti sono importanti, ma appartengono alla successiva fase marketing/conversione:

- H1 della homepage e nuovo posizionamento visibile;
- eliminazione o spostamento della parola `audioguide`;
- frase `Vedere è facile. Capire è un'altra cosa.`;
- durata dell'anteprima gratuita: 30 / 60 / 90 secondi;
- contenuto dei trailer audio;
- prezzo delle guide o dei pack;
- struttura del checkout;
- locandine, QR code e materiali partner;
- redesign grafico generale;
- nuove guide o nuovi personaggi;
- riscrittura integrale degli audio.

Se durante l'implementazione emerge un problema relativo a questi punti, inserirlo nel report finale sotto `Backlog fase marketing`, senza applicare modifiche.

---

# 9. Test e controllo qualità prima della consegna

## 9.1 Controlli testuali automatici

Dopo l'implementazione, eseguire una ricerca su tutto il progetto per verificare che non rimangano, salvo contenuti esplicitamente approvati, le seguenti stringhe:

```text
Discendente diretto della famiglia Caracciolo
Discendente dei Caracciolo
chi li ha nel sangue
Tonino ci portava Lucio Dalla
ha portato Lucio Dalla
terza generazione sul lido
quarta generazione sul trabucco
macellaio di terza generazione
ex vigile urbano
quarant'anni di servizio
vent'anni di voli
frate francescano dal 1978
guardiaparco da trent'anni
trent'anni al controllo qualità del sale
Ogni guida è scritta da chi quei posti li vive
ogni destinazione ha i suoi autori
voci personali
Non esiste un'altra audioguida italiana
bibligrafia
```

Se una stringa permane in una trascrizione audio non modificata, non eliminarla automaticamente: elencarla nel report di revisione audio.

## 9.2 Controllo pagine

Verificare rendering e testo delle seguenti route almeno in italiano e, se disponibili, in inglese e tedesco:

```text
/
/guide/
/about/
/metodo/
/fonti/
/bari/
/valle-d-itria/
/gargano/
/guide/bari-sotterranea/
/guide/alberobello/
/guide/locorotondo/
/guide/martina-franca/
/guide/cisternino/
/guide/ostuni/
/guide/gargano-tremiti/
```

Eseguire anche controllo sulle rimanenti pagine individuali Valle d'Itria e Gargano se esistenti nel routing.

## 9.3 Controllo visuale

Verificare che:

- i badge `Persona reale` e `Ritratto narrativo` siano leggibili e visivamente distinguibili;
- i ritratti evocativi non vengano presentati con alt text che li definisca come fotografie reali;
- non si creino rotture di layout dovute a testi più lunghi;
- mobile e desktop rimangano corretti;
- le tre lingue non abbiano overflow o tagli anomali.

## 9.4 Controllo build

Eseguire i comandi previsti dal progetto, ad esempio, solo dopo averli individuati dal `package.json` o dalla documentazione reale:

```bash
npm run lint
npm run test
npm run build
```

Non assumere i comandi se il progetto usa un package manager o script differenti.

---

# 10. Deliverable finali richiesti a Claude Code

Al termine del lavoro, consegnare:

1. **Diff delle modifiche effettuate**, ordinato per pagina/componente.
2. **Elenco file modificati.**
3. **Conferma delle stringhe rimosse** nelle pagine pubbliche.
4. **Conferma delle tre localizzazioni** modificate o indicazione delle lingue non presenti nel repository.
5. **Report di audit degli audio/capitoli**, senza riscrittura automatica:
   - `docs/editorial-audit/narrative-voices-audio-review.md`
6. **Backlog fase marketing**, senza implementazione:
   - hero homepage;
   - anteprima gratuita;
   - CTA;
   - locandine/partner;
   - misurazione conversioni.
7. **Screenshot o preview locale** delle pagine modificate, se l'ambiente lo consente.
8. **Build/lint/test report**.

---

# 11. Criteri di accettazione

Il lavoro è completato soltanto quando:

- nessuna pagina pubblica presenta un personaggio composito come discendente reale, collaboratore reale, professionista reale o conoscente personale di un personaggio famoso;
- la relazione personale inventata tra Tonino e Lucio Dalla è rimossa dalla comunicazione pubblica;
- Martina Franca non suggerisce più che il narratore sia un discendente reale dei Caracciolo;
- Bari distingue correttamente le cinque persone reali dalla voce narrativa Rosa;
- Concetta non appare nella pagina Chi siamo come collaboratrice/autrice territoriale reale;
- le pagine generali non affermano che ogni guida è scritta da persone reali del posto;
- `/metodo/` descrive correttamente l'esistenza delle voci narrative e della sintesi vocale AI;
- `/fonti/` non promette memoria orale per tutte le guide senza distinzione;
- IT/EN/DE sono allineate;
- eventuali rischi presenti negli audio sono documentati per revisione umana;
- nessuna modifica marketing o commerciale non richiesta è stata introdotta.

---

# 12. Nota finale per Claude Code

Questa non è una ripulitura cosmetica.

Localis può usare personaggi narrativi e può farlo molto bene. Il valore del progetto non dipende dal fatto che ogni voce sia una persona reale. Dipende dalla capacità di raccontare i luoghi con profondità, senza confondere un racconto editoriale con una testimonianza biografica.

Implementa questa fase con interventi mirati, conservativi e verificabili.

> **La narrazione può emozionare. La provenienza della storia deve essere trasparente.**
