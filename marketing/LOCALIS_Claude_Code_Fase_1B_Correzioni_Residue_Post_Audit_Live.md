# LOCALIS — Correzioni residue dopo il controllo del sito live
## Brief operativo per Claude Code — Fase 1B: coerenza, trasparenza e sincronizzazione

**Destinatari:** Domenico e Luigi Loconsole / Claude Code  
**Data controllo sito live:** 3 giugno 2026  
**Sito verificato:** `https://localis.guide/`  
**Scopo di questa fase:** completare la messa in sicurezza editoriale già iniziata, senza aprire ancora il lavoro di marketing e conversione.

---

# 0. Istruzione principale

Questa è una **seconda passata correttiva**.

Molte modifiche della Fase 1 sono state applicate bene e **non devono essere annullate**. Restano però incoerenze tra:

- pagina generale Bari;
- pagina singola Bari Vecchia;
- catalogo generale `/guide/`;
- pagina `/about/`;
- versioni inglese e tedesca;
- durate e disponibilità linguistiche mostrate in punti diversi del sito.

Principio non negoziabile:

> **La narrazione può emozionare. La provenienza della storia deve essere trasparente.**

In questa fase:

- **non rifare il posizionamento commerciale generale**;
- **non cambiare prezzi, checkout, anteprima audio o layout**, salvo bug direttamente legati ai dati mostrati;
- **non riscrivere automaticamente gli audio**;
- applicare solo correzioni di credibilità, coerenza e sincronizzazione dati.

---

# 1. Modifiche già applicate bene: non regredire

Dal controllo del sito live risultano già corretti questi elementi.

## 1.1 Homepage `/`

Sono già corretti e vanno mantenuti:

- `Localis non è la solita audioguida turistica: è un racconto audio del luogo, con storie, contesto storico e voci narrative dichiarate...`
- `Ogni guida nasce da ricerca e verifica editoriale: fonti storiche, fonti istituzionali e, dove realmente raccolta, memoria orale locale...`
- footer: `Audioguide scritte in Puglia · Fonti consultabili · Racconti narrativi dei luoghi`

## 1.2 Catalogo generale `/guide/`

L’introduzione è già corretta e va mantenuta:

> `Non un catalogo. Una collezione di racconti: autori reali dove dichiarati, voci narrative dove il luogo richiede una ricostruzione. Ogni guida nasce da ricerca, fonti e scrittura Localis.`

## 1.3 Pagina Fonti `/fonti/`

L’apertura è già corretta e va mantenuta:

> `Ogni guida nasce da ricerca e fonti dichiarate. Dove utilizziamo memoria orale raccolta sul territorio, lo indichiamo; dove il racconto ricostruisce una scena o una voce narrativa, lo dichiariamo come tale.`

## 1.4 Pagina Metodo `/metodo/`

La pagina è stata aggiornata nella direzione corretta: distinzione tra memoria raccolta e costruzione narrativa, responsabilità umana e voci sintetiche.  
Non riscriverla in questa fase; eseguire solo un controllo finale per eventuali refusi residui.

## 1.5 Pagine singole già corrette

Non ripristinare le vecchie bio specifiche dei personaggi compositi. Sono state già corrette, almeno nelle pagine singole italiane verificate, le guide:

- Alberobello / Concetta;
- Martina Franca / La voce del ducato;
- Cisternino / Michele;
- Ostuni / Salvatore;
- Fasano / Andrea;
- Tremiti / Tonino;
- Bari Sotterranea / Rosa.

---

# 2. PRIORITÀ BLOCCANTE — Correggere Domenico in Bari Vecchia

La pagina generale Bari presenta Domenico correttamente.  
La pagina singola di Bari Vecchia conserva invece una biografia falsa.

## 2.1 Pagina italiana `/guide/bari-vecchia/`

### Testo attuale da eliminare

```text
Barese doc, cresciuto tra i vicoli del borgo antico. Conosce ogni pietra, ogni corte, ogni storia che non sta sui cartelli. Bari Vecchia la racconta come la vivono quelli che ci abitano davvero.
```

### Nuovo testo da inserire

```text
Barese, cresciuto nel quartiere Libertà, a pochi passi dal borgo antico. Fondatore di Localis, racconta Bari Vecchia attraverso la sua storia, le sue pietre e il legame profondo che questo luogo conserva con l’identità della città.
```

### Mantenere

```text
Domenico
Persona reale. Ritratto dell’autore.
```

---

## 2.2 Pagina inglese `/en/guide/bari-vecchia/`

### Testo attuale da eliminare

```text
Born and raised in the old city. He knows every stone, every courtyard, every story that never made it onto a sign. He tells Old Bari the way the people who actually live there experience it.
```

### Nuovo testo inglese

```text
Born in Bari and raised in the Libertà neighbourhood, a few steps from the old town. Founder of Localis, Domenico tells the story of Bari Vecchia through its history, its stones and the deep bond this place still holds with the city’s identity.
```

### Mantenere

```text
Domenico
Real person. Author portrait.
```

---

## 2.3 Pagina tedesca `/de/guide/bari-vecchia/`

### Testo attuale da eliminare

```text
Aufgewachsen in der Altstadt. Er kennt jeden Stein, jeden Hof, jede Geschichte, die auf keinem Schild steht. Er erzählt Bari Vecchia so, wie die Menschen, die wirklich hier leben, es erleben.
```

### Nuovo testo tedesco

```text
In Bari geboren und im Viertel Libertà aufgewachsen, nur wenige Schritte von der Altstadt entfernt. Als Gründer von Localis erzählt Domenico Bari Vecchia durch ihre Geschichte, ihre Steine und die tiefe Verbindung, die dieser Ort bis heute mit der Identität der Stadt bewahrt.
```

### Mantenere

```text
Domenico
Reale Person. Autorenporträt.
```

---

## 2.4 Copy lungo della pagina Bari Vecchia: correggere la promessa generale

Nella pagina singola italiana compare una sezione con titolo:

```text
Audioguide nate dalla ricerca e raccontate da chi ci è nato
```

e un testo che dichiara:

```text
rifiutiamo lo storytelling artificiale
```

Questa pagina riguarda una voce reale, ma la formulazione è presentata come promessa generale Localis e contraddice l’uso dichiarato dei ritratti narrativi in altre guide.

### Sostituire il titolo italiano con

```text
Un racconto nato dalla ricerca e narrato da una voce barese reale
```

### Sostituire il paragrafo introduttivo della sezione con

```text
Questa guida è narrata da Domenico, barese e fondatore di Localis. Il racconto nasce da ricerca storica, fonti dichiarate e da uno sguardo personale sulla città in cui è cresciuto, senza trasformare Bari Vecchia in una cartolina o in una semplice lista di monumenti.
```

### Nuovo secondo paragrafo consigliato

```text
In Localis ogni voce viene dichiarata per ciò che è: persona reale quando l’autore è realmente coinvolto, ritratto narrativo quando il racconto utilizza una prospettiva costruita su ricerca e fonti. In questa guida la voce è reale: è quella di Domenico.
```

Applicare lo stesso significato nelle versioni inglese e tedesca della pagina.

---

# 3. PRIORITÀ BLOCCANTE — Completare la correzione della pagina Bari

## 3.1 Pagina italiana `/bari/`

La sezione autori è già corretta nel titolo:

```text
Cinque autori reali, una voce narrativa. Sei guide, una sola Bari.
```

e la scheda Domenico è già corretta.  
Restano due incoerenze.

---

### 3.1.1 Correggere l’introduzione all’elenco guide

### Testo attuale da eliminare

```text
Sei voci baresi. Dalla città di pietra al porto, dai teatri ai sotterranei: ogni itinerario è firmato da chi quei posti li ha vissuti da bambino. Tocca un riquadro per ascoltare.
```

### Nuovo testo

```text
Sei racconti tra città vecchia, porto, teatri e sotterranei: cinque affidati ad autori reali, uno costruito come ritratto narrativo dichiarato. Tocca un riquadro per ascoltare.
```

---

### 3.1.2 Correggere la bio di Rosa nella pagina Bari

### Testo attuale da eliminare

```text
Cinquant’anni di servizio nella Basilica di San Nicola — a pulire, riordinare, ascoltare. Adesso in pensione, ma le pietre della cripta sa ancora ricordarle a memoria. Una pulita per volta.
```

### Nuovo testo

```text
Attraverso Rosa, Localis accompagna l’ascoltatore nel sottosuolo di Bari, tra cripte, pietra e stratificazioni della città antica.
```

### Mantenere

```text
Rosa "la Perpetua"
Ritratto narrativo. Costruito su ricerca e fonti Localis.
```

Questo testo è già presente correttamente nella pagina singola `/guide/bari-sotterranea/`: usare lo stesso contenuto come sorgente unica.

---

## 3.2 Valutare l’H1 della pagina Bari come correzione di coerenza, non di marketing

### Testo attuale

```text
Bari raccontata da chi la vive.
```

Con una voce narrativa tra le sei guide, la frase può suggerire che tutte le guide siano raccontate da persone reali.

### Sostituzione consigliata

```text
Bari raccontata da dentro.
```

Questa modifica mantiene il valore del messaggio ma non promette che ogni voce appartenga a una persona reale.

Se Domenico e Luigi desiderano tenere l’H1 attuale, registrare la scelta nel report finale; le correzioni ai testi sottostanti e a Rosa restano comunque obbligatorie.

---

# 4. PRIORITÀ ALTA — Pagina Bari in inglese e tedesco

Le pagine straniere non sono allineate alla correzione già applicata in italiano.

## 4.1 Inglese `/en/bari/`

### H1 attuale da eliminare

```text
Bari told by people born there.
```

### Nuovo H1 consigliato

```text
Bari, told from within.
```

---

### Intro attuale da eliminare

```text
Six live guides, six Bari voices. From the Old Town to the port, from the theatres to the underground city: every route is signed by someone who lived those places as a child.
```

### Nuovo intro

```text
Six audio stories across the old town, the port, the theatres and the underground city: five told by real local authors, one created as a clearly declared narrative portrait.
```

---

### Paragrafo sotto “The stories of the centre” da sostituire

### Attuale

```text
Six Bari voices. From the stone old town to the port, from the theatres to the underground city: every route is signed by someone who lived those places as a child. Tap a tile to listen.
```

### Nuovo

```text
Six stories across stone streets, the port, theatres and the underground city: five told by real authors, one created as a declared narrative portrait. Tap a tile to listen.
```

---

### Titolo sezione autori attuale da eliminare

```text
Six authors from Bari. Six voices, six guides, one Bari.
```

### Nuovo titolo

```text
Five real authors, one narrative portrait. Six guides, one Bari.
```

---

### Paragrafo sezione autori attuale da sostituire

```text
Not licensed guides, not Wikipedia copy-paste. Authors who lived those alleys, ate in those bakeries, watched those markets change. Each guide is signed: name, face, story.
```

### Nuovo testo

```text
The Bari guides combine lived experience and Localis research. When a real person speaks, we say so. When a story uses a narrative portrait, we declare it with the same clarity.
```

---

### Rosa: bio attuale da eliminare

```text
Fifty years of service in the Basilica of San Nicola — cleaning, tidying, listening. Now retired, but she can still recall every stone of the crypt by heart. One wipe at a time.
```

### Nuova bio Rosa

```text
Through Rosa, Localis leads the listener beneath Bari, among crypts, stone and the layered remains of the ancient city.
```

---

## 4.2 Tedesco `/de/bari/`

### H1 attuale da eliminare

```text
Bari erzählt von denen, die dort geboren wurden.
```

### Nuovo H1

```text
Bari, von innen erzählt.
```

---

### Intro attuale da eliminare

```text
Sechs Audioerzählungen, sechs Stimmen aus Bari. Von der Altstadt bis zum Hafen, von den Theatern bis unter die Stadt — jede stammt von jemandem, der dort aufgewachsen ist.
```

### Nuovo intro

```text
Sechs Audioerzählungen über Altstadt, Hafen, Theater und die unterirdische Stadt: fünf werden von realen Autoren erzählt, eine ist als narratives Porträt klar gekennzeichnet.
```

---

### Paragrafo sotto “Geschichten aus dem Zentrum” da sostituire

```text
Sechs Stimmen aus Bari. Von der steinernen Altstadt bis zum Hafen, von den Theatern bis in den Untergrund: Jede Audioerzählung stammt von jemandem, der diese Orte seit der Kindheit kennt. Tippe auf eine Karte, um mehr zu erfahren.
```

### Nuovo testo

```text
Sechs Erzählungen über steinerne Gassen, Hafen, Theater und die unterirdische Stadt: fünf stammen von realen Autoren, eine ist ein ausdrücklich gekennzeichnetes narratives Porträt. Tippe auf eine Karte, um mehr zu erfahren.
```

---

### Titolo sezione autori da sostituire

```text
Sechs Autoren aus Bari. Sechs Stimmen, sechs Guides, ein Bari.
```

### Nuovo titolo

```text
Fünf reale Autoren, ein narratives Porträt. Sechs Guides, ein Bari.
```

---

### Paragrafo sezione autori da sostituire con

```text
Die Bari-Guides verbinden gelebte Erfahrung mit der Recherche von Localis. Wenn eine reale Person spricht, kennzeichnen wir sie als solche. Wenn eine Erzählung ein narratives Porträt nutzt, machen wir dies ebenso klar kenntlich.
```

---

### Bio Rosa da sostituire con

```text
Durch Rosa führt Localis die Zuhörenden in den Untergrund von Bari: zu Krypten, Stein und den historischen Schichten der alten Stadt.
```

---

### Bug di localizzazione tedesca

Nella pagina tedesca le bio di Domenico, Filippo, Nonno Nicola, Rachele e Luigi appaiono ancora in inglese.

**Azione obbligatoria:**

- tradurre o collegare correttamente le bio tedesche;
- verificare che nessun testo inglese resti nella pagina DE;
- correggere anche eventuali etichette miste, ad esempio `Voice of this guide`, se presenti nelle pagine singole tedesche.

---

# 5. PRIORITÀ ALTA — Pagina `/about/`

La pagina italiana è migliorata nella spiegazione generale, ma conserva la biografia errata di Domenico come narratore.

## 5.1 Pagina italiana `/about/?lang=it`

### Testo attuale da eliminare

```text
Barese, cresciuto nel borgo antico. Porta nella guida i dettagli che di solito non arrivano nelle brochure turistiche.
```

### Nuovo testo

```text
Barese, cresciuto nel quartiere Libertà, a pochi passi dal borgo antico. Nella guida di Bari Vecchia racconta il luogo da cui la città è cominciata, attraverso ricerca, pietre e memoria urbana.
```

### Ruolo consigliato

Sostituire, se presente:

```text
Narratore locale
```

con:

```text
Autore e voce di Bari Vecchia
```

Il nuovo ruolo è più preciso e non suggerisce che Domenico sia residente nel borgo antico.

---

## 5.2 Correzione refusi visibili nella pagina italiana

Correggere:

```text
Localis e una redazione, non un generatore.
```

in:

```text
Localis è una redazione, non un generatore.
```

Correggere:

```text
Le audioguide nascono cosi.
```

in:

```text
Le audioguide nascono così.
```

Correggere:

```text
ricerca d archivio
```

in:

```text
ricerca d’archivio
```

---

## 5.3 Localizzazioni EN/DE

Verificare le pagine `/en/about/` e `/de/about/`, se presenti, per:

- vecchia bio di Domenico;
- presentazione di Concetta come persona reale;
- claim che estendono l’autenticità personale a tutte le guide;
- testi non tradotti o mescolati tra lingue.

Applicare lo stesso significato della versione italiana corretta.

---

# 6. PRIORITÀ ALTA — Catalogo generale `/guide/`: sincronizzare dati e rimuovere residui

L’introduzione del catalogo è già corretta.  
Il problema è che nella lista iniziale e nelle card dettagliate convivono durate e teaser differenti.

## 6.1 Durate incoerenti attualmente visibili

La pagina `/guide/` presenta due blocchi per le stesse guide: elenco rapido e selettore/card. Le durate non coincidono.

### Bari

| Guida | Elenco rapido attuale | Card dettagliata attuale | Azione |
|---|---:|---:|---|
| Bari Vecchia | 21 min | 31 min | Usare la durata reale del file audio; la pagina singola dichiara 31 min |
| San Nicola | 30 min | 30 min | Nessun problema apparente |
| Il Meglio di Bari | 29 min | 29 min | Nessun problema apparente |
| Porto di Bari | 33 min | 33 min | Nessun problema apparente |
| I Tre Teatri | 28 min | 28 min, ma descrizione dice “Diciannove minuti” | Correggere descrizione o durata sulla base dell’audio reale |
| Bari Sotterranea | 25 min | 26 min | Usare la durata reale; pagina singola dichiara 26 min |

### Valle d’Itria

| Guida | Elenco rapido attuale | Card dettagliata attuale | Azione |
|---|---:|---:|---|
| Alberobello | 35 min | 23 min | Verificare audio reale e sincronizzare |
| Locorotondo | 31 min | 31 min | Nessun problema apparente |
| Martina Franca | 30 min | 30 min | Nessun problema apparente |
| Cisternino | 33 min | 31 min | Verificare audio reale e sincronizzare |
| Ostuni | 33 min | 36 min | Verificare audio reale e sincronizzare |
| Fasano / Selva | 33 min | 38 min | Verificare audio reale e sincronizzare |

### Gargano

| Guida | Elenco rapido attuale | Card dettagliata attuale | Azione |
|---|---:|---:|---|
| Vieste | 33 min | 25 min | Verificare audio reale e sincronizzare |
| Gargano del Silenzio | 33 min | 24 min | Verificare audio reale e sincronizzare |
| Sacro Monte | 33 min | 24 min | Verificare audio reale e sincronizzare |
| Tremiti | 33 min | 23 min | Verificare audio reale e sincronizzare |
| Paesi del Gargano | 33 min | 24 min | Verificare audio reale e sincronizzare |
| Saline | 33 min | 23 min | Verificare audio reale e sincronizzare |

## 6.2 Azione tecnica richiesta per le durate

Non correggere manualmente valori sparsi senza capire il modello dati.

Claude Code deve:

1. individuare da dove vengono generate le durate dell’elenco rapido, delle card, delle pagine singole e dei pack;
2. individuare la durata vera dai file audio/metadati effettivamente disponibili nel repository o nel sistema;
3. stabilire una **single source of truth** per la durata;
4. far derivare tutti i componenti da quella sorgente;
5. aggiornare anche il calcolo delle ore complessive dei pack, se necessario.

---

## 6.3 Teaser ancora non corretti nell’elenco rapido

Nell’elenco rapido del catalogo sono ancora visibili frasi che implicano biografie narrative non dichiarate.

### Ostuni

**Attuale:**

```text
Quarant’anni di servizio e i segreti di una città che fa perdere la testa.
```

**Nuovo:**

```text
Vicoli bianchi, estati affollate e inverni silenziosi.
```

### Fasano / Selva di Fasano

**Attuale:**

```text
Vent’anni di voli sulla Valle d’Itria e una prospettiva che non trovi sui libri.
```

**Nuovo:**

```text
La Valle d’Itria vista dall’alto, tra trulli, masserie e colline.
```

### Il Gargano del Silenzio

**Attuale:**

```text
Dal trabucco di famiglia si vede tutto.
```

**Nuovo:**

```text
Trabucchi, costa e borghi del Gargano settentrionale.
```

## 6.4 Controllo richiesto su tutti i teaser

Cercare nel repository e nelle lingue straniere eventuali residui di:

```text
discendente
Caracciolo
Lucio Dalla
terza generazione
quarta generazione
quarant’anni di servizio
vent’anni di voli
trabucco di famiglia
ex vigile urbano
frate francescano
guardiaparco da trent’anni
trent’anni alle saline
```

Se compaiono in trascrizioni audio, inserirli nel report editoriale e non riscriverli automaticamente.  
Se compaiono in card, bio o copy commerciale pubblico, correggerli.

---

# 7. PRIORITÀ ALTA — Sincronizzare disponibilità linguistiche

Esiste un’incoerenza pubblica:

- homepage: dichiara `Italiano, inglese, tedesco · scritti separatamente, mai tradotti`;
- pagina Bari, box guida singola: dichiara `Italiano e inglese`;
- pagine singole italiane: mostrano `IT/EN/DE`, ma nel box acquisto compare `Italiano, inglese e tedesco dove disponibile`;
- pagina inglese Bari Vecchia: mostra `IT/EN`, non DE;
- pagina tedesca Bari Vecchia: esiste, quindi la disponibilità DE sembra effettiva per quella guida.

## Azione richiesta

Claude Code non deve scegliere una frase generica. Deve fare un inventario reale:

| Guida | Audio IT esistente | Audio EN esistente | Audio DE esistente | Etichetta pubblica corretta |
|---|---|---|---|---|

Dopo l’inventario:

1. ogni pagina singola deve mostrare solo le lingue realmente disponibili per quella guida;
2. le card del catalogo, se mostrano le lingue, devono derivarle dalla stessa sorgente;
3. i pack devono dichiarare chiaramente se tutte le guide incluse sono disponibili nelle stesse lingue oppure no;
4. la homepage deve evitare una promessa universale sulle tre lingue se non valida per tutte le 18 guide.

### Formula prudente per la homepage, se la copertura non è universale

```text
Guide disponibili in italiano, inglese e tedesco secondo la destinazione.
```

Oppure, se tutte le 18 guide esistono davvero nelle tre lingue, mantenere la promessa attuale e correggere tutti i box che mostrano informazioni incomplete.

---

# 8. PRIORITÀ MEDIA — Homepage: una sola correzione di coerenza

La homepage è già stata aggiornata nella parte principale e non deve essere rifatta in questa fase.

Rimane questa frase:

```text
Non un catalogo turistico. Una collezione di voci: ogni destinazione ha i suoi autori, le sue storie, il suo suono.
```

Dato che non tutte le destinazioni hanno autori reali, sostituire con:

```text
Non un catalogo turistico. Una collezione di racconti: ogni destinazione ha le sue storie, le sue fonti, il suo suono.
```

Applicare lo stesso significato nelle versioni EN/DE, se la stringa è localizzata.

---

# 9. Audit editoriale dei contenuti audio: non modificare senza approvazione

Le pagine pubbliche possono essere corrette subito.  
Gli audio richiedono invece una valutazione editoriale umana.

## 9.1 Audioguide da controllare

Verificare nei copioni o nelle trascrizioni disponibili:

- Alberobello / Concetta;
- Bari Sotterranea / Rosa;
- Martina Franca / La voce del ducato;
- Ostuni / Salvatore;
- Fasano / Andrea;
- Tremiti / Tonino;
- eventuali altre voci composite di Gargano e Valle d’Itria.

## 9.2 Cosa cercare

Segnalare passaggi in cui una voce narrativa afferma come propri:

- nascita, età o residenza specifica;
- parentela con famiglie storiche;
- anni di lavoro in un luogo reale;
- conoscenze personali con personaggi famosi;
- professioni o imprese presentate come reali;
- testimonianze in prima persona che potrebbero sembrare interviste realmente raccolte.

## 9.3 Output richiesto

Creare o aggiornare:

```text
docs/editorial-audit/narrative-voices-audio-review.md
```

Struttura:

| Guida | Voce | Passaggio individuato | Tipo di rischio | Intervento da valutare con Domenico e Luigi |
|---|---|---|---|---|

Non modificare e non rigenerare audio in questa fase.

---

# 10. Controllo localizzazioni completo

Oltre alle correzioni puntuali su Bari e Bari Vecchia, eseguire uno scan completo del progetto in:

- italiano;
- inglese;
- tedesco.

## Stringhe da cercare in tutte le lingue

### Italiano

```text
cresciuto tra i vicoli del borgo antico
cresciuto nel borgo antico
ogni itinerario è firmato da chi quei posti li ha vissuti da bambino
Cinquant’anni di servizio nella Basilica
Quarant’anni di servizio
Vent’anni di voli
trabucco di famiglia
discendente diretto
Caracciolo
Tonino ci portava Lucio Dalla
```

### Inglese — concetti equivalenti

```text
born and raised in the old city
told by people born there
every route is signed by someone who lived those places as a child
six authors from Bari
fifty years of service in the Basilica
descendant
Lucio Dalla
third generation
forty years of service
twenty years of flights
family trabucco
```

### Tedesco — concetti equivalenti

```text
aufgewachsen in der Altstadt
von denen, die dort geboren wurden
jede stammt von jemandem, der dort aufgewachsen ist
sechs Autoren aus Bari
fünfzig Jahre Dienst in der Basilika
Nachkomme
Lucio Dalla
dritte Generation
vierzig Jahre Dienst
zwanzig Jahre Flüge
Familientrabucchi
```

## Verifica lingua tedesca

La pagina Bari tedesca contiene testi biografici in inglese. Cercare stringhe inglesi all’interno delle route `/de/` e correggere la localizzazione.

---

# 11. Cosa non modificare in questa fase

Mettere nel backlog, ma non implementare ora:

- nuova hero generale e claim marketing;
- durata dell’anteprima gratuita;
- locandine e materiali InfoPoint;
- QR code dedicati e tracciamento partner;
- prezzo e struttura dei bundle, salvo calcoli incoerenti dovuti a dati errati;
- redesign visuale;
- nuove guide;
- strategia SEO generale;
- riscrittura narrativa delle guide audio.

---

# 12. Controlli finali obbligatori

## 12.1 Route minime da verificare dopo il deploy

### Italiano

```text
/
/bari/
/guide/
/guide/bari-vecchia/
/guide/bari-sotterranea/
/about/?lang=it
/fonti/
/metodo/
```

### Inglese

```text
/en/bari/?lang=en
/en/guide/bari-vecchia/?lang=en
/en/guide/bari-sotterranea/?lang=en
/en/about/?lang=en
```

### Tedesco

```text
/de/bari/?lang=de
/de/guide/bari-vecchia/?lang=de
/de/guide/bari-sotterranea/?lang=de
/de/about/?lang=de
```

Verificare inoltre le pagine singole e di zona di Valle d’Itria e Gargano in EN/DE se presenti.

---

## 12.2 Criteri di accettazione

La Fase 1B è conclusa solo quando:

- la bio falsa di Domenico è rimossa dalla pagina singola Bari Vecchia in IT/EN/DE e dalla pagina Chi siamo;
- Rosa non viene più presentata nella pagina Bari come ex collaboratrice reale della Basilica;
- la pagina Bari italiana non dichiara più che tutti e sei i racconti sono firmati da chi quei luoghi li ha vissuti da bambino;
- le pagine Bari inglese e tedesca distinguono cinque autori reali e un ritratto narrativo;
- la pagina tedesca non contiene più bio in inglese;
- il catalogo `/guide/` non contiene teaser biografici residui per voci narrative;
- durate, numero guide e pack attingono a dati coerenti e non mostrano valori contraddittori;
- le lingue disponibili sono indicate in base agli audio effettivamente esistenti;
- homepage, Metodo e Fonti non regrediscono rispetto alle correzioni già applicate;
- eventuali passaggi rischiosi presenti negli audio sono registrati nel report editoriale, senza riscritture automatiche.

---

# 13. Deliverable richiesti a Claude Code

Alla consegna produrre:

1. elenco dei file modificati;
2. diff sintetico pagina per pagina;
3. conferma delle stringhe obsolete rimosse dalle pagine pubbliche;
4. tabella finale con durata e lingue effettive per ciascuna delle 18 guide;
5. elenco dei problemi trovati ma non modificati negli audio;
6. report delle route verificate dopo build/deploy;
7. eventuale backlog separato per la futura fase marketing.

---

# Nota finale

Localis ha già compiuto la parte più difficile: ha dichiarato l’esistenza delle voci narrative e ha iniziato a distinguere il racconto dalla testimonianza reale.

Questa seconda passata non serve a cambiare il progetto.

Serve a fare in modo che ogni pagina dica la stessa verità.

> **Una voce reale resta reale. Un ritratto narrativo resta dichiarato. Il visitatore può fidarsi di entrambi, perché Localis non li confonde.**
