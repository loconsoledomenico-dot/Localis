"""
Genera tutti i capitoli DE — Bari a Tavola
Voce: 8N2ng9i2uiUWqstgmWlH
Output: private/audio/bari/bari-tavola/_chapters/bari-tavola-capN-de.mp3
NOTA: i file vengono consegnati all'utente per missaggio.
      NON caricare su R2 senza il file finale approvato.
"""
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")

VOICE_ID = "8N2ng9i2uiUWqstgmWlH"
OUTPUT_DIR = Path(__file__).parent.parent / "private" / "audio" / "bari" / "bari-tavola" / "_chapters"

VOICE_SETTINGS = {
    "stability": 0.35,
    "similarity_boost": 0.80,
    "style": 0.45,
    "use_speaker_boost": True,
}

CHAPTERS = {
    "bari-tavola-cap1-de.mp3": """Mein Name ist Rachele.

<break time="0.8s"/>

In dieser Geschichte werde ich dich nicht durch eine Liste von Dingen führen, die du probieren sollst.

Eine Liste findest du überall.
Focaccia. Orecchiette. Panzerotti. Sgagliozze. Tintenfisch. Muscheln. Kaffee.

Es geht nicht darum, die Namen zu kennen.

<break time="0.5s"/>

Es geht darum zu verstehen, warum in Bari all diese Dinge ständig aus den Türen zu strömen scheinen.
Aus dem Backofen.
Aus der Küche.
Aus dem Meer.
Aus den Gassen.
Aus einer Backform, die auf den Tisch getragen wird.
Aus einer Papiertüte, die von Hand zu Hand geht.

<break time="0.6s"/>

Wenn du in Richtung Altstadt schaust, steckt das Essen bereits in dem Weg, den du gleich gehen wirst.
Es lebt nicht nur in den Restaurants.
Es lebt in den Bewegungen.
Im Geruch eines Ofens, der dich beim Gehen einholt.
In den Händen, die draußen vor einem Haus Pasta kneten.
Im Bratfett, das man riecht, bevor man es sieht.
Im Meer, das in einer Stadt wie dieser niemals nur Kulisse bleibt.

<break time="0.5s"/>

In Bari bleibt etwas Gutes selten allein.

Ein Stück Focaccia... wird geteilt.

Ein Panzerotto wartet man gemeinsam ab.

Ein Teller Orecchiette entsteht aus einer Hand, die dieselbe Geste tausende Male wiederholt hat.

Der Fisch erinnert daran, dass die Stadt immer auf das Wasser geschaut hat — nicht nur der Schönheit wegen, sondern der Arbeit und dem Hunger wegen.

Und der Kaffee schließt am Ende keinen eleganten Weinabend.
Meistens schließt er ein Gespräch.
Oder eröffnet ein neues.

<break time="0.7s"/>

Diese Führung beginnt hier:
an dem Punkt, wo das alte Bari auf die Stadt trifft, die spazieren geht, einen Aperitif trinkt, innehält, weiterzieht.

Vor dir liegen restaurierte Piazze, Tische im Freien, Menschen, die ankommen und Menschen, die nach Hause gehen.
Dahinter, in den Gassen, gibt es Gesten, die viel älter sind als der Food-Tour-Trend.

<break time="0.5s"/>

Das bedeutet nicht, dass alles gleich geblieben ist.
Bari hat sich verändert.
Das Essen ist zum Bild geworden, zum Tourismusmagnet, zum Broterwerb, zum Foto zum Mitnehmen.

Aber bevor es ein Foto wurde, war es — und ist es noch — etwas Einfacheres.

Eine Art, sich durchzuschlagen.

Eine Art, zu empfangen.

Eine Art, nie ganz allein zu essen.

<break time="0.6s"/>

Deshalb versteht man das Essen von Bari nicht, indem man nur das bekannteste Gericht wählt.

Man muss seinen Weg verfolgen.

Von der Straße zum Meer.

Vom Meer zu den Häusern.

Von den Häusern wieder hinaus...
wo jemand brät, jemand knetet, jemand darauf wartet, dass die Focaccia gerade genug abkühlt, um sie essen zu können, ohne sich zu verbrennen.

<break time="0.8s"/>

Geh in Richtung Meer.

Um das Essen von Bari zu verstehen, muss man an dem Punkt beginnen, an dem diese Stadt immer empfangen hat, was sie zum Leben brauchte.""",

    "bari-tavola-cap2-de.mp3": """Hier musst du stehen bleiben.

<break time="0.6s"/>

Denn wenn ich dir das Essen von Bari erklären würde, ohne dich zu N'dèrr'a la lanze zu führen, würde ich dir nur einen Teil der Stadt erzählen.

<break time="0.4s"/>

Der Name ist barinesischer Dialekt.
Er erinnert an die Lanze — die kleinen Fischerboote — und an den Punkt, an dem sie an Land gezogen wurden.
Kein geordneter Markt hinter einer Schaufensterscheibe.
Das Gegenteil: die kurze, fast abrupte Grenze zwischen dem, was aus dem Meer kam, und denen, die bereit waren, es mitzunehmen — oder es gleich dort zu essen.

<break time="0.5s"/>

Das ist der Molo San Nicola.

Auf einer Seite die Strandpromenade, das Teatro Margherita, die Stadt, die spazieren geht.
Auf der anderen die Fischerboote, die nassen Hände, die Eimer, die Kisten, das Meer, das nicht für Kulisse da ist — sondern um den Lebensunterhalt zu sichern.

<break time="0.6s"/>

In Bari ist roher Fisch nicht als Trend entstanden.
Bevor er zu etwas wurde, das Besucher suchen, war er eine Gewohnheit, die mit einem direkten Verhältnis zum Fang verbunden war:
Muscheln, Sepien, Jungfische, Seeigel wenn sie verfügbar waren, und vor allem der Oktopus.

<break time="0.4s"/>

Der Oktopus wurde hier nicht einfach geputzt.

Er wurde GEROLLT.

<break time="0.5s"/>

Man schlug ihn auf den Stein.
Man bearbeitete ihn im Wasser.
Man drehte ihn, bis die Tentakel ihre Konsistenz veränderten und sich in dichtere Locken schlossen.

Eine lange, körperliche, uralte Geste.
Keine Zubereitung, die man fotografiert — sondern Arbeit, die Hände, Zeit und Meer brauchte.

<break time="0.5s"/>

Noch heute, wenn man diese Geste sieht, versteht man sofort, dass das Essen aus Bari nicht auf dem Teller beginnt.

Es beginnt früher.

Im Geräusch des Oktopus, der auf den Stein geschlagen wird.

Im Wasser, das ihn bewegt.

Im Fischer, der weiß, wann er fertig ist — ohne ihn messen zu müssen.

<break time="0.7s"/>

Und dann kommt der Moment, in dem das Meer fast ohne Abstand gegessen wird:
ein Stück roher gerollter Oktopus, eine geöffnete Muschel, eine Sepie — was das Meer und der Tag verfügbar gemacht haben.

<break time="0.5s"/>

Für viele Einwohner von Bari, vor allem an Festmorgen oder sonntags, bedeutete der Gang hierher — und kann es noch bedeuten — nicht nur Fisch kaufen.
Es bedeutete, ein bisschen davon vor Ort zu essen.
Im Stehen. Mit einem einfachen Tellerchen. Vielleicht mit einem Bier daneben.
Vor dem Wasser, aus dem all dieser Geschmack gerade angekommen zu sein scheint.

<break time="0.6s"/>

Du musst diesen Ort nicht in eine Mutprobe verwandeln.

Rohe Meeresfrüchte erfordern immer Vorsicht: reguläre Herkunft, ordnungsgemäße Lagerung, Einhaltung der aktuellen Vorschriften.

<break time="0.4s"/>

Aber auch ohne etwas zu probieren, kannst du den Wert von N'dèrr'a la lanze verstehen.

Hier zeigt Bari eine Seite, die keine Inszenierung braucht:
eine Stadt, die das Meer nie auf Distanz gehalten hat.
Sie bringt es nah. Putzt es. Rollt es. Öffnet es. Teilt es. Isst es.

<break time="1.0s"/>

Und wenn ich an dieses Verhältnis zum Meer denke...
verschiebt sich die Erinnerung weiter nach Süden.
Nach Savelletri.

Zu einem Ort, der für mich und Domenico kein Restaurant war.
Und auch kein Reiseziel, das man in einem Reiseführer empfehlen würde.

Es war... Forcatella.

<break time="0.8s"/>

Heute gibt es in dieser Gegend Lokale und Restaurants.
Aber ich erinnere mich, wie es damals war:
Strandhütten am Meer, Fischer vor dem Wasser, und Seeigel, die direkt vor der Küste aus dem Meer geholt wurden — an Land gebracht und dort geöffnet.

<break time="0.5s"/>

Ich bin verrückt nach Seeigeln.

<break time="0.4s"/>

Domenico und ich gingen dorthin mit knusprigem Brot.
Der Seeigel wurde geöffnet, und diesen orangefarbenen Teil schöpfte man direkt mit dem Brot heraus.

Mehr brauchte es nicht.

Das Meer war vor uns... und irgendwie war es auch das, was wir gegessen haben.

<break time="0.6s"/>

Wir haben mindestens hundert zu zweit gegessen.

<break time="0.5s"/>

Heute klingt das fast übertrieben.
Aber in dem Moment haben wir es nicht als Exzess erlebt, den man erzählen müsste.
Es war unsere Art, dort zu sein:
das Brot in den Händen, das Meer vor uns, die Zeit ohne Eile und ein Geschmack, der nichts anderem ähnelte.

<break time="0.8s"/>

Heute weiß ich, dass diese Erinnerung einer anderen Zeit gehört.
Seeigel sind eine fragile Ressource und dürfen nur konsumiert werden, wenn sie legal verfügbar und von kontrollierter Herkunft sind.

Aber Erinnerungen werden nicht korrigiert.
Sie werden ehrlich erzählt.

<break time="0.6s"/>

Für mich bleibt der Geschmack des Meeres dieser Erde jener:
zuerst Bari, mit den gerollten Oktopussen bei N'dèrr'a la lanze und dem rohen Fisch, der vor dem Wasser gegessen wurde...
dann Forcatella, das knusprige Brot zwischen den Fingern, Domenico neben mir, und ein Seeigel, der gerade am Ufer geöffnet wurde.

<break time="1.0s"/>

Geh jetzt langsam zurück in Richtung Altstadt.

Vom Meer gehen wir zum Haus.

Nicht zu einem Haus, das von der Straße getrennt ist.
Zu einem Haus aus Bari, das seinen eigenen Tisch fast bis vor die Schwelle trägt, um über sein Essen zu erzählen.""",

    "bari-tavola-cap3-de.mp3": """Jetzt bist du an einem der Orte, die viele Besucher gezielt suchen.

Hier kann man Tische im Freien sehen, Grieß, frische Pasta und schnelle Hände, die den Orecchiette ihre Form geben.

<break time="0.5s"/>

Das Erste, was man sich merken muss, ist einfach:
du bist nicht in ein Set geraten.

<break time="0.4s"/>

Diese Straße ist berühmt, fotografiert, gesucht geworden.
Aber hinter dem Bild steckt eine häusliche Geste:
Wasser, Grießmehl, Druck des Messers, Daumen oder Finger, der die Pasta umkehrt und ihr die Form gibt, die in der Lage ist, die Sauce zu halten.

<break time="0.5s"/>

Die Orecchietta ist klein, aber eine intelligente Form.
Man muss sie nicht mit großen Worten erklären.
Es genügt, sie anzusehen:
die raue Seite nimmt die Sauce oder das Gemüse auf;
die Mulde fängt, was sonst wegrutschen würde.

<break time="0.5s"/>

Wenn man sie mit Stängelkohl trifft, vereint das Gericht zwei Dinge, die man in Apulien sofort erkennt:
die bearbeitete Pasta und ein Gemüse mit einem entschiedenen Geschmack — nicht gezähmt.
Das ist eine Küche, die keine Angst vor dem Bitteren hat.
Sie nimmt es und macht es zu einem Teil des Gleichgewichts.

<break time="0.6s"/>

Aber hier, in Bari, liegt der stärkste Punkt nicht nur im fertigen Gericht.

Es ist die Tatsache, dass eine Zubereitung, die im Alltag entstanden ist, es geschafft hat, vor den Augen von Menschen aus aller Welt zu stehen.

<break time="0.4s"/>

Dieser Wandel hat zwei Seiten.

Auf der einen Seite liegt der Stolz:
eine häusliche Geste wird bekannt, gesucht, gekauft.

Auf der anderen lauert das Risiko, die Menschen nur als Attraktion zu betrachten:
das Foto der Frau, die Pasta macht, das kurze Video, und dann weiter zur nächsten Station.

<break time="0.6s"/>

Deshalb bitte ich dich um eine kleine Sache.

Wenn du jemanden findest, der vor seinem Haus Pasta verarbeitet, schau mit Respekt zu.
Kauf, wenn du das Produkt mitnehmen möchtest.
Frag, bevor du eine Nahaufnahme machst.
Denk daran, dass das, was für dich ein paar Minuten dauert, für die Person an jenem Tisch Arbeit, Gewohnheit, Präsenz im Viertel bedeutet.

<break time="0.7s"/>

In Bari sind Haus und Straße nicht immer zwei getrennte Welten.

Die Orecchiette zeigen das sehr gut.

Ein Tisch tritt aus der Tür.
Eine Hand arbeitet.
Jemand geht vorbei.
Jemand bleibt stehen.
Die Pasta nimmt Form an — und im selben Moment wird die Gasse Küche, Laden und Begegnung.

<break time="0.6s"/>

Das ist das Essen, das die Stadt zusammenhält.

Nicht weil es hundert Jahre lang identisch geblieben ist.

Sondern weil es noch heute einen Menschen vor den anderen stellen kann:
den, der zubereitet, den, der kauft, den, der fragt, den, der zuhört, den, der entdeckt, dass dieses kleine Stück Pasta kein essbares Souvenir ist.

Es ist eine Geste.

Und Gesten erzählen, wenn sie überleben, viel mehr als ein Rezept.

<break time="0.8s"/>

Geh jetzt weiter in Richtung der kleinen Piazze des Borgs.

Nach der Pasta, die langsam entsteht, kommt ein weiteres Stück Bari:
das des heißen Öls, der Papiertüte und der Lust, sofort zu essen.""",

    "bari-tavola-cap4-de.mp3": """Es gibt Speisen, die einen Teller, eine Gabel, einen gedeckten Tisch verlangen.

Und dann gibt es Speisen, die dafür gemacht zu sein scheinen, die Küche zu verlassen und dich auf der Straße zu finden.

<break time="0.5s"/>

In Bari Vecchia gehören zu den Namen des Straßenessens die Sgagliozze und die Popizze.

<break time="0.4s"/>

Die Sgagliozze haben etwas Überraschendes für alle, die nach Apulien kommen und dabei nur an Brot, Tomaten und Pasta denken:
es sind Stücke aus gebratenem Polenta.
Goldgelb, warm, schlicht.
Ein Essen, das keine Eleganz sucht.
Es sucht den richtigen Moment: das Öl, das Salz, die Abendluft, die Papiertüte, die die Finger wärmt.

<break time="0.4s"/>

Die Popizze — kleine Krapfen aus Hefeteig — gehören zur selben Welt des unmittelbaren Essens:
jenes, das keine lange Speisekarte braucht, um sich verständlich zu machen.

<break time="0.6s"/>

Ich werde dir nicht sagen, dass du immer jemanden findest, der sie frittiert, genau wenn du vorbeigehst.

Eine Stadt ist keine Kulisse, die sich für den Besucher nach Fahrplan einschaltet.

<break time="0.5s"/>

Aber ich möchte, dass du verstehst, was sie darstellen.

Sie sind die Seite des Essens aus Bari, die auf keinen besonderen Anlass wartet.
Ein Topf Öl, ein einfacher Teig, Menschen in der Nähe:
es braucht wenig, um eine Ecke des Borgs in einen Ort zu verwandeln, an dem man stehen bleibt.

<break time="0.6s"/>

Es gibt ein Wort, das oft verwendet wird, um diese Zubereitungen zu beschreiben: arm.

Es ist ein Wort, das mit Vorsicht gehandhabt werden muss.

Es bedeutet nicht, dass sie romantisch waren, weil sie aus wenig entstanden sind.
Die Not ist keine Dekoration.
Mit einfachen Zutaten zu kochen bedeutet auch, aus dem, was vorhanden war, viel machen zu müssen.

<break time="0.5s"/>

Aber man darf sie auch nicht von oben herab betrachten, als wären es Speisen, die zurückgeblieben sind.

Die Sgagliozze und die Popizze zeigen eine sehr präzise Fähigkeit:
einfache Zutaten in einen gemeinsamen Moment zu verwandeln —
etwas, das von der Küche auf die Straße übergeht und dabei Beziehung schafft.

<break time="0.6s"/>

Achte beim Gehen darauf, wie sehr das Essen in dieser Stadt keine Angst davor hat, informell zu sein.

Manchmal isst man es im Stehen.

Manchmal mit einer Serviette, die zu klein ist.

Manchmal mit Fingern, die noch warm vom Öl sind.

<break time="0.4s"/>

Das ist keine Nachlässigkeit.

Es ist das Gegenteil des feierlichen Wartens:
die Freude daran, das Gute nicht aufschieben zu müssen.

<break time="0.8s"/>

Und wenn wir bis jetzt dem Essen vom Meer zur Pasta und von der Pasta zum Gebratenen gefolgt sind, fehlt noch ein Duft, der für viele Einwohner von Bari kaum angekündigt werden muss.

Jener, der aus einem Ofen strömt.""",

    "bari-tavola-cap5-de.mp3": """Die Focaccia barese ist wahrscheinlich das Essen, dem viele Besucher zuerst begegnen.

Und dafür gibt es einen Grund:
sie muss nicht erklärt werden, bevor man sie begehrt.

<break time="0.5s"/>

Man sieht sie in der Backform:
die von Tomaten gezeichnete Oberfläche, das Öl, den weichen Teig, den Rand, der knuspriger werden kann.
Man riecht sie, bevor man sie kauft.
Dann isst man sie und entdeckt, dass sie gleichzeitig einfach sein kann... und unmöglich zu vergessen.

<break time="0.6s"/>

Die Focaccia barese ist als traditionelles Agrarnahrungsmittelprodukt Apuliens anerkannt.
Aber eine offizielle Anerkennung allein erklärt nicht das Verhältnis, das Bari zu ihr hat.

<break time="0.5s"/>

Um das zu verstehen, muss man sich kein besonderes Abendessen vorstellen —
sondern ein Stück, das man beim Gehen mitnimmt.
Ein Papier, das fettig wird.
Ein Bissen vor der richtigen Stunde.
Jemand, der sagt: sollen wir noch ein bisschen mehr nehmen?

<break time="0.6s"/>

Die Focaccia zwingt niemanden, sich zu setzen.

Sie verlangt kein kompliziertes Ritual.

Sie kann dich begleiten, während du in die Altstadt eintrittst, während du sie verlässt, während du wartest —
während du schon gegessen hast, aber der Geruch des Ofens dich davon überzeugt, dass ein weiteres Stück noch möglich ist.

<break time="0.5s"/>

Und genau hier wird sie wirklich barinesisch:
nicht nur in den Zutaten, sondern in ihrer Art, im Alltag zu sein.

<break time="0.6s"/>

Jede Bäckerei hat ihre eigenen Gewohnheiten.
Manche bevorzugen sie höher, manche dünner.
Manche suchen die knusprige Ecke, manche wollen die weichere Mitte.
Manche streiten über die Kartoffel im Teig oder die Menge der Tomaten.

Es muss kein einziges Gesetz geben.

Auch das gehört zum Verhältnis mit einem geliebten Essen:
jeder erkennt als perfekt die Version, die ihm am nächsten liegt.

<break time="0.6s"/>

Für jemanden, der von außen kommt, kann eine Focaccia einfach etwas Gutes sein, das man probiert.

Für Bari ist sie eine alltägliche Präsenz.

Sie ist eines jener Dinge, die in der Hand eines Kindes sein können, in einer Tüte, die man nach Hause trägt, bei einem spontanen Halt, bei einem schnellen Mittagessen, in einer sehr einfachen Erinnerung.

<break time="0.5s"/>

Ich muss dir nicht sagen, dass sie "authentisch" ist.
Dieses Wort wird, wenn es ums Essen geht, zu leicht verwendet.

Es genügt, sie an ihrem natürlichen Platz zu beobachten:
nicht isoliert unter einer Glasglocke — sondern gekauft, gebrochen, mitgenommen, gegessen, während die Stadt sich weiter bewegt.

<break time="0.7s"/>

Und hier könntest du denken, dass Bari in diesem Bissen steckt.

Das ist nicht so.

Die Focaccia ist ein Eingangstor.

Aber eine Stadt, die zwischen Straße, Haus und Meer lebt, hat auch Speisen, die Geduld erfordern.
Speisen, die explodieren, wenn man sie öffnet.
Speisen, die man nicht zu eilig essen kann — denn der erste Bissen könnte dich verbrennen.

Die nächste ist eine davon.""",

    "bari-tavola-cap6-de.mp3": """Der Panzerotto hat eine geschlossene Form.

<break time="0.5s"/>

Und vielleicht entsteht ein Teil seines Reizes genau daraus:
bis man ihn öffnet, hält er alles zurück.

Den Teig. Die Füllung. Die Wärme.
Das Risiko, zu früh hineinzubeißen... und es sofort zu bereuen.

<break time="0.6s"/>

In Bari gehört der Panzerotto sehr zur Dimension des gemeinsamen Wartens.
Nicht nur weil er zubereitet und frittiert werden muss —
sondern weil er oft mit Momenten verbunden ist, in denen man zusammen ist:
einem Abend, einer Tischrunde, einer einfachen Entscheidung in Gesellschaft.

<break time="0.5s"/>

Tomate und Mozzarella sind die bekannteste Füllung.
Aber was in dieser Geschichte zählt, ist nicht, die Varianten aufzuzählen.

Es geht darum, den Unterschied zwischen etwas essen und es gemeinsam erwarten zu verstehen.

<break time="0.5s"/>

Eine Focaccia kann dich überraschen, während du vorbeigehst.

Den Panzerotto entscheidet man sich oft.
Man bestellt ihn. Man wartet, bis er kommt. Man weiß, dass er heiß sein wird.
Und in diesem Warten steckt bereits ein Teil des Abends.

<break time="0.6s"/>

Die Küche aus Bari hat viele Speisen, die Geschmack und Beziehung nicht trennen.

Sie fragt dich nicht nur: schmeckt es dir?

Sie versetzt dich in die Lage, die Zeit zu teilen, noch bevor der Teller kommt.

<break time="0.5s"/>

Das ist eine Lebensweise, die einem Besucher klein erscheinen kann.
Aber oft sind es gerade die kleinen Dinge, die dir eine Stadt besser verstehen lassen als ein Denkmal.

<break time="0.4s"/>

Wer nach Bari kommt, kann die Basilika, die Strandpromenade, die Stadtmauer, das Schloss fotografieren.

Vielleicht wird er sich auch an einen Panzerotto erinnern, der zu heiß gegessen wurde...
während jemand lachte, weil er denselben Fehler gemacht hatte.

<break time="0.5s"/>

Nicht weil der Panzerotto wichtiger wäre als die Geschichte.

Weil die Geschichte eines Ortes auch durch das geht, was dir passiert, während du darin bist.

<break time="0.8s"/>

Aber jetzt müssen wir gedanklich in die Häuser zurückkehren.

Denn es gibt ein Gericht, das nicht vor allem von der Straße kommt, noch von einem schnellen Happen.
Es kommt aus der Backform, aus den Schichten, aus der Zeit im Ofen —
und aus jener Frage, die in jeder Familie zur Diskussion werden kann:
wie macht man es wirklich?""",

    "bari-tavola-cap7-de.mp3": """Es gibt Gerichte, die man isst.

Und dann gibt es Gerichte, über die Familien streiten.

<break time="0.5s"/>

In Bari gehört die Backform mit Kartoffeln, Reis und Muscheln leicht zur zweiten Kategorie.

<break time="0.5s"/>

Die Zutaten sind schon im Namen sichtbar: Kartoffeln, Reis, Muscheln.
Und doch, gerade weil sie einfach wirken, kann jedes Detail wichtig werden.
Wie die Schichten angeordnet werden.
Wie viel Flüssigkeit nötig ist.
Ob und wie viel Tomate.
Die Kruste.
Der Käse, wenn das Hausrezept ihn vorsieht.
Der genaue Punkt, an dem der Reis gegart ist — und den Meeresgeschmack aufgenommen hat, ohne seine Konsistenz zu verlieren.

<break time="0.6s"/>

Ich möchte einen Audioguide nicht in ein Rezeptgericht verwandeln.

Der Wert dieses Gerichts liegt auch darin, dass es nicht nur als Bestellprodukt existiert.

Es ist eine Backform.

<break time="0.4s"/>

Eine Form des Kochens, die dazu gemacht ist, auf den Tisch gestellt und geteilt zu werden.
Eine Schichtenkonstruktion, in der das Meer mit den Muscheln auf einfache, erdige Zutaten wie Kartoffeln und Reis trifft.

<break time="0.5s"/>

Wenn die Focaccia das Essen ist, das mit dir geht, ist das hier die Küche, die dich bittet, dich zu setzen.

Nicht weil sie edler wäre.

Weil sie eine andere Funktion hat.

<break time="0.5s"/>

Die Backform spricht von Zuhause, von Mittagessen, von genug für mehrere Personen.
Sie spricht vom Duft, der ankommt, bevor es Zeit ist, sie aufzutragen.
Sie spricht vom Essen nicht als Kostprobe — sondern als Mittelpunkt eines Tisches.

<break time="0.7s"/>

Die Szene ist eine Backform, die geöffnet wird.

Jemand, der die Portion mit der meisten Kruste nimmt.

Jemand anderes, der prüft, ob der Reis so geworden ist, wie er sollte.

Und natürlich jemand, der behauptet, dass er es zu Hause besser macht.

<break time="0.5s"/>

Es ist nicht nötig zu wissen, welche Familie Recht hat.

Es geht darum zu verstehen, dass wenn ein Gericht diese Art von Treue hervorruft, es längst nicht mehr nur zur Küche gehört.

Es gehört zur Identität.

<break time="0.6s"/>

Das Meer kommt in diesem Gericht nicht laut an.
Es ist nicht das unmittelbare Bild des Marktstands oder des Bootes.
Es tritt in die Schichten ein, kocht zusammen mit dem Rest, bringt seinen Geschmack in eine häusliche Zubereitung.

Das ist ein anderes Gesicht von Bari.

Jenes, in dem das, was aus dem Wasser kommt, nicht vom Hausleben getrennt bleibt.""",

    "bari-tavola-cap8-de.mp3": """Bis jetzt haben wir Speisen durchquert, die mit alten Gesten verbunden sind:
die handgemachte Pasta, die Focaccia, das Gebratene, das Meer, die Backform.

<break time="0.5s"/>

Aber eine Stadt bleibt nicht lebendig, wenn sie nur das erzählen kann, was aus der Vergangenheit kommt.

<break time="0.4s"/>

Bari hat auch ein neueres Gericht —
das in wenigen Jahrzehnten fast so bekannt geworden ist wie die traditionellen Zubereitungen:
die Spaghetti all'assassina.

<break time="0.5s"/>

Der Name klingt wie aus einem Witz oder einer Provokation.
Und tatsächlich hat dieses Gericht einen Charakter, der keine Zurückhaltung sucht.

Die Spaghetti werden nicht einfach gekocht und angerichtet.
Sie garen in der Pfanne, in direktem Kontakt mit der Sauce, bis sie jenen angebrannten, knusprigen Teil erreichen, der das Gegenteil von weicher, beruhigender Pasta ist.

Es ist ein rotes Gericht.
Scharf.
Direkt.

<break time="0.6s"/>

Seine Geschichte wird allgemein in das Bari der zweiten Hälfte des zwanzigsten Jahrhunderts eingeordnet;
die städtische Überlieferung verbindet es mit einem Restaurant im Stadtzentrum und einer Entstehung, die im Vergleich zu den Speisen, denen wir begegnet sind, relativ neu ist.

Genau deshalb ist es interessant.

<break time="0.4s"/>

Es beweist, dass die Küche einer Stadt nicht nur ein Museum alter Rezepte ist.
Sie kann etwas Neues erfinden —
und sich innerhalb einer Generation in diesem Geschmack wiedererkennen.

<break time="0.5s"/>

L'assassina ersetzt nicht die Orecchiette, die Backform oder die Focaccia.

Sie steht neben ihnen.
Und erzählt von einem anderen Bari:
urban, laut, ironisch, fähig, eine "falsche" Pasta — angebrannt, knusprig, scharf — in einen Stolz zu verwandeln, über den man streitet und den man sucht.

<break time="0.7s"/>

Bari weiß seine alten Riten zu verteidigen.

Aber es kann sich auch an eine neuere Provokation gewöhnen — wenn diese Provokation genug Charakter hat, ihm zu ähneln.

<break time="0.6s"/>

Vom Meer zur Backform. Vom Tisch in der Gasse zur Pfanne, die brennt.

Das Essen aus Bari hat keine einzige Stimme.

Und genau deshalb erzählt es so gut von einer Stadt, die nie nur antik, nur religiös, nur maritim oder nur touristisch war.

<break time="0.5s"/>

Bari verändert sich.

Und wenn es dann wirklich etwas mag, beginnt es zu sagen, dass es schon immer ein Teil von ihm war.""",

    "bari-tavola-cap9-de.mp3": """Wir sind fast an den Punkt zurückgekehrt, von dem wir aufgebrochen sind.

<break time="0.5s"/>

Dazwischen lagen das Meer, die Pasta, die vor Türen geknetet wurde, das heiße Öl, der Ofen, das Warten auf einen Panzerotto, eine geteilte Backform — und sogar eine Pasta, die Bari beschlossen hat zu verbrennen, um sie zu sich zu machen.

<break time="0.7s"/>

Es fehlt eine kleine Geste.

Ein Kaffee.

<break time="0.5s"/>

Nicht weil er ausschließlich barinesisch wäre.
Der Kaffee gehört zu sehr vielen italienischen Städten, jede mit ihren eigenen Rhythmen und Gewohnheiten.

Aber auch hier kann er dir etwas sagen.

<break time="0.5s"/>

Nach allem, was du gesehen hast, ist ein Kaffee an der Theke oder auf der Piazza nicht das obligatorische Finale einer Gastronomietour.
Es ist ein einfacher Weg, noch einen Moment in der Stadt zu bleiben.

<break time="0.8s"/>

Ich bin Rachele.
Und ich muss dir nicht sagen, dass ein Rezept nur dann etwas taugt, wenn es so gemacht wird, wie es meine Großmutter gemacht hat — oder eine Erinnerung erfinden, um dich davon zu überzeugen, dass Bari echt ist.

Bari muss nicht durch eine konstruierte Geschichte authentischer gemacht werden.

Es steckt bereits in den Gesten, die du kennengelernt hast.

<break time="0.5s"/>

Im Meer, das an Land kommt.

In der Pasta, die auf einem Tisch vor einer Tür Form annimmt.

In der Focaccia, die nicht auf die Mittagsstunde wartet.

Im Gebratenen, das aus einer Papiertüte gegessen wird.

In der Backform, die jeder auf seine Art verteidigt.

Im Panzerotto, der dich zwingt zu warten.

In dem neuen Gericht, das eine Stadt aufnimmt, weil sie ihren eigenen Charakter darin erkennt.

<break time="0.8s"/>

Am Anfang hatte ich dir gesagt, dass ich keine Liste von Dingen zum Essen machen würde.

Jetzt kennst du die Liste trotzdem.

<break time="0.5s"/>

Aber vielleicht, wenn du nach dieser Geschichte etwas probierst, wirst du es anders tun.

Du wirst nicht nur denken: es ist gut.

Du wirst daran denken, wo du bist.

<break time="0.5s"/>

In einer Stadt, in der das Essen nicht in Restaurants eingeschlossen ist und nicht nur dazu dient, einen Reisetag zu füllen.

Hier bewegt sich das Essen.

Vom Meer zur Straße.

Von der Straße zum Haus.

Vom Haus wieder hinaus, zu den Menschen.

<break time="0.7s"/>

Deshalb ist Essen in Bari nie nur Essen.

Es ist einer der einfachsten Wege, den die Stadt gefunden hat, um nicht allein zu bleiben.""",
}


def generate_chapter(filename: str, text: str):
    out_path = OUTPUT_DIR / filename
    if out_path.exists():
        print(f"SKIP {filename} (gia esistente)")
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
        print(f"ERRORE {filename}: {resp.status_code} -- {resp.text}")
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
    print("Fatto. File pronti per revisione — NON caricare su R2 prima del missaggio finale.")


if __name__ == "__main__":
    main()
