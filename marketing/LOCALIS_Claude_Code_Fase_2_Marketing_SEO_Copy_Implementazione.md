# LOCALIS — Brief operativo per Claude Code
## Fase 2: Marketing, SEO, Conversione e Landing InfoPoint Bari

**Committenti:** Domenico e Luigi Loconsole  
**Documento strategico approvato:** `LOCALIS_Strategia_Marketing_SEO_Copy_Fase_2_Da_Approvare.md`  
**Data:** 3 giugno 2026  
**Scopo:** tradurre la strategia marketing/SEO/copy approvata in modifiche concrete al sito, ordinate, misurabili e reversibili.

---

# 0. Istruzione generale

La strategia è approvata. Procedi all’implementazione seguendo l’ordine di questo documento.

Non fare una riscrittura autonoma del sito.  
Non aggiungere slogan non approvati.  
Non reintrodurre promesse assolute su autenticità, lingue, offline, tempi di visita o rientro in nave.  
Non cambiare prezzi, pack o logica di pagamento, salvo testi, metadata e tracciamenti qui richiesti.

## Principio guida

> **Vedere è facile. Capire è un’altra cosa.**

Localis deve risultare:

- chiara come prodotto: racconti audio / audioguide narrative acquistabili dal telefono;
- diversa come contenuto: non indica soltanto luoghi, ne spiega il significato;
- credibile: fonti, natura delle voci e funzionamento offline dichiarati correttamente;
- semplice da provare: anteprima gratuita visibile;
- misurabile: QR, preview, checkout e acquisti tracciabili.

---

# 1. Gate obbligatori prima del deploy marketing

Prima di pubblicare le modifiche di questa fase, verifica che le attività precedenti siano concluse oppure segnala nel report ciò che resta aperto.

## 1.1 Trasparenza editoriale

Verificare, in IT/EN/DE dove presenti:

- bio corretta di Domenico in `/guide/bari-vecchia/` e `/about/`;
- bio corretta di Rosa nella pagina generale Bari;
- pagine Bari EN/DE allineate: cinque autori reali e un ritratto narrativo;
- rimozione dalle card pubbliche di biografie inventate e affermazioni non dimostrabili;
- nessun testo tedesco lasciato in inglese nelle pagine prioritarie.

Se non sono risolti, implementarli in un commit immediatamente precedente alla Fase 2.

## 1.2 Verità funzionale del prodotto

Verificare che:

- Play non avvii download audio completi in background;
- l’utente possa salvare esplicitamente una guida acquistata offline;
- i testi pubblici non dicano più “Offline dopo il primo play”;
- la FAQ spieghi correttamente il salvataggio offline;
- le durate mostrate derivino da una sorgente dati coerente;
- le lingue mostrate per ogni guida corrispondano agli audio realmente disponibili.

## 1.3 Test offline iPhone ancora necessario

L’implementazione Service Worker v3 risolve tecnicamente la riapertura della pagina offline, ma il test reale su Safari iPhone deve essere eseguito da Domenico.

Fino a conferma del test fisico, usare soltanto formule prudenti:

```text
Ascolta in streaming oppure salva la guida per ascoltarla offline durante la visita.
```

Non usare:

```text
Sempre disponibile offline
Funziona offline garantito
Scarica una volta e ascolta per sempre
```

---

# 2. Ordine di esecuzione e commit richiesti

Implementare in commit separati:

## Commit A — Audit dati e preparazione
- inventario lingue e durate reali;
- audit prezzi e pack mostrati;
- verifica route, localizzazioni, analytics e componenti;
- report pre-implementazione.

## Commit B — Analytics e QR attribution
- eventi preview/ecommerce/offline;
- supporto parametri UTM/source interno;
- controllo privacy/consenso già in uso.

## Commit C — Landing InfoPoint Bari
- nuova landing dedicata;
- anteprima in primo piano;
- catalogo delle 6 guide Bari;
- tracking dedicato;
- IT/EN/DE secondo disponibilità reale.

## Commit D — Homepage e pagina Bari
- nuova gerarchia homepage;
- anteprima dominante;
- copy Bari aggiornato;
- nessuna regressione sulla trasparenza delle voci.

## Commit E — Template e pagine prodotto Bari
- pulizia copy artificiale/aggressivo;
- player anteprima;
- dati pratici coerenti;
- fonti e structured data;
- IT/EN/DE prioritari.

## Commit F — Crocieristi e Partner
- copy crocieristi prudente e verificabile;
- distinzione partner commerciali / partner informativi;
- pagine IT/EN/DE.

## Commit G — SEO tecnica
- title/meta;
- canonical/hreflang/sitemap;
- Product, BreadcrumbList, Organization schema;
- build e report finale.

Non ampliare ora Valle d’Itria e Gargano, salvo correzioni tecniche condivise dal template o regression fix.

---

# 3. Commit A — Audit dati prima delle modifiche

## 3.1 Individuare l’architettura reale

Prima di modificare, individua:

- framework e routing;
- componenti hero/homepage;
- componenti card guida e player preview;
- data source delle guide;
- data source di prezzi e pack;
- data source delle lingue;
- data source delle durate;
- layout e gestione SEO;
- sistema analytics esistente;
- sistema partner/attribution esistente;
- pagine IT/EN/DE e funzionamento di `?lang=` rispetto alle route localizzate.

## 3.2 Inventario guide Bari obbligatorio

Produci una tabella basata sugli audio e sui dati reali:

| Slug | Titolo IT | Durata reale | Prezzo singolo | Audio IT | Audio EN | Audio DE | Preview IT | Preview EN | Preview DE |
|---|---|---:|---:|---|---|---|---|---|---|
| bari-vecchia | Bari Vecchia — Dentro la Città |  |  |  |  |  |  |  |  |
| san-nicola | San Nicola — Il Santo Rubato |  |  |  |  |  |  |  |  |
| il-meglio-di-bari | Il Meglio di Bari — Mangia Prima di Capire |  |  |  |  |  |  |  |  |
| porto-di-bari | Porto di Bari — Dove è Successo Tutto |  |  |  |  |  |  |  |  |
| i-tre-teatri | I Tre Teatri — Fuoco, Musica e Borghesia |  |  |  |  |  |  |  |  |
| bari-sotterranea | Bari Sotterranea — Quello che sta sotto |  |  |  |  |  |  |  |  |

## 3.3 Single source of truth

Se durate, lingue o prezzi sono duplicati in più componenti, centralizzarli o fare in modo che ogni pagina derivi dallo stesso record dati.

Campi minimi suggeriti, solo se non esiste già struttura equivalente:

```ts
type GuideLanguage = "it" | "en" | "de";

interface GuideProduct {
  slug: string;
  zone: "bari" | "valle-d-itria" | "gargano";
  title: Record<GuideLanguage, string | undefined>;
  shortHook: Record<GuideLanguage, string | undefined>;
  durationMinutes: number;
  availableLanguages: GuideLanguage[];
  previewLanguages: GuideLanguage[];
  price: number;
  bundleIds?: string[];
  voiceType: "real_person" | "narrative_portrait" | "documented_narration";
}
```

## 3.4 Deliverable audit

Creare:

```text
docs/marketing-phase-2/pre-implementation-audit.md
```

Con:

- route e componenti individuati;
- lingue e durate reali Bari;
- prezzi e pack esistenti;
- incoerenze trovate;
- analytics già presenti;
- file previsti per ciascun commit.

---

# 4. Commit B — Tracciamento analytics e attribuzione QR

## 4.1 Obiettivo

Prima di distribuire cartoline all’InfoPoint, misurare il funnel:

```text
QR → Landing → Play anteprima → Checkout → Acquisto → Salvataggio offline
```

## 4.2 Parametri QR InfoPoint

Supportare la campagna:

```text
utm_source=infopoint_bari
utm_medium=qr
utm_campaign=bari_on_site_launch
utm_content=cartolina_a6_porto
```

Conservare l’attribuzione almeno per la sessione e, se coerente con il sistema privacy/cookie già adottato, fino all’acquisto.

Non modificare autonomamente la cookie policy: segnalare se l’implementazione richiede consenso o aggiornamenti documentali.

## 4.3 Eventi richiesti

| Evento | Quando scatta | Parametri minimi |
|---|---|---|
| `landing_view` | caricamento landing strategica | `page`, `language`, `source`, `campaign` |
| `qr_landing_view` | landing con `utm_medium=qr` | `partner_id`, `placement`, `campaign`, `language` |
| `preview_start` | play trailer/anteprima | `guide_slug`, `language`, `source`, `page` |
| `preview_10s` | ascolto raggiunge 10 secondi | `guide_slug`, `language`, `source` |
| `preview_complete` | anteprima finisce | `guide_slug`, `language`, `source` |
| `view_item` | pagina guida o pack | parametri GA4 ecommerce |
| `select_item` | click su guida da lista/landing | parametri GA4 ecommerce + `list_name` |
| `begin_checkout` | avvio checkout | parametri GA4 ecommerce + source |
| `purchase` | pagamento concluso | `transaction_id`, `value`, `currency`, `items`, source |
| `offline_save_start` | avvio download offline | `guide_slug`, `language`, `size_mb` |
| `offline_save_complete` | download completato | `guide_slug`, `language`, `size_mb` |
| `partner_lead` | invio richiesta partner | `partner_type`, `page` |

## 4.4 Vincoli analytics

- evitare duplicazione eventi su re-render o cambio lingua;
- non registrare `preview_10s` più volte per lo stesso ascolto/sessione;
- ogni pagamento deve produrre una sola transazione;
- non inviare dati personali negli eventi;
- mantenere la source del QR fino all’evento `purchase`, se tecnicamente possibile.

## 4.5 Deliverable analytics

Creare:

```text
docs/marketing-phase-2/analytics-implementation.md
```

Con:

- strumento usato, ad esempio GA4;
- eventi implementati;
- parametri;
- verifica in debug;
- lettura dei risultati InfoPoint.

---

# 5. Commit C — Nuova landing InfoPoint Bari

## 5.1 Route

Creare una landing dedicata al materiale fisico InfoPoint.

Preferenza:

```text
/p/infopoint-bari/
```

Versioni linguistiche, se supportate dalla struttura del sito:

```text
/en/p/infopoint-bari/
/de/p/infopoint-bari/
```

Se la struttura partner esistente richiede formato diverso, usa la route coerente e documenta la scelta.

La landing deve accettare e mantenere i parametri UTM del QR.

## 5.2 Obiettivo

L’utente è già a Bari o sta ricevendo materiale all’InfoPoint. Non deve leggere tutto il manifesto generale di Localis. Deve:

1. capire in pochi secondi cosa può ascoltare;
2. premere Play;
3. scegliere una guida o il pack Bari.

## 5.3 Hero IT

### Soprattitolo

```text
6 RACCONTI AUDIO DI BARI
```

### H1

```text
Bari è davanti a te.
Capirla è un’altra cosa.
```

### Sottotitolo

```text
Bari Vecchia, San Nicola, il porto, il cibo, i teatri e la città sotterranea: sei racconti audio da ascoltare mentre cammini. Nessuna app.
```

### CTA primaria

```text
Ascolta 1 minuto gratis
```

### Riga pratica

Formula prudente, valida prima dell’audit completo lingue:

```text
Lingue indicate in ogni racconto · Ascolta in streaming oppure salva offline dopo l’acquisto
```

## 5.4 Hero EN

```text
Eyebrow: 6 AUDIO STORIES OF BARI
H1: Bari is in front of you. Understanding it is another story.
Subtitle: The Old Town, Saint Nicholas, the port, food, theatres and underground Bari: six audio stories to listen to as you walk. No app required.
CTA: Listen to a free 1-minute preview
Practical line: Languages shown for each story · Stream now or save offline after purchase
```

## 5.5 Hero DE

```text
Eyebrow: 6 AUDIOERZÄHLUNGEN ÜBER BARI
H1: Bari liegt vor dir. Es zu verstehen ist etwas anderes.
Subtitle: Altstadt, San Nicola, Hafen, Essen, Theater und die unterirdische Stadt: sechs Audioerzählungen für deinen Spaziergang durch Bari. Keine App erforderlich.
CTA: 1 Minute kostenlos anhören
Practical line: Sprachen bei jeder Erzählung angegeben · Direkt streamen oder nach dem Kauf offline speichern
```

## 5.6 Player anteprima

Subito sotto o all’interno dell’hero inserire il player vero di un’anteprima Bari.

Scelta raccomandata: **Bari Vecchia — Dentro la Città**, se la nuova anteprima di Domenico è pronta e pubblicabile.

Titolo IT:

```text
Ascolta Bari Vecchia — 1 minuto gratuito
```

Frase di apertura attesa nell’audio:

```text
Oggi la chiamiamo Bari Vecchia. Per secoli, invece, questa era tutta Bari.
```

Se l’audio non è ancora pronto, non simulare il player: utilizza temporaneamente l’anteprima migliore realmente disponibile e dichiaralo nel report.

## 5.7 Sei guide Bari: card compatte

Mostrare titolo, hook, durata reale, lingue reali, prezzo singolo e CTA.

### Copy IT approvato

**Bari Vecchia — Dentro la Città**  
```text
Oggi la chiamiamo città vecchia. Per secoli era tutta Bari.
```

**San Nicola — Il Santo Rubato**  
```text
Il viaggio che trasformò Bari in una meta del mondo cristiano.
```

**Il Meglio di Bari — Mangia Prima di Capire**  
```text
Focaccia, polpo, orecchiette e caffè: il cibo come modo di stare insieme.
```

**Porto di Bari — Dove è Successo Tutto**  
```text
Il mare come strada, confine e destino della città.
```

**I Tre Teatri — Fuoco, Musica e Borghesia**  
```text
Quando Bari volle diventare una città europea.
```

**Bari Sotterranea — Quello che sta sotto**  
```text
Cripte, cisterne e pietra: la città che continua sotto i tuoi passi.
```

Le versioni EN/DE devono essere tradotte con tono naturale e incluse nel diff per approvazione.

## 5.8 Prezzi e CTA

Mostrare soltanto valori derivati dai dati reali. Se confermati:

```text
Una guida €4,99
Tutte le sei guide di Bari €19,99
```

CTA:

```text
Scegli una guida
Ascolta l’anteprima
Acquista tutte le guide di Bari
```

Non forzare il pack: un turista dell’InfoPoint può desiderare soltanto la guida del luogo che sta per visitare.

## 5.9 Prove di fiducia minime

Inserire in modo compatto:

```text
Racconti costruiti attraverso ricerca e fonti Localis.
Autori reali e ritratti narrativi sono dichiarati in ogni guida.
```

Link:

```text
Scopri il metodo
Consulta le fonti
```

---

# 6. Commit D — Homepage generale

## 6.1 Hero IT

```text
Eyebrow: AUDIOGUIDE NARRATIVE DELLA PUGLIA
H1: Vedere è facile. Capire è un’altra cosa.
Subtitle: Racconti audio documentati per ascoltare Bari, la Valle d’Itria e il Gargano sul posto o prima di partire. Nessuna app: scegli una guida, ascolta l’anteprima gratuita e porta con te ciò che il luogo significa davvero.
CTA primaria: Ascolta 1 minuto gratis
CTA secondaria: Scopri le guide
Microprove: Da €4,99 · Link immediato · Lingue indicate in ogni guida · Salvataggio offline dopo il download
```

## 6.2 Hero EN

```text
Eyebrow: NARRATIVE AUDIO GUIDES TO PUGLIA
H1: Seeing is easy. Understanding is another story.
Subtitle: Documented audio stories for experiencing Bari, the Itria Valley and Gargano on site or before you travel. No app required: choose a story, listen to the free preview and take away what the place truly means.
CTA primary: Listen to a free 1-minute preview
CTA secondary: Explore the stories
```

## 6.3 Hero DE

```text
Eyebrow: NARRATIVE AUDIOGUIDES FÜR APULIEN
H1: Sehen ist einfach. Verstehen ist etwas anderes.
Subtitle: Dokumentierte Audioerzählungen über Bari, das Itria-Tal und den Gargano — vor Ort oder schon vor der Reise. Keine App erforderlich: Wähle eine Erzählung, höre die kostenlose Vorschau und entdecke, was dieser Ort wirklich bedeutet.
CTA primary: 1 Minute kostenlos anhören
CTA secondary: Erzählungen entdecken
```

## 6.4 Sezione valore IT

```text
Titolo: Non ti diciamo soltanto cosa stai guardando. Ti raccontiamo perché conta.

Testo: Una basilica può essere una bella fotografia. Un trullo può sembrare una casa da fiaba. Un porto può essere soltanto un lungomare. Localis parte da ciò che hai davanti e lo collega alla storia, alle persone e alle trasformazioni che lo hanno reso ciò che è oggi.

Bari Vecchia — Per secoli questa era tutta Bari.
San Nicola — Il santo arrivato dal mare che cambiò la città.
Alberobello — Le case che oggi fotografiamo furono a lungo freddo, fatica e vita quotidiana.
```

Adattare EN/DE con tono naturale.

## 6.5 Sezione anteprima homepage

```text
Titolo: La differenza non si spiega. Si ascolta.
Testo: Ascolta gratuitamente un minuto di un racconto Localis.
```

Inserire player reale, inizialmente con una sola guida predefinita, preferibilmente Bari Vecchia o San Nicola. Non disperdere l’azione con troppi player simultanei.

## 6.6 Catalogo territori

Presentare prima i territori:

```text
Bari — Sei racconti tra città vecchia, santo, porto, cibo, teatri e sottosuolo.
Valle d’Itria — Trulli, borghi bianchi, vigne e pietra: oltre la cartolina.
Gargano — Mare, foresta, isole e paesi: un promontorio di storie.
```

Mostrare quantità, prezzo pack e lingue solo se confermati dai dati reali.

## 6.7 Non mettere in hero

- CTA crocieristi allo stesso livello della CTA principale;
- spiegazioni lunghe sulle voci narrative;
- claim universali sulle tre lingue se non verificati;
- “offline dopo il primo play”.

---

# 7. Commit D — Pagina generale Bari

## 7.1 H1

Sostituire, salvo decisione contraria documentata:

```text
Bari raccontata da chi la vive.
```

con:

```text
Bari raccontata da dentro.
```

## 7.2 Intro IT

```text
Sei racconti audio per capire Bari mentre la attraversi: cinque affidati ad autori reali, uno costruito come ritratto narrativo dichiarato. Ascolta l’anteprima gratuita e scegli la storia con cui iniziare.
```

## 7.3 CTA

```text
Primaria: Ascolta 1 minuto gratis
Secondaria: Scopri le sei guide
```

## 7.4 EN

```text
H1: Bari, told from within.
Intro: Six audio stories to understand Bari as you walk through it: five told by real local authors, one created as a clearly declared narrative portrait. Listen to the free preview and choose where to begin.
```

## 7.5 DE

```text
H1: Bari, von innen erzählt.
Intro: Sechs Audioerzählungen, um Bari beim Spaziergang zu verstehen: fünf von realen Autoren erzählt, eine als narratives Porträt klar gekennzeichnet. Höre die kostenlose Vorschau und entscheide, womit du beginnen möchtest.
```

## 7.6 Vincolo trasparenza

Mantenere la distinzione già approvata:

```text
Cinque autori reali, una voce narrativa. Sei guide, una sola Bari.
```

---

# 8. Commit E — Template delle pagine prodotto Bari

## 8.1 Struttura obbligatoria

Per ciascuna guida Bari:

1. breadcrumb;
2. territorio, durata reale, lingue effettive;
3. H1;
4. introduzione unica breve;
5. anteprima gratuita / player;
6. informazioni pratiche;
7. voce della guida e sua natura;
8. capitoli;
9. percorso/punto di partenza, solo se reale;
10. acquisto singolo e pack;
11. fonti;
12. FAQ essenziali.

## 8.2 Informazioni pratiche standard

### IT

```text
Come ascoltarla
Puoi ascoltare questo racconto liberamente oppure, se indicato, partire dal punto consigliato e attraversare il luogo mentre la storia procede. Localis non è una navigazione turn-by-turn: per orientarti usa la mappa del telefono.

Accesso
Dopo l’acquisto ricevi subito il link alla guida. Puoi ascoltarla in streaming oppure salvarla per ascoltarla offline durante la visita.
```

### EN

```text
How to listen
You can listen freely, or, where indicated, begin from the suggested starting point and walk through the place as the story unfolds. Localis is not turn-by-turn navigation: use your phone map to find your way.

Access
After purchase, you receive an immediate link to your story. Stream it or save it for offline listening during your visit.
```

### DE

```text
So hörst du die Erzählung
Du kannst sie frei anhören oder, falls angegeben, am empfohlenen Startpunkt beginnen und den Ort durchqueren, während sich die Geschichte entfaltet. Localis ist keine Turn-by-Turn-Navigation: Nutze die Karte deines Telefons zur Orientierung.

Zugang
Nach dem Kauf erhältst du sofort den Link zur Erzählung. Du kannst sie streamen oder für das Offline-Hören während deines Besuchs speichern.
```

## 8.3 Copy da eliminare o riscrivere

Cercare nelle pagine prodotto e rimuovere/riscrivere:

```text
oltre le trappole turistiche
decodificare la realtà antropologica
isolarti dal caos turistico
rifiutiamo lo storytelling artificiale
esperienza immersiva
tesori nascosti
autenticità senza filtri
```

Non eliminare informazioni utili su storia, percorso o fonte: riscriverle nel tono approvato.

## 8.4 Bari Vecchia — copy prioritario IT

```text
H1: Bari Vecchia — Dentro la Città

Intro: Oggi la chiamiamo Bari Vecchia. Per secoli, invece, questa era tutta Bari. Dal Castello Svevo ai vicoli, Domenico racconta la città chiusa tra mura, mare, fede e commercio.

Voce: Domenico
Label: Persona reale. Ritratto dell’autore.
Bio: Barese, cresciuto nel quartiere Libertà, a pochi passi dal borgo antico. Fondatore di Localis, racconta Bari Vecchia attraverso la sua storia, le sue pietre e il legame profondo che questo luogo conserva con l’identità della città.
Dicitura editoriale: Racconto storico narrato da un autore barese reale, costruito attraverso ricerca e fonti Localis.
```

## 8.5 Altre guide Bari

Per San Nicola, Porto, Il Meglio di Bari, I Tre Teatri e Bari Sotterranea:

- conservare titoli esistenti salvo errori;
- rendere l’intro breve e specifica;
- mostrare la natura della voce già verificata;
- usare durata e lingue reali;
- rendere l’anteprima evidente;
- rimuovere testi autocelebrativi o promesse generiche non dimostrabili.

Produrre nel report finale il copy vecchio/nuovo delle introduzioni per approvazione di Domenico.

---

# 9. Commit F — Pagina Crocieristi

## 9.1 Hero IT

```text
H1: Poche ore a Bari. Non attraversarla distrattamente.
Sottotitolo: Due racconti audio selezionati per chi arriva dal porto: Bari Vecchia e il cibo della città, in un percorso compatto da fare a piedi con i propri tempi.
Durata totale audio: [dato reale]
Percorso a piedi: [distanza e tempo verificati]
Offline: Scarica le guide prima di iniziare e ascoltale anche senza connessione.
CTA primaria: Ascolta 1 minuto gratis
CTA acquisto: Acquista il pacchetto crociera · €7,99
```

Mostrare prezzo solo se confermato dal data source.

## 9.2 Promessa rientro

Rimuovere:

```text
Torni in nave puntuale. Garantito.
```

Sostituire con:

```text
Un percorso pensato per lasciarti margine per il ritorno al porto.
```

## 9.3 EN

```text
H1: A few hours in Bari. Don’t just pass through it.
Subtitle: Two audio stories selected for cruise visitors: Bari Old Town and the city’s food culture, in a compact walk you can enjoy at your own pace.
Offline: Download the stories before you begin and listen without a connection during your walk.
```

## 9.4 DE

```text
H1: Nur wenige Stunden in Bari. Geh nicht einfach nur hindurch.
Subtitle: Zwei Audioerzählungen für Kreuzfahrtgäste: Bari Vecchia und die Esskultur der Stadt, auf einem kompakten Spaziergang in deinem eigenen Tempo.
Offline: Speichere die Erzählungen vor Beginn des Rundgangs und höre sie unterwegs auch ohne Verbindung.
```

## 9.5 Intenti SEO crocieristi

Ottimizzare copy e metadata per:

- `cosa vedere a Bari dal porto crociere`;
- `Bari cruise port walking tour`;
- `Bari shore excursion self guided`;
- `Bari Landgang auf eigene Faust`.

Non ripetere artificialmente keyword nel testo visibile.

---

# 10. Commit F — Pagina Partner

## 10.1 Hero IT

```text
Aiuta i tuoi ospiti a capire la Puglia che stanno visitando.
Localis offre racconti audio documentati, accessibili dal telefono e semplici da condividere attraverso un QR code.
```

## 10.2 Due percorsi

### Strutture e attività private

```text
Per hotel, B&B, bar e attività turistiche
Offri un’esperienza in più ai tuoi ospiti. Ricevi materiali pronti e, dove previsto, una commissione sugli acquisti generati dal tuo QR.
CTA: Diventa partner commerciale
```

### Punti informativi e realtà culturali

```text
Per InfoPoint, associazioni e luoghi culturali
Metti a disposizione dei visitatori uno strumento audio documentato per comprendere la città durante la visita.
CTA: Contattaci per collaborare
```

## 10.3 Vincoli

- non attribuire partnership pubbliche a InfoPoint senza autorizzazione;
- non dichiarare che InfoPoint riceve commissioni;
- non inserire loghi partner senza consenso;
- non mettere il guadagno prima del valore per il visitatore.

---

# 11. Commit G — SEO metadata e tecnica

## 11.1 Title/meta IT prioritari

### Homepage

```text
Title: Localis | Audioguide narrative per capire Bari e la Puglia
Meta: Racconti audio documentati di Bari, Valle d’Itria e Gargano. Ascolta 1 minuto gratis, acquista dal telefono e salva offline per la visita.
```

### Bari

```text
Title: Audioguide di Bari | Bari Vecchia, San Nicola e Porto | Localis
Meta: Sei racconti audio per capire Bari mentre la visiti: Bari Vecchia, San Nicola, porto, cibo, teatri e sotterranei. Anteprima gratuita.
```

### Bari Vecchia

```text
Title: Audioguida Bari Vecchia — Dentro la Città | Localis
Meta: Un racconto audio di Bari Vecchia narrato da Domenico: dal Castello Svevo ai vicoli, la città da cui Bari è cominciata. Ascolta l’anteprima.
```

### San Nicola

```text
Title: Audioguida Basilica di San Nicola Bari — Il Santo Rubato | Localis
Meta: Ascolta la storia di San Nicola e dei marinai che cambiarono Bari. Racconto audio documentato, sul telefono e senza app.
```

### Crocieristi

```text
Title: Cosa vedere a Bari dal porto crociere in poche ore | Localis
Meta: Due racconti audio per scoprire Bari a piedi durante lo scalo: anteprima gratuita, nessuna app e salvataggio offline prima del percorso.
```

## 11.2 Title/meta EN prioritari

```text
Homepage Title: Localis | Narrative Audio Guides to Bari and Puglia
Homepage Meta: Documented audio stories of Bari, the Itria Valley and Gargano. Listen to a free 1-minute preview, buy on your phone and save offline for your visit.

Bari Title: Bari Audio Guides | Old Town, Saint Nicholas and Port | Localis
Bari Meta: Six audio stories to understand Bari while you walk: Old Town, Saint Nicholas, food, port, theatres and underground Bari. Free preview.

Bari Vecchia Title: Bari Old Town Audio Tour — Inside the City | Localis
Bari Vecchia Meta: Listen to the story of Bari’s old town, from the Swabian Castle to its alleys. A self-guided audio story with a free preview.

Cruise Title: Bari Cruise Port Walking Audio Tour | Localis
Cruise Meta: Only a few hours in Bari? Listen to two audio stories selected for cruise visitors exploring the old town on foot. Free preview.
```

## 11.3 Title/meta DE prioritari

```text
Homepage Title: Localis | Narrative Audioguides für Bari und Apulien
Homepage Meta: Dokumentierte Audioerzählungen über Bari, das Itria-Tal und den Gargano. Höre 1 Minute kostenlos und speichere deine Guide offline für den Besuch.

Bari Title: Bari Audioguides | Altstadt, San Nicola und Hafen | Localis
Bari Meta: Sechs Audioerzählungen, um Bari beim Spaziergang zu verstehen: Altstadt, San Nicola, Hafen, Essen, Theater und Untergrund. Hörprobe gratis.

Bari Vecchia Title: Bari Altstadt Audioguide — Im Inneren der Stadt | Localis
Bari Vecchia Meta: Höre die Geschichte von Bari Vecchia, vom Castello Svevo bis zu den Gassen. Audioerzählung mit kostenloser Vorschau.

Kreuzfahrt Title: Bari Kreuzfahrthafen Audioguide für einen Rundgang | Localis
Kreuzfahrt Meta: Nur wenige Stunden in Bari? Zwei Audioerzählungen für Kreuzfahrtgäste, die die Altstadt zu Fuß entdecken. Kostenlose Hörprobe.
```

## 11.4 Canonical e hreflang

Per ogni set di pagine equivalenti implementare canonical autoreferenziale e alternate `it`, `en`, `de`, più eventuale `x-default`.

Esempio Bari:

```text
IT: /bari/
EN: /en/bari/
DE: /de/bari/
```

Se esistono anche URL `?lang=`, evitare contenuti duplicati indicizzabili: redirezionare o canonicalizzare verso le route pulite.

## 11.5 Sitemap

Aggiornare sitemap con:

- homepage;
- territori;
- guide;
- crocieristi;
- pagine informative;
- varianti linguistiche.

**Landing InfoPoint:** se quasi duplicata della pagina Bari e destinata soprattutto al QR, usare `noindex, follow` oppure canonical verso `/bari/`, mantenendo il tracking. Documentare la decisione.

## 11.6 Structured data

### Product + Offer per guide singole

Applicare esclusivamente dati visibili e reali:

- `name`;
- `description`;
- `image`;
- `brand: Localis`;
- `offers.price`;
- `offers.priceCurrency: EUR`;
- `offers.availability`;
- `url`.

Non inserire rating o recensioni non presenti realmente in pagina.

### BreadcrumbList

Esempio:

```text
Home > Bari > Bari Vecchia — Dentro la Città
```

### Organization

Inserire una configurazione globale coerente con nome Localis, URL, logo, email pubblica e profili social ufficiali esistenti.

---

# 12. Materiale InfoPoint: preparazione QR dopo landing e tracking

Non generare la grafica definitiva dal codice. Preparare URL e copy.

## URL QR finale

```text
https://localis.guide/p/infopoint-bari/?utm_source=infopoint_bari&utm_medium=qr&utm_campaign=bari_on_site_launch&utm_content=cartolina_a6_porto
```

Aggiornare il path se la route finale è differente, mantenendo i parametri.

## Copy cartolina approvato

```text
DISCOVER BARI.
Don’t just visit it. Understand it.

6 audio stories to understand the city you are walking through.

FREE 1-MINUTE PREVIEW
Scan & listen · No app required
```

### Lingue sulla cartolina

Inserire:

```text
Italiano · English · Deutsch
```

solo dopo conferma che le sei guide Bari sono realmente disponibili in tutte e tre le lingue. In caso contrario:

```text
Available languages shown online.
```

---

# 13. QA e test prima del deploy

## 13.1 Route prioritarie

### IT

```text
/
/bari/
/p/infopoint-bari/
/guide/
/guide/bari-vecchia/
/guide/san-nicola/
/crocieristi/
/diventa-partner/
/faq/
/metodo/
/fonti/
```

### EN

```text
/en/
/en/bari/
/en/p/infopoint-bari/
/en/guide/bari-vecchia/
/en/guide/san-nicola/
/en/cruise/
/en/faq/
```

### DE

```text
/de/
/de/bari/
/de/p/infopoint-bari/
/de/guide/bari-vecchia/
/de/guide/san-nicola/
/de/kreuzfahrt/
/de/faq/
```

Adeguare alle route reali e indicare quelle non esistenti.

## 13.2 Test funzionali

- CTA preview avvia l’audio corretto;
- evento `preview_start` scatta una sola volta;
- click guida da landing registra `select_item`;
- acquisto registra `begin_checkout` e `purchase`;
- attribution QR permane fino al purchase;
- prezzi e valuta corretti;
- lingua visibile corrisponde all’audio disponibile;
- copy offline coerente;
- link Fonti/Metodo funzionanti;
- nessuna regressione sulla distinzione voce reale / ritratto narrativo.

## 13.3 Test mobile

Testare almeno:

- iPhone Safari;
- Android Chrome;
- desktop.

Verificare:

- player usabile;
- pulsanti chiari;
- H1 leggibili;
- nessun overflow EN/DE;
- immagini ottimizzate;
- salvataggio offline secondo test dedicato già definito.

---

# 14. Report finale richiesto

Alla fine dell’implementazione consegnare:

1. `docs/marketing-phase-2/pre-implementation-audit.md`;
2. `docs/marketing-phase-2/analytics-implementation.md`;
3. elenco file modificati per commit;
4. screenshot/preview delle pagine principali IT/EN/DE;
5. tabella guide Bari con durate, lingue, preview e prezzi;
6. URL esatto del QR InfoPoint;
7. conferma eventi analytics testati;
8. title/meta/canonical/hreflang/schema implementati;
9. route mancanti o non implementabili;
10. backlog non implementato:
    - social;
    - espansione Valle d’Itria/Gargano;
    - ottimizzazione bitrate dopo approvazione ascolto;
    - ulteriori landing partner;
    - progetto/questionario “Che Italia stai cercando?” escluso da questa fase.

---

# 15. Criteri di accettazione finali

La Fase 2 è conclusa soltanto se:

- la homepage comunica la differenza di Localis prima della categoria;
- l’anteprima gratuita è la CTA primaria;
- esiste una landing InfoPoint Bari tracciabile e orientata al Play;
- la pagina Bari è coerente con cinque autori reali e un ritratto narrativo;
- le pagine prodotto Bari sono pulite, concrete e prive di copy aggressivo;
- il copy offline è veritiero;
- la pagina Crocieristi non garantisce il rientro in nave;
- la pagina Partner distingue interlocutori commerciali e informativi;
- durate, prezzi e lingue sono coerenti;
- IT/EN/DE sono allineate nelle pagine prioritarie;
- gli eventi analytics leggono il funnel QR → preview → checkout → acquisto;
- SEO tecnica e metadata prioritari sono implementati senza keyword stuffing;
- nessuna modifica reintroduce ambiguità sulla natura delle voci.

---

# 16. Principio conclusivo

Non rendere Localis più rumorosa.  
Rendila più facile da capire, più facile da ascoltare e più facile da scegliere.

> **Vedere è facile. Capire è un’altra cosa.**  
> **La differenza deve sentirsi prima ancora di essere spiegata.**
