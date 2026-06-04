"""
Genera tutti i capitoli IT — Bari a Tavola (Rachele)
Voce: CiwzbDpaN3pQXjTgx3ML
Output: private/audio/guides/bari-tavola-rachele-capN-it.mp3
"""
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")

VOICE_ID = "CiwzbDpaN3pQXjTgx3ML"
OUTPUT_DIR = Path(__file__).parent.parent / "private" / "audio" / "guides"

VOICE_SETTINGS = {
    "stability": 0.35,
    "similarity_boost": 0.80,
    "style": 0.45,
    "use_speaker_boost": True,
}

CHAPTERS = {
    "bari-tavola-rachele-cap1-it.mp3": """Mi chiamo Rachele.

<break time="0.8s"/>

Per questo racconto non ti porterò a fare una lista di cose da assaggiare.

Una lista la trovi ovunque.
Focaccia. Orecchiette. Panzerotti. Sgagliozze. Polpo. Cozze. Caffè.

Il punto non è sapere i nomi.

<break time="0.5s"/>

Il punto è capire perché, a Bari, tutte queste cose sembrano uscire continuamente dalle porte.
Dal forno.
Dalla cucina.
Dal mare.
Dai vicoli.
Da una teglia portata in tavola.
Da un cartoccio passato di mano in mano.

<break time="0.6s"/>

Se guardi verso la città vecchia, il cibo è già dentro il percorso che stai per fare.
Non sta soltanto nei ristoranti.
Sta nei movimenti.
Nell'odore di un forno che ti raggiunge mentre cammini.
Nelle mani che lavorano la pasta fuori da una casa.
Nel fritto che si sente prima ancora di vederlo.
Nel mare che, in una città come questa, non resta mai soltanto panorama.

<break time="0.5s"/>

A Bari una cosa buona raramente resta sola.

Un pezzo di focaccia... si spezza.

Un panzerotto si aspetta insieme.

Un piatto di orecchiette nasce da una mano che ha ripetuto lo stesso gesto migliaia di volte.

Il pesce ricorda che la città ha sempre guardato verso l'acqua — non solo per bellezza, ma per lavoro e per fame.

E il caffè, alla fine, non chiude una degustazione elegante.
Molto spesso chiude una conversazione.
Oppure ne apre un'altra.

<break time="0.7s"/>

Questa guida parte da qui:
dal punto in cui Bari antica incontra la città che passeggia, prende un aperitivo, si ferma, passa oltre.

Davanti a te ci sono piazze restaurate, tavolini, persone che arrivano e persone che rientrano.
Dietro, nei vicoli, ci sono gesti molto più vecchi della moda del food tour.

<break time="0.5s"/>

Non significa che tutto sia rimasto uguale.
Bari è cambiata.
Il cibo è diventato immagine, richiamo turistico, occasione di lavoro, fotografia da portare via.

Ma prima di essere una fotografia, era — ed è ancora — qualcosa di più semplice.

Un modo di arrangiarsi.

Un modo di accogliere.

Un modo di non mangiare mai del tutto da soli.

<break time="0.6s"/>

Per questo il cibo di Bari non si comprende scegliendo soltanto il piatto più famoso.

Devi seguirne il percorso.

Dalla strada, verso il mare.

Dal mare, verso le case.

Dalle case, di nuovo fuori...
dove qualcuno frigge, qualcuno impasta, qualcuno aspetta che la focaccia si raffreddi appena abbastanza da poterla mangiare senza bruciarsi.

<break time="0.8s"/>

Inizia a camminare verso il mare.

Per capire il cibo di Bari, bisogna partire dal punto in cui questa città ha sempre ricevuto ciò che le serviva per vivere.""",

    "bari-tavola-rachele-cap2-it.mp3": """Qui devi fermarti.

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
A una casa barese che, per raccontare il proprio cibo, porta il tavolo quasi sull'uscio.""",

    "bari-tavola-rachele-cap3-it.mp3": """Adesso sei in uno dei luoghi che molti visitatori cercano apposta.

Qui può capitare di vedere tavoli all'esterno, semola, pasta fresca e mani veloci che danno forma alle orecchiette.

<break time="0.5s"/>

La prima cosa da ricordare è semplice:
non sei entrato in un set.

<break time="0.4s"/>

Questa strada è diventata famosa, fotografata, cercata.
Ma dietro l'immagine c'è un gesto domestico:
acqua, farina di semola, pressione del coltello, pollice o dito che rovescia la pasta e le dà la forma capace di trattenere il condimento.

<break time="0.5s"/>

L'orecchietta è piccola, ma è una forma intelligente.
Non serve spiegarla con parole grandi.
Basta guardarla:
la parte ruvida accoglie il sugo o le verdure;
la cavità raccoglie ciò che altrimenti scivolerebbe via.

<break time="0.5s"/>

Quando la incontri con le cime di rapa, il piatto mette insieme due cose che in Puglia si riconoscono subito:
la pasta lavorata e una verdura dal gusto deciso — non addomesticato.
Non è una cucina che ha paura dell'amaro.
Lo prende e lo fa diventare parte dell'equilibrio.

<break time="0.6s"/>

Ma qui, a Bari, il punto più forte non è soltanto il piatto finito.

È il fatto che una preparazione nata nella vita quotidiana sia arrivata a stare davanti agli occhi di chi viene da ogni parte del mondo.

<break time="0.4s"/>

Questo cambiamento ha due facce.

Da una parte c'è l'orgoglio:
un gesto delle case diventa conosciuto, cercato, acquistato.

Dall'altra c'è il rischio di guardare le persone soltanto come attrazione:
la fotografia della signora che fa la pasta, il breve video, e poi via verso la prossima tappa.

<break time="0.6s"/>

Per questo ti chiedo una cosa piccola.

Se trovi qualcuno che lavora la pasta davanti a casa, osserva con rispetto.
Acquista, se desideri portare con te quel prodotto.
Chiedi prima di fare un primo piano.
Ricordati che ciò che per te dura pochi minuti, per chi è seduto a quel tavolo è lavoro, abitudine, presenza nel quartiere.

<break time="0.7s"/>

A Bari la casa e la strada non sono sempre due mondi separati.

Le orecchiette lo mostrano benissimo.

Un tavolo esce dalla porta.
Una mano lavora.
Qualcuno passa.
Qualcuno si ferma.
La pasta prende forma — e, nello stesso momento, il vicolo diventa cucina, bottega e incontro.

<break time="0.6s"/>

Questo è il cibo che tiene insieme la città.

Non perché sia rimasto identico a cento anni fa.

Ma perché ancora oggi riesce a mettere una persona davanti a un'altra:
chi prepara, chi compra, chi domanda, chi ascolta, chi scopre che quel piccolo pezzo di pasta non è soltanto un souvenir commestibile.

È un gesto.

E i gesti, quando sopravvivono, raccontano molto più di una ricetta.

<break time="0.8s"/>

Adesso continua verso le piazzette del borgo.

Dopo la pasta che nasce lentamente, arriva un altro pezzo di Bari:
quello dell'olio caldo, del cartoccio e della voglia di mangiare subito.""",

    "bari-tavola-rachele-cap4-it.mp3": """Ci sono cibi che chiedono un piatto, una forchetta, un tavolo apparecchiato.

E poi ci sono cibi che sembrano fatti apposta per uscire dalla cucina e raggiungerti in strada.

<break time="0.5s"/>

A Bari Vecchia, tra i nomi che appartengono al cibo di strada, ci sono le sgagliozze e le popizze.

<break time="0.4s"/>

Le sgagliozze hanno qualcosa di sorprendente per chi arriva pensando alla Puglia soltanto attraverso pane, pomodoro e pasta:
sono pezzi di polenta fritta.
Dorati, caldi, semplici.
Un cibo che non cerca eleganza.
Cerca il momento giusto: l'olio, il sale, l'aria della sera, il cartoccio che scalda le dita.

<break time="0.4s"/>

Le popizze — piccole frittelle di pasta lievitata — appartengono allo stesso mondo del cibo immediato:
quello che non ha bisogno di un menu lungo per farsi capire.

<break time="0.6s"/>

Non ti dirò che troverai sempre qualcuno a friggerle proprio quando passi tu.

Una città non è una scenografia che si accende a orario per il visitatore.

<break time="0.5s"/>

Ma voglio che tu capisca cosa rappresentano.

Sono il lato del cibo barese che non aspetta un'occasione importante.
Una pentola d'olio, un impasto semplice, persone vicine:
basta poco per trasformare un angolo del borgo in un luogo in cui fermarsi.

<break time="0.6s"/>

C'è una parola spesso usata per descrivere queste preparazioni: povere.

È una parola che va maneggiata con attenzione.

Non significa che fossero romantiche perché nate da poco.
La necessità non è decorazione.
Preparare con ingredienti essenziali significa anche aver dovuto fare molto con quello che c'era.

<break time="0.5s"/>

Eppure non bisogna nemmeno guardarle dall'alto, come cibi rimasti indietro.

Le sgagliozze e le popizze mostrano una capacità molto precisa:
trasformare ingredienti semplici in un momento condiviso —
qualcosa che passa dalla cucina alla strada e, uscendo, crea relazione.

<break time="0.6s"/>

Mentre cammini, cerca di notare quanto in questa città il cibo non abbia paura di essere informale.

A volte lo mangi in piedi.

A volte con un tovagliolo troppo piccolo.

A volte con le dita ancora calde d'olio.

<break time="0.4s"/>

Non è trascuratezza.

È il contrario dell'attesa solenne:
è il piacere di non dover rimandare ciò che è buono.

<break time="0.8s"/>

E se fino ad ora abbiamo seguito il cibo dal mare alla pasta e dalla pasta al fritto, manca ancora un profumo che, per molti baresi, non ha quasi bisogno di essere annunciato.

Quello che esce da un forno.""",

    "bari-tavola-rachele-cap5-it.mp3": """La focaccia barese è probabilmente il cibo che molti visitatori incontrano per primo.

E c'è una ragione:
non ha bisogno di essere spiegata prima di desiderarla.

<break time="0.5s"/>

La vedi in teglia:
la superficie segnata dai pomodori, l'olio, l'impasto morbido, il bordo che può diventare più croccante.
La senti prima di comprarla.
Poi la mangi e scopri che può essere insieme semplice... e impossibile da dimenticare.

<break time="0.6s"/>

La focaccia barese è riconosciuta tra i prodotti agroalimentari tradizionali della Puglia.
Ma un riconoscimento ufficiale, da solo, non spiega il rapporto che Bari ha con lei.

<break time="0.5s"/>

Per capirlo, devi immaginare non una cena speciale —
ma un pezzo preso mentre si cammina.
Una carta che si unge.
Un morso prima dell'ora giusta.
Qualcuno che dice: ne prendiamo ancora un po'?

<break time="0.6s"/>

La focaccia non obbliga nessuno a sedersi.

Non pretende un rito complicato.

Può accompagnarti mentre entri nella città vecchia, mentre esci, mentre aspetti —
mentre hai già mangiato ma l'odore del forno ti convince che un altro pezzo sia ancora possibile.

<break time="0.5s"/>

Ed è qui che diventa davvero barese:
non solo negli ingredienti, ma nel suo modo di stare dentro alla giornata.

<break time="0.6s"/>

Ogni forno avrà le proprie abitudini.
C'è chi la preferisce più alta, chi più sottile.
Chi cerca l'angolo croccante, chi vuole la parte centrale più morbida.
Chi discute sulla patata nell'impasto, o sulla quantità di pomodoro.

Non serve stabilire un'unica legge.

Anche questo fa parte del rapporto con un cibo amato:
ognuno riconosce come perfetta la versione che sente più vicina.

<break time="0.6s"/>

Per chi arriva da fuori, una focaccia può essere soltanto una cosa buona da assaggiare.

Per Bari è una presenza quotidiana.

È una di quelle cose che possono stare in mano a un bambino, in un sacchetto portato a casa, in una sosta improvvisa, in un pranzo veloce, in un ricordo semplicissimo.

<break time="0.5s"/>

Non ho bisogno di dirti che è "autentica".
Questa parola, quando si parla di cibo, viene usata troppo facilmente.

Ti basta osservarla nel suo posto naturale:
non isolata sotto una campana di vetro — ma comprata, spezzata, portata via, mangiata mentre la città continua a muoversi.

<break time="0.7s"/>

E qui potresti pensare che Bari sia tutta in quel morso.

Non lo è.

La focaccia è una porta d'ingresso.

Ma una città che vive tra strada, casa e mare ha anche cibi che richiedono attesa.
Cibi che esplodono appena li apri.
Cibi che non puoi mangiare con troppa fretta — perché il primo morso potrebbe scottarti.

Il prossimo è uno di quelli.""",

    "bari-tavola-rachele-cap6-it.mp3": """Il panzerotto ha una forma chiusa.

<break time="0.5s"/>

E forse una parte del suo fascino nasce proprio da questo:
finché non lo apri, trattiene tutto.

L'impasto. Il ripieno. Il calore.
Il rischio di addentarlo troppo presto... e pentirtene immediatamente.

<break time="0.6s"/>

A Bari il panzerotto appartiene molto alla dimensione dell'attesa condivisa.
Non soltanto perché va preparato e fritto —
ma perché spesso è legato a momenti in cui si sta insieme:
una serata, una tavolata, una scelta semplice fatta in compagnia.

<break time="0.5s"/>

Pomodoro e mozzarella sono il ripieno più riconoscibile.
Ma ciò che conta in questo racconto non è fare l'elenco delle varianti.

È capire la differenza tra mangiare qualcosa e aspettarlo insieme.

<break time="0.5s"/>

Una focaccia può sorprenderti mentre passi.

Il panzerotto, spesso, lo decidi.
Lo ordini. Aspetti che arrivi. Sai che sarà caldo.
E in quell'attesa c'è già una parte della serata.

<break time="0.6s"/>

La cucina barese ha molti cibi che non separano il gusto dalla relazione.

Non ti chiede soltanto: ti piace?

Ti mette nella condizione di condividere il tempo prima ancora del piatto.

<break time="0.5s"/>

Questo è un modo di vivere che per un visitatore può sembrare piccolo.
Ma spesso sono proprio le cose piccole a farti comprendere una città più di un monumento.

<break time="0.4s"/>

Chi viene a Bari può fotografare la Basilica, il lungomare, la muraglia, il castello.

Poi magari ricorderà anche un panzerotto mangiato troppo caldo...
mentre qualcuno rideva perché aveva fatto lo stesso errore.

<break time="0.5s"/>

Non perché il panzerotto sia più importante della storia.

Perché la storia di un luogo passa anche da ciò che ti succede mentre ci stai dentro.

<break time="0.8s"/>

Ora però dobbiamo rientrare idealmente nelle case.

Perché c'è un piatto che non nasce soprattutto dalla strada, né da un assaggio veloce.
Nasce dalla teglia, dagli strati, dal tempo del forno —
e da quella domanda che in ogni famiglia può diventare discussione:
come si fa davvero?""",

    "bari-tavola-rachele-cap7-it.mp3": """Ci sono piatti che si mangiano.

E poi ci sono piatti su cui le famiglie discutono.

<break time="0.5s"/>

A Bari, la teglia di patate, riso e cozze appartiene facilmente alla seconda categoria.

<break time="0.5s"/>

Gli ingredienti sono visibili già nel nome: patate, riso, cozze.
Eppure, proprio perché sembrano semplici, ogni dettaglio può diventare importante.
Come si dispongono gli strati.
Quanto liquido occorre.
Se e quanto pomodoro.
La crosticina.
Il formaggio, quando previsto dalla ricetta di casa.
Il punto esatto in cui il riso è cotto — e ha raccolto il sapore del mare senza perdere consistenza.

<break time="0.6s"/>

Non voglio trasformare una guida audio in un tribunale delle ricette.

Il valore di questo piatto sta anche nel fatto che non esiste soltanto come prodotto da ordinare.

È una teglia.

<break time="0.4s"/>

Una forma di cucina fatta per essere portata in tavola e divisa.
Una costruzione a strati in cui il mare, con le cozze, incontra ingredienti semplici e terrestri come patate e riso.

<break time="0.5s"/>

Se la focaccia è il cibo che cammina con te, questa è la cucina che ti chiede di sederti.

Non perché sia più nobile.

Perché ha un'altra funzione.

<break time="0.5s"/>

La teglia parla di casa, di pranzo, di quantità sufficiente per più persone.
Parla del profumo che arriva prima del momento di servirla.
Parla del cibo non come assaggio — ma come centro di un tavolo.

<break time="0.7s"/>

La scena è una teglia che si apre.

Qualcuno che prende la porzione con più crosticina.

Qualcun altro che controlla se il riso è venuto come doveva.

E, naturalmente, qualcuno che sostiene che a casa propria si fa meglio.

<break time="0.5s"/>

Non serve sapere quale famiglia abbia ragione.

Serve capire che quando un piatto provoca questo tipo di fedeltà, ormai non appartiene soltanto alla cucina.

Appartiene all'identità.

<break time="0.6s"/>

Il mare, in questo piatto, non arriva urlando.
Non è l'immagine immediata del banco o della barca.
Entra negli strati, cuoce insieme al resto, porta il proprio sapore dentro una preparazione domestica.

È un'altra faccia di Bari.

Quella in cui ciò che arriva dall'acqua non resta separato dalla vita di casa.""",

    "bari-tavola-rachele-cap8-it.mp3": """Finora abbiamo attraversato cibi legati a gesti antichi:
la pasta fatta a mano, la focaccia, il fritto, il mare, la teglia.

<break time="0.5s"/>

Ma una città non resta viva se sa raccontare soltanto ciò che viene dal passato.

<break time="0.4s"/>

Bari ha anche un piatto più recente —
diventato in pochi decenni riconoscibile quasi quanto le preparazioni tradizionali:
gli spaghetti all'assassina.

<break time="0.5s"/>

Il nome sembra uscito da una battuta o da una provocazione.
E in effetti questo piatto ha un carattere che non cerca discrezione.

Gli spaghetti non vengono semplicemente bolliti e conditi.
Cuociono in padella, a contatto con il sugo, fino a raggiungere quella parte bruciacchiata e croccante che è l'opposto della pasta morbida e rassicurante.

È un piatto rosso.
Piccante.
Diretto.

<break time="0.6s"/>

La sua storia viene generalmente collocata nella Bari della seconda metà del Novecento;
la tradizione cittadina lo lega a un ristorante del centro e a una nascita relativamente recente rispetto ai cibi che abbiamo incontrato prima.

Proprio per questo è interessante.

<break time="0.4s"/>

Dimostra che la cucina di una città non è soltanto un museo di ricette antiche.
Può inventare qualcosa di nuovo —
e nel giro di una generazione, riconoscersi in quel gusto.

<break time="0.5s"/>

L'assassina non sostituisce le orecchiette, la teglia o la focaccia.

Sta accanto a loro.
E racconta una Bari diversa:
urbana, rumorosa, ironica, capace di trasformare una pasta "sbagliata" — attaccata, bruciata, piccante — in un orgoglio da discutere e cercare.

<break time="0.7s"/>

Bari sa difendere i propri riti antichi.

Ma sa anche affezionarsi a una provocazione recente — se quella provocazione ha abbastanza carattere da somigliarle.

<break time="0.6s"/>

Dal mare alla teglia. Dal tavolo nel vicolo alla padella che brucia.

Il cibo barese non ha un'unica voce.

Ed è proprio per questo che racconta così bene una città che non è mai stata soltanto antica, soltanto religiosa, soltanto marinara o soltanto turistica.

<break time="0.5s"/>

Bari cambia.

E poi, quando qualcosa le piace davvero, comincia a dire che è sempre stato parte di lei.""",

    "bari-tavola-rachele-cap9-it.mp3": """Siamo tornati quasi al punto da cui siamo partiti.

<break time="0.5s"/>

In mezzo ci sono stati il mare, la pasta lavorata davanti alle porte, l'olio caldo, il forno, l'attesa di un panzerotto, una teglia divisa — e perfino una pasta che Bari ha deciso di bruciare per renderla propria.

<break time="0.7s"/>

Manca un gesto piccolo.

Un caffè.

<break time="0.5s"/>

Non perché sia esclusivamente barese.
Il caffè appartiene a moltissime città italiane, ognuna con i propri ritmi e le proprie abitudini.

Ma anche qui può dirti qualcosa.

<break time="0.5s"/>

Dopo tutto quello che hai visto, un caffè preso al banco o seduto in piazza non è il finale obbligatorio di un tour gastronomico.
È un modo semplice per restare ancora un momento nella città.

<break time="0.8s"/>

Io sono Rachele.
E non ho bisogno di dirti che una ricetta vale solo se è fatta come la faceva mia nonna — o di inventare una memoria per convincerti che Bari è vera.

Bari non ha bisogno di essere resa più autentica da una storia costruita.

È già dentro i gesti che hai incontrato.

<break time="0.5s"/>

Nel mare che arriva a terra.

Nella pasta che prende forma su un tavolo davanti a una porta.

Nella focaccia che non aspetta l'ora del pranzo.

Nel fritto mangiato in un cartoccio.

Nella teglia che ognuno difende a modo suo.

Nel panzerotto che ti obbliga ad aspettare.

Nel piatto nuovo che una città accoglie perché ci riconosce il proprio carattere.

<break time="0.8s"/>

All'inizio ti avevo detto che non avrei fatto una lista di cose da mangiare.

Ora quella lista la conosci lo stesso.

<break time="0.5s"/>

Ma forse, se assaggerai qualcosa dopo questo racconto, lo farai in modo diverso.

Non penserai soltanto: è buono.

Penserai a dove sei.

<break time="0.5s"/>

A una città in cui il cibo non è chiuso nei ristoranti e non serve soltanto a riempire una giornata di viaggio.

Qui il cibo passa.

Dal mare alla strada.

Dalla strada alla casa.

Dalla casa di nuovo fuori, verso le persone.

<break time="0.7s"/>

Per questo, a Bari, mangiare non è mai soltanto mangiare.

È uno dei modi più semplici che la città ha trovato per non restare sola.""",
}


def generate_chapter(filename: str, text: str):
    out_path = OUTPUT_DIR / filename
    if out_path.exists():
        print(f"SKIP {filename} (gia' esistente)")
        return

    ssml = f"<speak>{text}</speak>"
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={"xi-api-key": API_KEY, "Content-Type": "application/json"},
        json={
            "text": ssml,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": VOICE_SETTINGS,
        },
    )

    if resp.status_code != 200:
        print(f"ERRORE {filename}: {resp.status_code} — {resp.text}")
        return

    out_path.write_bytes(resp.content)
    size_kb = out_path.stat().st_size // 1024
    print(f"OK  {filename}  ({size_kb} KB)")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Voce: {VOICE_ID}")
    print(f"Output: {OUTPUT_DIR}")
    print("-" * 50)
    for filename, text in CHAPTERS.items():
        print(f"Genero {filename}...")
        generate_chapter(filename, text)
    print("-" * 50)
    print("Fatto.")


if __name__ == "__main__":
    main()
